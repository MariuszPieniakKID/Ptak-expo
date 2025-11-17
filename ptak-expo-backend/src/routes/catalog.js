const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, requireAdmin, requireExhibitorOrAdmin } = require('../middleware/auth');

// Resolve exhibitor_id by user email
const getLinkedExhibitorIdByEmail = async (email) => {
  const result = await db.query('SELECT id FROM exhibitors WHERE email = $1', [email]);
  return result.rows.length > 0 ? result.rows[0].id : null;
};

// Helper: Convert HTTP URLs to HTTPS
const ensureHttps = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return trimmedUrl;
  
  // Skip localhost and local development URLs
  if (trimmedUrl.includes('localhost') || trimmedUrl.includes('127.0.0.1')) {
    return trimmedUrl;
  }
  
  // If URL starts with http:// (but not https://), replace it
  if (trimmedUrl.match(/^http:\/\//i) && !trimmedUrl.match(/^https:\/\//i)) {
    return trimmedUrl.replace(/^http:\/\//i, 'https://');
  }
  
  // If no protocol, add https://
  if (!trimmedUrl.match(/^https?:\/\//i)) {
    return `https://${trimmedUrl}`;
  }
  
  return trimmedUrl;
};

// Suggest catalog tags (optionally filtered by prefix)
router.get('/tags', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const q = String(req.query.query || '').trim().toLowerCase();
    const limit = Math.min(2000, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));
    let result;
    if (q) {
      result = await db.query(
        `SELECT tag, usage_count FROM catalog_tags WHERE LOWER(tag) LIKE $1 ORDER BY usage_count DESC, tag ASC LIMIT $2`,
        [q + '%', limit]
      );
    } else {
      result = await db.query(
        `SELECT tag, usage_count FROM catalog_tags ORDER BY usage_count DESC, tag ASC LIMIT $1`,
        [limit]
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

// Admin: add single tag
router.post('/tags/add', verifyToken, requireAdmin, async (req, res) => {
  try {
    const raw = String((req.body?.tag ?? '')).trim();
    if (!raw) return res.status(400).json({ success: false, message: 'Missing tag' });
    await db.query(`INSERT INTO catalog_tags(tag, usage_count) VALUES($1, 1)
                    ON CONFLICT (tag) DO UPDATE SET updated_at = NOW()`, [raw]);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error adding catalog tag:', e);
    return res.status(500).json({ success: false, message: 'Failed to add tag' });
  }
});

// Admin: rename tag
router.put('/tags', verifyToken, requireAdmin, async (req, res) => {
  try {
    const oldTag = String((req.body?.oldTag ?? '')).trim();
    const newTag = String((req.body?.newTag ?? '')).trim();
    if (!oldTag || !newTag) return res.status(400).json({ success: false, message: 'Missing oldTag or newTag' });
    await db.query(`UPDATE catalog_tags SET tag = $2, updated_at = NOW() WHERE tag = $1`, [oldTag, newTag]);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error renaming catalog tag:', e);
    return res.status(500).json({ success: false, message: 'Failed to rename tag' });
  }
});

// Admin: delete tag
router.delete('/tags', verifyToken, requireAdmin, async (req, res) => {
  try {
    const tag = String((req.query?.tag ?? req.body?.tag ?? '')).trim();
    if (!tag) return res.status(400).json({ success: false, message: 'Missing tag' });
    await db.query(`DELETE FROM catalog_tags WHERE tag = $1`, [tag]);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error deleting catalog tag:', e);
    return res.status(500).json({ success: false, message: 'Failed to delete tag' });
  }
});

// Suggest brands (optionally filtered by prefix)
router.get('/brands', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const q = String(req.query.query || '').trim().toLowerCase();
    const limit = Math.min(2000, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));
    let result;
    if (q) {
      result = await db.query(
        `SELECT brand, usage_count FROM catalog_brands WHERE LOWER(brand) LIKE $1 ORDER BY usage_count DESC, brand ASC LIMIT $2`,
        [q + '%', limit]
      );
    } else {
      result = await db.query(
        `SELECT brand, usage_count FROM catalog_brands ORDER BY usage_count DESC, brand ASC LIMIT $1`,
        [limit]
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

// Admin: add single brand
router.post('/brands/add', verifyToken, requireAdmin, async (req, res) => {
  try {
    const raw = String((req.body?.brand ?? '')).trim();
    if (!raw) return res.status(400).json({ success: false, message: 'Missing brand' });
    await db.query(`INSERT INTO catalog_brands(brand, usage_count) VALUES($1, 1)
                    ON CONFLICT (brand) DO UPDATE SET updated_at = NOW()`, [raw]);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error adding catalog brand:', e);
    return res.status(500).json({ success: false, message: 'Failed to add brand' });
  }
});

// Admin: rename brand
router.put('/brands', verifyToken, requireAdmin, async (req, res) => {
  try {
    const oldBrand = String((req.body?.oldBrand ?? '')).trim();
    const newBrand = String((req.body?.newBrand ?? '')).trim();
    if (!oldBrand || !newBrand) return res.status(400).json({ success: false, message: 'Missing oldBrand or newBrand' });
    await db.query(`UPDATE catalog_brands SET brand = $2, updated_at = NOW() WHERE brand = $1`, [oldBrand, newBrand]);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error renaming catalog brand:', e);
    return res.status(500).json({ success: false, message: 'Failed to rename brand' });
  }
});

// Admin: delete brand
router.delete('/brands', verifyToken, requireAdmin, async (req, res) => {
  try {
    const brand = String((req.query?.brand ?? req.body?.brand ?? '')).trim();
    if (!brand) return res.status(400).json({ success: false, message: 'Missing brand' });
    await db.query(`DELETE FROM catalog_brands WHERE brand = $1`, [brand]);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error deleting catalog brand:', e);
    return res.status(500).json({ success: false, message: 'Failed to delete brand' });
  }
});

// Suggest industries (optionally filtered by prefix)
router.get('/industries', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const q = String(req.query.query || '').trim().toLowerCase();
    const limit = Math.min(2000, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));
    let result;
    if (q) {
      result = await db.query(
        `SELECT industry, usage_count FROM catalog_industries WHERE LOWER(industry) LIKE $1 ORDER BY usage_count DESC, industry ASC LIMIT $2`,
        [q + '%', limit]
      );
    } else {
      result = await db.query(
        `SELECT industry, usage_count FROM catalog_industries ORDER BY usage_count DESC, industry ASC LIMIT $1`,
        [limit]
      );
    }
    return res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Error fetching catalog industries:', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch industries' });
  }
});

// Upsert industries
router.post('/industries', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const { industries } = req.body || {};
    if (!Array.isArray(industries)) return res.status(400).json({ success: false, message: 'industries must be an array' });
    const cleaned = Array.from(new Set(industries.map(t => String(t || '').trim()).filter(Boolean)));
    for (const industry of cleaned) {
      await db.query(
        `INSERT INTO catalog_industries(industry, usage_count) VALUES($1, 1)
         ON CONFLICT (industry) DO UPDATE SET usage_count = catalog_industries.usage_count + 1, updated_at = NOW()`,
        [industry]
      );
    }
    return res.json({ success: true });
  } catch (e) {
    console.error('Error upserting catalog industries:', e);
    return res.status(500).json({ success: false, message: 'Failed to upsert industries' });
  }
});

