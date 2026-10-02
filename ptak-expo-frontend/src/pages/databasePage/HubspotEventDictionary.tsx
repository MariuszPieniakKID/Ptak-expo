import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Autocomplete, Box, Chip, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Alert } from '@mui/material';
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

interface Exhibition {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  exhibitors_count: number;
  has_exhibitors: boolean;
}

type Filter = 'todo' | 'upcoming' | 'all';

const formatDay = (s?: string | null) => (s ? new Date(s).toLocaleDateString('pl-PL') : '');
const isUpcoming = (e: Exhibition) => {
  const end = e.end_date || e.start_date;
  return !!end && new Date(end) >= new Date(new Date().toDateString());
};
const entryName = (e: DictionaryEntry) => e.hs_label || e.hs_value;

const STOP_WORDS = new Set(['expo', 'poland', 'polska', 'warsaw', 'targi', 'tech', 'show', 'days', 'week', 'international', 'the', 'and', 'fair']);
const words = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3 && !/^\d+$/.test(w) && !STOP_WORDS.has(w));
const years = (s: string): string[] => s.match(/20\d\d/g) || [];
const compact = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '').replace(/20\d\d/g, '');

// Podobieństwo nazwy z HubSpot do wydarzenia: ta sama nazwa bez spacji i roku (przy innym roku niżej)
// albo wspólne słowa przy zgodnym roku.
const similarity = (ex: Exhibition, entry: DictionaryEntry) => {
  const name = entryName(entry);
  const exYears = years(ex.name).concat(ex.start_date ? [ex.start_date.slice(0, 4)] : []);
  const hsYears = years(name);
  const yearOk = !hsYears.length || hsYears.some((y) => exYears.includes(y));
  const a = compact(ex.name);
  const b = compact(name);
  if (a && b && (a.includes(b) || b.includes(a))) return yearOk ? 10 : 5;
  if (!yearOk) return 0;
  const exWords = new Set(words(ex.name));
  return words(name).filter((w) => exWords.has(w)).length;
};

