const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
  getInvitations,
  saveInvitation, 
  getInvitationById,
  deleteInvitation
} = require('../controllers/invitationsController');

// Get invitations for specific exhibition (tylko admin)
// GET /api/v1/invitations/:exhibitionId
router.get('/:exhibitionId', verifyToken, requireAdmin, getInvitations);

// Create or update invitation for exhibition (tylko admin)
// POST /api/v1/invitations/:exhibitionId
router.post('/:exhibitionId', verifyToken, requireAdmin, saveInvitation);

// Get single invitation by ID (tylko admin)
// GET /api/v1/invitations/detail/:invitationId
router.get('/detail/:invitationId', verifyToken, requireAdmin, getInvitationById);

// Delete invitation (tylko admin)
// DELETE /api/v1/invitations/detail/:invitationId
router.delete('/detail/:invitationId', verifyToken, requireAdmin, deleteInvitation);

module.exports = router; 