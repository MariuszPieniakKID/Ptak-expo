const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, requireExhibitorOrAdmin } = require('../middleware/auth');

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


