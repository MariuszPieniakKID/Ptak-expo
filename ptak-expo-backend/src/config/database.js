const { Pool } = require('pg');

// Determine which database to use based on environment
const getDatabaseUrl = () => {
  // If we're in Railway production environment, use Railway's DATABASE_URL
  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('🔍 Railway environment detected, resolving database URL');
    // Prefer DATABASE_URL; fallback to DATABASE_PUBLIC_URL (some templates expose this)
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      return process.env.DATABASE_URL;
    }
    if (process.env.DATABASE_PUBLIC_URL && process.env.DATABASE_PUBLIC_URL.trim()) {
      console.log('🔍 Using DATABASE_PUBLIC_URL fallback');
      return process.env.DATABASE_PUBLIC_URL;
    }
    // Fallback: construct from discrete PG env vars if available
    const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE, PGSSLMODE } = process.env;
    if (PGHOST && PGUSER && (PGPASSWORD || process.env.PG_PASSWORD) && PGDATABASE) {
      const port = PGPORT || '5432';
      const password = PGPASSWORD || process.env.PG_PASSWORD || '';
      const sslmode = PGSSLMODE || 'require';
      const url = `postgresql://${encodeURIComponent(PGUSER)}:${encodeURIComponent(password)}@${PGHOST}:${port}/${PGDATABASE}?sslmode=${sslmode}`;
      console.log('🔍 Built DATABASE_URL from discrete PG env vars');
      return url;
    }
    // As last resort, return undefined (handled by caller)
    return undefined;
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
// Enforce configured database in production; abort if missing
if (!databaseUrl || String(databaseUrl).trim().length === 0) {
  console.error('❌ DATABASE_URL is not set. The backend requires a working database. Aborting startup.');
  throw new Error('DATABASE_URL is required');
}

// Extra safety: in local development, block connecting to remote DBs unless explicitly allowed
try {
  const parsed = new URL(databaseUrl);
  const host = parsed.hostname || '';
  const isLocalHost = ['localhost', '127.0.0.1', '::1', 'host.docker.internal'].includes(host);
  const isDev = (process.env.NODE_ENV || 'development') !== 'production' && !process.env.RAILWAY_ENVIRONMENT;
  const allowRemoteInDev = process.env.ALLOW_REMOTE_DB_IN_DEV === '1';
  if (isDev && !isLocalHost && !allowRemoteInDev) {
    console.error('❌ Refusing to connect to a remote database in development:', host);
    console.error('💡 Set LOCAL_DATABASE_URL to a local Postgres, or set ALLOW_REMOTE_DB_IN_DEV=1 to override (use with caution).');
    throw new Error('Remote DB connection blocked in development');
  }
} catch (e) {
  // If URL parsing fails, proceed (will likely fail later when Pool connects)
}

