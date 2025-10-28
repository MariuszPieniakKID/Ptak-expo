import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  IconButton,
  Alert,
  TablePagination
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

import { catalogAPI } from '../../services/api';

type DictionaryType = 'tags' | 'industries' | 'eventFields' | 'buildTypes' | 'brands' | null;

const DictionariesTab: React.FC = () => {
  const { token } = useAuth();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedDictionary, setSelectedDictionary] = useState<DictionaryType>(null);

  // Search & Pagination
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);

  // Tags
  const [tags, setTags] = useState<any[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [editingTag, setEditingTag] = useState<{ id: number; value: string } | null>(null);

  // Industries
  const [industries, setIndustries] = useState<any[]>([]);
  const [newIndustry, setNewIndustry] = useState<string>('');
  const [editingIndustry, setEditingIndustry] = useState<{ id: number; value: string } | null>(null);

  // Event Fields
  const [eventFields, setEventFields] = useState<any[]>([]);
  const [newEventField, setNewEventField] = useState<string>('');
  const [editingEventField, setEditingEventField] = useState<{ id: number; value: string } | null>(null);

  // Build Types
  const [buildTypes, setBuildTypes] = useState<any[]>([]);
  const [newBuildType, setNewBuildType] = useState<string>('');
  const [editingBuildType, setEditingBuildType] = useState<{ id: number; value: string } | null>(null);

  // Brands
  const [brands, setBrands] = useState<any[]>([]);
  const [newBrand, setNewBrand] = useState<string>('');
  const [editingBrand, setEditingBrand] = useState<{ id: number; value: string } | null>(null);

  const loadDictionary = useCallback(async (type: DictionaryType) => {
    if (!token || !type) return;
    try {
      setError('');
      if (type === 'tags') {
        const data = await catalogAPI.listTags(token);
        setTags(data);
      } else if (type === 'industries') {
        const data = await catalogAPI.listIndustries(token);
        setIndustries(data);
      } else if (type === 'eventFields') {
        const data = await catalogAPI.listEventFields(token);
        setEventFields(data);
      } else if (type === 'buildTypes') {
        const data = await catalogAPI.listBuildTypes(token);
        setBuildTypes(data);
      } else if (type === 'brands') {
        const data = await catalogAPI.listBrands(token);
        setBrands(data);
      }
    } catch (err) {
      console.error('Error loading dictionary:', err);
      setError('Błąd podczas ładowania słownika');
    }
  }, [token]);

  useEffect(() => {
    if (selectedDictionary) {
      loadDictionary(selectedDictionary);
      setSearch('');
      setPage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDictionary]);

  // Tags handlers
  const addTag = async () => {
    if (!token || !newTag.trim()) return;
    try {
      await catalogAPI.addTag(token, newTag.trim());
      await loadDictionary('tags');
      setNewTag('');
      setSuccess('Tag dodany pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas dodawania tagu');
    }
  };

  const saveTagRename = async () => {
    if (!token || !editingTag) return;
    try {
      const tagToEdit = tags.find(t => t.id === editingTag.id);
      if (!tagToEdit) return;
      await catalogAPI.renameTag(token, tagToEdit.tag, editingTag.value);
      await loadDictionary('tags');
      setEditingTag(null);
      setSuccess('Tag zaktualizowany pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas aktualizacji tagu');
    }
  };

  const deleteTag = async (value: string) => {
    if (!token) return;
    if (!window.confirm(`Czy na pewno chcesz usunąć: ${value}?`)) return;
    try {
      await catalogAPI.deleteTag(token, value);
      setTags(prev => prev.filter(t => t.tag !== value));
      setSuccess('Tag usunięty pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas usuwania tagu');
    }
  };

  // Industries handlers
  const addIndustry = async () => {
    if (!token || !newIndustry.trim()) return;
    try {
      await catalogAPI.addIndustry(token, newIndustry.trim());
      await loadDictionary('industries');
      setNewIndustry('');
      setSuccess('Sektor dodany pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas dodawania sektora');
    }
  };

  const saveIndustryRename = async () => {
    if (!token || !editingIndustry) return;
    try {
      const industryToEdit = industries.find(i => i.id === editingIndustry.id);
      if (!industryToEdit) return;
      await catalogAPI.renameIndustry(token, industryToEdit.industry, editingIndustry.value);
      await loadDictionary('industries');
      setEditingIndustry(null);
      setSuccess('Sektor zaktualizowany pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas aktualizacji sektora');
    }
  };

  const deleteIndustry = async (value: string) => {
    if (!token) return;
    if (!window.confirm(`Czy na pewno chcesz usunąć: ${value}?`)) return;
    try {
      await catalogAPI.deleteIndustry(token, value);
      setIndustries(prev => prev.filter(i => i.industry !== value));
      setSuccess('Sektor usunięty pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas usuwania sektora');
    }
  };

  // Event Fields handlers
  const addEventField = async () => {
    if (!token || !newEventField.trim()) return;
    try {
      await catalogAPI.addEventField(token, newEventField.trim());
      await loadDictionary('eventFields');
      setNewEventField('');
      setSuccess('Branża dodana pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas dodawania branży');
    }
  };

  const saveEventFieldRename = async () => {
    if (!token || !editingEventField) return;
    try {
      const fieldToEdit = eventFields.find(f => f.id === editingEventField.id);
      if (!fieldToEdit) return;
      await catalogAPI.renameEventField(token, fieldToEdit.event_field, editingEventField.value);
      await loadDictionary('eventFields');
      setEditingEventField(null);
      setSuccess('Branża zaktualizowana pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas aktualizacji branży');
    }
  };

  const deleteEventField = async (value: string) => {
    if (!token) return;
    if (!window.confirm(`Czy na pewno chcesz usunąć: ${value}?`)) return;
    try {
      await catalogAPI.deleteEventField(token, value);
      setEventFields(prev => prev.filter(f => f.event_field !== value));
      setSuccess('Branża usunięta pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas usuwania branży');
    }
  };

  // Build Types handlers
  const addBuildType = async () => {
    if (!token || !newBuildType.trim()) return;
    try {
      await catalogAPI.addBuildType(token, newBuildType.trim());
      await loadDictionary('buildTypes');
      setNewBuildType('');
      setSuccess('Typ zabudowy dodany pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas dodawania typu zabudowy');
    }
  };

  const saveBuildTypeRename = async () => {
    if (!token || !editingBuildType) return;
    try {
      const typeToEdit = buildTypes.find(t => t.id === editingBuildType.id);
      if (!typeToEdit) return;
      await catalogAPI.renameBuildType(token, typeToEdit.build_type, editingBuildType.value);
      await loadDictionary('buildTypes');
      setEditingBuildType(null);
      setSuccess('Typ zabudowy zaktualizowany pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas aktualizacji typu zabudowy');
    }
  };

  const deleteBuildType = async (value: string) => {
    if (!token) return;
    if (!window.confirm(`Czy na pewno chcesz usunąć: ${value}?`)) return;
    try {
      await catalogAPI.deleteBuildType(token, value);
      setBuildTypes(prev => prev.filter(t => t.build_type !== value));
      setSuccess('Typ zabudowy usunięty pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas usuwania typu zabudowy');
    }
  };

  // Brands handlers
  const addBrand = async () => {
    if (!token || !newBrand.trim()) return;
    try {
      await catalogAPI.addBrand(token, newBrand.trim());
      await loadDictionary('brands');
      setNewBrand('');
      setSuccess('Marka dodana pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas dodawania marki');
    }
  };

  const saveBrandRename = async () => {
    if (!token || !editingBrand) return;
    try {
      const brandToEdit = brands.find(b => b.id === editingBrand.id);
      if (!brandToEdit) return;
      await catalogAPI.renameBrand(token, brandToEdit.brand, editingBrand.value);
      await loadDictionary('brands');
      setEditingBrand(null);
      setSuccess('Marka zaktualizowana pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas aktualizacji marki');
    }
  };

  const deleteBrand = async (value: string) => {
    if (!token) return;
    if (!window.confirm(`Czy na pewno chcesz usunąć: ${value}?`)) return;
    try {
      await catalogAPI.deleteBrand(token, value);
      setBrands(prev => prev.filter(b => b.brand !== value));
      setSuccess('Marka usunięta pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas usuwania marki');
    }
  };

  // Get current data based on selected dictionary
  const getCurrentData = () => {
    if (selectedDictionary === 'tags') return tags;
    if (selectedDictionary === 'industries') return industries;
    if (selectedDictionary === 'eventFields') return eventFields;
    if (selectedDictionary === 'buildTypes') return buildTypes;
    if (selectedDictionary === 'brands') return brands;
    return [];
  };

  const getItemKey = () => {
    if (selectedDictionary === 'tags') return 'tag';
    if (selectedDictionary === 'industries') return 'industry';
    if (selectedDictionary === 'eventFields') return 'event_field';
    if (selectedDictionary === 'buildTypes') return 'build_type';
    if (selectedDictionary === 'brands') return 'brand';
    return '';
  };

  const getCurrentEditing = () => {
    if (selectedDictionary === 'tags') return editingTag;
    if (selectedDictionary === 'industries') return editingIndustry;
    if (selectedDictionary === 'eventFields') return editingEventField;
    if (selectedDictionary === 'buildTypes') return editingBuildType;
    if (selectedDictionary === 'brands') return editingBrand;
    return null;
  };

  const setCurrentEditing = (val: any) => {
    if (selectedDictionary === 'tags') setEditingTag(val);
    if (selectedDictionary === 'industries') setEditingIndustry(val);
    if (selectedDictionary === 'eventFields') setEditingEventField(val);
    if (selectedDictionary === 'buildTypes') setEditingBuildType(val);
    if (selectedDictionary === 'brands') setEditingBrand(val);
  };

  const saveCurrentEdit = () => {
    if (selectedDictionary === 'tags') saveTagRename();
    if (selectedDictionary === 'industries') saveIndustryRename();
    if (selectedDictionary === 'eventFields') saveEventFieldRename();
    if (selectedDictionary === 'buildTypes') saveBuildTypeRename();
    if (selectedDictionary === 'brands') saveBrandRename();
  };

  const deleteCurrentItem = (value: string) => {
    if (selectedDictionary === 'tags') deleteTag(value);
    if (selectedDictionary === 'industries') deleteIndustry(value);
    if (selectedDictionary === 'eventFields') deleteEventField(value);
    if (selectedDictionary === 'buildTypes') deleteBuildType(value);
    if (selectedDictionary === 'brands') deleteBrand(value);
  };

  const getCurrentNewValue = () => {
    if (selectedDictionary === 'tags') return newTag;
    if (selectedDictionary === 'industries') return newIndustry;
    if (selectedDictionary === 'eventFields') return newEventField;
    if (selectedDictionary === 'buildTypes') return newBuildType;
    if (selectedDictionary === 'brands') return newBrand;
    return '';
  };

  const setCurrentNewValue = (val: string) => {
    if (selectedDictionary === 'tags') setNewTag(val);
    if (selectedDictionary === 'industries') setNewIndustry(val);
    if (selectedDictionary === 'eventFields') setNewEventField(val);
    if (selectedDictionary === 'buildTypes') setNewBuildType(val);
    if (selectedDictionary === 'brands') setNewBrand(val);
  };

  const addCurrentItem = () => {
    if (selectedDictionary === 'tags') addTag();
    if (selectedDictionary === 'industries') addIndustry();
    if (selectedDictionary === 'eventFields') addEventField();
    if (selectedDictionary === 'buildTypes') addBuildType();
    if (selectedDictionary === 'brands') addBrand();
  };

  const getLabel = () => {
    if (selectedDictionary === 'tags') return 'Tag';
    if (selectedDictionary === 'industries') return 'Sektor';
    if (selectedDictionary === 'eventFields') return 'Branża';
    if (selectedDictionary === 'buildTypes') return 'Typ zabudowy';
    if (selectedDictionary === 'brands') return 'Marka';
    return '';
  };

  // Filtered and paginated data
  const filteredData = useMemo(() => {
    const data = getCurrentData();
    const itemKey = getItemKey();
    if (!search.trim() || !itemKey) return data;
    
    const searchLower = search.toLowerCase();
    return data.filter((item: any) => 
      item[itemKey]?.toLowerCase().includes(searchLower)
    );
  }, [selectedDictionary, search, tags, industries, eventFields, buildTypes, brands]);

  const paginatedData = useMemo(() => {
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  return (
    <Box sx={{ width: '100%' }}>
      <CustomTypography sx={{ mb: 3, fontSize: '1.1rem', fontWeight: 500 }}>
        Zarządzanie słownikami
      </CustomTypography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Dictionary buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <CustomButton
          bgColor={selectedDictionary === 'tags' ? '#5041d0' : '#6F87F6'}
          textColor="#fff"
          height="36px"
          width="auto"
          fontSize="0.85rem"
          onClick={() => setSelectedDictionary('tags')}
        >
          Tagi
        </CustomButton>
        <CustomButton
          bgColor={selectedDictionary === 'industries' ? '#5041d0' : '#6F87F6'}
          textColor="#fff"
          height="36px"
          width="auto"
          fontSize="0.85rem"
          onClick={() => setSelectedDictionary('industries')}
        >
          Sektory branżowe
        </CustomButton>
        <CustomButton
          bgColor={selectedDictionary === 'eventFields' ? '#5041d0' : '#6F87F6'}
          textColor="#fff"
          height="36px"
          width="auto"
          fontSize="0.85rem"
          onClick={() => setSelectedDictionary('eventFields')}
        >
          Branże wydarzenia
        </CustomButton>
        <CustomButton
          bgColor={selectedDictionary === 'buildTypes' ? '#5041d0' : '#6F87F6'}
          textColor="#fff"
          height="36px"
          width="auto"
          fontSize="0.85rem"
          onClick={() => setSelectedDictionary('buildTypes')}
        >
          Typy zabudowy
        </CustomButton>
        <CustomButton
          bgColor={selectedDictionary === 'brands' ? '#5041d0' : '#6F87F6'}
          textColor="#fff"
          height="36px"
          width="auto"
          fontSize="0.85rem"
          onClick={() => setSelectedDictionary('brands')}
        >
          Marki
        </CustomButton>
      </Box>

      {/* Content area */}
      {selectedDictionary && (
        <Box>
          {/* Add new */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
              <CustomField
                type="text"
                value={getCurrentNewValue()}
                onChange={(e) => setCurrentNewValue(e.target.value)}
                placeholder={`Nowy ${getLabel().toLowerCase()}...`}
              />
            </Box>
            <CustomButton
              onClick={addCurrentItem}
              icon={<AddIcon />}
              iconPosition="left"
              bgColor="#4caf50"
              textColor="#fff"
              disabled={!getCurrentNewValue().trim()}
            >
              Dodaj
            </CustomButton>
          </Box>

          {/* Search */}
          <Box sx={{ mb: 2 }}>
            <CustomField
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Szukaj..."
            />
          </Box>

          {/* Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="60%">Nazwa</TableCell>
                  <TableCell width="20%" align="right">Użycia</TableCell>
                  <TableCell width="20%" align="right">Akcje</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <CustomTypography sx={{ py: 2, color: '#999' }}>
                        {search ? 'Nie znaleziono wyników' : 'Brak elementów'}
                      </CustomTypography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item: any) => {
                    const itemKey = getItemKey();
                    const editing = getCurrentEditing();
                    const isEditing = editing && editing.id === item.id;

                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          {isEditing ? (
                            <CustomField
                              type="text"
                              value={editing.value}
                              onChange={(e) => setCurrentEditing({ ...editing, value: e.target.value })}
                            />
                          ) : (
                            <CustomTypography>{item[itemKey]}</CustomTypography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <CustomTypography>{item.usage_count || 0}</CustomTypography>
                        </TableCell>
                        <TableCell align="right">
                          {isEditing ? (
                            <>
                              <IconButton
                                size="small"
                                onClick={saveCurrentEdit}
                                sx={{ color: '#4caf50', mr: 1 }}
                              >
                                <CheckIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => setCurrentEditing(null)}
                                sx={{ color: '#999' }}
                              >
                                <CloseIcon />
                              </IconButton>
                            </>
                          ) : (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => setCurrentEditing({ id: item.id, value: item[itemKey] })}
                                sx={{ color: '#1976d2', mr: 1 }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => deleteCurrentItem(item[itemKey])}
                                sx={{ color: '#f44336' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredData.length}
            page={page}
            onPageChange={(_e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Wierszy na stronę:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} z ${count}`}
          />
        </Box>
      )}

      {!selectedDictionary && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CustomTypography sx={{ color: '#999', fontSize: '1.1rem' }}>
            Wybierz słownik do edycji
          </CustomTypography>
        </Box>
      )}
    </Box>
  );
};

export default DictionariesTab;
