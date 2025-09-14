const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

// Public: list all exhibitions ordered by start_date (JSON)
router.get('/exhibitions', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, description, start_date, end_date, location, status
       FROM exhibitions
       ORDER BY start_date ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[public] list exhibitions error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exhibitions' });
  }
});

// Public: list exhibitors for a given exhibition with catalog details and products
router.get('/exhibitions/:exhibitionId/exhibitors', async (req, res) => {
  try {
    const exhibitionId = parseInt(req.params.exhibitionId, 10);
    if (!Number.isInteger(exhibitionId)) {
      return res.status(400).json({ success: false, message: 'Invalid exhibition id' });
    }

    // Exhibitors assigned to this exhibition
    // Prefer event-specific catalog entry; fallback to GLOBAL; fallback to exhibitors base
    const rows = await db.query(
      `WITH assigned AS (
         SELECT e.id AS exhibitor_id
         FROM exhibitor_events ee
         JOIN exhibitors e ON e.id = ee.exhibitor_id
         WHERE ee.exhibition_id = $1
       ),
       specific AS (
         SELECT c.exhibitor_id, c.name, c.logo, c.description, c.contact_info, c.website, c.socials, c.contact_email, c.catalog_tags, c.products
         FROM exhibitor_catalog_entries c
         WHERE c.exhibition_id = $1
       ),
       global AS (
         SELECT DISTINCT ON (c.exhibitor_id)
                c.exhibitor_id, c.name, c.logo, c.description, c.contact_info, c.website, c.socials, c.contact_email, c.catalog_tags, c.products, c.updated_at
         FROM exhibitor_catalog_entries c
         WHERE c.exhibition_id IS NULL
         ORDER BY c.exhibitor_id, c.updated_at DESC
       ),
       base AS (
         SELECT id AS exhibitor_id, company_name AS name, NULL::text AS logo, NULL::text AS description,
                contact_person AS contact_info, NULL::text AS website, NULL::text AS socials, email AS contact_email,
                NULL::text AS catalog_tags, '[]'::jsonb AS products
         FROM exhibitors
       )
       SELECT a.exhibitor_id,
              COALESCE(s.name, g.name, b.name) AS name,
              COALESCE(s.logo, g.logo) AS logo,
              COALESCE(s.description, g.description, b.description) AS description,
              COALESCE(s.contact_info, g.contact_info, b.contact_info) AS contact_info,
              COALESCE(s.website, g.website, b.website) AS website,
              COALESCE(
                CASE WHEN s.socials IS NOT NULL AND s.socials ~ '^[\n\r\t ]*[\[{]'
                     THEN s.socials::jsonb ELSE NULL END,
                CASE WHEN g.socials IS NOT NULL AND g.socials ~ '^[\n\r\t ]*[\[{]'
                     THEN g.socials::jsonb ELSE NULL END,
                '{}'::jsonb
              ) AS socials,
              COALESCE(s.contact_email, g.contact_email, b.contact_email) AS contact_email,
              COALESCE(s.catalog_tags, g.catalog_tags, b.catalog_tags) AS catalog_tags,
              COALESCE(s.products, g.products, b.products) AS products
       FROM assigned a
       LEFT JOIN specific s ON s.exhibitor_id = a.exhibitor_id
       LEFT JOIN global g ON g.exhibitor_id = a.exhibitor_id
       LEFT JOIN base b ON b.exhibitor_id = a.exhibitor_id
       ORDER BY COALESCE(s.name, g.name, b.name) ASC`,
      [exhibitionId]
    );

    res.json({ success: true, exhibitionId, exhibitors: rows.rows });
  } catch (error) {
    console.error('[public] list exhibitors for exhibition error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exhibitors' });
  }
});

// Public: RSS feed of exhibitions ordered by start_date
router.get('/rss', async (req, res) => {
  try {
    const siteTitle = 'PTAK EXPO – Wydarzenia';
    const siteLink = req.protocol + '://' + req.get('host');
    const siteDescription = 'Aktualny wykaz wydarzeń PTAK EXPO';

    const eventsRes = await db.query(
      `SELECT id, name, description, start_date, end_date, location, status
       FROM exhibitions
       ORDER BY start_date ASC`
    );

    const itemsXml = eventsRes.rows.map((ev) => {
      const itemLink = `${siteLink}/event/${ev.id}`;
      const pubDate = new Date(ev.start_date).toUTCString();
      const desc = (ev.description || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const title = String(ev.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const loc = ev.location ? `, ${String(ev.location).replace(/&/g, '&amp;')}` : '';
      return `\n      <item>\n        <title>${title}</title>\n        <link>${itemLink}</link>\n        <guid isPermaLink="false">exhibition-${ev.id}</guid>\n        <description>${desc}</description>\n        <category>${ev.status || 'planned'}</category>\n        <pubDate>${pubDate}</pubDate>\n        <author>info@ptak-expo.eu (${siteTitle})</author>\n        <source url="${siteLink}/public/rss">PTAK EXPO</source>\n      </item>`;
    }).join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${siteTitle}</title>\n    <link>${siteLink}</link>\n    <description>${siteDescription}</description>\n    <language>pl-PL</language>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${itemsXml}\n  </channel>\n</rss>`;

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(rssXml);
  } catch (error) {
    console.error('[public] rss error', error);
    res.status(500).send('Error generating RSS');
  }
});

module.exports = router;


