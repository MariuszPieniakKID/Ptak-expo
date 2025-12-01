import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { exhibitionsAPI, brandingAPI } from "../services/api";
import styles from "./DashboardPage.module.css";
import groupLogo from "../assets/group-257@3x.png";

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
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tileLogoByEventId, setTileLogoByEventId] = useState<
    Record<number, string | null>
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

  const handleLogout = () => {
    logout();
  };

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

  // Get completion percentage (mock for now)
  const getCompletionPercentage = (event: Event) => {
    // Mock completion based on event id for demo
    const completions = [65, 45, 21];
    return completions[event.id % 3] || 50;
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardBackground}>
        <img className={styles.image35Icon} alt="" src="/image-35@2x.png" />
        <div className={styles.dashboardChild} />
        <div className={styles.dashboardItem} />
      </div>
      <div className={styles.header}>
        <div className={styles.headerPadding} />
        <div className={styles.headerContainer}>
          <img className={styles.dashboardInner} alt="" src={groupLogo} />
        </div>
        <div className={styles.headerPadding}>
          {/* Logout button */}
          <button className={styles.logoutButton} onClick={handleLogout}>
            <span>Wyloguj</span>
          </button>
        </div>
      </div>
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
                        <div className={styles.internationalTradeFair}>
                          {event.name}
                        </div>
                        <div className={styles.div}>
                          {formatDateRange(event.startDate, event.endDate)}
                        </div>
                      </div>
                    </div>
                    <div className={styles.eventBottom}>
                      <div className={styles.eventReadinessBar}>
                        <b className={styles.b}>{completion}%</b>
                      </div>
                      <div className={styles.eventReadinessText}>Gotowość:</div>
                      <div
                        className={styles.wybierz}
                        onClick={() => handleEventSelect(event.id)}
                      >
                        wybierz
                      </div>
                    </div>
                  </div>
                  <div key={event.id} className={styles.eventElement}>
                    <img
                      className={styles.image29Icon}
                      alt={event.name}
                      src={logoSrc}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/image-29@2x.png";
                      }}
                    />
                    <div className={styles.internationalTradeFairForBParent}>
                      <div className={styles.internationalTradeFair}>
                        {event.name}
                      </div>
                      <div className={styles.div}>
                        {formatDateRange(event.startDate, event.endDate)}
                      </div>
                    </div>
                    <div className={styles.eventBottom}>
                      <div className={styles.eventReadinessBar}>
                        <b className={styles.b}>{completion}%</b>
                      </div>
                      <div className={styles.eventReadinessText}>Gotowość:</div>
                      <div
                        className={styles.wybierz}
                        onClick={() => handleEventSelect(event.id)}
                      >
                        wybierz
                      </div>
                    </div>
                  </div>
                  <div key={event.id} className={styles.eventElement}>
                    <img
                      className={styles.image29Icon}
                      alt={event.name}
                      src={logoSrc}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/image-29@2x.png";
                      }}
                    />
                    <div className={styles.internationalTradeFairForBParent}>
                      <div className={styles.internationalTradeFair}>
                        {event.name}
                      </div>
                      <div className={styles.div}>
                        {formatDateRange(event.startDate, event.endDate)}
                      </div>
                    </div>
                    <div className={styles.eventBottom}>
                      <div className={styles.eventReadinessBar}>
                        <b className={styles.b}>{completion}%</b>
                      </div>
                      <div className={styles.eventReadinessText}>Gotowość:</div>
                      <div
                        className={styles.wybierz}
                        onClick={() => handleEventSelect(event.id)}
                      >
                        wybierz
                      </div>
                    </div>
                  </div>
                  <div key={event.id} className={styles.eventElement}>
                    <img
                      className={styles.image29Icon}
                      alt={event.name}
                      src={logoSrc}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/image-29@2x.png";
                      }}
                    />
                    <div className={styles.internationalTradeFairForBParent}>
                      <div className={styles.internationalTradeFair}>
                        {event.name}
                      </div>
                      <div className={styles.div}>
                        {formatDateRange(event.startDate, event.endDate)}
                      </div>
                    </div>
                    <div className={styles.eventBottom}>
                      <div className={styles.eventReadinessBar}>
                        <b className={styles.b}>{completion}%</b>
                      </div>
                      <div className={styles.eventReadinessText}>Gotowość:</div>
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

      {/* <div className={styles.kontakt}>
        Kontakt • Polityka prywatności • www.warsawexpo.eu
      </div> */}
    </div>
  );
};

export default DashboardPage;
