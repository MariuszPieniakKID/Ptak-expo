const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Helper function to generate and hash password
async function generateAndHashPassword() {
  const newPassword = Math.random().toString(36).slice(-8) + 
                     Math.random().toString(36).slice(-4).toUpperCase() + 
                     Math.floor(Math.random() * 10);
  
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);
  
  return { newPassword, passwordHash };
}

// GET /api/v1/password-reset/food-tech/preview
// Preview exhibitors that would receive password reset
router.get('/food-tech/preview', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('📋 Previewing FOOD TECH EXPO exhibitors...');
    
    // Find FOOD TECH EXPO
    const exhibitionResult = await db.query(`
      SELECT id, name, start_date, end_date, status
      FROM exhibitions
      WHERE UPPER(name) LIKE '%FOOD TECH%'
      ORDER BY start_date DESC
      LIMIT 1
    `);
    
    if (exhibitionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'FOOD TECH EXPO exhibition not found'
      });
    }
    
    const exhibition = exhibitionResult.rows[0];
    
    // Get exhibitors
    const exhibitorsResult = await db.query(`
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
    
    const hasPieniak = exhibitorsResult.rows.some(
      e => e.email.toLowerCase() === 'pieniak@gmail.com'
    );
    
    return res.json({
      success: true,
      exhibition: {
        id: exhibition.id,
        name: exhibition.name,
        startDate: exhibition.start_date,
        endDate: exhibition.end_date,
        status: exhibition.status
      },
      exhibitors: exhibitorsResult.rows,
      totalCount: exhibitorsResult.rows.length,
      verification: {
        pieniakFound: hasPieniak,
        message: hasPieniak 
          ? '✅ pieniak@gmail.com is on the list' 
          : '⚠️ pieniak@gmail.com NOT found'
      }
    });
    
  } catch (error) {
    console.error('Error previewing exhibitors:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching exhibitors',
      error: error.message
    });
  }
});

// POST /api/v1/password-reset/food-tech/send-test
// Send password reset to pieniak@gmail.com only (test)
router.post('/food-tech/send-test', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('🧪 TEST: Sending password reset to pieniak@gmail.com...');
    
    // Find FOOD TECH EXPO
    const exhibitionResult = await db.query(`
      SELECT id, name
      FROM exhibitions
      WHERE UPPER(name) LIKE '%FOOD TECH%'
      ORDER BY start_date DESC
      LIMIT 1
    `);
    
    if (exhibitionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'FOOD TECH EXPO exhibition not found'
      });
    }
    
    const exhibition = exhibitionResult.rows[0];
    
    // Get pieniak@gmail.com exhibitor
    const exhibitorResult = await db.query(`
      SELECT DISTINCT
        e.id,
        e.email,
        e.company_name,
        e.contact_person,
        e.status
      FROM exhibitors e
      INNER JOIN exhibitor_events ee ON e.id = ee.exhibitor_id
      WHERE ee.exhibition_id = $1
        AND LOWER(e.email) = 'pieniak@gmail.com'
    `, [exhibition.id]);
    
    if (exhibitorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'pieniak@gmail.com not found in FOOD TECH EXPO exhibitors'
      });
    }
    
    const exhibitor = exhibitorResult.rows[0];
    
    // Generate new password
    const { newPassword, passwordHash } = await generateAndHashPassword();
    
    // Update password in database
    await db.query(
      'UPDATE exhibitors SET password_hash = $1 WHERE id = $2',
      [passwordHash, exhibitor.id]
    );
    
    // Parse exhibitor name
    const contact = String(exhibitor.contact_person || '').trim();
    const [firstName, ...rest] = contact.split(' ').filter(Boolean);
    const lastName = rest.join(' ');
    
    // Send email
    const loginUrl = process.env.FRONTEND_WEB_URL 
      ? `${process.env.FRONTEND_WEB_URL}/login`
      : 'https://wystawca.exhibitorlist.eu/login';
    
    const emailResult = await sendPasswordResetEmail(
      exhibitor.email,
      firstName || exhibitor.company_name || 'Wystawca',
      lastName || '',
      newPassword,
      loginUrl
    );
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Password updated but email failed to send',
        error: emailResult.error,
        exhibitor: {
          email: exhibitor.email,
          companyName: exhibitor.company_name
        }
      });
    }
    
    console.log(`✅ TEST: Password reset sent to ${exhibitor.email}`);
    
    return res.json({
      success: true,
      message: 'Test password reset sent successfully',
      exhibitor: {
        email: exhibitor.email,
        companyName: exhibitor.company_name
      }
    });
    
  } catch (error) {
    console.error('Error sending test password reset:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending test password reset',
      error: error.message
    });
  }
});

// POST /api/v1/password-reset/food-tech/send-all
// Send password reset to ALL FOOD TECH EXPO exhibitors
router.post('/food-tech/send-all', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('🚀 SENDING password reset to ALL FOOD TECH EXPO exhibitors...');
    
    // Find FOOD TECH EXPO
    const exhibitionResult = await db.query(`
      SELECT id, name
      FROM exhibitions
      WHERE UPPER(name) LIKE '%FOOD TECH%'
      ORDER BY start_date DESC
      LIMIT 1
    `);
    
    if (exhibitionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'FOOD TECH EXPO exhibition not found'
      });
    }
    
    const exhibition = exhibitionResult.rows[0];
    
    // Get all exhibitors
    const exhibitorsResult = await db.query(`
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
    
    const exhibitors = exhibitorsResult.rows;
    const results = {
      success: [],
      failed: []
    };
    
    console.log(`Processing ${exhibitors.length} exhibitors...`);
    
    for (const exhibitor of exhibitors) {
      try {
        // Generate new password
        const { newPassword, passwordHash } = await generateAndHashPassword();
        
        // Update password in database
        await db.query(
          'UPDATE exhibitors SET password_hash = $1 WHERE id = $2',
          [passwordHash, exhibitor.id]
        );
        
        // Parse exhibitor name
        const contact = String(exhibitor.contact_person || '').trim();
        const [firstName, ...rest] = contact.split(' ').filter(Boolean);
        const lastName = rest.join(' ');
        
        // Send email
        const loginUrl = process.env.FRONTEND_WEB_URL 
          ? `${process.env.FRONTEND_WEB_URL}/login`
          : 'https://wystawca.exhibitorlist.eu/login';
        
        const emailResult = await sendPasswordResetEmail(
          exhibitor.email,
          firstName || exhibitor.company_name || 'Wystawca',
          lastName || '',
          newPassword,
          loginUrl
        );
        
        if (emailResult.success) {
          console.log(`✅ Sent to: ${exhibitor.email}`);
          results.success.push({
            email: exhibitor.email,
            companyName: exhibitor.company_name
          });
        } else {
          console.log(`❌ Failed: ${exhibitor.email}`);
          results.failed.push({
            email: exhibitor.email,
            companyName: exhibitor.company_name,
            error: emailResult.error
          });
        }
        
        // Wait 500ms between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error processing ${exhibitor.email}:`, error);
        results.failed.push({
          email: exhibitor.email,
          companyName: exhibitor.company_name,
          error: error.message
        });
      }
    }
    
    console.log(`\n✅ DONE: ${results.success.length} success, ${results.failed.length} failed`);
    
    return res.json({
      success: true,
      message: 'Password reset process completed',
      summary: {
        total: exhibitors.length,
        successful: results.success.length,
        failed: results.failed.length
      },
      results: results
    });
    
  } catch (error) {
    console.error('Error sending password resets:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending password resets',
      error: error.message
    });
  }
});

