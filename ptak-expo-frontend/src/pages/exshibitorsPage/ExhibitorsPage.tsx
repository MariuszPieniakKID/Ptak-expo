import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Menu from '../../components/menu/Menu';
import AddExhibitorModal from '../../components/addExhibitorModal/AddExhibitorModal';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomButton from '../../components/customButton/CustomButton';
import {
  fetchExhibitors,
  deleteExhibitor,
  Exhibitor,
} from '../../services/api';
import {
  Avatar,
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
  useMediaQuery,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { ReactComponent as LogoutIcon } from '../../assets/log-out.svg';
import styles from './ExhibitorsPage.module.scss';
import ExhibitorsPageIcon from '../../assets/mask-group-6@2x.png';
import { ReactComponent as BackIcon } from '../../assets/back.svg';
import UserAvatar from '../../assets/7bb764a0137abc7a8142b6438e529133@2x.png';
import Applause from '../../assets/applause.png';
import { ReactComponent as UsersIcon } from '../../assets/addIcon.svg';
import { ReactComponent as ArrowIcon } from '../../assets/arrowUpIcon.svg';
import { ReactComponent as EyeIcon } from '../../assets/eyeIcon.svg';

const ExhibitorsPage: React.FC = () => {
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isAddExhibitorModalOpen, setIsAddExhibitorModalOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const isLargeScreen = useMediaQuery('(min-width:600px)');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Exhibitor | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const getUserInitials = useCallback((fullName: string): string => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return fullName.charAt(0).toUpperCase();
  }, []);

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
    navigate(`/wystawcy/${exhibitorId}`);
  }, [navigate]);

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

  const handleSort = useCallback((columnKey: keyof Exhibitor) => {
    setSortConfig(prev => {
      if (prev.key === columnKey) {
        if (prev.direction === 'asc') return { key: columnKey, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
        return { key: columnKey, direction: 'asc' };
      }

      return { key: columnKey, direction: 'asc' };
    });
 }, []);

  

  const sortedExhibitors = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return exhibitors;


    const key = sortConfig.key as keyof Exhibitor;

    return [...exhibitors].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (key === 'nearestEventDate') {

        const dateA = aVal ? new Date(aVal as string).getTime() : 0;
        const dateB = bVal ? new Date(bVal as string).getTime() : 0;
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return 0;
    });
  }, [exhibitors, sortConfig]);

 const paginatedExhibitors = sortedExhibitors.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
 
 return (
    <>
    <Box className={styles._exhibitorsPage}>
      <Box>
        <Box className={styles._exhibitorsNavigationContainer}>
          <Box className={styles._header}>
            <Menu /> 
            <CustomButton 
              disableRipple
              textColor='#060606ff'
              fontSize="0.75em;"
              className={styles._logOutButton}
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
            <Box className={styles._welcomeMessage}>
              <Box 
                className={styles._backContainer}
                onClick={ () => navigate(-1)}
              >
                <BackIcon className={styles._backIcon} />
                <CustomTypography className={styles._backText}> wstecz </CustomTypography>
              </Box>
              <Box className={styles._logedUserInfo}>
                <Avatar 
                  src={UserAvatar} 
                  alt={user?.firstName || 'User'} 
                  className={styles._avatar} 
                  onClick={()=>console.log("")}
                />
                <Box> 
                  <CustomTypography className={styles._welcomeMessageTitle}> Dzień dobry, {user?.firstName || 'Użytkowniku'} 
                  <img
                    src={Applause}
                    alt='Applause'
                    className={styles._applausepng}
                  />
                  </CustomTypography>
                  <CustomTypography className={styles._welcomeMessageText}>Sprawdź co możesz dzisiaj zrobić!</CustomTypography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
        <Container  
          maxWidth={false}  
          sx={{ maxWidth: '90%' }}
          className={styles._contentWrapper}
        > 
          <Box className={styles._tableHeader}>
            <Box className={styles._titleTableContainer}>
              <Box className={styles._userTitle}>
                <img src={ExhibitorsPageIcon} alt="Wystawcy" className={styles._titleIcon} />
                <CustomTypography className={styles._pageTitle}>Wystawcy</CustomTypography>              
              </Box>
              <Box className={styles._path}>Home / Baza wystawców</Box>
            </Box>
            <Box
              className={styles._addExhibitorsContainer}
              onClick={() => setIsAddExhibitorModalOpen(true)}
            >
              <UsersIcon className={styles._addExhibitorIcon} />
              <CustomTypography className={styles._addExhibitorText}> + dodaj wystawcę </CustomTypography>    
            </Box> 
          </Box>   

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper className={styles._tableContainer}>
            <TableContainer>
              <Table>
                <TableHead className={styles._tableHead}>
                  <TableRow>
                    <TableCell 
                        className={styles._tableCell}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('companyName')}
                    >
                      <CustomTypography 
                      fontSize="0.875em" 
                      fontWeight={300} 
                      color='#7F8D8E' 
                      className={styles._leftSTable} 
                      component="div"
                      >
                         {sortConfig.key === 'companyName' && sortConfig.direction === 'asc' && (
                            <div className={styles.titleAndFilterContainer}>
                              <div className={styles.titleTableWithFilter}>Nazwa Wystawcy A-Z</div>
                              <ArrowIcon fontSize="small" className={styles.arrowUpIcon}/>
                            </div>
                          )}
                          {sortConfig.key === 'companyName' && sortConfig.direction === 'desc' && (
                            <div className={styles.titleAndFilterContainer}>
                               <div className={styles.titleTableWithFilter}>Nazwa Wystawcy Z-A</div>
                               <ArrowIcon fontSize="small" className={styles.arrowDownIcon}/>
                            </div>
                          )}
                          {sortConfig.key !== 'companyName' && (
                            <div className={styles.titleAndFilterContainer}>
                                <div className={styles.titleTableWithFilter} >Nazwa Wystawcy </div>
                                <div className={styles.doubleArrow}>
                                    <ArrowIcon className={styles.arrowUpIcon}/>
                                    <ArrowIcon className={styles.arrowDownIcon}/>
                                </div>
                            </div>

                          )}
                      </CustomTypography>
                    </TableCell>
                    <TableCell 
                      className={styles._tableCell}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('eventNames')}
                    >
                      <CustomTypography 
                      fontSize="0.875em" 
                      fontWeight={300} 
                      color={'#7F8D8E'} 
                      className={styles._firstRow}
                      sx={{ minWidth: '2em'}}
                      >
                       {sortConfig.key === 'eventNames' && sortConfig.direction === 'asc' && (
                            <div className={styles.titleAndFilterContainer}>
                              <div className={styles.titleTableWithFilter}>Najbliższe wydarzenie A-Z</div>
                              <ArrowIcon fontSize="small" className={styles.arrowUpIcon}/>
                            </div>
                          )}
                          {sortConfig.key === 'eventNames' && sortConfig.direction === 'desc' && (
                            <div className={styles.titleAndFilterContainer}>
                               <div className={styles.titleTableWithFilter}>Najbliższe wydarzenie Z-A</div>
                               <ArrowIcon fontSize="small" className={styles.arrowDownIcon}/>
                            </div>
                          )}
                          {sortConfig.key !== 'eventNames' && (
                            <div className={styles.titleAndFilterContainer}>
                                <div className={styles.titleTableWithFilter} >Najbliższe wydarzenie </div>
                                <div className={styles.doubleArrow}>
                                    <ArrowIcon className={styles.arrowUpIcon}/>
                                    <ArrowIcon className={styles.arrowDownIcon}/>
                                </div>
                            </div>

                        )}
                      </CustomTypography>
                    </TableCell>
                    <TableCell 
                      className={styles._tableCell}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('nearestEventDate')}
                    >
                      <CustomTypography fontSize="0.875em" fontWeight={300} color={'#7F8D8E'} className={styles._firstRow}>
                          {sortConfig.key === 'nearestEventDate' && sortConfig.direction === 'asc' && (
                            <div className={styles.titleAndFilterContainer}>
                              <div className={styles.titleTableWithFilter}>Data wydarzenia</div>
                              <ArrowIcon fontSize="small" className={styles.arrowUpIcon}/>
                            </div>
                          )}
                          {sortConfig.key === 'nearestEventDate' && sortConfig.direction === 'desc' && (
                            <div className={styles.titleAndFilterContainer}>
                               <div className={styles.titleTableWithFilter}>Data wydarzenia</div>
                               <ArrowIcon fontSize="small" className={styles.arrowDownIcon}/>
                            </div>
                          )}
                          {sortConfig.key !== 'nearestEventDate' && (
                            <div className={styles.titleAndFilterContainer}>
                                <div className={styles.titleTableWithFilter} >Data wydarzenia</div>
                                <div className={styles.doubleArrow}>
                                    <ArrowIcon className={styles.arrowUpIcon}/>
                                    <ArrowIcon className={styles.arrowDownIcon}/>
                                </div>
                            </div>

                        )}
                      </CustomTypography>
                    </TableCell>
                    <TableCell className={styles._tableCell} sx={{width:'130px'}}>
                      <CustomTypography fontSize="0.875em" fontWeight={300} color={'#7F8D8E'} className={styles._firstRow} sx={{width:'130px'}}>
                        Akcja:
                      </CustomTypography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedExhibitors.map((exhibitor: Exhibitor) => (
                    <TableRow key={exhibitor.id}>
                      <TableCell className={styles._tableCell}>
                        <Box className={styles._companyCellWithLogo}>
                            <Avatar className={styles._avatarTableCell}>
                                    {getUserInitials(exhibitor.companyName)}
                            </Avatar>
                            <Box  className={styles._companyNameAndOuner}>
                              <CustomTypography  fontSize="0.875em" fontWeight={500} className={styles._textOverflow}>
                                {exhibitor.companyName}
                              </CustomTypography>
                              <CustomTypography fontSize="0.75em" color='#7F8D8E' fontWeight={400} className={styles._textOverflow}>
                                {exhibitor.contactPerson}
                              </CustomTypography>
                            </Box>
                        </Box>
                      </TableCell>
                      <TableCell className={styles._tableCell}>
                        <CustomTypography fontSize="0.8125em" fontWeight={500} className={styles._textOverflow}>
                          {exhibitor.eventNames || '-'}
                        </CustomTypography>
                      </TableCell>
                      <TableCell 
                      className={styles._tableCell}
                      align="center">
                        <CustomTypography fontSize="0.8125em" fontWeight={500} >
                          {formatDate(exhibitor.nearestEventDate)}
                        </CustomTypography>
                      </TableCell>
                      <TableCell className={styles._tableCell} align="right">
                        
                        <Box className={styles._actionButtons}>
                          <Box display="flex" alignItems="center" gap={1} className={styles._boxWithHover}
                          > <EyeIcon
                              onClick={() => handleViewExhibitorCard(exhibitor.id)}
                              className={styles._seeExhibitorCardIcon}/>
                          
                            <CustomTypography
                              onClick={() => handleViewExhibitorCard(exhibitor.id)}
                              className={styles._seeExhibitorCard}
                            >
                              Zobacz kartę
                            </CustomTypography>
                          </Box>

                          <IconButton 
                             className={styles._noEffectsButton}
                             onClick={() => handleDeleteExhibitor(exhibitor.id, exhibitor.companyName)} 
                             size="small"
                             disableRipple>
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
             className={styles._paginationStyle}
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={exhibitors.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Wierszy na stronę:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} z ${count}`}
            />):(<div style={{ height: '2em' }} />)}
            </>
          </Paper>
        )}
        </Container>
      </Box>

      <AddExhibitorModal
        isOpen={isAddExhibitorModalOpen}
        onClose={handleModalClose}
        onExhibitorAdded={handleExhibitorAdded}
        token={token || ''}
        />


      <Box className={styles._footer}>
        <CustomTypography className={styles._cc}>
          Kontakt • Polityka prywatności • www.warsawexpo.eu
        </CustomTypography>
      </Box>
    </Box>
    <Box className={styles._filtr}>
      <Box className={styles._filtrGray}/>
      <Box className={styles._filtrBlue}/>
    </Box>
    </>
  );
};

export default ExhibitorsPage; 