import React, { useRef, useState } from 'react';
import { Box, Alert } from '@mui/material';
import CustomTypography from '../../../../components/customTypography/CustomTypography';
import CustomButton from '../../../../components/customButton/CustomButton';
import CustomField from '../../../../components/customField/CustomField';
import { useAuth } from '../../../../contexts/AuthContext';
import { Exhibition, TradeEvent, createTradeEvent, updateTradeEvent } from '../../../../services/api';
import styles from './TradeFairEventsContent.module.scss';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';

interface TradeFairEventsContentProps {
  event: Exhibition;
  onEventsChanged?: () => void;
}

const TradeFairEventsContent: React.FC<TradeFairEventsContentProps> = ({ event, onEventsChanged }) => {
  const { token } = useAuth();
  const [tradeEventsError, setTradeEventsError] = useState<string>('');
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const formTopRef = useRef<HTMLDivElement | null>(null);
  const [newEvent, setNewEvent] = useState<TradeEvent>({
    name: '',
    eventDate: event?.start_date ? event.start_date.slice(0, 10) : '',
    startTime: '09:00',
    endTime: '17:00',
    hall: '',
    description: '',
    type: 'Ceremonia otwarcia',
    organizer: '',
  });

  const typeOptions = [
    { value: 'Ceremonia otwarcia', label: 'Ceremonia otwarcia' },
    { value: 'Konferencja', label: 'Konferencja' },
    { value: 'Kongres', label: 'Kongres' },
    { value: 'Warsztaty', label: 'Warsztaty' },
    { value: 'Szkolenia', label: 'Szkolenia' },
    { value: 'Wykłady', label: 'Wykłady' },
    { value: 'Wystąpienia', label: 'Wystąpienia' },
    { value: 'Wręczenie nagród', label: 'Wręczenie nagród' },
    { value: 'Panel trendów', label: 'Panel trendów' },
    { value: 'Ceremonia medalowa', label: 'Ceremonia medalowa' },
  ];

  

  const handleNewEventChange = (field: keyof TradeEvent) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEvent(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveTradeEvent = async () => {
    if (!token) return;
    if (!newEvent.name || !newEvent.eventDate) {
      setTradeEventsError('Podaj co najmniej nazwę i datę wydarzenia');
      return;
    }
    const payload: TradeEvent = {
      ...newEvent,
      startTime: newEvent.startTime || '09:00',
      endTime: newEvent.endTime || '17:00',
      eventSource: 'official_events', // Mark as official event
    };
    try {
      if (editingEventId) {
        await updateTradeEvent(event.id, editingEventId, payload, token);
      } else {
        await createTradeEvent(event.id, payload, token);
      }
      setTradeEventsError('');
      setNewEvent({ name: '', eventDate: '', startTime: '09:00', endTime: '17:00', hall: '', description: '', type: 'Ceremonia otwarcia', organizer: '' });
      setEditingEventId(null);
      onEventsChanged && onEventsChanged();
    } catch (err: any) {
      setTradeEventsError(err.message || 'Błąd podczas zapisywania wydarzenia targowego');
    }
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setNewEvent({ name: '', eventDate: '', startTime: '09:00', endTime: '17:00', hall: '', description: '', type: 'Ceremonia otwarcia', organizer: '' });
  };

  

  return (
    <Box className={styles.tabContent}>

      <Box className={styles.tradeEventsSection}>
        {tradeEventsError && (
          <Alert severity="error" sx={{ mb: 2 }}>{tradeEventsError}</Alert>
        )}
        <Box className={styles.eventCard} ref={formTopRef}>
          <CustomTypography fontSize="0.875rem" fontWeight={500}>
            Dodaj wydarzenie
          </CustomTypography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <CustomField
              type="text"
              value={newEvent.name}
              onChange={handleNewEventChange('name')}
              placeholder="Nazwa wydarzenia"
              fullWidth
            />
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
              <Box sx={{ background: '#f6f8fa', borderRadius: '8px' }}>
                <DateCalendar
                  value={newEvent.eventDate ? dayjs(newEvent.eventDate) : null}
                  {...(event?.start_date ? { minDate: dayjs(event.start_date) } : {})}
                  {...(event?.end_date ? { maxDate: dayjs(event.end_date) } : {})}
                  onChange={(val: any) => {
                    const dateStr = val ? val.format('YYYY-MM-DD') : '';
                    setNewEvent(prev => ({ ...prev, eventDate: dateStr }));
                  }}
                />
                {tradeEventsError && newEvent.eventDate === '' && (
                  <Box component="span" sx={{ color: 'error.main', fontSize: '0.75rem', marginTop: '4px', display: 'block', px: 1 }}>
                    Data jest wymagana
                  </Box>
                )}
              </Box>
            </LocalizationProvider>
            <CustomField
              type="time"
              value={newEvent.startTime}
              onChange={handleNewEventChange('startTime')}
              placeholder="Godzina początku"
              fullWidth
            />
            <CustomField
              type="time"
              value={newEvent.endTime}
              onChange={handleNewEventChange('endTime')}
              placeholder="Godzina końca"
              fullWidth
            />
            <CustomField
              type="text"
              value={newEvent.hall || ''}
              onChange={handleNewEventChange('hall')}
              placeholder="Hala"
              fullWidth
            />
            <CustomField
              type="text"
              value={newEvent.organizer || ''}
              onChange={handleNewEventChange('organizer')}
              placeholder="Nazwa organizatora"
              fullWidth
            />
            <CustomField
              type="text"
              value={newEvent.type}
              onChange={handleNewEventChange('type')}
              placeholder="Rodzaj"
              options={typeOptions}
              forceSelectionFromOptions
              fullWidth
            />
            <CustomField
              type="text"
              value={newEvent.description || ''}
              onChange={handleNewEventChange('description')}
              placeholder="Opis"
              fullWidth
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
            {editingEventId && (
              <CustomButton
                bgColor="#e9ecef"
                textColor="#2e2e38"
                width="120px"
                height="40px"
                fontSize="0.875rem"
                onClick={handleCancelEdit}
              >
                Anuluj
              </CustomButton>
            )}
            <CustomButton
              bgColor="#6F87F6"
              textColor="#fff"
              width="140px"
              height="40px"
              fontSize="0.875rem"
              onClick={handleSaveTradeEvent}
            >
              {editingEventId ? 'Zaktualizuj' : 'Zapisz'}
            </CustomButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TradeFairEventsContent;