// ============================================================================
// BioExpo & GlobalFood Password Reset Endpoints
// ============================================================================

// GET /api/v1/password-reset/bioexpo-globalfood/preview
// Preview exhibitors that would receive password reset for BioExpo and GlobalFood
router.get('/bioexpo-globalfood/preview', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('📋 Previewing BioExpo & GlobalFood exhibitors...');
    
    // Find BioExpo and GlobalFood exhibitions
    const exhibitionResult = await db.query(`
      SELECT id, name, start_date, end_date, status
      FROM exhibitions
      WHERE UPPER(name) LIKE '%BIOEXPO%' 
         OR UPPER(name) LIKE '%GLOBALFOOD%' 
         OR UPPER(name) LIKE '%GLOBAL FOOD%'
      ORDER BY name, start_date DESC
    `);
    
    if (exhibitionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'BioExpo or GlobalFood exhibitions not found'
      });
    }
    
    const exhibitions = exhibitionResult.rows;
    const exhibitionIds = exhibitions.map(ex => ex.id);
    
    // Get exhibitors for all these exhibitions
    const exhibitorsResult = await db.query(`
      SELECT DISTINCT
        e.id,
        e.email,
        e.company_name,
        e.contact_person,
        e.status,
        array_agg(DISTINCT ex.name) as exhibition_names
      FROM exhibitors e
      INNER JOIN exhibitor_events ee ON e.id = ee.exhibitor_id
      INNER JOIN exhibitions ex ON ee.exhibition_id = ex.id
      WHERE ee.exhibition_id = ANY($1)
        AND e.email IS NOT NULL
        AND e.email != ''
      GROUP BY e.id, e.email, e.company_name, e.contact_person, e.status
      ORDER BY e.company_name
    `, [exhibitionIds]);
    
    const hasPieniak = exhibitorsResult.rows.some(
      e => e.email.toLowerCase() === 'pieniak@gmail.com'
    );
    
    return res.json({
      success: true,
      exhibitions: exhibitions.map(ex => ({
        id: ex.id,
        name: ex.name,
        startDate: ex.start_date,
        endDate: ex.end_date,
        status: ex.status
      })),
      exhibitors: exhibitorsResult.rows,
      totalCount: exhibitorsResult.rows.length,
      verification: {
        pieniakFound: hasPieniak,
        message: hasPieniak 
          ? '✅ pieniak@gmail.com is on the list' 
          : '⚠️ pieniak@gmail.com NOT found'
      }
    });
    
  } catch (error) {
    console.error('Error previewing exhibitors:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching exhibitors',
      error: error.message
    });
  }
});

