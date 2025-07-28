const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Import controller functions
const { 
  uploadBrandingFile, 
  getBrandingFiles, 
  deleteBrandingFile, 
  serveBrandingFile,
  FILE_TYPES 
} = require('../controllers/exhibitorBrandingController');

// Import middleware
const { verifyToken } = require('../middleware/auth');

// Ensure temp upload directory exists
const tempDir = path.join(__dirname, '../../uploads/temp');
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

// Routes
router.post('/upload', verifyToken, upload.single('file'), uploadBrandingFile);
router.get('/:exhibitorId/:exhibitionId', verifyToken, getBrandingFiles);
router.delete('/file/:fileId', verifyToken, deleteBrandingFile);
router.get('/serve/:exhibitorId/:fileName', verifyToken, serveBrandingFile);
router.get('/file-types', verifyToken, (req, res) => {
  res.json({
    success: true,
    fileTypes: FILE_TYPES
  });
});

module.exports = router; 