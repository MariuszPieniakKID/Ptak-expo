import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import CustomField from '../customField/CustomField';
import CountryPhoneField from '../countryPhoneField/CountryPhoneField';
import CustomTypography from '../customTypography/CustomTypography';
import {
  Exhibitor,
  updateExhibitor,
  UpdateExhibitorPayload,
  fetchCompanyByNip,
} from '../../services/api';
import {
  validateAddress,
  validateCity,
  validateCompanyName,
  validateContactPerson,
  validateContactRole,
  validateEmail,
  validatePhone,
  validatePostalCode,
  validateNip,
} from '../../helpers/validators';

import { Box, CircularProgress, Dialog, DialogTitle, IconButton, Typography } from '@mui/material';
import { ReactComponent as CheckIcon } from '../../assets/checkIcon.svg';
import { ReactComponent as CloseIcon } from '../../assets/closeIcon.svg';
import ExhibitorsPageIcon from '../../assets/mask-group-6@2x.png';
import { ReactComponent as AddCircleButton } from '../../assets/addCircleButton.svg';

// Reuse the same styles as AddExhibitorModal to keep UI identical
import styles from '../addExhibitorModal/AddExhibitorModal.module.scss';

interface EditExhibitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExhibitorUpdated: () => void;
  token: string;
  exhibitor: Exhibitor;
}

