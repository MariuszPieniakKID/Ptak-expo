#!/usr/bin/env node
/**
 * Regenerate missing access_code for exhibitor_people records
 * This fixes records that were created before access_code was implemented
 */

const { pool } = require('./src/config/database');

/**
 * Generate a short event code (4-5 characters, no spaces) from exhibition name
 */
function generateEventShortCode(exhibitionName) {
    if (!exhibitionName || String(exhibitionName).trim().length === 0) return 'EVNT';
    
    const cleaned = String(exhibitionName).trim().toUpperCase();
    const capitals = cleaned.replace(/[^A-Z0-9]/g, '');
    
    if (capitals.length >= 4 && capitals.length <= 5) {
        return capitals.slice(0, 5);
    }
    
    if (capitals.length > 5) {
        const words = cleaned.split(/\s+/);
        if (words.length >= 2) {
            const acronym = words.map(w => w[0]).filter(c => /[A-Z0-9]/.test(c)).join('');
            if (acronym.length >= 4) {
                return acronym.slice(0, 5);
            }
            return (acronym + capitals).slice(0, 5);
        }
        return capitals.slice(0, 5);
    }
    
    return (capitals + cleaned.replace(/\s+/g, '').slice(0, 5)).slice(0, 5).padEnd(4, 'X');
}

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

        // Generate access_code using the same algorithm as everywhere else (NOW 4 DIGITS! + SHORT CODE v2.0)
        const eventCode = generateEventShortCode(exhibitionName);
        const eventIdPadded = String(exhibitionId).padStart(4, '0').slice(-4);
        // Changed to 4 digits for no collisions (backward compatible with 3-digit codes)
        const exhibitorIdPadded = 'w' + String(exhibitorId || 0).padStart(4, '0').slice(-4);
        
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

