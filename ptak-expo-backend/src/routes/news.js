const express = require('express');
const router = express.Router();
const { verifyToken, requireExhibitorOrAdmin } = require('../middleware/auth');
const controller = require('../controllers/newsController');

// News per exhibition (for exhibitors and admins)
router.get('/:exhibitionId', verifyToken, requireExhibitorOrAdmin, controller.listByExhibition);

module.exports = router;


