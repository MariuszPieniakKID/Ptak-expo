const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, requireAdmin, requireExhibitorOrAdmin } = require('../middleware/auth');

// Resolve exhibitor_id by user email
const getLinkedExhibitorIdByEmail = async (email) => {
  const result = await db.query('SELECT id FROM exhibitors WHERE email = $1', [email]);
  return result.rows.length > 0 ? result.rows[0].id : null;
};

// Suggest catalog tags (optionally filtered by prefix)
router.get('/tags', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const q = String(req.query.query || '').trim().toLowerCase();
    let result;
    if (q) {
      result = await db.query(
        `SELECT tag, usage_count FROM catalog_tags WHERE LOWER(tag) LIKE $1 ORDER BY usage_count DESC, tag ASC LIMIT 50`,
        [q + '%']
      );
    } else {
      result = await db.query(
        `SELECT tag, usage_count FROM catalog_tags ORDER BY usage_count DESC, tag ASC LIMIT 50`
      );
    }
    return res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Error fetching catalog tags:', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch tags' });
  }
});

// Upsert catalog tags
router.post('/tags', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const { tags } = req.body || {};
    if (!Array.isArray(tags)) return res.status(400).json({ success: false, message: 'tags must be an array' });
    const cleaned = Array.from(new Set(tags.map(t => String(t || '').trim()).filter(Boolean)));
    for (const tag of cleaned) {
      await db.query(
        `INSERT INTO catalog_tags(tag, usage_count) VALUES($1, 1)
         ON CONFLICT (tag) DO UPDATE SET usage_count = catalog_tags.usage_count + 1, updated_at = NOW()`,
        [tag]
      );
    }
    return res.json({ success: true });
  } catch (e) {
    console.error('Error upserting catalog tags:', e);
    return res.status(500).json({ success: false, message: 'Failed to upsert tags' });
  }
});

// Suggest brands (optionally filtered by prefix)
router.get('/brands', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const q = String(req.query.query || '').trim().toLowerCase();
    let result;
    if (q) {
      result = await db.query(
        `SELECT brand, usage_count FROM catalog_brands WHERE LOWER(brand) LIKE $1 ORDER BY usage_count DESC, brand ASC LIMIT 50`,
        [q + '%']
      );
    } else {
      result = await db.query(
        `SELECT brand, usage_count FROM catalog_brands ORDER BY usage_count DESC, brand ASC LIMIT 50`
      );
    }
    return res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Error fetching catalog brands:', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch brands' });
  }
});

