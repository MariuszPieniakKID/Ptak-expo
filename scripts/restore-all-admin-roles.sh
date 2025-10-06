#!/bin/bash

echo "🔧 Restoring admin roles for users who should be admins..."
echo ""

cd /Users/kid/Ptak-expo/ptak-expo-backend

railway run --service Backend node -e "
const { Pool } = require('pg');

async function restoreAdminRoles() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Lista użytkowników, którzy powinni być adminami (nawet jeśli są w exhibitors)
    const adminEmails = [
      'pieniak@gmail.com',
      'test.admin@ptak-expo.com',
      'admin@ptak-expo.com',
      'test.admin@ptak-expo.com',
      'magda.masny@warsawexpo.eu',
      'quang.thuy@warsawexpo.eu',
      'anna.dereszowska@warsawexpo.eu',
      'marian.pienkowski@warsawexpo.eu',
      'test@test.com',
      'o.tkaczyk@warsawexpo.eu',
      'dorota@oryginalni.studio',
      'dpvr@oryginalni.eu'
    ];
    
    console.log('Updating admin roles for', adminEmails.length, 'users...');
    console.log('');
    
    for (const email of adminEmails) {
      const result = await pool.query(
        'UPDATE users SET role = \$1, updated_at = NOW() WHERE LOWER(email) = LOWER(\$2) RETURNING id, email, first_name, last_name, role',
        ['admin', email]
      );
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        console.log(\`✅ \${user.email} - role set to admin\`);
      } else {
        console.log(\`⚠️  \${email} - user not found\`);
      }
    }
    
    console.log('');
    console.log('✅ Admin roles restored!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

restoreAdminRoles();
"

