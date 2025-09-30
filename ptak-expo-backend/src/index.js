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
const gusRoutes = require('./routes/gus');
const invitationsRoutes = require('./routes/invitations');
const tradeEventsRoutes = require('./routes/tradeEvents');
const marketingMaterialsRoutes = require('./routes/marketingMaterials');
const exhibitorAwardsRoutes = require('./routes/exhibitorAwards');
const exhibitorDocumentsRoutes = require('./routes/exhibitorDocuments');
const catalogRoutes = require('./routes/catalog');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const newsRoutes = require('./routes/news');

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
// Force CORS headers echoing Origin (helps with Railway subdomains)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
// Configure Helmet to allow cross-origin resource embedding (for images/PDFs served from backend)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

// CORS Configuration using Railway environment variables
// Support comma-separated list in CORS_ORIGIN
const extraOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
  ...extraOrigins,
  'https://frontend-production-fb96.up.railway.app',
  'https://ptak-expo-production.up.railway.app',
  // Admin front domain
  'https://admin-front-production-7c59.up.railway.app',
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
    // Allow new custom domains under exhibitorlist.eu regardless of exact subdomain
    try {
      const hostname = new URL(origin).hostname;
      if (hostname.endsWith('exhibitorlist.eu')) {
        return callback(null, true);
      }
    } catch (e) {
      if (origin.includes('exhibitorlist.eu')) {
        return callback(null, true);
      }
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

// Handle all preflight requests
app.options('*', cors());

// Increase body size limits to support base64 logo payloads from web
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));

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
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/marketing-materials', marketingMaterialsRoutes);
app.use('/api/v1/exhibitor-awards', exhibitorAwardsRoutes);
app.use('/api/v1/gus', gusRoutes);
app.use('/public', publicRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/news', newsRoutes);

// Serve Swagger UI if spec is available
if (swaggerDocument) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('📘 Swagger UI available at /api-docs');

  // Serve raw swagger files for external tools
  app.get('/swagger.yaml', (req, res) => {
    res.setHeader('Content-Type', 'application/yaml');
    res.sendFile(swaggerSpecPath);
  });
  app.get('/api-docs.json', (req, res) => {
    res.json(swaggerDocument);
  });
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
  console.log(`🔗 Health check: whepohttp://localhost:${PORT}/`);
  console.log(`🔍 DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
  console.log(`🔍 JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
  
  // Initialize database only when safe:
  // - In production (Railway), create/alter tables idempotently
  // - In development, only if using local DB or explicitly allowed
  const isProdOrRailway = process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_ENVIRONMENT);
  const dbUrl = db.databaseUrl || process.env.DATABASE_URL || '';
  let shouldInitDb = false;
  try {
    const u = new URL(dbUrl || '');
    const host = u.hostname || '';
    const isLocal = ['localhost', '127.0.0.1', '::1', 'host.docker.internal'].includes(host);
    if (isProdOrRailway) {
      shouldInitDb = true;
    } else if (isLocal) {
      shouldInitDb = true;
    } else if (process.env.ALLOW_REMOTE_DB_IN_DEV === '1') {
      console.warn('⚠️ ALLOW_REMOTE_DB_IN_DEV=1 set — proceeding to initialize remote DB from dev environment');
      shouldInitDb = true;
    }
  } catch {
    // If URL parsing fails, default to safe path: don't initialize
    shouldInitDb = false;
  }

  if (shouldInitDb) {
    console.log('🔍 Server started successfully, initializing database in background...');
    db.initializeDatabase()
      .then(() => {
        console.log('✅ Database initialization completed');
      })
      .catch((error) => {
        console.error('❌ Database initialization failed:', error.message);
        console.error('❌ Database error details:', error.stack);
        console.error('⚠️  Server will continue running without database');
      });
  } else {
    console.log('🛑 Skipping database initialization to avoid touching remote DB in development');
  }
});

module.exports = app; 