// Upsert brands
router.post('/brands', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const { brands } = req.body || {};
    if (!Array.isArray(brands)) return res.status(400).json({ success: false, message: 'brands must be an array' });
    const cleaned = Array.from(new Set(brands.map(t => String(t || '').trim()).filter(Boolean)));
    for (const brand of cleaned) {
      await db.query(
        `INSERT INTO catalog_brands(brand, usage_count) VALUES($1, 1)
         ON CONFLICT (brand) DO UPDATE SET usage_count = catalog_brands.usage_count + 1, updated_at = NOW()`,
        [brand]
      );
    }
    return res.json({ success: true });
  } catch (e) {
    console.error('Error upserting catalog brands:', e);
    return res.status(500).json({ success: false, message: 'Failed to upsert brands' });
  }
});

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
      `SELECT id, exhibitor_id, exhibition_id, name, display_name, logo, description, contact_info, website, socials, contact_email, products, catalog_tags, brands,
              created_at, updated_at
       FROM exhibitor_catalog_entries
       WHERE exhibitor_id = $1 AND exhibition_id = $2`,
      [exhibitorId, exhibitionId]
    );
    let data = result.rows[0] || null;

    // 2) Fallback to GLOBAL entry
    if (!data) {
      const globalRes = await db.query(
      `SELECT id, exhibitor_id, exhibition_id, name, display_name, logo, description, contact_info, website, socials, contact_email, products, catalog_tags, brands,
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
          display_name: e.company_name,
          logo: null,
          description: null,
          contact_info: e.contact_person || null,
          website: null,
          socials: null,
          contact_email: e.email || null,
          products: [],
          catalog_tags: null,
          brands: null,
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

// UPSERT current exhibitor entry (GLOBAL)
router.post('/:exhibitionId', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    // Store as GLOBAL entry regardless of the route param to keep one source of truth
    const exhibitorId = await getLinkedExhibitorIdByEmail(req.user.email);
    if (!exhibitorId) return res.status(400).json({ success: false, message: 'Exhibitor not linked to user' });

    const {
      name = null,
      displayName = null,
      logo = null,
      description = null,
      contactInfo = null,
      website = null,
      socials = null,
      contactEmail = null,
      catalogTags = null,
      brands = null
    } = req.body || {};

    // Safe upsert without relying on a specific constraint name
    const updateRes = await db.query(
      `UPDATE exhibitor_catalog_entries
         SET 
           name = $2,
           display_name = $3,
           logo = $4,
           description = $5,
           contact_info = $6,
           website = $7,
           socials = $8,
           contact_email = $9,
           catalog_tags = $10,
           brands = $11,
           updated_at = NOW()
       WHERE exhibitor_id = $1 AND exhibition_id IS NULL
       RETURNING id, exhibitor_id, exhibition_id, name, display_name, logo, description, contact_info, website, socials, contact_email, catalog_tags, brands, created_at, updated_at`,
      [exhibitorId, name, displayName, logo, description, contactInfo, website, socials, contactEmail, catalogTags, brands]
    );

    let result;
    if (updateRes.rows.length > 0) {
      result = updateRes;
    } else {
      const insertRes = await db.query(
        `INSERT INTO exhibitor_catalog_entries 
          (exhibitor_id, exhibition_id, name, display_name, logo, description, contact_info, website, socials, contact_email, catalog_tags, brands)
        VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, exhibitor_id, exhibition_id, name, display_name, logo, description, contact_info, website, socials, contact_email, catalog_tags, brands, created_at, updated_at`,
        [exhibitorId, name, displayName, logo, description, contactInfo, website, socials, contactEmail, catalogTags, brands]
      );
      result = insertRes;
    }

    // synchronise catalogTags by upserting to catalog_tags dictionary
    if (catalogTags) {
      const list = String(catalogTags).split(',').map(s => s.trim()).filter(Boolean);
      for (const tag of list) {
        await db.query(
          `INSERT INTO catalog_tags(tag, usage_count) VALUES($1, 1)
           ON CONFLICT (tag) DO UPDATE SET usage_count = catalog_tags.usage_count + 1, updated_at = NOW()`,
          [tag]
        );
      }
    }
    // synchronise brands to catalog_brands dictionary
    if (brands) {
      const list = String(brands).split(',').map(s => s.trim()).filter(Boolean);
      for (const brand of list) {
        await db.query(
          `INSERT INTO catalog_brands(brand, usage_count) VALUES($1, 1)
           ON CONFLICT (brand) DO UPDATE SET usage_count = catalog_brands.usage_count + 1, updated_at = NOW()`,
          [brand]
        );
      }
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
      if (Array.isArray(tags)) {
        for (const tag of Array.from(new Set(tags.map(t => String(t || '').trim()).filter(Boolean)))) {
          await db.query(
            `INSERT INTO catalog_tags(tag, usage_count) VALUES($1, 1)
             ON CONFLICT (tag) DO UPDATE SET usage_count = catalog_tags.usage_count + 1, updated_at = NOW()`,
            [tag]
          );
        }
      }
      return res.json({ success: true, message: 'Product added', data: upd.rows[0].products });
    }

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
    if (Array.isArray(tags)) {
      for (const tag of Array.from(new Set(tags.map(t => String(t || '').trim()).filter(Boolean)))) {
        await db.query(
          `INSERT INTO catalog_tags(tag, usage_count) VALUES($1, 1)
           ON CONFLICT (tag) DO UPDATE SET usage_count = catalog_tags.usage_count + 1, updated_at = NOW()`,
          [tag]
        );
      }
    }
    return res.json({ success: true, message: 'Product added', data: ins.rows[0].products });
  } catch (error) {
    console.error('Error adding product to catalog:', error);
    return res.status(500).json({ success: false, message: 'Failed to add product to catalog' });
  }
});

// Exhibitor: update product at index in GLOBAL products list
router.put('/:exhibitionId/products/:index', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const exhibitorId = await getLinkedExhibitorIdByEmail(req.user.email);
    if (!exhibitorId) return res.status(400).json({ success: false, message: 'Exhibitor not linked to user' });
    const idx = parseInt(req.params.index, 10);
    if (!Number.isInteger(idx) || idx < 0) return res.status(400).json({ success: false, message: 'Invalid product index' });

    const { name, img, description, tabList, tags } = req.body || {};
    if (!name) return res.status(400).json({ success: false, message: 'Missing product name' });

    const cur = await db.query(
      `SELECT products FROM exhibitor_catalog_entries WHERE exhibitor_id = $1 AND exhibition_id IS NULL ORDER BY updated_at DESC LIMIT 1`,
      [exhibitorId]
    );
    const list = Array.isArray(cur.rows?.[0]?.products) ? cur.rows[0].products : [];
    if (idx >= list.length) return res.status(404).json({ success: false, message: 'Product index out of range' });

    const next = [...list];
    next[idx] = {
      name,
      img: img || null,
      description: description || '',
      tabList: Array.isArray(tabList) ? tabList : null,
      tags: Array.isArray(tags) ? tags : []
    };

    const upd = await db.query(
      `UPDATE exhibitor_catalog_entries
         SET products = $2::jsonb,
             updated_at = NOW()
       WHERE exhibitor_id = $1 AND exhibition_id IS NULL
       RETURNING products`,
      [exhibitorId, JSON.stringify(next)]
    );

    if (Array.isArray(tags)) {
      for (const tag of Array.from(new Set(tags.map(t => String(t || '').trim()).filter(Boolean)))) {
        await db.query(
          `INSERT INTO catalog_tags(tag, usage_count) VALUES($1, 1)
           ON CONFLICT (tag) DO UPDATE SET usage_count = catalog_tags.usage_count + 1, updated_at = NOW()`,
          [tag]
        );
      }
    }

    return res.json({ success: true, message: 'Product updated', data: upd.rows[0].products });
  } catch (error) {
    console.error('Error updating product in catalog:', error);
    return res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

module.exports = router;