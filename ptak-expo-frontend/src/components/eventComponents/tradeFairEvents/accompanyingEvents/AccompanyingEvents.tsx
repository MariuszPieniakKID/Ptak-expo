import React from "react";
import styles from "./AccompanyingEvents.module.scss";
import Box from "@mui/material/Box";
import CustomTypography from "../../../customTypography/CustomTypography";

import { Exhibition, TradeEvent } from "../../../../services/api";
import MenuDates from "../menuDates/MenuDates";
import TabCard from "../tabCard/TabCard";
import { getDaysBetweenDates } from "../../../../helpers/function";

interface AccompanyingEventsProps {
  tradeEvents: TradeEvent[];
  event: Exhibition;
  onToggleAgenda?: (ev: TradeEvent) => void;
  agendaEventIds?: number[];
  onDeleteEvent?: (eventId: number) => void;
}

const AccompanyingEvents: React.FC<AccompanyingEventsProps> = ({
  event,
  tradeEvents,
  onToggleAgenda,
  agendaEventIds = [],
  onDeleteEvent,
}) => {
  const [value, setValue] = React.useState(0);
  const hasAutoSelectedRef = React.useRef(false);
  const allRangeDays = React.useMemo(() => getDaysBetweenDates(event.start_date, event.end_date), [event.start_date, event.end_date]);
    
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    console.log('[AccompanyingEvents] tab change', { from: value, to: newValue });
    setValue(newValue);
  };

  // Auto-select first day that has events to avoid empty list despite non-zero total count
  const normalizeYmd = (value?: string): string => {
    const s = String(value || '');
    const m = s.match(/\d{4}-\d{2}-\d{2}/);
    if (m) return m[0];
    const d = new Date(s);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const mth = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mth}-${day}`;
  };

  const days = React.useMemo(() => {
    const unique = Array.from(new Set((tradeEvents || []).map(ev => normalizeYmd(ev.eventDate)).filter(Boolean)));
    if (unique.length === 0) return allRangeDays;
    return unique.sort();
  }, [tradeEvents, allRangeDays]);

  React.useEffect(() => {
    if (hasAutoSelectedRef.current) return; // only once
    if (!tradeEvents || tradeEvents.length === 0) return;
    const idxDay = days.findIndex(d => tradeEvents.some(ev => normalizeYmd(ev.eventDate) === d));
    const target = idxDay !== -1 ? idxDay + 1 : 0; // +1 bo panel 0 to "Wszystkie"
    hasAutoSelectedRef.current = true;
    if (target !== value) {
      setValue(target);
    }
  }, [tradeEvents, days, value]);

  return (

    <Box className={styles.container}>
      <Box className={styles.selectDate} >
        <CustomTypography className={styles.title} >Wybierz dzień targów</CustomTypography>
        <MenuDates 
        event={event}
        value={value}
        handleChange={handleChange}
        days={days}
        /> 
      </Box>
        <TabCard 
        tradeEvents={tradeEvents}
        event={event} 
        value={value}
        days={days}
        onToggleAgenda={onToggleAgenda}
        agendaEventIds={agendaEventIds}
        onDeleteEvent={onDeleteEvent}
        />
    </Box>  
  );
};

export default AccompanyingEvents;