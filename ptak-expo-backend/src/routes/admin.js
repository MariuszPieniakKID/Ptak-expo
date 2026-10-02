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

// GET /api/v1/admin/hubspot-sync/dictionary - słownik targów HubSpot -> wydarzenia (admin only)
router.get('/hubspot-sync/dictionary', verifyToken, requireAdmin, async (req, res) => {
  try {
    const db = require('../config/database');
    const { rows: entries } = await db.query(
      `SELECT d.id, d.hs_value, d.hs_label, d.hs_hidden, d.removed_in_hs, d.exhibition_id, d.source,
              d.updated_by, d.updated_at, d.first_seen_at, e.name AS exhibition_name, e.start_date AS exhibition_start_date
       FROM hubspot_event_dictionary d
       LEFT JOIN exhibitions e ON e.id = d.exhibition_id
       ORDER BY d.first_seen_at DESC, d.hs_label`
    );
    const { rows: exhibitions } = await db.query(
      `SELECT e.id, e.name, e.start_date, e.end_date,
              EXISTS (SELECT 1 FROM exhibitor_events ee WHERE ee.exhibition_id = e.id) AS has_exhibitors
       FROM exhibitions e ORDER BY e.start_date DESC NULLS LAST, e.name`
    );
    return res.json({ success: true, entries, exhibitions });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/admin/hubspot-sync/dictionary/refresh - pobranie nowych targów z HubSpot (admin only)
router.post('/hubspot-sync/dictionary/refresh', verifyToken, requireAdmin, async (req, res) => {
  const sync = require('../services/hubspotStandSync');
  if (!sync.isEnabled()) return res.status(400).json({ success: false, error: 'Synchronizacja z HubSpot jest wyłączona' });
  try {
    const result = await sync.refreshDictionary();
    if (result.autoAssigned) sync.requestFullSync();
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/v1/admin/hubspot-sync/dictionary/:id - przypisanie targów HubSpot do wydarzenia (admin only)
router.put('/hubspot-sync/dictionary/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const db = require('../config/database');
    const sync = require('../services/hubspotStandSync');
    const raw = req.body ? req.body.exhibitionId : undefined;
    const exhibitionId = raw === null || raw === '' || raw === undefined ? null : parseInt(raw, 10);
    if (exhibitionId !== null && !Number.isInteger(exhibitionId)) {
      return res.status(400).json({ success: false, error: 'Nieprawidłowe wydarzenie' });
    }
    if (exhibitionId !== null) {
      const { rows } = await db.query('SELECT 1 FROM exhibitions WHERE id = $1', [exhibitionId]);
      if (!rows.length) return res.status(404).json({ success: false, error: 'Wydarzenie nie istnieje' });
    }
    const { rows: [entry] } = await db.query(
      `UPDATE hubspot_event_dictionary
       SET exhibition_id = $2, source = 'manual', updated_by = $3, updated_at = NOW()
       WHERE id = $1 RETURNING id, exhibition_id`,
      [parseInt(req.params.id, 10), exhibitionId, req.user && req.user.email ? req.user.email : null]
    );
    if (!entry) return res.status(404).json({ success: false, error: 'Nie znaleziono pozycji słownika' });
    const syncStarted = sync.requestFullSync();
    return res.json({ success: true, entry, syncStarted });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;


