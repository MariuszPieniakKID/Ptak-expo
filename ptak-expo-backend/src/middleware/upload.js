const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Resolve uploads base from env (Railway volume) or fallback to local folder
const getUploadsBase = () => {
  const base = process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim().length > 0
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.join(__dirname, '../../uploads');
  return base;
};

// Ensure uploads directory exists (place trade-plans on the same filesystem as final uploads)
const uploadsDir = path.join(getUploadsBase(), 'trade-plans');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and exhibition ID
    const exhibitionId = req.params.exhibitionId;
    const spaceId = req.body.spaceId || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `trade-plan-${exhibitionId}-${spaceId}-${uniqueSuffix}${extension}`);
  }
});

// File filter - accept only PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

module.exports = upload;