const EditExhibitorModal: React.FC<EditExhibitorModalProps> = ({
  isOpen,
  onClose,
  onExhibitorUpdated,
  token,
  exhibitor,
}) => {
  const [formValues, setFormValues] = useState<UpdateExhibitorPayload>({
    companyName: '',
    address: '',
    postalCode: '',
    city: '',
    contactPerson: '',
    contactRole: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({
    companyName: '',
    address: '',
    postalCode: '',
    city: '',
    contactPerson: '',
    contactRole: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (exhibitor) {
      setFormValues({
        companyName: exhibitor.companyName || '',
        address: exhibitor.address || '',
        postalCode: exhibitor.postalCode || '',
        city: exhibitor.city || '',
        contactPerson: exhibitor.contactPerson || '',
        contactRole: exhibitor.contactRole || '',
        phone: exhibitor.phone || '',
        email: exhibitor.email || '',
      });
      setFormErrors({
        companyName: '',
        address: '',
        postalCode: '',
        city: '',
        contactPerson: '',
        contactRole: '',
        phone: '',
        email: '',
      });
      setError('');
    }
  }, [exhibitor]);

  const handleChange = useCallback((field: keyof UpdateExhibitorPayload) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = { ...formErrors };
    newErrors.companyName = validateCompanyName(formValues.companyName || '');
    newErrors.address = validateAddress(formValues.address || '');
    newErrors.postalCode = validatePostalCode(formValues.postalCode || '');
    newErrors.city = validateCity(formValues.city || '');
    newErrors.contactPerson = validateContactPerson(formValues.contactPerson || '');
    newErrors.contactRole = validateContactRole(formValues.contactRole || '');
    newErrors.phone = validatePhone(formValues.phone || '');
    newErrors.email = validateEmail(formValues.email || '');
    setFormErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  }, [formErrors, formValues]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      setError('');
      await updateExhibitor(exhibitor.id, formValues, token);
      onExhibitorUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Błąd podczas aktualizacji wystawcy');
    } finally {
      setLoading(false);
    }
  }, [validateForm, formValues, token, exhibitor?.id, onExhibitorUpdated, onClose]);

  const handleGusImport = useCallback(async () => {
    try {
      const nipRaw = exhibitor?.nip || '';
      const nipDigits = String(nipRaw).trim().replace(/^PL/i, '').replace(/[\s-]/g, '');
      const nipError = validateNip(nipDigits);
      if (nipError) {
        setError(nipError);
        return;
      }
      setLoading(true);
      const data = await fetchCompanyByNip(nipDigits, token);
      setFormValues(prev => {
        const updated: UpdateExhibitorPayload = { ...prev };
        if (data.companyName) updated.companyName = data.companyName;
        if (data.address) updated.address = data.address;
        if (data.postalCode) updated.postalCode = data.postalCode;
        if (data.city) updated.city = data.city;
        return updated;
      });
      setFormErrors(prev => ({
        ...prev,
        companyName: validateCompanyName(data.companyName || ''),
        address: validateAddress(data.address || ''),
        postalCode: validatePostalCode(data.postalCode || ''),
        city: validateCity(data.city || ''),
      }));
    } catch (e: any) {
      setError(e?.message || 'Nie udało się pobrać danych z GUS');
    } finally {
      setLoading(false);
    }
  }, [exhibitor?.nip, token]);

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" PaperProps={{ className: styles.customDialogPaper }}>
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <>
          <DialogTitle className={styles.dialogTitle}>
            <Box>
              <img src={ExhibitorsPageIcon} alt="Wystawcy" className={styles._titleIcon} />
            </Box>
            <Box>
              <Typography variant="h6" className={styles.modalTitle}>
                Wystawcy
              </Typography>
              <Typography variant="body2" className={styles.helperTitle}>
                Edytuj wystawcę
              </Typography>
            </Box>
            <IconButton 
              onClick={onClose} 
              disableRipple
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon className={styles.closeIcon} />
            </IconButton>
          </DialogTitle>

          <form onSubmit={handleSubmit}>
            <Box className={styles.inputWrapper}>
              <Box className={styles.formRow}>
                <Box className={styles.halfFormRow}>
                  <CustomField
                    type="nip"
                    label="NIP np.: 106-00-00-062"
                    value={exhibitor?.nip || ''}
                    onChange={() => {}}
                    error={false}
                    errorMessage={''}
                    fullWidth
                    margin="none"
                    placeholder="NIP np.: 106-00-00-062"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                    inputProps={{ readOnly: true }}
                  />
                </Box>
                <Box className={styles.halfFormRow}>
                  <Box 
                    className={styles.iconAndTextButton}
                    onClick={handleGusImport}
                  >
                    <CheckIcon className={styles.iconCheck} />
                    <CustomTypography className={styles.importFromGusDataText}>pobierz dane z GUS</CustomTypography>
                  </Box>
                </Box>
              </Box>

              <Box className={styles.formRow}>
                <Box className={styles.halfFormRow}>
                  <CustomField
                    type="companyName"
                    label="Nazwa wystawcy"
                    value={formValues.companyName || ''}
                    onChange={handleChange('companyName')}
                    error={!!formErrors.companyName}
                    errorMessage={formErrors.companyName}
                    fullWidth
                    margin="none"
                    placeholder="Nazwa wystawcy"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                  />
                </Box>
                <Box className={styles.halfFormRow}>
                  <CustomField
                    type="address"
                    label="Adres"
                    value={formValues.address || ''}
                    onChange={handleChange('address')}
                    error={!!formErrors.address}
                    errorMessage={formErrors.address}
                    fullWidth
                    margin="none"
                    placeholder="Adres"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                  />
                </Box>
              </Box>

              <Box className={styles.formRow}>
                <Box className={styles.halfFormRow}>
                  <CustomField
                    type="postalCode"
                    label="Kod pocztowy"
                    value={formValues.postalCode || ''}
                    onChange={handleChange('postalCode')}
                    error={!!formErrors.postalCode}
                    errorMessage={formErrors.postalCode}
                    fullWidth
                    margin="none"
                    placeholder="Kod pocztowy"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                  />
                </Box>
                <Box className={styles.halfFormRow}>
                  <CustomField
                    type="city"
                    label="Miasto"
                    value={formValues.city || ''}
                    onChange={handleChange('city')}
                    error={!!formErrors.city}
                    errorMessage={formErrors.city}
                    fullWidth
                    margin="none"
                    placeholder="Miasto"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                  />
                </Box>
              </Box>

              <Box className={styles.singleFormRow}>
                <CustomTypography className={styles.textInModal}>Dane kontaktowe</CustomTypography>
              </Box>

              <Box className={styles.formRow}>
                <Box className={styles.halfFormRow}>
                  <CustomField
                    type="contactPerson"
                    label="Imię i Nazwisko osoby kontaktowej"
                    value={formValues.contactPerson || ''}
                    onChange={handleChange('contactPerson')}
                    error={!!formErrors.contactPerson}
                    errorMessage={formErrors.contactPerson}
                    fullWidth
                    margin="none"
                    placeholder="Imię i Nazwisko osoby kontaktowej"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                  />
                </Box>
                <Box className={styles.halfFormRow}>
                  <CustomField
                    type="contactRole"
                    label="Rola w organizacji"
                    value={formValues.contactRole || ''}
                    onChange={handleChange('contactRole')}
                    error={!!formErrors.contactRole}
                    errorMessage={formErrors.contactRole}
                    fullWidth
                    margin="none"
                    placeholder="Rola w organizacji"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                  />
                </Box>
              </Box>

              <Box className={styles.formRow}>
                <Box className={styles.halfFormRow}>
                  <CountryPhoneField
                    value={formValues.phone || ''}
                    onChange={(v) => handleChange('phone')({ target: { value: v } } as any)}
                    label="Telefon"
                    error={!!formErrors.phone}
                    errorMessage={formErrors.phone}
                    fullWidth
                    className={styles.input}
                  />
                </Box>
                <Box className={styles.halfFormRow}>
                  <CustomField
                    type="email"
                    label="Adres E-mail*"
                    value={formValues.email || ''}
                    onChange={handleChange('email')}
                    error={!!formErrors.email}
                    errorMessage={formErrors.email}
                    fullWidth
                    margin="none"
                    placeholder="Adres E-mail*"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                  />
                </Box>
              </Box>

              <Box className={styles.line} />

              {error ? (
                <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>
              ) : null}

              <Box className={styles.formRowFooterWithAction}>
                <CustomTypography className={styles.additionalInfo}>
                  Zmiany danych zostaną zapisane po kliknięciu "zapisz"
                </CustomTypography>
                <Box 
                  className={styles.boxToKlik}
                  onClick={handleSubmit as any}
                >
                  <CustomTypography className={styles.addText}>zapisz</CustomTypography>
                  <AddCircleButton className={styles.addCircleButton} />
                </Box>
              </Box>
            </Box>
          </form>
        </>
      )}
    </Dialog>
  );
};

export default EditExhibitorModal;


