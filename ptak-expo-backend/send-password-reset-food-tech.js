// Load environment variables
require('dotenv').config();

const db = require('./src/config/database');
const bcrypt = require('bcryptjs');
const { sendPasswordResetEmail } = require('./src/utils/emailService');

// Script to send password reset emails to all exhibitors assigned to FOOD TECH EXPO

async function findFoodTechExhibition() {
  console.log('🔍 Searching for FOOD TECH EXPO exhibition...');
  
  const result = await db.query(`
    SELECT id, name, start_date, end_date, status
    FROM exhibitions
    WHERE UPPER(name) LIKE '%FOOD TECH%'
    ORDER BY start_date DESC
  `);
  
  if (result.rows.length === 0) {
    console.log('❌ No FOOD TECH EXPO exhibition found');
    return null;
  }
  
  console.log(`\n✅ Found ${result.rows.length} exhibition(s):`);
  result.rows.forEach((ex, idx) => {
    console.log(`   ${idx + 1}. ID: ${ex.id}, Name: "${ex.name}", Dates: ${ex.start_date} - ${ex.end_date}, Status: ${ex.status}`);
  });
  
  return result.rows[0]; // Return the most recent one
}

async function getExhibitorsForExhibition(exhibitionId) {
  console.log(`\n🔍 Fetching exhibitors for exhibition ID: ${exhibitionId}...`);
  
  const result = await db.query(`
    SELECT DISTINCT
      e.id,
      e.email,
      e.company_name,
      e.contact_person,
      e.status
    FROM exhibitors e
    INNER JOIN exhibitor_events ee ON e.id = ee.exhibitor_id
    WHERE ee.exhibition_id = $1
      AND e.email IS NOT NULL
      AND e.email != ''
    ORDER BY e.company_name
  `, [exhibitionId]);
  
  console.log(`\n✅ Found ${result.rows.length} exhibitors:`);
  result.rows.forEach((exhibitor, idx) => {
    console.log(`   ${idx + 1}. ${exhibitor.company_name} (${exhibitor.email}) - Status: ${exhibitor.status || 'N/A'}`);
  });
  
  return result.rows;
}

async function generateAndHashPassword() {
  // Generate new random password (12 characters: letters, numbers)
  const newPassword = Math.random().toString(36).slice(-8) + 
                     Math.random().toString(36).slice(-4).toUpperCase() + 
                     Math.floor(Math.random() * 10);
  
  // Hash the password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);
  
  return { newPassword, passwordHash };
}

