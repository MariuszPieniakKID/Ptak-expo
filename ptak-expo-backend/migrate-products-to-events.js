/**
 * Migracja produktów z GLOBAL do event-specific entries
 * 
 * Dla każdego wystawcy, który ma produkty w GLOBAL entry:
 * - Znajdź wszystkie wystawy, do których jest przypisany
 * - Skopiuj produkty do event-specific entries dla każdej wystawy
 * 
 * Uruchomienie: node migrate-products-to-events.js
 */

const db = require('./src/config/database');

async function migrateProductsToEvents() {
  console.log('🚀 Rozpoczynam migrację produktów z GLOBAL do event-specific entries...\n');

  try {
    // 1. Pobierz wszystkich wystawców, którzy mają produkty w GLOBAL entry
    const exhibitorsWithProducts = await db.query(`
      SELECT exhibitor_id, products, name
      FROM exhibitor_catalog_entries
      WHERE exhibition_id IS NULL 
        AND products IS NOT NULL 
        AND jsonb_array_length(products) > 0
      ORDER BY exhibitor_id
    `);

    console.log(`📦 Znaleziono ${exhibitorsWithProducts.rows.length} wystawców z produktami w GLOBAL entry\n`);

    let totalMigrated = 0;
    let totalSkipped = 0;

    for (const exhibitor of exhibitorsWithProducts.rows) {
      const { exhibitor_id, products, name } = exhibitor;
      const productCount = Array.isArray(products) ? products.length : 0;

      console.log(`\n👤 Wystawca: ${name || 'N/A'} (ID: ${exhibitor_id})`);
      console.log(`   Produktów w GLOBAL: ${productCount}`);

      // 2. Znajdź wszystkie wystawy, do których wystawca jest przypisany
      const exhibitions = await db.query(`
        SELECT DISTINCT ee.exhibition_id, ex.name as exhibition_name
        FROM exhibitor_events ee
        LEFT JOIN exhibitions ex ON ex.id = ee.exhibition_id
        WHERE ee.exhibitor_id = $1
        ORDER BY ee.exhibition_id
      `, [exhibitor_id]);

      console.log(`   Przypisany do wystaw: ${exhibitions.rows.length}`);

      if (exhibitions.rows.length === 0) {
        console.log(`   ⚠️  Wystawca nie jest przypisany do żadnej wystawy - pomijam`);
        totalSkipped++;
        continue;
      }

      // 3. Dla każdej wystawy, skopiuj produkty do event-specific entry
      for (const exhibition of exhibitions.rows) {
        const { exhibition_id, exhibition_name } = exhibition;

        // Sprawdź czy już istnieje event-specific entry
        const existingEntry = await db.query(`
          SELECT id, products
          FROM exhibitor_catalog_entries
          WHERE exhibitor_id = $1 AND exhibition_id = $2
        `, [exhibitor_id, exhibition_id]);

        if (existingEntry.rows.length > 0) {
          const existingProducts = existingEntry.rows[0].products;
          const existingProductCount = Array.isArray(existingProducts) && existingProducts.length > 0 
            ? existingProducts.length 
            : 0;

          if (existingProductCount > 0) {
            console.log(`   ⏭️  Wystawa: ${exhibition_name} (ID: ${exhibition_id}) - już ma ${existingProductCount} produktów, pomijam`);
            continue;
          }

          // Update istniejącego entry
          await db.query(`
            UPDATE exhibitor_catalog_entries
            SET products = $3, updated_at = NOW()
            WHERE exhibitor_id = $1 AND exhibition_id = $2
          `, [exhibitor_id, exhibition_id, JSON.stringify(products)]);

          console.log(`   ✅ Wystawa: ${exhibition_name} (ID: ${exhibition_id}) - zaktualizowano (${productCount} produktów)`);
        } else {
          // Utwórz nowy event-specific entry z produktami
          await db.query(`
            INSERT INTO exhibitor_catalog_entries (exhibitor_id, exhibition_id, products)
            VALUES ($1, $2, $3)
          `, [exhibitor_id, exhibition_id, JSON.stringify(products)]);

          console.log(`   ✅ Wystawa: ${exhibition_name} (ID: ${exhibition_id}) - utworzono (${productCount} produktów)`);
        }

        totalMigrated++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migracja zakończona pomyślnie!');
    console.log(`📊 Statystyki:`);
    console.log(`   - Wystawców przetworzonych: ${exhibitorsWithProducts.rows.length}`);
    console.log(`   - Event-specific entries utworzonych/zaktualizowanych: ${totalMigrated}`);
    console.log(`   - Wystawców pominiętych (brak przypisań): ${totalSkipped}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Błąd podczas migracji:', error);
    throw error;
  }
}

// Uruchom migrację
migrateProductsToEvents()
  .then(() => {
    console.log('\n✅ Skrypt zakończony');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Skrypt zakończony z błędem:', error);
    process.exit(1);
  });