// POST /api/v1/password-reset/bioexpo-globalfood/send-test
// Send password reset to pieniak@gmail.com only (test)
router.post('/bioexpo-globalfood/send-test', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('🧪 TEST: Sending password reset to pieniak@gmail.com for BioExpo/GlobalFood...');
    
    // Find exhibitions
    const exhibitionResult = await db.query(`
      SELECT id, name
      FROM exhibitions
      WHERE UPPER(name) LIKE '%BIOEXPO%' 
         OR UPPER(name) LIKE '%GLOBALFOOD%' 
         OR UPPER(name) LIKE '%GLOBAL FOOD%'
      ORDER BY name, start_date DESC
    `);
    
    if (exhibitionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'BioExpo or GlobalFood exhibitions not found'
      });
    }
    
    const exhibitions = exhibitionResult.rows;
    const exhibitionIds = exhibitions.map(ex => ex.id);
    
    // Get pieniak@gmail.com exhibitor
    const exhibitorResult = await db.query(`
      SELECT DISTINCT
        e.id,
        e.email,
        e.company_name,
        e.contact_person,
        e.status
      FROM exhibitors e
      INNER JOIN exhibitor_events ee ON e.id = ee.exhibitor_id
      WHERE ee.exhibition_id = ANY($1)
        AND LOWER(e.email) = 'pieniak@gmail.com'
    `, [exhibitionIds]);
    
    if (exhibitorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'pieniak@gmail.com not found in BioExpo/GlobalFood exhibitors'
      });
    }
    
    const exhibitor = exhibitorResult.rows[0];
    
    // Generate new password
    const { newPassword, passwordHash } = await generateAndHashPassword();
    
    // Update password in database
    await db.query(
      'UPDATE exhibitors SET password_hash = $1 WHERE id = $2',
      [passwordHash, exhibitor.id]
    );
    
    // Parse exhibitor name
    const contact = String(exhibitor.contact_person || '').trim();
    const [firstName, ...rest] = contact.split(' ').filter(Boolean);
    const lastName = rest.join(' ');
    
    // Send email
    const loginUrl = process.env.FRONTEND_WEB_URL 
      ? `${process.env.FRONTEND_WEB_URL}/login`
      : 'https://wystawca.exhibitorlist.eu/login';
    
    const emailResult = await sendPasswordResetEmail(
      exhibitor.email,
      firstName || exhibitor.company_name || 'Wystawca',
      lastName || '',
      newPassword,
      loginUrl
    );
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Password updated but email failed to send',
        error: emailResult.error,
        exhibitor: {
          email: exhibitor.email,
          companyName: exhibitor.company_name
        }
      });
    }
    
    console.log(`✅ TEST: Password reset sent to ${exhibitor.email}`);
    
    return res.json({
      success: true,
      message: 'Test password reset sent successfully',
      exhibitor: {
        email: exhibitor.email,
        companyName: exhibitor.company_name
      }
    });
    
  } catch (error) {
    console.error('Error sending test password reset:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending test password reset',
      error: error.message
    });
  }
});

