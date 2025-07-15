const { Pool } = require('pg');

// Determine which database to use based on environment
const getDatabaseUrl = () => {
  // If we're in Railway production environment, use Railway's DATABASE_URL
  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('🔍 Railway environment detected, using Railway database');
    return process.env.DATABASE_URL;
  }
  
  // If LOCAL_DATABASE_URL is set, use it for local development
  if (process.env.LOCAL_DATABASE_URL) {
    console.log('🔍 Local development environment, using local database');
    return process.env.LOCAL_DATABASE_URL;
  }
  
  // Fallback to DATABASE_URL
  console.log('🔍 Using fallback DATABASE_URL');
  return process.env.DATABASE_URL;
};

const databaseUrl = getDatabaseUrl();

console.log('🔍 Database config - Selected URL:', databaseUrl ? 'SET (starts with: ' + databaseUrl.substring(0, 20) + '...)' : 'NOT SET');
console.log('🔍 Database config - NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 Database config - RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'not set');
console.log('🔍 Database config - SSL mode:', process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT ? 'enabled' : 'disabled');

// Database connection configuration
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000, // 30 seconds timeout
  idleTimeoutMillis: 30000,
  max: 20, // Maximum number of connections
  min: 2,  // Minimum number of connections
});

console.log('🔍 Database pool created');

// Test database connection
pool.on('connect', () => {
  console.log('💾 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('💥 Database connection error:', err);
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    console.log('🔍 Starting database initialization...');
    
    // Test connection first with timeout
    console.log('🔍 Testing database connection...');
    const connectionPromise = pool.query('SELECT NOW()');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout after 30 seconds')), 30000);
    });
    
    await Promise.race([connectionPromise, timeoutPromise]);
    console.log('✅ Database connection test successful');

    console.log('🔍 Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'guest',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        company_name VARCHAR(255),
        phone VARCHAR(50),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Check if status column exists and add it if missing
    console.log('🔍 Checking status column...');
    try {
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'status'
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log('⚠️ Status column missing - adding it...');
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN status VARCHAR(20) DEFAULT 'active'
        `);
        console.log('✅ Status column added successfully');
      } else {
        console.log('✅ Status column already exists');
      }
    } catch (statusError) {
      console.error('❌ Error checking/adding status column:', statusError);
    }

    // Log current table structure
    console.log('🔍 Current users table structure:');
    try {
      const tableStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);
      
      tableStructure.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    } catch (structureError) {
      console.error('❌ Error logging table structure:', structureError);
    }

    console.log('🔍 Creating exhibitions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exhibitions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        start_date DATE,
        end_date DATE,
        location VARCHAR(255),
        status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('🔍 Creating documents table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_url VARCHAR(500),
        file_type VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        exhibition_id INTEGER REFERENCES exhibitions(id),
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('🔍 Creating marketing_materials table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_materials (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_url VARCHAR(500),
        file_type VARCHAR(50),
        tags TEXT[],
        exhibition_id INTEGER REFERENCES exhibitions(id),
        is_public BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('🔍 Creating communications table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS communications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'announcement' CHECK (type IN ('announcement', 'notification', 'reminder')),
        is_read BOOLEAN DEFAULT false,
        exhibition_id INTEGER REFERENCES exhibitions(id),
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('🔍 Creating invitations table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invitations (
        id SERIAL PRIMARY KEY,
        guest_email VARCHAR(255) NOT NULL,
        guest_name VARCHAR(255),
        guest_company VARCHAR(255),
        status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'activated', 'confirmed', 'cancelled')),
        invitation_code VARCHAR(100) UNIQUE,
        exhibition_id INTEGER REFERENCES exhibitions(id),
        exhibitor_id INTEGER REFERENCES users(id),
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activated_at TIMESTAMP,
        confirmed_at TIMESTAMP
      )
    `);

    console.log('🔍 Inserting admin user...');
    await pool.query(`
      INSERT INTO users (email, password_hash, role, first_name, last_name) 
      VALUES (
        'admin@ptak-expo.com', 
        '$2a$10$hX.pUgc6uWoiNIpwY3pKi.sfuYiYsVuu5LSkqDElNNHUPDIbCT6Tu', 
        'admin',
        'Admin',
        'PTAK EXPO'
      ) ON CONFLICT (email) DO NOTHING
    `);

    console.log('🔍 Inserting test users...');
    await pool.query(`
      INSERT INTO users (email, password_hash, role, first_name, last_name, phone) 
      VALUES 
        ('test@test.com', '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G', 'exhibitor', 'Test', 'User', '+48 123 456 789'),
        ('magda.masny@warsawexpo.eu', '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G', 'exhibitor', 'Magda', 'Masny', '+48 518 739 122'),
        ('quang.thuy@warsawexpo.eu', '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G', 'exhibitor', 'Quang', 'Thuy', '+48 518 739 123'),
        ('anna.dereszowska@warsawexpo.eu', '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G', 'exhibitor', 'Anna', 'Dereszowska', '+48 518 739 124'),
        ('marian.pienkowski@warsawexpo.eu', '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G', 'exhibitor', 'Marian', 'Pienkowski', '+48 518 739 125')
      ON CONFLICT (email) DO NOTHING
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    console.error('❌ Database error details:', error.message);
    console.error('❌ Database error stack:', error.stack);
    throw error; // Re-throw to be caught by caller
  }
};

// Note: Database initialization is now handled in index.js after server startup
console.log('🔍 Database module loaded - initialization will be handled by server startup');

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initializeDatabase
}; 