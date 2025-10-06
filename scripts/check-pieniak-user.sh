#!/bin/bash

echo "🔍 Checking user pieniak@gmail.com in Railway database..."
echo ""

cd /Users/kid/Ptak-expo/ptak-expo-backend

railway run --service Backend node -e "
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function checkUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const email = 'pieniak@gmail.com';
    const testPassword = '3oirwy2iCPZL';
    
    console.log('Searching for user:', email);
    console.log('Test password:', testPassword);
    console.log('');
    
    // Try exact match first
    let result = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role, status, created_at::text, updated_at::text FROM users WHERE email = \$1',
      [email]
    );

    if (result.rows.length === 0) {
      // Try with toLowerCase
      result = await pool.query(
        'SELECT id, email, password_hash, first_name, last_name, role, status, created_at::text, updated_at::text FROM users WHERE LOWER(email) = LOWER(\$1)',
        [email]
      );
    }

    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
    if (result.rows.length === 0) {
      console.log('❌ User NOT FOUND in database');
      console.log('');
      console.log('Searching for similar emails...');
      const similarResult = await pool.query(
        \"SELECT email, first_name, last_name, role, status FROM users WHERE email LIKE '%pieniak%' OR email LIKE '%gmail%' OR first_name LIKE '%pieniak%' OR last_name LIKE '%pieniak%'\"
      );
      if (similarResult.rows.length > 0) {
        console.log('Found similar users:');
        similarResult.rows.forEach(u => {
          console.log(\`  - \${u.email} (\${u.first_name} \${u.last_name}) - Role: \${u.role}, Status: \${u.status}\`);
        });
      } else {
        console.log('No similar users found');
      }
    } else {
      const user = result.rows[0];
      console.log('✅ User FOUND!');
      console.log('');
      console.log('User details:');
      console.log(\`  ID:            \${user.id}\`);
      console.log(\`  Email:         \${user.email}\`);
      console.log(\`  Name:          \${user.first_name} \${user.last_name}\`);
      console.log(\`  Role:          \${user.role}\`);
      console.log(\`  Status:        \${user.status || 'N/A'}\`);
      console.log(\`  Created:       \${new Date(user.created_at).toLocaleString('pl-PL')}\`);
      console.log(\`  Last Updated:  \${new Date(user.updated_at).toLocaleString('pl-PL')}\`);
      console.log(\`  Password Hash: \${user.password_hash}\`);
      console.log('');
      
      // Test password
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      console.log(\`Password '\${testPassword}' validation: \${isValid ? '✅ VALID' : '❌ INVALID'}\`);
      
      if (!isValid) {
        console.log('');
        console.log('Testing other common passwords:');
        const testPasswords = ['admin123', 'test123', 'Admin123', 'Pieniak123'];
        for (const pwd of testPasswords) {
          const valid = await bcrypt.compare(pwd, user.password_hash);
          if (valid) {
            console.log(\`  ✅ Password '\${pwd}' is VALID!\`);
          }
        }
      }
    }
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUser();
"

