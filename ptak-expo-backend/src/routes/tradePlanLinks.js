const express = require('express');
const router = express.Router();
const controller = require('../controllers/tradePlanLinksController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /api/v1/trade-plan-links/:exhibitionId - list all links for exhibition
router.get('/:exhibitionId', verifyToken, controller.listLinks);

// POST /api/v1/trade-plan-links/:exhibitionId - create new link (admin only)
router.post('/:exhibitionId', verifyToken, requireAdmin, controller.createLink);

// PUT /api/v1/trade-plan-links/link/:linkId - update link (admin only)
router.put('/link/:linkId', verifyToken, requireAdmin, controller.updateLink);

// DELETE /api/v1/trade-plan-links/link/:linkId - delete link (admin only)
router.delete('/link/:linkId', verifyToken, requireAdmin, controller.deleteLink);

module.exports = router;

