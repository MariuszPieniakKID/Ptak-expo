const nodemailer = require('nodemailer');

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

// Funkcja wysyłania emaila z danymi logowania
// isTemporaryPassword: jeśli true – etykieta "Hasło tymczasowe", jeśli false – "Hasło"
const sendWelcomeEmail = async (userEmail, firstName, lastName, password, isTemporaryPassword = true) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@ptak-expo.com',
      to: userEmail,
      subject: 'Powitanie w systemie PTAK EXPO - Dane logowania',
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
                    <h1>Witamy w systemie PTAK EXPO</h1>
                </div>
                <div class="content">
                    <h2>Dzień dobry ${firstName} ${lastName},</h2>
                    <p>Zostało utworzone dla Państwa konto w systemie PTAK EXPO. Poniżej znajdują się dane dostępowe:</p>
                    
                    <div class="credentials">
                        <h3>Dane logowania:</h3>
                        <p><strong>Email:</strong> ${userEmail}</p>
                        <p><strong>${isTemporaryPassword ? 'Hasło tymczasowe' : 'Hasło'}:</strong> <code>${password}</code></p>
                    </div>
                    
                    <p><strong>Ważne:</strong> Ze względów bezpieczeństwa zalecamy zmianę hasła po pierwszym logowaniu.</p>
                    
                    <p>Aby zalogować się do systemu, kliknij poniższy przycisk:</p>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Zaloguj się do systemu</a>
                    
                    <p>W razie pytań prosimy o kontakt z administratorem systemu.</p>
                </div>
                <div class="footer">
                    <p>© 2024 PTAK EXPO. Wszystkie prawa zastrzeżone.</p>
                    <p>Ta wiadomość została wygenerowana automatycznie. Prosimy nie odpowiadać na tę wiadomość.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
Witamy w systemie PTAK EXPO

Dzień dobry ${firstName} ${lastName},

Zostało utworzone dla Państwa konto w systemie PTAK EXPO.

Dane logowania:
Email: ${userEmail}
${isTemporaryPassword ? 'Hasło tymczasowe' : 'Hasło'}: ${password}

Ze względów bezpieczeństwa zalecamy zmianę hasła po pierwszym logowaniu.

Link do logowania: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

W razie pytań prosimy o kontakt z administratorem systemu.

© 2024 PTAK EXPO. Wszystkie prawa zastrzeżone.
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
const sendPasswordResetEmail = async (userEmail, firstName, lastName, newPassword) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@ptak-expo.com',
      to: userEmail,
      subject: 'PTAK EXPO - Reset hasła',
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
                    <h1>Reset hasła - PTAK EXPO</h1>
                </div>
                <div class="content">
                    <h2>Dzień dobry ${firstName} ${lastName},</h2>
                    <p>Zostało wygenerowane nowe hasło do Państwa konta w systemie PTAK EXPO:</p>
                    
                    <div class="credentials">
                        <h3>Nowe dane logowania:</h3>
                        <p><strong>Email:</strong> ${userEmail}</p>
                        <p><strong>Nowe hasło:</strong> <code>${newPassword}</code></p>
                    </div>
                    
                    <p><strong>Ważne:</strong> Ze względów bezpieczeństwa zalecamy zmianę hasła po zalogowaniu.</p>
                    
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Zaloguj się do systemu</a>
                    
                    <p>Jeśli nie żądali Państwo resetu hasła, prosimy o natychmiastowy kontakt z administratorem.</p>
                </div>
                <div class="footer">
                    <p>© 2024 PTAK EXPO. Wszystkie prawa zastrzeżone.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
Reset hasła - PTAK EXPO

Dzień dobry ${firstName} ${lastName},

Zostało wygenerowane nowe hasło do Państwa konta w systemie PTAK EXPO.

Nowe dane logowania:
Email: ${userEmail}
Nowe hasło: ${newPassword}

Ze względów bezpieczeństwa zalecamy zmianę hasła po zalogowaniu.

Link do logowania: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

Jeśli nie żądali Państwo resetu hasła, prosimy o natychmiastowy kontakt z administratorem.

© 2024 PTAK EXPO. Wszystkie prawa zastrzeżone.
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
const sendEmail = async ({ to, subject, text, html, from }) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: from || process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports.sendEmail = sendEmail;