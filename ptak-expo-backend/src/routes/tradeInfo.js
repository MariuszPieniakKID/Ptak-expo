const express = require('express');
const router = express.Router();
const { saveTradeInfo, getTradeInfo } = require('../controllers/tradeInfoController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Routes for trade info (tylko admin)
router.post('/:exhibitionId', verifyToken, requireAdmin, saveTradeInfo);
router.get('/:exhibitionId', verifyToken, requireAdmin, getTradeInfo);

module.exports = router; 