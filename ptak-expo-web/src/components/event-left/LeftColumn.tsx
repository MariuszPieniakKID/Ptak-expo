import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarBanner from '../avatar-banner/AvatarBanner';
import PlannedEventCard from '../planned-event-card/PlannedEventCard';
import ChecklistProgressCard from '../checklist-progress-card/ChecklistProgressCard';
import { exhibitionsAPI, brandingAPI } from '../../services/api';
import styles from '../../pages/EventHomePage.module.scss';

type EventView = {
  id: string;
  title: string;
  dateFrom: string;
  dateTo: string;
  readiness: number;
  logoUrl: string;
  daysLeft: number;
};

interface LeftColumnProps {
  eventId: string;
  isDarkBg?: boolean;
}

const LeftColumn: React.FC<LeftColumnProps> = ({ eventId, isDarkBg = false }) => {
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventView | null>(null);

  const formatDate = (iso?: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const calcDaysLeft = (iso?: string): number => {
    if (!iso) return 0;
    const datePart = (iso.split('T')[0] || iso).trim();
    const [y, m, d] = datePart.split('-').map((v) => parseInt(v, 10));
    if (!y || !m || !d) return 0;
    const target = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = target.getTime() - today.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await exhibitionsAPI.getById(Number(eventId));
        const e = res.data;
        // Try loading global branding files to resolve event_logo
        let logoUrl = '/assets/logo192.png';
        try {
          const branding = await brandingAPI.getGlobal(Number(eventId));
          const files = branding.data?.files || {};
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
    <Box className={styles.leftContainer}>
      <AvatarBanner isWhite={isDarkBg}/>
      {event && (
        <>
          <PlannedEventCard event={event} onSelect={() => navigate('/dashboard')} preferTileLogo={false} />
          {/* Hide readiness for now */}
          <ChecklistProgressCard
            daysLeft={event.daysLeft}
            onChecklistClick={() => navigate(`/event/${event.id}/checklist`)}
          />
        </>
      )}
    </Box>
  );
};

export default LeftColumn;


