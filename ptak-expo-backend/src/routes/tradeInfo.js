const express = require('express');
const router = express.Router();
const { saveTradeInfo, getTradeInfo, uploadTradePlan, downloadTradePlan, broadcastTradeMessage } = require('../controllers/tradeInfoController');
const { verifyToken, requireAdmin, requireExhibitorOrAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Routes for trade info
// Admin can save; Exhibitor or Admin can view/download
router.post('/:exhibitionId', verifyToken, requireAdmin, saveTradeInfo);
router.get('/:exhibitionId', verifyToken, requireExhibitorOrAdmin, getTradeInfo);

// Routes for trade plan file uploads
router.post('/:exhibitionId/upload/:spaceId', verifyToken, requireAdmin, upload.single('tradePlan'), uploadTradePlan);
router.get('/:exhibitionId/download/:spaceId', verifyToken, requireExhibitorOrAdmin, downloadTradePlan);

// Broadcast trade message to all exhibitors assigned to the exhibition
router.post('/:exhibitionId/broadcast', verifyToken, requireAdmin, broadcastTradeMessage);

module.exports = router; 