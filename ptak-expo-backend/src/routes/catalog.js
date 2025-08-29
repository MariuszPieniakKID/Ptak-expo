const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, requireAdmin, requireExhibitorOrAdmin } = require('../middleware/auth');

// Resolve exhibitor_id by user email
const getLinkedExhibitorIdByEmail = async (email) => {
  const result = await db.query('SELECT id FROM exhibitors WHERE email = $1', [email]);
  return result.rows.length > 0 ? result.rows[0].id : null;
};

// GET current exhibitor entry (exhibitor/admin) - event-specific with fallbacks
router.get('/:exhibitionId', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const exhibitionId = parseInt(req.params.exhibitionId, 10);
    let exhibitorId = null;

    if (req.user.role === 'exhibitor') {
      exhibitorId = await getLinkedExhibitorIdByEmail(req.user.email);
      if (!exhibitorId) return res.json({ success: true, data: null });
    } else {
      exhibitorId = req.query.exhibitorId ? parseInt(req.query.exhibitorId, 10) : null;
      if (!exhibitorId) return res.status(400).json({ success: false, message: 'Missing exhibitorId' });
    }
    console.log(`[catalog] GET exhibitor entry`, { exhibitorId, exhibitionId, role: req.user.role, email: req.user.email });
    // 1) Try event-specific entry
    let result = await db.query(
      `SELECT id, exhibitor_id, exhibition_id, name, logo, description, contact_info, website, socials, contact_email,
              created_at, updated_at
       FROM exhibitor_catalog_entries
       WHERE exhibitor_id = $1 AND exhibition_id = $2`,
      [exhibitorId, exhibitionId]
    );
    let data = result.rows[0] || null;

    // 2) Fallback to GLOBAL entry
    if (!data) {
      const globalRes = await db.query(
        `SELECT id, exhibitor_id, exhibition_id, name, logo, description, contact_info, website, socials, contact_email,
                created_at, updated_at
         FROM exhibitor_catalog_entries
         WHERE exhibitor_id = $1 AND exhibition_id IS NULL
         ORDER BY updated_at DESC
         LIMIT 1`,
        [exhibitorId]
      );
      data = globalRes.rows[0] || null;
    }

    // 3) Fallback to exhibitors table (defaults)
    if (!data) {
      const exhibitorRes = await db.query(
        `SELECT company_name, email, address, postal_code, city, contact_person
         FROM exhibitors WHERE id = $1`,
        [exhibitorId]
      );
      if (exhibitorRes.rows.length > 0) {
        const e = exhibitorRes.rows[0];
        data = {
          id: null,
          exhibitor_id: exhibitorId,
          exhibition_id: null,
          name: e.company_name,
          logo: null,
          description: null,
          contact_info: e.contact_person || null,
          website: null,
          socials: null,
          contact_email: e.email || null,
          created_at: null,
          updated_at: null
        };
      }
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching catalog entry:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch catalog entry' });
  }
});

// UPSERT current exhibitor entry
router.post('/:exhibitionId', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    // Store as GLOBAL entry regardless of the route param to keep one source of truth
    const exhibitionId = null;
    const exhibitorId = await getLinkedExhibitorIdByEmail(req.user.email);
    if (!exhibitorId) return res.status(400).json({ success: false, message: 'Exhibitor not linked to user' });

    const {
      name = null,
      logo = null,
      description = null,
      contactInfo = null,
      website = null,
      socials = null,
      contactEmail = null
    } = req.body || {};

    console.log(`[catalog] UPSERT by exhibitor`, { exhibitorId, exhibitionId, email: req.user.email });
    const result = await db.query(
      `INSERT INTO exhibitor_catalog_entries 
        (exhibitor_id, exhibition_id, name, logo, description, contact_info, website, socials, contact_email)
       VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT ON CONSTRAINT idx_catalog_entries_unique_global
       DO UPDATE SET 
         name = EXCLUDED.name,
         logo = EXCLUDED.logo,
         description = EXCLUDED.description,
         contact_info = EXCLUDED.contact_info,
         website = EXCLUDED.website,
         socials = EXCLUDED.socials,
         contact_email = EXCLUDED.contact_email,
         updated_at = NOW()
       RETURNING id, exhibitor_id, exhibition_id, name, logo, description, contact_info, website, socials, contact_email, created_at, updated_at`,
      [
        exhibitorId,
        name,
        logo,
        description,
        contactInfo,
        website,
        socials,
        contactEmail
      ]
    );

    // Synchronize key fields back to exhibitors table so admin sees the same data
    try {
      await db.query(
        `UPDATE exhibitors
         SET 
           company_name = COALESCE($1, company_name),
           contact_person = COALESCE($2, contact_person),
           email = COALESCE($3, email),
           updated_at = NOW()
         WHERE id = $4`,
        [name, contactInfo, contactEmail, exhibitorId]
      );
    } catch (syncErr) {
      console.error('⚠️ Error syncing catalog fields to exhibitors:', syncErr);
      // Do not fail the request if sync fails; catalog entry was saved
    }

    return res.json({ success: true, message: 'Catalog entry saved', data: result.rows[0] });
  } catch (error) {
    console.error('Error saving catalog entry:', error);
    return res.status(500).json({ success: false, message: 'Failed to save catalog entry' });
  }
});

// Admin: fetch GLOBAL entry by exhibitor, fallback to latest event entry, then exhibitors table
router.get('/admin/:exhibitorId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const exhibitorId = parseInt(req.params.exhibitorId, 10);
    console.log(`[catalog] ADMIN GET GLOBAL`, { exhibitorId, admin: req.user.email });
    // Global first
    let result = await db.query(
      `SELECT id, exhibitor_id, exhibition_id, name, logo, description, contact_info, website, socials, contact_email,
              created_at, updated_at
       FROM exhibitor_catalog_entries
       WHERE exhibitor_id = $1 AND exhibition_id IS NULL
       ORDER BY updated_at DESC
       LIMIT 1`,
      [exhibitorId]
    );
    let data = result.rows[0] || null;

    // Latest any entry
    if (!data) {
      const anyRes = await db.query(
        `SELECT id, exhibitor_id, exhibition_id, name, logo, description, contact_info, website, socials, contact_email,
                created_at, updated_at
         FROM exhibitor_catalog_entries
         WHERE exhibitor_id = $1
         ORDER BY updated_at DESC
         LIMIT 1`,
        [exhibitorId]
      );
      data = anyRes.rows[0] || null;
    }

    // Fallback to exhibitors table
    if (!data) {
      const exhibitorRes = await db.query(
        `SELECT company_name, email, address, postal_code, city, contact_person
         FROM exhibitors WHERE id = $1`,
        [exhibitorId]
      );
      if (exhibitorRes.rows.length > 0) {
        const e = exhibitorRes.rows[0];
        data = {
          id: null,
          exhibitor_id: exhibitorId,
          exhibition_id: null,
          name: e.company_name,
          logo: null,
          description: null,
          contact_info: e.contact_person || null,
          website: null,
          socials: null,
          contact_email: e.email || null,
          created_at: null,
          updated_at: null
        };
      }
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching catalog entry (admin):', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch catalog entry' });
  }
});

module.exports = router;


