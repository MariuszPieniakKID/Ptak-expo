const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin, requireExhibitorOrAdmin } = require('../middleware/auth');
const {
  getInvitations,
  saveInvitation,
  getInvitationById,
  deleteInvitation,
  sendInvitation,
  listRecipientsByExhibition
} = require('../controllers/invitationsController');

// Get invitations for specific exhibition (wystawca lub admin)
// GET /api/v1/invitations/:exhibitionId
router.get('/:exhibitionId', verifyToken, requireExhibitorOrAdmin, getInvitations);

// Create or update invitation for exhibition (tylko admin)
// POST /api/v1/invitations/:exhibitionId
router.post('/:exhibitionId', verifyToken, requireAdmin, saveInvitation);

// Get single invitation by ID (tylko admin)
// GET /api/v1/invitations/detail/:invitationId
router.get('/detail/:invitationId', verifyToken, requireAdmin, getInvitationById);

// Delete invitation (tylko admin)
// DELETE /api/v1/invitations/detail/:invitationId
router.delete('/detail/:invitationId', verifyToken, requireAdmin, deleteInvitation);

// Send invitation (wystawca lub admin)
// POST /api/v1/invitations/:exhibitionId/send
router.post('/:exhibitionId/send', verifyToken, requireExhibitorOrAdmin, sendInvitation);

// List sent recipients for exhibition (wystawca lub admin)
// GET /api/v1/invitations/:exhibitionId/recipients
router.get('/:exhibitionId/recipients', verifyToken, requireExhibitorOrAdmin, listRecipientsByExhibition);

module.exports = router; 