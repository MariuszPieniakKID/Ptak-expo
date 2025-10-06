#!/bin/bash

echo "🔍 Checking images/files availability from Railway database..."
echo ""

cd /Users/kid/Ptak-expo/ptak-expo-backend

railway run --service Backend node -e "
const { Pool } = require('pg');

async function checkImages() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Checking for uploaded files in database...');
    console.log('');
    
    // Check branding files
    const brandingResult = await pool.query(\`
      SELECT 
        id,
        exhibitor_id,
        exhibition_id,
        file_type,
        file_name,
        file_path,
        mime_type,
        created_at::text
      FROM exhibitor_branding_files
      ORDER BY created_at DESC
      LIMIT 5
    \`);

    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
    console.log('📸 BRANDING FILES (last 5):');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
    
    if (brandingResult.rows.length === 0) {
      console.log('⚠️  No branding files found in database');
    } else {
      brandingResult.rows.forEach((file, index) => {
        console.log(\`\nFile \${index + 1}:\`);
        console.log(\`  ID: \${file.id}\`);
        console.log(\`  Exhibitor ID: \${file.exhibitor_id || 'NULL (global)'}\`);
        console.log(\`  Exhibition ID: \${file.exhibition_id}\`);
        console.log(\`  Type: \${file.file_type}\`);
        console.log(\`  Filename: \${file.file_name}\`);
        console.log(\`  Path: \${file.file_path}\`);
        console.log(\`  MIME: \${file.mime_type}\`);
        console.log(\`  Created: \${new Date(file.created_at).toLocaleString('pl-PL')}\`);
        console.log(\`  URL: https://backend-production-df8c.up.railway.app/api/v1/exhibitor-branding/\${file.exhibitor_id || 'global'}/\${file.file_name}\`);
      });
    }

    // Check marketing materials
    const marketingResult = await pool.query(\`
      SELECT 
        id,
        title,
        file_url,
        file_type,
        created_at::text
      FROM marketing_materials
      ORDER BY created_at DESC
      LIMIT 3
    \`);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
    console.log('📄 MARKETING MATERIALS (last 3):');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
    
    if (marketingResult.rows.length === 0) {
      console.log('⚠️  No marketing materials found in database');
    } else {
      marketingResult.rows.forEach((file, index) => {
        console.log(\`\nMaterial \${index + 1}:\`);
        console.log(\`  ID: \${file.id}\`);
        console.log(\`  Title: \${file.title}\`);
        console.log(\`  File URL: \${file.file_url}\`);
        console.log(\`  Type: \${file.file_type}\`);
        console.log(\`  Created: \${new Date(file.created_at).toLocaleString('pl-PL')}\`);
      });
    }

    // Check catalog entries with logos
    const catalogResult = await pool.query(\`
      SELECT 
        id,
        exhibitor_id,
        name,
        logo,
        created_at::text
      FROM exhibitor_catalog_entries
      WHERE logo IS NOT NULL AND logo != ''
      ORDER BY created_at DESC
      LIMIT 3
    \`);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
    console.log('🏢 CATALOG ENTRIES WITH LOGOS (last 3):');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
    
    if (catalogResult.rows.length === 0) {
      console.log('⚠️  No catalog entries with logos found');
    } else {
      catalogResult.rows.forEach((entry, index) => {
        console.log(\`\nCatalog Entry \${index + 1}:\`);
        console.log(\`  ID: \${entry.id}\`);
        console.log(\`  Exhibitor ID: \${entry.exhibitor_id}\`);
        console.log(\`  Name: \${entry.name}\`);
        console.log(\`  Logo Path: \${entry.logo}\`);
        console.log(\`  Created: \${new Date(entry.created_at).toLocaleString('pl-PL')}\`);
      });
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkImages();
"

