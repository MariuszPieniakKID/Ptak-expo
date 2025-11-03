const express = require('express');
const { getPersonIdentifier, getExhibitionIdentifiers, getMyIdentifiers } = require('../controllers/identifiersController');
const { verifyToken, requireExhibitorOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get single identifier PDF for a person
router.get('/person/:personId', getPersonIdentifier);

// Get all identifiers for an exhibition as ZIP
router.get('/exhibition/:exhibitionId', getExhibitionIdentifiers);

// Get identifiers for authenticated exhibitor as ZIP
router.get('/my-identifiers', verifyToken, requireExhibitorOrAdmin, getMyIdentifiers);

module.exports = router;

