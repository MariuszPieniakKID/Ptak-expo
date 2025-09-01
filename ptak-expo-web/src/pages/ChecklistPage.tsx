import styles from './ChecklistPage.module.scss';
import ProductsInfo from '../components/checklist/ProductsInfoCard';
import CompanyInfo from '../components/checklist/CompanyInfo';
import { useChecklist } from '../contexts/ChecklistContext';
import { ApplyGreenCheck } from '../components/checklist/ApplyGreenCheck';
import EventSchedule from '../components/checklist/EventSchedule';
import MaterialsCard from '../components/checklist/MaterialsCard';
import ElectronicIdsCard from '../components/checklist/ElectronicIdsCard';
import InvitesCard from '../components/checklist/InvitesCard';

const ChecklistPage: React.FC = () => {
  var {filled} = useChecklist();
  return (
    <div className={styles.pageRoot}>
      {/* Right main content area */}
      <main className={styles.mainArea}>
        <div className={styles.content810}>
          {/* Header area intentionally hidden: removed next task title, CTA, and preview link */}

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
                'Wgraj\nmateriały',
                'Wyslij \nZaproszenia',
                'Zaplanuj\nTargi',
                'Pobierz\nE-Identyfikatory',
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
          <InvitesCard />
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


