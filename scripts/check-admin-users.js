// Script to check admin users in Railway database
const { Pool } = require('../ptak-expo-backend/node_modules/pg');
const { execSync } = require('child_process');

async function checkAdminUsers() {
  try {
    console.log('🔍 Getting Railway database URL...');
    
    // Get Railway database URL
    let databaseUrl;
    try {
      databaseUrl = execSync('railway variables --service Backend | grep DATABASE_PUBLIC_URL', { 
        encoding: 'utf8',
        cwd: '/Users/kid/Ptak-expo/ptak-expo-backend'
      }).trim().split('=')[1];
    } catch (e) {
      console.error('❌ Error getting DATABASE_PUBLIC_URL, trying DATABASE_URL...');
      try {
        databaseUrl = execSync('railway variables --service Backend | grep DATABASE_URL', { 
          encoding: 'utf8',
          cwd: '/Users/kid/Ptak-expo/ptak-expo-backend'
        }).trim().split('=')[1].split('\n')[0];
      } catch (e2) {
        console.error('❌ Error getting Railway database URL');
        console.error('Make sure Railway CLI is installed and you are logged in');
        console.error('Run: railway login');
        process.exit(1);
      }
    }

    if (!databaseUrl || databaseUrl.length === 0) {
      console.error('❌ Could not retrieve database URL from Railway');
      console.error('Make sure you are in the correct Railway project and service');
      process.exit(1);
    }

    console.log('✅ Database URL obtained');
    console.log('🔍 Connecting to Railway database...');

    // Create database connection
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 30000,
    });

    console.log('✅ Connected to Railway database');
    console.log('🔍 Querying admin users...\n');

    // Query for admin users
    const result = await pool.query(`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        role,
        status,
        created_at,
        updated_at
      FROM users 
      WHERE role = 'admin'
      ORDER BY created_at ASC
    `);

    if (result.rows.length === 0) {
      console.log('⚠️  No admin users found in the database');
    } else {
      console.log(`✅ Found ${result.rows.length} admin user(s):\n`);
      console.log('═'.repeat(100));
      result.rows.forEach((user, index) => {
        console.log(`\n${index + 1}. Admin User:`);
        console.log(`   ID:           ${user.id}`);
        console.log(`   Email:        ${user.email}`);
        console.log(`   Name:         ${user.first_name} ${user.last_name}`);
        console.log(`   Role:         ${user.role}`);
        console.log(`   Status:       ${user.status || 'N/A'}`);
        console.log(`   Created:      ${user.created_at}`);
        console.log(`   Last Updated: ${user.updated_at}`);
        console.log('─'.repeat(100));
      });
      console.log('\n');
    }

    // Close connection
    await pool.end();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the function
checkAdminUsers();

