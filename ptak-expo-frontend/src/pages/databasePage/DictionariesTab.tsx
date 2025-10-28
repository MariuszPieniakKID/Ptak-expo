import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomButton from '../../components/customButton/CustomButton';
import CustomField from '../../components/customField/CustomField';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

import { catalogAPI } from '../../services/api';

const DictionariesTab: React.FC = () => {
  const { token } = useAuth();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

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

  // Load all dictionaries
  useEffect(() => {
    loadAllDictionaries();
  }, [token]);

  const loadAllDictionaries = async () => {
    if (!token) return;
    try {
      const [tagsData, industriesData, eventFieldsData, buildTypesData, brandsData] = await Promise.all([
        catalogAPI.listTags(token),
        catalogAPI.listIndustries(token),
        catalogAPI.listEventFields(token),
        catalogAPI.listBuildTypes(token),
        catalogAPI.listBrands(token)
      ]);
      setTags(tagsData);
      setIndustries(industriesData);
      setEventFields(eventFieldsData);
      setBuildTypes(buildTypesData);
      setBrands(brandsData);
    } catch (err) {
      console.error('Error loading dictionaries:', err);
      setError('Błąd podczas ładowania słowników');
    }
  };

  // Tags handlers
  const addTag = async () => {
    if (!token || !newTag.trim()) return;
    try {
      await catalogAPI.addTag(token, newTag.trim());
      const updatedTags = await catalogAPI.listTags(token);
      setTags(updatedTags);
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
      const updatedTags = await catalogAPI.listTags(token);
      setTags(updatedTags);
      setEditingTag(null);
      setSuccess('Tag zaktualizowany pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas aktualizacji tagu');
    }
  };

  const deleteTag = async (value: string) => {
    if (!token) return;
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
      const updated = await catalogAPI.listIndustries(token);
      setIndustries(updated);
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
      const updated = await catalogAPI.listIndustries(token);
      setIndustries(updated);
      setEditingIndustry(null);
      setSuccess('Sektor zaktualizowany pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas aktualizacji sektora');
    }
  };

  const deleteIndustry = async (value: string) => {
    if (!token) return;
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
      const updated = await catalogAPI.listEventFields(token);
      setEventFields(updated);
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
      const updated = await catalogAPI.listEventFields(token);
      setEventFields(updated);
      setEditingEventField(null);
      setSuccess('Branża zaktualizowana pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas aktualizacji branży');
    }
  };

  const deleteEventField = async (value: string) => {
    if (!token) return;
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
      const updated = await catalogAPI.listBuildTypes(token);
      setBuildTypes(updated);
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
      const updated = await catalogAPI.listBuildTypes(token);
      setBuildTypes(updated);
      setEditingBuildType(null);
      setSuccess('Typ zabudowy zaktualizowany pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas aktualizacji typu zabudowy');
    }
  };

  const deleteBuildType = async (value: string) => {
    if (!token) return;
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
      const updated = await catalogAPI.listBrands(token);
      setBrands(updated);
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
      const updated = await catalogAPI.listBrands(token);
      setBrands(updated);
      setEditingBrand(null);
      setSuccess('Marka zaktualizowana pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas aktualizacji marki');
    }
  };

  const deleteBrand = async (value: string) => {
    if (!token) return;
    try {
      await catalogAPI.deleteBrand(token, value);
      setBrands(prev => prev.filter(b => b.brand !== value));
      setSuccess('Marka usunięta pomyślnie');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Błąd podczas usuwania marki');
    }
  };

  const renderDictionaryTable = (
    items: any[],
    itemKey: string,
    editing: any,
    setEditing: (val: any) => void,
    saveEdit: () => void,
    deleteItem: (val: string) => void,
    newValue: string,
    setNewValue: (val: string) => void,
    addItem: () => void,
    label: string
  ) => (
    <Box>
      {/* Add new */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
          <CustomField
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={`Nowy ${label.toLowerCase()}...`}
          />
        </Box>
        <CustomButton
          onClick={addItem}
          icon={<AddIcon />}
          iconPosition="left"
          bgColor="#4caf50"
          textColor="#fff"
          disabled={!newValue.trim()}
        >
          Dodaj
        </CustomButton>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="80%">{label}</TableCell>
              <TableCell width="20%" align="right">Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  <CustomTypography sx={{ py: 2, color: '#999' }}>
                    Brak elementów
                  </CustomTypography>
                </TableCell>
              </TableRow>
            ) : (
              items.sort((a, b) => {
                const aVal = a[itemKey] || '';
                const bVal = b[itemKey] || '';
                return aVal.localeCompare(bVal);
              }).map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    {editing && editing.id === item.id ? (
                      <CustomField
                        type="text"
                        value={editing.value}
                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                      />
                    ) : (
                      <CustomTypography>{item[itemKey]}</CustomTypography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {editing && editing.id === item.id ? (
                      <>
                        <IconButton
                          size="small"
                          onClick={saveEdit}
                          sx={{ color: '#4caf50', mr: 1 }}
                        >
                          <CheckIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setEditing(null)}
                          sx={{ color: '#999' }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => setEditing({ id: item.id, value: item[itemKey] })}
                          sx={{ color: '#1976d2', mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (window.confirm(`Czy na pewno chcesz usunąć: ${item[itemKey]}?`)) {
                              deleteItem(item[itemKey]);
                            }
                          }}
                          sx={{ color: '#f44336' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

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

      {/* Tags */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <CustomTypography sx={{ fontWeight: 500 }}>
            Tagi ({tags.length})
          </CustomTypography>
        </AccordionSummary>
        <AccordionDetails>
          {renderDictionaryTable(
            tags,
            'tag',
            editingTag,
            setEditingTag,
            saveTagRename,
            deleteTag,
            newTag,
            setNewTag,
            addTag,
            'Tag'
          )}
        </AccordionDetails>
      </Accordion>

      {/* Industries */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <CustomTypography sx={{ fontWeight: 500 }}>
            Sektory branżowe ({industries.length})
          </CustomTypography>
        </AccordionSummary>
        <AccordionDetails>
          {renderDictionaryTable(
            industries,
            'industry',
            editingIndustry,
            setEditingIndustry,
            saveIndustryRename,
            deleteIndustry,
            newIndustry,
            setNewIndustry,
            addIndustry,
            'Sektor'
          )}
        </AccordionDetails>
      </Accordion>

      {/* Event Fields */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <CustomTypography sx={{ fontWeight: 500 }}>
            Branże wydarzenia ({eventFields.length})
          </CustomTypography>
        </AccordionSummary>
        <AccordionDetails>
          {renderDictionaryTable(
            eventFields,
            'event_field',
            editingEventField,
            setEditingEventField,
            saveEventFieldRename,
            deleteEventField,
            newEventField,
            setNewEventField,
            addEventField,
            'Branża'
          )}
        </AccordionDetails>
      </Accordion>

      {/* Build Types */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <CustomTypography sx={{ fontWeight: 500 }}>
            Typy zabudowy ({buildTypes.length})
          </CustomTypography>
        </AccordionSummary>
        <AccordionDetails>
          {renderDictionaryTable(
            buildTypes,
            'build_type',
            editingBuildType,
            setEditingBuildType,
            saveBuildTypeRename,
            deleteBuildType,
            newBuildType,
            setNewBuildType,
            addBuildType,
            'Typ zabudowy'
          )}
        </AccordionDetails>
      </Accordion>

      {/* Brands */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <CustomTypography sx={{ fontWeight: 500 }}>
            Marki ({brands.length})
          </CustomTypography>
        </AccordionSummary>
        <AccordionDetails>
          {renderDictionaryTable(
            brands,
            'brand',
            editingBrand,
            setEditingBrand,
            saveBrandRename,
            deleteBrand,
            newBrand,
            setNewBrand,
            addBrand,
            'Marka'
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default DictionariesTab;

