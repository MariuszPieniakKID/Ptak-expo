const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PTAK EXPO Backend API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users'
    }
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PTAK EXPO Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PTAK EXPO Backend API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/`);
  console.log(`🔍 DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
  console.log(`🔍 JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
});

module.exports = app; 