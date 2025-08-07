const express = require('express');
const router = express.Router();
const { saveTradeInfo, getTradeInfo, uploadTradePlan, downloadTradePlan } = require('../controllers/tradeInfoController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Routes for trade info (tylko admin)
router.post('/:exhibitionId', verifyToken, requireAdmin, saveTradeInfo);
router.get('/:exhibitionId', verifyToken, requireAdmin, getTradeInfo);

// Routes for trade plan file uploads
router.post('/:exhibitionId/upload/:spaceId', verifyToken, requireAdmin, upload.single('tradePlan'), uploadTradePlan);
router.get('/:exhibitionId/download/:spaceId', verifyToken, requireAdmin, downloadTradePlan);

module.exports = router; 