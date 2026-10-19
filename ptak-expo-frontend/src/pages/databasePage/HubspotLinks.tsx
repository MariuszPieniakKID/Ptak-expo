import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Autocomplete, Box, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Link, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField,
} from '@mui/material';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomButton from '../../components/customButton/CustomButton';
import CustomField from '../../components/customField/CustomField';
import HubspotDealPicker, { HubspotDeal } from '../../components/hubspotDealPicker/HubspotDealPicker';
import config from '../../config/config';
import styles from '../usersPage/UsersPage.module.scss';

interface LinkExhibition {
  id: number;
  name: string;
  start_date: string | null;
  stands: number;
  linked: number;
  in_dictionary: boolean;
}

interface Suggestion extends HubspotDeal {
  score: number;
  reasons: string[];
  certain: boolean;
}

interface LinkRow {
  participationId: number;
  exhibitorId: number;
  companyName: string;
  nip: string | null;
  hall: string | null;
  stand: string | null;
  area: number | null;
  status: 'linked' | 'certain' | 'suggested' | 'none';
  dealId?: string;
  source?: string;
  linkedBy?: string | null;
  deal?: HubspotDeal & { missing?: boolean; otherEvent?: boolean };
  sharedWith?: number;
  suggestions?: Suggestion[];
}

interface ImportChange {
  row: number;
  participationId: number;
  companyName: string;
  stand: string | null;
  oldDealId: string | null;
  dealId: string | null;
  deal?: HubspotDeal;
}

interface ImportError { row: number; companyName?: string; stand?: string | null; error: string }

const STATUS_LABELS: Record<LinkRow['status'], string> = {
  certain: 'Pewne do zatwierdzenia',
  suggested: 'Do sprawdzenia',
  none: 'Bez podpowiedzi',
  linked: 'Podpięte',
};
const SOURCE_LABELS: Record<string, string> = { auto: 'automatycznie', manual: 'ręcznie', approved: 'zatwierdzone', import: 'z Excela' };
const place = (hall?: string | null, stand?: string | null, area?: number | null) =>
  [hall, stand, area ? `${String(area).replace('.', ',')} m²` : null].filter(Boolean).join(' / ') || '-';
const dealPlace = (d: HubspotDeal) => place(d.hall || d.hallRaw, d.stand || d.standRaw, d.area);

