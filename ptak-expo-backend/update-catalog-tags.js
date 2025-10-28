#!/usr/bin/env node

/**
 * Skrypt do czyszczenia i aktualizacji tagów katalogu
 * 1. Czyści wszystkie tagi z catalog_tags (Sektory technologiczne)
 * 2. Czyści wszystkie branże z catalog_industries (Branże)
 * 3. Dodaje nowe tagi do catalog_tags
 */

require('dotenv').config();
const { Pool } = require('pg');

// Konfiguracja połączenia z Railway
const getDatabaseUrl = () => {
  if (process.env.RAILWAY_ENVIRONMENT) {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      return process.env.DATABASE_URL;
    }
  }
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  throw new Error('❌ DATABASE_URL nie jest ustawiony');
};

// Nowe tagi dla sektorów technologicznych
const newTags = [
  'obrabiarki',
  'systemy przemysłowe do cięcia i formowania',
  'maszyny CNC',
  'narzędzia precyzyjne',
  'roboty przemysłowe',
  'oprogramowanie dla automatyki przemysłowej',
  'komponenty do zautomatyzowanej produkcji',
  'akcesoria dla branży przemysłowej',
  'części zamienne do maszyn',
  'oprogramowanie dla przemysłu',
  'urządzenia i oprogramowanie 3D',
  'odzież robocza i akcesoria',
  'napędy hydrauliczne',
  'napędy pneumatyczne',
  'materiały smarne dla branży przemysłowej',
  'napędy elektryczne',
  'akcesoria elektrotechniczne i okablowania',
  'farby, lakiery i chemia przemysłowa',
  'usługi finansowe dla produkcji przemysłowej',
  'usługi ubezpieczeniowe dla produkcji przemysłowej'
];

async function updateCatalogTags() {
  let pool;
  
  try {
    const databaseUrl = getDatabaseUrl();
    console.log('🔍 Łączenie z bazą danych Railway...');
    
    let sslOption = false;
    try {
      const urlObj = new URL(databaseUrl);
      const host = urlObj.hostname || '';
      const isInternalHost = host.endsWith('railway.internal');
      if (!isInternalHost) {
        sslOption = { rejectUnauthorized: false };
      }
    } catch (e) {
      sslOption = { rejectUnauthorized: false };
    }
    
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: sslOption,
      connectionTimeoutMillis: 30000,
    });
    
    await pool.query('SELECT NOW()');
    console.log('✅ Połączono z bazą danych Railway\n');
    
    // 1. Sprawdź ile jest tagów i branż przed czyszczeniem
    console.log('📊 Stan przed czyszczeniem:');
    const beforeTags = await pool.query('SELECT COUNT(*) as count FROM catalog_tags');
    const beforeIndustries = await pool.query('SELECT COUNT(*) as count FROM catalog_industries');
    console.log(`   Sektory technologiczne (catalog_tags): ${beforeTags.rows[0].count}`);
    console.log(`   Branże (catalog_industries): ${beforeIndustries.rows[0].count}\n`);
    
    // 2. Wyczyść wszystkie tagi z catalog_tags
    console.log('🧹 Czyszczenie catalog_tags (Sektory technologiczne)...');
    await pool.query('DELETE FROM catalog_tags');
    console.log('✅ Wyczyszczono catalog_tags\n');
    
    // 3. Wyczyść wszystkie branże z catalog_industries
    console.log('🧹 Czyszczenie catalog_industries (Branże)...');
    await pool.query('DELETE FROM catalog_industries');
    console.log('✅ Wyczyszczono catalog_industries\n');
    
    // 4. Dodaj nowe tagi do catalog_tags
    console.log('📝 Dodawanie nowych tagów do Sektorów technologicznych...');
    console.log(`   Liczba tagów do dodania: ${newTags.length}\n`);
    
    for (let i = 0; i < newTags.length; i++) {
      const tag = newTags[i];
      console.log(`   [${i + 1}/${newTags.length}] Dodawanie: "${tag}"`);
      
      await pool.query(
        `INSERT INTO catalog_tags (tag, usage_count, created_at, updated_at)
         VALUES ($1, 0, NOW(), NOW())`,
        [tag]
      );
    }
    
    console.log('\n✅ Dodano wszystkie nowe tagi\n');
    
    // 5. Pokaż stan po aktualizacji
    console.log('📊 Stan po aktualizacji:');
    const afterTags = await pool.query('SELECT COUNT(*) as count FROM catalog_tags');
    const afterIndustries = await pool.query('SELECT COUNT(*) as count FROM catalog_industries');
    console.log(`   Sektory technologiczne (catalog_tags): ${afterTags.rows[0].count}`);
    console.log(`   Branże (catalog_industries): ${afterIndustries.rows[0].count}\n`);
    
    // 6. Pokaż wszystkie nowe tagi
    console.log('📋 Lista nowych tagów w bazie:');
    const allTags = await pool.query('SELECT tag FROM catalog_tags ORDER BY tag ASC');
    allTags.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.tag}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ AKTUALIZACJA ZAKOŃCZONA POMYŚLNIE');
    console.log('='.repeat(60));
    console.log('\nPodsumowanie:');
    console.log(`  - Usunięto ${beforeTags.rows[0].count} starych tagów`);
    console.log(`  - Usunięto ${beforeIndustries.rows[0].count} starych branż`);
    console.log(`  - Dodano ${newTags.length} nowych tagów`);
    console.log('\nWszystkie tagi i branże w checkliście zostały wyczyszczone!');
    console.log('Nowe tagi dla sektorów technologicznych są już dostępne.\n');
    
  } catch (error) {
    console.error('❌ Błąd:', error);
    console.error('Szczegóły:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔌 Rozłączono z bazą danych');
    }
  }
}

// Uruchom skrypt
console.log('🚀 Rozpoczynam aktualizację tagów katalogu...\n');
updateCatalogTags();

