import React from 'react';
import styles from './ChecklistPage.module.scss';
import CustomButton from '../components/customButton/CustomButton';
import CustomTypography from '../components/customTypography/CustomTypography';
import CustomLink from '../components/customLink/CustomLink';

const ChecklistPage: React.FC = () => {
  return (
    <div className={styles.pageRoot}>
      {/* Left fixed sidebar (as in Figma) */}
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
            <CustomButton className={styles.sidebarCta} height="2rem">
              Idź do checklisty
            </CustomButton>
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
        <div className={styles.content810}>
          {/* Header area (white) */}
          <div className={styles.headerArea}>
            <div className={styles.nextTaskBlock}>
              <CustomTypography className={styles.nextTaskTitle} fontSize="1rem" fontWeight={600}>
                Twoje kolejne zadanie:
              </CustomTypography>
              <CustomTypography className={styles.nextTaskSubtitle} fontSize="0.8125rem" fontWeight={400}>
                Wyślij katalog kampanii do akceptacji
              </CustomTypography>
              <div className={styles.headerActionRow}>
                <CustomButton className={styles.primaryCta} width="226px" height="42px">
                  Prześlij katalog
                </CustomButton>
              </div>
              <CustomLink className={styles.previewLink} underline>
                Podejrzyj wpis
              </CustomLink>
            </div>
          </div>

          {/* Top container with progress and steps (web checklista 4b) */}
          <div className={styles.topContainer}>
            <div className={styles.topCountdown}>Do wydarzenia zostalo 386 dni</div>
            <div className={styles.topHeading}>Gratulacje, mamy wszystko!       Wasza gotowość do targów: </div>
            <div className={styles.topSub}>Sprawdź kroki:</div>
            <div className={styles.topSeparator} />
            <div className={styles.stepsRow}>
              {[
                'Uzupełnij\nKatalog',
                'Dodaj\nprodukty',
                'Wyslij \nZaproszenia',
                'Pobierz\nE-Identyfikatory',
                'Wgraj\nmateriały',
                'Zaplanuj\nTargi',
              ].map((label) => (
                <div key={label} className={styles.step}>
                  <div className={styles.stepCircle} />
                  <div className={styles.stepLabel}>{label}</div>
                </div>
              ))}
            </div>
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
        </div>
      </main>
    </div>
  );
};

export default ChecklistPage;