const HubspotLinks: React.FC<{ token: string }> = ({ token }) => {
  const [exhibitions, setExhibitions] = useState<LinkExhibition[]>([]);
  const [exhibitionId, setExhibitionId] = useState<number | null>(null);
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [dealsUnlinked, setDealsUnlinked] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [statusFilter, setStatusFilter] = useState<LinkRow['status'] | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [editing, setEditing] = useState<number | null>(null);
  const [importPreview, setImportPreview] = useState<{ changes: ImportChange[]; errors: ImportError[]; file: File } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const auth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const api = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(`${config.API_BASE_URL}/api/v1/hubspot${path}`, { ...init, headers: { ...auth, ...(init?.headers || {}) } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.error || 'Błąd połączenia z HubSpot');
    return data;
  }, [auth]);

  const loadExhibitions = useCallback(async () => {
    try {
      const data = await api('/links');
      setExhibitions(data.exhibitions);
    } catch (e: any) {
      setError(e.message);
    }
  }, [api]);

  const loadRows = useCallback(async (id: number, fresh = false) => {
    setLoading(true);
    try {
      const data = await api(`/links/${id}${fresh ? '?fresh=1' : ''}`);
      setRows(data.rows);
      setDealsUnlinked((data.dealsUnlinked || []).length);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { loadExhibitions(); }, [loadExhibitions]);
  useEffect(() => { if (exhibitionId) { setPage(0); setEditing(null); loadRows(exhibitionId); } }, [exhibitionId, loadRows]);

  const refreshAll = useCallback(async () => {
    if (exhibitionId) await loadRows(exhibitionId);
    loadExhibitions();
  }, [exhibitionId, loadRows, loadExhibitions]);

  const setDeal = useCallback(async (row: LinkRow, dealId: string | null) => {
    setBusy(true);
    setInfo('');
    try {
      const data = await api(`/stands/${row.participationId}/deal`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deal: dealId }),
      });
      setEditing(null);
      setInfo(dealId ? `Podpięto transakcję do stoiska ${row.stand || ''} – ${row.companyName}` : `Odpięto transakcję od stoiska ${row.stand || ''} – ${row.companyName}`);
      if (data.warning) setError(data.warning);
      await refreshAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [api, refreshAll]);

  const approveAllCertain = useCallback(async () => {
    if (!exhibitionId) return;
    setBusy(true);
    setInfo('');
    try {
      const data = await api(`/links/${exhibitionId}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ allCertain: true }),
      });
      setInfo(`Zatwierdzono ${data.linked} powiązań${data.errors.length ? `, błędów: ${data.errors.length}` : ''}${data.warnings?.length ? `, bez przeniesienia danych: ${data.warnings.length}` : ''}.`);
      await refreshAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [api, exhibitionId, refreshAll]);

  const download = useCallback(async (path: string, fallbackName: string) => {
    setBusy(true);
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/v1/hubspot${path}`, { headers: auth });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Nie udało się pobrać pliku');
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const m = cd.match(/filename\*=UTF-8''([^;]+)/) || cd.match(/filename="([^"]+)"/);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = m && m[1] ? decodeURIComponent(m[1]) : fallbackName;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [auth]);

  const uploadImport = useCallback(async (file: File, apply: boolean) => {
    if (!exhibitionId) return;
    setBusy(true);
    setInfo('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const data = await api(`/links/${exhibitionId}/import${apply ? '?apply=1' : ''}`, { method: 'POST', body: fd });
      if (apply) {
        setImportPreview(null);
        setInfo(`Zapisano ${data.applied} powiązań z Excela${data.errors.length ? `, błędów: ${data.errors.length}` : ''}.`);
        await refreshAll();
      } else {
        setImportPreview({ changes: data.changes, errors: data.errors, file });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [api, exhibitionId, refreshAll]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => (!statusFilter || r.status === statusFilter) && (!s
      || [r.companyName, r.nip, r.stand, r.deal?.name, ...(r.suggestions || []).map((x) => x.name)].some((v) => (v || '').toLowerCase().includes(s))));
  }, [rows, statusFilter, search]);

  const header = (label: string) => (
    <TableCell className={styles.tableCell}>
      <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E">{label}</CustomTypography>
    </TableCell>
  );
  const small = (text: React.ReactNode, color = '#7F8D8E') => <CustomTypography fontSize="0.75em" fontWeight={300} color={color}>{text}</CustomTypography>;

  const selected = exhibitions.find((e) => e.id === exhibitionId) || null;

  const renderDealCell = (r: LinkRow) => {
    if (editing === r.participationId) {
      return (
        <Box sx={{ minWidth: 320 }}>
          <HubspotDealPicker token={token} exhibitionId={exhibitionId} value={null} onChange={(id) => { if (id) setDeal(r, id); }} disabled={busy} />
          <Link component="button" onClick={() => setEditing(null)} sx={{ fontSize: '0.75em', mt: 0.5 }}>anuluj</Link>
        </Box>
      );
    }
    if (r.status === 'linked' && r.deal) {
      return (
        <Box>
          <Link href={r.deal.url} target="_blank" rel="noopener noreferrer" sx={{ fontSize: '0.875em' }}>{r.deal.name || r.dealId}</Link>
          {r.deal.missing ? small('Transakcji nie ma w HubSpot – podepnij inną', '#C62828') : small(dealPlace(r.deal))}
          {r.deal.otherEvent && small(`Targi w HubSpot: ${r.deal.event || '-'}`, '#C77700')}
          {r.deal.problem && small(r.deal.problem, '#C77700')}
          {small(`${SOURCE_LABELS[r.source || ''] || ''}${r.linkedBy ? ` (${r.linkedBy})` : ''}${r.sharedWith ? ` · wspólna z ${r.sharedWith} innym stoiskiem` : ''}`)}
        </Box>
      );
    }
    if (!r.suggestions || !r.suggestions.length) return small('Brak podpowiedzi – wybierz transakcję ręcznie');
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {r.suggestions.map((s) => (
          <Box key={s.dealId} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Link href={s.url} target="_blank" rel="noopener noreferrer" sx={{ fontSize: '0.875em' }}>{s.name}</Link>
              {small(`${dealPlace(s)} · zgodne: ${s.reasons.join(' + ')}`, s.certain ? '#2E7D32' : '#7F8D8E')}
            </Box>
            <CustomButton width="auto" height="28px" onClick={() => setDeal(r, s.dealId)} disabled={busy}>Podepnij</CustomButton>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Paper className={styles.tableContainer} sx={{ p: 2, mb: 3 }}>
      <CustomTypography fontSize="1em" fontWeight={500}>Powiązania stoisk z transakcjami HubSpot</CustomTypography>
      <CustomTypography fontSize="0.8em" fontWeight={300} color="#7F8D8E">
        Stoisko z podpiętą transakcją dostaje halę, numer stoiska i metraż wyłącznie z tej transakcji – NIP i nazwa firmy nie mają już znaczenia.
        Stoiska bez transakcji są dopasowywane po staremu (NIP + słownik targów). Jedną transakcję można podpiąć do kilku stoisk.
      </CustomTypography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2, alignItems: 'center' }}>
        <Autocomplete<LinkExhibition>
          sx={{ minWidth: 380, flex: 1 }}
          options={exhibitions}
          value={selected}
          onChange={(_e, v) => setExhibitionId(v ? v.id : null)}
          getOptionLabel={(o) => `${o.name} – podpięte ${o.linked}/${o.stands}`}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderInput={(params) => <TextField {...(params as any)} size="small" placeholder="Wybierz targi" />}
        />
        {exhibitionId && (
          <>
            <CustomButton width="auto" height="36px" onClick={approveAllCertain} disabled={busy || !counts.certain}>
              Zatwierdź pewne ({counts.certain || 0})
            </CustomButton>
            <CustomButton width="auto" height="36px" onClick={() => download(`/links/${exhibitionId}/export`, 'Powiazania-HubSpot.xlsx')} disabled={busy}>Pobierz Excel</CustomButton>
            <CustomButton width="auto" height="36px" onClick={() => fileRef.current?.click()} disabled={busy}>Wgraj Excel</CustomButton>
            <CustomButton width="auto" height="36px" onClick={() => loadRows(exhibitionId, true)} disabled={busy || loading}>Odśwież z HubSpot</CustomButton>
            <input ref={fileRef} type="file" accept=".xlsx" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImport(f, false); }} />
          </>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mt: 2 }} onClose={() => setInfo('')}>{info}</Alert>}
      {selected && !selected.in_dictionary && (
        <Alert severity="warning" sx={{ mt: 2 }}>Te targi nie mają przypisania w słowniku targów, więc nie ma podpowiedzi. Możesz podpinać transakcje ręcznie.</Alert>
      )}

      {exhibitionId && (loading ? <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box> : (
        <>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 2, alignItems: 'center' }}>
            <Chip label={`Wszystkie (${rows.length})`} color={!statusFilter ? 'primary' : 'default'} onClick={() => { setStatusFilter(''); setPage(0); }} />
            {(Object.keys(STATUS_LABELS) as LinkRow['status'][]).filter((k) => counts[k]).map((k) => (
              <Chip key={k} label={`${STATUS_LABELS[k]} (${counts[k]})`} color={statusFilter === k ? 'primary' : 'default'} onClick={() => { setStatusFilter(k); setPage(0); }} />
            ))}
            {small(`Transakcji tych targów w HubSpot bez stoiska: ${dealsUnlinked}`)}
            <Box sx={{ ml: 'auto', minWidth: 260 }}>
              <CustomField type="text" value={search} onChange={(e: any) => { setSearch(e.target.value); setPage(0); }} placeholder="Szukaj: firma, NIP, stoisko" size="small" className={styles.searchField} />
            </Box>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead className={styles.tableHead}>
                <TableRow>{header('Firma')}{header('Stoisko w aplikacji')}{header('Transakcja HubSpot')}{header('')}</TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((r) => (
                  <TableRow key={r.participationId}>
                    <TableCell className={styles.tableCellL}>
                      <CustomTypography fontSize="0.875em" fontWeight={300}>{r.companyName}</CustomTypography>
                      {r.nip && small(`NIP ${r.nip}`)}
                    </TableCell>
                    <TableCell className={styles.tableCellL}><CustomTypography fontSize="0.875em" fontWeight={300}>{place(r.hall, r.stand, r.area)}</CustomTypography></TableCell>
                    <TableCell className={styles.tableCellL}>{renderDealCell(r)}</TableCell>
                    <TableCell className={styles.tableCellL} sx={{ whiteSpace: 'nowrap' }}>
                      {editing !== r.participationId && (
                        <Link component="button" onClick={() => setEditing(r.participationId)} sx={{ fontSize: '0.8em', mr: 1 }} disabled={busy}>
                          {r.status === 'linked' ? 'zmień' : 'wybierz inną'}
                        </Link>
                      )}
                      {r.status === 'linked' && editing !== r.participationId && (
                        <Link component="button" onClick={() => setDeal(r, null)} sx={{ fontSize: '0.8em', color: '#C62828' }} disabled={busy}>odepnij</Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>{small('Brak stoisk')}</TableCell></TableRow>
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
        </>
      ))}

      <Dialog open={!!importPreview} onClose={() => !busy && setImportPreview(null)} maxWidth="md" fullWidth>
        <DialogTitle>Podgląd importu z Excela</DialogTitle>
        <DialogContent>
          {importPreview && (
            <>
              <CustomTypography fontSize="0.875em">
                Zmian do zapisania: {importPreview.changes.length}{importPreview.errors.length ? `, wierszy z błędem (zostaną pominięte): ${importPreview.errors.length}` : ''}.
              </CustomTypography>
              {importPreview.errors.length > 0 && (
                <Alert severity="warning" sx={{ my: 1 }}>
                  {importPreview.errors.slice(0, 20).map((e, i) => (
                    <div key={i}>Wiersz {e.row}{e.companyName ? ` (${e.companyName}${e.stand ? `, ${e.stand}` : ''})` : ''}: {e.error}</div>
                  ))}
                  {importPreview.errors.length > 20 && <div>… i {importPreview.errors.length - 20} więcej</div>}
                </Alert>
              )}
              <Table size="small">
                <TableHead><TableRow>{header('Firma')}{header('Stoisko')}{header('Nowa transakcja')}</TableRow></TableHead>
                <TableBody>
                  {importPreview.changes.map((c) => (
                    <TableRow key={c.participationId}>
                      <TableCell>{c.companyName}</TableCell>
                      <TableCell>{c.stand || '-'}</TableCell>
                      <TableCell>
                        {c.deal ? <>{c.deal.name} {small(dealPlace(c.deal))}</> : <span style={{ color: '#C62828' }}>odpięcie transakcji</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <CustomButton width="auto" height="36px" onClick={() => setImportPreview(null)} disabled={busy}>Anuluj</CustomButton>
          <CustomButton width="auto" height="36px" onClick={() => importPreview && uploadImport(importPreview.file, true)} disabled={busy || !importPreview?.changes.length}>
            Zapisz {importPreview?.changes.length || 0} zmian
          </CustomButton>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default HubspotLinks;
