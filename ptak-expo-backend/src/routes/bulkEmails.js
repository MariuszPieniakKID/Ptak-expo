const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { sendExhibitorWelcomeEmail } = require('../utils/emailService');
const { getNearestExhibitionForExhibitor, getDefaultExhibitionName } = require('../utils/exhibitorHelpers');

// POST /api/v1/bulk-emails/send-welcome-test - wysyła test do pieniak@gmail.com
router.post('/send-welcome-test', verifyToken, requireAdmin, async (req, res) => {
  const testEmail = 'pieniak@gmail.com';
  
  try {
    console.log(`🧪 Test wysyłki maila do ${testEmail}...`);
    
    // Znajdź wystawcę testowego
    const exhibitorResult = await db.query(
      'SELECT id, nip, company_name, contact_person, email FROM exhibitors WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [testEmail]
    );
    
    if (exhibitorResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: `Nie znaleziono wystawcy z emailem: ${testEmail}` 
      });
    }
    
    const exhibitor = exhibitorResult.rows[0];
    console.log(`✅ Znaleziono wystawcę: ${exhibitor.company_name}`);
    
    
    // Pobierz najbliższą wystawę dla wystawcy
    const exhibition = await getNearestExhibitionForExhibitor(exhibitor.id);
    const exhibitionName = exhibition ? exhibition.name : getDefaultExhibitionName();
    
    console.log(`📧 Wysyłam email do ${exhibitor.email} (wystawa: ${exhibitionName})...`);
    
    const emailResult = await sendExhibitorWelcomeEmail(exhibitor.email, exhibitionName);
    
    if (emailResult.success) {
      console.log(`✅ Email wysłany pomyślnie (${emailResult.method})`);
      return res.json({
        success: true,
        message: 'Email testowy wysłany pomyślnie',
        data: {
          email: exhibitor.email,
          company: exhibitor.company_name,
          method: emailResult.method
        }
      });
    } else {
      console.log(`❌ Błąd wysyłania: ${emailResult.error}`);
      return res.status(500).json({
        success: false,
        message: 'Błąd podczas wysyłania emaila',
        error: emailResult.error
      });
    }
    
  } catch (error) {
    console.error('❌ Błąd:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera',
      error: error.message
    });
  }
});

