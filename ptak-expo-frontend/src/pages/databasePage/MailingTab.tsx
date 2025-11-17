import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Typography,
  Chip
} from '@mui/material';
import config from '../../config/config';

interface Exhibition {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface Exhibitor {
  id: number;
  company_name: string;
  email: string;
  contact_person: string;
}

interface MailingTabProps {
  token: string;
}

interface SendResult {
  success: boolean;
  message: string;
  data?: {
    exhibition: {
      id: number;
      name: string;
      startDate: string;
      endDate: string;
    };
    total: number;
    success: number;
    failed: number;
    failedEmails: Array<{
      email: string;
      company: string;
      error: string;
    }>;
    successfulEmails: Array<{
      email: string;
      company: string;
      password: string;
    }>;
  };
}

const MailingTab: React.FC<MailingTabProps> = ({ token }) => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<number | ''>('');
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  // Pobierz listę wystaw
  const fetchExhibitions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/v1/exhibitions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Nie udało się pobrać listy wystaw');
      }

      const data = await response.json();
      setExhibitions(data);
    } catch (err: any) {
      setError(err.message || 'Błąd podczas pobierania wystaw');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Pobierz wystawców przypisanych do wybranej wystawy
  const fetchExhibitors = useCallback(async (exhibitionId: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${config.API_BASE_URL}/api/v1/exhibitions/${exhibitionId}/exhibitors`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Nie udało się pobrać listy wystawców');
      }

      const data = await response.json();
      setExhibitors(data);
    } catch (err: any) {
      setError(err.message || 'Błąd podczas pobierania wystawców');
      setExhibitors([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchExhibitions();
  }, [fetchExhibitions]);

  const handleExhibitionChange = (exhibitionId: number) => {
    setSelectedExhibitionId(exhibitionId);
    setSendResult(null);
    if (exhibitionId) {
      fetchExhibitors(exhibitionId);
    } else {
      setExhibitors([]);
    }
  };

  const handleSendEmails = async () => {
    if (!selectedExhibitionId) {
      setError('Wybierz wystawę');
      return;
    }

    if (exhibitors.length === 0) {
      setError('Brak wystawców do wysłania emaili');
      return;
    }

    const confirmed = window.confirm(
      `Czy na pewno chcesz wysłać emaile powitalne z nowymi hasłami do ${exhibitors.length} wystawców? Ta operacja wygeneruje nowe hasła dla wszystkich wystawców przypisanych do wybranej wystawy.`
    );

    if (!confirmed) {
      return;
    }

    setSending(true);
    setError('');
    setSendResult(null);

    try {
      const response = await fetch(
        `${config.API_BASE_URL}/api/v1/bulk-emails/send-welcome-by-exhibition`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            exhibitionId: selectedExhibitionId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Błąd podczas wysyłania emaili');
      }

      setSendResult(result);
    } catch (err: any) {
      setError(err.message || 'Błąd podczas wysyłania emaili');
    } finally {
      setSending(false);
    }
  };

  const selectedExhibition = exhibitions.find(e => e.id === selectedExhibitionId);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Mailing - Wysyłka emaili powitalnych
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Ta funkcja wysyła emaile powitalne z <strong>nowymi hasłami</strong> i instrukcją obsługi do wystawców przypisanych do wybranej wystawy.
          Każdy wystawca otrzyma unikalny link do portalu wraz z danymi logowania.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Wybierz wystawę</InputLabel>
          <Select
            value={selectedExhibitionId}
            onChange={(e) => handleExhibitionChange(e.target.value as number)}
            label="Wybierz wystawę"
            disabled={loading || sending}
          >
            <MenuItem value="">
              <em>Wybierz wystawę...</em>
            </MenuItem>
            {exhibitions.map((exhibition) => (
              <MenuItem key={exhibition.id} value={exhibition.id}>
                {exhibition.name} ({new Date(exhibition.start_date).toLocaleDateString('pl-PL')} - {new Date(exhibition.end_date).toLocaleDateString('pl-PL')})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {selectedExhibitionId && exhibitors.length > 0 && !loading && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Wystawcy przypisani do wystawy: <strong>{selectedExhibition?.name}</strong>
              </Typography>
              <Chip label={`${exhibitors.length} wystawców`} color="primary" />
            </Box>

            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleSendEmails}
              disabled={sending}
              sx={{ mb: 2 }}
            >
              {sending ? 'Wysyłanie...' : 'Wyślij emaile powitalne'}
            </Button>

            {sending && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Wysyłanie emaili w toku... Proszę czekać.
                </Typography>
                <LinearProgress />
              </Box>
            )}

            <Paper>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Lp.</TableCell>
                      <TableCell>Nazwa firmy</TableCell>
                      <TableCell>Osoba kontaktowa</TableCell>
                      <TableCell>Email</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exhibitors.map((exhibitor, index) => (
                      <TableRow key={exhibitor.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{exhibitor.company_name}</TableCell>
                        <TableCell>{exhibitor.contact_person}</TableCell>
                        <TableCell>{exhibitor.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {selectedExhibitionId && exhibitors.length === 0 && !loading && (
          <Alert severity="warning">
            Brak wystawców przypisanych do wybranej wystawy.
          </Alert>
        )}

        {sendResult && (
          <Box sx={{ mt: 3 }}>
            <Alert severity={sendResult.data?.failed === 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                📊 Podsumowanie wysyłki
              </Typography>
              <Typography>
                <strong>Wystawa:</strong> {sendResult.data?.exhibition.name}
              </Typography>
              <Typography>
                <strong>Łącznie wystawców:</strong> {sendResult.data?.total}
              </Typography>
              <Typography>
                <strong>✅ Wysłano pomyślnie:</strong> {sendResult.data?.success}
              </Typography>
              <Typography>
                <strong>❌ Błędy:</strong> {sendResult.data?.failed}
              </Typography>
            </Alert>

            {sendResult.data?.failedEmails && sendResult.data.failedEmails.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" color="error" gutterBottom>
                  Błędy wysyłki ({sendResult.data.failedEmails.length}):
                </Typography>
                <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                  {sendResult.data.failedEmails.map((item, index) => (
                    <Box key={index} sx={{ mb: 1, p: 1, bgcolor: '#ffebee', borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>{item.company}</strong> ({item.email})
                      </Typography>
                      <Typography variant="caption" color="error">
                        Błąd: {item.error}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}

            {sendResult.data?.successfulEmails && sendResult.data.successfulEmails.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" color="success.main" gutterBottom>
                  ✅ Pomyślnie wysłane emaile ({sendResult.data.successfulEmails.length}):
                </Typography>
                <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                  {sendResult.data.successfulEmails.map((item, index) => (
                    <Box key={index} sx={{ mb: 1, p: 1, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>{item.company}</strong> ({item.email})
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        Hasło: {item.password}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MailingTab;

