import { Box, TextField, Button, Typography } from '@mui/material';
import EventLayout from '../components/eventLayout/EventLayout';
import LeftColumn from '../components/event-left/LeftColumn';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { exhibitionsAPI, tradeInfoAPI, brandingAPI, invitationsAPI } from '../services/api';
import styles from './EventHomePage.module.scss';

// no date fields in invitations card

const EventInvitationsPage = () => {
  const { eventId } = useParams();
  const [data, setData] = useState<any | null>(null);
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [templates, setTemplates] = useState<{ id: number; title: string; invitation_type: string }[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [sent, setSent] = useState<Array<{ id: number; recipientName: string; recipientEmail: string; invitationType: string; status: string; sentAt?: string }>>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      try {
        const idNum = Number(eventId);
        const [evRes, _tradeRes, brandingRes] = await Promise.all([
          exhibitionsAPI.getById(idNum),
          tradeInfoAPI.get(idNum).catch(() => null),
          brandingAPI.getGlobal(idNum).catch(() => null),
        ]);

        const e = evRes.data;
        // trade info not used in invitations card for now

        // Resolve header image specifically for invitations: tlo_wydarzenia_logo_zaproszenia
        let headerImageUrl = '/assets/background.png';
        const files = brandingRes && brandingRes.data && brandingRes.data.success ? brandingRes.data.files : null;
        const headerFile = files && files['tlo_wydarzenia_logo_zaproszenia'];
        if (headerFile?.fileName) {
          headerImageUrl = brandingAPI.serveGlobalUrl(headerFile.fileName);
        }

        setData({
          id: String(e.id),
          eventName: e.name || '',
          headerImageUrl,
        });

        // Load invitation templates for this event
        try {
          const list = await invitationsAPI.list(idNum);
          setTemplates(list);
          if (list.length > 0) setSelectedTemplateId(list[0].id);
        } catch {}

        // Load already sent recipients
        try {
          const recipients = await invitationsAPI.recipients(idNum);
          setSent(recipients);
        } catch {}
      } catch {
        setData(null);
      }
    };
    load();
  }, [eventId]);

  const handleSend = async () => {
    if (!eventId || !selectedTemplateId) return;
    setIsSending(true);
    try {
      const idNum = Number(eventId);
      const res = await invitationsAPI.send(idNum, Number(selectedTemplateId), guestName.trim(), guestEmail.trim());
      if (res?.success) {
        // Refresh list
        const recipients = await invitationsAPI.recipients(idNum);
        setSent(recipients);
        // Clear inputs
        setGuestName('');
        setGuestEmail('');
      }
    } catch (e) {
      // noop, error shown in console by axios interceptor if needed
    } finally {
      setIsSending(false);
    }
  };

  return (
    <EventLayout
      left={<LeftColumn eventId={eventId || '0'} isDarkBg={true}/>} 
      right={
        <Box className={styles.rightContainer}>
          {data && (
            <Box
              sx={{
                width: '100%',
                maxWidth: 420,
                bgcolor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                overflow: 'hidden',
              }}
            >
              {/* Header image */}
              <Box sx={{ height: 160, overflow: 'hidden' }}>
                <img
                  src={data.headerImageUrl}
                  alt={data.eventName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
              {/* Content */}
              <Box sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#2E2E38' }}>
                  {data.eventName}
                </Typography>
                <TextField
                  label="Imię i Nazwisko gościa"
                  variant="standard"
                  fullWidth
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Adres e-mail"
                  variant="standard"
                  fullWidth
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  type="email"
                  sx={{ mb: 3 }}
                />
                {/* Invitation type selector */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#666' }}>Typ zaproszenia</Typography>
                  <TextField
                    variant="standard"
                    select
                    fullWidth
                    SelectProps={{ native: true }}
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : '')}
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </TextField>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSend}
                  disabled={isSending || !guestName.trim() || !guestEmail.trim() || !selectedTemplateId}
                >
                  {isSending ? 'Wysyłanie…' : 'Wyślij zaproszenie'}
                </Button>

                {/* Sent list */}
                {sent.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Wysłane zaproszenia</Typography>
                    {sent.map((row) => (
                      <Box key={row.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #eee' }}>
                        <Typography variant="body2" sx={{ mr: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {(row.recipientName || row.recipientEmail) + (row.recipientName ? `, ${row.invitationType}` : ` (${row.invitationType})`)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#2e7d32' }}>{row.status}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      }
      colorRight="#5a6ec8"
      colorLeft="#2E2E38"
    />
  );
};

export default EventInvitationsPage;


