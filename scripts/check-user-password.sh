#!/bin/bash

echo "🔍 Checking password hash for admin@ptak-expo.com in Railway database..."
echo ""

cd /Users/kid/Ptak-expo/ptak-expo-backend

# Execute SQL query through Railway run command
railway run --service Backend node -e "
const { Pool } = require('pg');

async function checkUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query(\`
      SELECT 
        id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        status,
        created_at::text
      FROM users 
      WHERE LOWER(email) = LOWER('admin@ptak-expo.com')
    \`);

    console.log('\\n═══════════════════════════════════════════════════════════════════════════════════════════════════\\n');
    if (result.rows.length === 0) {
      console.log('⚠️  User not found\\n');
    } else {
      const user = result.rows[0];
      console.log('✅ Found user:\\n');
      console.log(\`   ID:            \${user.id}\`);
      console.log(\`   Email:         \${user.email}\`);
      console.log(\`   Name:          \${user.first_name} \${user.last_name}\`);
      console.log(\`   Role:          \${user.role}\`);
      console.log(\`   Status:        \${user.status || 'N/A'}\`);
      console.log(\`   Created:       \${new Date(user.created_at).toLocaleString('pl-PL')}\`);
      console.log(\`   Password Hash: \${user.password_hash || 'NULL'}\`);
      console.log('\\n   Expected hash for admin123: \$2a\$10\$hX.pUgc6uWoiNIpwY3pKi.sfuYiYsVuu5LSkqDElNNHUPDIbCT6Tu');
    }
    console.log('\\n═══════════════════════════════════════════════════════════════════════════════════════════════════\\n');
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUser();
"

