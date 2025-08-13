import React from 'react';
import styles from './DocumentsPage.module.scss';
import CustomTypography from '../components/customTypography/CustomTypography';
import CustomButton from '../components/customButton/CustomButton';

const DocumentsPage: React.FC = () => {
  const invoices = [
    'Faktura 53739/234/T',
    'Faktura 53739/234/T',
    'Faktura 5373u/234/T',
    'Faktura 53739/234/T',
    'Faktura 53739/234/T',
  ];

  const downloads = [
    'Regulamin targów',
    'Regulamin obiektu',
    'Warunki techniczne',
    'Regulamin zabudowy',
  ];

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.headerBox}>
          <div className={styles.userRow}>
            <div className={styles.userAvatar} />
            <div>
              <div className={styles.hello}>Dzień dobry, MTB Modules</div>
              <div className={styles.helloSub}>Sprawdź co możesz dzisiaj zrobić!</div>
            </div>
          </div>

          <div className={styles.eventCard}>
            <div className={styles.eventThumb} />
            <div className={styles.eventMeta}>
              <div className={styles.eventDate}>11.03.2026-15.03.2026</div>
              <div className={styles.eventName}>Warsaw Industry Weej Targi Innowacyjnych Rozwiązań dla Przemysłu</div>
            </div>
            <div className={styles.eventChange}>zmień</div>
          </div>

          <div className={styles.countdownPill}>Do wydarzenia zostalo 386 dni</div>

          <div className={styles.progressCard}>
            <div className={styles.progressHeaderRow}>
              <div className={styles.progressHeaderText}>
                <div className={styles.progressTitle}>Gratulacje, mamy wszystko!</div>
                <div className={styles.progressSub}>Wasza gotowość do targów:</div>
              </div>
              <div className={styles.kpiBadge}>100%</div>
            </div>
            <div className={styles.bannerBar} />
            <div className={styles.progressBar}>
              <div className={styles.progressFill} />
              <div className={styles.progressPct}>100%</div>
            </div>
            <div className={styles.progressCtaRow}>
              <CustomButton className={styles.progressCta} height="2rem">Idź do checklisty</CustomButton>
            </div>
          </div>
        </div>

        <div className={styles.footer}>Kontakt • Polityka prywatności • www.warsawexpo.eu</div>
      </aside>

      {/* Main area */}
      <main className={styles.main}>
        <div className={styles.mainHeader}>
          <div className={styles.headerInner}>
            <div className={styles.headerAvatarSmall} />
            <div className={styles.headerTitle}>Portal dokumentów</div>
          </div>
        </div>

        <section className={styles.sectionWhite}>
          <div className={styles.sectionHeaderRow}>
            <CustomTypography fontSize="1rem" fontWeight={600}>Faktury</CustomTypography>
          </div>
          <div className={styles.list}>
            {invoices.map((text, idx) => (
              <div key={text + idx}>
                <div className={styles.listRow}>
                  <div className={styles.rowLeft}>
                    <span className={styles.invoiceIcon} />
                    {idx < 2 && <span className={styles.redDot} />}
                    <span className={styles.rowText}>{text}</span>
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.downloadBtn} aria-label="pobierz" />
                  </div>
                </div>
                <div className={styles.rowDivider} />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.sectionGray}>
          <div className={styles.sectionHeaderRow}>
            <CustomTypography fontSize="1rem" fontWeight={600}>Dokumenty do pobrania</CustomTypography>
          </div>
          <div className={styles.list}>
            {downloads.map((text) => (
              <div key={text}>
                <div className={styles.listRow}>
                  <div className={styles.rowLeft}>
                    <span className={styles.pdfIcon} />
                    <span className={styles.rowText}>{text}</span>
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.downloadBtn} aria-label="pobierz" />
                  </div>
                </div>
                <div className={styles.rowDivider} />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.contactBox}>
          <div className={styles.contactTitle}>Czegoś brakuje? Zadaj nam pytanie:</div>
          <div className={styles.contactRow}>
            <div className={styles.contactAvatar} />
            <div className={styles.contactMeta}>
              <div className={styles.contactName}>Magda Masny</div>
              <div className={styles.contactPhone}>+48 518 739 124</div>
              <div className={styles.contactMail}>m.masny@warsawexpo.eu</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DocumentsPage;


