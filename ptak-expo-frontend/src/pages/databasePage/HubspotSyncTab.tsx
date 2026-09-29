import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, TablePagination, Chip, Link } from '@mui/material';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomButton from '../../components/customButton/CustomButton';
import CustomField from '../../components/customField/CustomField';
import config from '../../config/config';
import styles from '../usersPage/UsersPage.module.scss';

const HUBSPOT_DEAL_URL = 'https://app-eu1.hubspot.com/contacts/139679331/record/0-3/';

interface SyncProblem {
  type: string;
  event: string;
  eventId?: number;
  deal?: string;
  dealId?: string;
  firma?: string;
  nip?: string;
  hala?: string;
  stoisko?: string;
  info: string;
}

interface SyncChange {
  created_at: string;
  hubspot_deal_id: string | null;
  old_hall: string | null;
  new_hall: string | null;
  old_stand: string | null;
  new_stand: string | null;
  company_name: string | null;
  exhibition_name: string | null;
}

interface SyncStats {
  events?: number;
  dealsChecked?: number;
  unchanged?: number;
  updated?: number;
  notAssigned?: number;
}

interface SyncState {
  enabled: boolean;
  running: boolean;
  lastRun: { mode: string; started_at: string; finished_at: string | null; stats: SyncStats | null; error: string | null } | null;
  lastFull: { started_at: string; stats: SyncStats | null; problems: SyncProblem[] | null } | null;
  changes: SyncChange[];
}

const PROBLEM_LABELS: Record<string, string> = {
  format_stoiska: 'Niepoprawny numer stoiska',
  format_hali: 'Niepoprawna hala',
  kilka_deali: 'Kilka deali z różnymi stoiskami',
  kilka_stoisk: 'Kilka stoisk w aplikacji',
  nip_hubspot: 'Brak polskiego NIP w HubSpot',
  nazwa_targow: 'Nazwa targów niezgodna z HubSpot',
};

const formatDate = (s?: string | null) => (s ? new Date(s).toLocaleString('pl-PL') : '-');
const place = (hall?: string | null, stand?: string | null) => [hall, stand].filter(Boolean).join(' / ') || '-';