// Admin: add single industry
router.post('/industries/add', verifyToken, requireAdmin, async (req, res) => {
  try {
    const raw = String((req.body?.industry ?? '')).trim();
    if (!raw) return res.status(400).json({ success: false, message: 'Missing industry' });
    await db.query(`INSERT INTO catalog_industries(industry, usage_count) VALUES($1, 1)
                    ON CONFLICT (industry) DO UPDATE SET updated_at = NOW()`, [raw]);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error adding catalog industry:', e);
    return res.status(500).json({ success: false, message: 'Failed to add industry' });
  }
});

// Admin: rename industry
router.put('/industries', verifyToken, requireAdmin, async (req, res) => {
  try {
    const oldValue = String((req.body?.oldIndustry ?? '')).trim();
    const newValue = String((req.body?.newIndustry ?? '')).trim();
    if (!oldValue || !newValue) return res.status(400).json({ success: false, message: 'Missing oldIndustry or newIndustry' });
    await db.query(`UPDATE catalog_industries SET industry = $2, updated_at = NOW() WHERE industry = $1`, [oldValue, newValue]);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error renaming catalog industry:', e);
    return res.status(500).json({ success: false, message: 'Failed to rename industry' });
  }
});

// Admin: delete industry
router.delete('/industries', verifyToken, requireAdmin, async (req, res) => {
  try {
    const value = String((req.query?.industry ?? req.body?.industry ?? '')).trim();
    if (!value) return res.status(400).json({ success: false, message: 'Missing industry' });
    await db.query(`DELETE FROM catalog_industries WHERE industry = $1`, [value]);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error deleting catalog industry:', e);
    return res.status(500).json({ success: false, message: 'Failed to delete industry' });
  }
});

