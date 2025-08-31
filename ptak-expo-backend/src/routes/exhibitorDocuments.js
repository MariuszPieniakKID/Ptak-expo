const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { verifyToken } = require('../middleware/auth');

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
    const { title, description, category } = req.body;
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

    // Save document info to database
    const result = await db.query(`
      INSERT INTO exhibitor_documents (
        exhibitor_id, exhibition_id, title, description, file_name, original_name, 
        file_path, file_size, mime_type, category, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
      req.user.id
    ]);

    res.json({
      success: true,
      message: 'Dokument został przesłany pomyślnie',
      document: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        description: result.rows[0].description,
        fileName: result.rows[0].file_name,
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
        return res.status(403).json({ success: false, error: 'Brak uprawnień do przeglądania dokumentów innego wystawcy' });
      }
    }
    const result = await db.query(`
      SELECT 
        id, title, description, file_name, original_name, file_size, 
        mime_type, category, created_at, updated_at
      FROM exhibitor_documents 
      WHERE exhibitor_id = $1 AND exhibition_id = $2
      ORDER BY category, created_at DESC
    `, [exhibitorId, exhibitionId]);

    res.json({
      success: true,
      documents: result.rows
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, error: 'Błąd podczas pobierania dokumentów', message: error.message });
  }
});

// Download document
router.get('/:exhibitorId/:exhibitionId/download/:documentId', verifyToken, async (req, res) => {
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
    
    try {
      await fs.access(document.file_path);
      res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);
      res.setHeader('Content-Type', document.mime_type);
      res.sendFile(path.resolve(document.file_path));
    } catch (fileError) {
      res.status(404).json({ success: false, error: 'Plik nie został znaleziony na serwerze' });
    }

  } catch (error) {
    console.error('Error downloading document:', error);
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