// Database connection configuration
// Decide SSL based on host: internal Railway postgres usually doesn't need SSL
let sslOption = false;
try {
  const urlObj = new URL(databaseUrl);
  const host = urlObj.hostname || '';
  const isRailwayEnv = Boolean(process.env.RAILWAY_ENVIRONMENT);
  const isInternalHost = host.endsWith('railway.internal');
  if (!isInternalHost && (process.env.NODE_ENV === 'production' || isRailwayEnv)) {
    sslOption = { rejectUnauthorized: false };
  }
  console.log('🔍 Database SSL option:', isInternalHost ? 'disabled (internal host)' : (sslOption ? 'enabled' : 'disabled'));
} catch {
  // fallback to previous behavior
  sslOption = (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) ? { rejectUnauthorized: false } : false;
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: sslOption,
  connectionTimeoutMillis: 30000, // 30 seconds timeout
  idleTimeoutMillis: 30000,
  max: 20, // Maximum number of connections
  min: 0,  // Avoid eager connections on startup
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
        avatar_url TEXT,
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

    // Ensure avatar_url column exists for user profile photos
    try {
      const avatarCol = await pool.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar_url'
      `);
      if (avatarCol.rows.length === 0) {
        console.log('⚠️ Adding missing column users.avatar_url ...');
        await pool.query(`ALTER TABLE users ADD COLUMN avatar_url TEXT`);
        console.log('✅ Added users.avatar_url');
      } else {
        console.log('✅ users.avatar_url already exists');
      }
    } catch (alterErr) {
      console.error('❌ Error ensuring users.avatar_url column:', alterErr);
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
        website TEXT,
        status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Ensure website column exists for older databases
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'exhibitions' AND column_name = 'website'
        ) THEN
          ALTER TABLE exhibitions ADD COLUMN website TEXT;
        END IF;
      END $$;
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
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Ensure created_by column exists for older databases
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'communications' AND column_name = 'created_by'
        ) THEN
          ALTER TABLE communications ADD COLUMN created_by INTEGER REFERENCES users(id);
        END IF;
      END $$;
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

    console.log('🔍 Creating exhibitors table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exhibitors (
        id SERIAL PRIMARY KEY,
        nip VARCHAR(20) UNIQUE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        address VARCHAR(255) NOT NULL,
        postal_code VARCHAR(10) NOT NULL,
        city VARCHAR(100) NOT NULL,
        contact_person VARCHAR(255) NOT NULL,
        contact_role VARCHAR(100) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Ensure unique constraint on exhibitors.email to prevent duplicates
    try {
      await pool.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            WHERE tc.table_name = 'exhibitors' AND tc.constraint_type = 'UNIQUE' AND tc.constraint_name = 'exhibitors_email_key'
          ) THEN
            ALTER TABLE exhibitors ADD CONSTRAINT exhibitors_email_key UNIQUE(email);
          END IF;
        END $$;
      `);
      console.log('✅ UNIQUE(exhibitors.email) ensured');
    } catch (e) {
      console.warn('⚠️ Could not ensure UNIQUE on exhibitors.email:', e?.message || e);
    }
    
    // Add password_hash column if it doesn't exist (for existing databases)
    await pool.query(`
      ALTER TABLE exhibitors 
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
    `);

    console.log('🔍 Creating exhibitor_events table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exhibitor_events (
        id SERIAL PRIMARY KEY,
        exhibitor_id INTEGER REFERENCES exhibitors(id) ON DELETE CASCADE,
        exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
        supervisor_user_id INTEGER REFERENCES users(id),
        hall_name VARCHAR(255),
        stand_number VARCHAR(50),
        booth_area NUMERIC(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(exhibitor_id, exhibition_id)
      )
    `);

    // Ensure supervisor_user_id column exists for older databases
    await pool.query(`
      ALTER TABLE exhibitor_events
      ADD COLUMN IF NOT EXISTS supervisor_user_id INTEGER REFERENCES users(id)
    `);
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'exhibitor_events' AND column_name = 'hall_name'
        ) THEN
          ALTER TABLE exhibitor_events ADD COLUMN hall_name VARCHAR(255);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'exhibitor_events' AND column_name = 'stand_number'
        ) THEN
          ALTER TABLE exhibitor_events ADD COLUMN stand_number VARCHAR(50);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'exhibitor_events' AND column_name = 'booth_area'
        ) THEN
          ALTER TABLE exhibitor_events ADD COLUMN booth_area NUMERIC(10,2);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'exhibitor_events' AND column_name = 'invitation_limit'
        ) THEN
          ALTER TABLE exhibitor_events ADD COLUMN invitation_limit INTEGER DEFAULT 50;
        END IF;
      END $$;
    `);
    
    // Set default invitation_limit = 50 for existing records
    await pool.query(`
      UPDATE exhibitor_events SET invitation_limit = 50 WHERE invitation_limit IS NULL
    `);

    console.log('🔍 Creating exhibitor_branding_files table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exhibitor_branding_files (
        id SERIAL PRIMARY KEY,
        exhibitor_id INTEGER NULL REFERENCES exhibitors(id) ON DELETE CASCADE,
        exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
        file_type VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        dimensions VARCHAR(50),
        is_approved BOOLEAN DEFAULT false,
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Ensure blob storage column exists for environments without persistent filesystem
    await pool.query(`
      ALTER TABLE exhibitor_branding_files
      ADD COLUMN IF NOT EXISTS file_blob BYTEA
    `);

    console.log('🔍 Creating indexes for exhibitor_branding_files table...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_exhibitor_branding_files_exhibitor_id ON exhibitor_branding_files(exhibitor_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_exhibitor_branding_files_exhibition_id ON exhibitor_branding_files(exhibition_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_exhibitor_branding_files_type ON exhibitor_branding_files(file_type)
    `);

    // Drop legacy unique constraint and indexes (for older deployments)
    await pool.query(`
      ALTER TABLE exhibitor_branding_files
      DROP CONSTRAINT IF EXISTS exhibitor_branding_files_exhibitor_id_exhibition_id_file_type_key
    `);
    await pool.query(`
      DROP INDEX IF EXISTS idx_exhibitor_branding_files_unique_individual
    `);
    await pool.query(`
      DROP INDEX IF EXISTS idx_exhibitor_branding_files_unique_global
    `);

    // Create partial UNIQUE indexes that EXCLUDE 'dokumenty_brandingowe' to allow multi-file
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_branding_unique_individual_nonpdf 
      ON exhibitor_branding_files(exhibitor_id, exhibition_id, file_type)
      WHERE exhibitor_id IS NOT NULL AND file_type <> 'dokumenty_brandingowe'
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_branding_unique_global_nonpdf 
      ON exhibitor_branding_files(exhibition_id, file_type)
      WHERE exhibitor_id IS NULL AND file_type <> 'dokumenty_brandingowe'
    `);

    // Helpful non-unique indexes specifically for 'dokumenty_brandingowe'
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_branding_docs_individual 
      ON exhibitor_branding_files(exhibitor_id, exhibition_id)
      WHERE file_type = 'dokumenty_brandingowe'
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_branding_docs_global 
      ON exhibitor_branding_files(exhibition_id)
      WHERE exhibitor_id IS NULL AND file_type = 'dokumenty_brandingowe'
    `);

    console.log('🔍 Creating trade_info table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trade_info (
        id SERIAL PRIMARY KEY,
        exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
        exhibitor_start_time TIME,
        exhibitor_end_time TIME,
        visitor_start_time TIME,
        visitor_end_time TIME,
        guest_service_phone VARCHAR(50),
        security_phone VARCHAR(50),
        build_type VARCHAR(100),
        trade_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(exhibition_id)
      )
    `);

    console.log('🔍 Creating trade_build_days table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trade_build_days (
        id SERIAL PRIMARY KEY,
        trade_info_id INTEGER REFERENCES trade_info(id) ON DELETE CASCADE,
        build_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log('🔍 Creating trade_spaces table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trade_spaces (
        id SERIAL PRIMARY KEY,
        trade_info_id INTEGER REFERENCES trade_info(id) ON DELETE CASCADE,
        space_name VARCHAR(255),
        hall_name VARCHAR(255),
        file_path VARCHAR(500),
        original_filename VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log('🔍 Creating trade_plan_links table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trade_plan_links (
        id SERIAL PRIMARY KEY,
        exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Ensure trade_spaces has required columns (for older DBs)
    try {
      const filePathCol = await pool.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trade_spaces' AND column_name = 'file_path'
      `);
      if (filePathCol.rows.length === 0) {
        console.log('⚠️ Adding missing column trade_spaces.file_path ...');
        await pool.query(`ALTER TABLE trade_spaces ADD COLUMN file_path VARCHAR(500)`);
        console.log('✅ Added trade_spaces.file_path');
      }

      const originalFilenameCol = await pool.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trade_spaces' AND column_name = 'original_filename'
      `);
      if (originalFilenameCol.rows.length === 0) {
        console.log('⚠️ Adding missing column trade_spaces.original_filename ...');
        await pool.query(`ALTER TABLE trade_spaces ADD COLUMN original_filename VARCHAR(255)`);
        console.log('✅ Added trade_spaces.original_filename');
      }
    } catch (alterErr) {
      console.error('❌ Error ensuring trade_spaces columns:', alterErr);
    }

    console.log('🔍 Creating invitation_templates table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invitation_templates (
        id SERIAL PRIMARY KEY,
        exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
        invitation_type VARCHAR(100) DEFAULT 'standard',
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        greeting TEXT,
        company_info TEXT,
        contact_person VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        booth_info TEXT,
        special_offers TEXT,
        vip_value TEXT,
        is_template BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Ensure vip_value column exists for older databases
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'invitation_templates' AND column_name = 'vip_value'
        ) THEN
          ALTER TABLE invitation_templates ADD COLUMN vip_value TEXT;
        END IF;
      END $$;
    `);

    console.log('🔍 Creating invitation_recipients table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invitation_recipients (
        id SERIAL PRIMARY KEY,
        invitation_template_id INTEGER REFERENCES invitation_templates(id) ON DELETE CASCADE,
        recipient_email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255),
        recipient_company VARCHAR(255),
        sent_at TIMESTAMPTZ,
        opened_at TIMESTAMPTZ,
        responded_at TIMESTAMPTZ,
        response_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Ensure inviter/exhibitor and exhibition linkage columns exist
    await pool.query(`
      ALTER TABLE invitation_recipients
      ADD COLUMN IF NOT EXISTS exhibitor_id INTEGER REFERENCES exhibitors(id) ON DELETE SET NULL
    `);
    await pool.query(`
      ALTER TABLE invitation_recipients
      ADD COLUMN IF NOT EXISTS exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE
    `);

    console.log('🔍 Creating exhibitor_documents table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exhibitor_documents (
        id SERIAL PRIMARY KEY,
        exhibitor_id INTEGER REFERENCES exhibitors(id) ON DELETE CASCADE,
        exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        category VARCHAR(50) NOT NULL CHECK (category IN ('faktury', 'umowy', 'inne_dokumenty')),
        uploaded_by INTEGER REFERENCES users(id),
        document_source VARCHAR(50) DEFAULT 'exhibitor_self' CHECK (document_source IN ('admin_exhibitor_card', 'exhibitor_self', 'admin_other', 'exhibitor_checklist_materials', 'catalog_images')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(exhibitor_id, exhibition_id, file_name)
      )
    `);
    
    // Add document_source column to existing tables (migration)
    await pool.query(`
      ALTER TABLE exhibitor_documents 
      ADD COLUMN IF NOT EXISTS document_source VARCHAR(50) DEFAULT 'exhibitor_self'
    `).catch(err => {
      console.log('Note: document_source column may already exist');
    });
    
    // Drop old constraint if exists and add new one with updated values
    await pool.query(`
      ALTER TABLE exhibitor_documents 
      DROP CONSTRAINT IF EXISTS exhibitor_documents_document_source_check
    `).catch(err => {
      console.log('Note: constraint may not exist yet');
    });
    
    // Drop old constraint if exists and add new one with catalog_images
    await pool.query(`
      ALTER TABLE exhibitor_documents 
      DROP CONSTRAINT IF EXISTS exhibitor_documents_document_source_check
    `).catch(() => {});
    
    await pool.query(`
      ALTER TABLE exhibitor_documents 
      ADD CONSTRAINT exhibitor_documents_document_source_check 
      CHECK (document_source IN ('admin_exhibitor_card', 'exhibitor_self', 'admin_other', 'exhibitor_checklist_materials', 'catalog_images'))
    `).catch(err => {
      console.log('Note: constraint may already exist with new values');
    });

    console.log('🔍 Creating indexes for trade_info and invitations tables...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_trade_info_exhibition_id ON trade_info(exhibition_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_trade_build_days_trade_info_id ON trade_build_days(trade_info_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_trade_spaces_trade_info_id ON trade_spaces(trade_info_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_invitations_exhibition_id ON invitation_templates(exhibition_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_invitations_type ON invitation_templates(invitation_type)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_invitation_recipients_invitation_id ON invitation_recipients(invitation_template_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_invitation_recipients_email ON invitation_recipients(recipient_email)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_invitation_recipients_exhibitor_id ON invitation_recipients(exhibitor_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_invitation_recipients_exhibition_id ON invitation_recipients(exhibition_id)
    `);

    console.log('🔍 Creating trade_events table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trade_events (
        id SERIAL PRIMARY KEY,
        exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
        exhibitor_id INTEGER REFERENCES exhibitors(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        event_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        hall VARCHAR(255),
        organizer VARCHAR(255),
        description TEXT,
        type VARCHAR(100) NOT NULL,
        link TEXT,
        event_source VARCHAR(50) DEFAULT 'official_events' CHECK (event_source IN ('official_events', 'construction')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Add event_source column if it doesn't exist (for existing databases)
    await pool.query(`
      DO $$ 
      BEGIN
        -- Add column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'trade_events' AND column_name = 'event_source'
        ) THEN
          ALTER TABLE trade_events ADD COLUMN event_source VARCHAR(50) DEFAULT 'official_events';
        END IF;
        
        -- Update any NULL values to default
        UPDATE trade_events SET event_source = 'official_events' WHERE event_source IS NULL;
        
        -- Drop old constraint if exists and add new one
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'trade_events_event_source_check' AND table_name = 'trade_events'
        ) THEN
          ALTER TABLE trade_events DROP CONSTRAINT trade_events_event_source_check;
        END IF;
        
        ALTER TABLE trade_events ADD CONSTRAINT trade_events_event_source_check 
          CHECK (event_source IN ('official_events', 'construction'));
      END $$;
    `);
    
    // Add is_in_agenda column for displaying events in exhibitor portal (migration)
    await pool.query(`
      DO $$ 
      BEGIN
        -- Add column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'trade_events' AND column_name = 'is_in_agenda'
        ) THEN
          ALTER TABLE trade_events ADD COLUMN is_in_agenda BOOLEAN DEFAULT false;
        END IF;
        
        -- Update any NULL values to default
        UPDATE trade_events SET is_in_agenda = false WHERE is_in_agenda IS NULL;
      END $$;
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_trade_events_exhibition_id ON trade_events(exhibition_id)
    `);
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'trade_events' AND column_name = 'exhibitor_id'
        ) THEN
          ALTER TABLE trade_events ADD COLUMN exhibitor_id INTEGER REFERENCES exhibitors(id) ON DELETE CASCADE;
          CREATE INDEX IF NOT EXISTS idx_trade_events_exhibitor_id ON trade_events(exhibitor_id);
        END IF;
      END $$;
    `);
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'trade_events' AND column_name = 'organizer'
        ) THEN
          ALTER TABLE trade_events ADD COLUMN organizer VARCHAR(255);
        END IF;
      END $$;
    `);
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'trade_events' AND column_name = 'link'
        ) THEN
          ALTER TABLE trade_events ADD COLUMN link TEXT;
        END IF;
      END $$;
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_exhibitor_documents_exhibitor_id ON exhibitor_documents(exhibitor_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_exhibitor_documents_exhibition_id ON exhibitor_documents(exhibition_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_exhibitor_documents_category ON exhibitor_documents(category)
    `);

    // Create exhibitor_people table to store contacts/badges linked to exhibitor
    console.log('🔍 Creating exhibitor_people table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exhibitor_people (
        id SERIAL PRIMARY KEY,
        exhibitor_id INTEGER REFERENCES exhibitors(id) ON DELETE CASCADE,
        exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        position VARCHAR(255),
        email VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_exhibitor_people_exhibitor_id ON exhibitor_people(exhibitor_id)
    `);
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'exhibitor_people' AND column_name = 'exhibition_id'
        ) THEN
          ALTER TABLE exhibitor_people ADD COLUMN exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_exhibitor_people_exhibition_id ON exhibitor_people(exhibition_id)
    `);

    // Awards per exhibitor per exhibition
    console.log('🔍 Creating exhibitor_awards table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exhibitor_awards (
        id SERIAL PRIMARY KEY,
        exhibitor_id INTEGER REFERENCES exhibitors(id) ON DELETE CASCADE,
        exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
        application_text TEXT,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','submitted','accepted','rejected')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(exhibitor_id, exhibition_id)
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_exhibitor_awards_exhibitor_id ON exhibitor_awards(exhibitor_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_exhibitor_awards_exhibition_id ON exhibitor_awards(exhibition_id)
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

    // DISABLED: Automatic role enforcement was causing issues with manually set admin roles
    // This code was automatically changing admin users to exhibitor role on backend restart
    // if their email existed in exhibitors table. This is wrong because some exhibitors
    // need admin access (e.g., pieniak@gmail.com, test.admin@ptak-expo.com).
    //
    // Roles should be managed manually through the admin panel, not automatically.
    //
    // Original problematic code (disabled 2025-10-06):
    // try {
    //   console.log('🔍 Ensuring exhibitor accounts have role exhibitor (without demoting admins)...');
    //   await pool.query(`
    //     UPDATE users u
    //     SET role = 'exhibitor', updated_at = NOW()
    //     FROM exhibitors e
    //     WHERE LOWER(u.email) = LOWER(e.email)
    //       AND u.role IS DISTINCT FROM 'exhibitor'
    //       AND u.role <> 'admin'
    //   `);
    //   console.log('✅ Exhibitor roles ensured (admins preserved).');
    //
    //   console.log('🔍 Upgrading non-exhibitor users to admin role...');
    //   await pool.query(`
    //     UPDATE users u
    //     SET role = 'admin', updated_at = NOW()
    //     WHERE u.role IS DISTINCT FROM 'admin'
    //       AND LOWER(u.email) NOT IN (SELECT LOWER(email) FROM exhibitors)
    //   `);
    //   console.log('✅ Non-exhibitor users upgraded to admin (if any changes were needed).');
    // } catch (e) {
    //   console.warn('⚠️ Could not enforce roles for users:', e?.message || e);
    // }
    
    console.log('✅ Skipped automatic role enforcement (manually managed through admin panel)');

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

    console.log('🔍 Inserting test exhibitors...');
    await pool.query(`
      INSERT INTO exhibitors (nip, company_name, address, postal_code, city, contact_person, contact_role, phone, email, password_hash) 
      VALUES 
        ('1234567890', 'ABC Electronics Sp. z o.o.', 'ul. Elektroniczna 15', '00-001', 'Warszawa', 'Jan Kowalski', 'Kierownik Sprzedaży', '+48 22 123 45 67', 'j.kowalski@abc-electronics.pl', '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G'),
        ('9876543210', 'TechnoMed Solutions', 'Al. Medyczna 8', '31-000', 'Kraków', 'Anna Nowak', 'Dyrektor Handlowy', '+48 12 987 65 43', 'a.nowak@technomed.pl', '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G'),
        ('5555666777', 'Green Energy Systems', 'ul. Zielona 22', '50-001', 'Wrocław', 'Piotr Wiśniewski', 'Specjalista ds. Sprzedaży', '+48 71 555 66 77', 'p.wisniewski@green-energy.pl', '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G'),
        ('1111222333', 'Digital Marketing Pro', 'ul. Cyfrowa 5', '80-001', 'Gdańsk', 'Maria Kowalczyk', 'Account Manager', '+48 58 111 22 33', 'm.kowalczyk@digitalmarketing.pl', '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G'),
        ('4444555666', 'Industrial Automation Ltd', 'ul. Przemysłowa 44', '40-001', 'Katowice', 'Tomasz Zieliński', 'Inżynier Sprzedaży', '+48 32 444 55 66', 't.zielinski@automation.pl', '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G')
      ON CONFLICT (nip) DO NOTHING
    `);

    // Skip inserting test exhibitions to prevent auto-creation
    console.log('🔍 Skipping test exhibitions insertion (disabled to prevent auto-creation)');
    // Test exhibitions are now managed manually through admin interface
    /*
    await pool.query(`
      INSERT INTO exhibitions (name, description, start_date, end_date, location, status) 
      VALUES 
        ('Branżowe Targi Technologii Filtracji i Zastosowania Filtrów', 'Największe targi technologii filtracji w Polsce', '2026-03-11', '2026-03-15', 'Warszawa', 'planned'),
        ('International Trade Fair for Building Technologies and Materials', 'Międzynarodowe targi technologii budowlanych', '2026-03-11', '2026-03-15', 'Kraków', 'planned'),
        ('Targi Technologii Medycznych i Farmaceutycznych', 'Specjalistyczne targi branży medycznej', '2026-04-20', '2026-04-23', 'Gdańsk', 'planned'),
        ('Międzynarodowe Targi Energii Odnawialnej', 'Targi poświęcone zielonej energii', '2026-05-15', '2026-05-18', 'Wrocław', 'planned'),
        ('Targi Automatyki Przemysłowej', 'Nowoczesne rozwiązania automatyki', '2026-06-10', '2026-06-13', 'Katowice', 'planned'),
        ('Targi Technologii Informatycznych', 'Najnowsze trendy w IT', '2026-07-08', '2026-07-11', 'Poznań', 'planned'),
        ('Międzynarodowe Targi Materiałów Podłogowych i Powierzchniowych', 'Targi materiałów wykończeniowych', '2025-06-03', '2025-06-05', 'Warszawa', 'active'),
        ('Targi Bezpieczeństwa i Ochrony', 'Systemy bezpieczeństwa i ochrony', '2026-08-12', '2026-08-15', 'Łódź', 'planned'),
        ('Targi Transportu i Logistyki', 'Nowoczesne rozwiązania transportowe', '2026-09-05', '2026-09-08', 'Szczecin', 'planned')
      ON CONFLICT DO NOTHING
    `);
    */

    console.log('✅ Database tables initialized successfully');
    // Ensure exhibitor_catalog_entries exists and has products column
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS exhibitor_catalog_entries (
          id SERIAL PRIMARY KEY,
          exhibitor_id INTEGER REFERENCES exhibitors(id) ON DELETE CASCADE,
          exhibition_id INTEGER NULL REFERENCES exhibitions(id) ON DELETE SET NULL,
          name VARCHAR(255),
          logo TEXT,
          description TEXT,
          contact_info TEXT,
          website TEXT,
          socials TEXT,
          contact_email VARCHAR(255),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`ALTER TABLE exhibitor_catalog_entries ADD COLUMN IF NOT EXISTS products JSONB`);
      await pool.query(`ALTER TABLE exhibitor_catalog_entries ADD COLUMN IF NOT EXISTS catalog_tags TEXT`);
      await pool.query(`ALTER TABLE exhibitor_catalog_entries ADD COLUMN IF NOT EXISTS brands TEXT`);
      await pool.query(`ALTER TABLE exhibitor_catalog_entries ADD COLUMN IF NOT EXISTS display_name TEXT`);
      await pool.query(`ALTER TABLE exhibitor_catalog_entries ADD COLUMN IF NOT EXISTS why_visit TEXT`);
      await pool.query(`ALTER TABLE exhibitor_catalog_entries ADD COLUMN IF NOT EXISTS catalog_contact_person TEXT`);
      await pool.query(`ALTER TABLE exhibitor_catalog_entries ADD COLUMN IF NOT EXISTS catalog_contact_phone TEXT`);
      await pool.query(`ALTER TABLE exhibitor_catalog_entries ADD COLUMN IF NOT EXISTS catalog_contact_email TEXT`);
      // Optional: index for faster global lookups
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_catalog_entries_exhibitor ON exhibitor_catalog_entries(exhibitor_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_catalog_entries_updated_at ON exhibitor_catalog_entries(updated_at DESC)`);
      // Tags dictionary for suggestions
      await pool.query(`
        CREATE TABLE IF NOT EXISTS catalog_tags (
          id SERIAL PRIMARY KEY,
          tag VARCHAR(255) UNIQUE NOT NULL,
          usage_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_catalog_tags_usage ON catalog_tags(usage_count DESC)`);
      // Brands dictionary for suggestions
      await pool.query(`
        CREATE TABLE IF NOT EXISTS catalog_brands (
          id SERIAL PRIMARY KEY,
          brand VARCHAR(255) UNIQUE NOT NULL,
          usage_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_catalog_brands_usage ON catalog_brands(usage_count DESC)`);

      // Industries dictionary for suggestions
      await pool.query(`
        CREATE TABLE IF NOT EXISTS catalog_industries (
          id SERIAL PRIMARY KEY,
          industry VARCHAR(255) UNIQUE NOT NULL,
          usage_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_catalog_industries_usage ON catalog_industries(usage_count DESC)`);

      // Event fields dictionary for editable event industries/types
      await pool.query(`
        CREATE TABLE IF NOT EXISTS catalog_event_fields (
          id SERIAL PRIMARY KEY,
          event_field VARCHAR(255) UNIQUE NOT NULL,
          usage_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_catalog_event_fields_usage ON catalog_event_fields(usage_count DESC)`);

      // Build types dictionary for trade fair construction options
      await pool.query(`
        CREATE TABLE IF NOT EXISTS catalog_build_types (
          id SERIAL PRIMARY KEY,
          build_type VARCHAR(255) UNIQUE NOT NULL,
          usage_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_catalog_build_types_usage ON catalog_build_types(usage_count DESC)`);

      // Ensure exhibitor_catalog_entries has event-specific industries column (comma-separated list)
      await pool.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'exhibitor_catalog_entries' AND column_name = 'industries'
          ) THEN
            ALTER TABLE exhibitor_catalog_entries ADD COLUMN industries TEXT;
          END IF;
        END $$;
      `);
    } catch (e) {
      console.error('❌ Error ensuring exhibitor_catalog_entries/products:', e);
    }
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
  initializeDatabase,
  // Expose for startup logic/safety checks
  databaseUrl
}; 