async function sendPasswordResetToExhibitor(exhibitor, dryRun = true) {
  try {
    const { newPassword, passwordHash } = await generateAndHashPassword();
    
    if (dryRun) {
      console.log(`   [DRY RUN] Would reset password for: ${exhibitor.email}`);
      console.log(`   [DRY RUN] New password would be: ${newPassword}`);
      return { success: true, dryRun: true };
    }
    
    // Update password in database
    await db.query(
      'UPDATE exhibitors SET password_hash = $1 WHERE id = $2',
      [passwordHash, exhibitor.id]
    );
    
    // Parse exhibitor name
    const contact = String(exhibitor.contact_person || '').trim();
    const [firstName, ...rest] = contact.split(' ').filter(Boolean);
    const lastName = rest.join(' ');
    
    // Send email
    const loginUrl = process.env.FRONTEND_WEB_URL 
      ? `${process.env.FRONTEND_WEB_URL}/login`
      : 'https://wystawca.exhibitorlist.eu/login';
    
    const emailResult = await sendPasswordResetEmail(
      exhibitor.email,
      firstName || exhibitor.company_name || 'Wystawca',
      lastName || '',
      newPassword,
      loginUrl
    );
    
    if (emailResult.success) {
      console.log(`   ✅ Password reset sent to: ${exhibitor.email}`);
      return { success: true, email: exhibitor.email };
    } else {
      console.log(`   ❌ Failed to send email to: ${exhibitor.email} - ${emailResult.error}`);
      return { success: false, email: exhibitor.email, error: emailResult.error };
    }
    
  } catch (error) {
    console.error(`   ❌ Error processing ${exhibitor.email}:`, error.message);
    return { success: false, email: exhibitor.email, error: error.message };
  }
}

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  FOOD TECH EXPO - Password Reset Script');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Step 1: Find FOOD TECH EXPO exhibition
    const exhibition = await findFoodTechExhibition();
    if (!exhibition) {
      console.log('\n❌ Cannot proceed without exhibition');
      process.exit(1);
    }
    
    // Step 2: Get all exhibitors
    const exhibitors = await getExhibitorsForExhibition(exhibition.id);
    if (exhibitors.length === 0) {
      console.log('\n❌ No exhibitors found for this exhibition');
      process.exit(1);
    }
    
    // Step 3: Check if pieniak@gmail.com is on the list
    const pieniakExhibitor = exhibitors.find(e => e.email.toLowerCase() === 'pieniak@gmail.com');
    if (!pieniakExhibitor) {
      console.log('\n⚠️  WARNING: pieniak@gmail.com NOT found in exhibitors list!');
      console.log('   The list might be incorrect. Please verify.');
      process.exit(1);
    }
    
    console.log(`\n✅ VERIFIED: pieniak@gmail.com is on the list (${pieniakExhibitor.company_name})`);
    
    // Step 4: Ask for confirmation
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  TEST MODE - Send to pieniak@gmail.com only');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const args = process.argv.slice(2);
    const testMode = args.includes('--test');
    const sendAll = args.includes('--send-all');
    
    if (!testMode && !sendAll) {
      console.log('\n📋 Usage:');
      console.log('   node send-password-reset-food-tech.js --test       (send test to pieniak@gmail.com)');
      console.log('   node send-password-reset-food-tech.js --send-all   (send to ALL exhibitors)');
      console.log('\nRun with --test flag first to verify everything works correctly.');
      process.exit(0);
    }
    
    if (testMode) {
      console.log('🧪 TEST MODE: Sending password reset to pieniak@gmail.com only...\n');
      const result = await sendPasswordResetToExhibitor(pieniakExhibitor, false);
      
      if (result.success) {
        console.log('\n✅ TEST SUCCESSFUL!');
        console.log('   Check pieniak@gmail.com inbox for the password reset email.');
        console.log('\n   To send to ALL exhibitors, run:');
        console.log('   node send-password-reset-food-tech.js --send-all');
      } else {
        console.log('\n❌ TEST FAILED!');
        console.log('   Please check email configuration and try again.');
      }
    }
    
    if (sendAll) {
      console.log('🚀 SENDING TO ALL EXHIBITORS...\n');
      console.log(`   Total exhibitors: ${exhibitors.length}`);
      console.log('   This will take a few minutes...\n');
      
      const results = {
        success: [],
        failed: []
      };
      
      for (let i = 0; i < exhibitors.length; i++) {
        const exhibitor = exhibitors[i];
        console.log(`\n[${i + 1}/${exhibitors.length}] Processing: ${exhibitor.email}...`);
        
        const result = await sendPasswordResetToExhibitor(exhibitor, false);
        
        if (result.success) {
          results.success.push(exhibitor.email);
        } else {
          results.failed.push({ email: exhibitor.email, error: result.error });
        }
        
        // Wait 1 second between emails to avoid rate limiting
        if (i < exhibitors.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('  SUMMARY');
      console.log('═══════════════════════════════════════════════════════\n');
      console.log(`✅ Successfully sent: ${results.success.length}`);
      console.log(`❌ Failed: ${results.failed.length}`);
      
      if (results.failed.length > 0) {
        console.log('\nFailed emails:');
        results.failed.forEach(f => {
          console.log(`   - ${f.email}: ${f.error}`);
        });
      }
      
      console.log('\n✅ DONE!');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();

