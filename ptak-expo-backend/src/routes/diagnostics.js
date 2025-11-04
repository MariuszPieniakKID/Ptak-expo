const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * TEMPORARY DIAGNOSTIC ENDPOINT
 * GET /api/v1/diagnostics/invitations/exhibition/:exhibitionId
 * Check invitation_recipients state for debugging
 */
router.get('/invitations/exhibition/:exhibitionId', async (req, res) => {
  try {
    const { exhibitionId } = req.params;

    // Check if access_code column exists
    const columnCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invitation_recipients' AND column_name = 'access_code'
    `);
    
    const hasAccessCodeColumn = columnCheck.rows.length > 0;

    // Get all invitations for this exhibition
    const invitations = await db.query(`
      SELECT 
        r.id,
        r.recipient_name,
        r.recipient_email,
        r.exhibitor_id,
        r.exhibition_id,
        r.access_code,
        r.sent_at,
        e.company_name,
        e.nip,
        ex.name as exhibition_name
      FROM invitation_recipients r
      LEFT JOIN exhibitors e ON r.exhibitor_id = e.id
      LEFT JOIN exhibitions ex ON r.exhibition_id = ex.id
      WHERE r.exhibition_id = $1
      ORDER BY r.exhibitor_id, r.sent_at DESC
    `, [exhibitionId]);

    // Group by exhibitor
    const byExhibitor = {};
    let withCode = 0;
    let withoutCode = 0;

    for (const inv of invitations.rows) {
      const exhId = inv.exhibitor_id || 'NULL';
      if (!byExhibitor[exhId]) {
        byExhibitor[exhId] = {
          company_name: inv.company_name,
          exhibitor_id: inv.exhibitor_id,
          nip: inv.nip,
          invitations: []
        };
      }
      byExhibitor[exhId].invitations.push({
        id: inv.id,
        recipient_name: inv.recipient_name,
        recipient_email: inv.recipient_email,
        access_code: inv.access_code,
        sent_at: inv.sent_at
      });
      
      if (inv.access_code) {
        withCode++;
      } else {
        withoutCode++;
      }
    }

    res.json({
      success: true,
      data: {
        exhibition_id: parseInt(exhibitionId, 10),
        exhibition_name: invitations.rows[0]?.exhibition_name || null,
        has_access_code_column: hasAccessCodeColumn,
        summary: {
          total_invitations: invitations.rows.length,
          with_access_code: withCode,
          without_access_code: withoutCode,
          exhibitor_count: Object.keys(byExhibitor).length
        },
        by_exhibitor: byExhibitor
      }
    });

  } catch (error) {
    console.error('[diagnostics] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch diagnostics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * TEMPORARY DIAGNOSTIC ENDPOINT
 * GET /api/v1/diagnostics/exhibitor/:exhibitorId
 * Check if exhibitor exists and has data for exhibition
 */
router.get('/exhibitor/:exhibitorId', async (req, res) => {
  try {
    const { exhibitorId } = req.params;

    // Check if exhibitor exists
    const exhibitor = await db.query(`
      SELECT id, company_name, nip, email, status, created_at
      FROM exhibitors
      WHERE id = $1
    `, [exhibitorId]);

    if (exhibitor.rows.length === 0) {
      return res.json({
        success: true,
        exists: false,
        exhibitor_id: parseInt(exhibitorId, 10),
        message: 'Exhibitor not found'
      });
    }

    // Get exhibitions this exhibitor is registered for
    const exhibitions = await db.query(`
      SELECT 
        ex.id,
        ex.name,
        ex.start_date,
        ex.end_date,
        ex.status,
        ee.hall_name,
        ee.stand_number
      FROM exhibitor_events ee
      JOIN exhibitions ex ON ee.exhibition_id = ex.id
      WHERE ee.exhibitor_id = $1
      ORDER BY ex.start_date DESC
    `, [exhibitorId]);

    // Get QR codes (exhibitor_people) for this exhibitor
    const qrCodes = await db.query(`
      SELECT 
        p.id,
        p.full_name,
        p.position,
        p.email,
        p.access_code,
        p.exhibition_id,
        ex.name as exhibition_name,
        p.created_at
      FROM exhibitor_people p
      LEFT JOIN exhibitions ex ON p.exhibition_id = ex.id
      WHERE p.exhibitor_id = $1
      ORDER BY p.created_at DESC
    `, [exhibitorId]);

    // Get invitations for this exhibitor
    const invitations = await db.query(`
      SELECT 
        r.id,
        r.recipient_name,
        r.recipient_email,
        r.access_code,
        r.exhibition_id,
        ex.name as exhibition_name,
        r.sent_at
      FROM invitation_recipients r
      LEFT JOIN exhibitions ex ON r.exhibition_id = ex.id
      WHERE r.exhibitor_id = $1
      ORDER BY r.sent_at DESC
    `, [exhibitorId]);

    res.json({
      success: true,
      exists: true,
      exhibitor: exhibitor.rows[0],
      exhibitions: exhibitions.rows,
      qr_codes_count: qrCodes.rows.length,
      qr_codes: qrCodes.rows,
      invitations_count: invitations.rows.length,
      invitations: invitations.rows
    });

  } catch (error) {
    console.error('[diagnostics] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exhibitor diagnostics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * TEMPORARY DIAGNOSTIC ENDPOINT
 * POST /api/v1/diagnostics/regenerate-access-codes
 * Generate missing access_code for all exhibitor_people records
 */
router.post('/regenerate-access-codes', async (req, res) => {
  try {
    console.log('[diagnostics] Starting access_code regeneration...');

    // Find all records without access_code
    const missingCodes = await db.query(`
      SELECT 
        p.id,
        p.exhibitor_id,
        p.exhibition_id,
        p.full_name,
        e.company_name,
        ex.name as exhibition_name
      FROM exhibitor_people p
      LEFT JOIN exhibitors e ON p.exhibitor_id = e.id
      LEFT JOIN exhibitions ex ON p.exhibition_id = ex.id
      WHERE p.access_code IS NULL
      ORDER BY p.exhibition_id, p.exhibitor_id, p.id
    `);

    console.log(`[diagnostics] Found ${missingCodes.rows.length} records without access_code`);

    if (missingCodes.rows.length === 0) {
      return res.json({
        success: true,
        message: 'All records already have access_code',
        updated: 0,
        errors: 0
      });
    }

    let updated = 0;
    let errors = 0;
    const results = [];

    for (const person of missingCodes.rows) {
      try {
        const exhibitionId = person.exhibition_id;
        const exhibitorId = person.exhibitor_id;
        const exhibitionName = person.exhibition_name || '';

        if (!exhibitionId) {
          console.warn(`[diagnostics] Skipping ID ${person.id}: no exhibition_id`);
          errors++;
          continue;
        }

        // Generate access_code using the same algorithm
        const eventCode = String(exhibitionName).replace(/\s+/g, ' ').trim();
        const eventIdPadded = String(exhibitionId).padStart(4, '0').slice(-4);
        const exhibitorIdPadded = 'w' + String(exhibitorId || 0).padStart(3, '0').slice(-3);
        
        const entryId = (() => {
          const ts = Date.now().toString().slice(-6);
          const rnd = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
          return ts.slice(0, 3) + rnd.slice(0, 3) + ts.slice(3);
        })();
        
        const rndSuffix = 'rnd' + Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
        const generatedAccessCode = `${eventCode}${eventIdPadded}${exhibitorIdPadded}${entryId}${rndSuffix}${entryId}`;

        // Update the record
        await db.query(
          `UPDATE exhibitor_people SET access_code = $1 WHERE id = $2`,
          [generatedAccessCode, person.id]
        );

        updated++;
        results.push({
          id: person.id,
          full_name: person.full_name,
          exhibition_name: exhibitionName,
          company_name: person.company_name,
          access_code: generatedAccessCode
        });

        console.log(`[diagnostics] ✅ Generated code for ${person.full_name} (ID: ${person.id})`);

      } catch (e) {
        console.error(`[diagnostics] Error for record ${person.id}:`, e?.message || e);
        errors++;
      }
    }

    console.log(`[diagnostics] Regeneration complete: ${updated} updated, ${errors} errors`);

    res.json({
      success: true,
      message: `Successfully generated ${updated} access codes`,
      updated,
      errors,
      total: missingCodes.rows.length,
      results: results.slice(0, 10) // Return first 10 as sample
    });

  } catch (error) {
    console.error('[diagnostics] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate access codes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