// POST /api/v1/password-reset/bioexpo-globalfood/send-all
// Send password reset to ALL BioExpo & GlobalFood exhibitors
router.post('/bioexpo-globalfood/send-all', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('🚀 SENDING password reset to ALL BioExpo & GlobalFood exhibitors...');
    
    // Find exhibitions
    const exhibitionResult = await db.query(`
      SELECT id, name
      FROM exhibitions
      WHERE UPPER(name) LIKE '%BIOEXPO%' 
         OR UPPER(name) LIKE '%GLOBALFOOD%' 
         OR UPPER(name) LIKE '%GLOBAL FOOD%'
      ORDER BY name, start_date DESC
    `);
    
    if (exhibitionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'BioExpo or GlobalFood exhibitions not found'
      });
    }
    
    const exhibitions = exhibitionResult.rows;
    const exhibitionIds = exhibitions.map(ex => ex.id);
    const exhibitionNames = exhibitions.map(ex => ex.name).join(', ');
    
    console.log(`Target exhibitions: ${exhibitionNames}`);
    
    // Get all exhibitors
    const exhibitorsResult = await db.query(`
      SELECT DISTINCT
        e.id,
        e.email,
        e.company_name,
        e.contact_person,
        e.status
      FROM exhibitors e
      INNER JOIN exhibitor_events ee ON e.id = ee.exhibitor_id
      WHERE ee.exhibition_id = ANY($1)
        AND e.email IS NOT NULL
        AND e.email != ''
      ORDER BY e.company_name
    `, [exhibitionIds]);
    
    const exhibitors = exhibitorsResult.rows;
    const results = {
      success: [],
      failed: []
    };
    
    console.log(`Processing ${exhibitors.length} exhibitors from ${exhibitionNames}...`);
    
    for (const exhibitor of exhibitors) {
      try {
        // Generate new password
        const { newPassword, passwordHash } = await generateAndHashPassword();
        
        // Update password in database
        await db.query(
          'UPDATE exhibitors SET password_hash = $1 WHERE id = $2',
          [passwordHash, exhibitor.id]
        );
        
        // Parse exhibitor name
        const contact = String(exhibitor.contact_person || '').trim();
        const [firstName, ...rest] = contact.split(' ').filter(Boolean);
        const lastName = rest.join(' ');
        
        // Send email
        const loginUrl = process.env.FRONTEND_WEB_URL 
          ? `${process.env.FRONTEND_WEB_URL}/login`
          : 'https://wystawca.exhibitorlist.eu/login';
        
        const emailResult = await sendPasswordResetEmail(
          exhibitor.email,
          firstName || exhibitor.company_name || 'Wystawca',
          lastName || '',
          newPassword,
          loginUrl
        );
        
        if (emailResult.success) {
          console.log(`✅ Sent to: ${exhibitor.email}`);
          results.success.push({
            email: exhibitor.email,
            companyName: exhibitor.company_name
          });
        } else {
          console.log(`❌ Failed: ${exhibitor.email}`);
          results.failed.push({
            email: exhibitor.email,
            companyName: exhibitor.company_name,
            error: emailResult.error
          });
        }
        
        // Wait 500ms between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error processing ${exhibitor.email}:`, error);
        results.failed.push({
          email: exhibitor.email,
          companyName: exhibitor.company_name,
          error: error.message
        });
      }
    }
    
    console.log(`\n✅ DONE: ${results.success.length} success, ${results.failed.length} failed`);
    
    return res.json({
      success: true,
      message: 'Password reset process completed',
      exhibitions: exhibitionNames,
      summary: {
        total: exhibitors.length,
        successful: results.success.length,
        failed: results.failed.length
      },
      results: results
    });
    
  } catch (error) {
    console.error('Error sending password resets:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending password resets',
      error: error.message
    });
  }
});

module.exports = router;

