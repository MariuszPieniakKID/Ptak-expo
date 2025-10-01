import {Box} from '@mui/material';
import styles from './TabCard.module.scss';
import { Exhibition, TradeEvent } from '../../../../services/api';
import { getDaysBetweenDates } from '../../../../helpers/function';
import SingleLine from '../singleLine/SingleLine';
import CustomButton from '../../../customButton/CustomButton';


type TabCardProps = {
  event: Exhibition;
  value:number;
  tradeEvents:TradeEvent[];
  days?: string[];
  onToggleAgenda?: ((ev: TradeEvent) => void) | undefined;
  agendaEventIds?: number[] | undefined;
  onDeleteEvent?: ((eventId: number) => void) | undefined;
};


function TabCard({ 
  event,
  value,
  tradeEvents,
  days: daysProp,
  onToggleAgenda,
  agendaEventIds = [],
  onDeleteEvent,
}: TabCardProps) {
 

  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ padding: '24px 0px' }}>{children}</Box>}
      </div>
    );
  }
    const days = daysProp && daysProp.length ? daysProp : getDaysBetweenDates(event.start_date, event.end_date);
    console.log('[TabCard] days', days);

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
  
  return (
  <Box className={styles.container}>
  {/* Panel 0: Wszystkie */}
  <CustomTabPanel value={value} index={0}>
    <Box className={styles.tabPaperContainer}>
      {[...tradeEvents]
        .sort((a, b) =>
          (normalizeYmd(a.eventDate) || '').localeCompare(normalizeYmd(b.eventDate) || '') ||
          (a.startTime || '').localeCompare(b.startTime || '') ||
          (a.endTime || '').localeCompare(b.endTime || '') ||
          (a.name || '').localeCompare(b.name || '')
        )
        .map(ev => {
          // Determine hall/booth display: if event has exhibitor_id, show booth number, otherwise show hall
          const isExhibitorEvent = typeof ev.exhibitor_id === 'number' && ev.exhibitor_id !== null;
          const locationDisplay = isExhibitorEvent 
            ? (ev.booth_number || `Stoisko ${ev.exhibitor_id}`) // TODO: fetch actual booth number from exhibitor
            : (ev.hall || '');
          const isInAgenda = agendaEventIds.includes(ev.id as number);
          
          return (
            <SingleLine
            key={ev.id}
            time={`${ev.startTime} - ${ev.endTime}`}
            hall={locationDisplay}
            title={ev.name}
            shortDescription={ev.description || ''}
            link={ev.link || ''}
              rightAction={(
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {onToggleAgenda && (
                    <CustomButton
                      bgColor={isInAgenda ? "#28a745" : "#6F87F6"}
                      textColor="#fff"
                      height="24px"
                      width="110px"
                      fontSize="0.7rem"
                      onClick={(e: any) => { e.stopPropagation(); onToggleAgenda(ev); }}
                    >
                      {isInAgenda ? 'Usuń z agendy' : 'Dodaj do agendy'}
                    </CustomButton>
                  )}
                  {onDeleteEvent && typeof ev.id === 'number' && (
                    <CustomButton
                      bgColor="#dc3545"
                      textColor="#fff"
                      height="24px"
                      width="60px"
                      fontSize="0.7rem"
                      onClick={(e: any) => { e.stopPropagation(); onDeleteEvent(ev.id as number); }}
                    >
                      Usuń
                    </CustomButton>
                  )}
                </Box>
              )}
          />
          );
        })}
      {tradeEvents.length === 0 && (
        <Box style={{ color: '#EEEFF1', padding: '12px 0' }}>
          Brak wydarzeń
        </Box>
      )}
    </Box>
  </CustomTabPanel>
  {/* Kolejne panele: dni targów, indeks +1 */}
  {days.map((date, index) => {
    const filteredEvents = tradeEvents.filter(ev => {
      const evDate = normalizeYmd(ev.eventDate);
      const match = evDate === date;
      if (!match && index === 0) {
        console.debug('[TabCard] filter mismatch', { evDate, tabDate: date, ev });
      }
      return match;
    });
    const sortedEvents = [...filteredEvents].sort((a, b) =>
      (a.startTime || '').localeCompare(b.startTime || '') ||
      (a.endTime || '').localeCompare(b.endTime || '') ||
      (a.name || '').localeCompare(b.name || '')
    );
    console.log('[TabCard] rendering day', date, 'events total', tradeEvents.length, 'filtered', filteredEvents.length, 'sorted', sortedEvents.length);
    return (
      <CustomTabPanel 
        key={index}
        value={value} 
        index={index + 1}
      >
        <Box className={styles.tabPaperContainer}>
          {sortedEvents.length === 0 ? (
            <Box style={{ color: '#EEEFF1', padding: '12px 0' }}>
              Brak wydarzeń w tym dniu
            </Box>
          ) : (
            sortedEvents.map(ev => {
              const isExhibitorEvent = typeof ev.exhibitor_id === 'number' && ev.exhibitor_id !== null;
              const locationDisplay = isExhibitorEvent 
                ? (ev.booth_number || `Stoisko ${ev.exhibitor_id}`) 
                : (ev.hall || '');
              const isInAgenda = agendaEventIds.includes(ev.id as number);
              
              return (
              <SingleLine
                key={ev.id}
                time={`${ev.startTime} - ${ev.endTime}`}
                hall={locationDisplay}
                title={ev.name}
                shortDescription={ev.description || ''}
                link={ev.link || ''}
                rightAction={(
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {onToggleAgenda && (
                      <CustomButton
                        bgColor={isInAgenda ? "#28a745" : "#6F87F6"}
                        textColor="#fff"
                        height="24px"
                        width="110px"
                        fontSize="0.7rem"
                        onClick={(e: any) => { e.stopPropagation(); onToggleAgenda(ev); }}
                      >
                        {isInAgenda ? 'Usuń z agendy' : 'Dodaj do agendy'}
                      </CustomButton>
                    )}
                    {onDeleteEvent && typeof ev.id === 'number' && (
                      <CustomButton
                        bgColor="#dc3545"
                        textColor="#fff"
                        height="24px"
                        width="60px"
                        fontSize="0.7rem"
                        onClick={(e: any) => { e.stopPropagation(); onDeleteEvent(ev.id as number); }}
                      >
                        Usuń
                      </CustomButton>
                    )}
                  </Box>
                )}
              />
              );
            })
          )}
        </Box>
      </CustomTabPanel>
    );
  })}

  </Box>
 );
};


export default TabCard;