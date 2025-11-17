const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// POST /api/v1/migrations/products-to-events
// Migracja produktów z GLOBAL do event-specific entries
router.post('/products-to-events', verifyToken, requireAdmin, async (req, res) => {
  console.log('🚀 Rozpoczynam migrację produktów z GLOBAL do event-specific entries...');

  try {
    const results = {
      startTime: new Date().toISOString(),
      exhibitorsProcessed: 0,
      exhibitorsSkipped: 0,
      entriesCreated: 0,
      entriesUpdated: 0,
      details: []
    };

    // 1. Pobierz wszystkich wystawców, którzy mają produkty w GLOBAL entry
    const exhibitorsWithProducts = await db.query(`
      SELECT exhibitor_id, products, name
      FROM exhibitor_catalog_entries
      WHERE exhibition_id IS NULL 
        AND products IS NOT NULL 
        AND jsonb_array_length(products) > 0
      ORDER BY exhibitor_id
    `);

    console.log(`📦 Znaleziono ${exhibitorsWithProducts.rows.length} wystawców z produktami w GLOBAL entry`);

    for (const exhibitor of exhibitorsWithProducts.rows) {
      const { exhibitor_id, products, name } = exhibitor;
      const productCount = Array.isArray(products) ? products.length : 0;

      const exhibitorResult = {
        exhibitorId: exhibitor_id,
        exhibitorName: name || 'N/A',
        productCount: productCount,
        exhibitions: [],
        status: 'processed'
      };

      // 2. Znajdź wszystkie wystawy, do których wystawca jest przypisany
      const exhibitions = await db.query(`
        SELECT DISTINCT ee.exhibition_id, ex.name as exhibition_name
        FROM exhibitor_events ee
        LEFT JOIN exhibitions ex ON ex.id = ee.exhibition_id
        WHERE ee.exhibitor_id = $1
        ORDER BY ee.exhibition_id
      `, [exhibitor_id]);

      if (exhibitions.rows.length === 0) {
        exhibitorResult.status = 'skipped';
        exhibitorResult.reason = 'Brak przypisanych wystaw';
        results.exhibitorsSkipped++;
        results.details.push(exhibitorResult);
        continue;
      }

      // 3. Dla każdej wystawy, skopiuj produkty do event-specific entry
      for (const exhibition of exhibitions.rows) {
        const { exhibition_id, exhibition_name } = exhibition;

        const exhibitionResult = {
          exhibitionId: exhibition_id,
          exhibitionName: exhibition_name || 'N/A',
          action: 'none'
        };

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
            exhibitionResult.action = 'skipped';
            exhibitionResult.reason = `Już ma ${existingProductCount} produktów`;
            exhibitorResult.exhibitions.push(exhibitionResult);
            continue;
          }

          // Update istniejącego entry
          await db.query(`
            UPDATE exhibitor_catalog_entries
            SET products = $3, updated_at = NOW()
            WHERE exhibitor_id = $1 AND exhibition_id = $2
          `, [exhibitor_id, exhibition_id, JSON.stringify(products)]);

          exhibitionResult.action = 'updated';
          exhibitionResult.productsAdded = productCount;
          results.entriesUpdated++;
        } else {
          // Utwórz nowy event-specific entry z produktami
          await db.query(`
            INSERT INTO exhibitor_catalog_entries (exhibitor_id, exhibition_id, products)
            VALUES ($1, $2, $3)
          `, [exhibitor_id, exhibition_id, JSON.stringify(products)]);

          exhibitionResult.action = 'created';
          exhibitionResult.productsAdded = productCount;
          results.entriesCreated++;
        }

        exhibitorResult.exhibitions.push(exhibitionResult);
      }

      results.exhibitorsProcessed++;
      results.details.push(exhibitorResult);
    }

    results.endTime = new Date().toISOString();
    results.totalExhibitors = exhibitorsWithProducts.rows.length;

    console.log('✅ Migracja zakończona pomyślnie!');
    console.log(`📊 Statystyki:`);
    console.log(`   - Wystawców przetworzonych: ${results.exhibitorsProcessed}`);
    console.log(`   - Wystawców pominiętych: ${results.exhibitorsSkipped}`);
    console.log(`   - Entries utworzonych: ${results.entriesCreated}`);
    console.log(`   - Entries zaktualizowanych: ${results.entriesUpdated}`);

    return res.json({
      success: true,
      message: 'Migracja produktów zakończona pomyślnie',
      data: results
    });

  } catch (error) {
    console.error('❌ Błąd podczas migracji:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd podczas migracji produktów',
      error: error.message
    });
  }
});

module.exports = router;

