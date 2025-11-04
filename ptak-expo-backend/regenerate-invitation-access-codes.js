/**
 * Regenerate access codes for existing invitation_recipients
 * 
 * This script regenerates access_code for all invitation_recipients that don't have one yet.
 * It uses the same algorithm as the invitation sending process.
 * 
 * Usage:
 *   node regenerate-invitation-access-codes.js [--dry-run] [--exhibition-id=17]
 */

const { pool } = require('./src/config/database');

const isDryRun = process.argv.includes('--dry-run');
const exhibitionIdArg = process.argv.find(arg => arg.startsWith('--exhibition-id='));
const targetExhibitionId = exhibitionIdArg ? parseInt(exhibitionIdArg.split('=')[1], 10) : null;

// Generate access code using the correct algorithm
function generateAccessCode(exhibitionName, exhibitionId, exhibitorId) {
  const eventCode = String(exhibitionName || '').replace(/\s+/g, ' ').trim();
  const eventIdPadded = String(exhibitionId).padStart(4, '0').slice(-4);
  const exhibitorIdPadded = 'w' + String(exhibitorId || 0).padStart(3, '0').slice(-3);
  
  const entryId = (() => {
    const ts = Date.now().toString().slice(-6);
    const rnd = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
    return ts.slice(0, 3) + rnd.slice(0, 3) + ts.slice(3);
  })();
  
  const rndSuffix = 'rnd' + Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
  
  return `${eventCode}${eventIdPadded}${exhibitorIdPadded}${entryId}${rndSuffix}${entryId}`;
}

async function regenerateAccessCodes() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Regenerating access codes for invitation_recipients...\n');
    
    if (isDryRun) {
      console.log('⚠️  DRY RUN MODE - no changes will be made\n');
    }
    
    // Build query to find recipients without access_code
    let query = `
      SELECT 
        r.id,
        r.recipient_email,
        r.recipient_name,
        r.exhibitor_id,
        t.exhibition_id,
        e.name as exhibition_name
      FROM invitation_recipients r
      JOIN invitation_templates t ON t.id = r.invitation_template_id
      JOIN exhibitions e ON e.id = t.exhibition_id
      WHERE r.access_code IS NULL
    `;
    
    const params = [];
    if (targetExhibitionId) {
      query += ' AND t.exhibition_id = $1';
      params.push(targetExhibitionId);
      console.log(`🎯 Filtering by exhibition_id: ${targetExhibitionId}\n`);
    }
    
    query += ' ORDER BY r.id';
    
    const result = await client.query(query, params);
    
    console.log(`📊 Found ${result.rows.length} recipients without access_code\n`);
    
    if (result.rows.length === 0) {
      console.log('✅ All recipients already have access codes!');
      return;
    }
    
    let updated = 0;
    let failed = 0;
    
    for (const row of result.rows) {
      try {
        const accessCode = generateAccessCode(
          row.exhibition_name,
          row.exhibition_id,
          row.exhibitor_id
        );
        
        console.log(`${updated + 1}. ${row.recipient_email} (ID: ${row.id})`);
        console.log(`   Exhibition: ${row.exhibition_name} (${row.exhibition_id})`);
        console.log(`   Exhibitor ID: ${row.exhibitor_id || 'NULL'}`);
        console.log(`   Generated code: ${accessCode.substring(0, 50)}...`);
        
        if (!isDryRun) {
          // Also update exhibition_id if NULL (for older records)
          await client.query(
            `UPDATE invitation_recipients 
             SET access_code = $1, exhibition_id = $2
             WHERE id = $3`,
            [accessCode, row.exhibition_id, row.id]
          );
          console.log('   ✅ Updated\n');
        } else {
          console.log('   ⏭️  Skipped (dry run)\n');
        }
        
        updated++;
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}\n`);
        failed++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total found: ${result.rows.length}`);
    console.log(`   ${isDryRun ? 'Would update' : 'Updated'}: ${updated}`);
    console.log(`   Failed: ${failed}`);
    console.log('='.repeat(60));
    
    if (isDryRun) {
      console.log('\n💡 Run without --dry-run to apply changes');
    } else {
      console.log('\n✅ Access codes regenerated successfully!');
      console.log('   You can now verify QR codes from invitations');
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

regenerateAccessCodes().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

