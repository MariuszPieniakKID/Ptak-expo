const express = require('express');
const { login, exhibitorLogin, verifyToken, logout, forgotPassword } = require('../controllers/authController');

const router = express.Router();

// Admin login route (for ptak-expo-frontend)
router.post('/login', login);

// Exhibitor login route (for ptak-expo-web)
router.post('/exhibitor-login', exhibitorLogin);

// Verify token route
router.get('/verify', verifyToken);

// Logout route
router.post('/logout', logout);

// Forgot password route (password reset via email)
router.post('/forgot-password', forgotPassword);

// Test route to check if auth routes are working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working',
    testCredentials: {
      email: process.env.TEST_EMAIL || 'test@test.com',
      password: process.env.TEST_PASSWORD || 'test123'
    }
  });
});

module.exports = router; 