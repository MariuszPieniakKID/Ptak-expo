#!/usr/bin/env node
/**
 * Regenerate missing access_code for exhibitor_people records
 * This fixes records that were created before access_code was implemented
 */

const { pool } = require('./src/config/database');

async function regenerateAccessCodes() {
  const client = await pool.connect();
  try {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  Regeneracja brakujących access_code w exhibitor_people     ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // Find all exhibitor_people records without access_code
    const missingCodes = await client.query(`
      SELECT 
        p.id,
        p.exhibitor_id,
        p.exhibition_id,
        p.full_name,
        p.email,
        e.company_name,
        ex.name as exhibition_name
      FROM exhibitor_people p
      LEFT JOIN exhibitors e ON p.exhibitor_id = e.id
      LEFT JOIN exhibitions ex ON p.exhibition_id = ex.id
      WHERE p.access_code IS NULL
      ORDER BY p.exhibition_id, p.exhibitor_id, p.id
    `);

    console.log(`Znaleziono ${missingCodes.rows.length} rekordów bez access_code.\n`);

    if (missingCodes.rows.length === 0) {
      console.log('✅ Wszystkie rekordy mają już access_code!');
      return;
    }

    console.log('Generowanie kodów QR...\n');

    let updated = 0;
    let errors = 0;

    for (const person of missingCodes.rows) {
      try {
        const exhibitionId = person.exhibition_id;
        const exhibitorId = person.exhibitor_id;
        const exhibitionName = person.exhibition_name || '';

        if (!exhibitionId) {
          console.warn(`⚠️  Pomijam ID ${person.id}: brak exhibition_id`);
          errors++;
          continue;
        }

        // Generate access_code using the same algorithm as everywhere else
        const eventCode = String(exhibitionName).replace(/\s+/g, ' ').trim();
        const eventIdPadded = String(exhibitionId).padStart(4, '0').slice(-4);
        const exhibitorIdPadded = 'w' + String(exhibitorId || 0).padStart(3, '0').slice(-3);
        
        // Generate unique EntryID
        const entryId = (() => {
          const ts = Date.now().toString().slice(-6);
          const rnd = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
          return ts.slice(0, 3) + rnd.slice(0, 3) + ts.slice(3);
        })();
        
        const rndSuffix = 'rnd' + Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
        const generatedAccessCode = `${eventCode}${eventIdPadded}${exhibitorIdPadded}${entryId}${rndSuffix}${entryId}`;

        // Update the record
        await client.query(
          `UPDATE exhibitor_people SET access_code = $1 WHERE id = $2`,
          [generatedAccessCode, person.id]
        );

        updated++;
        console.log(`✅ [${updated}/${missingCodes.rows.length}] ${person.full_name} (ID: ${person.id})`);
        console.log(`   Wystawa: ${exhibitionName} (${exhibitionId})`);
        console.log(`   Wystawca: ${person.company_name} (${exhibitorId})`);
        console.log(`   Kod: ${generatedAccessCode.substring(0, 60)}...`);
        console.log();

      } catch (e) {
        console.error(`❌ Błąd dla rekordu ${person.id}:`, e?.message || e);
        errors++;
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 PODSUMOWANIE:\n');
    console.log(`   ✅ Zaktualizowano:  ${updated}`);
    console.log(`   ❌ Błędy:          ${errors}`);
    console.log(`   📊 Razem:          ${missingCodes.rows.length}\n`);

    if (updated > 0) {
      console.log('🎉 Regeneracja zakończona pomyślnie!');
      console.log('💡 Wszystkie kody QR powinny teraz działać na bramkach.\n');
    }

  } catch (error) {
    console.error('❌ Błąd podczas regeneracji:', error);
    console.error('Szczegóły:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

regenerateAccessCodes().catch(console.error);

