const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { verifyToken, requireAdmin, requireExhibitorOrAdmin } = require('../middleware/auth');
const { listByExhibition, createForExhibition, updateById, deleteById } = require('../controllers/marketingMaterialsController');

const router = express.Router();

// Setup uploads directory for marketing materials
const getUploadsBase = () => {
  const base = process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim().length > 0
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.join(__dirname, '../../uploads');
  return base;
};
const uploadsDir = path.join(getUploadsBase(), 'marketing-materials');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
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


