const express = require('express');
const router = express.Router();
const { verifyQRCode } = require('../controllers/qrVerifyController');

/**
 * @route   GET /api/v1/qr-verify/:code
 * @desc    Verify QR code and return access information (PUBLIC - no auth required)
 * @access  Public
 */
router.get('/:code', verifyQRCode);

module.exports = router;