const HubspotSyncTab: React.FC<{ token: string }> = ({ token }) => {
  const [state, setState] = useState<SyncState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${config.API_BASE_URL}/api/v1/admin/hubspot-sync`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Nie udało się pobrać stanu synchronizacji');
      setState(data);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const runFull = useCallback(async () => {
    setInfo('');
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/v1/admin/hubspot-sync/run`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Nie udało się uruchomić synchronizacji');
      setInfo('Uruchomiono pełną synchronizację. Potrwa około 1–2 minut – odśwież widok po tym czasie.');
      setTimeout(load, 1000);
    } catch (e: any) {
      setError(e.message);
    }
  }, [token, load]);

  const problems = useMemo(() => state?.lastFull?.problems || [], [state]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of problems) c[p.type] = (c[p.type] || 0) + 1;
    return c;
  }, [problems]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return problems.filter((p) => (!typeFilter || p.type === typeFilter) && (!s ||
      [p.event, p.deal, p.firma, p.nip, p.stoisko].some((v) => (v || '').toLowerCase().includes(s))));
  }, [problems, typeFilter, search]);

  const header = (label: string) => (
    <TableCell className={styles.tableCell}>
      <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E">{label}</CustomTypography>
    </TableCell>
  );
  const cell = (content: React.ReactNode) => (
    <TableCell className={styles.tableCellL}>
      <CustomTypography fontSize="0.875em" fontWeight={300}>{content}</CustomTypography>
    </TableCell>
  );

  if (loading && !state) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
  }

  const last = state?.lastRun;
  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {info && <Alert severity="info" sx={{ mb: 2 }}>{info}</Alert>}

      <Paper className={styles.tableContainer} sx={{ p: 2, mb: 3 }}>
        <CustomTypography fontSize="1em" fontWeight={500}>Synchronizacja hal i numerów stoisk z HubSpot</CustomTypography>
        <CustomTypography fontSize="0.8em" fontWeight={300} color="#7F8D8E">
          Dane z lejka „Dział obsługi technicznej” trafiają automatycznie do przypisań wystawców co kilka minut.
          Przenoszone są tylko wpisy jednoznaczne – pozostałe widać poniżej i trzeba je poprawić w HubSpot.
        </CustomTypography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 2, alignItems: 'center' }}>
          <CustomTypography fontSize="0.875em">
            Status: {state?.enabled ? (state.running ? 'trwa synchronizacja…' : 'włączona') : 'wyłączona'}
          </CustomTypography>
          <CustomTypography fontSize="0.875em">
            Ostatnie sprawdzenie: {formatDate(last?.finished_at || last?.started_at)}
            {last?.stats ? ` (zmienionych stoisk: ${last.stats.updated || 0})` : ''}
          </CustomTypography>
          <CustomTypography fontSize="0.875em">
            Ostatnia pełna: {formatDate(state?.lastFull?.started_at)}
            {state?.lastFull?.stats ? ` – zgodnych: ${state.lastFull.stats.unchanged || 0}, zmienionych: ${state.lastFull.stats.updated || 0}` : ''}
          </CustomTypography>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <CustomButton width="auto" height="36px" onClick={load}>Odśwież</CustomButton>
            {state?.enabled && <CustomButton width="auto" height="36px" onClick={runFull} disabled={state.running}>Synchronizuj teraz</CustomButton>}
          </Box>
        </Box>
        {last?.error && <Alert severity="warning" sx={{ mt: 2 }}>Ostatnia synchronizacja zakończyła się błędem: {last.error}</Alert>}
      </Paper>

      <CustomTypography fontSize="1em" fontWeight={500}>Do poprawienia w HubSpot ({problems.length})</CustomTypography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 2, alignItems: 'center' }}>
        <Chip label={`Wszystkie (${problems.length})`} color={!typeFilter ? 'primary' : 'default'} onClick={() => { setTypeFilter(''); setPage(0); }} />
        {Object.entries(counts).map(([type, n]) => (
          <Chip key={type} label={`${PROBLEM_LABELS[type] || type} (${n})`} color={typeFilter === type ? 'primary' : 'default'} onClick={() => { setTypeFilter(type); setPage(0); }} />
        ))}
        <Box sx={{ ml: 'auto', minWidth: 260 }}>
          <CustomField type="text" value={search} onChange={(e: any) => { setSearch(e.target.value); setPage(0); }} placeholder="Szukaj: targi, firma, NIP, stoisko" size="small" className={styles.searchField} />
        </Box>
      </Box>
      <Paper className={styles.tableContainer} sx={{ mb: 4 }}>
        <TableContainer>
          <Table size="small">
            <TableHead className={styles.tableHead}>
              <TableRow>{header('Targi')}{header('Firma / deal')}{header('Hala / stoisko w HubSpot')}{header('Problem')}</TableRow>
            </TableHead>
            <TableBody>
              {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p, i) => (
                <TableRow key={`${p.type}-${p.dealId || p.eventId}-${i}`}>
                  {cell(p.event)}
                  {cell(p.dealId
                    ? <Link href={`${HUBSPOT_DEAL_URL}${p.dealId}`} target="_blank" rel="noopener noreferrer">{p.firma || p.deal}</Link>
                    : (p.firma || '-'))}
                  {cell(p.type === 'nazwa_targow' ? '-' : place(p.hala, p.stoisko))}
                  {cell(<><strong>{PROBLEM_LABELS[p.type] || p.type}</strong><br />{p.info}</>)}
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E">Brak pozycji do poprawienia</CustomTypography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_e, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          labelRowsPerPage="Wierszy na stronie:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} z ${count}`}
        />
      </Paper>

      <CustomTypography fontSize="1em" fontWeight={500}>Ostatnie zmiany wprowadzone z HubSpot</CustomTypography>
      <Paper className={styles.tableContainer} sx={{ mt: 2 }}>
        <TableContainer>
          <Table size="small">
            <TableHead className={styles.tableHead}>
              <TableRow>{header('Data')}{header('Targi')}{header('Firma')}{header('Było')}{header('Jest')}</TableRow>
            </TableHead>
            <TableBody>
              {(state?.changes || []).map((c, i) => (
                <TableRow key={i}>
                  {cell(formatDate(c.created_at))}
                  {cell(c.exhibition_name || '-')}
                  {cell(c.hubspot_deal_id
                    ? <Link href={`${HUBSPOT_DEAL_URL}${c.hubspot_deal_id}`} target="_blank" rel="noopener noreferrer">{c.company_name || '-'}</Link>
                    : (c.company_name || '-'))}
                  {cell(place(c.old_hall, c.old_stand))}
                  {cell(place(c.new_hall, c.new_stand))}
                </TableRow>
              ))}
              {(state?.changes || []).length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E">Brak zmian</CustomTypography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default HubspotSyncTab;
