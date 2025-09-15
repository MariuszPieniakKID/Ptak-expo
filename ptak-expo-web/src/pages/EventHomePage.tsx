import { Box } from '@mui/material';
import EventLayout from '../components/eventLayout/EventLayout';
import styles from './EventHomePage.module.scss';
import { useParams, useNavigate } from 'react-router-dom';
import AvatarBanner from '../components/avatar-banner/AvatarBanner';
import PlannedEventCard from '../components/planned-event-card/PlannedEventCard';
import ChecklistProgressCard from '../components/checklist-progress-card/ChecklistProgressCard';
import EventHomeMenu from '../components/event-home-menu/EventHomeMenu';
import { useEffect, useState } from 'react';
import { exhibitionsAPI, brandingAPI } from '../services/api';

const EventHomePage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<{ id: string; title: string; dateFrom: string; dateTo: string; readiness: number; logoUrl: string; daysLeft: number } | null>(null);

  const formatDate = (iso: string | undefined): string => {
    if (!iso) return '';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const calcDaysLeft = (iso: string | undefined): number => {
    if (!iso) return 0;
    const datePart = (iso.split('T')[0] || iso).trim();
    const [y, m, d] = datePart.split('-').map((v) => parseInt(v, 10));
    if (!y || !m || !d) return 0;
    const target = new Date(y, m - 1, d); // local midnight of event start
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // local midnight today
    const diffMs = target.getTime() - today.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      try {
        const res = await exhibitionsAPI.getById(Number(eventId));
        const e = res.data;
        // Resolve logo the same way as other pages (prefer global branding 'event_logo')
        let logoUrl = '/assets/logo192.png';
        try {
          const branding = await brandingAPI.getGlobal(Number(eventId));
          const files: any = branding.data?.files || {};
          if (files['event_logo']?.fileName) {
            logoUrl = brandingAPI.serveGlobalUrl(files['event_logo'].fileName);
          } else if (e.event_logo_file_name) {
            logoUrl = brandingAPI.serveGlobalUrl(e.event_logo_file_name);
          }
        } catch {
          if (e.event_logo_file_name) {
            logoUrl = brandingAPI.serveGlobalUrl(e.event_logo_file_name);
          }
        }
        setEvent({
          id: String(e.id),
          title: e.name,
          dateFrom: formatDate(e.start_date || e.startDate),
          dateTo: formatDate(e.end_date || e.endDate),
          readiness: 0,
          logoUrl,
          daysLeft: calcDaysLeft(e.start_date || e.startDate),
        });
      } catch (_err) {
        setEvent(null);
      }
    };
    load();
  }, [eventId]);

  return (
    <EventLayout
      left={
        <Box className={styles.leftContainer}>
          <AvatarBanner />
          {event && (
            <>
              <PlannedEventCard event={event} onSelect={() => navigate('/dashboard')} />
              <ChecklistProgressCard
                daysLeft={event.daysLeft}
                onChecklistClick={() => navigate(`/event/${event.id}/checklist`)}
              />
            </>
          )}
        </Box>
      }
      right={<Box className={styles.rightContainer}>{event && <EventHomeMenu id={event.id} />}</Box>}
      colorLeft="#eceef0"
    />
  );
};

export default EventHomePage;


