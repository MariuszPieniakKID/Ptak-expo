import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Alert } from '@mui/material';
import CustomTypography from '../../../../components/customTypography/CustomTypography';
import CustomButton from '../../../../components/customButton/CustomButton';
import CustomField from '../../../../components/customField/CustomField';
import { useAuth } from '../../../../contexts/AuthContext';
import { Exhibition, TradeEvent, createTradeEvent, getTradeEvents, deleteTradeEvent, updateTradeEvent } from '../../../../services/api';
import { ReactComponent as EditIcon } from '../../../../assets/editIcon.svg';
import { ReactComponent as WastebasketIcon } from '../../../../assets/wastebasket.svg';
import styles from './TradeFairEventsContent.module.scss';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';

interface TradeFairEventsContentProps {
  event: Exhibition;
}

const TradeFairEventsContent: React.FC<TradeFairEventsContentProps> = ({ event }) => {
  const { token } = useAuth();
  const [tradeEvents, setTradeEvents] = useState<TradeEvent[]>([]);
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

  const dateOnly = (value?: string) => {
    if (!value) return '';
    const tIdx = value.indexOf('T');
    return tIdx > 0 ? value.slice(0, tIdx) : value;
  };
  const timeHM = (value?: string) => {
    if (!value) return '';
    const parts = value.split(':');
    if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    return value;
  };

  const loadTradeEvents = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getTradeEvents(event.id, token);
      setTradeEvents(res.data || []);
      setTradeEventsError('');
    } catch (e: any) {
      setTradeEventsError(e.message || 'Błąd podczas ładowania wydarzeń targowych');
    }
  }, [event.id, token]);

  useEffect(() => {
    loadTradeEvents();
  }, [loadTradeEvents]);

  const handleNewEventChange = (field: keyof TradeEvent) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEvent(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveTradeEvent = async () => {
    if (!token) return;
    // Require name and date; ensure times are set (backend requires them)
    if (!newEvent.name || !newEvent.eventDate) {
      setTradeEventsError('Podaj co najmniej nazwę i datę wydarzenia');
      return;
    }
    // Fill default times if missing
    const payload: TradeEvent = {
      ...newEvent,
      startTime: newEvent.startTime || '09:00',
      endTime: newEvent.endTime || '17:00',
    };
    // Rely on backend to validate date range to avoid false negatives on the client
    try {
      if (editingEventId) {
        await updateTradeEvent(event.id, editingEventId, payload, token);
      } else {
        await createTradeEvent(event.id, payload, token);
      }
      const refreshed = await getTradeEvents(event.id, token);
      setTradeEvents(refreshed.data || []);
      setTradeEventsError('');
      setNewEvent({ name: '', eventDate: '', startTime: '09:00', endTime: '17:00', hall: '', description: '', type: 'Ceremonia otwarcia', organizer: '' });
      setEditingEventId(null);
    } catch (err: any) {
      setTradeEventsError(err.message || 'Błąd podczas zapisywania wydarzenia targowego');
    }
  };

  const handleEditExisting = (ev: TradeEvent) => {
    setNewEvent({
      name: ev.name,
      eventDate: ev.eventDate,
      startTime: timeHM(ev.startTime),
      endTime: timeHM(ev.endTime),
      hall: ev.hall || '',
      description: ev.description || '',
      type: ev.type,
      organizer: ev.organizer,
      exhibition_id: ev.exhibition_id,
      exhibitor_id: ev.exhibitor_id,
      id: ev.id,
    } as TradeEvent);
    setEditingEventId(ev.id!);
    // Smooth scroll to the form at the top
    const headerOffset = 80; // adjust if fixed header height differs
    if (formTopRef.current) {
      const y = formTopRef.current.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setNewEvent({ name: '', eventDate: '', startTime: '09:00', endTime: '17:00', hall: '', description: '', type: 'Ceremonia otwarcia', organizer: '' });
  };

  const handleDeleteExisting = async (eventId?: number) => {
    if (!token || !eventId) return;
    try {
      await deleteTradeEvent(event.id, eventId, token);
      const refreshed = await getTradeEvents(event.id, token);
      setTradeEvents(refreshed.data || []);
      setTradeEventsError('');
      // If we were editing the deleted event, reset form
      if (editingEventId === eventId) {
        handleCancelEdit();
      }
    } catch (err: any) {
      setTradeEventsError(err.message || 'Błąd podczas usuwania wydarzenia targowego');
    }
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

        {tradeEvents.map((ev) => (
          <details key={ev.id} className={styles.eventCard}>
            <summary>
              <Box className={styles.summaryRow}>
                <CustomTypography fontSize="0.875rem" fontWeight={500}>
                  {dateOnly(ev.eventDate)} • {timeHM(ev.startTime)} - {timeHM(ev.endTime)} {ev.hall ? `• Hala: ${ev.hall}` : ''} — {ev.name}
                </CustomTypography>
                <Box className={styles.actionEditButton}>
                  <Box
                    className={styles.boxWithHover}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditExisting(ev); }}
                  >
                    <EditIcon className={styles.editEvent} />
                    <CustomTypography className={styles.editEventText}>edytuj</CustomTypography>
                  </Box>
                  <Box
                    className={styles.boxWithHover}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteExisting(ev.id); }}
                  >
                    <WastebasketIcon className={styles.editEvent} />
                    <CustomTypography className={styles.editEventText}>usuń</CustomTypography>
                  </Box>
                </Box>
              </Box>
            </summary>
            <Box sx={{ mt: 1 }}>
              <CustomTypography fontSize="0.75rem" color="#6c757d">
                Nazwa: {ev.name}
              </CustomTypography>
              <CustomTypography fontSize="0.75rem" color="#6c757d">
                Data: {dateOnly(ev.eventDate)}
              </CustomTypography>
              <CustomTypography fontSize="0.75rem" color="#6c757d">
                Godziny: {timeHM(ev.startTime)} - {timeHM(ev.endTime)}
              </CustomTypography>
              {ev.hall && (
                <CustomTypography fontSize="0.75rem" color="#6c757d">
                  Hala: {ev.hall}
                </CustomTypography>
              )}
              {ev.organizer && (
                <CustomTypography fontSize="0.75rem" color="#6c757d">
                  Organizator: {ev.organizer}
                </CustomTypography>
              )}
              {ev.description && (
                <CustomTypography fontSize="0.75rem" color="#6c757d">
                  Opis: {ev.description}
                </CustomTypography>
              )}
              <CustomTypography fontSize="0.75rem" color="#6c757d">
                Rodzaj: {ev.type}
              </CustomTypography>
            </Box>
          </details>
        ))}
      </Box>
    </Box>



    // <Box className={styles.tabContent}>
    //   <CustomTypography fontSize="1.25rem" fontWeight={600}>
    //     Wydarzenia targowe
    //   </CustomTypography>
    //   <Box className={styles.tradeEventsSection}>
    //     {tradeEventsError && (
    //       <Alert severity="error" sx={{ mb: 2 }}>{tradeEventsError}</Alert>
    //     )}
    //     <Box className={styles.eventCard}>
    //       <CustomTypography fontSize="0.875rem" fontWeight={500}>
    //         Dodaj wydarzenie
    //       </CustomTypography>
    //       <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
    //         <CustomField
    //           type="text"
    //           value={newEvent.name}
    //           onChange={handleNewEventChange('name')}
    //           placeholder="Nazwa wydarzenia"
    //           fullWidth
    //         />
    //         <CustomField
    //           type="date"
    //           value={newEvent.eventDate}
    //           onChange={handleNewEventChange('eventDate')}
    //           placeholder="Data"
    //           fullWidth
    //         />
    //         <CustomField
    //           type="time"
    //           value={newEvent.startTime}
    //           onChange={handleNewEventChange('startTime')}
    //           placeholder="Godzina początku"
    //           fullWidth
    //         />
    //         <CustomField
    //           type="time"
    //           value={newEvent.endTime}
    //           onChange={handleNewEventChange('endTime')}
    //           placeholder="Godzina końca"
    //           fullWidth
    //         />
    //         <CustomField
    //           type="text"
    //           value={newEvent.hall || ''}
    //           onChange={handleNewEventChange('hall')}
    //           placeholder="Hala"
    //           fullWidth
    //         />
    //         <CustomField
    //           type="text"
    //           value={newEvent.type}
    //           onChange={handleNewEventChange('type')}
    //           placeholder="Rodzaj"
    //           options={typeOptions}
    //           forceSelectionFromOptions
    //           fullWidth
    //         />
    //         <CustomField
    //           type="text"
    //           value={newEvent.description || ''}
    //           onChange={handleNewEventChange('description')}
    //           placeholder="Opis"
    //           fullWidth
    //         />
    //       </Box>
    //       <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
    //         <CustomButton
    //           bgColor="#6F87F6"
    //           textColor="#fff"
    //           width="120px"
    //           height="40px"
    //           fontSize="0.875rem"
    //           onClick={handleSaveTradeEvent}
    //         >
    //           Zapisz
    //         </CustomButton>
    //       </Box>
    //     </Box>

    //     {tradeEvents.map((ev) => (
    //       <details key={ev.id} className={styles.eventCard}>
    //         <summary>
    //           <CustomTypography fontSize="0.875rem" fontWeight={500}>
    //             {dateOnly(ev.eventDate)} • {timeHM(ev.startTime)} - {timeHM(ev.endTime)} {ev.hall ? `• Hala: ${ev.hall}` : ''} — {ev.name}
    //           </CustomTypography>
    //         </summary>
    //         <Box sx={{ mt: 1 }}>
    //           <CustomTypography fontSize="0.75rem" color="#6c757d">
    //             Nazwa: {ev.name}
    //           </CustomTypography>
    //           <CustomTypography fontSize="0.75rem" color="#6c757d">
    //             Data: {dateOnly(ev.eventDate)}
    //           </CustomTypography>
    //           <CustomTypography fontSize="0.75rem" color="#6c757d">
    //             Godziny: {timeHM(ev.startTime)} - {timeHM(ev.endTime)}
    //           </CustomTypography>
    //           {ev.hall && (
    //             <CustomTypography fontSize="0.75rem" color="#6c757d">
    //               Hala: {ev.hall}
    //             </CustomTypography>
    //           )}
    //           {ev.description && (
    //             <CustomTypography fontSize="0.75rem" color="#6c757d">
    //               Opis: {ev.description}
    //             </CustomTypography>
    //           )}
    //           <CustomTypography fontSize="0.75rem" color="#6c757d">
    //             Rodzaj: {ev.type}
    //           </CustomTypography>
    //         </Box>
    //       </details>
    //     ))}
    //   </Box>
    // </Box>
  );
};

export default TradeFairEventsContent;