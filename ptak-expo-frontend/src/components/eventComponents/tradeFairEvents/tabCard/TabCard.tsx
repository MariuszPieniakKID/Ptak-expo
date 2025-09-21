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
  onAddToAgenda?: ((ev: TradeEvent) => void) | undefined;
  agendaEventIds?: number[] | undefined;
};


function TabCard({ 
  event,
  value,
  tradeEvents,
  days: daysProp,
  onAddToAgenda,
  agendaEventIds = [],
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
        .map(ev => (
            <SingleLine
            key={ev.id}
            time={`${ev.startTime} - ${ev.endTime}`}
            hall={ev.hall || ''}
            title={ev.name}
            shortDescription={ev.description || ''}
            link={ev.link || ''}
              rightAction={onAddToAgenda ? (
                <CustomButton
                  bgColor="#6F87F6"
                  textColor="#fff"
                  height="24px"
                  width="auto"
                  fontSize="0.75rem"
                  onClick={(e: any) => { e.stopPropagation(); onAddToAgenda(ev); }}
                >
                  {agendaEventIds.includes(ev.id as number) ? 'Dodano' : 'Dodaj'}
                </CustomButton>
              ) : undefined}
          />
        ))}
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
            sortedEvents.map(ev => (
              <SingleLine
                key={ev.id}
                time={`${ev.startTime} - ${ev.endTime}`}
                hall={ev.hall || ''}
                title={ev.name}
                shortDescription={ev.description || ''}
                link={ev.link || ''}
                rightAction={onAddToAgenda ? (
                  <CustomButton
                    bgColor="#6F87F6"
                    textColor="#fff"
                    height="24px"
                    width="auto"
                    fontSize="0.75rem"
                    onClick={(e: any) => { e.stopPropagation(); onAddToAgenda(ev); }}
                  >
                    {agendaEventIds.includes(ev.id as number) ? 'Dodano' : 'Dodaj'}
                  </CustomButton>
                ) : undefined}
              />
            ))
          )}
        </Box>
      </CustomTabPanel>
    );
  })}

  </Box>
 );
};


export default TabCard;