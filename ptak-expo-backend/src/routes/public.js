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

// Public: JSON feed mirroring RSS structure
router.get('/rss.json', async (req, res) => {
  try {
    const siteTitle = 'PTAK EXPO – Wydarzenia';
    const siteLink = req.protocol + '://' + req.get('host');
    const siteDescription = 'Aktualny wykaz wydarzeń PTAK EXPO';

    const eventsRes = await db.query(
      `SELECT id, name, description, start_date, end_date, location, status
       FROM exhibitions
       ORDER BY start_date ASC`
    );

    const items = eventsRes.rows.map((ev) => {
      const itemLink = `${siteLink}/event/${ev.id}`;
      const pubDate = new Date(ev.start_date).toUTCString();
      return {
        title: ev.name || '',
        link: itemLink,
        guid: `exhibition-${ev.id}`,
        description: ev.description || '',
        category: ev.status || 'planned',
        pubDate,
        author: `info@ptak-expo.eu (${siteTitle})`,
        source: { url: `${siteLink}/public/rss`, title: 'PTAK EXPO' },
        id: ev.id,
        start_date: ev.start_date,
        end_date: ev.end_date,
        location: ev.location || null,
        status: ev.status || 'planned'
      };
    });

    const payload = {
      channel: {
        title: siteTitle,
        link: siteLink,
        description: siteDescription,
        language: 'pl-PL',
        lastBuildDate: new Date().toUTCString()
      },
      items
    };

    res.set('Content-Type', 'application/json; charset=utf-8');
    if (String(req.query.pretty || '').toLowerCase() === '1' || String(req.query.format || '') === 'pretty') {
      return res.send(JSON.stringify(payload, null, 2));
    }
    res.json(payload);
  } catch (error) {
    console.error('[public] rss.json error', error);
    res.status(500).json({ success: false, message: 'Error generating JSON feed' });
  }
});

