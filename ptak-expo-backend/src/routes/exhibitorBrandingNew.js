const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Helper to resolve uploads base (supports Railway volume via UPLOADS_DIR)
const getUploadsBase = () => {
  const base = process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim().length > 0
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.join(__dirname, '../../uploads');
  return base;
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
const tempDir = path.join(getUploadsBase(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
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