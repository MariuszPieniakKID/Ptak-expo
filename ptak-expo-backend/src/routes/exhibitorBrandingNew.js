const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Helper to resolve uploads base (supports Railway volume via UPLOADS_DIR)
const getUploadsBase = () => {
  const preferred = process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim().length > 0
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.join(__dirname, '../../uploads');
  try {
    // Ensure base directory exists; if creation fails, fallback to local uploads dir
    const baseDir = preferred;
    const rootDir = path.isAbsolute(baseDir) ? path.parse(baseDir).root : null;
    // Attempt to create preferred dir (recursive)
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    return baseDir;
  } catch (e) {
    // Fallback to project-local uploads directory
    const fallback = path.join(__dirname, '../../uploads');
    try {
      if (!fs.existsSync(fallback)) {
        fs.mkdirSync(fallback, { recursive: true });
      }
      console.warn('⚠️ UPLOADS_DIR not usable, falling back to local uploads:', e?.message || e);
      return fallback;
    } catch (e2) {
      console.error('❌ Could not ensure uploads directory:', e2?.message || e2);
      return path.join(__dirname, '../../uploads');
    }
  }
};

// Import controller functions
const { 
  uploadBrandingFile, 
  getBrandingFiles, 
  deleteBrandingFile, 
  serveBrandingFile,
  FILE_TYPES 
} = require('../controllers/exhibitorBrandingController');

// Import middleware
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Ensure temp upload directory exists (place it on the same filesystem as final uploads)
const uploadsBase = getUploadsBase();
const tempDir = path.join(uploadsBase, 'temp');
try {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
} catch (e) {
  console.warn('⚠️ Could not ensure temp dir, using uploads base instead:', e?.message || e);
}

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, `temp_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
    files: 1
  }
});

// Routes (admin for mutations)
router.post('/upload', verifyToken, requireAdmin, upload.single('file'), uploadBrandingFile);
router.delete('/file/:fileId', verifyToken, requireAdmin, deleteBrandingFile);

// Public read routes for global branding files MUST come before generic param routes
router.get('/global/:exhibitionId', (req, res) => {
  req.params.exhibitorId = 'global';
  return getBrandingFiles(req, res);
});
router.get('/serve/global/:fileName', (req, res) => {
  req.params.exhibitorId = 'global';
  return serveBrandingFile(req, res);
});

// Generic read routes (protected)
router.get('/:exhibitorId/:exhibitionId', verifyToken, requireAdmin, getBrandingFiles);
router.get('/serve/:exhibitorId/:fileName', verifyToken, serveBrandingFile);
router.get('/file-types', verifyToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    fileTypes: FILE_TYPES
  });
});

module.exports = router; 