const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/tradeEventsController');

// List trade events for exhibition
// Admin: all, Exhibitor: only own (via query exhibitorId)
router.get('/:exhibitionId', verifyToken, controller.listByExhibition);

// Create trade event for exhibition
// Admin: can create for any exhibitor, Exhibitor: can create only for self
router.post('/:exhibitionId', verifyToken, controller.create);

// Update trade event
// Admin: any event; Exhibitor: only own event
router.put('/:exhibitionId/:eventId', verifyToken, controller.update);

// Delete trade event
// Admin: any event; Exhibitor: only own event
router.delete('/:exhibitionId/:eventId', verifyToken, controller.remove);

module.exports = router;


