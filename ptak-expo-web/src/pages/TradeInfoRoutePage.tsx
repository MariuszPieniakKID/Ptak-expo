import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Menu from '../components/Menu';
import TradeInfoPage from './TradeInfoPage';
import { tradeInfoAPI, exhibitionsAPI } from '../services/api';

interface TradeInfoData {
  tradeHours: { exhibitorStart: string; exhibitorEnd: string; visitorStart: string; visitorEnd: string };
  contactInfo: { guestService: string; security: string };
  buildDays: Array<{ id: string; date: string; startTime: string; endTime: string }>;
  buildType: string;
  tradeSpaces: Array<{ id: string; name: string; hallName: string; filePath?: string | null; originalFilename?: string | null }>;
  tradeMessage: string;
}

const TradeInfoRoutePage: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [tradeInfo, setTradeInfo] = useState<TradeInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>('');
  const [eventDateRange, setEventDateRange] = useState<string>('');
  const [daysUntilEvent, setDaysUntilEvent] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!eventId) return;
        setLoading(true);
        setError(null);
        const numericId = parseInt(eventId, 10);
        // Fetch trade info
        const res = await tradeInfoAPI.get(numericId);
        if (res.data.success) {
          setTradeInfo(res.data.data || null);
        } else {
          setError(res.data.message || 'Nie udało się pobrać informacji targowych');
        }

        // Fetch event info for header details
        const evRes = await exhibitionsAPI.getMyEvents();
        if (evRes.data?.success && Array.isArray(evRes.data.data)) {
          const evt = evRes.data.data.find((e: any) => e.id === numericId);
          if (evt) {
            setEventName(evt.name || '');
            const start = new Date(evt.startDate);
            const end = new Date(evt.endDate);
            const fmt = (d: Date) => d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
            setEventDateRange(`${fmt(start)} - ${fmt(end)}`);
            const diffDays = Math.ceil((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            setDaysUntilEvent(Math.max(0, diffDays));
          }
        }
      } catch (e) {
        setError('Błąd podczas pobierania informacji targowych');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  const handleMenuClick = (page: string) => {
    if (!eventId) return;
    if (page === 'info') {
      navigate(`/event/${eventId}/trade-info`);
      return;
    }
    if (page === 'checklist') {
      navigate(`/event/${eventId}/checklist`);
      return;
    }
  };

  return (
    <div>
      <Menu onMenuClick={handleMenuClick} onLogout={() => navigate('/login')} />
      {loading ? (
        <div style={{ padding: 24 }}>Ładowanie…</div>
      ) : error ? (
        <div style={{ padding: 24, color: '#dc3545' }}>{error}</div>
      ) : (
        <TradeInfoPage
          tradeInfo={tradeInfo}
          eventName={eventName}
          eventDateRange={eventDateRange}
          {...(daysUntilEvent !== null && daysUntilEvent !== undefined ? { daysUntilEvent } : {})}
          onDownloadPlan={(spaceId, filename) => {
            if (!eventId) return;
            tradeInfoAPI
              .downloadPlan(parseInt(eventId, 10), spaceId)
              .then((resp) => {
                const url = window.URL.createObjectURL(new Blob([resp.data]));
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              })
              .catch(() => alert('Błąd pobierania pliku.'));
          }}
        />
      )}
    </div>
  );
};

export default TradeInfoRoutePage;

