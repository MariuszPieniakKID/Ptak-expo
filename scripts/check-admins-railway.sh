#!/bin/bash

echo "🔍 Checking admin users in Railway database..."
echo ""

cd /Users/kid/Ptak-expo/ptak-expo-backend

# Execute SQL query through Railway run command
railway run --service Backend node -e "
const { Pool } = require('pg');

async function checkAdmins() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query(\`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        role,
        status,
        created_at::text,
        updated_at::text
      FROM users 
      WHERE role = 'admin'
      ORDER BY created_at ASC
    \`);

    console.log('\\n═══════════════════════════════════════════════════════════════════════════════════════════════════\\n');
    if (result.rows.length === 0) {
      console.log('⚠️  No admin users found in the database\\n');
    } else {
      console.log(\`✅ Found \${result.rows.length} admin user(s):\\n\`);
      result.rows.forEach((user, index) => {
        console.log(\`\${index + 1}. Admin User:\`);
        console.log(\`   ID:           \${user.id}\`);
        console.log(\`   Email:        \${user.email}\`);
        console.log(\`   Name:         \${user.first_name} \${user.last_name}\`);
        console.log(\`   Role:         \${user.role}\`);
        console.log(\`   Status:       \${user.status || 'N/A'}\`);
        console.log(\`   Created:      \${new Date(user.created_at).toLocaleString('pl-PL')}\`);
        console.log(\`   Last Updated: \${new Date(user.updated_at).toLocaleString('pl-PL')}\`);
        console.log('─────────────────────────────────────────────────────────────────────────────────────────────────');
      });
    }
    console.log('\\n═══════════════════════════════════════════════════════════════════════════════════════════════════\\n');
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAdmins();
"

