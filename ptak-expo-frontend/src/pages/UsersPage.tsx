import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Menu from '../components/Menu';
import AddUserModal from '../components/AddUserModal';
import {
  fetchUsers,
  deleteUser,
  resetUserPassword,
  User,
} from '../services/api';
import {
  Box,
  Container,
  Typography,
  Button,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const loadUsers = useCallback(async () => {
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

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!token) return;
    if (window.confirm(`Czy na pewno chcesz usunąć użytkownika "${userName}"?`)) {
      try {
        await deleteUser(userId, token);
        // Refresh list
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      } catch (err: any) {
        setError(err.message || 'Błąd podczas usuwania użytkownika');
      }
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      await resetUserPassword(userId);
      alert('Nowe hasło zostało wysłane do użytkownika.');
    } catch (err: any) {
      setError(err.message || 'Błąd podczas resetowania hasła');
    }
  };
  
  const getUserInitials = (fullName: string) => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return fullName.charAt(0).toUpperCase();
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedUsers = users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box className={styles.usersPage}>
      <Menu />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box className={styles.header}>
            <div className={styles.titleContainer}>
                <img src={UsersPageIcon} alt="Użytkownicy" className={styles.titleIcon} />
                <Typography variant="h4" component="h1">
                    Użytkownicy
                </Typography>
            </div>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddUserModalOpen(true)}
          >
            Dodaj użytkownika
          </Button>
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
                    <TableCell className={styles.tableCell}>Imię i Nazwisko</TableCell>
                    <TableCell className={styles.tableCell}>E-mail</TableCell>
                    <TableCell className={styles.tableCell}>Telefon</TableCell>
                    <TableCell className={styles.tableCell} align="right">Akcje</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className={styles.tableCell}>
                        <Box className={styles.avatarCell}>
                          <Avatar className={styles.avatar}>{getUserInitials(user.fullName)}</Avatar>
                          {user.fullName}
                        </Box>
                      </TableCell>
                      <TableCell className={styles.tableCell}>{user.email}</TableCell>
                      <TableCell className={styles.tableCell}>{user.phone || '—'}</TableCell>
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
        onClose={() => setIsAddUserModalOpen(false)}
        onUserAdded={() => {
          setIsAddUserModalOpen(false);
          loadUsers();
        }}
        token={token || ''}
      />
    </Box>
  );
};

export default UsersPage; 