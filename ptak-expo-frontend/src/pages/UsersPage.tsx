import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Menu from '../components/menu/Menu';
import AddUserModal from '../components/AddUserModal';
import CustomTypography from '../components/customTypography/CustomTypography';
import CustomButton from '../components/customButton/CustomButton';
import {
  fetchUsers,
  deleteUser,
  resetUserPassword,
  User,
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
  Avatar,
  TablePagination,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import styles from './UsersPage.module.scss';
import UsersPageIcon from '../assets/mask-group-5@2x.png';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const loadUsers = useCallback(async (): Promise<void> => {
    if (!token) {
      setError('Brak autoryzacji. Proszę się zalogować.');
      logout();
      navigate('/login');
      return;
    }
    try {
      setLoading(true);
      const fetchedUsers = await fetchUsers(token);
      setUsers(fetchedUsers);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Nie udało się pobrać użytkowników');
      if (err.message.includes('401')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDeleteUser = useCallback(async (userId: number, userName: string): Promise<void> => {
    if (!token) return;
    if (window.confirm(`Czy na pewno chcesz usunąć użytkownika "${userName}"?`)) {
      try {
        await deleteUser(userId, token);
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      } catch (err: any) {
        setError(err.message || 'Błąd podczas usuwania użytkownika');
      }
    }
  }, [token]);

  const handleResetPassword = useCallback(async (userId: number): Promise<void> => {
    try {
      await resetUserPassword(userId);
      alert('Nowe hasło zostało wysłane do użytkownika.');
    } catch (err: any) {
      setError(err.message || 'Błąd podczas resetowania hasła');
    }
  }, []);
  
  const getUserInitials = useCallback((fullName: string): string => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return fullName.charAt(0).toUpperCase();
  }, []);

  const handleChangePage = useCallback((_event: unknown, newPage: number): void => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleModalClose = useCallback((): void => {
    setIsAddUserModalOpen(false);
  }, []);

  const handleUserAdded = useCallback((): void => {
    setIsAddUserModalOpen(false);
    loadUsers();
  }, [loadUsers]);

  const paginatedUsers = users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box className={styles.usersPage}>
      <Menu />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box className={styles.header}>
            <div className={styles.titleContainer}>
                <img src={UsersPageIcon} alt="Użytkownicy" className={styles.titleIcon} />
                <CustomTypography fontSize="2rem" fontWeight={600}>
                    Użytkownicy
                </CustomTypography>
            </div>
          <CustomButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddUserModalOpen(true)}
            bgColor="#6F87F6"
            textColor="#fff"
            width="auto"
            height="auto"
            sx={{
              padding: '10px 20px',
            }}
          >
            Dodaj użytkownika
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
                        Imię i Nazwisko
                      </CustomTypography>
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <CustomTypography fontSize="0.875rem" fontWeight={600}>
                        E-mail
                      </CustomTypography>
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <CustomTypography fontSize="0.875rem" fontWeight={600}>
                        Telefon
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
                  {paginatedUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className={styles.tableCell}>
                        <Box className={styles.avatarCell}>
                          <Avatar className={styles.avatar}>{getUserInitials(user.fullName)}</Avatar>
                          <CustomTypography fontSize="0.875rem" fontWeight={500}>
                            {user.fullName}
                          </CustomTypography>
                        </Box>
                      </TableCell>
                      <TableCell className={styles.tableCell}>
                        <CustomTypography fontSize="0.875rem" fontWeight={400}>
                          {user.email}
                        </CustomTypography>
                      </TableCell>
                      <TableCell className={styles.tableCell}>
                        <CustomTypography fontSize="0.875rem" fontWeight={400}>
                          {user.phone || '—'}
                        </CustomTypography>
                      </TableCell>
                      <TableCell className={styles.tableCell} align="right">
                        <Box className={styles.actionButtons}>
                          <IconButton onClick={() => handleResetPassword(user.id)} size="small">
                            <LockResetIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteUser(user.id, user.fullName)} size="small">
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
              count={users.length}
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
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={handleModalClose}
        onUserAdded={handleUserAdded}
        token={token || ''}
      />
    </Box>
  );
};

export default UsersPage; 