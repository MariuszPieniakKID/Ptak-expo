import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
  IconButton,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { addExhibitor, AddExhibitorPayload } from '../services/api';
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
    email: ''
  });
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
      email: ''
    });
    setError('');
    setFieldErrors({});
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

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
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      await addExhibitor(formData, token);
      onExhibitorAdded();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Błąd podczas dodawania wystawcy');
    } finally {
      setLoading(false);
    }
  }, [formData, token, onExhibitorAdded, resetForm, validateForm]);

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle className={styles.dialogTitle}>
        <Box className={styles.titleContainer}>
          <img src={ExhibitorIcon} alt="Wystawca" className={styles.titleIcon} />
          <CustomTypography fontSize="1.5rem" fontWeight={600}>
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
              <CustomField
                label="NIP"
                type="text"
                value={formData.nip}
                onChange={handleInputChange('nip')}
                error={!!fieldErrors.nip}
                errorMessage={fieldErrors.nip}
                placeholder="1234567890"
                fullWidth
                margin="normal"
              />
            </div>
            
            <div className={styles.formField}>
              <CustomField
                label="Nazwa wystawcy"
                type="text"
                value={formData.companyName}
                onChange={handleInputChange('companyName')}
                error={!!fieldErrors.companyName}
                errorMessage={fieldErrors.companyName}
                placeholder="ABC Electronics Sp. z o.o."
                fullWidth
                margin="normal"
              />
            </div>
            
            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <CustomField
                label="Adres"
                type="text"
                value={formData.address}
                onChange={handleInputChange('address')}
                error={!!fieldErrors.address}
                errorMessage={fieldErrors.address}
                placeholder="ul. Elektroniczna 15"
                fullWidth
                margin="normal"
              />
            </div>
            
            <div className={styles.formField}>
              <CustomField
                label="Kod pocztowy"
                type="text"
                value={formData.postalCode}
                onChange={handleInputChange('postalCode')}
                error={!!fieldErrors.postalCode}
                errorMessage={fieldErrors.postalCode}
                placeholder="00-001"
                fullWidth
                margin="normal"
              />
            </div>
            
            <div className={styles.formField}>
              <CustomField
                label="Miejscowość"
                type="text"
                value={formData.city}
                onChange={handleInputChange('city')}
                error={!!fieldErrors.city}
                errorMessage={fieldErrors.city}
                placeholder="Warszawa"
                fullWidth
                margin="normal"
              />
            </div>
            
            <div className={styles.formField}>
              <CustomField
                label="Osoba kontaktowa"
                type="text"
                value={formData.contactPerson}
                onChange={handleInputChange('contactPerson')}
                error={!!fieldErrors.contactPerson}
                errorMessage={fieldErrors.contactPerson}
                placeholder="Jan Kowalski"
                fullWidth
                margin="normal"
              />
            </div>
            
            <div className={styles.formField}>
              <CustomField
                label="Rola w organizacji"
                type="text"
                value={formData.contactRole}
                onChange={handleInputChange('contactRole')}
                error={!!fieldErrors.contactRole}
                errorMessage={fieldErrors.contactRole}
                placeholder="Kierownik Sprzedaży"
                fullWidth
                margin="normal"
              />
            </div>
            
            <div className={styles.formField}>
              <CustomField
                label="Telefon"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                error={!!fieldErrors.phone}
                errorMessage={fieldErrors.phone}
                placeholder="+48 22 123 45 67"
                fullWidth
                margin="normal"
              />
            </div>
            
            <div className={styles.formField}>
              <CustomField
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!fieldErrors.email}
                errorMessage={fieldErrors.email}
                placeholder="j.kowalski@abc-electronics.pl"
                fullWidth
                margin="normal"
              />
            </div>
          </div>
        </Box>
      </DialogContent>
      
      <DialogActions className={styles.dialogActions}>
        <CustomButton
          onClick={handleClose}
          disabled={loading}
          bgColor="transparent"
          textColor="#6c757d"
          width="auto"
          sx={{
            border: '1px solid #6c757d',
            '&:hover': {
              backgroundColor: '#6c757d',
              color: '#fff',
            },
          }}
        >
          Anuluj
        </CustomButton>
        <CustomButton
          onClick={handleSubmit}
          disabled={loading}
          bgColor="#6F87F6"
          textColor="#fff"
          width="auto"
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Dodaj wystawcę'}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
};

export default AddExhibitorModal; 