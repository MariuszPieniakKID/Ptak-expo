import React, { useState, useCallback } from 'react';
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
import EventIcon from '@mui/icons-material/Event';
import CustomButton from './customButton/CustomButton';
import CustomField from './customField/CustomField';
import CustomTypography from './customTypography/CustomTypography';
import { addExhibition, AddExhibitionPayload } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import styles from './AddEventModal.module.scss';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventAdded: () => void;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onEventAdded }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<AddExhibitionPayload>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    website: '',
    status: 'planned'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      website: '',
      status: 'planned'
    });
    setError(null);
  }, []);

  const handleInputChange = useCallback((field: keyof AddExhibitionPayload) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Brak autoryzacji');
      return;
    }

    if (!formData.name.trim()) {
      setError('Nazwa wydarzenia jest wymagana');
      return;
    }

    if (!formData.start_date) {
      setError('Data rozpoczęcia jest wymagana');
      return;
    }

    if (!formData.end_date) {
      setError('Data zakończenia jest wymagana');
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError('Data rozpoczęcia nie może być późniejsza niż data zakończenia');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addExhibition(formData, token!);
      resetForm();
      onEventAdded();
      onClose();
    } catch (err) {
      setError('Wystąpił błąd podczas dodawania wydarzenia. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!loading) {
      resetForm();
      onClose();
    }
  }, [loading, onClose, resetForm]);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      className={styles.dialog}
    >
      <DialogTitle className={styles.dialogTitle}>
        <div className={styles.titleContainer}>
          <EventIcon className={styles.titleIcon} />
          <CustomTypography 
            fontSize="1.25rem" 
            fontWeight={500} 
            className={styles.titleText}
          >
            Dodaj nowe wydarzenie
          </CustomTypography>
        </div>
        <IconButton
          onClick={handleClose}
          className={styles.closeButton}
          size="small"
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={styles.dialogContent}>
        {error && (
          <Alert severity="error" className={styles.alert}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <CustomTypography 
                fontSize="0.875rem" 
                fontWeight={500} 
                className={styles.fieldLabel}
              >
                Nazwa wydarzenia *
              </CustomTypography>
              <CustomField
                type="text"
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="Wprowadź nazwę wydarzenia"
                className={styles.fieldInput}
              />
            </div>

            <div className={styles.formField}>
              <CustomTypography 
                fontSize="0.875rem" 
                fontWeight={500} 
                className={styles.fieldLabel}
              >
                Data rozpoczęcia *
              </CustomTypography>
              <CustomField
                type="date"
                value={formData.start_date}
                onChange={handleInputChange('start_date')}
                className={styles.fieldInput}
              />
            </div>

            <div className={styles.formField}>
              <CustomTypography 
                fontSize="0.875rem" 
                fontWeight={500} 
                className={styles.fieldLabel}
              >
                Data zakończenia *
              </CustomTypography>
              <CustomField
                type="date"
                value={formData.end_date}
                onChange={handleInputChange('end_date')}
                className={styles.fieldInput}
              />
            </div>

            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <CustomTypography 
                fontSize="0.875rem" 
                fontWeight={500} 
                className={styles.fieldLabel}
              >
                Lokalizacja
              </CustomTypography>
              <CustomField
                type="text"
                value={formData.location || ''}
                onChange={handleInputChange('location')}
                placeholder="Wprowadź lokalizację wydarzenia"
                className={styles.fieldInput}
              />
            </div>

            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <CustomTypography 
                fontSize="0.875rem" 
                fontWeight={500} 
                className={styles.fieldLabel}
              >
                Strona wydarzenia (URL)
              </CustomTypography>
              <CustomField
                type="text"
                value={formData.website || ''}
                onChange={handleInputChange('website')}
                placeholder="https://..."
                className={styles.fieldInput}
              />
            </div>

            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <CustomTypography 
                fontSize="0.875rem" 
                fontWeight={500} 
                className={styles.fieldLabel}
              >
                Opis
              </CustomTypography>
              <CustomField
                type="text"
                value={formData.description || ''}
                onChange={handleInputChange('description')}
                placeholder="Wprowadź opis wydarzenia"
                className={styles.fieldInput}
              />
            </div>
          </div>
        </form>
      </DialogContent>

      <DialogActions className={styles.dialogActions}>
        <CustomButton
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          className={styles.cancelButton}
        >
          Anuluj
        </CustomButton>
        <CustomButton
          onClick={handleSubmit}
          disabled={loading}
          variant="contained"
          className={styles.submitButton}
        >
          {loading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={16} color="inherit" />
              Dodawanie...
            </Box>
          ) : (
            'Dodaj wydarzenie'
          )}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
};

export default AddEventModal; 