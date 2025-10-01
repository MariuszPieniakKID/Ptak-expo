import React, {useCallback, useEffect, useState} from "react";
import styles from "./TradeInfoPage.module.css";
import IconMain from "../../../assets/group-23.png";
import IconArrowRight from "../../../assets/arrow-right.png";
import CustomTypography from "../../../components/customTypography/CustomTypography";
import {
  formatDateRange,
  formatDateRangeDays,
} from "./utilities";
// import {TradeInfoPlan} from "./TradeInfoPlan";
import { tradeInfoAPI, exhibitionsAPI, tradeEventsAPI, brandingAPI, TradeEventRow } from "../../../services/api";

// Removed mock placeholders – values now come from backend only

type T_TradeInfoPage = {
  tradeInfo: {
    tradeHours: {
      exhibitorStart: string;
      exhibitorEnd: string;
      visitorStart: string;
      visitorEnd: string;
    };
    contactInfo: {guestService: string; security: string};
    buildDays: Array<{
      id: string;
      date: string;
      startTime: string;
      endTime: string;
    }>;
    buildType: string;
    tradeSpaces: Array<{
      id: string;
      name: string;
      hallName: string;
      filePath?: string | null;
      originalFilename?: string | null;
    }>;
    tradeMessage: string;
  } | null;
  eventName?: string;
  eventDateRange?: string;
  daysUntilEvent?: number;
  onDownloadPlan: (spaceId: string, filename: string) => void;
  eventId: string;
};

