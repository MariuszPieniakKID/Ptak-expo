import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicAPI } from '../../services/api';

const RssEventExhibitorsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await publicAPI.listExhibitorsByExhibition(Number(id));
        setRows(Array.isArray(res.exhibitors) ? res.exhibitors : []);
      } catch (e: any) {
        setError(e?.message || 'Błąd ładowania listy wystawców');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div style={{ padding: 24 }}>Ładowanie…</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/rss">← Wróć do listy wydarzeń</Link>
      </div>
      <h1>Wystawcy wydarzenia</h1>
      {rows.map((ex) => (
        <div key={ex.exhibitor_id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {ex.logo ? <img src={ex.logo} alt={ex.name} style={{ width: 80, height: 80, objectFit: 'contain' }} /> : null}
            <div>
              <h2 style={{ margin: 0 }}>{ex.name}</h2>
              <div style={{ color: '#666', fontSize: 14 }}>{ex.description || ''}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
            <div>
              <div><strong>Strona www:</strong> {ex.website ? <a href={ex.website} target="_blank" rel="noreferrer">{ex.website}</a> : '-'}</div>
              <div><strong>E-mail:</strong> {ex.contact_email || '-'}</div>
            </div>
            <div>
              <div><strong>Social Media:</strong></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(() => {
                  const socials = [];
                  if (ex.facebook) socials.push(<a key="facebook" href={ex.facebook} target="_blank" rel="noreferrer">Facebook</a>);
                  if (ex.instagram) socials.push(<a key="instagram" href={ex.instagram} target="_blank" rel="noreferrer">Instagram</a>);
                  if (ex.linkedin) socials.push(<a key="linkedin" href={ex.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>);
                  if (ex.youtube) socials.push(<a key="youtube" href={ex.youtube} target="_blank" rel="noreferrer">YouTube</a>);
                  if (ex.tiktok) socials.push(<a key="tiktok" href={ex.tiktok} target="_blank" rel="noreferrer">TikTok</a>);
                  if (ex.x) socials.push(<a key="x" href={ex.x} target="_blank" rel="noreferrer">X/Twitter</a>);
                  return socials.length > 0 ? socials : '-';
                })()}
              </div>
            </div>
            <div>
              <div><strong>Tagi (katalog):</strong></div>
              <div>{ex.catalog_tags || '-'}</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Produkty</h3>
            {Array.isArray(ex.products) && ex.products.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {ex.products.map((p: any, idx: number) => (
                  <div key={idx} style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
                    {p.img ? (
                      <div style={{ marginBottom: 8 }}>
                        <img src={p.img} alt={p.name} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6 }} />
                      </div>
                    ) : null}
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    {p.description ? <div style={{ color: '#555', fontSize: 14, marginTop: 6 }}>{p.description}</div> : null}
                    {Array.isArray(p.tags) && p.tags.length > 0 ? (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                        {p.tags.map((t: string, i: number) => (
                          <span key={i} style={{ background: '#f5f5f5', borderRadius: 999, padding: '4px 8px', fontSize: 12 }}>{t}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#777' }}>Brak produktów</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RssEventExhibitorsPage;


