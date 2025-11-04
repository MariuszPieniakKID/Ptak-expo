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

module.exports = router;

