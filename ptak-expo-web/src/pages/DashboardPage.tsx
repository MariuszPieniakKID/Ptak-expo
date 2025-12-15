import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { exhibitionsAPI, brandingAPI } from "../services/api";
import { getChecklist } from "../services/checkListApi";
import styles from "./DashboardPage.module.css";
// import groupLogo from "../assets/group-257@3x.png";
import Menu from "../components/Menu";

interface Event {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tileLogoByEventId, setTileLogoByEventId] = useState<
    Record<number, string | null>
  >({});
  const [readinessByEventId, setReadinessByEventId] = useState<
    Record<number, number>
  >({});

  // Load exhibitor events on component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await exhibitionsAPI.getMyEvents();

        if (response.data.success && response.data.data) {
          setEvents(response.data.data);
          console.log("✅ Loaded events:", response.data.data);
        } else {
          setError("Nie udało się pobrać wydarzeń");
        }
      } catch (err) {
        console.error("❌ Error loading events:", err);
        setError("Błąd podczas pobierania wydarzeń");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadEvents();
    }
  }, [user]);

  // Resolve tile logos for dashboard (prefer logo_kolowe_tlo_kafel, fallback event_logo)
  useEffect(() => {
    const loadTileLogos = async () => {
      if (!events || events.length === 0) return;
      try {
        const entries = await Promise.all(
          events.map(async (ev) => {
            try {
              const res = await brandingAPI.getGlobal(ev.id);
              const files: any = res.data?.files || {};
              const fileObj =
                files["logo_kolowe_tlo_kafel"] || files["event_logo"] || null;
              const file =
                fileObj && (Array.isArray(fileObj) ? fileObj[0] : fileObj);
              const fileName = file?.fileName || null;
              return [ev.id, fileName] as [number, string | null];
            } catch {
              return [ev.id, null] as [number, string | null];
            }
          })
        );
        const m: Record<number, string | null> = {};
        for (const [k, v] of entries) m[k] = v;
        setTileLogoByEventId(m);
      } catch {
        // ignore
      }
    };
    loadTileLogos();
  }, [events]);

  // Load readiness for all events
  useEffect(() => {
    const loadReadiness = async () => {
      if (!events || events.length === 0) return;
      try {
        const entries = await Promise.all(
          events.map(async (ev) => {
            try {
              const checklist = await getChecklist(ev.id);
              
              // Calculate filled steps (same logic as useEventReadiness)
              const catalogContactPerson = (checklist.companyInfo as any).catalogContactPerson;
              const catalogContactPhone = (checklist.companyInfo as any).catalogContactPhone;
              const catalogContactEmail = (checklist.companyInfo as any).catalogContactEmail;
              let catalogContactFilled = 0;
              if (catalogContactPerson && catalogContactPhone && catalogContactEmail) {
                catalogContactFilled = 1;
              }
              
              const companyInfoFilledCount = catalogContactFilled +
                (checklist.companyInfo.description != null ? 1 : 0) +
                (checklist.companyInfo.logo != null ? 1 : 0) +
                (checklist.companyInfo.name != null ? 1 : 0) +
                (checklist.companyInfo.socials != null ? 1 : 0) +
                (checklist.companyInfo.website != null ? 1 : 0);

              const filled = [
                companyInfoFilledCount === 6,
                checklist.products.length > 0,
                checklist.downloadMaterials.length > 0,
                checklist.sentInvitesCount > 0,
                checklist.events.length > 0,
                checklist.electrionicIds.length > 0
              ];

              const percent = Math.round((filled.filter(Boolean).length / filled.length) * 100);
              return [ev.id, percent] as [number, number];
            } catch {
              return [ev.id, 0] as [number, number];
            }
          })
        );
        const m: Record<number, number> = {};
        for (const [k, v] of entries) m[k] = v;
        setReadinessByEventId(m);
      } catch {
        // ignore
      }
    };
    loadReadiness();
  }, [events]);

  const handleEventSelect = (eventId: number) => {
    // Navigate to the event home view for this event
    navigate(`/event/${eventId}/home`);
  };

  // Format date for display
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    return `${formatDate(start)}-${formatDate(end)}`;
  };

  // Get completion percentage from loaded readiness
  const getCompletionPercentage = (event: Event) => {
    return readinessByEventId[event.id] || 0;
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardBackground}>
        <img className={styles.image35Icon} alt="" src="/image-35@2x.png" />
        <div className={styles.dashboardChild} />
        <div className={styles.dashboardItem} />
      </div>
      {/* <div className={styles.header}>
        <div className={styles.headerPadding} />
        <div className={styles.headerContainer}>
          <img className={styles.dashboardInner} alt="" src={groupLogo} />
          <button className={styles.logoutButtonMobile} onClick={handleLogout}>
            <div className={styles.logoutLogo} />
          </button>
        </div>
        <div className={styles.headerPadding}>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <div className={styles.logoutLogo} />
            <span>Wyloguj</span>
          </button>
        </div>
      </div> */}
      <Menu isMainPage />
      <div className={styles.dashboardContainer}>
        {/* User greeting */}
        <div className={styles.dzieDobryUserParent}>
          <img
            className={styles.bb764a0137abc7a8142b6438e52913Icon}
            alt=""
            src="/7bb764a0137abc7a8142b6438e529133@2x.png"
          />
          <div className={styles.greetingTextContainer}>
            <div className={styles.dzieDobryUser}>
              Dzień dobry, {user?.firstName || "Użytkowniku"}
            </div>
            <div className={styles.sprawdCoMoesz}>
              Sprawdź co możesz dzisiaj zrobić!
            </div>
          </div>
          <img className={styles.groupChild} alt="" src="/group-27@2x.png" />
        </div>
        {/* <div className={styles.twojeZaplanowaneWydarzenia}>
          Twoje zaplanowane wydarzenia:
        </div> */}

        {/* Hidden per request: calendar teaser */}
        {/* <div className={styles.path10Parent} onClick={handleCalendarClick}>
        <img className={styles.path10Icon} alt="" src="/path-10.svg" />
        <div className={styles.zobaczKalendariumPtak}>
          Zobacz kalendarium Ptak Warsaw Expo
        </div>
      </div> */}
        <div className={styles.eventsContainer}>
          {/* Loading state */}
          {loading && (
            <div
              style={{
                position: "absolute",
                top: "350px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "18px",
                color: "#666",
              }}
            >
              Ładowanie wydarzeń...
            </div>
          )}

          {/* Error state */}
          {error && (
            <div
              style={{
                position: "absolute",
                top: "350px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "18px",
                color: "#dc3545",
              }}
            >
              {error}
            </div>
          )}

          {/* Dynamic event boxes */}
          {!loading &&
            !error &&
            events.map((event) => {
              const tileName = tileLogoByEventId[event.id] || null;
              const logoSrc = tileName
                ? brandingAPI.serveGlobalUrl(tileName)
                : (event as any).event_logo_file_name
                ? brandingAPI.serveGlobalUrl(
                    (event as any).event_logo_file_name
                  )
                : "/image-29@2x.png";
              const completion = getCompletionPercentage(event);

              return (
                <>
                  <div key={event.id} className={styles.eventElement}>
                    <div className={styles.eventTop}>
                      <img
                        className={styles.image29Icon}
                        alt={event.name}
                        src={logoSrc}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/image-29@2x.png";
                        }}
                      />
                      <div className={styles.internationalTradeFairForBParent}>
                        <div className={styles.div}>
                          {formatDateRange(event.startDate, event.endDate)}
                        </div>
                        <div className={styles.internationalTradeFair}>
                          {event.name}
                        </div>
                      </div>
                    </div>
                    <div className={styles.eventBottom}>
                      <div className={styles.eventReadinessContainer}>
                        <div className={styles.eventReadinessText}>
                          Gotowość:
                        </div>
                        <div className={styles.eventReadinessBar}>
                          <span className={styles.b}>{completion}%</span>
                        </div>
                      </div>
                      <div
                        className={styles.wybierz}
                        onClick={() => handleEventSelect(event.id)}
                      >
                        wybierz
                      </div>
                    </div>
                  </div>
                </>
              );
            })}

          {/* No events message */}
          {!loading && !error && events.length === 0 && (
            <div
              style={{
                position: "absolute",
                top: "350px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "18px",
                color: "#666",
                textAlign: "center",
              }}
            >
              Brak przypisanych wydarzeń
            </div>
          )}
        </div>
      </div>

      <div className={styles.kontakt}>
        Kontakt • Polityka prywatności • www.warsawexpo.eu
      </div>
    </div>
  );
};

export default DashboardPage;