// Event fields (industry type of exhibition)
// Suggest event fields
router.get('/event-fields', verifyToken, requireAdmin, async (req, res) => {
  try {
    const q = String(req.query.query || '').trim().toLowerCase();
    const limit = Math.min(2000, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));
    let result;
    if (q) {
      result = await db.query(
        `SELECT event_field, usage_count FROM catalog_event_fields WHERE LOWER(event_field) LIKE $1 ORDER BY usage_count DESC, event_field ASC LIMIT $2`,
        [q + '%', limit]
      );
    } else {
      result = await db.query(
        `SELECT event_field, usage_count FROM catalog_event_fields ORDER BY usage_count DESC, event_field ASC LIMIT $1`,
        [limit]
      );
    }
    return res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Error fetching catalog event fields:', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch event fields' });
  }
});

// Admin: add single event field
router.post('/event-fields/add', verifyToken, requireAdmin, async (req, res) => {
  try {
    const raw = String((req.body?.eventField ?? '')).trim();
    if (!raw) return res.status(400).json({ success: false, message: 'Missing eventField' });
    await db.query(`INSERT INTO catalog_event_fields(event_field, usage_count) VALUES($1, 1)
                    ON CONFLICT (event_field) DO UPDATE SET updated_at = NOW()`, [raw]);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error adding catalog event field:', e);
    return res.status(500).json({ success: false, message: 'Failed to add event field' });
  }
});

// Admin: rename event field
router.put('/event-fields', verifyToken, requireAdmin, async (req, res) => {
  try {
    const oldValue = String((req.body?.oldEventField ?? '')).trim();
    const newValue = String((req.body?.newEventField ?? '')).trim();
    if (!oldValue || !newValue) return res.status(400).json({ success: false, message: 'Missing oldEventField or newEventField' });
    await db.query(`UPDATE catalog_event_fields SET event_field = $2, updated_at = NOW() WHERE event_field = $1`, [oldValue, newValue]);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error renaming catalog event field:', e);
    return res.status(500).json({ success: false, message: 'Failed to rename event field' });
  }
});

// Admin: delete event field
router.delete('/event-fields', verifyToken, requireAdmin, async (req, res) => {
  try {
    const value = String((req.query?.eventField ?? req.body?.eventField ?? '')).trim();
    if (!value) return res.status(400).json({ success: false, message: 'Missing eventField' });
    await db.query(`DELETE FROM catalog_event_fields WHERE event_field = $1`, [value]);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error deleting catalog event field:', e);
    return res.status(500).json({ success: false, message: 'Failed to delete event field' });
  }
});

