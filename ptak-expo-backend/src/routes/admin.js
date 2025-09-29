const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

// POST /api/v1/admin/test-email - send a test email via configured SMTP (admin only)
router.post('/test-email', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { to, subject, text, html } = req.body || {};
    if (!to) {
      return res.status(400).json({ success: false, error: 'Parametr "to" jest wymagany' });
    }
    const result = await sendEmail({
      to,
      subject: subject || 'PTAK WARSAW EXPO - Test email',
      text: text || 'To jest testowa wiadomość wysłana z systemu PTAK WARSAW EXPO (SMTP Office365).',
      html:
        html ||
        '<p>To jest <strong>testowa wiadomość</strong> wysłana z systemu PTAK WARSAW EXPO (SMTP Office365).</p>',
    });
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }
    return res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;