const HubspotEventDictionary: React.FC<{ token: string; onChanged?: () => void }> = ({ token, onChanged }) => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [filter, setFilter] = useState<Filter>('todo');
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

  const byExhibition = useMemo(() => {
    const m = new Map<number, DictionaryEntry[]>();
    for (const e of entries) if (e.exhibition_id) m.set(e.exhibition_id, [...(m.get(e.exhibition_id) || []), e]);
    return m;
  }, [entries]);
  const exhibitionName = useMemo(() => new Map(exhibitions.map((e) => [e.id, e.name])), [exhibitions]);

  const save = useCallback(async (ex: Exhibition, selected: DictionaryEntry[]) => {
    setInfo('');
    setSavingId(ex.id);
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/v1/admin/hubspot-sync/dictionary/exhibition/${ex.id}`, {
        method: 'PUT', headers, body: JSON.stringify({ entryIds: selected.map((s) => s.id) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Nie udało się zapisać przypisania');
      const ids = new Set(selected.map((s) => s.id));
      const now = new Date().toISOString();
      setEntries((prev) => prev.map((e) => {
        if (ids.has(e.id) && e.exhibition_id !== ex.id) return { ...e, exhibition_id: ex.id, exhibition_name: ex.name, source: 'manual', updated_at: now };
        if (!ids.has(e.id) && e.exhibition_id === ex.id) return { ...e, exhibition_id: null, exhibition_name: null, source: 'manual', updated_at: now };
        return e;
      }));
      setInfo(selected.length
        ? `Zapisano „${ex.name}”: ${selected.map(entryName).join(', ')}. Stoiska zsynchronizują się w ciągu 1–2 minut.`
        : `Usunięto przypisania targów HubSpot dla „${ex.name}”.`);
      onChanged?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  }, [headers, onChanged]);

  const sorted = useMemo(() => {
    const upcoming = exhibitions.filter(isUpcoming).sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)));
    const past = exhibitions.filter((e) => !isUpcoming(e));
    return [...upcoming, ...past];
  }, [exhibitions]);

  const isTodo = useCallback((e: Exhibition) => isUpcoming(e) && e.has_exhibitors && !byExhibition.has(e.id), [byExhibition]);
  const counts = useMemo(() => ({
    todo: exhibitions.filter(isTodo).length,
    upcoming: exhibitions.filter(isUpcoming).length,
    all: exhibitions.length,
  }), [exhibitions, isTodo]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return sorted.filter((e) => (filter === 'all' || (filter === 'todo' ? isTodo(e) : isUpcoming(e))) && (!s ||
      e.name.toLowerCase().includes(s) || (byExhibition.get(e.id) || []).some((d) => entryName(d).toLowerCase().includes(s))));
  }, [sorted, filter, search, isTodo, byExhibition]);

  // Opcje dla wydarzenia: najpierw podpowiedzi (podobna nazwa), potem wolne, przypisane do innych targów, na końcu ukryte w HubSpot.
  const optionsFor = useCallback((ex: Exhibition) => {
    const scored = entries.map((d) => {
      const score = similarity(ex, d);
      const inactive = d.hs_hidden || d.removed_in_hs;
      const group = d.exhibition_id === ex.id ? 0 : score > 0 && !inactive ? 1 : inactive ? 4 : d.exhibition_id ? 3 : 2;
      return { d, score, group };
    });
    scored.sort((a, b) => a.group - b.group || b.score - a.score || entryName(a.d).localeCompare(entryName(b.d)));
    return { list: scored.map((x) => x.d), group: new Map(scored.map((x) => [x.d.id, x.group])) };
  }, [entries]);

  const GROUP_LABELS = ['Przypisane', 'Podpowiedzi', 'Wolne', 'Przypisane do innych targów', 'Ukryte lub usunięte w HubSpot'];

  const header = (label: string) => (
    <TableCell className={styles.tableCell}>
      <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E">{label}</CustomTypography>
    </TableCell>
  );

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <CustomTypography fontSize="1em" fontWeight={500}>Słownik targów HubSpot</CustomTypography>
        <Box sx={{ ml: 'auto' }}>
          <CustomButton width="auto" height="36px" onClick={refresh} disabled={loading}>Pobierz nowe targi z HubSpot</CustomButton>
        </Box>
      </Box>
      <CustomTypography fontSize="0.8em" fontWeight={300} color="#7F8D8E">
        Do wydarzenia w aplikacji wybierz z listy nazwy targów z pola „Udział targów” w HubSpot (można kilka). Synchronizacja stoisk działa tylko dla wydarzeń z przypisaniem.
        Na górze listy są podpowiedzi o podobnej nazwie i tym samym roku. Wydarzenia o tej samej nazwie co w HubSpot przypisują się same.
      </CustomTypography>
      {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {info && <Alert severity="info" sx={{ mt: 2 }} onClose={() => setInfo('')}>{info}</Alert>}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 2, alignItems: 'center' }}>
        <Chip label={`Do przypisania (${counts.todo})`} color={filter === 'todo' ? 'primary' : 'default'} onClick={() => { setFilter('todo'); setPage(0); }} />
        <Chip label={`Nadchodzące (${counts.upcoming})`} color={filter === 'upcoming' ? 'primary' : 'default'} onClick={() => { setFilter('upcoming'); setPage(0); }} />
        <Chip label={`Wszystkie (${counts.all})`} color={filter === 'all' ? 'primary' : 'default'} onClick={() => { setFilter('all'); setPage(0); }} />
        <Box sx={{ ml: 'auto', minWidth: 260 }}>
          <CustomField type="text" value={search} onChange={(e: any) => { setSearch(e.target.value); setPage(0); }} placeholder="Szukaj: nazwa wydarzenia lub targów w HubSpot" size="small" className={styles.searchField} />
        </Box>
      </Box>
      {filter === 'todo' && (
        <CustomTypography fontSize="0.8em" fontWeight={300} color="#7F8D8E">
          Nadchodzące wydarzenia z wystawcami, które nie mają jeszcze przypisanych targów z HubSpot.
        </CustomTypography>
      )}

      <Paper className={styles.tableContainer} sx={{ mt: 1 }}>
        {loading && !exhibitions.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead className={styles.tableHead}>
                <TableRow>{header('Wydarzenie w aplikacji')}{header('Targi w HubSpot')}{header('Przypisanie')}</TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((ex) => {
                  const assigned = byExhibition.get(ex.id) || [];
                  const { list, group } = optionsFor(ex);
                  const last = assigned.slice().sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))[0];
                  return (
                    <TableRow key={ex.id}>
                      <TableCell className={styles.tableCellL} sx={{ minWidth: 240 }}>
                        <CustomTypography fontSize="0.875em" fontWeight={400}>{ex.name}</CustomTypography>
                        <CustomTypography fontSize="0.75em" fontWeight={300} color="#7F8D8E">
                          {formatDay(ex.start_date)}{ex.end_date && ex.end_date !== ex.start_date ? ` – ${formatDay(ex.end_date)}` : ''} · wystawców: {ex.exhibitors_count}
                        </CustomTypography>
                      </TableCell>
                      <TableCell className={styles.tableCellL} sx={{ minWidth: 380 }}>
                        <Autocomplete
                          multiple
                          size="small"
                          options={list}
                          value={assigned}
                          groupBy={(o) => GROUP_LABELS[group.get(o.id) ?? 2]}
                          getOptionLabel={(o) => entryName(o)}
                          isOptionEqualToValue={(o, v) => o.id === v.id}
                          filterSelectedOptions
                          renderOption={(props, o) => (
                            <li {...props} key={o.id}>
                              <Box>
                                <CustomTypography fontSize="0.875em" fontWeight={400}>{entryName(o)}</CustomTypography>
                                {o.exhibition_id && o.exhibition_id !== ex.id && (
                                  <CustomTypography fontSize="0.75em" fontWeight={300} color="#c7353c">
                                    teraz przy: {exhibitionName.get(o.exhibition_id) || o.exhibition_name} (zostanie przeniesione)
                                  </CustomTypography>
                                )}
                              </Box>
                            </li>
                          )}
                          onChange={(_ev, v) => save(ex, v)}
                          disabled={savingId === ex.id}
                          noOptionsText="Brak targów w HubSpot"
                          renderInput={(params) => <TextField {...(params as any)} size="small" placeholder={assigned.length ? '' : 'Wybierz targi z HubSpot'} />}
                        />
                      </TableCell>
                      <TableCell className={styles.tableCellL}>
                        <CustomTypography fontSize="0.8em" fontWeight={300} color="#7F8D8E">
                          {!last ? '-' : last.source === 'auto' ? 'automatycznie (ta sama nazwa)' : `ręcznie${last.updated_by ? `: ${last.updated_by}` : ''}`}
                          {last && last.updated_at ? `, ${formatDay(last.updated_at)}` : ''}
                        </CustomTypography>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E">
                      {filter === 'todo' ? 'Wszystkie nadchodzące wydarzenia z wystawcami mają przypisane targi z HubSpot' : 'Brak wydarzeń'}
                    </CustomTypography>
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
