#!/bin/bash

echo "🔍 Checking for users who are BOTH in exhibitors table AND should be admins..."
echo ""

cd /Users/kid/Ptak-expo/ptak-expo-backend

railway run --service Backend node -e "
const { Pool } = require('pg');

async function checkConflicts() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Looking for users in BOTH users and exhibitors tables...');
    console.log('');
    
    const result = await pool.query(\`
      SELECT 
        u.id as user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.status,
        e.id as exhibitor_id,
        e.company_name,
        u.created_at::text as user_created,
        u.updated_at::text as user_updated
      FROM users u
      INNER JOIN exhibitors e ON LOWER(u.email) = LOWER(e.email)
      ORDER BY u.updated_at DESC
    \`);

    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
    if (result.rows.length === 0) {
      console.log('✅ No conflicts - no users are in both tables');
    } else {
      console.log(\`⚠️  Found \${result.rows.length} user(s) in BOTH users and exhibitors tables:\`);
      console.log('');
      result.rows.forEach((row, index) => {
        console.log(\`\${index + 1}. \${row.email}\`);
        console.log(\`   User ID: \${row.user_id}, Exhibitor ID: \${row.exhibitor_id}\`);
        console.log(\`   Name: \${row.first_name} \${row.last_name}\`);
        console.log(\`   Company: \${row.company_name}\`);
        console.log(\`   Current Role: \${row.role}\`);
        console.log(\`   Status: \${row.status}\`);
        console.log(\`   User Created: \${new Date(row.user_created).toLocaleString('pl-PL')}\`);
        console.log(\`   Last Updated: \${new Date(row.user_updated).toLocaleString('pl-PL')}\`);
        console.log('   ────────────────────────────────────────────────────────────────');
      });
      
      console.log('');
      console.log('⚠️  PROBLEM: database.js automatically changes these users to role=exhibitor on every restart!');
      console.log('⚠️  Lines 847-869 in database.js enforce exhibitor role for any user whose email matches exhibitors table.');
    }
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkConflicts();
"

