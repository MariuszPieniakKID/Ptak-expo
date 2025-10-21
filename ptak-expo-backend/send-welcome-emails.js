#!/usr/bin/env node

/**
 * Skrypt do wysyłania maili powitalnych do wystawców z nowymi hasłami
 * Dla bezpieczeństwa generuje nowe hasła dla każdego wystawcy
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

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

// Funkcja do generowania silnego hasła
const generatePassword = () => {
  // Generuje hasło: 8 małych liter/cyfr + 4 wielkie litery
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let password = '';
  
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  for (let i = 0; i < 4; i++) {
    password += upper.charAt(Math.floor(Math.random() * upper.length));
  }
  
  // Pomieszaj znaki
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Funkcja do wysyłania emaila (używa Microsoft Graph API lub SMTP)
const sendWelcomeEmailWithInstructions = async (userEmail, firstName, lastName, password, loginUrl) => {
  const instructionsUrl = 'https://industryweek.pl/wp-content/uploads/2025/10/Instrukcja-do-aplikacji.pdf';
  
  // Sprawdź czy można użyć Graph API
  const canUseGraph = () => (
    !!process.env.AZURE_TENANT_ID && 
    !!process.env.AZURE_CLIENT_ID && 
    !!process.env.AZURE_CLIENT_SECRET && 
    !!(process.env.SMTP_USER || process.env.GRAPH_SENDER)
  );

  const subject = 'Dostęp do portalu wystawcy WARSAW INDUSTRY WEEK - Dane logowania';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #c7353c; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .credentials { background-color: #fff; padding: 15px; border-left: 4px solid #c7353c; margin: 20px 0; }
            .instructions { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 12px 24px; background-color: #c7353c; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .button-secondary { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Portal Wystawcy WARSAW INDUSTRY WEEK</h1>
            </div>
            <div class="content">
                <h2>Dzień dobry ${firstName} ${lastName},</h2>
                <p>Przesyłamy Państwu dane dostępowe do portalu wystawcy <strong>WARSAW INDUSTRY WEEK</strong>.</p>
                
                <div class="credentials">
                    <h3>Dane logowania:</h3>
                    <p><strong>Email:</strong> ${userEmail}</p>
                    <p><strong>Hasło:</strong> <code style="font-size: 16px; background: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${password}</code></p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" class="button">Zaloguj się do portalu</a>
                </div>
                
                <div class="instructions">
                    <h3>📖 Instrukcja użytkownika</h3>
                    <p>Przygotowaliśmy dla Państwa szczegółową instrukcję korzystania z portalu wystawcy:</p>
                    <div style="text-align: center; margin: 15px 0;">
                        <a href="${instructionsUrl}" class="button-secondary">Pobierz instrukcję (PDF)</a>
                    </div>
                    <p style="font-size: 13px; color: #666;">Link do instrukcji: <a href="${instructionsUrl}">${instructionsUrl}</a></p>
                </div>
                
                <p><strong>Ważne informacje:</strong></p>
                <ul>
                    <li>Zalecamy zapoznanie się z instrukcją przed pierwszym logowaniem</li>
                    <li>W portalu znajdą Państwo wszystkie informacje o targach</li>
                    <li>Możliwość zarządzania zaproszeniami dla gości</li>
                    <li>Dostęp do materiałów promocyjnych i brandingowych</li>
                </ul>
                
                <p>W razie pytań lub problemów technicznych prosimy o kontakt.</p>
            </div>
            <div class="footer">
                <p>© 2025 PTAK WARSAW EXPO. Wszystkie prawa zastrzeżone.</p>
                <p>Ta wiadomość została wygenerowana automatycznie. Prosimy nie odpowiadać na tę wiadomość.</p>
            </div>
        </div>
    </body>
    </html>`;

  const text = `
Portal Wystawcy WARSAW INDUSTRY WEEK - Dane logowania

Dzień dobry ${firstName} ${lastName},

Przesyłamy Państwu dane dostępowe do portalu wystawcy WARSAW INDUSTRY WEEK.

Dane logowania:
Email: ${userEmail}
Hasło: ${password}

Link do logowania: ${loginUrl}

Instrukcja użytkownika:
Przygotowaliśmy dla Państwa szczegółową instrukcję korzystania z portalu:
${instructionsUrl}

Ważne informacje:
- Zalecamy zapoznanie się z instrukcją przed pierwszym logowaniem
- W portalu znajdą Państwo wszystkie informacje o targach
- Możliwość zarządzania zaproszeniami dla gości
- Dostęp do materiałów promocyjnych i brandingowych

W razie pytań lub problemów technicznych prosimy o kontakt.

© 2025 PTAK WARSAW EXPO. Wszystkie prawa zastrzeżone.
  `;

  try {
    if (canUseGraph()) {
      console.log('📧 Wysyłanie przez Microsoft Graph API...');
      const qs = require('querystring');
      const GRAPH_TOKEN_URL = (tenantId) => `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
      const GRAPH_SEND_URL = (userPrincipalName) => `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userPrincipalName)}/sendMail`;
      
      const tenantId = process.env.AZURE_TENANT_ID;
      const clientId = process.env.AZURE_CLIENT_ID;
      const clientSecret = process.env.AZURE_CLIENT_SECRET;
      const sender = process.env.GRAPH_SENDER || process.env.SMTP_USER;

      // Get access token
      const tokenRes = await fetch(GRAPH_TOKEN_URL(tenantId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: qs.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
          scope: 'https://graph.microsoft.com/.default',
        }),
      });
      
      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Graph token error: ${tokenRes.status} ${errText}`);
      }
      
      const tokenJson = await tokenRes.json();
      const accessToken = tokenJson.access_token;

      // Send email
      const mailRes = await fetch(GRAPH_SEND_URL(sender), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject,
            body: {
              contentType: 'HTML',
              content: html,
            },
            toRecipients: [{ emailAddress: { address: userEmail } }],
            from: sender ? { emailAddress: { address: sender } } : undefined,
          },
          saveToSentItems: true,
        }),
      });

      if (mailRes.status !== 202) {
        const errBody = await mailRes.text();
        throw new Error(`Graph sendMail error: ${mailRes.status} ${errBody}`);
      }
      
      return { success: true, method: 'Graph API' };
    } else {
      console.log('📧 Microsoft Graph API nie jest skonfigurowane, używam SMTP...');
      const nodemailer = require('nodemailer');
      
      let transporter;
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          requireTLS: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            minVersion: 'TLSv1.2',
          },
        });
      } else {
        console.log('⚠️  SMTP nie jest skonfigurowane, używam trybu deweloperskiego');
        transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: 'unix',
          buffer: true,
        });
      }

      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@ptak-expo.com',
        to: userEmail,
        subject,
        html,
        text,
      });

      return { success: true, messageId: info.messageId, method: 'SMTP' };
    }
  } catch (error) {
    console.error(`❌ Błąd wysyłania emaila do ${userEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

async function sendTestEmail() {
  let pool;
  const testEmail = 'pieniak@gmail.com';
  
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
    
    // Znajdź wystawcę testowego
    console.log(`🔍 Szukam wystawcy: ${testEmail}...`);
    const exhibitorResult = await pool.query(
      'SELECT id, nip, company_name, contact_person, email FROM exhibitors WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [testEmail]
    );
    
    if (exhibitorResult.rows.length === 0) {
      console.log(`❌ Nie znaleziono wystawcy z emailem: ${testEmail}`);
      console.log('Dostępni wystawcy z podobnym emailem:');
      const similar = await pool.query(
        "SELECT email, company_name FROM exhibitors WHERE LOWER(email) LIKE '%pieniak%' LIMIT 5"
      );
      similar.rows.forEach(row => {
        console.log(`  - ${row.email} (${row.company_name})`);
      });
      process.exit(1);
    }
    
    const exhibitor = exhibitorResult.rows[0];
    console.log(`✅ Znaleziono wystawcę:`);
    console.log(`   Firma: ${exhibitor.company_name}`);
    console.log(`   NIP: ${exhibitor.nip}`);
    console.log(`   Email: ${exhibitor.email}`);
    console.log(`   Osoba: ${exhibitor.contact_person}\n`);
    
    // Generuj nowe hasło
    console.log('🔐 Generuję nowe hasło...');
    const newPassword = generatePassword();
    console.log(`✅ Wygenerowano hasło: ${newPassword}\n`);
    
    // Hashuj hasło
    console.log('🔐 Hashuję hasło...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    console.log('✅ Hasło zahashowane\n');
    
    // Zapisz nowe hasło w bazie (exhibitors)
    console.log('💾 Zapisuję nowe hasło w tabeli exhibitors...');
    await pool.query(
      'UPDATE exhibitors SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, exhibitor.id]
    );
    console.log('✅ Zaktualizowano tabelę exhibitors\n');
    
    // Zapisz nowe hasło w bazie (users)
    console.log('💾 Zapisuję nowe hasło w tabeli users...');
    await pool.query(
      `INSERT INTO users (email, password_hash, role, status)
       VALUES ($1, $2, 'exhibitor', 'active')
       ON CONFLICT (email)
       DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active'`,
      [exhibitor.email.toLowerCase(), passwordHash]
    );
    console.log('✅ Zaktualizowano tabelę users\n');
    
    // Przygotuj dane do wysłania emaila
    const firstName = exhibitor.contact_person.split(' ')[0] || exhibitor.contact_person;
    const lastName = exhibitor.contact_person.split(' ').slice(1).join(' ') || '';
    const loginUrl = process.env.EXHIBITOR_PANEL_URL || 'https://wystawca.exhibitorlist.eu';
    
    console.log('📧 Wysyłam email testowy...');
    console.log(`   Do: ${exhibitor.email}`);
    console.log(`   Imię: ${firstName}`);
    console.log(`   Nazwisko: ${lastName}`);
    console.log(`   URL logowania: ${loginUrl}\n`);
    
    const emailResult = await sendWelcomeEmailWithInstructions(
      exhibitor.email,
      firstName,
      lastName,
      newPassword,
      loginUrl
    );
    
    if (emailResult.success) {
      console.log(`✅ Email testowy wysłany pomyślnie! (${emailResult.method})`);
      if (emailResult.messageId) {
        console.log(`   Message ID: ${emailResult.messageId}`);
      }
      console.log('\n' + '='.repeat(60));
      console.log('✅ TEST ZAKOŃCZONY POMYŚLNIE');
      console.log('='.repeat(60));
      console.log('\nSprawdź email i jeśli wszystko jest OK, uruchom:');
      console.log('node send-welcome-emails.js --all');
      console.log('\naby wysłać do wszystkich wystawców.');
    } else {
      console.log('❌ Błąd podczas wysyłania emaila:', emailResult.error);
      process.exit(1);
    }
    
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
      console.log('\n🔌 Rozłączono z bazą danych');
    }
  }
}

async function sendToAllExhibitors() {
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
    
    // Pobierz wszystkich aktywnych wystawców
    console.log('🔍 Pobieranie listy wystawców...');
    const result = await pool.query(
      `SELECT id, nip, company_name, contact_person, email, status 
       FROM exhibitors 
       WHERE status = 'active' AND email IS NOT NULL AND email != ''
       ORDER BY company_name`
    );
    
    console.log(`✅ Znaleziono ${result.rows.length} aktywnych wystawców\n`);
    
    const loginUrl = process.env.EXHIBITOR_PANEL_URL || 'https://wystawca.exhibitorlist.eu';
    
    let successCount = 0;
    let failCount = 0;
    const failed = [];
    
    console.log('🚀 Rozpoczynam wysyłkę maili...\n');
    console.log('='.repeat(60));
    
    for (let i = 0; i < result.rows.length; i++) {
      const exhibitor = result.rows[i];
      const progress = `[${i + 1}/${result.rows.length}]`;
      
      console.log(`\n${progress} ${exhibitor.company_name}`);
      console.log(`   Email: ${exhibitor.email}`);
      
      try {
        // Generuj nowe hasło
        const newPassword = generatePassword();
        console.log(`   Hasło: ${newPassword}`);
        
        // Hashuj hasło
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);
        
        // Zapisz w obu tabelach
        await pool.query(
          'UPDATE exhibitors SET password_hash = $1, updated_at = NOW() WHERE id = $2',
          [passwordHash, exhibitor.id]
        );
        
        await pool.query(
          `INSERT INTO users (email, password_hash, role, status)
           VALUES ($1, $2, 'exhibitor', 'active')
           ON CONFLICT (email)
           DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active'`,
          [exhibitor.email.toLowerCase(), passwordHash]
        );
        
        // Wyślij email
        const firstName = exhibitor.contact_person.split(' ')[0] || exhibitor.contact_person;
        const lastName = exhibitor.contact_person.split(' ').slice(1).join(' ') || '';
        
        const emailResult = await sendWelcomeEmailWithInstructions(
          exhibitor.email,
          firstName,
          lastName,
          newPassword,
          loginUrl
        );
        
        if (emailResult.success) {
          console.log(`   ✅ Wysłano (${emailResult.method})`);
          successCount++;
        } else {
          console.log(`   ❌ Błąd: ${emailResult.error}`);
          failCount++;
          failed.push({ email: exhibitor.email, company: exhibitor.company_name, error: emailResult.error });
        }
        
        // Małe opóźnienie aby nie przeciążyć serwera email
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ Błąd: ${error.message}`);
        failCount++;
        failed.push({ email: exhibitor.email, company: exhibitor.company_name, error: error.message });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 PODSUMOWANIE WYSYŁKI');
    console.log('='.repeat(60));
    console.log(`Wysłano pomyślnie: ${successCount}`);
    console.log(`Błędy: ${failCount}`);
    console.log(`Łącznie przetworzono: ${result.rows.length}`);
    
    if (failed.length > 0) {
      console.log('\n❌ Nie udało się wysłać do:');
      failed.forEach(f => {
        console.log(`   - ${f.company} (${f.email}): ${f.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Błąd:', error);
    console.error('Szczegóły:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('\n🔌 Rozłączono z bazą danych');
    }
  }
}

// Main
const args = process.argv.slice(2);
if (args.includes('--all')) {
  console.log('🚀 Wysyłka do WSZYSTKICH wystawców\n');
  sendToAllExhibitors();
} else {
  console.log('🧪 Tryb testowy - wysyłka do pieniak@gmail.com\n');
  sendTestEmail();
}

