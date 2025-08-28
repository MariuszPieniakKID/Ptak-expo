import styles from './ChecklistPage.module.scss';
import CustomButton from '../components/customButton/CustomButton';
import CustomTypography from '../components/customTypography/CustomTypography';
import CustomLink from '../components/customLink/CustomLink';
import ChecklistCard from '../components/checklist/checklistCard';
import { Typography } from '@mui/material';
import ProductsInfo from '../components/checklist/ProductsInfo';
import CompanyInfo from '../components/checklist/CompanyInfo';
import { useChecklist } from '../contexts/ChecklistContext';
import { ApplyGreenCheck } from '../components/checklist/ApplyGreenCheck';
import EventSchedule from '../components/checklist/EventSchedule';

const ChecklistPage: React.FC = () => {
  var {filled} = useChecklist();
  return (
    <div className={styles.pageRoot}>
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
            <div className={styles.topHeading}>{filled.every(f => f) && "Gratulacje, mamy wszystko!🎉"}Wasza gotowość do targów: </div>
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
              ].map((label, i) => (
                <div key={label} className={styles.step}>
                  <ApplyGreenCheck checked={filled[i]}><img src={`/assets/checklist-step-${i + 1}.svg`} alt=""></img></ApplyGreenCheck>
                  <div className={styles.stepLabel}>{label}</div>
                </div>
              ))}
            </div>
            <div className={styles.topHeading}>Zgłoś swój produkt / usługę / projekt do nagrody targowej!</div>
          </div>

          {/* Detailed sections */}
          <CompanyInfo />

          <ProductsInfo />

          <ChecklistCard icon={
              <img src={`/assets/checklist-step-3.svg`} alt=""></img>} 
              title={<Typography fontSize={16}>Materiały do pobrania (3)</Typography>} checked={filled[2]}> 
                  
            <div className={styles.sectionList}>
              {['Nazwa Firmy','Logotyp','Opis','Dane kontaktowe','Strona www.','Social Media'].map((it) => (
                <div key={it} className={styles.sectionRow}><span>{it}</span><div className={styles.sectionGoodDot} /></div>
              ))}
            </div>
            <div className={styles.sectionLink}>Podejrzyj wygląd wpisu do katalogu</div>
          </ChecklistCard>

          <div className={styles.sectionCardDark}>
            <div className={styles.sectionHeaderLeft}>
              <div className={styles.sectionCircleDark} />
              <div className={styles.sectionTitleDark}>Wysłane zaproszenia (50/50)</div>
            </div>
            <div className={styles.sectionStatusGoodSmallDark} />
          </div>
          <EventSchedule />

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


