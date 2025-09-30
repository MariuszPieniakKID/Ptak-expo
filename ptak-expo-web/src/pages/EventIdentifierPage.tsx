import { Box } from '@mui/material';
import EventLayout from '../components/eventLayout/EventLayout';
import LeftColumn from '../components/event-left/LeftColumn';
import IdentifierCard, { type Identifier } from '../components/identifierCard/IdentifierCard';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { exhibitionsAPI, tradeInfoAPI, brandingAPI } from '../services/api';
import { getChecklist } from '../services/checkListApi';
import styles from './EventHomePage.module.scss';

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

const EventIdentifierPage = () => {
  const { eventId } = useParams();
  const [identifier, setIdentifier] = useState<Identifier | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      try {
        const idNum = Number(eventId);
        const [evRes, tradeRes, brandingRes] = await Promise.all([
          exhibitionsAPI.getById(idNum),
          tradeInfoAPI.get(idNum).catch(() => null),
          brandingAPI.getGlobal(idNum).catch(() => null),
        ]);

        const e = evRes.data;
        const trade = tradeRes && tradeRes.data && tradeRes.data.success ? tradeRes.data.data : null;

        const exhibitorStart = trade?.tradeHours?.exhibitorStart;
        const exhibitorEnd = trade?.tradeHours?.exhibitorEnd;
        const visitorStart = trade?.tradeHours?.visitorStart;
        const visitorEnd = trade?.tradeHours?.visitorEnd;
        const timeRange = (exhibitorStart && exhibitorEnd)
          ? `${exhibitorStart}–${exhibitorEnd}`
          : (visitorStart && visitorEnd) ? `${visitorStart}–${visitorEnd}` : '';

        const hallName = Array.isArray(trade?.tradeSpaces) && trade.tradeSpaces.length > 0
          ? (trade.tradeSpaces[0]?.hallName || '')
          : (e.location || '');

        // Resolve header image from global branding files
        let headerImageUrl = '/assets/background.png';
        const files = brandingRes && brandingRes.data && brandingRes.data.success ? brandingRes.data.files : null;
        const headerFile = files && (files['kolorowe_tlo_logo_wydarzenia'] || files['tlo_wydarzenia_logo_zaproszenia']);
        if (headerFile?.fileName) {
          headerImageUrl = brandingAPI.serveGlobalUrl(headerFile.fileName);
        }

        // Resolve exhibitor catalog logo from checklist
        let catalogLogoUrl: string | null = null;
        try {
          const cl = await getChecklist(idNum);
          const l = cl?.companyInfo?.logo || null;
          if (l && typeof l === 'string' && l.trim().length > 0) catalogLogoUrl = l;
        } catch {}

        const data: Identifier = {
          id: String(e.id),
          eventName: e.name || '',
          dateFrom: formatDate(e.start_date || e.startDate),
          dateTo: formatDate(e.end_date || e.endDate),
          time: timeRange,
          type: 'Wystawca',
          location: hallName,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(String(e.id))}`,
          headerImageUrl,
          logoUrl: catalogLogoUrl || '/assets/logo192.png',
        };
        setIdentifier(data);
      } catch (_err) {
        setIdentifier(null);
      }
    };
    load();
  }, [eventId]);

  return (
    <EventLayout
      left={<LeftColumn eventId={eventId || '0'} isDarkBg={true}/>}
      right={<Box className={styles.rightContainer}>{identifier && <IdentifierCard data={identifier} />}</Box>}
      colorRight="#5a6ec8"
      colorLeft="#2E2E38"
    />
  );
};

export default EventIdentifierPage;


