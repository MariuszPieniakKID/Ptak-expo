#!/bin/bash

echo "🔧 Changing role for pieniak@gmail.com from exhibitor to admin..."
echo ""

cd /Users/kid/Ptak-expo/ptak-expo-backend

railway run --service Backend node -e "
const { Pool } = require('pg');

async function fixRole() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const email = 'pieniak@gmail.com';
    
    console.log('Updating role for:', email);
    console.log('From: exhibitor');
    console.log('To: admin');
    console.log('');
    
    const result = await pool.query(
      'UPDATE users SET role = \$1, updated_at = NOW() WHERE email = \$2 RETURNING id, email, first_name, last_name, role, status',
      ['admin', email]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Role updated successfully!');
      console.log('');
      console.log('User details:');
      console.log(\`  ID:       \${user.id}\`);
      console.log(\`  Email:    \${user.email}\`);
      console.log(\`  Name:     \${user.first_name} \${user.last_name}\`);
      console.log(\`  Role:     \${user.role}\`);
      console.log(\`  Status:   \${user.status}\`);
      console.log('');
      console.log('🔑 You can now login to admin panel with:');
      console.log(\`   Email:    \${user.email}\`);
      console.log('   Password: 3oirwy2iCPZL');
    } else {
      console.log('❌ User not found');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixRole();
"

