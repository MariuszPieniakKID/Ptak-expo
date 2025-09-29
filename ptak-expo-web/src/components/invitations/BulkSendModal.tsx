import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Alert,
  LinearProgress,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { invitationsAPI } from '../../services/api';

type BulkSendModalProps = {
  isOpen: boolean;
  onClose: () => void;
  exhibitionId: number;
  templateId: number;
  templateTitle?: string;
  invitationType?: string;
  previewHtml?: string; // opcjonalny HTML z podglądu
  onFinished?: (result: { total: number; success: number; failed: number }) => void;
};

type ParsedRow = {
  fullName: string;
  email: string;
  status: 'pending' | 'sending' | 'success' | 'error';
  error?: string;
};

const normalize = (s: string) => s.normalize('NFKD').toLowerCase().trim();

function detectDelimiter(headerLine: string): ',' | ';' {
  const comma = (headerLine.match(/,/g) || []).length;
  const semi = (headerLine.match(/;/g) || []).length;
  return semi > comma ? ';' : ',';
}

function splitCsvLine(line: string, delimiter: ',' | ';'): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map(s => s.trim());
}

function parseCsv(text: string): { rows: ParsedRow[]; error?: string } {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], error: 'Plik jest pusty' };
  const delimiter = detectDelimiter(lines[0]);
  const header = splitCsvLine(lines[0], delimiter).map(h => normalize(h));

  const idxName = header.findIndex(h => h === normalize('Imię i nazwisko gościa') || h === normalize('imię i nazwisko gościa'));
  const idxEmail = header.findIndex(h => h === normalize('adres-email') || h === normalize('adres email') || h === 'email');
  if (idxName === -1 || idxEmail === -1) {
    return { rows: [], error: "Nagłówki muszą zawierać kolumny 'Imię i nazwisko gościa' oraz 'adres-email'" };
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], delimiter);
    const fullName = (cols[idxName] || '').trim();
    const email = (cols[idxEmail] || '').trim();
    if (!fullName && !email) continue;
    if (!emailRe.test(email)) {
      rows.push({ fullName, email, status: 'error', error: 'Nieprawidłowy e-mail' });
    } else {
      rows.push({ fullName, email, status: 'pending' });
    }
  }
  return { rows };
}