// Build types (Zabudowa targowa)
router.get('/build-types', verifyToken, requireAdmin, async (req, res) => {
  try {
    const q = String(req.query.query || '').trim().toLowerCase();
    const limit = Math.min(2000, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));
    let result;
    if (q) {
      result = await db.query(
        `SELECT build_type, usage_count FROM catalog_build_types WHERE LOWER(build_type) LIKE $1 ORDER BY usage_count DESC, build_type ASC LIMIT $2`,
        [q + '%', limit]
      );
    } else {
      result = await db.query(
        `SELECT build_type, usage_count FROM catalog_build_types ORDER BY usage_count DESC, build_type ASC LIMIT $1`,
        [limit]
      );
    }
    return res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Error fetching build types:', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch build types' });
  }
});

router.post('/build-types/add', verifyToken, requireAdmin, async (req, res) => {
  try {
    const raw = String((req.body?.buildType ?? '')).trim();
    if (!raw) return res.status(400).json({ success: false, message: 'Missing buildType' });
    await db.query(`INSERT INTO catalog_build_types(build_type, usage_count) VALUES($1, 1)
                    ON CONFLICT (build_type) DO UPDATE SET updated_at = NOW()`, [raw]);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error adding build type:', e);
    return res.status(500).json({ success: false, message: 'Failed to add build type' });
  }
});

router.put('/build-types', verifyToken, requireAdmin, async (req, res) => {
  try {
    const oldValue = String((req.body?.oldBuildType ?? '')).trim();
    const newValue = String((req.body?.newBuildType ?? '')).trim();
    if (!oldValue || !newValue) return res.status(400).json({ success: false, message: 'Missing oldBuildType or newBuildType' });
    await db.query(`UPDATE catalog_build_types SET build_type = $2, updated_at = NOW() WHERE build_type = $1`, [oldValue, newValue]);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error renaming build type:', e);
    return res.status(500).json({ success: false, message: 'Failed to rename build type' });
  }
});

