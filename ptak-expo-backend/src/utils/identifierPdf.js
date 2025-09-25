const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Try to resolve a font that supports Polish glyphs
const resolveFontPath = () => {
  const candidates = [
    process.env.ID_PDF_FONT_PATH && process.env.ID_PDF_FONT_PATH.trim(),
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
  ].filter(Boolean);
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return null;
};

// Helper to resolve uploads base for reading branding assets
const getUploadsBase = () => {
  if (process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim().length > 0) {
    return path.resolve(process.env.UPLOADS_DIR);
  }
  if (fs.existsSync('/data/uploads')) return '/data/uploads';
  return path.join(__dirname, '../../uploads');
};

// Build Identifier PDF buffer (A6) with event branding and QR
// payload: { personName, personEmail, accessCode? }
async function buildIdentifierPdf(client, exhibitionId, payload) {
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

  // Branding header image (fallbacks) and footer logo
  let headerImagePath = null;
  let footerLogoPath = null;
  try {
    const uploadsBase = getUploadsBase();

    // Header: prefer 'kolorowe_tlo_logo_wydarzenia', then 'tlo_wydarzenia_logo_zaproszenia', then 'event_logo'
    const headerTypes = [
      'kolorowe_tlo_logo_wydarzenia',
      'tlo_wydarzenia_logo_zaproszenia',
      'event_logo',
    ];
    for (const fileType of headerTypes) {
      const h = await client.query(
        `SELECT file_path, file_blob FROM exhibitor_branding_files
         WHERE exhibitor_id IS NULL AND exhibition_id = $1 AND file_type = $2
         ORDER BY created_at DESC LIMIT 1`,
        [exhibitionId, fileType]
      );
      if (h.rows.length > 0) {
        const row = h.rows[0];
        if (row.file_blob) {
          // Save to temp buffer file if needed, PDFKit can draw from buffer via doc.image(buffer)
          headerImagePath = null; // will use buffer path below
          headerImagePath = row.file_blob; // overload to pass buffer downstream
        } else if (row.file_path) {
          const normalized = String(row.file_path).startsWith('uploads/')
            ? String(row.file_path).replace(/^uploads\//, '')
            : String(row.file_path);
          const resolved = path.join(uploadsBase, normalized);
          if (fs.existsSync(resolved)) { headerImagePath = resolved; }
        }
        if (headerImagePath) break;
      }
    }

    // Footer: 'logo_ptak_expo'
    const f = await client.query(
      `SELECT file_path, file_blob FROM exhibitor_branding_files
       WHERE exhibitor_id IS NULL AND exhibition_id = $1 AND file_type = 'logo_ptak_expo'
       ORDER BY created_at DESC LIMIT 1`,
      [exhibitionId]
    );
    if (f.rows.length > 0) {
      const row = f.rows[0];
      if (row.file_blob) {
        footerLogoPath = row.file_blob; // buffer
      } else if (row.file_path) {
        const normalized = String(row.file_path).startsWith('uploads/')
          ? String(row.file_path).replace(/^uploads\//, '')
          : String(row.file_path);
        const resolved = path.join(uploadsBase, normalized);
        if (fs.existsSync(resolved)) footerLogoPath = resolved;
      }
    }
  } catch {}

  // Prepare QR image buffer (use accessCode if provided, otherwise exhibition id)
  let qrBuffer = null;
  try {
    const qrData = payload && payload.accessCode ? String(payload.accessCode) : String(ev.id);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrData)}`;
    const resp = await fetch(qrUrl);
    if (resp.ok) qrBuffer = Buffer.from(await resp.arrayBuffer());
  } catch {}

  const doc = new PDFDocument({ size: 'A6', margin: 12 });
  const chunks = [];

  const fontPath = resolveFontPath();
  if (fontPath) {
    try { doc.font(fontPath); } catch {}
  } else {
    try { doc.font('Helvetica'); } catch {}
  }

  return await new Promise((resolve) => {
    doc.on('data', (d) => chunks.push(d));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    const pageW = doc.page.width;
    const cardX = 10;
    const cardW = pageW - 20;
    const headerH = 120;

    // Background card
    doc.save();
    doc.roundedRect(cardX, 10, cardW, doc.page.height - 20, 12).fill('#FFFFFF');
    doc.restore();

    // Header image
    doc.save();
    doc.roundedRect(cardX, 10, cardW, doc.page.height - 20, 12).clip();
    try {
      if (headerImagePath) {
        if (Buffer.isBuffer(headerImagePath)) {
          doc.image(headerImagePath, cardX, 10, { width: cardW, height: headerH, fit: [cardW, headerH] });
        } else {
          doc.image(headerImagePath, cardX, 10, { width: cardW, height: headerH, fit: [cardW, headerH] });
        }
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
    try { doc.font(fontPath || 'Helvetica'); } catch {}
    doc.fontSize(12).fillColor('#2E2E38').text(ev.name || 'Wydarzenie', cardX + 12, y, { width: cardW - 24 });
    y = doc.y + 8;

    // Date and time
    try { doc.font(fontPath || 'Helvetica'); } catch {}
    doc.fontSize(9).fillColor('#333').text('Data', cardX + 12, y);
    y = doc.y + 4;
    try { doc.font(fontPath || 'Helvetica'); } catch {}
    doc.fillColor('#000').text(`${formatDate(ev.start_date)} – ${formatDate(ev.end_date)}`, cardX + 12, y, { width: cardW - 24 });
    y = doc.y + 10;

    // Name
    try { doc.font(fontPath || 'Helvetica'); } catch {}
    doc.fillColor('#333').text('Imię i nazwisko', cardX + 12, y);
    y = doc.y + 4;
    try { doc.font(fontPath || 'Helvetica-Bold'); } catch { try { doc.font(fontPath || 'Helvetica'); } catch {} }
    doc.fillColor('#000').fontSize(10).text(payload?.personName || '', cardX + 12, y);
    y = doc.y + 8;

    // Role
    try { doc.font(fontPath || 'Helvetica'); } catch {}
    doc.fillColor('#333').fontSize(9).text('Rola', cardX + 12, y);
    y = doc.y + 4;
    try { doc.font(fontPath || 'Helvetica-Bold'); } catch { try { doc.font(fontPath || 'Helvetica'); } catch {} }
    doc.fillColor('#000').fontSize(10).text('Gość', cardX + 12, y);

    // Dashed separator
    y = y + 12;
    doc.save();
    doc.dash(3, { space: 3 });
    doc.moveTo(cardX + 12, y).lineTo(cardX + cardW - 12, y).stroke('#CCCCCC');
    doc.undash();
    doc.restore();

    // Footer: logo left, QR right
    const qrSize = 70;
    const qrX = cardX + cardW - 12 - qrSize;
    try {
      if (qrBuffer) {
        doc.image(qrBuffer, qrX, y + 8, { width: qrSize, height: qrSize });
      }
    } catch {}
    try {
      const logoBoxW = qrX - (cardX + 12) - 8;
      const logoMaxH = 40;
      if (footerLogoPath) {
        if (Buffer.isBuffer(footerLogoPath)) {
          doc.image(footerLogoPath, cardX + 12, y + 8, { fit: [logoBoxW, logoMaxH], align: 'left' });
        } else {
          doc.image(footerLogoPath, cardX + 12, y + 8, { fit: [logoBoxW, logoMaxH], align: 'left' });
        }
      } else {
        // fallback text logo
        try { doc.font(fontPath || 'Helvetica-Bold'); } catch {}
        doc.fontSize(11).fillColor('#2E2E38').text('PTAK EXPO', cardX + 12, y + 8);
      }
    } catch {}

    doc.end();
  });
}

module.exports = { buildIdentifierPdf };


