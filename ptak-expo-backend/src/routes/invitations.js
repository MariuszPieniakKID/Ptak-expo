const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getInvitations,
  saveInvitation, 
  getInvitationById,
  deleteInvitation
} = require('../controllers/invitationsController');

// Get invitations for specific exhibition
// GET /api/v1/invitations/:exhibitionId
router.get('/:exhibitionId', verifyToken, getInvitations);

// Create or update invitation for exhibition
// POST /api/v1/invitations/:exhibitionId
router.post('/:exhibitionId', verifyToken, saveInvitation);

// Get single invitation by ID
// GET /api/v1/invitations/detail/:invitationId
router.get('/detail/:invitationId', verifyToken, getInvitationById);

// Delete invitation
// DELETE /api/v1/invitations/detail/:invitationId
router.delete('/detail/:invitationId', verifyToken, deleteInvitation);

module.exports = router; 