// Public HTML index: browse exhibitions and exhibitors with ready links
router.get('/', async (req, res) => {
  try {
    const siteLink = req.protocol + '://' + req.get('host');
    const exhibitionsRes = await db.query(`
      SELECT id, name, description, start_date, end_date, location, status
      FROM exhibitions
      ORDER BY start_date DESC NULLS LAST, id DESC
    `);

    // For each exhibition, list assigned exhibitors with display name
    const exhibitions = [];
    for (const ev of exhibitionsRes.rows) {
      const exhibitorsRes = await db.query(`
        WITH assigned AS (
          SELECT e.id AS exhibitor_id
          FROM exhibitor_events ee
          JOIN exhibitors e ON e.id = ee.exhibitor_id
          WHERE ee.exhibition_id = $1
        ),
        specific AS (
          SELECT c.exhibitor_id, c.name, c.display_name, c.updated_at
          FROM exhibitor_catalog_entries c
          WHERE c.exhibition_id = $1
        ),
        global AS (
          SELECT DISTINCT ON (c.exhibitor_id)
                 c.exhibitor_id, c.name, c.display_name, c.updated_at
          FROM exhibitor_catalog_entries c
          WHERE c.exhibition_id IS NULL
          ORDER BY c.exhibitor_id, c.updated_at DESC
        )
        SELECT a.exhibitor_id,
               COALESCE(s.display_name, s.name, g.display_name, g.name, ex.company_name) AS display_name
        FROM assigned a
        LEFT JOIN specific s ON s.exhibitor_id = a.exhibitor_id
        LEFT JOIN global g ON g.exhibitor_id = a.exhibitor_id
        LEFT JOIN exhibitors ex ON ex.id = a.exhibitor_id
        ORDER BY COALESCE(s.display_name, s.name, g.display_name, g.name, ex.company_name) ASC
      `, [ev.id]);

      exhibitions.push({ ev, exhibitors: exhibitorsRes.rows });
    }

    const escapeHtml = (s) => String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PTAK EXPO – Public Feeds Index</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'; margin: 24px; color: #2e2e38; }
    h1 { margin: 0 0 16px; }
    .subtitle { color: #666; margin-bottom: 24px; }
    .exh { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; background: #fff; }
    .exh h2 { margin: 0 0 8px; font-size: 18px; }
    .meta { color: #555; font-size: 13px; margin-bottom: 8px; }
    ul { margin: 8px 0 0 18px; }
    li { margin: 4px 0; }
    a { color: #5041d0; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .links { font-size: 13px; margin-left: 6px; }
    .empty { color: #999; font-style: italic; }
  </style>
  </head>
  <body>
    <h1>PTAK EXPO – Public feeds</h1>
    <div class="subtitle">Przeglądaj wydarzenia i wystawców, a następnie pobieraj JSON / RSS bez podawania ID.</div>
    ${exhibitions.map(({ ev, exhibitors }) => {
      const period = [ev.start_date, ev.end_date].filter(Boolean).join(' – ');
      const head = `<div class="exh">
        <h2>${escapeHtml(ev.name || 'Wydarzenie')}</h2>
        <div class="meta">${escapeHtml(period)}${ev.location ? ' · ' + escapeHtml(ev.location) : ''}</div>
        <div><strong>Wystawcy:</strong></div>
        ${exhibitors.length === 0 ? '<div class="empty">Brak przypisanych wystawców</div>' : ''}
        <ul>
          ${exhibitors.map((x) => {
            const json = `${siteLink}/public/exhibitions/${encodeURIComponent(String(ev.id))}/exhibitors/${encodeURIComponent(String(x.exhibitor_id))}.json`;
            const rss = `${siteLink}/public/exhibitions/${encodeURIComponent(String(ev.id))}/exhibitors/${encodeURIComponent(String(x.exhibitor_id))}.rss`;
            return `<li>${escapeHtml(x.display_name || ('Wystawca #' + x.exhibitor_id))}
              <span class="links">[
                <a href="${json}">JSON</a> ·
                <a href="${rss}">RSS</a>
              ]</span>
            </li>`;
          }).join('')}
        </ul>
      </div>`;
      return head;
    }).join('')}
  </body>
</html>`;

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('[public] index page error', error);
    res.status(500).send('Failed to render public index');
  }
});

// Public: JSON feed with FULL exhibitor checklist data for a given exhibition and exhibitor
// GET /public/exhibitions/:exhibitionId/exhibitors/:exhibitorId.json
router.get('/exhibitions/:exhibitionId/exhibitors/:exhibitorId.json', async (req, res) => {
  try {
    const siteLink = req.protocol + '://' + req.get('host');
    const exhibitionId = parseInt(req.params.exhibitionId, 10);
    const exhibitorId = parseInt(req.params.exhibitorId, 10);
    if (!Number.isInteger(exhibitionId) || !Number.isInteger(exhibitorId)) {
      return res.status(400).json({ success: false, message: 'Invalid exhibitionId or exhibitorId' });
    }

    // Company/catalog entry – prefer specific (per exhibition), fallback to global, fallback to base exhibitor
    const companyRows = await db.query(`
      WITH specific AS (
        SELECT c.exhibitor_id, c.name, c.logo, c.description, c.contact_info, c.website, c.socials, c.contact_email,
               c.catalog_tags, c.products, c.brands, c.industries, c.display_name, c.why_visit
        FROM exhibitor_catalog_entries c
        WHERE c.exhibition_id = $1 AND c.exhibitor_id = $2
      ),
      global AS (
        SELECT DISTINCT ON (c.exhibitor_id)
               c.exhibitor_id, c.name, c.logo, c.description, c.contact_info, c.website, c.socials, c.contact_email,
               c.catalog_tags, c.products, c.brands, c.industries, c.display_name, c.why_visit, c.updated_at
        FROM exhibitor_catalog_entries c
        WHERE c.exhibition_id IS NULL AND c.exhibitor_id = $2
        ORDER BY c.exhibitor_id, c.updated_at DESC
      ),
      base AS (
        SELECT id AS exhibitor_id, company_name AS name, NULL::text AS logo, NULL::text AS description,
               contact_person AS contact_info, NULL::text AS website, NULL::text AS socials, email AS contact_email,
               NULL::text AS catalog_tags, '[]'::jsonb AS products, NULL::text AS brands, NULL::text AS industries,
               NULL::text AS display_name, NULL::text AS why_visit
        FROM exhibitors WHERE id = $2
      )
      SELECT COALESCE(s.name, g.name, b.name) AS name,
             COALESCE(s.logo, g.logo) AS logo,
             COALESCE(s.description, g.description, b.description) AS description,
             COALESCE(s.contact_info, g.contact_info, b.contact_info) AS contact_info,
             COALESCE(s.website, g.website, b.website) AS website,
             COALESCE(s.socials, g.socials, b.socials) AS socials,
             COALESCE(s.contact_email, g.contact_email, b.contact_email) AS contact_email,
             COALESCE(s.catalog_tags, g.catalog_tags, b.catalog_tags) AS catalog_tags,
             COALESCE(s.products, g.products, b.products) AS products,
             COALESCE(s.brands, g.brands, b.brands) AS brands,
             COALESCE(s.industries, g.industries, b.industries) AS industries,
             COALESCE(s.display_name, g.display_name, b.display_name) AS display_name,
             COALESCE(s.why_visit, g.why_visit, b.why_visit) AS why_visit
      FROM specific s
      FULL OUTER JOIN global g ON true
      FULL OUTER JOIN base b ON true
      LIMIT 1
    `, [exhibitionId, exhibitorId]);

    const company = companyRows.rows[0] || {};

    // Events for exhibitor at exhibition (include all fields)
    const eventsRes = await db.query(`
      SELECT id, exhibition_id, exhibitor_id, name, event_date, start_time, end_time, hall, organizer, description, type, link, created_at, updated_at
      FROM trade_events
      WHERE exhibition_id = $1 AND exhibitor_id = $2
      ORDER BY event_date ASC, start_time ASC
    `, [exhibitionId, exhibitorId]);

    // Documents for exhibitor at exhibition with download URLs
    const docsRes = await db.query(`
      SELECT id, title, description, file_name, original_name, file_size, mime_type, category, created_at
      FROM exhibitor_documents
      WHERE exhibitor_id = $1 AND exhibition_id = $2
      ORDER BY category, created_at DESC
    `, [exhibitorId, exhibitionId]);

    // Electronic IDs (people) for exhibitor
    const peopleRes = await db.query(`
      SELECT id, full_name, position, email, created_at
      FROM exhibitor_people
      WHERE exhibitor_id = $1 AND exhibition_id = $2
      ORDER BY created_at DESC
    `, [exhibitorId, exhibitionId]);

    const documents = docsRes.rows.map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      category: d.category,
      fileName: d.file_name,
      originalName: d.original_name,
      fileSize: d.file_size,
      mimeType: d.mime_type,
      createdAt: d.created_at,
      downloadUrl: `${siteLink}/public/exhibitions/${encodeURIComponent(String(exhibitionId))}/exhibitors/${encodeURIComponent(String(exhibitorId))}/documents/${encodeURIComponent(String(d.id))}/download`
    }));

    // Build payload
    const payload = {
      success: true,
      exhibitionId,
      exhibitorId,
      companyInfo: {
        name: company.name || null,
        displayName: company.display_name || null,
        logo: company.logo || null,
        description: company.description || null,
        whyVisit: company.why_visit || null,
        contactInfo: company.contact_info || null,
        website: company.website || null,
        socials: company.socials || null,
        contactEmail: company.contact_email || null,
        catalogTags: company.catalog_tags || null,
        brands: company.brands || null,
        industries: company.industries || null
      },
      products: Array.isArray(company.products) ? company.products : (typeof company.products === 'string' ? (() => { try { return JSON.parse(company.products); } catch { return []; } })() : []),
      events: eventsRes.rows,
      documents
    };

    res.set('Content-Type', 'application/json; charset=utf-8');
    res.json(payload);
  } catch (error) {
    console.error('[public] exhibitor checklist json error', error);
    res.status(500).json({ success: false, message: 'Failed to generate exhibitor JSON feed' });
  }
});

// Public: RSS feed with exhibitor checklist data (company, products, events, documents)
// GET /public/exhibitions/:exhibitionId/exhibitors/:exhibitorId.rss
router.get('/exhibitions/:exhibitionId/exhibitors/:exhibitorId.rss', async (req, res) => {
  try {
    const siteTitle = 'PTAK EXPO – Wystawca – Checklista';
    const siteLink = req.protocol + '://' + req.get('host');
    const exhibitionId = parseInt(req.params.exhibitionId, 10);
    const exhibitorId = parseInt(req.params.exhibitorId, 10);
    if (!Number.isInteger(exhibitionId) || !Number.isInteger(exhibitorId)) {
      return res.status(400).send('Invalid exhibitionId or exhibitorId');
    }

    // Fetch JSON payload from the handler above (reuse logic indirectly)
    // We replicate minimal queries here to avoid an extra HTTP call
    const companyRows = await db.query(`
      WITH specific AS (
        SELECT c.exhibitor_id, c.name, c.logo, c.description, c.contact_info, c.website, c.socials, c.contact_email,
               c.catalog_tags, c.products, c.brands, c.industries, c.display_name, c.why_visit
        FROM exhibitor_catalog_entries c
        WHERE c.exhibition_id = $1 AND c.exhibitor_id = $2
      ),
      global AS (
        SELECT DISTINCT ON (c.exhibitor_id)
               c.exhibitor_id, c.name, c.logo, c.description, c.contact_info, c.website, c.socials, c.contact_email,
               c.catalog_tags, c.products, c.brands, c.industries, c.display_name, c.why_visit, c.updated_at
        FROM exhibitor_catalog_entries c
        WHERE c.exhibition_id IS NULL AND c.exhibitor_id = $2
        ORDER BY c.exhibitor_id, c.updated_at DESC
      ),
      base AS (
        SELECT id AS exhibitor_id, company_name AS name, NULL::text AS logo, NULL::text AS description,
               contact_person AS contact_info, NULL::text AS website, NULL::text AS socials, email AS contact_email,
               NULL::text AS catalog_tags, '[]'::jsonb AS products, NULL::text AS brands, NULL::text AS industries,
               NULL::text AS display_name, NULL::text AS why_visit
        FROM exhibitors WHERE id = $2
      )
      SELECT COALESCE(s.name, g.name, b.name) AS name,
             COALESCE(s.logo, g.logo) AS logo,
             COALESCE(s.description, g.description, b.description) AS description,
             COALESCE(s.contact_info, g.contact_info, b.contact_info) AS contact_info,
             COALESCE(s.website, g.website, b.website) AS website,
             COALESCE(s.socials, g.socials, b.socials) AS socials,
             COALESCE(s.contact_email, g.contact_email, b.contact_email) AS contact_email,
             COALESCE(s.catalog_tags, g.catalog_tags, b.catalog_tags) AS catalog_tags,
             COALESCE(s.products, g.products, b.products) AS products,
             COALESCE(s.brands, g.brands, b.brands) AS brands,
             COALESCE(s.industries, g.industries, b.industries) AS industries,
             COALESCE(s.display_name, g.display_name, b.display_name) AS display_name,
             COALESCE(s.why_visit, g.why_visit, b.why_visit) AS why_visit
      FROM specific s
      FULL OUTER JOIN global g ON true
      FULL OUTER JOIN base b ON true
      LIMIT 1
    `, [exhibitionId, exhibitorId]);

    const company = companyRows.rows[0] || {};

    const eventsRes = await db.query(`
      SELECT id, name, event_date, start_time, end_time, hall, organizer, description, type, link, created_at
      FROM trade_events
      WHERE exhibition_id = $1 AND exhibitor_id = $2
      ORDER BY event_date ASC, start_time ASC
    `, [exhibitionId, exhibitorId]);

    const docsRes = await db.query(`
      SELECT id, title, description, file_name, original_name, file_size, mime_type, category, created_at
      FROM exhibitor_documents
      WHERE exhibitor_id = $1 AND exhibition_id = $2
      ORDER BY category, created_at DESC
    `, [exhibitorId, exhibitionId]);


    const escapeXml = (s) => String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Build items: company, products, events, documents
    const items = [];

    // Company item
    const companyDesc = [
      company.description ? `Opis: ${escapeXml(company.description)}` : '',
      company.why_visit ? `Dlaczego warto odwiedzić: ${escapeXml(company.why_visit)}` : '',
      company.contact_info ? `Kontakt: ${escapeXml(company.contact_info)}` : '',
      company.website ? `Strona: ${escapeXml(company.website)}` : '',
      company.socials ? `Socials: ${escapeXml(company.socials)}` : '',
      company.contact_email ? `Email: ${escapeXml(company.contact_email)}` : '',
      company.catalog_tags ? `Tagi: ${escapeXml(company.catalog_tags)}` : '',
      company.brands ? `Marki: ${escapeXml(company.brands)}` : '',
      company.industries ? `Branże: ${escapeXml(company.industries)}` : ''
    ].filter(Boolean).join(' | ');

    items.push(
      `      <item>
        <title>${escapeXml(company.display_name || company.name || 'Firma')}</title>
        <link>${siteLink}/public/exhibitions/${exhibitionId}/exhibitors/${exhibitorId}.json</link>
        <guid isPermaLink="false">company-${exhibitorId}-${exhibitionId}</guid>
        <description>${companyDesc}</description>
        <category>company</category>
        <pubDate>${new Date().toUTCString()}</pubDate>
      </item>`
    );

    // Products items (if any)
    const products = Array.isArray(company.products) ? company.products : (typeof company.products === 'string' ? (() => { try { return JSON.parse(company.products); } catch { return []; } })() : []);
    products.forEach((p, idx) => {
      const pDesc = [p.description ? escapeXml(p.description) : '', Array.isArray(p.tags) ? `Tagi: ${escapeXml(p.tags.join(', '))}` : ''].filter(Boolean).join(' | ');
      items.push(
        `      <item>
        <title>${escapeXml(p.name || 'Produkt')}</title>
        <link>${escapeXml(p.img || (siteLink + '/public'))}</link>
        <guid isPermaLink="false">product-${exhibitorId}-${exhibitionId}-${idx}</guid>
        <description>${pDesc}</description>
        <category>product</category>
        <pubDate>${new Date().toUTCString()}</pubDate>
      </item>`
      );
    });

    // Events items
    eventsRes.rows.forEach((ev) => {
      const timeRange = [ev.start_time, ev.end_time].filter(Boolean).join(' - ');
      const evDesc = [
        ev.description ? escapeXml(ev.description) : '',
        ev.hall ? `Hala: ${escapeXml(ev.hall)}` : '',
        ev.organizer ? `Organizator: ${escapeXml(ev.organizer)}` : '',
        ev.type ? `Typ: ${escapeXml(ev.type)}` : '',
        timeRange ? `Godziny: ${escapeXml(timeRange)}` : ''
      ].filter(Boolean).join(' | ');
      items.push(
        `      <item>
        <title>${escapeXml(ev.name || 'Wydarzenie')}</title>
        <link>${escapeXml(ev.link || (siteLink + '/public'))}</link>
        <guid isPermaLink="false">event-${ev.id}</guid>
        <description>${evDesc}</description>
        <category>event</category>
        <pubDate>${new Date(ev.event_date || ev.created_at || Date.now()).toUTCString()}</pubDate>
      </item>`
      );
    });

    // Documents items (include enclosure for download)
    docsRes.rows.forEach((d) => {
      const downloadUrl = `${siteLink}/public/exhibitions/${encodeURIComponent(String(exhibitionId))}/exhibitors/${encodeURIComponent(String(exhibitorId))}/documents/${encodeURIComponent(String(d.id))}/download`;
      const desc = [d.description ? escapeXml(d.description) : '', d.category ? `Kategoria: ${escapeXml(d.category)}` : ''].filter(Boolean).join(' | ');
      items.push(
        `      <item>
        <title>${escapeXml(d.title || d.original_name || 'Dokument')}</title>
        <link>${downloadUrl}</link>
        <guid isPermaLink="false">doc-${d.id}</guid>
        <description>${desc}</description>
        <category>document</category>
        <pubDate>${new Date(d.created_at || Date.now()).toUTCString()}</pubDate>
        <enclosure url="${downloadUrl}" length="${d.file_size || 0}" type="${escapeXml(d.mime_type || 'application/octet-stream')}" />
      </item>`
      );
    });

    // Electronic IDs items
    const peopleRes = await db.query(`
      SELECT id, full_name, position, email, created_at
      FROM exhibitor_people
      WHERE exhibitor_id = $1 AND exhibition_id = $2
      ORDER BY created_at DESC
    `, [exhibitorId, exhibitionId]);
    peopleRes.rows.forEach((p) => {
      const pDesc = [p.position ? `Rola: ${escapeXml(p.position)}` : '', p.email ? `Email: ${escapeXml(p.email)}` : ''].filter(Boolean).join(' | ');
      items.push(
        `      <item>
        <title>${escapeXml(p.full_name || 'Osoba')}</title>
        <link>${siteLink}/public/exhibitions/${exhibitionId}/exhibitors/${exhibitorId}.json</link>
        <guid isPermaLink="false">person-${p.id}</guid>
        <description>${pDesc}</description>
        <category>electronic_id</category>
        <pubDate>${new Date(p.created_at || Date.now()).toUTCString()}</pubDate>
      </item>`
      );
    });

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${siteTitle}</title>
    <link>${siteLink}</link>
    <description>Checklist danych wystawcy dla wydarzenia</description>
    <language>pl-PL</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>`;

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(rssXml);
  } catch (error) {
    console.error('[public] exhibitor checklist rss error', error);
    res.status(500).send('Failed to generate exhibitor RSS feed');
  }
});

module.exports = router;


