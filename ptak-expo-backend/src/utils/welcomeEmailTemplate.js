// Maile wystawcy (PL/EN w jednej wiadomości) na szablonach od marketingu z src/templates/emails.
// Mail powitalny nie zawiera hasła: wystawca loguje się swoim hasłem, a jeśli go nie zna,
// generuje nowe przyciskiem prowadzącym do „Przypomnij hasło”.

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'emails');
const WELCOME_HTML = fs.readFileSync(path.join(TEMPLATES_DIR, 'exhibitor-welcome.html'), 'utf8');
const RESET_HTML = fs.readFileSync(path.join(TEMPLATES_DIR, 'exhibitor-password-reset.html'), 'utf8');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fill = (html, values) => Object.entries(values)
  .reduce((out, [key, value]) => out.split(`[${key}]`).join(value), html);

const panelUrl = () => (process.env.EXHIBITOR_PANEL_URL || 'https://wystawca.exhibitorlist.warsawexpo.eu').replace(/\/$/, '');

const exhibitorWelcomeLinks = (email) => {
  const base = panelUrl();
  return {
    appUrl: `${base}/login`,
    resetUrl: `${base}/login?przypomnij-haslo=1&email=${encodeURIComponent(email)}`,
  };
};

const SUPPORT = 'appsupport@warsawexpo.eu';

const buildExhibitorWelcomeEmail = ({ email, exhibitionName }) => {
  const { appUrl, resetUrl } = exhibitorWelcomeLinks(email);
  const eventName = exhibitionName || 'PTAK WARSAW EXPO';
  const ev = esc(eventName);

  const subject = `Witamy w gronie wystawców ${eventName} / Welcome to the exhibitors of ${eventName}`;
  const html = fill(WELCOME_HTML, {
    'NAZWA TARGÓW': ev,
    'TRADE FAIR NAME': ev,
    LOGIN: esc(email),
    'LINK DO APLIKACJI': esc(appUrl),
    'LINK DO PRZYPOMNIENIA HASŁA': esc(resetUrl),
  });

  const text = [
    'PTAK WARSAW EXPO – Katalog Wystawców / Exhibitor Catalogue',
    '',
    'Dzień dobry,',
    `cieszymy się, że dołączyli Państwo do grona wystawców targów ${eventName}, które odbędą się w Ptak Warsaw Expo.`,
    'Oddajemy Państwu dostęp do aplikacji Katalog Wystawców. Umożliwia ona stworzenie wizytówki firmy widocznej na stronie targów.',
    `Login: ${email}`,
    `Zaloguj się: ${appUrl}`,
    `Przypomnij hasło: ${resetUrl}`,
    '',
    'Dear Exhibitor,',
    `we are pleased that you have joined the exhibitors of ${eventName}, to be held at Ptak Warsaw Expo.`,
    'We are giving you access to the Exhibitor Catalogue application, which allows you to create a company profile displayed on the trade fair website.',
    `Login: ${email}`,
    `Log in: ${appUrl}`,
    `Reset password: ${resetUrl}`,
    '',
    `W razie problemów z logowaniem / In case of any problems logging in: ${SUPPORT}`,
    'Zespół Ptak Warsaw Expo / Ptak Warsaw Expo Team',
  ].join('\n');

  return { subject, html, text };
};

const buildExhibitorPasswordResetEmail = ({ email, newPassword, loginUrl }) => {
  const appUrl = loginUrl || exhibitorWelcomeLinks(email).appUrl;

  const subject = 'Reset hasła / Password reset – Katalog Wystawców';
  const html = fill(RESET_HTML, {
    LOGIN: esc(email),
    'NOWE HASŁO': esc(newPassword),
    'LINK DO APLIKACJI': esc(appUrl),
  });

  const text = [
    'PTAK WARSAW EXPO – Katalog Wystawców / Exhibitor Catalogue',
    '',
    'Dzień dobry,',
    'zgodnie z otrzymanym zgłoszeniem zresetowaliśmy hasło do aplikacji Katalog Wystawców.',
    'Poprzednie hasło jest już nieaktywne. Do kolejnego logowania należy użyć nowych danych podanych poniżej.',
    '',
    'Dear Exhibitor,',
    'in response to your request, we have reset your password for the Exhibitor Catalogue application.',
    'Your previous password is no longer active. Please use the new login details provided below the next time you log in.',
    '',
    `Login: ${email}`,
    `Nowe hasło / New password: ${newPassword}`,
    `Zaloguj się / Log in: ${appUrl}`,
    '',
    'Dla bezpieczeństwa prosimy nie udostępniać danych logowania osobom nieupoważnionym. Jeżeli nie zgłaszali Państwo prośby o reset hasła, prosimy o kontakt.',
    'For security reasons, please do not share your login details with unauthorised persons. If you did not request a password reset, please contact us.',
    '',
    `W razie problemów z logowaniem / In case of any problems logging in: ${SUPPORT}`,
    'Zespół Ptak Warsaw Expo / Ptak Warsaw Expo Team',
  ].join('\n');

  return { subject, html, text };
};

module.exports = { buildExhibitorWelcomeEmail, buildExhibitorPasswordResetEmail, exhibitorWelcomeLinks };
