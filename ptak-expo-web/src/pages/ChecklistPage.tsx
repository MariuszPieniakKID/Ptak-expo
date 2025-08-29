import styles from './ChecklistPage.module.scss';
import CustomButton from '../components/customButton/CustomButton';
import CustomTypography from '../components/customTypography/CustomTypography';
import CustomLink from '../components/customLink/CustomLink';
import ProductsInfo from '../components/checklist/ProductsInfoCard';
import CompanyInfo from '../components/checklist/CompanyInfo';
import { useChecklist } from '../contexts/ChecklistContext';
import { ApplyGreenCheck } from '../components/checklist/ApplyGreenCheck';
import EventSchedule from '../components/checklist/EventSchedule';
import MaterialsCard from '../components/checklist/MaterialsCard';
import ElectronicIdsCard from '../components/checklist/ElectronicIdsCard';

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

          <MaterialsCard />


          <div className={styles.sectionCardDark}>
            <div className={styles.sectionHeaderLeft}>
              <div className={styles.sectionCircleDark} />
              <div className={styles.sectionTitleDark}>Wysłane zaproszenia (50/50)</div>
            </div>
            <div className={styles.sectionStatusGoodSmallDark} />
          </div>
          <EventSchedule />

          <ElectronicIdsCard />

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


