import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomButton from '../../components/customButton/CustomButton';
import CustomField from '../../components/customField/CustomField';
import { 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  CircularProgress, 
  Alert, 
  TablePagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent
} from '@mui/material';

import { ReactComponent as ArrowUp } from '../../assets/arrowUpIcon.svg';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import { 
  fetchAllInvitations, 
  exportInvitationsCSV, 
  InvitationRecipient,
  InvitationsFilters,
  fetchExhibitors,
  fetchExhibitions,
  Exhibitor,
  Exhibition
} from '../../services/api';

const InvitationsTab: React.FC = () => {
  const [invitations, setInvitations] = useState<InvitationRecipient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Summary stats
  const [summary, setSummary] = useState({
    totalInvitations: 0,
    sent: 0,
    opened: 0,
    accepted: 0,
    pending: 0,
    uniqueExhibitors: 0,
    uniqueExhibitions: 0
  });

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<string>('');
  const [selectedExhibitorId, setSelectedExhibitorId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  
  const { token } = useAuth();

  // Load invitations with filters
  const loadInvitations = useCallback(async (): Promise<void> => {
    if (!token) {
      setError('Brak autoryzacji. Proszę się zalogować.');
      return;
    }

    try {
      setLoading(true);
      const filters: InvitationsFilters = {
        sortBy: 'sent_at',
        sortOrder: sortOrder
      };

      if (selectedExhibitionId) filters.exhibitionId = selectedExhibitionId;
      if (selectedExhibitorId) filters.exhibitorId = selectedExhibitorId;
      if (selectedStatus) filters.status = selectedStatus;
      if (search && search.trim()) filters.search = search.trim();

      const response = await fetchAllInvitations(token, filters);
      setInvitations(response.data);
      setSummary(response.summary);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Nie udało się pobrać zaproszeń');
    } finally {
      setLoading(false);
    }
  }, [token, selectedExhibitionId, selectedExhibitorId, selectedStatus, search, sortOrder]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  // Load filter datasets
  useEffect(() => {
    const loadFilterData = async () => {
      if (!token) return;
      try {
        const [exhibitorsData, exhibitionsData] = await Promise.all([
          fetchExhibitors(token),
          fetchExhibitions(token)
        ]);
        setExhibitors(exhibitorsData);
        setExhibitions(exhibitionsData);
      } catch (err) {
        console.error('Error loading filter data:', err);
      }
    };
    loadFilterData();
  }, [token]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleExportCSV = () => {
    if (!token) return;
    
    const filters: InvitationsFilters = {};
    if (selectedExhibitionId) filters.exhibitionId = selectedExhibitionId;
    if (selectedExhibitorId) filters.exhibitorId = selectedExhibitorId;
    if (selectedStatus) filters.status = selectedStatus;
    if (search && search.trim()) filters.search = search.trim();

    exportInvitationsCSV(token, filters);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'rejected': return '#f44336';
      default: return '#757575';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Zaakceptowane';
      case 'pending': return 'Oczekujące';
      case 'rejected': return 'Odrzucone';
      default: return status;
    }
  };

  // Paginated data
  const paginatedInvitations = useMemo(() => {
    return invitations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [invitations, page, rowsPerPage]);

  return (
    <Box>
      {/* Summary Statistics */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <CustomTypography sx={{ fontSize: '0.9rem', color: '#666' }}>
                Wszystkie zaproszenia
              </CustomTypography>
              <CustomTypography sx={{ fontSize: '2rem', fontWeight: 'bold', color: '#5041d0' }}>
                {summary.totalInvitations}
              </CustomTypography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <CustomTypography sx={{ fontSize: '0.9rem', color: '#666' }}>
                Wysłane
              </CustomTypography>
              <CustomTypography sx={{ fontSize: '2rem', fontWeight: 'bold', color: '#4caf50' }}>
                {summary.sent}
              </CustomTypography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <CustomTypography sx={{ fontSize: '0.9rem', color: '#666' }}>
                Otwarte
              </CustomTypography>
              <CustomTypography sx={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff9800' }}>
                {summary.opened}
              </CustomTypography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <CustomTypography sx={{ fontSize: '0.9rem', color: '#666' }}>
                Zaakceptowane
              </CustomTypography>
              <CustomTypography sx={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196f3' }}>
                {summary.accepted}
              </CustomTypography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <CustomTypography sx={{ fontSize: '0.9rem', color: '#666' }}>
                Wystawcy
              </CustomTypography>
              <CustomTypography sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {summary.uniqueExhibitors}
              </CustomTypography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <CustomTypography sx={{ fontSize: '0.9rem', color: '#666' }}>
                Wydarzenia
              </CustomTypography>
              <CustomTypography sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {summary.uniqueExhibitions}
              </CustomTypography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Box sx={{ minWidth: 250 }}>
          <CustomField
            label="Szukaj"
            placeholder="Email, nazwa, firma..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Wydarzenie</InputLabel>
          <Select
            value={selectedExhibitionId}
            onChange={(e) => setSelectedExhibitionId(e.target.value)}
            label="Wydarzenie"
          >
            <MenuItem value="">Wszystkie</MenuItem>
            {exhibitions.map((ex) => (
              <MenuItem key={ex.id} value={ex.id}>
                {ex.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Wystawca</InputLabel>
          <Select
            value={selectedExhibitorId}
            onChange={(e) => setSelectedExhibitorId(e.target.value)}
            label="Wystawca"
          >
            <MenuItem value="">Wszyscy</MenuItem>
            {exhibitors.map((exhibitor) => (
              <MenuItem key={exhibitor.id} value={exhibitor.id}>
                {exhibitor.companyName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            label="Status"
          >
            <MenuItem value="">Wszystkie</MenuItem>
            <MenuItem value="pending">Oczekujące</MenuItem>
            <MenuItem value="accepted">Zaakceptowane</MenuItem>
            <MenuItem value="rejected">Odrzucone</MenuItem>
          </Select>
        </FormControl>

        <CustomButton
          onClick={handleExportCSV}
          icon={<FileDownloadIcon style={{ width: '1.2em', height: '1.2em' }} />}
          iconPosition="left"
          variant="contained"
          disabled={invitations.length === 0}
        >
          Eksportuj CSV
        </CustomButton>
      </Box>

      {/* Table */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleSort}>
                      Data wysłania
                      <ArrowUp
                        style={{
                          marginLeft: 8,
                          width: '1em',
                          height: '1em',
                          transform: sortOrder === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)',
                          transition: 'transform 0.3s'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>Odbiorca</TableCell>
                  <TableCell>Email odbiorcy</TableCell>
                  <TableCell>Firma odbiorcy</TableCell>
                  <TableCell>Wystawca</TableCell>
                  <TableCell>Wydarzenie</TableCell>
                  <TableCell>Szablon</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Data otwarcia</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedInvitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <CustomTypography sx={{ py: 4 }}>
                        Brak zaproszeń do wyświetlenia
                      </CustomTypography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInvitations.map((invitation) => (
                    <TableRow key={invitation.id} hover>
                      <TableCell>{invitation.id}</TableCell>
                      <TableCell>{formatDate(invitation.sent_at)}</TableCell>
                      <TableCell>{invitation.recipient_name || '-'}</TableCell>
                      <TableCell>{invitation.recipient_email}</TableCell>
                      <TableCell>{invitation.recipient_company || '-'}</TableCell>
                      <TableCell>{invitation.company_name || '-'}</TableCell>
                      <TableCell>{invitation.exhibition_name || '-'}</TableCell>
                      <TableCell>{invitation.template_title || '-'}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            backgroundColor: getStatusColor(invitation.response_status) + '20',
                            color: getStatusColor(invitation.response_status),
                            fontSize: '0.85rem',
                            fontWeight: 500
                          }}
                        >
                          {getStatusLabel(invitation.response_status)}
                        </Box>
                      </TableCell>
                      <TableCell>{formatDate(invitation.opened_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={invitations.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Wierszy na stronę:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} z ${count}`}
          />
        </>
      )}
    </Box>
  );
};

export default InvitationsTab;

