const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Funkcja do generowania silnego hasła
const generatePassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let password = '';
  
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  for (let i = 0; i < 4; i++) {
    password += upper.charAt(Math.floor(Math.random() * upper.length));
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Funkcja do wysyłania emaila z instrukcją
const sendWelcomeEmailWithInstructions = async (userEmail, firstName, lastName, password, loginUrl) => {
  const instructionsUrl = 'https://industryweek.pl/wp-content/uploads/2025/10/Instrukcja-do-aplikacji.pdf';
  
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
      const qs = require('querystring');
      const GRAPH_TOKEN_URL = (tenantId) => `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
      const GRAPH_SEND_URL = (userPrincipalName) => `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userPrincipalName)}/sendMail`;
      
      const tenantId = process.env.AZURE_TENANT_ID;
      const clientId = process.env.AZURE_CLIENT_ID;
      const clientSecret = process.env.AZURE_CLIENT_SECRET;
      const sender = process.env.GRAPH_SENDER || process.env.SMTP_USER;

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
      const nodemailer = require('nodemailer');
      
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP nie jest skonfigurowane');
      }

      const transporter = nodemailer.createTransport({
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

// POST /api/v1/bulk-emails/send-welcome-test - wysyła test do pieniak@gmail.com
router.post('/send-welcome-test', verifyToken, requireAdmin, async (req, res) => {
  const testEmail = 'pieniak@gmail.com';
  
  try {
    console.log(`🧪 Test wysyłki maila do ${testEmail}...`);
    
    // Znajdź wystawcę testowego
    const exhibitorResult = await db.query(
      'SELECT id, nip, company_name, contact_person, email FROM exhibitors WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [testEmail]
    );
    
    if (exhibitorResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: `Nie znaleziono wystawcy z emailem: ${testEmail}` 
      });
    }
    
    const exhibitor = exhibitorResult.rows[0];
    console.log(`✅ Znaleziono wystawcę: ${exhibitor.company_name}`);
    
    // Generuj nowe hasło
    const newPassword = generatePassword();
    console.log(`🔐 Wygenerowano hasło: ${newPassword}`);
    
    // Hashuj hasło
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Zapisz nowe hasło w bazie (exhibitors)
    await db.query(
      'UPDATE exhibitors SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, exhibitor.id]
    );
    
    // Zapisz nowe hasło w bazie (users)
    await db.query(
      `INSERT INTO users (email, password_hash, role, status)
       VALUES ($1, $2, 'exhibitor', 'active')
       ON CONFLICT (email)
       DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active'`,
      [exhibitor.email.toLowerCase(), passwordHash]
    );
    
    console.log('💾 Zaktualizowano hasło w bazie danych');
    
    // Przygotuj dane do wysłania emaila
    const firstName = exhibitor.contact_person.split(' ')[0] || exhibitor.contact_person;
    const lastName = exhibitor.contact_person.split(' ').slice(1).join(' ') || '';
    const loginUrl = process.env.EXHIBITOR_PANEL_URL || 'https://wystawca.exhibitorlist.eu';
    
    console.log(`📧 Wysyłam email do ${exhibitor.email}...`);
    
    const emailResult = await sendWelcomeEmailWithInstructions(
      exhibitor.email,
      firstName,
      lastName,
      newPassword,
      loginUrl
    );
    
    if (emailResult.success) {
      console.log(`✅ Email wysłany pomyślnie (${emailResult.method})`);
      return res.json({
        success: true,
        message: 'Email testowy wysłany pomyślnie',
        data: {
          email: exhibitor.email,
          company: exhibitor.company_name,
          method: emailResult.method,
          password: newPassword // Zwracamy hasło w odpowiedzi dla admina
        }
      });
    } else {
      console.log(`❌ Błąd wysyłania: ${emailResult.error}`);
      return res.status(500).json({
        success: false,
        message: 'Błąd podczas wysyłania emaila',
        error: emailResult.error
      });
    }
    
  } catch (error) {
    console.error('❌ Błąd:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera',
      error: error.message
    });
  }
});

// POST /api/v1/bulk-emails/send-welcome-all - wysyła do wszystkich wystawców
router.post('/send-welcome-all', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('🚀 Rozpoczynam wysyłkę do wszystkich wystawców...');
    
    // Pobierz wszystkich aktywnych wystawców
    const result = await db.query(
      `SELECT id, nip, company_name, contact_person, email, status 
       FROM exhibitors 
       WHERE status = 'active' AND email IS NOT NULL AND email != ''
       ORDER BY company_name`
    );
    
    console.log(`✅ Znaleziono ${result.rows.length} aktywnych wystawców`);
    
    const loginUrl = process.env.EXHIBITOR_PANEL_URL || 'https://wystawca.exhibitorlist.eu';
    
    let successCount = 0;
    let failCount = 0;
    const failed = [];
    const successful = [];
    
    for (let i = 0; i < result.rows.length; i++) {
      const exhibitor = result.rows[i];
      const progress = `[${i + 1}/${result.rows.length}]`;
      
      console.log(`${progress} ${exhibitor.company_name} (${exhibitor.email})`);
      
      try {
        // Generuj nowe hasło
        const newPassword = generatePassword();
        
        // Hashuj hasło
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);
        
        // Zapisz w obu tabelach
        await db.query(
          'UPDATE exhibitors SET password_hash = $1, updated_at = NOW() WHERE id = $2',
          [passwordHash, exhibitor.id]
        );
        
        await db.query(
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
          successful.push({
            email: exhibitor.email,
            company: exhibitor.company_name,
            password: newPassword
          });
        } else {
          console.log(`   ❌ Błąd: ${emailResult.error}`);
          failCount++;
          failed.push({ 
            email: exhibitor.email, 
            company: exhibitor.company_name, 
            error: emailResult.error 
          });
        }
        
        // Małe opóźnienie aby nie przeciążyć serwera email
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ Błąd: ${error.message}`);
        failCount++;
        failed.push({ 
          email: exhibitor.email, 
          company: exhibitor.company_name, 
          error: error.message 
        });
      }
    }
    
    console.log('='.repeat(60));
    console.log('📊 PODSUMOWANIE WYSYŁKI');
    console.log(`Wysłano pomyślnie: ${successCount}`);
    console.log(`Błędy: ${failCount}`);
    console.log(`Łącznie: ${result.rows.length}`);
    
    return res.json({
      success: true,
      message: `Wysłano ${successCount} emaili, ${failCount} błędów`,
      data: {
        total: result.rows.length,
        success: successCount,
        failed: failCount,
        failedEmails: failed,
        // Opcjonalnie: successful - zawiera hasła, więc ostrożnie
      }
    });
    
  } catch (error) {
    console.error('❌ Błąd:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera',
      error: error.message
    });
  }
});

module.exports = router;

