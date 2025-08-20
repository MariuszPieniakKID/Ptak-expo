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
const exhibitorsRoutes = require('./routes/exhibitors');
const exhibitionsRoutes = require('./routes/exhibitions');
const exhibitorBrandingRoutes = require('./routes/exhibitorBrandingNew');
const tradeInfoRoutes = require('./routes/tradeInfo');
const invitationsRoutes = require('./routes/invitations');
const tradeEventsRoutes = require('./routes/tradeEvents');
const exhibitorDocumentsRoutes = require('./routes/exhibitorDocuments');

// Swagger UI
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const swaggerSpecPath = path.join(__dirname, '../swagger.yaml');
let swaggerDocument = null;
try {
  swaggerDocument = YAML.load(swaggerSpecPath);
  console.log('🔍 Swagger spec loaded from', swaggerSpecPath);
} catch (e) {
  console.warn('⚠️ Swagger spec not found or failed to load:', e.message);
}

console.log('🔍 Loading database config...');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🔍 Will listen on port:', PORT);

// Middleware
// Configure Helmet to allow cross-origin resource embedding (for images/PDFs served from backend)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

// CORS Configuration using Railway environment variables
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:3002',
  process.env.CORS_ORIGIN,
  'https://frontend-production-fb96.up.railway.app',
  'https://ptak-expo-production.up.railway.app'
].filter(Boolean);

console.log('🔍 CORS allowed origins:', allowedOrigins);

// More flexible CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow any Railway domains for flexibility
    if (origin.includes('railway.app') || origin.includes('up.railway.app')) {
      console.log('🔍 Allowing Railway domain:', origin);
      return callback(null, true);
    }
    
    console.log('🔍 CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
// Test CORS endpoint
app.options('/api/v1/auth/*', (req, res) => {
  console.log('🔍 Preflight request for auth endpoint from origin:', req.headers.origin);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.sendStatus(200);
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/exhibitors', exhibitorsRoutes);
app.use('/api/v1/exhibitions', exhibitionsRoutes);
app.use('/api/v1/exhibitor-branding', exhibitorBrandingRoutes);
app.use('/api/v1/trade-info', tradeInfoRoutes);
app.use('/api/v1/invitations', invitationsRoutes);
app.use('/api/v1/trade-events', tradeEventsRoutes);
app.use('/api/v1/exhibitor-documents', exhibitorDocumentsRoutes);

// Serve Swagger UI if spec is available
if (swaggerDocument) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('📘 Swagger UI available at /api-docs');
}

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PTAK EXPO Backend API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      exhibitors: '/api/v1/exhibitors',
      exhibitions: '/api/v1/exhibitions',
      exhibitorBranding: '/api/v1/exhibitor-branding',
      tradeInfo: '/api/v1/trade-info'
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