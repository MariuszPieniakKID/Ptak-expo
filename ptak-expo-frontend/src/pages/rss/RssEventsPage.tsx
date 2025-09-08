import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../../services/api';

const RssEventsPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await publicAPI.listExhibitions();
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (e: any) {
        setError(e?.message || 'Błąd ładowania listy wydarzeń');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Ładowanie…</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h1>Wydarzenia – RSS (Admin Front)</h1>
      <p>
        Kanał RSS: <a href={publicAPI.rssUrl()} target="_blank" rel="noreferrer">{publicAPI.rssUrl()}</a>
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {rows.map((ev: any) => (
          <li key={ev.id} style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline' }}>
              <div>
                <h3 style={{ margin: '0 0 4px' }}>{ev.name}</h3>
                <div style={{ color: '#666', fontSize: 14 }}>
                  {new Date(ev.start_date).toLocaleDateString()} – {new Date(ev.end_date).toLocaleDateString()} {ev.location ? `• ${ev.location}` : ''}
                </div>
              </div>
              <div>
                <Link to={`/rss/event/${ev.id}`}>Zobacz wystawców</Link>
              </div>
            </div>
            {ev.description ? (
              <p style={{ marginTop: 8, color: '#333' }}>{ev.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RssEventsPage;