export const TradeInfoPage: React.FC<T_TradeInfoPage> = ({eventId}) => {
  const [tradeData, setTradeData] = useState<any | null>(null);
  const [eventMeta, setEventMeta] = useState<any | null>(null);
  const [allEvents, setAllEvents] = useState<TradeEventRow[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'byday'>('all');
  const [eventLogoUrl, setEventLogoUrl] = useState<string | null>(null);
  // const exhibStart = tradeInfo?.tradeHours.exhibitorStart || "-";
  // const exhibEnd = tradeInfo?.tradeHours.exhibitorEnd || "-";
  // const visitStart = tradeInfo?.tradeHours.visitorStart || "-";
  // const visitEnd = tradeInfo?.tradeHours.visitorEnd || "-";
  // const guest = tradeInfo?.contactInfo.guestService || "-";
  // const security = tradeInfo?.contactInfo.security || "-";
  // const buildType = tradeInfo?.buildType || '-';

  useEffect(() => {
    (async () => {
      try {
        const exId = Number(eventId);
        const [tiRes, exRes, evRows, brandingRes] = await Promise.all([
          tradeInfoAPI.get(exId),
          exhibitionsAPI.getById(exId),
          tradeEventsAPI.listByExhibition(exId),
          brandingAPI.getGlobal(exId).catch(() => null),
        ]);
        const ti = (tiRes.data && tiRes.data.data) ? tiRes.data.data : null;
        setTradeData(ti);
        const exData = exRes.data || null;
        setEventMeta(exData);
        setAllEvents(evRows);
        // by-day selection disabled
        // Resolve event logo same as left tile: prefer global branding 'event_logo', fallback to exhibition.event_logo_file_name
        try {
          let logoUrl: string | null = null;
          const files: any = brandingRes && brandingRes.data && brandingRes.data.success ? brandingRes.data.files : null;
          if (files && files['event_logo']?.fileName) {
            logoUrl = brandingAPI.serveGlobalUrl(files['event_logo'].fileName);
          } else if (exData && exData.event_logo_file_name) {
            logoUrl = brandingAPI.serveGlobalUrl(exData.event_logo_file_name);
          }
          setEventLogoUrl(logoUrl);
        } catch { setEventLogoUrl(null); }
      } catch (e: any) {
        console.warn('TradeInfo load error', e?.message || e);
      } finally {
        // no-op
      }
    })();
  }, [eventId]);

  // By-day selection disabled

  // by-day view removed

  const mapBuildInformations = (tradeData?.buildDays && tradeData.buildDays.length > 0 ? tradeData.buildDays : []).map(
    (item: any, index: number) => {
      const mapHours = (() => {
        const generatedDate = formatDateRange({
          endDate: item.endTime,
          startDate: item.startTime,
        });
        return (
          <div
            key={`hour_${index}_0`}
            className={styles.marketBuildingsItemHours}
          >
            <div className={styles.marketBuildingsItemHoursFirstHour}>
              <CustomTypography fontSize="14px" fontWeight={700}>
                {generatedDate.date}
              </CustomTypography>
            </div>
            <CustomTypography fontSize="14px" fontWeight={700} color="#6F87F6">
              {generatedDate.hours}
            </CustomTypography>
          </div>
        );
      })();

      return (
        <div key={`information_${index}`}>
          <CustomTypography
            fontSize="13px"
            fontWeight={500}
            color="#666A73"
            className={styles.marketBuildingsItemHeader}
          >
            Dzień budowy
          </CustomTypography>
          {mapHours}
        </div>
      );
    }
  );

  // Map global construction events (Zabudowa targowa - visible for ALL exhibitors)
  // These are events WITHOUT exhibitor_id (global for entire exhibition)
  // AND with event_source === 'construction' (added from Informacje targowe → Zabudowa targowa)
  const globalConstructionEvents = allEvents.filter(ev => {
    const exId = ev.exhibitor_id;
    const evSource = ev.event_source || '';
    
    // Must be global event (no exhibitor_id) AND construction source
    const isGlobal = exId === null || exId === undefined;
    const isConstructionEvent = evSource === 'construction';
    
    return isGlobal && isConstructionEvent;
  });
  
  // Debug log
  console.log('[TradeInfoPage] Global construction events:', {
    allEventsCount: allEvents.length,
    globalConstructionCount: globalConstructionEvents.length,
    allEvents: allEvents.map(ev => ({ id: ev.id, name: ev.name, exhibitor_id: ev.exhibitor_id, type: ev.type })),
    globalConstructionEvents: globalConstructionEvents.map(ev => ({ id: ev.id, name: ev.name, exhibitor_id: ev.exhibitor_id, type: ev.type })),
    eventId,
  });

  const mapGlobalConstructionEvents = globalConstructionEvents.map((event: any, index: number) => {
    const eventDate = event.event_date || '';
    const startTime = event.start_time || '';
    const endTime = event.end_time || '';
    
    return (
      <div key={`construction_${index}`}>
        <CustomTypography
          fontSize="13px"
          fontWeight={500}
          color="#666A73"
          className={styles.marketBuildingsItemHeader}
        >
          {event.name || 'Zabudowa targowa'}
        </CustomTypography>
        <div className={styles.marketBuildingsItemHours}>
          <div className={styles.marketBuildingsItemHoursFirstHour}>
            <CustomTypography fontSize="14px" fontWeight={700}>
              {eventDate}
            </CustomTypography>
          </div>
          <CustomTypography fontSize="14px" fontWeight={700} color="#6F87F6">
            {startTime} - {endTime}
          </CustomTypography>
        </div>
      </div>
    );
  });

  const handleDownloadPlan = useCallback(async (spaceId: string, filename: string) => {
    try {
      const exId = Number(eventId);
      const res = await tradeInfoAPI.downloadPlan(exId, spaceId);
      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'plan-targow.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Download plan failed', e);
    }
  }, [eventId]);

  const mapHall = (() => {
    // Build list with meta (id/name/originalFilename) if available
    const hallsWithMeta: Array<{ id?: string; name: string; originalFilename?: string | null }> =
      tradeData?.tradeSpaces && tradeData.tradeSpaces.length > 0
        ? tradeData.tradeSpaces.map((s: any) => ({ id: String(s.id), name: s.hallName || s.name || '-', originalFilename: s.originalFilename || null }))
        : [];

    const my = tradeData?.exhibitorAssignment;
    return hallsWithMeta.map((item, index: number) => {
      const isMine = my && my.hallName && String(item.name).toLowerCase() === String(my.hallName).toLowerCase();
      const isDownloadable = Boolean(item.id && item.originalFilename);
      const onClick = isDownloadable ? () => handleDownloadPlan(item.id as string, item.originalFilename as string) : undefined;
      return (
        <div
          key={`hall_${index}`}
          className={styles.planCard}
          onClick={onClick}
          style={{
            borderColor: isMine ? "#6F87F6" : "#4d4c4f",
            cursor: isDownloadable ? 'pointer' : undefined,
          }}
          title={isDownloadable ? `Pobierz – ${item.originalFilename}` : undefined}
        >
          <CustomTypography fontSize="10px" fontWeight={700} color="white">
            {item.name}
          </CustomTypography>
          {isMine && my.standNumber && (
            <div className={styles.planCardPosition}>
              <p
                dangerouslySetInnerHTML={{
                  __html: `Twoje stoisko - <b>${my.standNumber}</b>`,
                }}
              />
            </div>
          )}
          {isDownloadable && (
            <div className={styles.planCardPosition}>
              <p>Pobierz – {item.originalFilename}</p>
            </div>
          )}
        </div>
      );
    });
  })();
  
  // By-day UI hidden

  // by-day plans removed

  const mapAllEvents = (() => {
    // Filter to show only events that are in agenda
    const agendaEvents = (allEvents || []).filter(ev => ev.is_in_agenda === true);
    const items = agendaEvents.slice().sort((a, b) => {
      const ad = String(a.event_date);
      const bd = String(b.event_date);
      if (ad !== bd) return ad.localeCompare(bd);
      return String(a.start_time).localeCompare(String(b.start_time));
    });
    if (items.length === 0) return null;
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map(ev => (
          <div key={ev.id} style={{ border: '1px solid #3d3c40', borderRadius: 8, padding: 12 }}>
            <div style={{ color: '#A7A7A7', fontSize: 12 }}>{ev.event_date} • {String(ev.start_time).slice(0,5)}–{String(ev.end_time).slice(0,5)}</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>{ev.name}</div>
            {ev.hall && <div style={{ color: '#D7D9DD', fontSize: 12 }}>{ev.hall}</div>}
            {ev.description && <div style={{ color: '#D7D9DD', fontSize: 12 }}>{ev.description}</div>}
          </div>
        ))}
      </div>
    );
  })();

  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <section className={styles.mainHeader}>
          <div className={styles.headerInner}>
            <img alt="główna ikona" src={IconMain} height={54} width={69} />
            <div className={styles.headerTitle}>Informacje targowe</div>
          </div>
        </section>
        <section className={styles.content}>
          <div className={styles.contentWhite}>
            <div className={styles.eventInformations}>
              <div className={styles.eventInformationsLogo}>
                {eventLogoUrl ? (
                  <img alt="logo" src={eventLogoUrl} style={{ width: 55, height: 55, objectFit: 'contain' }} />
                ) : (
                  <img alt="logo" src={IconMain} height="auto" width={55} />
                )}
              </div>
              <div>
                <CustomTypography
                  fontSize="1rem"
                  fontWeight={600}
                  color="#6F87F6"
                >
                  {eventMeta ? formatDateRangeDays({ startDate: eventMeta.start_date, endDate: eventMeta.end_date }) : ''}
                </CustomTypography>
                <CustomTypography
                  fontSize="14px"
                  fontWeight={700}
                  className={styles.eventInformationsName}
                >
                  {eventMeta?.name || ''}
                </CustomTypography>
              </div>
            </div>
            <div className={styles.eventInformationsHours}>
              <CustomTypography fontSize="14px" fontWeight={700}>
                Godziny otwarcia targów:
              </CustomTypography>
              <div className={styles.eventInformationsHoursItems}>
                <div className={styles.eventInformationsHoursItem}>
                  <CustomTypography
                    fontSize="13px"
                    fontWeight={400}
                    color="#666A73"
                  >
                    Dla wystawców
                  </CustomTypography>
                  <div className={styles.eventInformationsHoursItemDate}>
                    <CustomTypography
                      fontSize="14px"
                      fontWeight={700}
                      color="#6F87F6"
                    >
                      {tradeData?.tradeHours ? `${String(tradeData.tradeHours.exhibitorStart || '').slice(0,5)} - ${String(tradeData.tradeHours.exhibitorEnd || '').slice(0,5)}` : '-'}
                    </CustomTypography>
                  </div>
                </div>
                <div className={styles.eventInformationsHoursItem}>
                  <CustomTypography
                    fontSize="13px"
                    fontWeight={400}
                    color="#666A73"
                  >
                    Dla gości
                  </CustomTypography>
                  <div className={styles.eventInformationsHoursItemDate}>
                    <CustomTypography
                      fontSize="14px"
                      fontWeight={700}
                      color="#6F87F6"
                    >
                      {tradeData?.tradeHours ? `${String(tradeData.tradeHours.visitorStart || '').slice(0,5)} - ${String(tradeData.tradeHours.visitorEnd || '').slice(0,5)}` : '-'}
                    </CustomTypography>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.eventInformationsHours}>
              <CustomTypography fontSize="14px" fontWeight={700}>
                Kontakt podczas targów:
              </CustomTypography>
              <div className={styles.eventInformationsHoursItems}>
                <div className={styles.eventInformationsHoursItem}>
                  <CustomTypography
                    fontSize="13px"
                    fontWeight={400}
                    color="#666A73"
                  >
                    Obsługa Gości
                  </CustomTypography>
                  <div className={styles.eventInformationsHoursItemDate}>
                    <CustomTypography fontSize="12px" fontWeight={700}>
                      {tradeData?.contactInfo?.guestService || '-'}
                    </CustomTypography>
                  </div>
                </div>
                <div className={styles.eventInformationsHoursItem}>
                  <CustomTypography
                    fontSize="13px"
                    fontWeight={400}
                    color="#666A73"
                  >
                    Ochrona
                  </CustomTypography>
                  <div className={styles.eventInformationsHoursItemDate}>
                    <CustomTypography fontSize="12px" fontWeight={700}>
                      {tradeData?.contactInfo?.security || '-'}
                    </CustomTypography>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.contactBox}>
              <div className={styles.contactTitle}>
                Twój dedykowany opiekun:
              </div>
              <div className={styles.contactRow}>
                <div className={styles.contactAvatar} />
                <div className={styles.contactMeta}>
                  <div className={styles.contactName}>
                    {tradeData?.exhibitorAssignment?.supervisor ? `${tradeData.exhibitorAssignment.supervisor.firstName} ${tradeData.exhibitorAssignment.supervisor.lastName}` : '-'}
                  </div>
                  <div className={styles.contactPhone}>
                    {tradeData?.exhibitorAssignment?.supervisor?.phone || '-'}
                  </div>
                  <div className={styles.contactMail}>
                    {tradeData?.exhibitorAssignment?.supervisor?.email || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.contentGray}>
            <div className={styles.contentPosition}>
              <CustomTypography
                fontSize="14px"
                fontWeight={600}
                color="#6F87F6"
              >
                Twoje Stoisko targowe:
              </CustomTypography>
              <CustomTypography
                fontSize="1rem"
                fontWeight={600}
                className={styles.positionInfo}
              >
                {tradeData?.exhibitorAssignment ? `${tradeData.exhibitorAssignment.hallName || ''} / ${tradeData.exhibitorAssignment.standNumber || ''}`.trim() : '-'}
              </CustomTypography>
            </div>
            <div className={styles.marketBuildings}>
              <CustomTypography fontSize="14px" fontWeight={600}>
                Zabudowa targowa:
              </CustomTypography>
              <div className={styles.marketBuildingsContent}>
                {mapBuildInformations}
                {mapGlobalConstructionEvents}
                <div className={styles.marketingBuildingsShowMore}>
                  <CustomTypography fontSize="13px" fontWeight={400}>
                    Zobacz dokumenty
                  </CustomTypography>
                  <a href={`/event/${eventId}/documents`}>
                    <button className={styles.marketingBuildingsShowMoreButton}>
                      <img
                        alt="ikona strzałka w prawo"
                        src={IconArrowRight}
                        height={8}
                        width={10}
                      />
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className={styles.contentDark}>
          <CustomTypography fontSize="1rem" fontWeight={700} color="white">
            Plan Targów:
          </CustomTypography>
          <div className={styles.plansContent}>{mapHall}</div>
          <CustomTypography fontSize="1rem" fontWeight={700} color="white">
            Wydarzenia towarzyszące
          </CustomTypography>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => setActiveTab('all')} style={{ padding: '6px 10px', borderRadius: 6, border: 0, background: activeTab==='all' ? '#6f87f6' : '#2f2f35', color: '#fff' }}>Wszystkie</button>
            {/* Hidden by request: 'Po dniach' button */}
            {/* <button onClick={() => setActiveTab('byday')} style={{ padding: '6px 10px', borderRadius: 6, border: 0, background: activeTab==='byday' ? '#6f87f6' : '#2f2f35', color: '#fff' }}>Po dniach</button> */}
          </div>
          {activeTab === 'all' ? (
            mapAllEvents
          ) : (
            <></>
          )}
          <div className={styles.dayPlanEvent}>
            <CustomTypography fontSize="13px" fontWeight={500} color="#D7D9DD">
              Wydarzenia towarzyszące
            </CustomTypography>
          </div>
        </section>
      </main>
    </div>
  );
};
