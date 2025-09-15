const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { verifyToken, requireAdmin, requireExhibitorOrAdmin } = require('../middleware/auth');
const { listByExhibition, createForExhibition, updateById, deleteById } = require('../controllers/marketingMaterialsController');

const router = express.Router();

// Setup uploads directory for marketing materials
const getUploadsBase = () => {
  const preferred = process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim().length > 0
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.join(__dirname, '../../uploads');
  try {
    if (!fs.existsSync(preferred)) {
      fs.mkdirSync(preferred, { recursive: true });
    }
    return preferred;
  } catch (e) {
    const fallback = path.join(__dirname, '../../uploads');
    try {
      if (!fs.existsSync(fallback)) {
        fs.mkdirSync(fallback, { recursive: true });
      }
      console.warn('⚠️ UPLOADS_DIR not usable for marketing materials, using local uploads:', e?.message || e);
      return fallback;
    } catch (e2) {
      console.error('❌ Could not ensure marketing uploads directory:', e2?.message || e2);
      return fallback;
    }
  }
};
const uploadsDir = path.join(getUploadsBase(), 'marketing-materials');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('⚠️ Could not ensure marketing-materials dir:', e?.message || e);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, `benefit-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

// List by exhibition (exhibitor or admin)
router.get('/:exhibitionId', verifyToken, requireExhibitorOrAdmin, listByExhibition);

// Create for exhibition (exhibitor or admin)
router.post('/:exhibitionId', verifyToken, requireExhibitorOrAdmin, upload.single('file'), createForExhibition);

// Update by id (exhibitor or admin)
router.put('/item/:id', verifyToken, requireExhibitorOrAdmin, upload.single('file'), updateById);

// Delete by id (exhibitor or admin)
router.delete('/item/:id', verifyToken, requireExhibitorOrAdmin, deleteById);

module.exports = router;


