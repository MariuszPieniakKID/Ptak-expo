const express = require('express');
const { login, verifyToken, logout } = require('../controllers/authController');

const router = express.Router();

// Login route
router.post('/login', login);

// Verify token route
router.get('/verify', verifyToken);

// Logout route
router.post('/logout', logout);

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