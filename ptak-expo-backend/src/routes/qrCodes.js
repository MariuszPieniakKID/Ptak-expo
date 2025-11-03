const express = require('express');
const router = express.Router();
const { getPersonQRCode, getExhibitionQRCodes, getMyQRCodes } = require('../controllers/qrCodesController');
const { verifyToken, requireExhibitorOrAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/v1/qr-codes/person/:personId
 * @desc    Get QR code for a specific person (as JSON or PNG image)
 * @query   format=json|image (default: json)
 * @access  Public
 */
router.get('/person/:personId', getPersonQRCode);

/**
 * @route   GET /api/v1/qr-codes/exhibition/:exhibitionId
 * @desc    Get all QR codes for an exhibition (as JSON or ZIP archive)
 * @query   format=json|zip (default: json)
 * @query   exhibitorId=123 (optional filter)
 * @access  Public
 */
router.get('/exhibition/:exhibitionId', getExhibitionQRCodes);

/**
 * @route   GET /api/v1/qr-codes/my-codes
 * @desc    Get QR codes for authenticated exhibitor
 * @query   exhibitionId (optional filter)
 * @access  Private (exhibitor or admin)
 */
router.get('/my-codes', verifyToken, requireExhibitorOrAdmin, getMyQRCodes);

module.exports = router;

