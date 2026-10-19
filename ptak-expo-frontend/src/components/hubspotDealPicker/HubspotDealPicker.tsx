import React, { useEffect, useRef, useState } from 'react';
import { Alert, Autocomplete, Box, CircularProgress, IconButton, Link, TextField, Tooltip } from '@mui/material';
import CustomTypography from '../customTypography/CustomTypography';
import config from '../../config/config';

export interface HubspotDeal {
  dealId: string;
  url: string;
  name: string;
  event: string;
  hallRaw: string;
  standRaw: string;
  hall: string | null;
  stand: string | null;
  area: number | null;
  problem: string | null;
  companies?: { name: string; nip: string }[];
}

interface Props {
  token: string;
  exhibitionId?: number | null;
  value: string | null;
  onChange: (dealId: string | null, deal: HubspotDeal | null) => void;
  disabled?: boolean;
}

const looksLikeDealRef = (s: string) => /record\/0-3\/\d{5,}|\/deals?\/\d{5,}|^\d{5,}$/i.test(s.trim());
const dealLine = (d: HubspotDeal) => [d.hall || d.hallRaw, d.stand || d.standRaw, d.area ? `${String(d.area).replace('.', ',')} m²` : null].filter(Boolean).join(' / ');

// Pole „Transakcja HubSpot”: wklejony link/numer albo wyszukiwanie po firmie lub numerze stoiska.
const HubspotDealPicker: React.FC<Props> = ({ token, exhibitionId, value, onChange, disabled }) => {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<HubspotDeal[]>([]);
  const [preview, setPreview] = useState<HubspotDeal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const api = async (path: string) => {
    const res = await fetch(`${config.API_BASE_URL}/api/v1/hubspot${path}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.error || 'Błąd połączenia z HubSpot');
    return data;
  };

  useEffect(() => {
    if (!value) { setPreview(null); return; }
    if (preview && preview.dealId === value) return;
    let cancelled = false;
    setLoading(true);
    api(`/deal?ref=${encodeURIComponent(value)}`)
      .then((d) => { if (!cancelled) { setPreview(d.deal); setError(''); } })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const pick = (d: HubspotDeal) => {
    setPreview(d);
    setInput('');
    setOptions([]);
    setError('');
    onChange(d.dealId, d);
  };

  const handleInput = (text: string) => {
    setInput(text);
    setError('');
    if (timer.current) clearTimeout(timer.current);
    const q = text.trim();
    if (q.length < 2) { setOptions([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (looksLikeDealRef(q)) {
          const d = await api(`/deal?ref=${encodeURIComponent(q)}`);
          pick(d.deal);
        } else {
          const d = await api(`/deals/search?q=${encodeURIComponent(q)}${exhibitionId ? `&exhibitionId=${exhibitionId}` : ''}`);
          setOptions(d.deals);
          if (!d.deals.length) setError('Nie znaleziono transakcji – wklej link z HubSpot');
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  if (value) {
    return (
      <Box sx={{ border: '1px solid #D7D9DD', borderRadius: '8px', p: 1.5, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <CustomTypography fontSize="0.75em" fontWeight={300} color="#7F8D8E">Transakcja HubSpot</CustomTypography>
          {loading && !preview ? <CircularProgress size={16} /> : preview ? (
            <>
              <Link href={preview.url} target="_blank" rel="noopener noreferrer" sx={{ fontSize: '0.875em', fontWeight: 500 }}>{preview.name || preview.dealId}</Link>
              <CustomTypography fontSize="0.8em" fontWeight={300}>
                {dealLine(preview) || 'brak hali i stoiska w transakcji'}
                {preview.companies && preview.companies.length ? ` · ${preview.companies.map((c) => c.name).join(', ')}` : ''}
              </CustomTypography>
              {preview.event && <CustomTypography fontSize="0.75em" fontWeight={300} color="#7F8D8E">Targi w HubSpot: {preview.event}</CustomTypography>}
              {preview.problem && <Alert severity="warning" sx={{ mt: 1, py: 0 }}>{preview.problem} – dane stoiska nie zostaną przeniesione, dopóki tego nie poprawisz w HubSpot.</Alert>}
            </>
          ) : (
            <CustomTypography fontSize="0.875em">{value}</CustomTypography>
          )}
          {error && <Alert severity="error" sx={{ mt: 1, py: 0 }}>{error}</Alert>}
        </Box>
        {!disabled && (
          <Tooltip title="Odepnij transakcję">
            <IconButton size="small" onClick={() => { setPreview(null); onChange(null, null); }} aria-label="Odepnij transakcję">✕</IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Autocomplete<HubspotDeal, false, false, true>
        freeSolo
        disabled={!!disabled}
        options={options}
        filterOptions={(o) => o}
        loading={loading}
        inputValue={input}
        onInputChange={(_e, v, reason) => { if (reason === 'input' || reason === 'clear') handleInput(v); }}
        onChange={(_e, v) => { if (v && typeof v !== 'string') pick(v); }}
        getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
        isOptionEqualToValue={(a, b) => a.dealId === b.dealId}
        renderOption={(props, o) => (
          <li {...props} key={o.dealId}>
            <Box>
              <CustomTypography fontSize="0.875em" fontWeight={500}>{o.name}</CustomTypography>
              <CustomTypography fontSize="0.75em" fontWeight={300} color="#7F8D8E">
                {[dealLine(o), (o.companies || []).map((c) => c.name).join(', '), o.event].filter(Boolean).join(' · ')}
              </CustomTypography>
            </Box>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...(params as any)}
            size="small"
            label="Transakcja HubSpot"
            placeholder="Wklej link do transakcji albo wpisz firmę lub numer stoiska"
            InputProps={{ ...(params.InputProps as any), endAdornment: <>{loading ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</> }}
          />
        )}
      />
      {error && <CustomTypography fontSize="0.75em" color="#C62828">{error}</CustomTypography>}
    </Box>
  );
};

export default HubspotDealPicker;
