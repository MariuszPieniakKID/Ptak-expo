import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Menu from '../components/Menu';
import AddExhibitorModal from '../components/AddExhibitorModal';
import CustomTypography from '../components/customTypography/CustomTypography';
import CustomButton from '../components/customButton/CustomButton';
import {
  fetchExhibitors,
  deleteExhibitor,
  Exhibitor,
} from '../services/api';
import {
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TablePagination,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import styles from './ExhibitorsPage.module.scss';
import ExhibitorsPageIcon from '../assets/mask-group-6@2x.png';

const ExhibitorsPage: React.FC = () => {
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isAddExhibitorModalOpen, setIsAddExhibitorModalOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const loadExhibitors = useCallback(async (): Promise<void> => {
    if (!token) {
      setError('Brak autoryzacji. Proszę się zalogować.');
      logout();
      navigate('/login');
      return;
    }
    try {
      setLoading(true);
      const fetchedExhibitors = await fetchExhibitors(token);
      setExhibitors(fetchedExhibitors);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Nie udało się pobrać wystawców');
      if (err.message.includes('401')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => {
    loadExhibitors();
  }, [loadExhibitors]);

  const handleDeleteExhibitor = useCallback(async (exhibitorId: number, companyName: string): Promise<void> => {
    if (!token) return;
    if (window.confirm(`Czy na pewno chcesz usunąć wystawcę "${companyName}"?`)) {
      try {
        await deleteExhibitor(exhibitorId, token);
        setExhibitors(prevExhibitors => prevExhibitors.filter(exhibitor => exhibitor.id !== exhibitorId));
      } catch (err: any) {
        setError(err.message || 'Błąd podczas usuwania wystawcy');
      }
    }
  }, [token]);

  const handleViewExhibitorCard = useCallback((exhibitorId: number): void => {
    console.log('Zobacz kartę wystawcy:', exhibitorId);
    // TODO: Implement exhibitor card view
  }, []);

  const handleChangePage = useCallback((_event: unknown, newPage: number): void => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleModalClose = useCallback((): void => {
    setIsAddExhibitorModalOpen(false);
  }, []);

  const handleExhibitorAdded = useCallback((): void => {
    setIsAddExhibitorModalOpen(false);
    loadExhibitors();
  }, [loadExhibitors]);

  const formatDate = useCallback((dateString: string | undefined): string => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL');
  }, []);

  const paginatedExhibitors = exhibitors.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box className={styles.exhibitorsPage}>
      <Menu />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box className={styles.header}>
            <div className={styles.titleContainer}>
                <img src={ExhibitorsPageIcon} alt="Wystawcy" className={styles.titleIcon} />
                <CustomTypography fontSize="2rem" fontWeight={600}>
                    Wystawcy
                </CustomTypography>
            </div>
          <CustomButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddExhibitorModalOpen(true)}
            bgColor="#6F87F6"
            textColor="#fff"
            width="auto"
            height="auto"
            sx={{
              padding: '10px 20px',
            }}
          >
            Dodaj wystawcę
          </CustomButton>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper className={styles.tableContainer}>
            <TableContainer>
              <Table>
                <TableHead className={styles.tableHead}>
                  <TableRow>
                    <TableCell className={styles.tableCell}>
                      <CustomTypography fontSize="0.875rem" fontWeight={600}>
                        Nazwa Wystawcy
                      </CustomTypography>
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <CustomTypography fontSize="0.875rem" fontWeight={600}>
                        Najbliższe wydarzenie
                      </CustomTypography>
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <CustomTypography fontSize="0.875rem" fontWeight={600}>
                        Data wydarzenia
                      </CustomTypography>
                    </TableCell>
                    <TableCell className={styles.tableCell} align="right">
                      <CustomTypography fontSize="0.875rem" fontWeight={600}>
                        Akcje
                      </CustomTypography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedExhibitors.map((exhibitor: Exhibitor) => (
                    <TableRow key={exhibitor.id}>
                      <TableCell className={styles.tableCell}>
                        <Box className={styles.companyCell}>
                          <CustomTypography fontSize="0.875rem" fontWeight={500}>
                            {exhibitor.companyName}
                          </CustomTypography>
                          <CustomTypography fontSize="0.75rem" color="#6c757d" fontWeight={400}>
                            {exhibitor.contactPerson}
                          </CustomTypography>
                        </Box>
                      </TableCell>
                      <TableCell className={styles.tableCell}>
                        <CustomTypography fontSize="0.875rem" fontWeight={400}>
                          {exhibitor.eventNames || 'Brak przypisanych wydarzeń'}
                        </CustomTypography>
                      </TableCell>
                      <TableCell className={styles.tableCell}>
                        <CustomTypography fontSize="0.875rem" fontWeight={400}>
                          {formatDate(exhibitor.nearestEventDate)}
                        </CustomTypography>
                      </TableCell>
                      <TableCell className={styles.tableCell} align="right">
                        <Box className={styles.actionButtons}>
                          <CustomButton
                            onClick={() => handleViewExhibitorCard(exhibitor.id)}
                            bgColor="#28a745"
                            textColor="#fff"
                            width="auto"
                            height="32px"
                            fontSize="0.75rem"
                            sx={{
                              padding: '4px 8px',
                              marginRight: '8px',
                            }}
                          >
                            Zobacz kartę wystawcy
                          </CustomButton>
                          <IconButton onClick={() => handleDeleteExhibitor(exhibitor.id, exhibitor.companyName)} size="small">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={exhibitors.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Wierszy na stronę:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} z ${count}`}
            />
          </Paper>
        )}
      </Container>
      <AddExhibitorModal
        isOpen={isAddExhibitorModalOpen}
        onClose={handleModalClose}
        onExhibitorAdded={handleExhibitorAdded}
        token={token || ''}
      />
    </Box>
  );
};

export default ExhibitorsPage; 