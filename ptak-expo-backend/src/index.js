const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

console.log('🔍 Starting PTAK EXPO Backend...');
console.log('🔍 Node.js version:', process.version);
console.log('🔍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔍 Port from env:', process.env.PORT || 'not set');
console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'SET (length: ' + process.env.DATABASE_URL.length + ')' : 'NOT SET');
console.log('🔍 JWT_SECRET:', process.env.JWT_SECRET ? 'SET (length: ' + process.env.JWT_SECRET.length + ')' : 'NOT SET');
console.log('🔍 CORS_ORIGIN:', process.env.CORS_ORIGIN || 'not set');
console.log('🔍 Railway Environment Variables:');
console.log('  - RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'not set');
console.log('  - RAILWAY_SERVICE_NAME:', process.env.RAILWAY_SERVICE_NAME || 'not set');
console.log('  - RAILWAY_DEPLOYMENT_ID:', process.env.RAILWAY_DEPLOYMENT_ID || 'not set');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');

console.log('🔍 Loading database config...');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🔍 Will listen on port:', PORT);

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

app.get('/api/v1/health', async (req, res) => {
  try {
    // Basic health check
    const response = {
      status: 'OK', 
      message: 'PTAK EXPO Backend API is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    // Test database connection if requested
    if (req.query.db === 'true') {
      try {
        await db.pool.query('SELECT NOW()');
        response.database = 'Connected';
      } catch (dbError) {
        response.database = 'Error: ' + dbError.message;
        response.status = 'DEGRADED';
      }
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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
  
  // Initialize database asynchronously after server starts
  console.log('🔍 Server started successfully, initializing database in background...');
  
  // Don't await - let it run in background
  db.initializeDatabase()
    .then(() => {
      console.log('✅ Database initialization completed');
    })
    .catch((error) => {
      console.error('❌ Database initialization failed:', error.message);
      console.error('❌ Database error details:', error.stack);
      console.error('⚠️  Server will continue running without database');
    });
});

module.exports = app; 