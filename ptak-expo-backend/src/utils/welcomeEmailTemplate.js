// Mail powitalny wystawcy (PL/EN w jednej wiadomości). Nie zawiera hasła: wystawca loguje się
// swoim hasłem, a jeśli go nie zna, generuje nowe przyciskiem prowadzącym do „Przypomnij hasło”.

const BRAND = '#c7353c';
const INSTRUCTIONS_URL = 'https://industryweek.pl/wp-content/uploads/2025/10/Instrukcja-do-aplikacji.pdf';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const panelUrl = () => (process.env.EXHIBITOR_PANEL_URL || 'https://wystawca.exhibitorlist.warsawexpo.eu').replace(/\/$/, '');

const exhibitorWelcomeLinks = (email) => {
  const base = panelUrl();
  return {
    appUrl: `${base}/login`,
    resetUrl: `${base}/login?przypomnij-haslo=1&email=${encodeURIComponent(email)}`,
  };
};

const button = (href, label, primary) => `
  <a href="${href}" target="_blank" style="display:inline-block;padding:13px 26px;margin:6px;border-radius:6px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;${primary ? `background:${BRAND};color:#ffffff;border:2px solid ${BRAND};` : `background:#ffffff;color:${BRAND};border:2px solid ${BRAND};`}">${label}</a>`;

const section = ({ greeting, intro, login, noPassword, appLabel, resetLabel, guide }, ctx) => `
  <tr><td style="padding:28px 32px 8px 32px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2e2e38;">
    <p style="margin:0 0 14px 0;">${greeting}</p>
    <p style="margin:0 0 14px 0;">${intro}</p>
    <p style="margin:0 0 14px 0;">${login}</p>
    <p style="margin:0 0 6px 0;">${noPassword}</p>
  </td></tr>
  <tr><td align="center" style="padding:8px 32px 18px 32px;">
    ${button(ctx.appUrl, appLabel, true)}${button(ctx.resetUrl, resetLabel, false)}
  </td></tr>
  <tr><td style="padding:0 32px 24px 32px;font-family:Arial,sans-serif;font-size:13px;color:#6f6f76;">
    ${guide} <a href="${INSTRUCTIONS_URL}" style="color:${BRAND};">PDF</a>
  </td></tr>`;

const buildExhibitorWelcomeEmail = ({ email, exhibitionName }) => {
  const { appUrl, resetUrl } = exhibitorWelcomeLinks(email);
  const ev = esc(exhibitionName || 'PTAK WARSAW EXPO');
  const mail = esc(email);
  const ctx = { appUrl, resetUrl };

  const pl = {
    greeting: 'Dzień dobry,',
    intro: `wydarzenie <strong>${ev}</strong> zostało dodane do Państwa konta w Portalu Wystawcy PTAK WARSAW EXPO.`,
    login: `Logują się Państwo jak dotychczas: adresem e-mail <strong>${mail}</strong> i swoim hasłem.`,
    noPassword: 'Nie pamiętają Państwo hasła lub go nie znają? Kliknij „Wygeneruj hasło”, a nowe hasło wyślemy na ten adres e-mail.',
    appLabel: 'Przejdź do aplikacji',
    resetLabel: 'Wygeneruj hasło',
    guide: 'Instrukcja korzystania z portalu:',
  };
  const en = {
    greeting: 'Hello,',
    intro: `the event <strong>${ev}</strong> has been added to your account in the PTAK WARSAW EXPO Exhibitor Portal.`,
    login: `Log in as usual with your e-mail address <strong>${mail}</strong> and your password.`,
    noPassword: 'Forgot your password or don’t have one? Click “Generate password” and we will send a new one to this e-mail address.',
    appLabel: 'Go to the app',
    resetLabel: 'Generate password',
    guide: 'Portal user guide:',
  };

  const subject = `${exhibitionName || 'PTAK WARSAW EXPO'} – wydarzenie dodane do Twojego konta / event added to your account`;

  const html = `<!DOCTYPE html>
<html lang="pl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f2f2f4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2f2f4;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:${BRAND};padding:22px 32px;font-family:Arial,sans-serif;color:#ffffff;">
          <div style="font-size:20px;font-weight:bold;letter-spacing:1px;">PTAK WARSAW EXPO</div>
          <div style="font-size:14px;margin-top:4px;">Portal Wystawcy / Exhibitor Portal · ${ev}</div>
        </td></tr>
        ${section(pl, ctx)}
        <tr><td style="padding:0 32px;"><div style="border-top:1px solid #e3e3e6;"></div></td></tr>
        ${section(en, ctx)}
        <tr><td style="background:#f7f7f8;padding:18px 32px;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#8a8a90;">
          Pytania / Questions: <a href="mailto:appSupport@warsawexpo.eu" style="color:${BRAND};">appSupport@warsawexpo.eu</a><br>
          Wiadomość wygenerowana automatycznie, prosimy na nią nie odpowiadać. / This is an automated message, please do not reply.<br>
          © ${new Date().getFullYear()} PTAK WARSAW EXPO
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `PTAK WARSAW EXPO – Portal Wystawcy / Exhibitor Portal`,
    '',
    `Dzień dobry,`,
    `wydarzenie ${exhibitionName || ''} zostało dodane do Państwa konta w Portalu Wystawcy PTAK WARSAW EXPO.`,
    `Logują się Państwo jak dotychczas: adresem e-mail ${email} i swoim hasłem.`,
    `Przejdź do aplikacji: ${appUrl}`,
    `Nie pamiętają Państwo hasła lub go nie znają? Wygeneruj hasło: ${resetUrl}`,
    '',
    `Hello,`,
    `the event ${exhibitionName || ''} has been added to your account in the PTAK WARSAW EXPO Exhibitor Portal.`,
    `Log in as usual with your e-mail address ${email} and your password.`,
    `Go to the app: ${appUrl}`,
    `Forgot your password or don't have one? Generate password: ${resetUrl}`,
    '',
    `Instrukcja / User guide: ${INSTRUCTIONS_URL}`,
    `Pytania / Questions: appSupport@warsawexpo.eu`,
  ].join('\n');

  return { subject, html, text };
};

module.exports = { buildExhibitorWelcomeEmail, exhibitorWelcomeLinks };
