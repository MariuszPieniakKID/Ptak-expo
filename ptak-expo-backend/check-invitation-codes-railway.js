#!/usr/bin/env node
/**
 * Check invitation_recipients table on Railway for exhibition 17
 * See who has invitations without access_code that fuzzy matching could find
 */

const { Pool } = require('pg');

async function checkInvitationCodes() {
  // Use Railway DATABASE_PUBLIC_URL directly
  const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_PUBLIC_URL or DATABASE_URL not set!');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  
  try {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  Sprawdzanie invitation_recipients dla wystawy 17           ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Check if access_code column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invitation_recipients' AND column_name = 'access_code'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ Kolumna access_code NIE ISTNIEJE w invitation_recipients!');
      console.log('   Migracja nie wykonała się poprawnie.\n');
      return;
    }
    
    console.log('✅ Kolumna access_code istnieje w invitation_recipients\n');

    // Get all invitations for exhibition 17
    const invitations = await client.query(`
      SELECT 
        r.id,
        r.recipient_name,
        r.recipient_email,
        r.exhibitor_id,
        r.exhibition_id,
        r.access_code,
        r.sent_at,
        e.company_name,
        ex.name as exhibition_name
      FROM invitation_recipients r
      LEFT JOIN exhibitors e ON r.exhibitor_id = e.id
      LEFT JOIN exhibitions ex ON r.exhibition_id = ex.id
      WHERE r.exhibition_id = 17
      ORDER BY r.exhibitor_id, r.sent_at DESC
    `);

    console.log(`📊 Znaleziono ${invitations.rows.length} zaproszeń dla wystawy 17:\n`);

    if (invitations.rows.length === 0) {
      console.log('❌ BRAK zaproszeń dla wystawy 17 w tabeli invitation_recipients!');
      console.log('   To wyjaśnia dlaczego fuzzy matching nie działa.\n');
      console.log('💡 Możliwe przyczyny:');
      console.log('   1. Zaproszenia nie były wysyłane przez system (ręcznie?)');
      console.log('   2. Zaproszenia były wysyłane bez linkowania do exhibition_id');
      console.log('   3. Zaproszenia są w innej tabeli\n');
      return;
    }

    // Group by exhibitor
    const byExhibitor = {};
    let withCode = 0;
    let withoutCode = 0;

    for (const inv of invitations.rows) {
      if (!byExhibitor[inv.exhibitor_id]) {
        byExhibitor[inv.exhibitor_id] = {
          company_name: inv.company_name,
          exhibitor_id: inv.exhibitor_id,
          invitations: []
        };
      }
      byExhibitor[inv.exhibitor_id].invitations.push(inv);
      
      if (inv.access_code) {
        withCode++;
      } else {
        withoutCode++;
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Zaproszenia per wystawca:\n');

    for (const [exhibitorId, data] of Object.entries(byExhibitor)) {
      const invCount = data.invitations.length;
      const withCodeCount = data.invitations.filter(i => i.access_code).length;
      const withoutCodeCount = invCount - withCodeCount;
      
      console.log(`📦 Wystawca ID: ${exhibitorId}`);
      console.log(`   Firma: ${data.company_name || 'N/A'}`);
      console.log(`   Zaproszeń: ${invCount} (✅ ${withCodeCount} z kodem, ❌ ${withoutCodeCount} bez kodu)`);
      
      if (withoutCodeCount > 0) {
        console.log(`   🎯 Fuzzy matching obsłuży kody z pattern: w${exhibitorId.toString().padStart(3, '0')}`);
      }
      
      // Show first 3 invitations
      console.log('   Przykładowe zaproszenia:');
      data.invitations.slice(0, 3).forEach((inv, idx) => {
        console.log(`     ${idx + 1}. ${inv.recipient_name || 'N/A'} (${inv.recipient_email})`);
        console.log(`        Kod: ${inv.access_code ? '✅ ' + inv.access_code.substring(0, 50) + '...' : '❌ NULL'}`);
      });
      console.log();
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 PODSUMOWANIE:\n');
    console.log(`   Wszystkich zaproszeń:     ${invitations.rows.length}`);
    console.log(`   ✅ Z access_code:         ${withCode}`);
    console.log(`   ❌ Bez access_code:       ${withoutCode}`);
    console.log(`   📈 Wystawców:             ${Object.keys(byExhibitor).length}\n`);

    if (withoutCode > 0) {
      console.log(`🎯 Fuzzy matching automatycznie zapisze ${withoutCode} kodów przy pierwszym skanowaniu!\n`);
      console.log('Przykładowe kody QR które zadziałają (format):');
      for (const [exhibitorId, data] of Object.entries(byExhibitor).slice(0, 3)) {
        if (data.invitations.some(i => !i.access_code)) {
          console.log(`   - WARSAW INDUSTRY WEEK0017w${exhibitorId.toString().padStart(3, '0')}[EntryID]rnd[random][EntryID]`);
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Błąd:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkInvitationCodes().catch(console.error);

