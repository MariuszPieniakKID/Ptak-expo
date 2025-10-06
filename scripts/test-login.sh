#!/bin/bash

echo "🔍 Testing login for test.admin@ptak-expo.com..."
echo ""

cd /Users/kid/Ptak-expo/ptak-expo-backend

# Test password verification
railway run --service Backend node -e "
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function testLogin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const email = 'test.admin@ptak-expo.com';
    const password = 'admin123';
    
    console.log('Testing login for:', email);
    console.log('Password:', password);
    console.log('');
    
    // Query database exactly as authController does
    const result = await pool.query(
      'SELECT * FROM users WHERE email = \$1 AND status = \$2',
      [email.toLowerCase(), 'active']
    );

    console.log('Query result count:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found with email.toLowerCase()');
      
      // Try without toLowerCase
      const result2 = await pool.query(
        'SELECT * FROM users WHERE email = \$1',
        [email]
      );
      
      console.log('Query without toLowerCase count:', result2.rows.length);
      
      if (result2.rows.length > 0) {
        console.log('✅ User found without toLowerCase!');
        console.log('   Email in DB:', result2.rows[0].email);
        console.log('   Role:', result2.rows[0].role);
        console.log('   Status:', result2.rows[0].status);
      }
    } else {
      const user = result.rows[0];
      console.log('✅ User found!');
      console.log('   Email in DB:', user.email);
      console.log('   Role:', user.role);
      console.log('   Status:', user.status);
      console.log('   Password Hash:', user.password_hash);
      
      // Test password
      const isValid = await bcrypt.compare(password, user.password_hash);
      console.log('');
      console.log('Password validation result:', isValid ? '✅ VALID' : '❌ INVALID');
      
      if (!isValid) {
        // Try test123 instead
        const isValid2 = await bcrypt.compare('test123', user.password_hash);
        console.log('Password test123 result:', isValid2 ? '✅ VALID' : '❌ INVALID');
      }
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
"

