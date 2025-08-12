import React from 'react';
import styles from './ChecklistPage.module.css';

const ChecklistPage: React.FC = () => {
  return (
    <div className={styles.pageRoot}>
      {/* Left fixed sidebar (from Figma) */}
      <aside className={styles.leftSidebar}>
        {/* Navigation card */}
        <div className={styles.navCard}>
          <div className={styles.navTop}>
            <div className={styles.logoBox}>Logo</div>
            <div className={styles.navTitle}>Checklista targowa</div>
          </div>
          <div className={styles.navItems}>
            <div className={styles.navItem}><div className={styles.navIcon} />Home</div>
            <div className={`${styles.navItem} ${styles.navItemActive}`}><div className={styles.navIcon} />Checklista targowa</div>
            <div className={styles.navItem}><div className={styles.navIcon} />E-Identyfikator</div>
          </div>
        </div>

        {/* Event card */}
        <div className={styles.eventCard}>
          <div className={styles.eventLabel}>Twoje wydarzenie:</div>
          <div className={styles.eventRow}>
            <div className={styles.eventThumb}>EVENT</div>
            <div className={styles.eventMeta}>
              <div className={styles.eventDate}>11.03.2026-15.03.2026</div>
              <div className={styles.eventName}>Warsaw Industry Week Targi Innowacyjnych Rozwiązań dla Przemysłu</div>
            </div>
          </div>
          <div className={styles.eventChange}>zmień</div>
        </div>

        {/* Progress card in sidebar */}
        <div className={styles.sidebarProgressCard}>
          <div className={styles.sidebarProgressHeader}>
            <div className={styles.sidebarCheckIcon} />
            <div>
              <div className={styles.sidebarProgressTitle}>Gratulacje, mamy wszystko!</div>
              <div className={styles.sidebarProgressSubtitle}>Wasza gotowość do targów:</div>
            </div>
          </div>
          <div className={styles.sidebarHelp}>Uzupełnij wszystkie kroki z checklisty by być jak najlepiej przygotowanym na to wydarzenie.</div>
          <div className={styles.sidebarGradient}>
            <div className={styles.sidebarPct}>100%</div>
          </div>
          <div className={styles.sidebarCtaRow}>
            <button className={styles.sidebarCta}>Idź do checklisty</button>
          </div>
          <div className={styles.sidebarCountdown}>Do wydarzenia zostało 386 dni</div>
        </div>

        {/* Greeting */}
        <div className={styles.greetingRow}>
          <div className={styles.greetingAvatar} />
          <div>
            <div className={styles.greetingTitle}>Dzień dobry, MTB Modules</div>
            <div className={styles.greetingSub}>Sprawdź co możesz dzisiaj zrobić!</div>
          </div>
        </div>

        {/* Footer and logout */}
        <div className={styles.sidebarFooter}>Kontakt • Polityka prywatności • www.warsawexpo.eu</div>
        <button className={styles.sidebarLogout}>
          <div className={styles.logoutIcon} />
          <div className={styles.logoutText}>Wyloguj</div>
        </button>
      </aside>

      {/* Right main content area */}
      <main className={styles.mainArea}>
        {/* Header area (white) */}
        <div className={styles.headerArea}>
        <div className={styles.headerIcon} />
        <div className={styles.nextTaskBlock}>
          <div className={styles.nextTaskTitle}>Twoje kolejne zadanie:</div>
          <div className={styles.nextTaskSubtitle}>Wyślij katalog kampanii do akceptacji</div>
          <button className={styles.primaryCta}>
            <span>Prześlij katalog</span>
          </button>
          <div className={styles.previewLink}>Podejrzyj wpis</div>
        </div>
        </div>

      {/* Checklist overview card */}
      <div className={styles.overviewCard}>
        <div className={styles.overviewTitle}>Gratulacje, mamy wszystko!</div>
        <div className={styles.overviewSubtitle}>Wasza gotowość do targów:</div>
        <div className={styles.overviewHelp}>Uzupełnij wszystkie kroki z checklisty by być jak najlepiej przygotowanym na to wydarzenie.</div>
        <div className={styles.progressBarWrap}>
          <div className={styles.progressBarGradient} />
          <div className={styles.progressPctBadge}>100%</div>
        </div>
        <div className={styles.overviewFooter}>Do wydarzenia zostało 386 dni</div>
      </div>

      {/* Grid of checklist items */}
      <div className={styles.checklistGrid}>
        {['Uzupełnij\nKatalog','Dodaj\nprodukty','Wyślij\nZaproszenia','Pobierz\nE-Identyfikatory','Wgraj\nmaterialy','Zaplanuj\nTargi'].map((label) => (
          <div key={label} className={styles.checkItem}>
            <div className={styles.checkIconWrap}><div className={styles.checkIcon} /></div>
            <div className={styles.checkLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* Detailed sections */}
      <div className={styles.sectionCardGray}>
        <div className={styles.sectionHeaderLeft}>
          <div className={styles.sectionCircle} />
          <div className={styles.sectionTitle}>Wpis do katalogu targowego (1/6)</div>
        </div>
        <div className={styles.sectionStatusGood} />
        <div className={styles.sectionList}>
          {['Nazwa Firmy','Logotyp','Opis','Dane kontaktowe','Strona www.','Social Media'].map((it) => (
            <div key={it} className={styles.sectionRow}><span>{it}</span><div className={styles.sectionGoodDot} /></div>
          ))}
        </div>
        <div className={styles.sectionLink}>Podejrzyj wygląd wpisu do katalogu</div>
      </div>

      <div className={styles.sectionCardWhite}>
        <div className={styles.sectionHeaderLeft}>
          <div className={styles.sectionCircleLight} />
          <div className={styles.sectionTitle}>Prezentowane produkty (1)</div>
        </div>
        <div className={styles.sectionStatusGoodSmall} />
      </div>

      <div className={styles.sectionCardGray}>
        <div className={styles.sectionHeaderLeft}>
          <div className={styles.sectionCircle} />
          <div className={styles.sectionTitle}>Materiały do pobrania (3)</div>
        </div>
        <div className={styles.sectionStatusGoodSmall} />
      </div>

      <div className={styles.sectionCardDark}>
        <div className={styles.sectionHeaderLeft}>
          <div className={styles.sectionCircleDark} />
          <div className={styles.sectionTitleDark}>Wysłane zaproszenia (50/50)</div>
        </div>
        <div className={styles.sectionStatusGoodSmallDark} />
      </div>

      <div className={styles.sectionCardWhite}>
        <div className={styles.sectionHeaderLeft}>
          <div className={styles.sectionCircleLight} />
          <div className={styles.sectionTitle}>Plan wydarzeń na stoisku (4)</div>
        </div>
        <div className={styles.sectionStatusGoodSmall} />
      </div>

      <div className={styles.sectionCardWhite}>
        <div className={styles.sectionHeaderLeft}>
          <div className={styles.sectionCircleLight} />
          <div className={styles.sectionTitle}>Generuj E-Identyfikatory</div>
        </div>
        <div className={styles.sectionStatusGoodSmall} />
      </div>

      <div className={styles.optionalLabel}>Opcjonalnie:</div>

      <div className={styles.sectionCardWhite}>
        <div className={styles.sectionHeaderLeft}>
          <div className={styles.sectionCircleOrange} />
          <div className={styles.sectionTitle}>Nagrody targowe</div>
        </div>
      </div>
      </main>
    </div>
  );
};

export default ChecklistPage;


