const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
let sharp;
try { sharp = require('sharp'); } catch (_) { sharp = null; }

// Resolve a font buffer that supports Polish glyphs
let cachedFontBuffer = null;
async function resolveFontBuffer() {
  if (cachedFontBuffer) return cachedFontBuffer;
  // 1) Env path
  const fp = process.env.ID_PDF_FONT_PATH && process.env.ID_PDF_FONT_PATH.trim();
  if (fp) { try { cachedFontBuffer = fs.readFileSync(fp); return cachedFontBuffer; } catch {} }
  // 2) Env URL
  const fu = process.env.ID_PDF_FONT_URL && process.env.ID_PDF_FONT_URL.trim();
  if (fu) { try { const r = await fetch(fu); if (r.ok) { cachedFontBuffer = Buffer.from(await r.arrayBuffer()); return cachedFontBuffer; } } catch {} }
  // 3) System fonts
  const candidates = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
  ];
  for (const p of candidates) {
    try { if (fs.existsSync(p)) { cachedFontBuffer = fs.readFileSync(p); return cachedFontBuffer; } } catch {}
  }
  // 4) Remote Noto Sans fallback
  try {
    const noto = 'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf';
    const r = await fetch(noto);
    if (r.ok) { cachedFontBuffer = Buffer.from(await r.arrayBuffer()); return cachedFontBuffer; }
  } catch {}
  return null;
}

// Helper to resolve uploads base for reading branding assets
const getUploadsBase = () => {
  if (process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim().length > 0) {
    return path.resolve(process.env.UPLOADS_DIR);
  }
  if (fs.existsSync('/data/uploads')) return '/data/uploads';
  return path.join(__dirname, '../../uploads');
};

