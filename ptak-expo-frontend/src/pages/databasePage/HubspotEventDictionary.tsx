import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Autocomplete, Box, Chip, CircularProgress, FormControlLabel, Paper, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Alert } from '@mui/material';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomButton from '../../components/customButton/CustomButton';
import CustomField from '../../components/customField/CustomField';
import config from '../../config/config';
import styles from '../usersPage/UsersPage.module.scss';

interface DictionaryEntry {
  id: number;
  hs_value: string;
  hs_label: string | null;
  hs_hidden: boolean;
  removed_in_hs: boolean;
  exhibition_id: number | null;
  source: 'auto' | 'manual' | null;
  updated_by: string | null;
  updated_at: string | null;
  first_seen_at: string;
  exhibition_name: string | null;
}

interface ExhibitionOption {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  has_exhibitors: boolean;
}

type Filter = 'todo' | 'assigned' | 'all';

const NEW_DAYS = 7;
const formatDay = (s?: string | null) => (s ? new Date(s).toLocaleDateString('pl-PL') : '');
const isUpcoming = (e: ExhibitionOption) => {
  const end = e.end_date || e.start_date;
  return !!end && new Date(end) >= new Date(new Date().toDateString());
};

const HubspotEventDictionary: React.FC<{ token: string; onChanged?: () => void }> = ({ token, onChanged }) => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [exhibitions, setExhibitions] = useState<ExhibitionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [filter, setFilter] = useState<Filter>('todo');
  const [showHidden, setShowHidden] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${config.API_BASE_URL}/api/v1/admin/hubspot-sync/dictionary`, { headers });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Nie udało się pobrać słownika targów');
      setEntries(data.entries);
      setExhibitions(data.exhibitions);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(async () => {
    setInfo('');
    try {
      setLoading(true);
      const res = await fetch(`${config.API_BASE_URL}/api/v1/admin/hubspot-sync/dictionary/refresh`, { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Nie udało się pobrać targów z HubSpot');
      setInfo(`Pobrano ${data.options} pozycji z HubSpot, nowych: ${data.added}, przypisanych automatycznie: ${data.autoAssigned}.`);
      await load();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }, [headers, load]);

  const assign = useCallback(async (entry: DictionaryEntry, exhibition: ExhibitionOption | null) => {
    setInfo('');
    setSavingId(entry.id);
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/v1/admin/hubspot-sync/dictionary/${entry.id}`, {
        method: 'PUT', headers, body: JSON.stringify({ exhibitionId: exhibition ? exhibition.id : null }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Nie udało się zapisać przypisania');
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? {
        ...e, exhibition_id: exhibition ? exhibition.id : null, exhibition_name: exhibition ? exhibition.name : null,
        source: 'manual', updated_at: new Date().toISOString(),
      } : e)));
      setInfo(exhibition
        ? `Przypisano „${entry.hs_label || entry.hs_value}” do „${exhibition.name}”. Stoiska zsynchronizują się w ciągu 1–2 minut.`
        : `Usunięto przypisanie „${entry.hs_label || entry.hs_value}”.`);
      onChanged?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  }, [headers, onChanged]);

  const options = useMemo(() => {
    const upcoming = exhibitions.filter(isUpcoming).sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)));
    const past = exhibitions.filter((e) => !isUpcoming(e));
    return [...upcoming, ...past];
  }, [exhibitions]);
  const byId = useMemo(() => new Map(exhibitions.map((e) => [e.id, e])), [exhibitions]);

  const visible = useMemo(() => entries.filter((e) => showHidden || (!e.hs_hidden && !e.removed_in_hs)), [entries, showHidden]);
  const counts = useMemo(() => ({
    todo: visible.filter((e) => !e.exhibition_id).length,
    assigned: visible.filter((e) => e.exhibition_id).length,
    all: visible.length,
  }), [visible]);
  const unmappedUpcoming = useMemo(() => {
    const mapped = new Set(entries.filter((e) => e.exhibition_id).map((e) => e.exhibition_id));
    return exhibitions.filter((e) => e.has_exhibitors && isUpcoming(e) && !mapped.has(e.id));
  }, [entries, exhibitions]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return visible.filter((e) => (filter === 'all' || (filter === 'todo' ? !e.exhibition_id : !!e.exhibition_id)) && (!s ||
      [e.hs_label, e.hs_value, e.exhibition_name].some((v) => (v || '').toLowerCase().includes(s))));
  }, [visible, filter, search]);

  const header = (label: string) => (
    <TableCell className={styles.tableCell}>
      <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E">{label}</CustomTypography>
    </TableCell>
  );
  const isNew = (e: DictionaryEntry) => Date.now() - new Date(e.first_seen_at).getTime() < NEW_DAYS * 86400000;

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <CustomTypography fontSize="1em" fontWeight={500}>Słownik targów HubSpot</CustomTypography>
        <Box sx={{ ml: 'auto' }}>
          <CustomButton width="auto" height="36px" onClick={refresh} disabled={loading}>Pobierz nowe targi z HubSpot</CustomButton>
        </Box>
      </Box>
      <CustomTypography fontSize="0.8em" fontWeight={300} color="#7F8D8E">
        Przypisz nazwę targów z pola „Udział targów” w HubSpot do wydarzenia w aplikacji. Synchronizacja stoisk działa tylko dla przypisanych targów.
        Nowe targi z HubSpot dopisują się automatycznie przy każdej synchronizacji, a te o identycznej nazwie przypisują się same.
      </CustomTypography>
      {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {info && <Alert severity="info" sx={{ mt: 2 }} onClose={() => setInfo('')}>{info}</Alert>}
      {unmappedUpcoming.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Nadchodzące targi z wystawcami bez przypisania w słowniku ({unmappedUpcoming.length}): {unmappedUpcoming.map((e) => e.name).join(', ')}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 2, alignItems: 'center' }}>
        <Chip label={`Do przypisania (${counts.todo})`} color={filter === 'todo' ? 'primary' : 'default'} onClick={() => { setFilter('todo'); setPage(0); }} />
        <Chip label={`Przypisane (${counts.assigned})`} color={filter === 'assigned' ? 'primary' : 'default'} onClick={() => { setFilter('assigned'); setPage(0); }} />
        <Chip label={`Wszystkie (${counts.all})`} color={filter === 'all' ? 'primary' : 'default'} onClick={() => { setFilter('all'); setPage(0); }} />
        <FormControlLabel
          sx={{ ml: 1 }}
          control={<Switch size="small" checked={showHidden} onChange={(e) => { setShowHidden(e.target.checked); setPage(0); }} />}
          label={<CustomTypography fontSize="0.8em" fontWeight={300}>Pokaż ukryte i usunięte w HubSpot</CustomTypography>}
        />
        <Box sx={{ ml: 'auto', minWidth: 260 }}>
          <CustomField type="text" value={search} onChange={(e: any) => { setSearch(e.target.value); setPage(0); }} placeholder="Szukaj: nazwa w HubSpot lub w aplikacji" size="small" className={styles.searchField} />
        </Box>
      </Box>

      <Paper className={styles.tableContainer}>
        {loading && !entries.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead className={styles.tableHead}>
                <TableRow>{header('Targi w HubSpot')}{header('Targi w aplikacji')}{header('Przypisanie')}</TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className={styles.tableCellL}>
                      <CustomTypography fontSize="0.875em" fontWeight={400}>{e.hs_label || e.hs_value}</CustomTypography>
                      {e.hs_label && e.hs_label !== e.hs_value && (
                        <CustomTypography fontSize="0.75em" fontWeight={300} color="#7F8D8E">wartość: {e.hs_value}</CustomTypography>
                      )}
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        {isNew(e) && <Chip size="small" color="success" label="nowe" />}
                        {e.hs_hidden && <Chip size="small" label="ukryte w HubSpot" />}
                        {e.removed_in_hs && <Chip size="small" color="warning" label="usunięte z HubSpot" />}
                      </Box>
                    </TableCell>
                    <TableCell className={styles.tableCellL} sx={{ minWidth: 340 }}>
                      <Autocomplete
                        size="small"
                        options={options}
                        value={e.exhibition_id ? byId.get(e.exhibition_id) || null : null}
                        groupBy={(o) => (isUpcoming(o) ? 'Nadchodzące' : 'Zakończone')}
                        getOptionLabel={(o) => `${o.name}${o.start_date ? ` (${formatDay(o.start_date)})` : ''}`}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        onChange={(_ev, v) => assign(e, v)}
                        disabled={savingId === e.id}
                        noOptionsText="Brak wydarzeń"
                        renderInput={(params) => <TextField {...(params as any)} size="small" placeholder="Wybierz wydarzenie" />}
                      />
                    </TableCell>
                    <TableCell className={styles.tableCellL}>
                      <CustomTypography fontSize="0.8em" fontWeight={300} color="#7F8D8E">
                        {!e.source ? '-' : e.source === 'auto' ? 'automatycznie (ta sama nazwa)' : `ręcznie${e.updated_by ? `: ${e.updated_by}` : ''}`}
                        {e.source && e.updated_at ? `, ${formatDay(e.updated_at)}` : ''}
                      </CustomTypography>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E">Brak pozycji</CustomTypography>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
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
    </Box>
  );
};

export default HubspotEventDictionary;
