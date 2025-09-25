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
import IconCrooked from "../assets/crooked.png";
import IconMedal from "../assets/medal.png";
import IconEye from "../assets/eye.png";
import IconCheckGreen from "../assets/check-green.png";

const ChecklistPage: React.FC = () => {
  var {filled} = useChecklist();
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
            <div className={styles.nextStep}>
              <div className={styles.nextStepItem}>
                <p className={styles.nextStepTitle}>Twoje kolejne zadanie:</p>
                <p className={styles.nextStepDescription}>
                  Wyślij katalog kampanii do akceptacji
                </p>
              </div>
              <div className={styles.nextStepItem}>
                <button className={styles.nextStepButton}>
                  Prześlij katalog
                  <img
                    src={IconCrooked}
                    alt="ikona dokumentów"
                    width="auto"
                    height={17}
                  />
                </button>
              </div>
            </div>
          </div>
          {/* Header area intentionally hidden: removed next task title, CTA, and preview link */}
          {/* Top container with progress and steps (web checklista 4b) */}
          <div className={styles.topContainer}>
            <div className={styles.topContent}>
              <div
                className={styles.topCountdown}
                dangerouslySetInnerHTML={{
                  __html: `Do wydarzenia zostalo <b>386 dni</b>`,
                }}
              />
              <div className={styles.previewContent}>
                <img
                  src={IconEye}
                  alt="ikona medalu"
                  width="auto"
                  height={10}
                />
                <div className={styles.previewText}>Podejrzyj wpis</div>
              </div>
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
                  <div className={styles.stepIcon}>
                    <img
                      className={styles.stepIconImg}
                      src={IconCheckGreen}
                      alt="ikona"
                      width="auto"
                      height={13}
                    />
                  </div>
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

          <div
            className={styles.stylesToCompletedWrapper}
            style={{
              paddingTop: "24px",
            }}
          >
            <div className={styles.stylesToCompletedText}>Opcjonalnie:</div>
            <div className={styles.stylesToCompletedLine}></div>
          </div>
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
