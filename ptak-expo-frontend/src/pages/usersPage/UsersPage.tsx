import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Menu from '../../components/menu/Menu';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomButton from '../../components/customButton/CustomButton';
import AddUserModalShort from '../../components/addUserModal/AddUserModalShort';
import EditUserModal from '../../components/editUserModal/EditUserModal';
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
  Avatar,
  TablePagination,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
} from '@mui/material';

import { useMediaQuery } from '@mui/material';

import UsersPageIcon from '../../assets/mask-group-5@2x.png';
import Applause from '../../assets/applause.png';

import { ReactComponent as LogoutIcon } from '../../assets/log-out.svg';
import { ReactComponent as BackIcon } from '../../assets/back.svg';
import { ReactComponent as UsersIcon } from '../../assets/addIcon.svg';
import { ReactComponent as KeyIcon } from '../../assets/keyIcon.svg';
import { ReactComponent as ArrowUp } from '../../assets/arrowUpIcon.svg';
import { ReactComponent as WastebasketIcon } from '../../assets/wastebasket.svg';
import { ReactComponent as EditIcon } from '../../assets/editIcon.svg';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import styles from './UsersPage.module.scss';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!token) return;
    if (window.confirm(`Czy na pewno chcesz usunąć użytkownika "${userName}"?`)) {
      try {
        await deleteUser(userId, token);
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      } catch (err: any) {
        setError(err.message || 'Błąd podczas usuwania użytkownika');
      }
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (!token) return;
    try {
      const res = await resetUserPassword(userId, token);
      alert(res?.message || 'Nowe hasło zostało wysłane do użytkownika.');
    } catch (err: any) {
      const msg = err?.message || 'Błąd podczas resetowania hasła';
      setError(msg);
      if (String(msg).includes('401')) {
        logout();
        navigate('/login');
      }
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditUserModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditUserModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserUpdated = () => {
    loadUsers();
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

  const handleModalClose = () => {
    setIsAddUserModalOpen(false);
  };

  const handleUserAdded = () => {
    setIsAddUserModalOpen(false);
    loadUsers();
  };

  const filteredUsers = React.useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase().trim();
    return users.filter(u => {
      const fullName = u.fullName.toLowerCase();
      const email = u.email.toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      // TODO: add search by role
      return fullName.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [users, searchQuery]);

  const sortedUsers = React.useMemo(() => {
    if (!sortOrder) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      const nameA = a.fullName.toLowerCase();
      const nameB = b.fullName.toLowerCase();

      if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
      if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortOrder]);

  const paginatedUsers = sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const buildAvatarUrl = (userId?: number | null) => {
    if (!userId || !token) return undefined;
    const t = encodeURIComponent(token);
    return `${API_BASE_URL}/api/v1/users/${userId}/avatar?token=${t}`;
  };


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
                icon={<LogoutIcon style={{ color: "#6F6F6F", height:"1.25em"}}/>} 
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
                    {(() => {
                      const src = buildAvatarUrl(user?.id);
                      return (
                        <Avatar
                          {...(src ? { src } : {})}
                          alt={user?.firstName || 'User'}
                          className={styles.avatar}
                          onClick={() => console.log("")}
                        />
                      );
                    })()}
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
        
              <Box className={styles.breadcrumbs}>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link onClick={() => navigate('/dashboard')}> Home</Link>
                    <CustomTypography className={styles.linkEnd}>Użytkownicy</CustomTypography>
                </Breadcrumbs>
              </Box>
            </Box>
            <Box 
              className={styles.addUserContainer}
              onClick={() => setIsAddUserModalOpen(true)}
              >
              <UsersIcon className={styles.addUserIcon} />
              <CustomTypography className={styles.addUserText}> + dodaj użytkownika </CustomTypography>
            </Box>
          </Box>

          <Box className={styles.searchContainer}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Wyszukaj po nazwisku, e-mailu lub telefonie..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0); // Reset to first page when searching
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#7F8D8E' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <ClearIcon
                      sx={{ color: '#7F8D8E', cursor: 'pointer' }}
                      onClick={() => setSearchQuery('')}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#D7D9DD',
                  },
                  '&:hover fieldset': {
                    borderColor: '#89F4C9',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#89F4C9',
                  },
                },
              }}
            />
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
                              color="#7F8D8E" 
                              className={styles.leftSTable} 
                              component="div">
                               
                                {sortOrder === 'asc' && (
                                  <div className={styles.titleAndFilterContainer}> 
                                    <div className={styles.titleTableWithFilter} > Imię i Nazwisko A-Z</div>
                                    <ArrowUp  className={styles.arrowUpIcon}/>
                                  </div>
                                )}
                                {sortOrder === 'desc' && (
                                  <div className={styles.titleAndFilterContainer}>
                                   <div className={styles.titleTableWithFilter} >Imię i Nazwisko Z-A</div>
                                   <ArrowUp className={styles.arrowDownIcon}/>
                                  </div>
                                )}
                                {sortOrder === null && (
                                  <div className={styles.titleAndFilterContainer}>
                                  <div className={styles.titleTableWithFilter} >Imię i Nazwisko </div>
                                  <div className={styles.doubleArrow}>
                                     <ArrowUp className={styles.arrowUpIcon}/>
                                     <ArrowUp className={styles.arrowDownIcon}/>
                                  </div>
                                  </div>
                                )}
                              </CustomTypography>
                            </TableCell>
                            <TableCell className={styles.tableCell}>
                             <CustomTypography fontSize="0.875em" fontWeight={300} color={'#7F8D8E'} className={styles.firstRow}>
                                E-mail
                              </CustomTypography>
                            </TableCell>
                            <TableCell className={styles.tableCell}>
                              <CustomTypography fontSize="0.875em" fontWeight={300} color={'#7F8D8E'} className={styles.firstRow}>
                                Telefon
                              </CustomTypography>
                            </TableCell>
                            <TableCell className={styles.tableCell} align="left">
                              <CustomTypography fontSize="0.875em" fontWeight={300} color={'#7F8D8E'} className={styles.firstRow}>
                                Akcja:
                              </CustomTypography>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedUsers.map((u: User) => (
                            <TableRow key={u.id}>
                              <TableCell className={styles.tableCellL}>
                                <Box className={styles.avatarCell}>
                                  {(() => {
                                    const src = buildAvatarUrl(u.id);
                                    return (
                                      <Avatar
                                        className={styles.avatarTableCell}
                                        {...(src ? { src } : {})}
                                      >
                                        {getUserInitials(u.fullName)}
                                      </Avatar>
                                    );
                                  })()}
                                  <CustomTypography fontSize="1em" fontWeight={500}>
                                    {u.fullName}
                                  </CustomTypography>
                                </Box>
                              </TableCell>
                              <TableCell className={styles.tableCell}>
                                <CustomTypography fontSize="0.8125em" fontWeight={400}>
                                  {u.email}
                                </CustomTypography>
                              </TableCell>
                              <TableCell className={styles.tableCell}>
                                <CustomTypography fontSize="0.8125em" fontWeight={400}>
                                  {u.phone || '—'}
                                </CustomTypography>
                              </TableCell>
                              <TableCell className={styles.tableCell} align="right" >

                                <Box className={styles.actionButtons}>
                                  <Box 
                                  display="flex" 
                                  alignItems="center" 
                                  gap={1} 
                                  className={styles.actionButtonWithHover}>
                                    <EditIcon
                                      onClick={() => handleEditUser(u)}
                                      className={styles.iconActionButton}
                                    />
                                    <CustomTypography
                                      onClick={() => handleEditUser(u)}
                                      className={styles.textActionButton}
                                      sx={{fontSize:'0.8125em !important'}}
                                    >
                                      Edytuj
                                    </CustomTypography>
                                  </Box>

                                  <Box 
                                  display="flex" 
                                  alignItems="center" 
                                  gap={1} 
                                  className={styles.actionButtonWithHover}>
                                    <KeyIcon
                                      onClick={() => handleResetPassword(u.id)}
                                      className={styles.iconActionButton}
                                    />
                                    <CustomTypography
                                      onClick={() => handleResetPassword(u.id)}
                                      className={styles.textActionButton}
                                      sx={{fontSize:'0.8125em !important'}}
                                    >
                                      Wyślij nowe hasło
                                    </CustomTypography>
                                  </Box>
              
                                  <WastebasketIcon 
                                    onClick={() => handleDeleteUser(u.id, u.fullName)} 
                                    className={styles.noEffectsButton}
                                  />
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
                        count={sortedUsers.length}
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

      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={handleEditModalClose}
        onUserUpdated={handleUserUpdated}
        token={token || ''}
        user={selectedUser}
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