const BulkSendModal: React.FC<BulkSendModalProps> = ({
  isOpen,
  onClose,
  exhibitionId,
  templateId,
  templateTitle,
  invitationType,
  previewHtml,
  onFinished,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [parseError, setParseError] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [usePreviewOverride, setUsePreviewOverride] = useState(false);

  const stats = useMemo(() => {
    const total = rows.length;
    let valid = 0, invalid = 0, success = 0, failed = 0, sendingCnt = 0;
    rows.forEach(r => {
      if (r.status === 'error') invalid++;
      else valid++;
      if (r.status === 'success') success++;
      if (r.status === 'error') failed++;
      if (r.status === 'sending') sendingCnt++;
    });
    return { total, valid, invalid, success, failed, sending: sendingCnt };
  }, [rows]);

  const handlePickFile = () => inputRef.current?.click();
  const handleDownloadTemplate = () => {
    const header = 'Imię i nazwisko gościa,adres-email\n';
    const example = 'Jan Kowalski,jan.kowalski@example.com\n';
    const csv = header + example;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wzor-zaproszenia.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const parsed = parseCsv(text);
        if (parsed.error) {
          setParseError(parsed.error);
          setRows([]);
        } else {
          setParseError('');
          setRows(parsed.rows);
        }
      } catch (err: any) {
        setParseError('Nie udało się odczytać pliku CSV');
        setRows([]);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSendAll = useCallback(async () => {
    const toSendIdx = rows.map((r, idx) => ({ r, idx })).filter(({ r }) => r.status === 'pending');
    if (toSendIdx.length === 0) return;
    setSending(true);
    setProgress(0);
    const total = toSendIdx.length;
    let success = 0, failed = 0;
    for (let i = 0; i < total; i++) {
      const { idx, r } = toSendIdx[i];
      setRows(prev => prev.map((row, j) => {
        if (j !== idx) return row;
        const { error: _ignored, ...rest } = row;
        return { ...rest, status: 'sending' };
      }));
      try {
        const res = await invitationsAPI.send(
          exhibitionId,
          templateId,
          r.fullName || '',
          r.email,
          usePreviewOverride && previewHtml ? previewHtml : undefined
        );
        if (res && res.success) {
          success++;
          setRows(prev => prev.map((row, j) => (j === idx ? { ...row, status: 'success' } : row)));
        } else {
          failed++;
          const msg = (res && res.message) ? res.message : 'Błąd wysyłki';
          setRows(prev => prev.map((row, j) => (j === idx ? { ...row, status: 'error', error: msg } : row)));
        }
      } catch (e: any) {
        failed++;
        setRows(prev => prev.map((row, j) => (j === idx ? { ...row, status: 'error', error: e?.message || 'Błąd wysyłki' } : row)));
      }
      setProgress(Math.round(((i + 1) / total) * 100));
    }
    setSending(false);
    onFinished && onFinished({ total, success, failed });
  }, [rows, exhibitionId, templateId, onFinished]);

  const handleClose = () => {
    if (sending) return;
    setRows([]);
    setParseError('');
    setProgress(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="md" sx={{
      '& .MuiPaper-root': {
        backgroundColor: '#f5f6f7',
        borderRadius: '20px',
        maxWidth: '900px',
        padding: '24px 32px',
      },
    }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" fontWeight={600}>Wyślij masowo zaproszenia</Typography>
        <Box sx={{ marginLeft: 'auto' }}>
          <IconButton onClick={handleClose} disabled={sending}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          {invitationType ? <Chip label={`Typ: ${invitationType}`} /> : null}
          {templateTitle ? <Chip label={`Szablon: ${templateTitle}`} /> : null}
          <Chip label={`ID szablonu: ${templateId}`} />
        </Box>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={usePreviewOverride}
                onChange={(e) => setUsePreviewOverride(e.target.checked)}
                disabled={!previewHtml}
              />
            }
            label="Użyj bieżącego podglądu jako treści wiadomości"
          />
          {!previewHtml && (
            <Typography variant="caption" sx={{ color: '#888' }}>
              Podgląd nie jest dostępny – najpierw przygotuj i zapisz podgląd na stronie.
            </Typography>
          )}
        </Box>

        {parseError && <Alert severity="error" sx={{ mb: 2 }}>{parseError}</Alert>}

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={handlePickFile} disabled={sending} sx={{ minWidth: 220 }}>
            Wybierz plik CSV
          </Button>
          <input ref={inputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleFileChange} />
          <Button variant="contained" color="secondary" onClick={handleDownloadTemplate} disabled={sending} sx={{ minWidth: 200 }}>
            Pobierz wzór CSV
          </Button>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Wymagane kolumny: 'Imię i nazwisko gościa', 'adres-email' (CSV, separator przecinek lub średnik)
          </Typography>
        </Box>

        {rows.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 3, mb: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2">Wiersze: {stats.total}</Typography>
              <Typography variant="body2" color="success.main">Poprawne: {stats.valid}</Typography>
              <Typography variant="body2" color="error.main">Błędne: {stats.invalid}</Typography>
              <Typography variant="body2">Wysłane: {stats.success}</Typography>
              <Typography variant="body2">Błędy wysyłki: {stats.failed}</Typography>
            </Box>
            {sending && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            )}
            <Box sx={{ maxHeight: 320, overflow: 'auto', borderRadius: '12px', border: '1px solid #E0E3E7', background: '#fff' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Imię i nazwisko</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Błąd</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{r.fullName}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>
                        {r.status === 'pending' && <Chip label="oczekuje" size="small" />}
                        {r.status === 'sending' && <Chip label="wysyłanie" color="info" size="small" />} 
                        {r.status === 'success' && <Chip label="wysłane" color="success" size="small" />}
                        {r.status === 'error' && <Chip label="błąd" color="error" size="small" />}
                      </TableCell>
                      <TableCell>{r.error || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleClose} disabled={sending} sx={{ minWidth: 160 }}>
          Zamknij
        </Button>
        <Button variant="contained" onClick={handleSendAll} disabled={sending || rows.filter(r => r.status === 'pending').length === 0} sx={{ minWidth: 200 }}>
          Wyślij masowo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkSendModal;


