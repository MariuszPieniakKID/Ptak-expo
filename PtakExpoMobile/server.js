const express = require('express');
const path = require('path');
const compression = require('compression');
const serveStatic = require('serve-static');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable compression
app.use(compression());

// Health check endpoint (before static files)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ptak-expo-mobile-web'
  });
});

// Serve static files from dist directory
app.use(serveStatic(path.join(__dirname, 'dist'), {
  index: ['index.html']
}));

// Handle client-side routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Ptak Expo Mobile Web Server running on port ${PORT}`);
  console.log(`📱 Access the app at: http://localhost:${PORT}`);
});

module.exports = app; 