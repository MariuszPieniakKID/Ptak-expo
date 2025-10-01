import styles from "./ChecklistPage.module.scss";
import ProductsInfo from "../components/checklist/ProductsInfoCard";
import CompanyInfo from "../components/checklist/CompanyInfo";
import {useChecklist} from "../contexts/ChecklistContext";
import {ApplyGreenCheck} from "../components/checklist/ApplyGreenCheck";
import EventSchedule from "../components/checklist/EventSchedule";
import MaterialsCard from "../components/checklist/MaterialsCard";
import ElectronicIdsCard from "../components/checklist/ElectronicIdsCard";
import InvitesCard from "../components/checklist/InvitesCard";
import IconCalendar from "../assets/calendar-check.png";
import IconMedal from "../assets/medal.png";

const ChecklistPage: React.FC = () => {
  var {filled, checklist} = useChecklist();
  const daysRemaining = (() => {
    try {
      const now = new Date();
      const dates = Array.isArray(checklist?.events)
        ? checklist.events
            .map((e: any) => new Date(`${e.date}T${(e.startTime || '00:00')}`))
            .filter((d: Date) => !isNaN(d.getTime()))
        : [];
      if (dates.length === 0) return null;
      const future = dates.filter((d) => d >= now);
      const target = (future.length ? future : dates).sort((a, b) => a.getTime() - b.getTime())[0];
      const ms = target.getTime() - now.getTime();
      const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
      return days < 0 ? 0 : days;
    } catch {
      return null;
    }
  })();
  return (
    <div className={styles.pageRoot}>
      {/* Right main content area */}
      <main className={styles.mainArea}>
        <div className={styles.content810}>
          <div className={styles.header}>
            <img
              src={IconCalendar}
              alt="ikona dokumentów"
              width="auto"
              height={51}
            />
            <p className={styles.title}>Checklista targowa</p>
            {/* Hidden next task and CTA per request */}
          </div>
          {/* Header area intentionally hidden: removed next task title, CTA, and preview link */}
          {/* Top container with progress and steps (web checklista 4b) */}
          <div className={styles.topContainer}>
            <div className={styles.topContent}>
              {daysRemaining != null && (
                <div className={styles.topCountdown}>
                  Do wydarzenia zostało <b>{daysRemaining}</b> dni
                </div>
              )}
              {/* Hidden preview link per request */}
            </div>
            <div className={styles.topHeading}>
              {filled.every((f) => f) && "Gratulacje, mamy wszystko!🎉"}Wasza
              gotowość do targów:{" "}
            </div>
            <div className={styles.topSub}>Sprawdź kroki:</div>
            <div className={styles.stepsRow}>
              <div className={styles.topSeparator} />
              {[
                "Uzupełnij\nKatalog",
                "Dodaj\nprodukty",
                "Wgraj\nmateriały",
                "Wyslij \nZaproszenia",
                "Zaplanuj\nTargi",
                "Pobierz\nE-Identyfikatory",
              ].map((label, i) => (
                <div key={label} className={styles.step}>
                  <ApplyGreenCheck checked={filled[i]}>
                    <img
                      src={`/assets/checklist-step-${i + 1}.svg`}
                      alt=""
                      height={40}
                      width={40}
                    />
                  </ApplyGreenCheck>
                  <div className={styles.stepLabel}>{label}</div>
                  {/* Removed static green check; dynamic ApplyGreenCheck remains */}
                </div>
              ))}
            </div>
            <div className={styles.bottomContent}>
              <img
                src={IconMedal}
                alt="ikona medalu"
                width="auto"
                height={17}
              />
              <div className={styles.bottomHeading}>
                Zgłoś swój produkt / usługę / projekt do nagrody targowej!
              </div>
            </div>
          </div>
          <div className={styles.stylesToCompletedWrapper}>
            <div className={styles.stylesToCompletedText}>Do uzupełnienia:</div>
            <div className={styles.stylesToCompletedLine}></div>
          </div>
          <div className={styles.sectionsColumn}>
            <CompanyInfo />
            <ProductsInfo />
            <MaterialsCard />
            <InvitesCard />
            <EventSchedule />
            <ElectronicIdsCard />
          </div>

          {/* Hidden optional awards section per request */}
        </div>
      </main>
    </div>
  );
};

export default ChecklistPage;
