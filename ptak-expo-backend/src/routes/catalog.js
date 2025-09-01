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
    // Fetch catalog entry
    // 1) Try event-specific entry
    let result = await db.query(
      `SELECT id, exhibitor_id, exhibition_id, name, logo, description, contact_info, website, socials, contact_email, products,
              created_at, updated_at
       FROM exhibitor_catalog_entries
       WHERE exhibitor_id = $1 AND exhibition_id = $2`,
      [exhibitorId, exhibitionId]
    );
    let data = result.rows[0] || null;

    // 2) Fallback to GLOBAL entry
    if (!data) {
      const globalRes = await db.query(
        `SELECT id, exhibitor_id, exhibition_id, name, logo, description, contact_info, website, socials, contact_email, products,
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
          products: [],
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
      contactEmail = null,
      catalogTags = null
    } = req.body || {};

    // Upsert catalog entry

    // Safe upsert without relying on a specific constraint name
    const updateRes = await db.query(
      `UPDATE exhibitor_catalog_entries
         SET 
           name = $2,
           logo = $3,
           description = $4,
           contact_info = $5,
           website = $6,
           socials = $7,
           contact_email = $8,
           updated_at = NOW()
       WHERE exhibitor_id = $1 AND exhibition_id IS NULL
       RETURNING id, exhibitor_id, exhibition_id, name, logo, description, contact_info, website, socials, contact_email, created_at, updated_at`,
      [exhibitorId, name, logo, description, contactInfo, website, socials, contactEmail]
    );

    let result;
    if (updateRes.rows.length > 0) {
      result = updateRes;
    } else {
      const insertRes = await db.query(
        `INSERT INTO exhibitor_catalog_entries 
          (exhibitor_id, exhibition_id, name, logo, description, contact_info, website, socials, contact_email)
         VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, exhibitor_id, exhibition_id, name, logo, description, contact_info, website, socials, contact_email, created_at, updated_at`,
        [exhibitorId, name, logo, description, contactInfo, website, socials, contactEmail]
      );
      result = insertRes;
    }

    // synchronise catalogTags opportunistically into socials if no dedicated column exists
    if (catalogTags !== null && catalogTags !== undefined) {
      try {
        await db.query(
          `UPDATE exhibitor_catalog_entries SET socials = $1, updated_at = NOW() WHERE exhibitor_id = $2 AND exhibition_id IS NULL`,
          [socials ?? null, exhibitorId]
        );
      } catch {}
    }

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

// Admin: get products list stored in catalog (GLOBAL first)
router.get('/admin/:exhibitorId/products', verifyToken, requireAdmin, async (req, res) => {
  try {
    const exhibitorId = parseInt(req.params.exhibitorId, 10);
    
    // Global first
    let result = await db.query(
      `SELECT products FROM exhibitor_catalog_entries WHERE exhibitor_id = $1 AND exhibition_id IS NULL ORDER BY updated_at DESC LIMIT 1`,
      [exhibitorId]
    );
    let products = (result.rows[0]?.products) || null;
    if (!products) {
      const anyRes = await db.query(
        `SELECT products FROM exhibitor_catalog_entries WHERE exhibitor_id = $1 ORDER BY updated_at DESC LIMIT 1`,
        [exhibitorId]
      );
      products = (anyRes.rows[0]?.products) || [];
    }
    return res.json({ success: true, data: Array.isArray(products) ? products : [] });
  } catch (error) {
    console.error('Error fetching catalog products (admin):', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// Exhibitor: append product to GLOBAL products list
router.post('/:exhibitionId/products', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const exhibitorId = await getLinkedExhibitorIdByEmail(req.user.email);
    if (!exhibitorId) return res.status(400).json({ success: false, message: 'Exhibitor not linked to user' });
    const { name, img, description, tabList, tags } = req.body || {};
    if (!name) return res.status(400).json({ success: false, message: 'Missing product name' });

    

    // Try update existing global row by appending to products
    const upd = await db.query(
      `UPDATE exhibitor_catalog_entries
         SET products = COALESCE(products, '[]'::jsonb) || jsonb_build_array(
           jsonb_build_object(
             'name', $2::text,
             'img', $3::text,
             'description', $4::text,
             'tabList', COALESCE($5::jsonb, 'null'::jsonb),
             'tags', COALESCE($6::jsonb, '[]'::jsonb)
           )
         ),
             updated_at = NOW()
       WHERE exhibitor_id = $1 AND exhibition_id IS NULL
       RETURNING products`,
      [exhibitorId, name, img || null, description || '', Array.isArray(tabList) ? JSON.stringify(tabList) : null, Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify([])]
    );

    if (upd.rows.length > 0) {
      return res.json({ success: true, message: 'Product added', data: upd.rows[0].products });
    }

    // Insert new global row with products array
    const ins = await db.query(
      `INSERT INTO exhibitor_catalog_entries (exhibitor_id, exhibition_id, products)
       VALUES ($1, NULL, jsonb_build_array(
         jsonb_build_object(
           'name', $2::text,
           'img', $3::text,
           'description', $4::text,
           'tabList', COALESCE($5::jsonb, 'null'::jsonb),
           'tags', COALESCE($6::jsonb, '[]'::jsonb)
         )
       ))
       RETURNING products`,
      [exhibitorId, name, img || null, description || '', Array.isArray(tabList) ? JSON.stringify(tabList) : null, Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify([])]
    );
    return res.json({ success: true, message: 'Product added', data: ins.rows[0].products });
  } catch (error) {
    console.error('Error adding catalog product:', error);
    return res.status(500).json({ success: false, message: 'Failed to add product' });
  }
});

// Admin: fetch GLOBAL entry by exhibitor, fallback to latest event entry, then exhibitors table
router.get('/admin/:exhibitorId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const exhibitorId = parseInt(req.params.exhibitorId, 10);
    // Admin: fetch catalog entry
    // Global first
    let result = await db.query(
      `SELECT id, exhibitor_id, exhibition_id, name, logo, description, contact_info, website, socials, contact_email, products,
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
        `SELECT id, exhibitor_id, exhibition_id, name, logo, description, contact_info, website, socials, contact_email, products,
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
          products: [],
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


