import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config/config';
import Menu from '../../components/menu/Menu';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomButton from '../../components/customButton/CustomButton';
import CustomField from '../../components/customField/CustomField';
import { Box, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, CircularProgress, Alert, Breadcrumbs, Link, TablePagination, Tabs, Tab } from '@mui/material';
import { useMediaQuery } from '@mui/material';

import { ReactComponent as LogoutIcon } from '../../assets/log-out.svg';
import { ReactComponent as BackIcon } from '../../assets/back.svg';
import { ReactComponent as ArrowUp } from '../../assets/arrowUpIcon.svg';

import DatabaseIconPng from '../../assets/databaseIcon.png';
import Applause from '../../assets/applause.png';
import InvitationsTab from './InvitationsTab';
import DictionariesTab from './DictionariesTab';
import LogsTab from './LogsTab';

import styles from '../usersPage/UsersPage.module.scss';
import { ExhibitorPerson, fetchExhibitorPeople, fetchExhibitors, Exhibitor, fetchExhibitions, Exhibition } from '../../services/api';

const DatabasePage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<number>(0);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [people, setPeople] = useState<ExhibitorPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  // filters
  const [search, setSearch] = useState<string>('');
  const [selectedExhibitorId, setSelectedExhibitorId] = useState<string>('');
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<string>('');
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const isLargeScreen = useMediaQuery('(min-width:600px)');

  // Scroll to top when tab changes
  useEffect(() => {
    if (tabsRef.current) {
      tabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentTab]);

  const buildAvatarUrl = (userId?: number | null): string | undefined => {
    if (!userId || !token) return undefined;
    return `${config.API_BASE_URL}/api/v1/users/${userId}/avatar?token=${encodeURIComponent(token)}`;
  };

  const isAdmin = (user as any)?.role === 'admin';

  const loadPeople = useCallback(async (): Promise<void> => {
    if (!token) {
      setError('Brak autoryzacji. Proszę się zalogować.');
      logout();
      navigate('/login');
      return;
    }
    try {
      setLoading(true);
      const filters: { exhibitionId?: number; exhibitorId?: number; query?: string } = {};
      if (selectedExhibitionId) filters.exhibitionId = Number(selectedExhibitionId);
      if (selectedExhibitorId) filters.exhibitorId = Number(selectedExhibitorId);
      if (search && search.trim()) filters.query = search.trim();
      const list = await fetchExhibitorPeople(token, filters);
      setPeople(list);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Nie udało się pobrać bazy danych');
      if (err.message?.includes('401')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate, selectedExhibitionId, selectedExhibitorId, search]);

  useEffect(() => { loadPeople(); }, [loadPeople]);

  // load filter datasets
  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const [exhbs, exhs] = await Promise.all([
          fetchExhibitors(token),
          fetchExitionsSafe(token)
        ]);
        setExhibitors(exhbs);
        setExhibitions(exhs);
      } catch (e) {
        // ignore silently for filters
      }
    })();
  }, [token]);

  const fetchExitionsSafe = async (t: string): Promise<Exhibition[]> => {
    try {
      return await fetchExhibitions(t);
    } catch {
      return [];
    }
  };

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const getUserInitials = useCallback((fullName: string): string => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    return fullName.charAt(0).toUpperCase();
  }, []);

  const filteredPeople = useMemo(() => {
    let rows = people;
    const s = (search || '').trim().toLowerCase();
    if (selectedExhibitorId) {
      rows = rows.filter(p => String(p.exhibitorId || '') === String(selectedExhibitorId));
    }
    if (selectedExhibitionId) {
      rows = rows.filter(p => String((p as any).exhibitionId || '') === String(selectedExhibitionId));
    }
    if (s) {
      rows = rows.filter(p => (
        (p.fullName || '').toLowerCase().includes(s) ||
        (p.email || '').toLowerCase().includes(s) ||
        (p.exhibitorCompanyName || '').toLowerCase().includes(s) ||
        ((p as any).exhibitionName || '').toLowerCase().includes(s)
      ));
    }
    return rows;
  }, [people, search, selectedExhibitorId, selectedExhibitionId]);

  const sortedPeople = useMemo(() => {
    if (!sortOrder) return filteredPeople;
    return [...filteredPeople].sort((a, b) => {
      const nameA = (a.fullName || '').toLowerCase();
      const nameB = (b.fullName || '').toLowerCase();
      if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
      if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPeople, sortOrder]);

  const paginated = sortedPeople.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = useCallback((_event: unknown, newPage: number): void => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

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
                icon={<LogoutIcon style={{ color: '#6F6F6F', height: '1.25em' }} />}
                iconPosition="top"
                withBorder={false}
                width="auto"
                height="auto"
                sx={{ backgroundColor: 'transparent', '&:hover': { backgroundColor: 'transparent', color: '#060606ff' } }}
              >
                Wyloguj
              </CustomButton>
              <Box className={styles.welcomeMessage}>
                <Box className={styles.backContainer} onClick={() => navigate(-1)}>
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
                      />
                    );
                  })()}
                  <Box>
                    <CustomTypography className={styles.welcomeMessageTitle}>
                      Dzień dobry, {user?.firstName || 'Użytkowniku'}
                      <img src={Applause} alt='Applause' className={styles.applausepng} />
                    </CustomTypography>
                    <CustomTypography className={styles.welcomeMessageText}>Sprawdź co możesz dzisiaj zrobić!</CustomTypography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
          <Container maxWidth={false} sx={{ maxWidth: '90%' }} className={styles.contentWrapper}>
            {/* Header - fixed at top */}
            <Box className={styles.tableHeader}>
              <Box className={styles.titleTableContainer}>
                <Box className={styles.userTitle}>
                  <img src={DatabaseIconPng} alt="Baza danych" className={styles.titleIcon} />
                  <CustomTypography className={styles.tableTitle}> Baza danych </CustomTypography>
                </Box>
                <Box className={styles.breadcrumbs}>
                  <Breadcrumbs aria-label="breadcrumb">
                    <Link onClick={() => navigate('/dashboard')}> Home</Link>
                    <CustomTypography className={styles.linkEnd}>Baza danych</CustomTypography>
                  </Breadcrumbs>
                </Box>
              </Box>
            </Box>

            {/* Tabs - fixed position, separate from header */}
            <Box ref={tabsRef} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, mt: 2 }}>
              <Tabs value={currentTab} onChange={(_e, newValue) => setCurrentTab(newValue)}>
                <Tab label="Osoby" />
                <Tab label="Słowniki" />
                <Tab label="Zaproszenia" />
                <Tab label="Logi" />
              </Tabs>
            </Box>

            {/* Tab Content Container */}
            <Box sx={{ minHeight: '500px' }}>
                {/* Tab: Osoby */}
                {currentTab === 0 && (<Box>
              {/* Top-right filters */}
              <Box className={styles.filtersBar}>
                <CustomField
                  type="text"
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                  placeholder="Szukaj (imię, email, firma, wydarzenie)"
                  size="small"
                  className={styles.searchField}
                />
                <CustomField
                  type="text"
                  value={selectedExhibitorId}
                  onChange={(e: any) => setSelectedExhibitorId(String(e.target.value))}
                  placeholder="Wystawca"
                  size="small"
                  forceSelectionFromOptions
                  options={[{ value: '', label: 'Wszyscy wystawcy' } as any].concat(
                    exhibitors.map(x => ({ value: x.id, label: x.companyName }))
                  )}
                  className={styles.searchField}
                />
                <CustomField
                  type="text"
                  value={selectedExhibitionId}
                  onChange={(e: any) => setSelectedExhibitionId(String(e.target.value))}
                  placeholder="Wydarzenie"
                  size="small"
                  forceSelectionFromOptions
                  options={[{ value: '', label: 'Wszystkie wydarzenia' } as any].concat(
                    exhibitions.map(x => ({ value: x.id, label: x.name }))
                  )}
                  className={styles.searchField}
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
                          <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E" className={styles.leftSTable} component="div">
                            {sortOrder === 'asc' && (
                              <div className={styles.titleAndFilterContainer}>
                                <div className={styles.titleTableWithFilter}>Imię i Nazwisko A-Z</div>
                                <ArrowUp className={styles.arrowUpIcon} />
                              </div>
                            )}
                            {sortOrder === 'desc' && (
                              <div className={styles.titleAndFilterContainer}>
                                <div className={styles.titleTableWithFilter}>Imię i Nazwisko Z-A</div>
                                <ArrowUp className={styles.arrowDownIcon} />
                              </div>
                            )}
                            {sortOrder === null && (
                              <div className={styles.titleAndFilterContainer}>
                                <div className={styles.titleTableWithFilter}>Imię i Nazwisko</div>
                                <div className={styles.doubleArrow}>
                                  <ArrowUp className={styles.arrowUpIcon} />
                                  <ArrowUp className={styles.arrowDownIcon} />
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
                            Typ
                          </CustomTypography>
                        </TableCell>
                        <TableCell className={styles.tableCell}>
                          <CustomTypography fontSize="0.875em" fontWeight={300} color={'#7F8D8E'} className={styles.firstRow}>
                            Wystawca
                          </CustomTypography>
                        </TableCell>
                        <TableCell className={styles.tableCell}>
                          <CustomTypography fontSize="0.875em" fontWeight={300} color={'#7F8D8E'} className={styles.firstRow}>
                            Wydarzenie
                          </CustomTypography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginated.map((p: ExhibitorPerson) => (
                        <TableRow key={p.id}>
                          <TableCell className={styles.tableCellL}>
                            <Box className={styles.avatarCell}>
                              <Avatar className={styles.avatarTableCell}>
                                {getUserInitials(p.fullName || '')}
                              </Avatar>
                              <CustomTypography fontSize="1em" fontWeight={500}>
                                {p.fullName}
                              </CustomTypography>
                            </Box>
                          </TableCell>
                          <TableCell className={styles.tableCell}>
                            <CustomTypography fontSize="0.8125em" fontWeight={400}>
                              {p.email || '—'}
                            </CustomTypography>
                          </TableCell>
                          <TableCell className={styles.tableCell}>
                            <CustomTypography fontSize="0.8125em" fontWeight={400}>
                              {p.type || '—'}
                            </CustomTypography>
                          </TableCell>
                          <TableCell className={styles.tableCell}>
                            <CustomTypography fontSize="0.8125em" fontWeight={400}>
                              {p.exhibitorCompanyName}
                            </CustomTypography>
                          </TableCell>
                          <TableCell className={styles.tableCell}>
                            <CustomTypography fontSize="0.8125em" fontWeight={400}>
                              {p.exhibitionName || (exhibitions.find(x => x.id === (p.exhibitionId as any))?.name || '—')}
                            </CustomTypography>
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
                      count={people.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      labelRowsPerPage="Wierszy na stronę:"
                      labelDisplayedRows={({ from, to, count }) => `${from}-${to} z ${count}`}
                    />
                  ) : (
                    <div style={{ height: '2em' }} />
                  )}
                </>
              </Paper>
            )}
          </Box>)}

                {/* Tab: Słowniki */}
                {currentTab === 1 && isAdmin && (
                  <Box>
                    <DictionariesTab />
                  </Box>
                )}

              {/* Tab: Zaproszenia */}
              {currentTab === 2 && (
                <Box>
                  <InvitationsTab />
                </Box>
              )}

              {/* Tab: Logi */}
              {currentTab === 3 && token && (
                <Box>
                  <LogsTab token={token} />
                </Box>
              )}
            </Box>

          </Container>
        </Box>

        <Box className={styles.footer}>
          <CustomTypography className={styles.cc}>
            Kontakt • Polityka prywatności • www.warsawexpo.eu
          </CustomTypography>
        </Box>
      </Box>

      {/* Gradient background */}
      <Box className={styles.filtr}>
        <Box className={styles.filtrGray} />
        <Box className={styles.filtrBlue} />
      </Box>
    </>
  );
};

export default DatabasePage;


