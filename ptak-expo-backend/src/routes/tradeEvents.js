const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/tradeEventsController');

// List trade events for exhibition (admin only for now)
router.get('/:exhibitionId', verifyToken, requireAdmin, controller.listByExhibition);

// Create trade event for exhibition (admin only for now)
router.post('/:exhibitionId', verifyToken, requireAdmin, controller.create);

module.exports = router;


