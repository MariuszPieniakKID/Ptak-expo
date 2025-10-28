import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config/config';
import Menu from '../../components/menu/Menu';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomButton from '../../components/customButton/CustomButton';
import CustomField from '../../components/customField/CustomField';
import { Box, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, CircularProgress, Alert, Breadcrumbs, Link, TablePagination, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tabs, Tab } from '@mui/material';
import { useMediaQuery } from '@mui/material';

import { ReactComponent as LogoutIcon } from '../../assets/log-out.svg';
import { ReactComponent as BackIcon } from '../../assets/back.svg';
import { ReactComponent as ArrowUp } from '../../assets/arrowUpIcon.svg';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import DatabaseIconPng from '../../assets/databaseIcon.png';
import Applause from '../../assets/applause.png';
import InvitationsTab from './InvitationsTab';

import styles from '../usersPage/UsersPage.module.scss';
import { ExhibitorPerson, fetchExhibitorPeople, catalogAPI, CatalogTag, CatalogIndustry, CatalogBrand, CatalogEventField, CatalogBuildType, fetchExhibitors, Exhibitor, fetchExhibitions, Exhibition } from '../../services/api';

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

  // dictionaries state
  const [openTags, setOpenTags] = useState(false);
  const [openIndustries, setOpenIndustries] = useState(false);
  const [openBrands, setOpenBrands] = useState(false);
  const [openEventFields, setOpenEventFields] = useState(false);
  const [openBuildTypes, setOpenBuildTypes] = useState(false);
  const [tags, setTags] = useState<CatalogTag[]>([]);
  const [industries, setIndustries] = useState<CatalogIndustry[]>([]);
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [eventFields, setEventFields] = useState<CatalogEventField[]>([]);
  const [buildTypes, setBuildTypes] = useState<CatalogBuildType[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newEventField, setNewEventField] = useState('');
  const [newBuildType, setNewBuildType] = useState('');
  const [editingTag, setEditingTag] = useState<{ old: string; next: string } | null>(null);
  const [editingIndustry, setEditingIndustry] = useState<{ old: string; next: string } | null>(null);
  const [editingBrand, setEditingBrand] = useState<{ old: string; next: string } | null>(null);
  const [editingEventField, setEditingEventField] = useState<{ old: string; next: string } | null>(null);
  const [editingBuildType, setEditingBuildType] = useState<{ old: string; next: string } | null>(null);
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

  // load dictionaries when opening
  const openTagsModal = useCallback(async () => {
    if (!token) return;
    try {
      const list = await catalogAPI.listTags(token);
      setTags(list);
      setNewTag('');
      setEditingTag(null);
      setOpenTags(true);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const openIndustriesModal = useCallback(async () => {
    if (!token) return;
    try {
      const list = await catalogAPI.listIndustries(token);
      setIndustries(list);
      setNewIndustry('');
      setEditingIndustry(null);
      setOpenIndustries(true);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const openBrandsModal = useCallback(async () => {
    if (!token) return;
    try {
      const list = await catalogAPI.listBrands(token);
      setBrands(list);
      setNewBrand('');
      setEditingBrand(null);
      setOpenBrands(true);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const openEventFieldsModal = useCallback(async () => {
    if (!token) return;
    try {
      const list = await catalogAPI.listEventFields(token);
      setEventFields(list);
      setNewEventField('');
      setEditingEventField(null);
      setOpenEventFields(true);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const openBuildTypesModal = useCallback(async () => {
    if (!token) return;
    try {
      const list = await catalogAPI.listBuildTypes(token);
      setBuildTypes(list);
      setNewBuildType('');
      setEditingBuildType(null);
      setOpenBuildTypes(true);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const addTag = async () => {
    if (!token) return;
    const v = newTag.trim();
    if (!v) return;
    await catalogAPI.addTag(token, v);
    setTags(prev => {
      const exists = prev.some(t => t.tag.toLowerCase() === v.toLowerCase());
      return exists ? prev : [...prev, { tag: v, usage_count: 1 }].sort((a, b) => a.tag.localeCompare(b.tag));
    });
    setNewTag('');
  };

  const saveTagRename = async () => {
    if (!token || !editingTag) return;
    const next = editingTag.next.trim();
    if (!next || next === editingTag.old) { setEditingTag(null); return; }
    await catalogAPI.renameTag(token, editingTag.old, next);
    setTags(prev => prev.map(t => t.tag === editingTag.old ? { ...t, tag: next } : t).sort((a, b) => a.tag.localeCompare(b.tag)));
    setEditingTag(null);
  };

  const deleteTag = async (tag: string) => {
    if (!token) return;
    await catalogAPI.deleteTag(token, tag);
    setTags(prev => prev.filter(t => t.tag !== tag));
  };

  const addIndustry = async () => {
    if (!token) return;
    const v = newIndustry.trim();
    if (!v) return;
    await catalogAPI.addIndustry(token, v);
    setIndustries(prev => {
      const exists = prev.some(t => t.industry.toLowerCase() === v.toLowerCase());
      return exists ? prev : [...prev, { industry: v, usage_count: 1 }].sort((a, b) => a.industry.localeCompare(b.industry));
    });
    setNewIndustry('');
  };

  const saveIndustryRename = async () => {
    if (!token || !editingIndustry) return;
    const next = editingIndustry.next.trim();
    if (!next || next === editingIndustry.old) { setEditingIndustry(null); return; }
    await catalogAPI.renameIndustry(token, editingIndustry.old, next);
    setIndustries(prev => prev.map(t => t.industry === editingIndustry.old ? { ...t, industry: next } : t).sort((a, b) => a.industry.localeCompare(b.industry)));
    setEditingIndustry(null);
  };

  const deleteIndustry = async (industry: string) => {
    if (!token) return;
    await catalogAPI.deleteIndustry(token, industry);
    setIndustries(prev => prev.filter(t => t.industry !== industry));
  };

  const addBrand = async () => {
    if (!token) return;
    const v = newBrand.trim();
    if (!v) return;
    await catalogAPI.addBrand(token, v);
    setBrands(prev => {
      const exists = prev.some(t => t.brand.toLowerCase() === v.toLowerCase());
      return exists ? prev : [...prev, { brand: v, usage_count: 1 }].sort((a, b) => a.brand.localeCompare(b.brand));
    });
    setNewBrand('');
  };

  const saveBrandRename = async () => {
    if (!token || !editingBrand) return;
    const next = editingBrand.next.trim();
    if (!next || next === editingBrand.old) { setEditingBrand(null); return; }
    await catalogAPI.renameBrand(token, editingBrand.old, next);
    setBrands(prev => prev.map(t => t.brand === editingBrand.old ? { ...t, brand: next } : t).sort((a, b) => a.brand.localeCompare(b.brand)));
    setEditingBrand(null);
  };

  const deleteBrand = async (brand: string) => {
    if (!token) return;
    await catalogAPI.deleteBrand(token, brand);
    setBrands(prev => prev.filter(t => t.brand !== brand));
  };

  const addEventField = async () => {
    if (!token) return;
    const v = newEventField.trim();
    if (!v) return;
    await catalogAPI.addEventField(token, v);
    setEventFields(prev => {
      const exists = prev.some(t => t.event_field.toLowerCase() === v.toLowerCase());
      return exists ? prev : [...prev, { event_field: v, usage_count: 1 }].sort((a, b) => a.event_field.localeCompare(b.event_field));
    });
    setNewEventField('');
  };

  const saveEventFieldRename = async () => {
    if (!token || !editingEventField) return;
    const next = editingEventField.next.trim();
    if (!next || next === editingEventField.old) { setEditingEventField(null); return; }
    await catalogAPI.renameEventField(token, editingEventField.old, next);
    setEventFields(prev => prev.map(t => t.event_field === editingEventField.old ? { ...t, event_field: next } : t).sort((a, b) => a.event_field.localeCompare(b.event_field)));
    setEditingEventField(null);
  };

  const deleteEventField = async (value: string) => {
    if (!token) return;
    await catalogAPI.deleteEventField(token, value);
    setEventFields(prev => prev.filter(t => t.event_field !== value));
  };

  const addBuildType = async () => {
    if (!token) return;
    const v = newBuildType.trim();
    if (!v) return;
    await catalogAPI.addBuildType(token, v);
    setBuildTypes(prev => {
      const exists = prev.some(t => t.build_type.toLowerCase() === v.toLowerCase());
      return exists ? prev : [...prev, { build_type: v, usage_count: 1 }].sort((a, b) => a.build_type.localeCompare(b.build_type));
    });
    setNewBuildType('');
  };

  const saveBuildTypeRename = async () => {
    if (!token || !editingBuildType) return;
    const next = editingBuildType.next.trim();
    if (!next || next === editingBuildType.old) { setEditingBuildType(null); return; }
    await catalogAPI.renameBuildType(token, editingBuildType.old, next);
    setBuildTypes(prev => prev.map(t => t.build_type === editingBuildType.old ? { ...t, build_type: next } : t).sort((a, b) => a.build_type.localeCompare(b.build_type)));
    setEditingBuildType(null);
  };

  const deleteBuildType = async (value: string) => {
    if (!token) return;
    await catalogAPI.deleteBuildType(token, value);
    setBuildTypes(prev => prev.filter(t => t.build_type !== value));
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
              
              {/* Tabs */}
              <Box ref={tabsRef} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={currentTab} onChange={(_e, newValue) => setCurrentTab(newValue)}>
                  <Tab label="Osoby" />
                  <Tab label="Słowniki" />
                  <Tab label="Zaproszenia" />
                </Tabs>
              </Box>

              {/* Tab Content Container - unified height to prevent jumping */}
              <Box sx={{ minHeight: '600px', position: 'relative' }}>
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
                    <CustomTypography sx={{ mb: 3, fontSize: '1.1rem', fontWeight: 500 }}>
                      Zarządzanie słownikami
                    </CustomTypography>
                <Box className={`${styles.dictButtonsRow}`}>
                  <div className={styles.dictButton}>
                    <CustomButton
                      bgColor="#6F87F6"
                      textColor="#fff"
                      height="28px"
                      width="auto"
                      fontSize="0.75rem"
                      onClick={openTagsModal}
                    >
                      Hashtagi
                    </CustomButton>
                  </div>
                  <div className={styles.dictButton}>
                    <CustomButton
                      bgColor="#6F87F6"
                      textColor="#fff"
                      height="28px"
                      width="auto"
                      fontSize="0.75rem"
                      onClick={openIndustriesModal}
                    >
                      Sektory branżowe
                    </CustomButton>
                  </div>
                  <div className={styles.dictButton}>
                    <CustomButton
                      bgColor="#6F87F6"
                      textColor="#fff"
                      height="28px"
                      width="auto"
                      fontSize="0.75rem"
                      onClick={openEventFieldsModal}
                    >
                      Branże wydarzenia
                    </CustomButton>
                  </div>
                  <div className={styles.dictButton}>
                    <CustomButton
                      bgColor="#6F87F6"
                      textColor="#fff"
                      height="28px"
                      width="auto"
                      fontSize="0.75rem"
                      onClick={openBuildTypesModal}
                    >
                      Typy zabudowy
                    </CustomButton>
                  </div>
                  <div className={styles.dictButton}>
                    <CustomButton
                      bgColor="#6F87F6"
                      textColor="#fff"
                      height="28px"
                      width="auto"
                      fontSize="0.75rem"
                      onClick={openBrandsModal}
                    >
                      Marki
                    </CustomButton>
                  </div>
                  </Box>
                </Box>
              )}

              {/* Tab: Zaproszenia */}
              {currentTab === 2 && (
                <Box>
                  <InvitationsTab />
                </Box>
              )}
            </Box>
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

      {/* Tags modal */}
      <Dialog open={openTags} onClose={() => setOpenTags(false)} maxWidth="sm" fullWidth PaperProps={{ className: styles.customDialogPaper }}>
        <DialogTitle className={styles.dialogTitle}>
          <Box>
            <CustomTypography className={styles.dialogTitleMain}>Zarządzaj tagami</CustomTypography>
            <CustomTypography className={styles.dialogSubtitle}>Dodawaj, edytuj i usuwaj tagi używane w katalogu</CustomTypography>
          </Box>
        </DialogTitle>
        <DialogContent className={styles.dictionaryDialogContent}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, mt: 1 }}>
            <TextField
              label="Nowy tag"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              size="small"
            />
            <CustomButton
              bgColor="#6F87F6"
              textColor="#fff"
              height="32px"
              width="auto"
              fontSize="0.8rem"
              onClick={addTag}
              icon={<AddIcon sx={{ color: '#fff', fontSize: 18 }} />}
              iconPosition="left"
            >
              Dodaj
            </CustomButton>
          </Box>
          <Table size="small" className={styles.dictionaryTable}>
            <TableHead>
              <TableRow>
                <TableCell>Nazwa</TableCell>
                <TableCell align="right">Użycia</TableCell>
                <TableCell align="right">Akcje</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tags.sort((a, b) => a.tag.localeCompare(b.tag)).map(row => (
                <TableRow key={row.tag}>
                  <TableCell>
                    {editingTag && editingTag.old === row.tag ? (
                      <TextField
                        value={editingTag.next}
                        onChange={e => setEditingTag({ old: editingTag.old, next: e.target.value })}
                        size="small"
                      />
                    ) : (
                      row.tag
                    )}
                  </TableCell>
                  <TableCell align="right">{row.usage_count}</TableCell>
                  <TableCell align="right">
                    {editingTag && editingTag.old === row.tag ? (
                      <>
                        <CustomButton
                          bgColor="#6F87F6"
                          textColor="#fff"
                          height="28px"
                          width="auto"
                          fontSize="0.75rem"
                          onClick={saveTagRename}
                        >
                          Zapisz
                        </CustomButton>
                        <CustomButton
                          bgColor="#e9ecef"
                          textColor="#2e2e38"
                          height="28px"
                          width="auto"
                          fontSize="0.75rem"
                          onClick={() => setEditingTag(null)}
                        >
                          Anuluj
                        </CustomButton>
                      </>
                    ) : (
                      <>
                        <IconButton size="small" onClick={() => setEditingTag({ old: row.tag, next: row.tag })}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => deleteTag(row.tag)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {tags.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>Brak tagów</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions className={styles.dialogAction}>
          <CustomButton
            bgColor="transparent"
            textColor="#6c757d"
            width="auto"
            height="36px"
            onClick={() => setOpenTags(false)}
            sx={{ border: '1px solid #e0e0e0', '&:hover': { backgroundColor: '#f5f5f5' } }}
          >
            Zamknij
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Industries modal */}
      <Dialog open={openIndustries} onClose={() => setOpenIndustries(false)} maxWidth="sm" fullWidth PaperProps={{ className: styles.customDialogPaper }}>
        <DialogTitle className={styles.dialogTitle}>
          <Box>
            <CustomTypography className={styles.dialogTitleMain}>Zarządzaj branżami</CustomTypography>
            <CustomTypography className={styles.dialogSubtitle}>Lista branż przypisywanych do wystawców</CustomTypography>
          </Box>
        </DialogTitle>
        <DialogContent className={styles.dictionaryDialogContent}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, mt: 1 }}>
            <TextField
              label="Nowa branża"
              value={newIndustry}
              onChange={e => setNewIndustry(e.target.value)}
              size="small"
            />
            <CustomButton
              bgColor="#6F87F6"
              textColor="#fff"
              height="32px"
              width="auto"
              fontSize="0.8rem"
              onClick={addIndustry}
              icon={<AddIcon sx={{ color: '#fff', fontSize: 18 }} />}
              iconPosition="left"
            >
              Dodaj
            </CustomButton>
          </Box>
          <Table size="small" className={styles.dictionaryTable}>
            <TableHead>
              <TableRow>
                <TableCell>Nazwa</TableCell>
                <TableCell align="right">Użycia</TableCell>
                <TableCell align="right">Akcje</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {industries.sort((a, b) => a.industry.localeCompare(b.industry)).map(row => (
                <TableRow key={row.industry}>
                  <TableCell>
                    {editingIndustry && editingIndustry.old === row.industry ? (
                      <TextField
                        value={editingIndustry.next}
                        onChange={e => setEditingIndustry({ old: editingIndustry.old, next: e.target.value })}
                        size="small"
                      />
                    ) : (
                      row.industry
                    )}
                  </TableCell>
                  <TableCell align="right">{row.usage_count}</TableCell>
                  <TableCell align="right">
                    {editingIndustry && editingIndustry.old === row.industry ? (
                      <>
                        <CustomButton
                          bgColor="#6F87F6"
                          textColor="#fff"
                          height="28px"
                          width="auto"
                          fontSize="0.75rem"
                          onClick={saveIndustryRename}
                        >
                          Zapisz
                        </CustomButton>
                        <CustomButton
                          bgColor="#e9ecef"
                          textColor="#2e2e38"
                          height="28px"
                          width="auto"
                          fontSize="0.75rem"
                          onClick={() => setEditingIndustry(null)}
                        >
                          Anuluj
                        </CustomButton>
                      </>
                    ) : (
                      <>
                        <IconButton size="small" onClick={() => setEditingIndustry({ old: row.industry, next: row.industry })}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => deleteIndustry(row.industry)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {industries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>Brak branż</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions className={styles.dialogAction}>
          <CustomButton
            bgColor="transparent"
            textColor="#6c757d"
            width="auto"
            height="36px"
            onClick={() => setOpenIndustries(false)}
            sx={{ border: '1px solid #e0e0e0', '&:hover': { backgroundColor: '#f5f5f5' } }}
          >
            Zamknij
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Brands modal */}
      <Dialog open={openBrands} onClose={() => setOpenBrands(false)} maxWidth="sm" fullWidth PaperProps={{ className: styles.customDialogPaper }}>
        <DialogTitle className={styles.dialogTitle}>
          <Box>
            <CustomTypography className={styles.dialogTitleMain}>Zarządzaj markami</CustomTypography>
            <CustomTypography className={styles.dialogSubtitle}>Marki przypisywane produktom lub firmom</CustomTypography>
          </Box>
        </DialogTitle>
        <DialogContent className={styles.dictionaryDialogContent}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, mt: 1 }}>
            <TextField
              label="Nowa marka"
              value={newBrand}
              onChange={e => setNewBrand(e.target.value)}
              size="small"
            />
            <CustomButton
              bgColor="#6F87F6"
              textColor="#fff"
              height="32px"
              width="auto"
              fontSize="0.8rem"
              onClick={addBrand}
              icon={<AddIcon sx={{ color: '#fff', fontSize: 18 }} />}
              iconPosition="left"
            >
              Dodaj
            </CustomButton>
          </Box>
          <Table size="small" className={styles.dictionaryTable}>
            <TableHead>
              <TableRow>
                <TableCell>Nazwa</TableCell>
                <TableCell align="right">Użycia</TableCell>
                <TableCell align="right">Akcje</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {brands.sort((a, b) => a.brand.localeCompare(b.brand)).map(row => (
                <TableRow key={row.brand}>
                  <TableCell>
                    {editingBrand && editingBrand.old === row.brand ? (
                      <TextField
                        value={editingBrand.next}
                        onChange={e => setEditingBrand({ old: editingBrand.old, next: e.target.value })}
                        size="small"
                      />
                    ) : (
                      row.brand
                    )}
                  </TableCell>
                  <TableCell align="right">{row.usage_count}</TableCell>
                  <TableCell align="right">
                    {editingBrand && editingBrand.old === row.brand ? (
                      <>
                        <CustomButton
                          bgColor="#6F87F6"
                          textColor="#fff"
                          height="28px"
                          width="auto"
                          fontSize="0.75rem"
                          onClick={saveBrandRename}
                        >
                          Zapisz
                        </CustomButton>
                        <CustomButton
                          bgColor="#e9ecef"
                          textColor="#2e2e38"
                          height="28px"
                          width="auto"
                          fontSize="0.75rem"
                          onClick={() => setEditingBrand(null)}
                        >
                          Anuluj
                        </CustomButton>
                      </>
                    ) : (
                      <>
                        <IconButton size="small" onClick={() => setEditingBrand({ old: row.brand, next: row.brand })}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => deleteBrand(row.brand)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {brands.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>Brak marek</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions className={styles.dialogAction}>
          <CustomButton
            bgColor="transparent"
            textColor="#6c757d"
            width="auto"
            height="36px"
            onClick={() => setOpenBrands(false)}
            sx={{ border: '1px solid #e0e0e0', '&:hover': { backgroundColor: '#f5f5f5' } }}
          >
            Zamknij
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Event fields modal */}
      <Dialog open={openEventFields} onClose={() => setOpenEventFields(false)} maxWidth="sm" fullWidth PaperProps={{ className: styles.customDialogPaper }}>
        <DialogTitle className={styles.dialogTitle}>
          <Box>
            <CustomTypography className={styles.dialogTitleMain}>Zarządzaj branżami wydarzenia</CustomTypography>
            <CustomTypography className={styles.dialogSubtitle}>Kategorie tematyczne wydarzeń</CustomTypography>
          </Box>
        </DialogTitle>
        <DialogContent className={styles.dictionaryDialogContent}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, mt: 1 }}>
            <TextField
              label="Nowy typ branży wydarzenia"
              value={newEventField}
              onChange={e => setNewEventField(e.target.value)}
              size="small"
            />
            <CustomButton
              bgColor="#6F87F6"
              textColor="#fff"
              height="32px"
              width="auto"
              fontSize="0.8rem"
              onClick={addEventField}
              icon={<AddIcon sx={{ color: '#fff', fontSize: 18 }} />}
              iconPosition="left"
            >
              Dodaj
            </CustomButton>
          </Box>
          <Table size="small" className={styles.dictionaryTable}>
            <TableHead>
              <TableRow>
                <TableCell>Nazwa</TableCell>
                <TableCell align="right">Użycia</TableCell>
                <TableCell align="right">Akcje</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {eventFields.sort((a, b) => a.event_field.localeCompare(b.event_field)).map(row => (
                <TableRow key={row.event_field}>
                  <TableCell>
                    {editingEventField && editingEventField.old === row.event_field ? (
                      <TextField
                        value={editingEventField.next}
                        onChange={e => setEditingEventField({ old: editingEventField.old, next: e.target.value })}
                        size="small"
                      />
                    ) : (
                      row.event_field
                    )}
                  </TableCell>
                  <TableCell align="right">{row.usage_count}</TableCell>
                  <TableCell align="right">
                    {editingEventField && editingEventField.old === row.event_field ? (
                      <>
                        <CustomButton
                          bgColor="#6F87F6"
                          textColor="#fff"
                          height="28px"
                          width="auto"
                          fontSize="0.75rem"
                          onClick={saveEventFieldRename}
                        >
                          Zapisz
                        </CustomButton>
                        <CustomButton
                          bgColor="#e9ecef"
                          textColor="#2e2e38"
                          height="28px"
                          width="auto"
                          fontSize="0.75rem"
                          onClick={() => setEditingEventField(null)}
                        >
                          Anuluj
                        </CustomButton>
                      </>
                    ) : (
                      <>
                        <IconButton size="small" onClick={() => setEditingEventField({ old: row.event_field, next: row.event_field })}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => deleteEventField(row.event_field)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {eventFields.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>Brak branż wydarzenia</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions className={styles.dialogAction}>
          <CustomButton
            bgColor="transparent"
            textColor="#6c757d"
            width="auto"
            height="36px"
            onClick={() => setOpenEventFields(false)}
            sx={{ border: '1px solid #e0e0e0', '&:hover': { backgroundColor: '#f5f5f5' } }}
          >
            Zamknij
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Build types modal */}
      <Dialog open={openBuildTypes} onClose={() => setOpenBuildTypes(false)} maxWidth="sm" fullWidth PaperProps={{ className: styles.customDialogPaper }}>
        <DialogTitle className={styles.dialogTitle}>
          <Box>
            <CustomTypography className={styles.dialogTitleMain}>Zarządzaj typami zabudowy</CustomTypography>
            <CustomTypography className={styles.dialogSubtitle}>Typy stoisk dostępne dla wystawców</CustomTypography>
          </Box>
        </DialogTitle>
        <DialogContent className={styles.dictionaryDialogContent}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, mt: 1 }}>
            <TextField
              label="Nowy typ zabudowy"
              value={newBuildType}
              onChange={e => setNewBuildType(e.target.value)}
              size="small"
            />
            <CustomButton
              bgColor="#6F87F6"
              textColor="#fff"
              height="32px"
              width="auto"
              fontSize="0.8rem"
              onClick={addBuildType}
              icon={<AddIcon sx={{ color: '#fff', fontSize: 18 }} />}
              iconPosition="left"
            >
              Dodaj
            </CustomButton>
          </Box>
          <Table size="small" className={styles.dictionaryTable}>
            <TableHead>
              <TableRow>
                <TableCell>Nazwa</TableCell>
                <TableCell align="right">Użycia</TableCell>
                <TableCell align="right">Akcje</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {buildTypes.sort((a, b) => a.build_type.localeCompare(b.build_type)).map(row => (
                <TableRow key={row.build_type}>
                  <TableCell>
                    {editingBuildType && editingBuildType.old === row.build_type ? (
                      <TextField
                        value={editingBuildType.next}
                        onChange={e => setEditingBuildType({ old: editingBuildType.old, next: e.target.value })}
                        size="small"
                      />
                    ) : (
                      row.build_type
                    )}
                  </TableCell>
                  <TableCell align="right">{row.usage_count}</TableCell>
                  <TableCell align="right">
                    {editingBuildType && editingBuildType.old === row.build_type ? (
                      <>
                        <CustomButton
                          bgColor="#6F87F6"
                          textColor="#fff"
                          height="28px"
                          width="auto"
                          fontSize="0.75rem"
                          onClick={saveBuildTypeRename}
                        >
                          Zapisz
                        </CustomButton>
                        <CustomButton
                          bgColor="#e9ecef"
                          textColor="#2e2e38"
                          height="28px"
                          width="auto"
                          fontSize="0.75rem"
                          onClick={() => setEditingBuildType(null)}
                        >
                          Anuluj
                        </CustomButton>
                      </>
                    ) : (
                      <>
                        <IconButton size="small" onClick={() => setEditingBuildType({ old: row.build_type, next: row.build_type })}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => deleteBuildType(row.build_type)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {buildTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>Brak typów zabudowy</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions className={styles.dialogAction}>
          <CustomButton
            bgColor="transparent"
            textColor="#6c757d"
            width="auto"
            height="36px"
            onClick={() => setOpenBuildTypes(false)}
            sx={{ border: '1px solid #e0e0e0', '&:hover': { backgroundColor: '#f5f5f5' } }}
          >
            Zamknij
          </CustomButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DatabasePage;


