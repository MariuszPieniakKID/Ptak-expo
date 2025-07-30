import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Menu from '../../components/menu/Menu';
//import AddUserModal from '../../components/addUserModal/AddUserModal';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomButton from '../../components/customButton/CustomButton';
import { useMediaQuery } from '@mui/material';

import {
  fetchUsers,
  deleteUser,
  resetUserPassword,
  User,
} from '../../services/api';
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
//import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import LockResetIcon from '@mui/icons-material/LockReset';
import styles from './UsersPage.module.scss';
import UsersPageIcon from '../../assets/mask-group-5@2x.png';
import { ReactComponent as LogoutIcon2 } from '../../assets/log-out.svg';
import UserAvatar from '../../assets/7bb764a0137abc7a8142b6438e529133@2x.png';
import Applause from '../../assets/applause.png';

import { ReactComponent as BackIcon } from '../../assets/back.svg';
import { ReactComponent as UsersIcon } from '../../assets/group-30485.svg';
import AddUserModalShort from '../../components/addUserModal/AddUserModalShort';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const isLargeScreen = useMediaQuery('(min-width:600px)');

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

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

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

  const sortedUsers = React.useMemo(() => {
  if (!sortOrder) return users;
  return [...users].sort((a, b) => {
    const nameA = a.fullName.toLowerCase();
    const nameB = b.fullName.toLowerCase();

    if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
    if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}, [users, sortOrder]);

  const paginatedUsers = sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);


  return (
    <>
    <Box className={styles.usersPage}>
      <Box>
        <Box className={styles.dashboardNavigationContainer}>
           <Box className={styles.header}>
                <Menu />
                <CustomButton 
                disableRipple
                textColor='#060606ff'
                fontSize="0.75em;"
                className={styles.logOutButton}
                onClick={handleLogout}
                icon={<LogoutIcon2 style={{ color: "#6F6F6F", height:"1.25em"}}/>} 
                iconPosition="top" 
                withBorder={false}
                width="auto"
                height="auto"
                sx={{ 
                    backgroundColor:'transparent',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: '#060606ff',
                    },
                  }}
              >
                Wyloguj
                </CustomButton>
                <Box className={styles.welcomeMessage}>
                  <Box 
                  className={styles.backContainer}
                  onClick={ () => navigate(-1)}
                  >
                     <BackIcon className={styles.backIcon} />
                    <CustomTypography className={styles.backText}> wstecz </CustomTypography>

                  </Box>
                  <Box className={styles.logedUserInfo}>
                    <Avatar 
                      src={UserAvatar} 
                      alt={user?.firstName || 'User'} 
                      className={styles.avatar} 
                      onClick={()=>console.log("")}
                      />
                    <Box> 
                      <CustomTypography className={styles.welcomeMessageTitle}> Dzień dobry, {user?.firstName || 'Użytkowniku'} 
                          <img
                            src={Applause}
                            alt='Applause'
                            className={styles.applausepng}
                          />
                      </CustomTypography>
                      <CustomTypography className={styles.welcomeMessageText}>Sprawdź co możesz dzisiaj zrobić!</CustomTypography>
                    </Box>
                  </Box>
                </Box>
            </Box> 
        </Box>
        <Container   
          maxWidth={false}  
          sx={{ maxWidth: '90%' }}
          className={styles.contentWrapper}
         >
          <Box className={styles.tableHeader}>
            <Box className={styles.titleTableContainer}>
              <Box className={styles.userTitle}>
                <img src={UsersPageIcon} alt="Użytkownicy" className={styles.titleIcon} />
                <CustomTypography className={styles.tableTitle}> Użytkownicy </CustomTypography>
              </Box>
              <Box className={styles.path}>Home / Użytkownicy</Box>
            </Box>
            <Box 
              className={styles.addUserContainer}
              onClick={() => setIsAddUserModalOpen(true)}
              >
              <UsersIcon className={styles.addUserIcon} />
              <CustomTypography className={styles.addUserText}> + dodaj użytkownika </CustomTypography>
            </Box>
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
                            <TableCell
                              className={styles.tableCell}
                              style={{ cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => {
                                if (sortOrder === 'asc') setSortOrder('desc');
                                else if (sortOrder === 'desc') setSortOrder(null);
                                else setSortOrder('asc');
                              }}
                            >
                              <CustomTypography 
                              fontSize="0.875em" 
                              fontWeight={300} 
                              color="#6F6F6F" 
                              className={styles.leftSTable} 
                              component="span">
                                Imię i Nazwisko{' '}
                                {sortOrder === 'asc' && (
                                  <>
                                    <span style={{ fontWeight: 300, marginLeft: 2 }}>A-Z</span>
                                    <ArrowUpwardIcon 
                                      fontSize="small" 
                                      sx={{ verticalAlign: 'middle', color: '#6F87F6',scale:'0.9' }} 
                                    />
                                    
                                  </>
                                )}
                                {sortOrder === 'desc' && (
                                  <>
                                  <span style={{ fontWeight: 300, marginLeft: 2 }}>Z-A</span>
                                    <ArrowDownwardIcon 
                                    fontSize="small" 
                                    sx={{ verticalAlign: 'middle', color: '#6F87F6',scale:'0.9' }} 
                                    />
                                  </>
                                )}
                                {sortOrder === null && (
                                  <>
                                    <ArrowUpwardIcon 
                                    fontSize="small" 
                                    sx={{ verticalAlign: 'middle', color: '#6F87F6', scale:'0.6' }} 
                                    />
                                    <ArrowDownwardIcon 
                                    fontSize="small" 
                                    sx={{ verticalAlign: 'middle', color: '#6F87F6', scale:'0.6' , marginLeft: -1 }} 
                                    />
                                  </>
                                )}
                              </CustomTypography>
                            </TableCell>
                            <TableCell className={styles.tableCell}>
                             <CustomTypography fontSize="0.875em" fontWeight={300} color={'#6F6F6F'} className={styles.firstRow}>
                                E-mail
                              </CustomTypography>
                            </TableCell>
                            <TableCell className={styles.tableCell}>
                              <CustomTypography fontSize="0.875em" fontWeight={300} color={'#6F6F6F'} className={styles.firstRow}>
                                Telefon
                              </CustomTypography>
                            </TableCell>
                            <TableCell className={styles.tableCell} align="left">
                              <CustomTypography fontSize="0.875em" fontWeight={300} color={'#6F6F6F'} className={styles.firstRow}>
                                Akcja:
                              </CustomTypography>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedUsers.map((user: User) => (
                            <TableRow key={user.id}>
                              <TableCell className={styles.tableCellL}>
                                <Box className={styles.avatarCell}>
                                  <Avatar 
                                  className={styles.avatarTableCell}
                          
                                  >
                                    {getUserInitials(user.fullName)}
                                  </Avatar>
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
                              <TableCell className={styles.tableCell} align="right" >
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
                     <>
                    {isLargeScreen ? (
                      <TablePagination
                        className={styles.paginationStyle}
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
                    ):( <div style={{ height: '2em' }} />)}
                  </>
                  </Paper>
                )}
        </Container>
      </Box>

      {/* <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={handleModalClose}
        onUserAdded={handleUserAdded}
        token={token || ''}
      /> */}


      <AddUserModalShort
        isOpen={isAddUserModalOpen}
        onClose={handleModalClose}
        onUserAdded={handleUserAdded}
        token={token || ''}
      />


      <Box className={styles.footer}>
        <CustomTypography className={styles.cc}>
          Kontakt • Polityka prywatności • www.warsawexpo.eu
        </CustomTypography>
      </Box>
    </Box>

    <Box className={styles.filtr}>
      <Box className={styles.filtrGray}/>
      <Box className={styles.filtrBlue}/>
    </Box>
    </>
  );
};

export default UsersPage; 