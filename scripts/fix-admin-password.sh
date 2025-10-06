#!/bin/bash

echo "🔧 Fixing password for test.admin@ptak-expo.com..."
echo ""

cd /Users/kid/Ptak-expo/ptak-expo-backend

# Update password hash in Railway database
railway run --service Backend node -e "
const { Pool } = require('pg');

async function fixPassword() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const email = 'test.admin@ptak-expo.com';
    const correctHash = '\$2a\$10\$hX.pUgc6uWoiNIpwY3pKi.sfuYiYsVuu5LSkqDElNNHUPDIbCT6Tu'; // admin123
    
    console.log('Updating password hash for:', email);
    console.log('New hash (for admin123):', correctHash);
    console.log('');
    
    const result = await pool.query(
      'UPDATE users SET password_hash = \$1, updated_at = NOW() WHERE email = \$2 RETURNING id, email, first_name, last_name, role',
      [correctHash, email.toLowerCase()]
    );

    if (result.rows.length > 0) {
      console.log('✅ Password updated successfully!');
      console.log('   User ID:', result.rows[0].id);
      console.log('   Email:', result.rows[0].email);
      console.log('   Name:', result.rows[0].first_name, result.rows[0].last_name);
      console.log('   Role:', result.rows[0].role);
      console.log('');
      console.log('🔑 You can now login with:');
      console.log('   Email: test.admin@ptak-expo.com');
      console.log('   Password: admin123');
    } else {
      console.log('❌ User not found');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixPassword();
"

