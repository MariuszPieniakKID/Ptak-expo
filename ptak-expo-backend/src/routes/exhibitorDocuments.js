const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Database connection - use existing configuration
const db = require('../config/database');

// Resolve uploads base (Railway volume support)
const getUploadsBase = () => {
  if (process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim().length > 0) {
    return path.resolve(process.env.UPLOADS_DIR);
  }
  // Prefer Railway volume if present
  const railwayVolume = '/data/uploads';
  if (fsSync.existsSync('/data')) {
    try {
      if (!fsSync.existsSync(railwayVolume)) {
        fsSync.mkdirSync(railwayVolume, { recursive: true });
      }
      return railwayVolume;
    } catch (_e) {
      // fall through to local uploads
    }
  }
  return path.join(__dirname, '../../uploads');
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { exhibitorId, exhibitionId } = req.params;
    const uploadDir = path.join(getUploadsBase(), 'exhibitor-documents', exhibitorId, exhibitionId);
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedName}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = /\.(pdf|doc|docx|xls|xlsx|txt|jpg|jpeg|png|gif)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Nieobsługiwany typ pliku. Dozwolone: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG, GIF'));
    }
  }
});

// Upload document
router.post('/:exhibitorId/:exhibitionId/upload', verifyToken, upload.single('document'), async (req, res) => {
  try {
    const { exhibitorId, exhibitionId } = req.params;
    const { title, description, category, documentSource } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'Brak pliku do przesłania' });
    }

    if (!title || !category) {
      return res.status(400).json({ success: false, error: 'Tytuł i kategoria są wymagane' });
    }

    if (!['faktury', 'umowy', 'inne_dokumenty'].includes(category)) {
      return res.status(400).json({ success: false, error: 'Nieprawidłowa kategoria' });
    }
    
    // Validate document_source
    const validSources = ['admin_exhibitor_card', 'exhibitor_self', 'admin_other', 'exhibitor_checklist_materials', 'catalog_images'];
    const finalDocumentSource = validSources.includes(documentSource) ? documentSource : 'exhibitor_self';

    // Verify exhibitor and exhibition exist and ownership if not admin
    const exhibitorCheck = await db.query('SELECT id FROM exhibitors WHERE id = $1', [exhibitorId]);
    const exhibitionCheck = await db.query('SELECT id FROM exhibitions WHERE id = $1', [exhibitionId]);
    // If not admin, ensure user is uploading for self (map by email or supervisor relationship)
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
        return res.status(403).json({ success: false, error: 'Brak uprawnień do przesyłania dokumentów dla innego wystawcy' });
      }
    }

    if (exhibitorCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Wystawca nie został znaleziony' });
    }

    if (exhibitionCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Wydarzenie nie zostało znalezione' });
    }

    // Resolve uploader user id for admin context.
    // For exhibitor uploads we intentionally set NULL to avoid misclassifying uploads.
    let uploaderUserId = null;
    if (req.user.role === 'admin') {
      try {
        const usr = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [req.user.email]);
        uploaderUserId = usr.rows?.[0]?.id || null;
      } catch (_e) {
        uploaderUserId = null;
      }
      // Fallback: if lookup by email failed, use id from JWT token (admin account)
      if (!uploaderUserId && req.user && typeof req.user.id !== 'undefined') {
        uploaderUserId = req.user.id;
      }
    }

    // Save document info to database
    const result = await db.query(`
      INSERT INTO exhibitor_documents (
        exhibitor_id, exhibition_id, title, description, file_name, original_name, 
        file_path, file_size, mime_type, category, uploaded_by, document_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      exhibitorId,
      exhibitionId,
      title,
      description || null,
      file.filename,
      file.originalname,
      file.path,
      file.size,
      file.mimetype,
      category,
      uploaderUserId,
      finalDocumentSource
    ]);

    // Return relative path from uploads base for catalog images
    const relativeFilePath = `uploads/exhibitor-documents/${exhibitorId}/${exhibitionId}/${result.rows[0].file_name}`;
    
    res.json({
      success: true,
      message: 'Dokument został przesłany pomyślnie',
      document: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        description: result.rows[0].description,
        fileName: relativeFilePath, // Full relative path for catalog use
        originalName: result.rows[0].original_name,
        fileSize: result.rows[0].file_size,
        mimeType: result.rows[0].mime_type,
        category: result.rows[0].category,
        createdAt: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ success: false, error: 'Błąd podczas przesyłania dokumentu', message: error.message });
  }
});

// Get documents for exhibitor+exhibition
router.get('/:exhibitorId/:exhibitionId', verifyToken, async (req, res) => {
  try {
    const { exhibitorId, exhibitionId } = req.params;

    // Determine effective exhibitor for non-admin based on email and selected exhibition
    let effectiveExhibitorId = exhibitorId;
    if (req.user.role !== 'admin') {
      // Prefer exhibitor mapped to this exhibition
      const byEvent = await db.query(
        `SELECT e.id
         FROM exhibitors e
         JOIN exhibitor_events ee ON ee.exhibitor_id = e.id
         WHERE LOWER(e.email) = LOWER($1) AND ee.exhibition_id = $2
         LIMIT 1`,
        [req.user.email, exhibitionId]
      );
      if (byEvent.rows?.[0]?.id) {
        effectiveExhibitorId = String(byEvent.rows[0].id);
      } else {
        // Fallback: first exhibitor by email
        const meByEmail = await db.query('SELECT id FROM exhibitors WHERE LOWER(email) = LOWER($1) LIMIT 1', [req.user.email]);
        if (meByEmail.rows?.[0]?.id) {
          effectiveExhibitorId = String(meByEmail.rows[0].id);
        }
      }

      // Block access if URL exhibitorId does not match determined exhibitor for safety
      if (String(effectiveExhibitorId) !== String(exhibitorId)) {
        // Do not leak whether other exhibitor has docs; respond forbidden
        return res.status(403).json({ success: false, error: 'Brak uprawnień do przeglądania dokumentów innego wystawcy' });
      }
    }
    // Optional filter: only documents uploaded by current user (selfOnly=1)
    let uploaderUserId = null;
    const selfOnly = String(req.query.selfOnly || '').trim() === '1';
    // Optional filter: only documents uploaded by admins (adminOnly=1)
    const adminOnly = String(req.query.adminOnly || '').trim() === '1';
    if (selfOnly) {
      try {
        const usr = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [req.user.email]);
        uploaderUserId = usr.rows?.[0]?.id || null;
      } catch {}
    }

    const whereClauses = ['exhibitor_id = $1', 'exhibition_id = $2'];
    const params = [effectiveExhibitorId, exhibitionId];
    if (selfOnly && uploaderUserId) {
      whereClauses.push(`uploaded_by = $${params.length + 1}`);
      params.push(uploaderUserId);
    }
    if (adminOnly) {
      // Ensure we only include rows where the uploader is an admin user
      whereClauses.push(`EXISTS (SELECT 1 FROM users ux WHERE ux.id = d.uploaded_by AND ux.role = 'admin')`);
    }

    const result = await db.query(`
      SELECT 
        d.id, d.title, d.description, d.file_name, d.original_name, d.file_size, 
        d.mime_type, d.category, d.created_at, d.updated_at, d.uploaded_by,
        d.document_source,
        u.role AS uploaded_by_role
      FROM exhibitor_documents d
      LEFT JOIN users u ON u.id = d.uploaded_by
      WHERE ${whereClauses.map((c,i)=>c.replace(/\$1/g,'$1').replace(/\$2/g,'$2')).join(' AND ')}
      ORDER BY d.category, d.created_at DESC
    `, params);

    res.json({
      success: true,
      documents: result.rows
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, error: 'Błąd podczas pobierania dokumentów', message: error.message });
  }
});

// Download document (protected)
router.get('/:exhibitorId/:exhibitionId/download/:documentId', verifyToken, async (req, res) => {
  try {
    const { exhibitorId, exhibitionId, documentId } = req.params;
    // cleaned logs
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
        return res.status(403).json({ success: false, error: 'Brak uprawnień do pobierania dokumentów innego wystawcy' });
      }
    }

    const result = await db.query(`
      SELECT file_path, original_name, mime_type 
      FROM exhibitor_documents 
      WHERE id = $1 AND exhibitor_id = $2 AND exhibition_id = $3
    `, [documentId, exhibitorId, exhibitionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dokument nie został znaleziony' });
    }

    const document = result.rows[0];

    // Try original path; for local dev, also try mapping Railway path to local uploads
    const candidatePaths = [document.file_path];
    if (typeof document.file_path === 'string' && document.file_path.startsWith('/data/uploads/')) {
      const relativeFromRailway = path.relative('/data/uploads', document.file_path);
      const localFallback = path.join(__dirname, '../../uploads', relativeFromRailway);
      candidatePaths.push(localFallback);
    }

    for (const p of candidatePaths) {
      try {
        await fs.access(p);
        res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);
        res.setHeader('Content-Type', document.mime_type);
        return res.sendFile(path.resolve(p));
      } catch (_e) {
        // try next candidate
      }
    }

    res.status(404).json({ success: false, error: 'Plik nie został znaleziony na serwerze' });

  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ success: false, error: 'Błąd podczas pobierania dokumentu', message: error.message });
  }
});

// Public download (no auth) – safe because we verify ownership by IDs only
router.get('/public/:exhibitionId/:exhibitorId/:documentId/download', async (req, res) => {
  try {
    const { exhibitorId, exhibitionId, documentId } = req.params;
    const result = await db.query(`
      SELECT file_path, original_name, mime_type 
      FROM exhibitor_documents 
      WHERE id = $1 AND exhibitor_id = $2 AND exhibition_id = $3
    `, [documentId, exhibitorId, exhibitionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dokument nie został znaleziony' });
    }

    const document = result.rows[0];
    const candidatePaths = [document.file_path];
    if (typeof document.file_path === 'string' && document.file_path.startsWith('/data/uploads/')) {
      const relativeFromRailway = path.relative('/data/uploads', document.file_path);
      const localFallback = path.join(__dirname, '../../uploads', relativeFromRailway);
      candidatePaths.push(localFallback);
    }

    for (const p of candidatePaths) {
      try {
        await fs.access(p);
        res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);
        res.setHeader('Content-Type', document.mime_type);
        return res.sendFile(path.resolve(p));
      } catch (_e) {}
    }

    res.status(404).json({ success: false, error: 'Plik nie został znaleziony na serwerze' });
  } catch (error) {
    console.error('Error downloading public document:', error);
    res.status(500).json({ success: false, error: 'Błąd podczas pobierania dokumentu', message: error.message });
  }
});

// Delete document
router.delete('/:exhibitorId/:exhibitionId/:documentId', verifyToken, async (req, res) => {
  try {
    const { exhibitorId, exhibitionId, documentId } = req.params;
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
        return res.status(403).json({ success: false, error: 'Brak uprawnień do usuwania dokumentów innego wystawcy' });
      }
    }

    // Get document info first
    const docResult = await db.query(`
      SELECT file_path 
      FROM exhibitor_documents 
      WHERE id = $1 AND exhibitor_id = $2 AND exhibition_id = $3
    `, [documentId, exhibitorId, exhibitionId]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dokument nie został znaleziony' });
    }

    const filePath = docResult.rows[0].file_path;

    // Delete from database
    await db.query(`
      DELETE FROM exhibitor_documents 
      WHERE id = $1 AND exhibitor_id = $2 AND exhibition_id = $3
    `, [documentId, exhibitorId, exhibitionId]);

    // Delete file from filesystem
    try {
      await fs.unlink(filePath);
    } catch (fileError) {
      console.warn('Could not delete file:', filePath, fileError.message);
    }

    res.json({
      success: true,
      message: 'Dokument został usunięty pomyślnie'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, error: 'Błąd podczas usuwania dokumentu', message: error.message });
  }
});

module.exports = router;

// Send message to exhibitor about documents and log to communications/news
router.post('/:exhibitorId/:exhibitionId/message', verifyToken, async (req, res) => {
  try {
    const { exhibitorId, exhibitionId } = req.params;
    const { message } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Treść wiadomości jest wymagana' });
    }

    // Fetch exhibitor email and name
    const exhibitorRes = await db.query('SELECT id, email, company_name, contact_person FROM exhibitors WHERE id = $1', [exhibitorId]);
    if (exhibitorRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Wystawca nie znaleziony' });
    }
    const exhibitor = exhibitorRes.rows[0];

    // Permission: admin or supervisor for this exhibitor
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
        return res.status(403).json({ success: false, message: 'Brak uprawnień do wysyłki wiadomości dla tego wystawcy' });
      }
    }

    // Send email
    const { sendEmail } = require('../utils/emailService');
    const subject = 'Wiadomość dotycząca dokumentów – PTAK WARSAW EXPO';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height:1.6;">
        <p>Dzień dobry${exhibitor.contact_person ? ` ${exhibitor.contact_person}` : ''},</p>
        <p>${String(message).replace(/\n/g, '<br/>')}</p>
        <p style="margin-top:16px; color:#666; font-size:12px;">Ta wiadomość została wysłana z panelu administracyjnego PTAK WARSAW EXPO.</p>
      </div>
    `;
    const sent = await sendEmail({ to: exhibitor.email, subject, html, text: message });
    if (!sent?.success) {
      return res.status(500).json({ success: false, message: sent?.error || 'Nie udało się wysłać wiadomości email' });
    }

    // Resolve user_id in users table for this exhibitor's email (communications.user_id references users.id)
    let userIdForExhibitor = null;
    try {
      const userRow = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [exhibitor.email]);
      userIdForExhibitor = userRow.rows?.[0]?.id || null;
    } catch {}

    // Log into communications/news table so it appears in Aktualności
    try {
      await db.query(`
        INSERT INTO communications (title, content, type, exhibition_id, user_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'Wiadomość dotycząca dokumentów',
        message,
        'notification',
        Number(exhibitionId),
        userIdForExhibitor,
      ]);
    } catch (e) {
      console.warn('Could not insert communications entry:', e?.message || e);
    }

    return res.json({ success: true, message: 'Wiadomość wysłana i zapisana do aktualności' });
  } catch (error) {
    console.error('Error sending exhibitor message:', error);
    return res.status(500).json({ success: false, message: 'Błąd podczas wysyłki wiadomości' });
  }
});