import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
  IconButton,
  Box,
  MenuItem,
  Select,
  FormControl
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { addExhibitor, AddExhibitorPayload, fetchExhibitions, Exhibition } from '../services/api';
import CustomTypography from './customTypography/CustomTypography';
import CustomButton from './customButton/CustomButton';
import CustomField from './customField/CustomField';
import styles from './AddExhibitorModal.module.scss';
import ExhibitorIcon from '../assets/mask-group-6@2x.png';

interface AddExhibitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExhibitorAdded: () => void;
  token: string;
}

const AddExhibitorModal: React.FC<AddExhibitorModalProps> = ({ isOpen, onClose, onExhibitorAdded, token }) => {
  const [formData, setFormData] = useState<AddExhibitorPayload>({
    nip: '',
    companyName: '',
    address: '',
    postalCode: '',
    city: '',
    contactPerson: '',
    contactRole: '',
    phone: '',
    email: '',
    password: ''
  });
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<number | ''>('');
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loadingExhibitions, setLoadingExhibitions] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const resetForm = useCallback(() => {
    setFormData({
      nip: '',
      companyName: '',
      address: '',
      postalCode: '',
      city: '',
      contactPerson: '',
      contactRole: '',
      phone: '',
      email: '',
      password: ''
    });
    setSelectedExhibitionId('');
    setError('');
    setFieldErrors({});
  }, []);

  const loadExhibitions = useCallback(async () => {
    setLoadingExhibitions(true);
    try {
      const fetchedExhibitions = await fetchExhibitions(token);
      // Filtruj tylko nadchodzące i trwające wydarzenia
      const now = new Date();
      const upcomingExhibitions = fetchedExhibitions.filter(exhibition => {
        const endDate = new Date(exhibition.end_date);
        return endDate >= now; // Wydarzenia, które się jeszcze nie zakończyły
      });
      setExhibitions(upcomingExhibitions);
    } catch (err) {
      console.error('Error loading exhibitions:', err);
      setError('Błąd podczas ładowania wydarzeń');
    } finally {
      setLoadingExhibitions(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      loadExhibitions();
    }
  }, [isOpen, resetForm, loadExhibitions]);

  const handleInputChange = useCallback((field: keyof AddExhibitorPayload) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [fieldErrors]);

  const validateForm = useCallback((): boolean => {
    const errors: { [key: string]: string } = {};
    
    if (!formData.nip.trim()) errors.nip = 'NIP jest wymagany';
    else if (!/^\d{10}$/.test(formData.nip.replace(/\D/g, ''))) errors.nip = 'NIP musi zawierać 10 cyfr';
    
    if (!formData.companyName.trim()) errors.companyName = 'Nazwa wystawcy jest wymagana';
    if (!formData.address.trim()) errors.address = 'Adres jest wymagany';
    if (!formData.postalCode.trim()) errors.postalCode = 'Kod pocztowy jest wymagany';
    else if (!/^\d{2}-\d{3}$/.test(formData.postalCode)) errors.postalCode = 'Kod pocztowy musi być w formacie XX-XXX';
    
    if (!formData.city.trim()) errors.city = 'Miejscowość jest wymagana';
    if (!formData.contactPerson.trim()) errors.contactPerson = 'Osoba kontaktowa jest wymagana';
    if (!formData.contactRole.trim()) errors.contactRole = 'Rola w organizacji jest wymagana';
    if (!formData.phone.trim()) errors.phone = 'Telefon jest wymagany';
    if (!formData.email.trim()) errors.email = 'Email jest wymagany';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Niepoprawny format email';
    
    if (!formData.password.trim()) errors.password = 'Hasło jest wymagane';
    else if (formData.password.length < 6) errors.password = 'Hasło musi mieć co najmniej 6 znaków';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const exhibitorData = {
        ...formData,
        exhibitionId: selectedExhibitionId || undefined
      };
      await addExhibitor(exhibitorData, token);
      onExhibitorAdded();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Błąd podczas dodawania wystawcy');
    } finally {
      setLoading(false);
    }
  }, [formData, selectedExhibitionId, token, onExhibitorAdded, resetForm, validateForm]);

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="md" fullWidth className={styles.dialog}>
      <DialogTitle className={styles.dialogTitle}>
        <Box className={styles.titleContainer}>
          <img src={ExhibitorIcon} alt="Wystawca" className={styles.titleIcon} />
          <CustomTypography className={styles.titleText} fontSize="1.125rem" fontWeight={500}>
            Dodaj wystawcę
          </CustomTypography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          className={styles.closeButton}
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent className={styles.dialogContent}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <div className={styles.fieldLabel}>NIP</div>
              <CustomField
                type="text"
                value={formData.nip}
                onChange={handleInputChange('nip')}
                error={!!fieldErrors.nip}
                errorMessage={fieldErrors.nip}
                placeholder="1234567890"
                fullWidth
                margin="normal"
                className={styles.fieldInput}
              />
            </div>
            
            <div className={styles.formField}>
              <div className={styles.fieldLabel}>Nazwa wystawcy</div>
              <CustomField
                type="text"
                value={formData.companyName}
                onChange={handleInputChange('companyName')}
                error={!!fieldErrors.companyName}
                errorMessage={fieldErrors.companyName}
                placeholder="ABC Electronics Sp. z o.o."
                fullWidth
                margin="normal"
                className={styles.fieldInput}
              />
            </div>
            
            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <div className={styles.fieldLabel}>Adres</div>
              <CustomField
                type="text"
                value={formData.address}
                onChange={handleInputChange('address')}
                error={!!fieldErrors.address}
                errorMessage={fieldErrors.address}
                placeholder="ul. Elektroniczna 15"
                fullWidth
                margin="normal"
                className={styles.fieldInput}
              />
            </div>
            
            <div className={styles.formField}>
              <div className={styles.fieldLabel}>Kod pocztowy</div>
              <CustomField
                type="text"
                value={formData.postalCode}
                onChange={handleInputChange('postalCode')}
                error={!!fieldErrors.postalCode}
                errorMessage={fieldErrors.postalCode}
                placeholder="00-001"
                fullWidth
                margin="normal"
                className={styles.fieldInput}
              />
            </div>
            
            <div className={styles.formField}>
              <div className={styles.fieldLabel}>Miejscowość</div>
              <CustomField
                type="text"
                value={formData.city}
                onChange={handleInputChange('city')}
                error={!!fieldErrors.city}
                errorMessage={fieldErrors.city}
                placeholder="Warszawa"
                fullWidth
                margin="normal"
                className={styles.fieldInput}
              />
            </div>
            
            <div className={styles.formField}>
              <div className={styles.fieldLabel}>Osoba kontaktowa</div>
              <CustomField
                type="text"
                value={formData.contactPerson}
                onChange={handleInputChange('contactPerson')}
                error={!!fieldErrors.contactPerson}
                errorMessage={fieldErrors.contactPerson}
                placeholder="Jan Kowalski"
                fullWidth
                margin="normal"
                className={styles.fieldInput}
              />
            </div>
            
            <div className={styles.formField}>
              <div className={styles.fieldLabel}>Rola w organizacji</div>
              <CustomField
                type="text"
                value={formData.contactRole}
                onChange={handleInputChange('contactRole')}
                error={!!fieldErrors.contactRole}
                errorMessage={fieldErrors.contactRole}
                placeholder="Kierownik Sprzedaży"
                fullWidth
                margin="normal"
                className={styles.fieldInput}
              />
            </div>
            
            <div className={styles.formField}>
              <div className={styles.fieldLabel}>Telefon</div>
              <CustomField
                type="tel"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                error={!!fieldErrors.phone}
                errorMessage={fieldErrors.phone}
                placeholder="+48 22 123 45 67"
                fullWidth
                margin="normal"
                className={styles.fieldInput}
              />
            </div>
            
            <div className={styles.formField}>
              <div className={styles.fieldLabel}>Email</div>
              <CustomField
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!fieldErrors.email}
                errorMessage={fieldErrors.email}
                placeholder="j.kowalski@abc-electronics.pl"
                fullWidth
                margin="normal"
                className={styles.fieldInput}
              />
            </div>
            
            <div className={styles.formField}>
              <div className={styles.fieldLabel}>Hasło</div>
              <CustomField
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!fieldErrors.password}
                errorMessage={fieldErrors.password}
                placeholder="Wprowadź hasło (min. 6 znaków)"
                fullWidth
                margin="normal"
                className={styles.fieldInput}
              />
            </div>
            
            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <div className={styles.fieldLabel}>Wybierz wydarzenie które chcesz przypisać do wystawcy</div>
              <FormControl fullWidth margin="normal" className={styles.fieldInput}>
                <Select
                  value={selectedExhibitionId}
                  onChange={(e) => setSelectedExhibitionId(e.target.value as number | '')}
                  displayEmpty
                  disabled={loadingExhibitions}
                  className={styles.selectField}
                >
                  <MenuItem value="">
                    <em>Brak przypisania do wydarzenia</em>
                  </MenuItem>
                  {exhibitions.map((exhibition) => (
                    <MenuItem key={exhibition.id} value={exhibition.id}>
                      {exhibition.name} ({new Date(exhibition.start_date).toLocaleDateString('pl-PL')} - {new Date(exhibition.end_date).toLocaleDateString('pl-PL')})
                    </MenuItem>
                  ))}
                </Select>
                {loadingExhibitions && (
                  <CircularProgress size={20} style={{ position: 'absolute', right: 30, top: 15 }} />
                )}
              </FormControl>
            </div>
          </div>
        </Box>
      </DialogContent>
      
      <DialogActions className={styles.dialogActions}>
        <CustomButton
          onClick={handleClose}
          disabled={loading}
          bgColor="transparent"
          textColor="var(--color-darkgray)"
          width="auto"
          className={styles.cancelButton}
        >
          Anuluj
        </CustomButton>
        <CustomButton
          onClick={handleSubmit}
          disabled={loading}
          bgColor="var(--color-dodgerblue)"
          textColor="var(--color-white)"
          width="auto"
          className={styles.submitButton}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Dodaj wystawcę'}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
};

export default AddExhibitorModal; 