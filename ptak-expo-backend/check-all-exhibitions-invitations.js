#!/usr/bin/env node
/**
 * Check all exhibitions for invitations missing access_code
 * Shows statistics per exhibition
 */

const { pool } = require('./src/config/database');

async function checkAllExhibitions() {
  const client = await pool.connect();
  try {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  Sprawdzanie zaproszeń bez access_code - WSZYSTKIE WYSTAWY  ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // Get all exhibitions
    const exhibitionsRes = await client.query(`
      SELECT id, name, start_date, end_date, status
      FROM exhibitions
      ORDER BY start_date DESC, id DESC
    `);

    console.log(`Znaleziono ${exhibitionsRes.rows.length} wystaw w systemie.\n`);

    let totalMissing = 0;
    let totalWithCode = 0;

    for (const exhibition of exhibitionsRes.rows) {
      // Count invitations without access_code
      const missingRes = await client.query(`
        SELECT COUNT(*) as count
        FROM invitation_recipients
        WHERE exhibition_id = $1 AND access_code IS NULL
      `, [exhibition.id]);

      // Count invitations with access_code
      const withCodeRes = await client.query(`
        SELECT COUNT(*) as count
        FROM invitation_recipients
        WHERE exhibition_id = $1 AND access_code IS NOT NULL
      `, [exhibition.id]);

      const missingCount = parseInt(missingRes.rows[0].count, 10);
      const withCodeCount = parseInt(withCodeRes.rows[0].count, 10);
      const totalCount = missingCount + withCodeCount;

      if (totalCount > 0) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 Wystawa ID: ${exhibition.id}`);
        console.log(`📝 Nazwa: ${exhibition.name}`);
        console.log(`📅 Data: ${exhibition.start_date} → ${exhibition.end_date}`);
        console.log(`🚦 Status: ${exhibition.status}`);
        console.log(`\n   Zaproszenia:`);
        console.log(`   ✅ Z access_code:    ${withCodeCount.toString().padStart(5)} (${totalCount > 0 ? Math.round(withCodeCount/totalCount*100) : 0}%)`);
        console.log(`   ❌ Bez access_code:  ${missingCount.toString().padStart(5)} (${totalCount > 0 ? Math.round(missingCount/totalCount*100) : 0}%)`);
        console.log(`   📊 Razem:            ${totalCount.toString().padStart(5)}`);
        
        if (missingCount > 0) {
          console.log(`\n   ⚠️  ${missingCount} zaproszeń może mieć problem z weryfikacją QR!`);
        }
        console.log();

        totalMissing += missingCount;
        totalWithCode += withCodeCount;
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    PODSUMOWANIE GLOBALNE                      ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    console.log(`   ✅ Zaproszenia z kodem:     ${totalWithCode.toString().padStart(6)}`);
    console.log(`   ❌ Zaproszenia bez kodu:    ${totalMissing.toString().padStart(6)}`);
    console.log(`   📊 Wszystkich zaproszeń:   ${(totalMissing + totalWithCode).toString().padStart(6)}`);
    
    if (totalMissing > 0) {
      console.log(`\n   🎯 Fuzzy matching automatycznie obsłuży ${totalMissing} kodów!`);
      console.log(`   💡 Przy pierwszym skanowaniu kody zostaną zapisane do bazy.`);
    } else {
      console.log(`\n   🎉 Wszystkie zaproszenia mają zapisane kody QR!`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check exhibitor_people table for comparison
    const peopleWithCodeRes = await client.query(`
      SELECT COUNT(*) as count
      FROM exhibitor_people
      WHERE access_code IS NOT NULL
    `);
    
    const peopleWithCode = parseInt(peopleWithCodeRes.rows[0].count, 10);
    
    console.log('📌 Dodatkowa statystyka:');
    console.log(`   Kody w tabeli exhibitor_people: ${peopleWithCode}`);
    console.log(`   Kody w tabeli invitation_recipients: ${totalWithCode}`);
    console.log(`   🎯 Łącznie kodów w systemie: ${peopleWithCode + totalWithCode}\n`);

  } catch (error) {
    console.error('❌ Błąd podczas sprawdzania wystaw:', error);
    console.error('Szczegóły:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAllExhibitions().catch(console.error);

