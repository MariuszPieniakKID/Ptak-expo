const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

// POST /api/v1/admin/test-email - send a test email via configured SMTP (admin only)
router.post('/test-email', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { to, subject, text, html } = req.body || {};
    if (!to) {
      return res.status(400).json({ success: false, error: 'Parametr "to" jest wymagany' });
    }
    const result = await sendEmail({
      to,
      subject: subject || 'PTAK WARSAW EXPO - Test email',
      text: text || 'To jest testowa wiadomość wysłana z systemu PTAK WARSAW EXPO (SMTP Office365).',
      html:
        html ||
        '<p>To jest <strong>testowa wiadomość</strong> wysłana z systemu PTAK WARSAW EXPO (SMTP Office365).</p>',
    });
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }
    return res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/admin/hubspot-sync - stan synchronizacji stoisk z HubSpot (admin only)
router.get('/hubspot-sync', verifyToken, requireAdmin, async (req, res) => {
  try {
    const db = require('../config/database');
    const sync = require('../services/hubspotStandSync');
    const { rows: [lastRun] } = await db.query(
      `SELECT id, mode, started_at, finished_at, stats, error FROM hubspot_sync_runs ORDER BY started_at DESC LIMIT 1`
    );
    const { rows: [lastFull] } = await db.query(
      `SELECT id, started_at, finished_at, stats, problems FROM hubspot_sync_runs
       WHERE mode = 'full' AND finished_at IS NOT NULL AND error IS NULL ORDER BY started_at DESC LIMIT 1`
    );
    const { rows: changes } = await db.query(
      `SELECT c.created_at, c.hubspot_deal_id, c.old_hall, c.new_hall, c.old_stand, c.new_stand,
              c.exhibitor_id, x.company_name, e.name AS exhibition_name
       FROM hubspot_stand_changes c
       LEFT JOIN exhibitors x ON x.id = c.exhibitor_id
       LEFT JOIN exhibitions e ON e.id = c.exhibition_id
       ORDER BY c.created_at DESC LIMIT 300`
    );
    return res.json({ success: true, enabled: sync.isEnabled(), running: sync.isRunning(), lastRun: lastRun || null, lastFull: lastFull || null, changes });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/admin/hubspot-sync/run - pełna synchronizacja na żądanie (admin only)
router.post('/hubspot-sync/run', verifyToken, requireAdmin, async (req, res) => {
  const sync = require('../services/hubspotStandSync');
  if (!sync.isEnabled()) return res.status(400).json({ success: false, error: 'Synchronizacja z HubSpot jest wyłączona' });
  if (sync.isRunning()) return res.status(409).json({ success: false, error: 'Synchronizacja już trwa' });
  sync.runSync({ mode: 'full' }).catch(() => {});
  return res.status(202).json({ success: true, message: 'Uruchomiono pełną synchronizację' });
});

module.exports = router;


