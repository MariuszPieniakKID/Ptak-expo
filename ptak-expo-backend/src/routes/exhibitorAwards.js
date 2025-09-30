const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, requireExhibitorOrAdmin } = require('../middleware/auth');

// List messages (notes) for exhibitor+exhibition
router.get('/:exhibitorId/:exhibitionId/messages', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const { exhibitorId, exhibitionId } = req.params;
    const rows = await db.query(
      `CREATE TABLE IF NOT EXISTS exhibitor_award_messages (
         id SERIAL PRIMARY KEY,
         exhibitor_id INTEGER NOT NULL REFERENCES exhibitors(id) ON DELETE CASCADE,
         exhibition_id INTEGER NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
         message TEXT NOT NULL,
         created_at TIMESTAMPTZ DEFAULT NOW()
       );
       SELECT id, message, created_at
       FROM exhibitor_award_messages
       WHERE exhibitor_id = $1 AND exhibition_id = $2
       ORDER BY created_at DESC`,
      [exhibitorId, exhibitionId]
    );
    // If multiple statements not supported by client, split into two queries
    let data = rows.rows;
    if (!Array.isArray(data)) {
      await db.query(`CREATE TABLE IF NOT EXISTS exhibitor_award_messages (
         id SERIAL PRIMARY KEY,
         exhibitor_id INTEGER NOT NULL REFERENCES exhibitors(id) ON DELETE CASCADE,
         exhibition_id INTEGER NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
         message TEXT NOT NULL,
         created_at TIMESTAMPTZ DEFAULT NOW()
       );`);
      const q2 = await db.query(
        `SELECT id, message, created_at FROM exhibitor_award_messages WHERE exhibitor_id = $1 AND exhibition_id = $2 ORDER BY created_at DESC`,
        [exhibitorId, exhibitionId]
      );
      data = q2.rows;
    }
    return res.json({ success: true, data });
  } catch (e) {
    console.error('Error listing award messages:', e);
    return res.status(500).json({ success: false, message: 'Błąd podczas pobierania wiadomości' });
  }
});

// Add new message (note) for exhibitor+exhibition
router.post('/:exhibitorId/:exhibitionId/messages', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const { exhibitorId, exhibitionId } = req.params;
    const { message } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Wiadomość jest wymagana' });
    }
    await db.query(`CREATE TABLE IF NOT EXISTS exhibitor_award_messages (
      id SERIAL PRIMARY KEY,
      exhibitor_id INTEGER NOT NULL REFERENCES exhibitors(id) ON DELETE CASCADE,
      exhibition_id INTEGER NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`);
    const ins = await db.query(
      `INSERT INTO exhibitor_award_messages (exhibitor_id, exhibition_id, message)
       VALUES ($1, $2, $3)
       RETURNING id, message, created_at`,
      [exhibitorId, exhibitionId, String(message).trim()]
    );
    return res.json({ success: true, data: ins.rows[0] });
  } catch (e) {
    console.error('Error adding award message:', e);
    return res.status(500).json({ success: false, message: 'Błąd podczas zapisu wiadomości' });
  }
});
// GET current award application for exhibitor+exhibition
router.get('/:exhibitorId/:exhibitionId', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const { exhibitorId, exhibitionId } = req.params;

    // If not admin, ensure the requester is the same exhibitor or their supervisor
    if (req.user.role !== 'admin') {
      let selfExhibitorId = null;
      const meByEmail = await db.query('SELECT id FROM exhibitors WHERE email = $1 LIMIT 1', [req.user.email]);
      if (meByEmail.rows?.[0]?.id) {
        selfExhibitorId = meByEmail.rows[0].id;
      } else {
        const rel = await db.query('SELECT exhibitor_id FROM exhibitor_events WHERE supervisor_user_id = $1 LIMIT 1', [req.user.id]);
        selfExhibitorId = rel.rows?.[0]?.exhibitor_id ?? null;
      }
      if (String(selfExhibitorId) !== String(exhibitorId)) {
        return res.status(403).json({ success: false, message: 'Brak uprawnień' });
      }
    }

    const result = await db.query(
      `SELECT id, exhibitor_id, exhibition_id, application_text, status, created_at, updated_at
       FROM exhibitor_awards
       WHERE exhibitor_id = $1 AND exhibition_id = $2
       LIMIT 1`,
      [exhibitorId, exhibitionId]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    const row = result.rows[0];
    return res.json({
      success: true,
      data: {
        id: row.id,
        exhibitorId: row.exhibitor_id,
        exhibitionId: row.exhibition_id,
        applicationText: row.application_text || '',
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (e) {
    console.error('Error fetching exhibitor award:', e);
    return res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

// UPSERT award application
router.put('/:exhibitorId/:exhibitionId', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const { exhibitorId, exhibitionId } = req.params;
    const { applicationText, status } = req.body || {};

    if (!applicationText && !status) {
      return res.status(400).json({ success: false, message: 'Brak danych do zapisania' });
    }

    // Authorization: same as GET
    if (req.user.role !== 'admin') {
      let selfExhibitorId = null;
      const meByEmail = await db.query('SELECT id FROM exhibitors WHERE email = $1 LIMIT 1', [req.user.email]);
      if (meByEmail.rows?.[0]?.id) {
        selfExhibitorId = meByEmail.rows[0].id;
      } else {
        const rel = await db.query('SELECT exhibitor_id FROM exhibitor_events WHERE supervisor_user_id = $1 LIMIT 1', [req.user.id]);
        selfExhibitorId = rel.rows?.[0]?.exhibitor_id ?? null;
      }
      if (String(selfExhibitorId) !== String(exhibitorId)) {
        return res.status(403).json({ success: false, message: 'Brak uprawnień' });
      }
    }

    // Ensure row exists (upsert)
    const upsert = await db.query(
      `INSERT INTO exhibitor_awards (exhibitor_id, exhibition_id, application_text, status)
       VALUES ($1, $2, $3, COALESCE($4, 'draft'))
       ON CONFLICT (exhibitor_id, exhibition_id)
       DO UPDATE SET application_text = COALESCE($3, exhibitor_awards.application_text),
                     status = COALESCE($4, exhibitor_awards.status),
                     updated_at = NOW()
       RETURNING id, exhibitor_id, exhibition_id, application_text, status, created_at, updated_at`,
      [exhibitorId, exhibitionId, applicationText ?? null, status ?? null]
    );

    const row = upsert.rows[0];
    return res.json({
      success: true,
      message: 'Zapisano zgłoszenie do nagrody',
      data: {
        id: row.id,
        exhibitorId: row.exhibitor_id,
        exhibitionId: row.exhibition_id,
        applicationText: row.application_text || '',
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (e) {
    console.error('Error upserting exhibitor award:', e);
    return res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

module.exports = router;


