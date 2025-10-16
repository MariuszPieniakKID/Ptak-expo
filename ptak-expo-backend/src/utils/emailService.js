const nodemailer = require('nodemailer');
const qs = require('querystring');
const GRAPH_TOKEN_URL = (tenantId) => `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
const GRAPH_SEND_URL = (userPrincipalName) => `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userPrincipalName)}/sendMail`;

// Konfiguracja transportera emaila
const createTransporter = () => {
  // Jeśli są ustawione zmienne środowiskowe dla SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false, // STARTTLS on port 587
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // Enforce modern TLS; Office365 requires TLS 1.2+
        minVersion: 'TLSv1.2',
      },
    });
  }
  
  // Fallback - Gmail konfiguracja
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // App Password dla Gmail
      },
    });
  }
  
  // Rozwojowa konfiguracja - wysyła do konsoli
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
};

// Send email via Microsoft Graph API (no SMTP ports) if Azure App credentials are provided
const canUseGraph = () => (
  !!process.env.AZURE_TENANT_ID && !!process.env.AZURE_CLIENT_ID && !!process.env.AZURE_CLIENT_SECRET && !!(process.env.SMTP_USER || process.env.GRAPH_SENDER)
);

const sendViaGraph = async ({ to, subject, text, html, from, attachments }) => {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const sender = process.env.GRAPH_SENDER || process.env.SMTP_USER || from;

  // 1) Get access token
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

  // 2) Send email via Graph
  const graphAttachments = Array.isArray(attachments) && attachments.length > 0
    ? attachments.map((att) => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: att.filename || att.name || 'attachment',
        contentType: att.contentType || 'application/octet-stream',
        contentBytes: Buffer.isBuffer(att.content)
          ? att.content.toString('base64')
          : (typeof att.content === 'string' ? att.content : ''),
      }))
    : undefined;

  const mailRes = await fetch(GRAPH_SEND_URL(sender), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject: subject || '(no subject)',
        body: {
          contentType: html ? 'HTML' : 'Text',
          content: html || text || '',
        },
        toRecipients: [ { emailAddress: { address: to } } ],
        from: sender ? { emailAddress: { address: sender } } : undefined,
        ...(graphAttachments ? { attachments: graphAttachments } : {})
      },
      saveToSentItems: true,
    }),
  });

  // Graph returns 202 Accepted on success
  if (mailRes.status !== 202) {
    const errBody = await mailRes.text();
    throw new Error(`Graph sendMail error: ${mailRes.status} ${errBody}`);
  }
  return { success: true };
};

// Funkcja wysyłania emaila z danymi logowania
// isTemporaryPassword: jeśli true – etykieta "Hasło tymczasowe", jeśli false – "Hasło"
// loginUrl: opcjonalny pełny URL do strony logowania danego panelu (jeśli nie podasz, użyje FRONTEND_URL)
const sendWelcomeEmail = async (userEmail, firstName, lastName, password, isTemporaryPassword = true, loginUrl) => {
  try {
    // Prefer Graph if configured (works over HTTPS on Railway)
    if (canUseGraph()) {
      const subject = 'Powitanie w systemie PTAK WARSAW EXPO - Dane logowania';
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
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                .button { display: inline-block; padding: 12px 24px; background-color: #c7353c; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Witamy w systemie PTAK WARSAW EXPO</h1>
                </div>
                <div class="content">
                    <h2>Dzień dobry ${firstName} ${lastName},</h2>
                    <p>Zostało utworzone dla Państwa konto w systemie PTAK WARSAW EXPO. Poniżej znajdują się dane dostępowe:</p>
                    <div class="credentials">
                        <h3>Dane logowania:</h3>
                        <p><strong>Email:</strong> ${userEmail}</p>
                        <p><strong>${isTemporaryPassword ? 'Hasło tymczasowe' : 'Hasło'}:</strong> <code>${password}</code></p>
                    </div>
                    <p>Aby zalogować się do systemu, kliknij poniższy przycisk:</p>
                    <a href="${(loginUrl ? loginUrl.replace(/\/$/, '') : (process.env.FRONTEND_URL || 'http://localhost:3000')) + '/login'}" class="button">Zaloguj się do systemu</a>
                    <p>W razie pytań prosimy o kontakt z administratorem systemu.</p>
                </div>
                <div class="footer">
                    <p>© 2024 PTAK WARSAW EXPO. Wszystkie prawa zastrzeżone.</p>
                    <p>Ta wiadomość została wygenerowana automatycznie. Prosimy nie odpowiadać na tę wiadomość.</p>
                </div>
            </div>
        </body>
        </html>`;
      const text = `Witamy w systemie PTAK WARSAW EXPO\n\nEmail: ${userEmail}\n${isTemporaryPassword ? 'Hasło tymczasowe' : 'Hasło'}: ${password}\nLink do logowania: ${(loginUrl ? loginUrl.replace(/\/$/, '') : (process.env.FRONTEND_URL || 'http://localhost:3000')) + '/login'}\n`;
      await sendViaGraph({ to: userEmail, subject, text, html, from: process.env.FROM_EMAIL });
      return { success: true };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@ptak-expo.com',
      to: userEmail,
      subject: 'Powitanie w systemie PTAK WARSAW EXPO - Dane logowania',
      html: `
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
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                .button { display: inline-block; padding: 12px 24px; background-color: #c7353c; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Witamy w systemie PTAK WARSAW EXPO</h1>
                </div>
                <div class="content">
                    <h2>Dzień dobry ${firstName} ${lastName},</h2>
                    <p>Zostało utworzone dla Państwa konto w systemie PTAK WARSAW EXPO. Poniżej znajdują się dane dostępowe:</p>
                    
                    <div class="credentials">
                        <h3>Dane logowania:</h3>
                        <p><strong>Email:</strong> ${userEmail}</p>
                        <p><strong>${isTemporaryPassword ? 'Hasło tymczasowe' : 'Hasło'}:</strong> <code>${password}</code></p>
                    </div>
                    
                    <p>Aby zalogować się do systemu, kliknij poniższy przycisk:</p>
                    <a href="${(loginUrl ? loginUrl.replace(/\/$/, '') : (process.env.FRONTEND_URL || 'http://localhost:3000')) + '/login'}" class="button">Zaloguj się do systemu</a>
                    
                    <p>W razie pytań prosimy o kontakt z administratorem systemu.</p>
                </div>
                <div class="footer">
                    <p>© 2024 PTAK WARSAW EXPO. Wszystkie prawa zastrzeżone.</p>
                    <p>Ta wiadomość została wygenerowana automatycznie. Prosimy nie odpowiadać na tę wiadomość.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
Witamy w systemie PTAK WARSAW EXPO

Dzień dobry ${firstName} ${lastName},

Zostało utworzone dla Państwa konto w systemie PTAK WARSAW EXPO.

Dane logowania:
Email: ${userEmail}
${isTemporaryPassword ? 'Hasło tymczasowe' : 'Hasło'}: ${password}

Link do logowania: ${(loginUrl ? loginUrl.replace(/\/$/, '') : (process.env.FRONTEND_URL || 'http://localhost:3000')) + '/login'}

W razie pytań prosimy o kontakt z administratorem systemu.

© 2024 PTAK WARSAW EXPO. Wszystkie prawa zastrzeżone.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Jeśli używamy transportera deweloperskiego
    if (info.message) {
      console.log('📧 Email would be sent:');
      console.log('To:', userEmail);
      console.log('Subject:', mailOptions.subject);
      console.log('Password:', password);
      console.log('Preview:', info.message.toString());
    } else {
      console.log('📧 Welcome email sent successfully to:', userEmail);
      console.log('Message ID:', info.messageId);
    }
    
    return {
      success: true,
      messageId: info.messageId,
      userEmail: userEmail
    };
    
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Funkcja wysyłania emaila z resetem hasła
const sendPasswordResetEmail = async (userEmail, firstName, lastName, newPassword, customLoginUrl = null) => {
  // Use custom login URL if provided (e.g., for exhibitor panel), otherwise use default FRONTEND_URL
  const loginUrl = customLoginUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
  try {
    if (canUseGraph()) {
      const subject = 'PTAK WARSAW EXPO - Reset hasła';
      const html = `<!DOCTYPE html><html><head><meta charset=\"UTF-8\">`+
      `<style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background-color:#c7353c;color:#fff;padding:20px;text-align:center}.content{padding:20px;background-color:#f9f9f9}.credentials{background-color:#fff;padding:15px;border-left:4px solid #c7353c;margin:20px 0}.footer{text-align:center;padding:20px;font-size:12px;color:#666}.button{display:inline-block;padding:12px 24px;background-color:#c7353c;color:#fff;text-decoration:none;border-radius:5px;margin:10px 0}</style>`+
      `</head><body><div class=\"container\"><div class=\"header\"><h1>Reset hasła - PTAK WARSAW EXPO</h1></div><div class=\"content\"><h2>Dzień dobry ${firstName} ${lastName},</h2><p>Zostało wygenerowane nowe hasło:</p><div class=\"credentials\"><h3>Nowe dane logowania:</h3><p><strong>Email:</strong> ${userEmail}</p><p><strong>Nowe hasło:</strong> <code>${newPassword}</code></p></div><a href=\"${loginUrl}\" class=\"button\">Zaloguj się do systemu</a></div><div class=\"footer\"><p>© 2024 PTAK WARSAW EXPO. Wszystkie prawa zastrzeżone.</p></div></div></body></html>`;
      const text = `Reset hasła - PTAK WARSAW EXPO\n\nEmail: ${userEmail}\nNowe hasło: ${newPassword}`;
      await sendViaGraph({ to: userEmail, subject, text, html, from: process.env.FROM_EMAIL });
      return { success: true };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@ptak-expo.com',
      to: userEmail,
      subject: 'PTAK WARSAW EXPO - Reset hasła',
      html: `
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
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                .button { display: inline-block; padding: 12px 24px; background-color: #c7353c; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Reset hasła - PTAK WARSAW EXPO</h1>
                </div>
                <div class="content">
                    <h2>Dzień dobry ${firstName} ${lastName},</h2>
                    <p>Zostało wygenerowane nowe hasło do Państwa konta w systemie PTAK WARSAW EXPO:</p>
                    
                    <div class="credentials">
                        <h3>Nowe dane logowania:</h3>
                        <p><strong>Email:</strong> ${userEmail}</p>
                        <p><strong>Nowe hasło:</strong> <code>${newPassword}</code></p>
                    </div>
                    
                    <p><strong>Ważne:</strong> Ze względów bezpieczeństwa zalecamy zmianę hasła po zalogowaniu.</p>
                    
                    <a href="${loginUrl}" class="button">Zaloguj się do systemu</a>
                    
                    <p>Jeśli nie żądali Państwo resetu hasła, prosimy o natychmiastowy kontakt z administratorem.</p>
                </div>
                <div class="footer">
                    <p>© 2024 PTAK WARSAW EXPO. Wszystkie prawa zastrzeżone.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
Reset hasła - PTAK WARSAW EXPO

Dzień dobry ${firstName} ${lastName},

Zostało wygenerowane nowe hasło do Państwa konta w systemie PTAK WARSAW EXPO.

Nowe dane logowania:
Email: ${userEmail}
Nowe hasło: ${newPassword}

Ze względów bezpieczeństwa zalecamy zmianę hasła po zalogowaniu.

Link do logowania: ${loginUrl}

Jeśli nie żądali Państwo resetu hasła, prosimy o natychmiastowy kontakt z administratorem.

© 2024 PTAK WARSAW EXPO. Wszystkie prawa zastrzeżone.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (info.message) {
      console.log('📧 Password reset email would be sent:');
      console.log('To:', userEmail);
      console.log('Subject:', mailOptions.subject);
      console.log('New Password:', newPassword);
    } else {
      console.log('📧 Password reset email sent successfully to:', userEmail);
      console.log('Message ID:', info.messageId);
    }
    
    return {
      success: true,
      messageId: info.messageId,
      userEmail: userEmail
    };
    
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail
}; 

// Generic email sender for custom messages
const sendEmail = async ({ to, subject, text, html, from, attachments }) => {
  try {
    const fallbackFrom = from || process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@ptak-expo.com';

    // SMTP path (preferred). We do NOT use Graph here to keep config SMTP-only.
    const transporter = createTransporter();
    const mailOptions = {
      from: fallbackFrom,
      to,
      subject,
      text,
      html,
      attachments: Array.isArray(attachments) ? attachments : undefined,
    };
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports.sendEmail = sendEmail;