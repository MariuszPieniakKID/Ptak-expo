const express = require('express');
const router = express.Router();
const { saveTradeInfo, getTradeInfo } = require('../controllers/tradeInfoController');
const { verifyToken } = require('../middleware/auth');

// Routes for trade info
router.post('/:exhibitionId', verifyToken, saveTradeInfo);
router.get('/:exhibitionId', verifyToken, getTradeInfo);

module.exports = router; 