// Build Identifier PDF buffer (A6) with event branding and QR
// payload: { personName, personEmail, accessCode?, personType? }
// exhibitorId: prefer exhibitor-specific header branding if provided
async function buildIdentifierPdf(client, exhibitionId, payload, exhibitorId) {
  // Fetch minimal event info
  const evRes = await client.query(
    'SELECT id, name, start_date, end_date, location FROM exhibitions WHERE id = $1',
    [exhibitionId]
  );
  if (evRes.rows.length === 0) return null;
  const ev = evRes.rows[0];

  // Time range from trade_info (exhibitor hours preferred)
  let timeRange = '';
  try {
    const t = await client.query(
      'SELECT exhibitor_start_time, exhibitor_end_time, visitor_start_time, visitor_end_time FROM trade_info WHERE exhibition_id = $1',
      [exhibitionId]
    );
    if (t.rows.length > 0) {
      const row = t.rows[0];
      const toHm = (v) => (v ? String(v).slice(0, 5) : '');
      if (row.exhibitor_start_time && row.exhibitor_end_time) {
        timeRange = `${toHm(row.exhibitor_start_time)}–${toHm(row.exhibitor_end_time)}`;
      } else if (row.visitor_start_time && row.visitor_end_time) {
        timeRange = `${toHm(row.visitor_start_time)}–${toHm(row.visitor_end_time)}`;
      }
    }
  } catch {}

  // Branding header image (fallbacks) and footer logo (catalog logo if available)
  let headerImageSource = null; // string path or Buffer
  let footerLogoSource = null;  // string path or Buffer
  try {
    const uploadsBase = getUploadsBase();

    // Header: prefer exhibitor-specific 'kolorowe_tlo_logo_wydarzenia' if exhibitorId provided
    if (exhibitorId) {
      const hEx = await client.query(
        `SELECT file_path, file_blob FROM exhibitor_branding_files
         WHERE exhibitor_id = $1 AND exhibition_id = $2 AND file_type = 'kolorowe_tlo_logo_wydarzenia'
         ORDER BY created_at DESC LIMIT 1`,
        [exhibitorId, exhibitionId]
      );
      if (hEx.rows.length > 0) {
        const row = hEx.rows[0];
        if (row.file_blob) {
          headerImageSource = row.file_blob; // buffer
        } else if (row.file_path) {
          const normalized = String(row.file_path).startsWith('uploads/')
            ? String(row.file_path).replace(/^uploads\//, '')
            : String(row.file_path);
          const resolved = path.join(uploadsBase, normalized);
          if (fs.existsSync(resolved)) headerImageSource = resolved;
        }
      }
    }

    // If not found, fallback to global: 'kolorowe_tlo_logo_wydarzenia' → 'tlo_wydarzenia_logo_zaproszenia' → 'event_logo'
    const headerTypes = [
      'kolorowe_tlo_logo_wydarzenia',
      'tlo_wydarzenia_logo_zaproszenia',
      'event_logo',
    ];
    for (const fileType of headerTypes) {
      if (headerImageSource) break;
      const h = await client.query(
        `SELECT file_path, file_blob FROM exhibitor_branding_files
         WHERE exhibitor_id IS NULL AND exhibition_id = $1 AND file_type = $2
         ORDER BY created_at DESC LIMIT 1`,
        [exhibitionId, fileType]
      );
      if (h.rows.length > 0) {
        const row = h.rows[0];
        if (row.file_blob) {
          headerImageSource = row.file_blob; // buffer
        } else if (row.file_path) {
          const normalized = String(row.file_path).startsWith('uploads/')
            ? String(row.file_path).replace(/^uploads\//, '')
            : String(row.file_path);
          const resolved = path.join(uploadsBase, normalized);
          if (fs.existsSync(resolved)) { headerImageSource = resolved; }
        }
      }
    }

    // Footer: prefer exhibitor's catalog logo (event-specific, then GLOBAL), fallback to branding 'logo_ptak_expo'
    try {
      if (typeof exhibitorId === 'number' && exhibitorId > 0) {
        // 1) Event-specific catalog logo for this exhibitor
        let row = null;
        try {
          const res1 = await client.query(
            `SELECT logo FROM exhibitor_catalog_entries 
             WHERE exhibitor_id = $1 AND exhibition_id = $2 AND logo IS NOT NULL
             ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
             LIMIT 1`,
            [exhibitorId, exhibitionId]
          );
          row = res1.rows?.[0] || null;
        } catch {}
        // 2) GLOBAL catalog logo for this exhibitor
        if (!row || !row.logo) {
          try {
            const res2 = await client.query(
              `SELECT logo FROM exhibitor_catalog_entries 
               WHERE exhibitor_id = $1 AND exhibition_id IS NULL AND logo IS NOT NULL
               ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
               LIMIT 1`,
              [exhibitorId]
            );
            row = res2.rows?.[0] || row;
          } catch {}
        }
        if (row && row.logo) {
          const logoVal = String(row.logo).trim();
          if (/^data:image\//.test(logoVal)) {
            const base64 = logoVal.split(',')[1] || '';
            try { footerLogoSource = Buffer.from(base64, 'base64'); } catch {}
          } else if (/^https?:\/\//i.test(logoVal)) {
            try { const r = await fetch(logoVal); if (r.ok) footerLogoSource = Buffer.from(await r.arrayBuffer()); } catch {}
          } else if (/^\/?api\//i.test(logoVal)) {
            // Relative API URL (e.g. /api/v1/exhibitor-branding/serve/global/<file>) → build absolute and fetch
            const base = (process.env.PUBLIC_BASE_URL && process.env.PUBLIC_BASE_URL.trim())
              ? process.env.PUBLIC_BASE_URL.trim().replace(/\/$/, '')
              : 'http://localhost:3001';
            const abs = logoVal.startsWith('/') ? `${base}${logoVal}` : `${base}/${logoVal}`;
            try { const r = await fetch(abs); if (r.ok) footerLogoSource = Buffer.from(await r.arrayBuffer()); } catch {}
          } else {
            // Try file on disk under uploads
            const normalized = logoVal.startsWith('uploads/') ? logoVal.replace(/^uploads\//, '') : logoVal;
            let resolved = path.join(uploadsBase, normalized);
            
            // Check if file exists on disk
            if (fs.existsSync(resolved)) {
              footerLogoSource = resolved;
            } else {
              // Try alternative locations for backward compatibility
              const altPaths = [
                path.join(uploadsBase, logoVal), // Try original value
                path.join(uploadsBase, 'exhibitor-documents', normalized), // Try in exhibitor-documents
              ];
              
              for (const altPath of altPaths) {
                if (fs.existsSync(altPath)) {
                  footerLogoSource = altPath;
                  break;
                }
              }
              
              // If still not found, try fetching via HTTP as absolute URL
              if (!footerLogoSource && !logoVal.startsWith('/')) {
                const base = (process.env.PUBLIC_BASE_URL && process.env.PUBLIC_BASE_URL.trim())
                  ? process.env.PUBLIC_BASE_URL.trim().replace(/\/$/, '')
                  : 'http://localhost:3001';
                const absUrl = logoVal.startsWith('uploads/') 
                  ? `${base}/${logoVal}` 
                  : `${base}/uploads/${logoVal}`;
                try { 
                  const r = await fetch(absUrl); 
                  if (r.ok) footerLogoSource = Buffer.from(await r.arrayBuffer()); 
                } catch {}
              }
              
              // Last resort: try global branding endpoint using just filename
              if (!footerLogoSource) {
                const fileName = normalized.split('/').pop();
                if (fileName) {
                  const base = (process.env.PUBLIC_BASE_URL && process.env.PUBLIC_BASE_URL.trim())
                    ? process.env.PUBLIC_BASE_URL.trim().replace(/\/$/, '')
                    : 'http://localhost:3001';
                  const url = `${base}/api/v1/exhibitor-branding/serve/global/${encodeURIComponent(fileName)}`;
                  try { const r = await fetch(url); if (r.ok) footerLogoSource = Buffer.from(await r.arrayBuffer()); } catch {}
                }
              }
            }
          }
        }
      }
    } catch {}

    if (!footerLogoSource) {
      const f = await client.query(
        `SELECT file_path, file_blob FROM exhibitor_branding_files
         WHERE exhibitor_id IS NULL AND exhibition_id = $1 AND file_type = 'logo_ptak_expo'
         ORDER BY created_at DESC LIMIT 1`,
        [exhibitionId]
      );
      if (f.rows.length > 0) {
        const row = f.rows[0];
        if (row.file_blob) {
          footerLogoSource = row.file_blob; // buffer
        } else if (row.file_path) {
          const normalized = String(row.file_path).startsWith('uploads/')
            ? String(row.file_path).replace(/^uploads\//, '')
            : String(row.file_path);
          const resolved = path.join(uploadsBase, normalized);
          if (fs.existsSync(resolved)) footerLogoSource = resolved;
        }
      }
    }
  } catch {}

  // Normalize image to PNG buffer usable by PDFKit, optionally resizing to target pixel box
  const toPdfImageBuffer = async (input, targetPx) => {
    try {
      if (!input) return null;
      let buf;
      if (Buffer.isBuffer(input)) {
        buf = input;
      } else if (typeof input === 'string') {
        try { buf = fs.readFileSync(input); } catch { buf = null; }
      }
      if (!buf) return null;
      if (!sharp) {
        // Fallback: hope it's PNG/JPEG already
        return buf;
      }
      // Convert any format (webp/svg/…) to PNG for reliable embedding
      let img = sharp(buf);
      if (targetPx && (targetPx.width || targetPx.height)) {
        img = img.resize(targetPx.width || null, targetPx.height || null, { fit: 'inside', withoutEnlargement: true });
      }
      return await img.png().toBuffer();
    } catch {
      return null;
    }
  };

  // Prepare QR image buffer (use accessCode if provided, otherwise generate proper one)
  let qrBuffer = null;
  try {
    let qrData = payload && payload.accessCode ? String(payload.accessCode) : null;
    
    // If no accessCode provided, generate proper one according to QR algorithm
    // Format: [Exhibition Name][Exhibition ID (4 digits)][Exhibitor ID with "w" (4 digits)][Entry ID (9 digits)][rnd + 6 digits][Entry ID repeated]
    if (!qrData) {
      const eventCode = String(ev.name || '').replace(/\s+/g, ' ').trim();
      const eventIdPadded = String(ev.id).padStart(4, '0').slice(-4);
      // Changed to 4 digits for no collisions (backward compatible with 3-digit codes)
      const exhibitorIdPadded = 'w' + String(exhibitorId || 0).padStart(4, '0').slice(-4);
      const entryId = (() => {
        const ts = Date.now().toString().slice(-6);
        const rnd = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
        return ts.slice(0,3) + rnd.slice(0,3) + ts.slice(3);
      })();
      const rndSuffix = 'rnd' + Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
      qrData = `${eventCode}${eventIdPadded}${exhibitorIdPadded}${entryId}${rndSuffix}${entryId}`;
      console.log('[identifierPdf] Generated accessCode (no accessCode provided):', qrData);
    }
    
    // Request high-resolution QR (for crisp print at ~300 DPI when scaled down)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrData)}`;
    const resp = await fetch(qrUrl);
    if (resp.ok) qrBuffer = Buffer.from(await resp.arrayBuffer());
  } catch {}

  // Create PDF and set font
  const doc = new PDFDocument({ size: 'A6', margin: 12 });
  const chunks = [];
  try {
    const fontBuf = await resolveFontBuffer();
    if (fontBuf) doc.font(fontBuf); else doc.font('Helvetica');
  } catch { try { doc.font('Helvetica'); } catch {} }

  // Calculate layout and target pixel sizes BEFORE drawing
  const pageW = doc.page.width;
  const cardX = 10;
  const cardW = pageW - 20;
  const headerH = 120;
  const toPx = (points) => Math.max(1, Math.round((points / 72) * 300));

  // Precompute normalized buffers before drawing to avoid race conditions
  const headerBuffer = await toPdfImageBuffer(headerImageSource, { width: toPx(cardW), height: toPx(headerH) });
  const footerBuffer = await toPdfImageBuffer(footerLogoSource, { width: toPx(cardW / 2), height: toPx(40) });

  return await new Promise((resolve) => {
    doc.on('data', (d) => chunks.push(d));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Background card
    doc.save();
    doc.roundedRect(cardX, 10, cardW, doc.page.height - 20, 12).fill('#FFFFFF');
    doc.restore();

    // Header image
    doc.save();
    doc.roundedRect(cardX, 10, cardW, doc.page.height - 20, 12).clip();
    try {
      if (headerBuffer) {
        doc.image(headerBuffer, cardX, 10, { width: cardW, height: headerH, fit: [cardW, headerH] });
      } else {
        doc.rect(cardX, 10, cardW, headerH).fill('#5a6ec8');
      }
    } catch {}
    doc.restore();

    let y = 10 + headerH + 14;
    const formatDate = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`;
    };

    // Title
    doc.fontSize(12).fillColor('#2E2E38').text(ev.name || 'Wydarzenie', cardX + 12, y, { width: cardW - 24 });
    y = doc.y + 8;

    // Date and time
    doc.fontSize(9).fillColor('#333').text('Data', cardX + 12, y);
    y = doc.y + 4;
    doc.fillColor('#000').text(`${formatDate(ev.start_date)} – ${formatDate(ev.end_date)}`, cardX + 12, y, { width: cardW - 24 });
    y = doc.y + 10;

    // Name
    doc.fillColor('#333').text('Imię i nazwisko', cardX + 12, y);
    y = doc.y + 4;
    doc.fillColor('#000').fontSize(10).text(payload?.personName || '', cardX + 12, y, { width: cardW - 24 });
    y = doc.y + 8;

    // Role/Type
    doc.fillColor('#333').fontSize(9).text('Rola', cardX + 12, y);
    y = doc.y + 4;
    const personType = payload?.personType || 'Gość';
    doc.fillColor('#000').fontSize(10).text(personType, cardX + 12, y, { width: cardW - 24 });

    // Dashed separator
    y = y + 12;
    doc.save();
    doc.dash(3, { space: 3 });
    doc.moveTo(cardX + 12, y).lineTo(cardX + cardW - 12, y).stroke('#CCCCCC');
    doc.undash();
    doc.restore();

    // Footer: logo left, QR right
    const qrSize = 70; // points (~0.97")
    const qrX = cardX + cardW - 12 - qrSize;
    try {
      if (qrBuffer) {
        doc.image(qrBuffer, qrX, y + 8, { width: qrSize, height: qrSize });
      }
    } catch {}
    try {
      const logoBoxW = qrX - (cardX + 12) - 8;
      const logoMaxH = 40;
      if (footerBuffer) {
        doc.image(footerBuffer, cardX + 12, y + 8, { fit: [logoBoxW, logoMaxH], align: 'left' });
      } else {
        // fallback text logo
        try { /* keep current font */ } catch {}
        doc.fontSize(11).fillColor('#2E2E38').text('PTAK WARSAW EXPO', cardX + 12, y + 8);
      }
    } catch {}

    doc.end();
  });
}

module.exports = { buildIdentifierPdf };