// POST /api/v1/bulk-emails/send-welcome-all - wysyła do wszystkich wystawców
router.post('/send-welcome-all', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('🚀 Rozpoczynam wysyłkę do wszystkich wystawców...');
    
    // Pobierz wszystkich aktywnych wystawców
    const result = await db.query(
      `SELECT id, nip, company_name, contact_person, email, status 
       FROM exhibitors 
       WHERE status = 'active' AND email IS NOT NULL AND email != ''
       ORDER BY company_name`
    );
    
    console.log(`✅ Znaleziono ${result.rows.length} aktywnych wystawców`);
    
    let successCount = 0;
    let failCount = 0;
    const failed = [];
    const successful = [];
    
    for (let i = 0; i < result.rows.length; i++) {
      const exhibitor = result.rows[i];
      const progress = `[${i + 1}/${result.rows.length}]`;
      
      console.log(`${progress} ${exhibitor.company_name} (${exhibitor.email})`);
      
      try {
        // Pobierz najbliższą wystawę dla wystawcy
        const exhibition = await getNearestExhibitionForExhibitor(exhibitor.id);
        const exhibitionName = exhibition ? exhibition.name : getDefaultExhibitionName();
        
        const emailResult = await sendExhibitorWelcomeEmail(exhibitor.email, exhibitionName);
        
        if (emailResult.success) {
          console.log(`   ✅ Wysłano (${emailResult.method})`);
          successCount++;
          successful.push({
            email: exhibitor.email,
            company: exhibitor.company_name
          });
        } else {
          console.log(`   ❌ Błąd: ${emailResult.error}`);
          failCount++;
          failed.push({ 
            email: exhibitor.email, 
            company: exhibitor.company_name, 
            error: emailResult.error 
          });
        }
        
        // Małe opóźnienie aby nie przeciążyć serwera email
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ Błąd: ${error.message}`);
        failCount++;
        failed.push({ 
          email: exhibitor.email, 
          company: exhibitor.company_name, 
          error: error.message 
        });
      }
    }
    
    console.log('='.repeat(60));
    console.log('📊 PODSUMOWANIE WYSYŁKI');
    console.log(`Wysłano pomyślnie: ${successCount}`);
    console.log(`Błędy: ${failCount}`);
    console.log(`Łącznie: ${result.rows.length}`);
    
    return res.json({
      success: true,
      message: `Wysłano ${successCount} emaili, ${failCount} błędów`,
      data: {
        total: result.rows.length,
        success: successCount,
        failed: failCount,
        failedEmails: failed,
      }
    });
    
  } catch (error) {
    console.error('❌ Błąd:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera',
      error: error.message
    });
  }
});

// In-memory store for background welcome-email jobs (single backend instance).
// Sending hundreds of emails synchronously exceeds the Railway gateway timeout (=> 502),
// so we process in the background and expose progress via a status endpoint.
const welcomeEmailJobs = new Map();

const cleanupOldWelcomeJobs = () => {
  const now = Date.now();
  for (const [id, job] of welcomeEmailJobs.entries()) {
    // Drop finished jobs after 2h and stale running jobs after 6h
    const finishedTooOld = job.finishedAt && (now - job.finishedAt > 2 * 60 * 60 * 1000);
    const runningTooOld = !job.finishedAt && (now - job.startedAt > 6 * 60 * 60 * 1000);
    if (finishedTooOld || runningTooOld) {
      welcomeEmailJobs.delete(id);
    }
  }
};

// Background processor: sends welcome emails and updates job progress.
const processWelcomeEmailsJob = async (jobId, exhibition, exhibitors) => {
  const job = welcomeEmailJobs.get(jobId);
  if (!job) return;

  for (let i = 0; i < exhibitors.length; i++) {
    const exhibitor = exhibitors[i];
    job.processed = i + 1;
    console.log(`[${i + 1}/${exhibitors.length}] ${exhibitor.company_name} (${exhibitor.email})`);

    try {
      const emailResult = await sendExhibitorWelcomeEmail(exhibitor.email, exhibition.name);

      if (emailResult.success) {
        console.log(`   ✅ Wysłano (${emailResult.method})`);
        job.success++;
        job.successfulEmails.push({
          email: exhibitor.email,
          company: exhibitor.company_name
        });
      } else {
        console.log(`   ❌ Błąd: ${emailResult.error}`);
        job.failed++;
        job.failedEmails.push({
          email: exhibitor.email,
          company: exhibitor.company_name,
          error: emailResult.error
        });
      }

      // Małe opóźnienie aby nie przeciążyć serwera email
      await new Promise(resolve => setTimeout(resolve, 400));
    } catch (error) {
      console.log(`   ❌ Błąd: ${error.message}`);
      job.failed++;
      job.failedEmails.push({
        email: exhibitor.email,
        company: exhibitor.company_name,
        error: error.message
      });
    }
  }

  job.status = 'completed';
  job.finishedAt = Date.now();
  console.log('='.repeat(60));
  console.log(`📊 PODSUMOWANIE WYSYŁKI – ${exhibition.name}: ✅ ${job.success}, ❌ ${job.failed}, Łącznie ${job.total}`);
};

// POST /api/v1/bulk-emails/send-welcome-by-exhibition - startuje wysyłkę w tle, zwraca jobId
router.post('/send-welcome-by-exhibition', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { exhibitionId, exhibitionName } = req.body;

    if (!exhibitionId && !exhibitionName) {
      return res.status(400).json({
        success: false,
        message: 'Podaj exhibitionId lub exhibitionName'
      });
    }

    // Znajdź wystawę
    let exhibition;
    if (exhibitionId) {
      const exhibitionResult = await db.query(
        'SELECT id, name, start_date, end_date, status FROM exhibitions WHERE id = $1',
        [exhibitionId]
      );
      exhibition = exhibitionResult.rows[0];
    } else {
      const exhibitionResult = await db.query(
        'SELECT id, name, start_date, end_date, status FROM exhibitions WHERE UPPER(name) LIKE UPPER($1) ORDER BY start_date DESC LIMIT 1',
        [`%${exhibitionName}%`]
      );
      exhibition = exhibitionResult.rows[0];
    }

    if (!exhibition) {
      return res.status(404).json({
        success: false,
        message: `Nie znaleziono wystawy: ${exhibitionName || exhibitionId}`
      });
    }

    console.log(`🎯 Wystawa: ${exhibition.name} (ID: ${exhibition.id})`);

    // Pobierz wystawców przypisanych do tej wystawy
    const result = await db.query(`
      SELECT DISTINCT
        e.id,
        e.email,
        e.company_name,
        e.contact_person,
        e.status
      FROM exhibitors e
      INNER JOIN exhibitor_events ee ON e.id = ee.exhibitor_id
      WHERE ee.exhibition_id = $1
        AND e.email IS NOT NULL
        AND e.email != ''
      ORDER BY e.company_name
    `, [exhibition.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Nie znaleziono wystawców przypisanych do wystawy: ${exhibition.name}`
      });
    }

    console.log(`✅ Znaleziono ${result.rows.length} wystawców przypisanych do wystawy "${exhibition.name}"`);

    cleanupOldWelcomeJobs();

    const jobId = `${exhibition.id}-${Date.now()}`;
    const job = {
      status: 'running',
      exhibition: {
        id: exhibition.id,
        name: exhibition.name,
        startDate: exhibition.start_date,
        endDate: exhibition.end_date
      },
      total: result.rows.length,
      processed: 0,
      success: 0,
      failed: 0,
      failedEmails: [],
      successfulEmails: [],
      startedAt: Date.now(),
      finishedAt: null
    };
    welcomeEmailJobs.set(jobId, job);

    // Uruchom przetwarzanie w tle (bez await) – natychmiast odpowiadamy klientowi
    processWelcomeEmailsJob(jobId, exhibition, result.rows).catch((err) => {
      console.error('❌ Błąd zadania wysyłki emaili:', err);
      const j = welcomeEmailJobs.get(jobId);
      if (j) {
        j.status = 'error';
        j.error = err.message;
        j.finishedAt = Date.now();
      }
    });

    return res.status(202).json({
      success: true,
      jobId,
      message: `Rozpoczęto wysyłkę emaili powitalnych do ${result.rows.length} wystawców wystawy "${exhibition.name}". Trwa w tle.`,
      data: {
        exhibition: job.exhibition,
        total: job.total
      }
    });

  } catch (error) {
    console.error('❌ Błąd:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera',
      error: error.message
    });
  }
});

// GET /api/v1/bulk-emails/send-welcome-status/:jobId - postęp i wynik wysyłki w tle
router.get('/send-welcome-status/:jobId', verifyToken, requireAdmin, (req, res) => {
  const job = welcomeEmailJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Zadanie nie zostało znalezione lub wygasło'
    });
  }

  return res.json({
    success: true,
    status: job.status,
    error: job.error || null,
    data: {
      exhibition: job.exhibition,
      total: job.total,
      processed: job.processed,
      success: job.success,
      failed: job.failed,
      failedEmails: job.failedEmails,
      successfulEmails: job.successfulEmails
    }
  });
});

module.exports = router;

