import React from 'react';
import styles from './DocumentsPage.module.scss';
import CustomTypography from '../components/customTypography/CustomTypography';

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
      {/* Main area only (left column is now provided by EventLayout) */}
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


