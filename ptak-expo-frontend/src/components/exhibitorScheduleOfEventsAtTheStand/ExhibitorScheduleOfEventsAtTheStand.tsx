import React, { useEffect, useState } from "react";
import { Box, Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
//import { ReactComponent as UploadingIcon } from "../../assets/uploadingIcon.svg";
import { ReactComponent as ScheduleOfEvents } from "../../assets/ScheduleOfEvents2.svg";
import styles from "./ExhibitorScheduleOfEventsAtTheStand.module.scss";
import { Exhibitor } from "../../services/api";
import AddingEvents from "./addingEvents/AddingEvents";
import AddedEvents from "./addedEvents/AddedEvents";
import { useAuth } from '../../contexts/AuthContext';
import { getTradeEvents, TradeEvent, getBrandingFiles } from '../../services/api';
import config from '../../config/config';

type ExhibitorScheduleOfEventsAtTheStandProps = {
  allowMultiple?: boolean;
  exhibitorId: number;
  exhibitor?: Exhibitor;
  exhibitionId?: number; // currently selected exhibition (event) id
};

function ExhibitorScheduleOfEventsAtTheStand({
  allowMultiple = true,
  exhibitorId,
  exhibitor,
  exhibitionId,
}: ExhibitorScheduleOfEventsAtTheStandProps) {

  const { token } = useAuth();
  const [tradeEvents, setTradeEvents] = useState<TradeEvent[]>([]);
  const currentExhibitionId = exhibitionId !== undefined
    ? exhibitionId
    : (exhibitor?.events && exhibitor.events.length > 0) ? exhibitor.events[0].id : undefined;

  useEffect(() => {
    const load = async () => {
      if (!token || !currentExhibitionId) return;
      try {
        const res = await getTradeEvents(currentExhibitionId, token, exhibitorId);
        // Try to resolve exhibitor catalog logo from branding files for this exhibition
        // Priority: logotyp (checklist) > logo_kolowe_tlo_kafel (tile) > biale_logo_identyfikator (ID)
        let organizerLogoUrl: string | undefined = undefined;
        try {
          if (exhibitorId && currentExhibitionId) {
            const branding = await getBrandingFiles(exhibitorId, currentExhibitionId, token);
            const files = (branding as any).files || {};
            const base = config.API_BASE_URL || '';
            const pick = files['logotyp']?.fileName || 
                         files['logo_kolowe_tlo_kafel']?.fileName || 
                         files['biale_logo_identyfikator']?.fileName;
            if (pick) {
              organizerLogoUrl = `${base}/api/v1/exhibitor-branding/serve/${exhibitorId}/${encodeURIComponent(pick)}?token=${encodeURIComponent(token)}`;
            }
          }
        } catch {}

        // Add organizer logo ONLY to events that belong to this exhibitor (not agenda events)
        const enriched = res.data.map(ev => {
          const isExhibitorEvent = ev.exhibitor_id === exhibitorId;
          return {
            ...ev,
            ...(isExhibitorEvent && organizerLogoUrl ? { organizerLogoUrl } : {}),
          };
        });
        setTradeEvents(enriched);
      } catch (_e) {
        setTradeEvents([]);
      }
    };
    load();
  }, [token, exhibitorId, currentExhibitionId]);

  // Definicja sekcji
  const items = [
    {
      icon: <ScheduleOfEvents fontSize="small" />,
      title: `Plan wydarzeń na stoisku ${tradeEvents.length}`,
      container: (
        <AddingEvents
          exhibitorId={exhibitorId}
          { ...(currentExhibitionId !== undefined ? { exhibitionId: currentExhibitionId } : {}) }
          onCreated={(ev) => {
            // Append newly created event to the list immediately
            const appended: TradeEvent = {
              id: ev.id ?? 0,
              exhibition_id: ev.exhibition_id ?? currentExhibitionId ?? 0,
              name: ev.name,
              eventDate: ev.eventDate,
              startTime: ev.startTime,
              endTime: ev.endTime,
              type: ev.type,
              ...(ev.description ? { description: ev.description } : {}),
              ...(ev.organizer ? { organizer: ev.organizer } : {}),
              ...(typeof ev.exhibitor_id === 'number' ? { exhibitor_id: ev.exhibitor_id } : {}),
            };
            setTradeEvents(prev => [...prev, appended]);
          }}
          onUpdated={(updated: TradeEvent) => {
            setTradeEvents(prev => prev.map(ev => {
              if (typeof ev.id !== 'number' || typeof updated.id !== 'number') return ev;
              if (ev.id !== updated.id) return ev;
              const next: TradeEvent = {
                id: updated.id,
                name: updated.name,
                eventDate: updated.eventDate,
                startTime: updated.startTime,
                endTime: updated.endTime,
                type: updated.type,
              };
              const exId = typeof updated.exhibition_id === 'number' ? updated.exhibition_id : (typeof ev.exhibition_id === 'number' ? ev.exhibition_id : undefined);
              if (typeof exId === 'number') next.exhibition_id = exId;
              if (typeof updated.description === 'string') next.description = updated.description;
              if (typeof updated.organizer === 'string') next.organizer = updated.organizer;
              if (typeof updated.exhibitor_id === 'number') next.exhibitor_id = updated.exhibitor_id;
              return next;
            }));
          }}
        />
      )
    },
    {
      icon: null,
      title: "Dodane wydarzenia",
      container: (
        <AddedEvents
          { ...(currentExhibitionId !== undefined ? { exhibitionId: currentExhibitionId } : {}) }
          onDeleted={(deletedId) => {
            setTradeEvents(prev => prev.filter(ev => ev.id !== deletedId));
          }}
          onEdit={(evt) => {
            // Bubble selected event into the AddingEvents form via window bridge
            try {
              (window as any).prefillAddingEventForm = {
                id: evt.id,
                name: evt.eventTitle || evt.name,
                eventDate: evt.eventDate,
                startTime: evt.startTime,
                endTime: evt.endTime,
                description: evt.description || '',
                type: evt.eventType || 'Montaż stoiska',
                organizer: '',
              };
              // Optionally scroll to form
              const el = document.querySelector('#adding-events-form');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch {}
          }}
          events={tradeEvents.map(ev => ({
            id: ev.id ?? 0,
            exhibition_id: ev.exhibition_id ?? 0,
            name: ev.name,
            eventDate: ev.eventDate,
            startTime: ev.startTime,
            endTime: ev.endTime,
            eventType: ev.type as any,
            eventTitle: ev.name,
            description: ev.description || '',
            organizer: '',
            isDelete: true,
            isEdited: true,
          }))}
        />
      )
    },
  ];

  // Stany accordionów
  const [expandedAccordions, setExpandedAccordions] = useState<boolean[]>(Array(items.length).fill(false));
  const [expandedOne, setExpandedOne] = useState<number | false>(false);

  const handleChangeMultiple = (index: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordions((prev) => prev.map((opened, i) => (i === index ? isExpanded : opened)));
  };

  const handleChangeSingle = (index: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedOne(isExpanded ? index : false);
  };

  const alwaysOpenIndexes = [0, 1];
  const overlapIndexes: number[] = [];

  // Dane do usunięcia, może potrzebne przy podpięciu akcji
  useEffect(() => {
    console.log(`${exhibitorId}`);  
    console.log(`${exhibitor}`);
  }, [exhibitorId, exhibitor]);

  return (
    <Box className={styles.container}>
      {items.map((item, idx) => {
        const isLastAccordion = idx === items.length - 1;
        const isAlwaysOpen = alwaysOpenIndexes.includes(idx);
        const isOverlap = Array.isArray(overlapIndexes) && overlapIndexes.includes(idx);

        return (
          <React.Fragment key={item.title}>
            {isLastAccordion && <Box sx={{ height: 40 }} />}

            <Accordion
              expanded={isAlwaysOpen ? true : allowMultiple ? expandedAccordions[idx] : expandedOne === idx}
              onChange={
                isAlwaysOpen
                  ? () => {}
                  : allowMultiple
                  ? handleChangeMultiple(idx)
                  : handleChangeSingle(idx)
              }
              disableGutters
              elevation={0}
              square
              sx={{
                padding: "0px 24px !important",
                '@media (max-width:440px)': {
                padding: '0px 8px !important',
              },
                borderRadius: "20px",
                backgroundColor: idx % 2 === 0 ? "#f5f5f5" : "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                border: "none",
                position: "relative",
                "&:before": { display: "none" },
                zIndex: isAlwaysOpen ? 2 : 1,
                ...(isOverlap && { mt: -3, mb: -3 }),
                ...(!isOverlap && { marginBottom: "40px" }),
              }}
            >
              <AccordionSummary
                expandIcon={
                  !isAlwaysOpen && (
                    <Box
                      sx={{
                        width: 35,
                        height: 35,
                        borderRadius: "50%",
                        backgroundColor: "#fafbfb",
                        border: "2px solid #fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ExpandMoreIcon sx={{ color: "#6f87f6", fontSize: 28 }} />
                    </Box>
                  )
                }
                aria-controls={`panel${idx + 1}-content`}
                id={`panel${idx + 1}-header`}
                sx={{
                  borderRadius: "20px",
                  minHeight: 56,
                  "&.Mui-expanded": { minHeight: 56 },
                  '@media (max-width:440px)': {
                  padding: '0px 0px !important',
                },                   
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1,marginTop:'1em'}}>
                  {item.icon && (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: idx % 2 === 0 ? "#fff" : "#f5f5f5",
                        boxShadow: "0 2px 8px rgba(94,101,119,0.06)",
                       
                      }}
                    >
                      {item.icon}
                    </Box>
                  )}
                  <Typography 
                  sx={{ fontWeight: 600, 
                  fontSize: "1rem",    
                   '@media (max-width:440px)': {
                    fontSize:'13px',
                  },
                  }} component="span">
                    {item.title}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ borderRadius: "0 0 20px 20px", pb: 2, pt: 1.5}}>
                {item.container}
              </AccordionDetails>
            </Accordion>
          </React.Fragment>
        );
      })}
    </Box>
  );
}

export default ExhibitorScheduleOfEventsAtTheStand;
