import { Box, TextField, Button, Typography, IconButton } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import EventLayout from '../components/eventLayout/EventLayout';
import LeftColumn from '../components/event-left/LeftColumn';
import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { exhibitionsAPI, brandingAPI, invitationsAPI, marketingAPI, BenefitItem, type InvitationTemplate } from '../services/api';
import api from '../services/api';
import IconEmail from '../assets/email.png';
import { getChecklist } from '../services/checkListApi';
import styles from './EventHomePage.module.scss';
import BulkSendModal from '../components/invitations/BulkSendModal';

// no date fields in invitations card

const EventInvitationsPage = () => {
  const { eventId } = useParams();
  const [data, setData] = useState<any | null>(null);
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [templates, setTemplates] = useState<InvitationTemplate[]>([]);
  const [benefits, setBenefits] = useState<BenefitItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [sent, setSent] = useState<Array<{ id: number; recipientName: string; recipientEmail: string; invitationType: string; status: string; sentAt?: string }>>([]);
  const [isSending, setIsSending] = useState(false);
  const [bulkOpen, setBulkOpen] = useState<boolean>(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [editorHtml, setEditorHtml] = useState<string>('');
  const isFormValid = Boolean(guestName.trim() && guestEmail.trim() && selectedTemplateId);

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      try {
        const idNum = Number(eventId);
        const [evRes, brandingRes, benefitsRes] = await Promise.all([
          exhibitionsAPI.getById(idNum),
          brandingAPI.getGlobal(idNum).catch(() => null),
          marketingAPI.listByExhibition(idNum).catch(() => []),
        ]);

        const e = evRes.data;
        // trade info not used in invitations card for now

        // Resolve header image for invitations (right side) and catalog logo (left side)
        let headerImageUrl = '/assets/background.png';
        const files = brandingRes && brandingRes.data && brandingRes.data.success ? brandingRes.data.files : null;
        const headerFile = files && files['tlo_wydarzenia_logo_zaproszenia'];
        if (headerFile?.fileName) headerImageUrl = brandingAPI.serveGlobalUrl(headerFile.fileName);
        let catalogLogoUrl: string | null = null;
        try {
          const cl = await getChecklist(idNum);
          const l = cl?.companyInfo?.logo || null;
          if (l && typeof l === 'string' && l.trim().length > 0) catalogLogoUrl = l;
        } catch {}

        setData({
          id: String(e.id),
          eventName: e.name || '',
          headerImageUrl,
          catalogLogoUrl,
        });
        setBenefits(Array.isArray(benefitsRes) ? benefitsRes : []);

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
        
        // Load invitation limit for this exhibitor
        try {
          const meRes = await api.get('/api/v1/exhibitors/me');
          const exhibitorId = meRes.data?.id;
          if (exhibitorId) {
            const limit = await invitationsAPI.getLimit(exhibitorId, idNum);
            setInvitesLimit(limit);
          }
        } catch {
          setInvitesLimit(50); // Default fallback
        }
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
      const res = await invitationsAPI.send(idNum, Number(selectedTemplateId), guestName.trim(), guestEmail.trim(), previewHtml || undefined);
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

  const handlePreview = async () => {
    if (!eventId || !selectedTemplateId || !isFormValid) return;
    try {
      // Try inline fields from list (avoids extra request)
      let tpl = templates.find(t => t.id === selectedTemplateId) as any;
      if (!tpl) {
        // Fallback: fetch full template by id
        tpl = await invitationsAPI.getById(Number(selectedTemplateId));
      }
      if (!tpl) { setPreviewHtml(''); return; }
      const greeting = (tpl.greeting || '').trim();
      const namePart = (guestName || '').trim();
      const greetingLine = greeting ? `${greeting}${namePart ? ' ' + namePart : ''},` : (namePart ? `${namePart},` : '');
      const contentHtml = (tpl.content || '').trim();
      const companyInfo = (tpl.company_info || '').trim();
      const contactBlock = [tpl.contact_person, tpl.contact_email, tpl.contact_phone].filter(Boolean).join(' • ');
      // Build special offers block from IDs in tpl.special_offers (comma-separated IDs)
      const offersBlock = (() => {
        const raw = tpl.special_offers;
        const ids: number[] = Array.isArray(raw)
          ? raw
          : (typeof raw === 'string' ? raw.split(',').map((s: string) => Number(s.trim())).filter((n) => !Number.isNaN(n)) : []);
        const items = ids
          .map((id: number) => benefits.find((b) => b.id === id))
          .filter(Boolean) as BenefitItem[];
        if (items.length === 0) return '';
        const list = items.map((b) => `<li><strong>${b.title}</strong>${b.description ? ' – ' + b.description : ''}</li>`).join('');
        return `<h4>Oferta specjalna:</h4><ul>${list}</ul>`;
      })();

      const headerImgHtml = data?.headerImageUrl ? `<div style='height:160px;overflow:hidden;margin-bottom:16px;'><img alt='header' src='${data.headerImageUrl}' style='width:100%;height:100%;object-fit:cover;'/></div>` : '';

      const html = `<!doctype html><html><head><meta charset='utf-8'/></head><body style='font-family:Arial,sans-serif;color:#333;line-height:1.5;'>${headerImgHtml}
        ${greetingLine ? `<p>${greetingLine}</p>` : ''}
        ${contentHtml ? `<div>${contentHtml.replace(/\n/g, '<br/>')}</div>` : ''}
        ${tpl.booth_info ? `<p style='margin-top:12px;'><strong>Stoisko:</strong> ${tpl.booth_info}</p>` : ''}
        ${offersBlock}
        ${companyInfo ? `<p style='margin-top:16px;'>${companyInfo.replace(/\n/g, '<br/>')}</p>` : ''}
        ${contactBlock ? `<p style='margin-top:8px;color:#555;'>${contactBlock}</p>` : ''}
      </body></html>`;
      setEditorHtml(html);
      setPreviewHtml(html);
      setShowPreview(true);
    } catch (e) {
      console.warn('Preview build failed', e);
      setPreviewHtml('');
    }
  };

  const [invitesLimit, setInvitesLimit] = useState<number>(50);
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const invitedCount = sent.length;
  const vipTemplate = Array.isArray(templates) ? templates.find(t => (t as any).vip_value && String((t as any).vip_value).trim().length > 0) : undefined as any;
  const vipValue: string | undefined = vipTemplate ? String((vipTemplate as any).vip_value) : undefined;
  const openBulk = () => setBulkOpen(true);
  const closeBulk = () => setBulkOpen(false);

  // Initialize editor content once when preview opens
  useEffect(() => {
    if (showPreview && editorRef.current && editorRef.current.innerHTML === '' && editorHtml) {
      editorRef.current.innerHTML = editorHtml;
    }
  }, [showPreview, editorHtml]);

  // Toolbar actions for contentEditable editor
  const exec = (cmd: string, val?: string) => {
    if (editorRef.current) editorRef.current.focus();
    try { document.execCommand(cmd, false, val); } catch {}
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setEditorHtml(html);
      setPreviewHtml(html);
    }
  };
  const onInsertLink = () => {
    const url = window.prompt('Wprowadź adres URL', 'https://');
    if (url) exec('createLink', url);
  };
  const onInsertEmoji = (emoji: string) => exec('insertText', emoji);

  return (
    <EventLayout
      left={<LeftColumn eventId={eventId || '0'} isDarkBg={true}/>} 
      right={
        <Box className={styles.rightContainer}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
            {data && (
              <Box
                sx={{
                  flex: '1 1 620px',
                  minWidth: 520,
                  bgcolor: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Split header: left (catalog logo), right (branding invitation header) */}
                <Box sx={{ height: 160, display: 'flex', overflow: 'hidden' }}>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff' }}>
                    {data.catalogLogoUrl ? (
                      <img src={data.catalogLogoUrl} alt="Logo" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                    ) : (
                      <img src="/assets/logo192.png" alt="Logo" style={{ maxWidth: '60%', maxHeight: '60%', objectFit: 'contain' }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <img
                      src={data.headerImageUrl}
                      alt={data.eventName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                </Box>
                {/* Content */}
                <Box sx={{ p: 2.5, flex: '1 1 auto' }}>
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
                    onClick={handlePreview}
                    disabled={!isFormValid}
                  >
                    Sprawdź wiadomość
                  </Button>

                  {showPreview && (
                    <Box sx={{ mt: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Podgląd wiadomości – edycja 1:1</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                        <IconButton aria-label="Pogrubienie" size="small" onClick={() => exec('bold')} sx={{ p: 0.5, border: '1px solid #e5e7eb', borderRadius: 1, color: '#2E2E38' }}>
                          <FormatBoldIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton aria-label="Kursywa" size="small" onClick={() => exec('italic')} sx={{ p: 0.5, border: '1px solid #e5e7eb', borderRadius: 1, color: '#2E2E38' }}>
                          <FormatItalicIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton aria-label="Wstaw link" size="small" onClick={onInsertLink} sx={{ p: 0.5, border: '1px solid #e5e7eb', borderRadius: 1, color: '#2E2E38' }}>
                          <InsertLinkIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton aria-label="Wstaw emotkę" size="small" onClick={() => onInsertEmoji('🙂')} sx={{ p: 0.5, border: '1px solid #e5e7eb', borderRadius: 1, color: '#2E2E38' }}>
                          <EmojiEmotionsIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={() => {
                          if (editorRef.current) {
                            const html = editorRef.current.innerHTML;
                            setEditorHtml(html);
                            setPreviewHtml(html);
                          }
                        }}
                        style={{
                          minHeight: 240,
                          border: '1px solid #ddd',
                          borderRadius: 8,
                          padding: 12,
                        }}
                      />
                    </Box>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 1 }}
                    onClick={handleSend}
                    disabled={isSending || !guestName.trim() || !guestEmail.trim() || !selectedTemplateId}
                  >
                    {isSending ? 'Wysyłanie…' : 'Wyślij zaproszenie'}
                  </Button>

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 1 }}
                    color="secondary"
                    onClick={openBulk}
                    disabled={!selectedTemplateId}
                  >
                    Wyślij masowo
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

            {/* Dark summary box aligned to the right, full height of invitations module */}
            <Box
              sx={{
                flex: '0 0 280px',
                bgcolor: '#2f2f35',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                color: '#fff',
                p: 2.5,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ width: 24, height: 24, mr: 1 }}>
                  <img alt="ikona koperty" src={IconEmail} style={{ width: 24, height: 24 }} />
                </Box>
                <Box sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  <span>Wysłane</span><br />
                  <span>zaproszenia</span>
                  <span style={{ marginLeft: 8, fontWeight: 400 }}>
                    ({invitedCount} <span style={{ color: '#A7A7A7' }}>/ {invitesLimit}</span>)
                  </span>
                </Box>
              </Box>
              <Box sx={{ mt: 1.5, fontWeight: 700, color: '#fff' }}>Biznes Priority Pass</Box>
              {vipValue && vipValue.trim().length > 0 && (
                <Box sx={{ color: '#D7D9DD', mb: 1.5 }}>bilet o wartości {vipValue}</Box>
              )}
              <Box sx={{ flex: '1 1 auto' }} />
            </Box>
          </Box>
          <BulkSendModal
            isOpen={bulkOpen}
            onClose={closeBulk}
            exhibitionId={Number(eventId)}
            templateId={Number(selectedTemplateId) as number}
            {...(selectedTemplate?.title ? { templateTitle: selectedTemplate.title } : {})}
            {...(selectedTemplate?.invitation_type ? { invitationType: selectedTemplate.invitation_type } : {})}
            previewHtml={previewHtml}
            onFinished={() => {
              // reload recipients list after bulk send
              if (eventId) {
                invitationsAPI.recipients(Number(eventId)).then(setSent).catch(() => {});
              }
              closeBulk();
            }}
          />
        </Box>
      }
      colorRight="#5a6ec8"
      colorLeft="#2E2E38"
    />
  );
};

export default EventInvitationsPage;