router.delete('/build-types', verifyToken, requireAdmin, async (req, res) => {
  try {
    const value = String((req.query?.buildType ?? req.body?.buildType ?? '')).trim();
    if (!value) return res.status(400).json({ success: false, message: 'Missing buildType' });
    await db.query(`DELETE FROM catalog_build_types WHERE build_type = $1`, [value]);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error deleting build type:', e);
    return res.status(500).json({ success: false, message: 'Failed to delete build type' });
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
      // For admin without explicit exhibitorId, return empty data instead of error
      if (!exhibitorId) return res.json({ success: true, data: null });
    }
    // Fetch catalog entry
    // 1) Try event-specific entry
    let result = await db.query(
      `SELECT id, exhibitor_id, exhibition_id, name, display_name, logo, description, why_visit, contact_info, website, socials, contact_email, products, catalog_tags, brands, industries,
              catalog_contact_person, catalog_contact_phone, catalog_contact_email,
              created_at, updated_at
       FROM exhibitor_catalog_entries
       WHERE exhibitor_id = $1 AND exhibition_id = $2`,
      [exhibitorId, exhibitionId]
    );
    let data = result.rows[0] || null;

    // 2) Read GLOBAL entry (for fallback/merge)
    const globalRes = await db.query(
    `SELECT id, exhibitor_id, exhibition_id, name, display_name, logo, description, why_visit, contact_info, website, socials, contact_email, products, catalog_tags, brands, industries,
            catalog_contact_person, catalog_contact_phone, catalog_contact_email,
            created_at, updated_at
       FROM exhibitor_catalog_entries
       WHERE exhibitor_id = $1 AND exhibition_id IS NULL
       ORDER BY updated_at DESC
       LIMIT 1`,
      [exhibitorId]
    );
    const globalData = globalRes.rows[0] || null;

    // If there is an event-specific row, merge it with GLOBAL so missing fields fall back to GLOBAL
    if (data && globalData) {
      const prefer = (a, b) => (a !== null && a !== undefined && a !== '') ? a : b;
      data = {
        ...globalData,
        ...data,
        name: prefer(data.name, globalData.name),
        display_name: prefer(data.display_name, globalData.display_name),
        logo: prefer(data.logo, globalData.logo),
        description: prefer(data.description, globalData.description),
        why_visit: prefer(data.why_visit, globalData.why_visit),
        contact_info: prefer(data.contact_info, globalData.contact_info),
        website: prefer(data.website, globalData.website),
        socials: prefer(data.socials, globalData.socials),
        contact_email: prefer(data.contact_email, globalData.contact_email),
        catalog_tags: data.catalog_tags,
        brands: prefer(data.brands, globalData.brands),
        products: (Array.isArray(data.products) && data.products.length > 0) ? data.products : [],
        industries: prefer(data.industries, globalData.industries),
        catalog_contact_person: prefer(data.catalog_contact_person, globalData.catalog_contact_person),
        catalog_contact_phone: prefer(data.catalog_contact_phone, globalData.catalog_contact_phone),
        catalog_contact_email: prefer(data.catalog_contact_email, globalData.catalog_contact_email)
      };
    }

    // If there is no event-specific row, fall back to GLOBAL as entire dataset
    if (!data) {
      data = globalData;
    }

    // 3) Fallback to exhibitors table (defaults)
    if (!data) {
      const exhibitorRes = await db.query(
        `SELECT company_name, email, address, postal_code, city, contact_person, phone
         FROM exhibitors WHERE id = $1`,
        [exhibitorId]
      );
      if (exhibitorRes.rows.length > 0) {
        const e = exhibitorRes.rows[0];
        // Create contact_info as JSON for consistency
        const contactInfoJson = e.contact_person || e.phone || e.email 
          ? JSON.stringify({
              person: e.contact_person || '',
              phone: e.phone || '',
              email: e.email || ''
            })
          : null;
        data = {
          id: null,
          exhibitor_id: exhibitorId,
          exhibition_id: null,
          name: e.company_name,
          display_name: e.company_name,
          logo: null,
          description: null,
          contact_info: contactInfoJson,
          why_visit: null,
          website: null,
          socials: null,
          contact_email: e.email || null,
          products: [],
          catalog_tags: null,
          brands: null,
          industries: null,
          catalog_contact_person: null,
          catalog_contact_phone: null,
          catalog_contact_email: null,
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
      whyVisit = null,
      contactInfo = null,
      website = null,
      socials = null,
      contactEmail = null,
      catalogTags = null,
      brands = null,
      industries = null,
      catalogContactPerson = null,
      catalogContactPhone = null,
      catalogContactEmail = null
    } = req.body || {};

    // Convert website to HTTPS
    const websiteHttps = website ? ensureHttps(website) : null;

    // Safe upsert without relying on a specific constraint name
    const updateRes = await db.query(
      `UPDATE exhibitor_catalog_entries
         SET 
           name = $2,
           display_name = $3,
           logo = $4,
           description = $5,
           why_visit = $6,
           contact_info = $7,
           website = $8,
           socials = $9,
           contact_email = $10,
           catalog_tags = $11,
           brands = $12,
           catalog_contact_person = $13,
           catalog_contact_phone = $14,
           catalog_contact_email = $15,
           updated_at = NOW()
       WHERE exhibitor_id = $1 AND exhibition_id IS NULL
       RETURNING id, exhibitor_id, exhibition_id, name, display_name, logo, description, why_visit, contact_info, website, socials, contact_email, catalog_tags, brands, catalog_contact_person, catalog_contact_phone, catalog_contact_email, created_at, updated_at`,
      [exhibitorId, name, displayName, logo, description, whyVisit, contactInfo, websiteHttps, socials, contactEmail, catalogTags, brands, catalogContactPerson, catalogContactPhone, catalogContactEmail]
    );

    let result;
    if (updateRes.rows.length > 0) {
      result = updateRes;
    } else {
      const insertRes = await db.query(
        `INSERT INTO exhibitor_catalog_entries 
          (exhibitor_id, exhibition_id, name, display_name, logo, description, why_visit, contact_info, website, socials, contact_email, catalog_tags, brands, catalog_contact_person, catalog_contact_phone, catalog_contact_email)
        VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, exhibitor_id, exhibition_id, name, display_name, logo, description, why_visit, contact_info, website, socials, contact_email, catalog_tags, brands, catalog_contact_person, catalog_contact_phone, catalog_contact_email, created_at, updated_at`,
        [exhibitorId, name, displayName, logo, description, whyVisit, contactInfo, websiteHttps, socials, contactEmail, catalogTags, brands, catalogContactPerson, catalogContactPhone, catalogContactEmail]
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
    // NOTE: contactInfo is NOT synced to contact_person to keep them separate
    // contactInfo from checklist is stored in catalog_entries as JSON
    // contact_person in exhibitors table remains the exhibitor's contact person name
    try {
      await db.query(
        `UPDATE exhibitors
         SET 
           company_name = COALESCE($1, company_name),
           email = COALESCE($2, email),
           updated_at = NOW()
         WHERE id = $3`,
        [name, contactEmail, exhibitorId]
      );
    } catch (syncErr) {
      console.error('⚠️ Error syncing catalog fields to exhibitors:', syncErr);
    }

    // Event-specific industries: upsert into exhibitor_catalog_entries for given exhibitionId
    try {
      const exhibitionId = parseInt(req.params.exhibitionId, 10);
      if (Number.isInteger(exhibitionId) && (industries !== undefined)) {
        const cleanIndustries = industries === null ? null : String(industries);
        const upd = await db.query(
          `UPDATE exhibitor_catalog_entries
             SET industries = $3,
                 updated_at = NOW()
           WHERE exhibitor_id = $1 AND exhibition_id = $2
           RETURNING id`,
          [exhibitorId, exhibitionId, cleanIndustries]
        );
        if (upd.rows.length === 0) {
          await db.query(
            `INSERT INTO exhibitor_catalog_entries (exhibitor_id, exhibition_id, industries)
             VALUES ($1, $2, $3)`,
            [exhibitorId, exhibitionId, cleanIndustries]
          );
        }
        // Upsert industries dictionary as well for suggestions
        if (cleanIndustries) {
          const list = cleanIndustries.split(',').map(s => s.trim()).filter(Boolean);
          for (const industry of list) {
            await db.query(
              `INSERT INTO catalog_industries(industry, usage_count) VALUES($1, 1)
               ON CONFLICT (industry) DO UPDATE SET usage_count = catalog_industries.usage_count + 1, updated_at = NOW()`,
              [industry]
            );
          }
        }
      }
    } catch (e) {
      console.error('⚠️ Error upserting event industries:', e);
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

// Exhibitor: delete product at index in GLOBAL products list
router.delete('/:exhibitionId/products/:index', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    const exhibitorId = await getLinkedExhibitorIdByEmail(req.user.email);
    if (!exhibitorId) return res.status(400).json({ success: false, message: 'Exhibitor not linked to user' });
    const idx = parseInt(req.params.index, 10);
    if (!Number.isInteger(idx) || idx < 0) return res.status(400).json({ success: false, message: 'Invalid product index' });

    const cur = await db.query(
      `SELECT products FROM exhibitor_catalog_entries WHERE exhibitor_id = $1 AND exhibition_id IS NULL ORDER BY updated_at DESC LIMIT 1`,
      [exhibitorId]
    );
    const list = Array.isArray(cur.rows?.[0]?.products) ? cur.rows[0].products : [];
    if (idx >= list.length) return res.status(404).json({ success: false, message: 'Product index out of range' });

    const next = list.filter((_, i) => i !== idx);

    const upd = await db.query(
      `UPDATE exhibitor_catalog_entries
         SET products = $2::jsonb,
             updated_at = NOW()
       WHERE exhibitor_id = $1 AND exhibition_id IS NULL
       RETURNING products`,
      [exhibitorId, JSON.stringify(next)]
    );

    return res.json({ success: true, message: 'Product deleted', data: upd.rows[0].products });
  } catch (error) {
    console.error('Error deleting product from catalog:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

module.exports = router;