import { useCallback, useEffect, useRef, useState } from 'react';
import CustomField from '../customField/CustomField';
import CustomTypography from '../customTypography/CustomTypography';
import { AddExhibitionPayload, Exhibition, updateExhibition, uploadBrandingFile, getBrandingFileUrl } from '../../services/api';
import { Box, CircularProgress, Dialog, DialogTitle, IconButton, Typography } from '@mui/material';
import { ReactComponent as CloseIcon } from '../../assets/closeIcon.svg';
import EventsPageIcon from '../../assets/eventIcon.png';
import styles from './AddEventModal_.module.scss';
import { useAuth } from '../../contexts/AuthContext';
import { fieldOptions } from '../../helpers/mockData';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Exhibition;
  onEventUpdated?: (updated: Exhibition) => void;
}

const EditEventModal_: React.FC<EditEventModalProps> = ({ isOpen, onClose, event, onEventUpdated }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<AddExhibitionPayload>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    status: 'planned',
    field: 'all',
  });
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [eventLogoFile, setEventLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && event) {
      setFormData({
        name: event.name,
        description: event.description || '',
        start_date: event.start_date,
        end_date: event.end_date,
        location: event.location || '',
        status: event.status,
        field: (event as any).field || 'all',
      });
      setEventLogoFile(null);
      // reset preview (no dependency on logoPreview to avoid CI warning)
      setLogoPreview(null);
      setError(null);
    }
  }, [isOpen, event]);

  const handleInputChange = useCallback((field: keyof AddExhibitionPayload) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setError(null);
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const updated = await updateExhibition(event.id, formData, token);
      if (eventLogoFile) {
        try {
          await uploadBrandingFile(eventLogoFile, null, event.id, 'event_logo', token);
        } catch (uploadErr) {
          console.error('Błąd podczas przesyłania logo wydarzenia:', uploadErr);
        }
      }
      onEventUpdated?.(updated);
      onClose();
    } catch (err) {
      console.error('Błąd podczas aktualizacji wydarzenia:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  // Handle logo selection with preview
  const handleSelectLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (logoPreview) {
      try { URL.revokeObjectURL(logoPreview); } catch (_) {}
    }
    if (file) {
      setEventLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setEventLogoFile(null);
      setLogoPreview(null);
    }
  };

  useEffect(() => {
    return () => {
      if (logoPreview) {
        try { URL.revokeObjectURL(logoPreview); } catch(_){}
      }
    };
  }, [logoPreview]);

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose} 
      maxWidth="sm" 
      PaperProps={{ className: styles.customDialogPaper }}
    >
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <>
          <DialogTitle className={styles.dialogTitle}>
            <Box>
              <img src={EventsPageIcon} alt="Wydarzenia" className={styles._titleIcon} />
            </Box>
            <Box>
              <Typography variant="h6" className={styles.modalTitle}>
                Wydarzenia
              </Typography>
              <Typography variant="body2" className={styles.helperTitle}>
                Edytuj wydarzenie
              </Typography>
            </Box>
            <IconButton 
              onClick={handleClose} 
              disableRipple
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon className={styles.closeIcon} />
            </IconButton>
          </DialogTitle>

          <form onSubmit={handleSubmit}>
            <Box className={styles.inputWrapper}>
              <Box className={styles.singleFormRow}>
                <CustomField
                  type="name"
                  label="Podaj nazwe wydarzenia"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  placeholder="Nazwę wydarzenia"
                  className={styles.input}
                  fullWidth
                  margin="none"
                />
              </Box>

              <Box className={styles.singleFormRow}>
                <CustomTypography className={styles.textInModal}>Data wydarzenia</CustomTypography>
              </Box>

              <Box className={styles.formRow}>
                <Box className={styles.halfFormRow}>
                  <CustomField
                    type="date"
                    label="Data rozpoczęcia"
                    value={formData.start_date}
                    onChange={handleInputChange('start_date')}
                    fullWidth
                    margin="none"
                    placeholder="DD.MM.RRRR"
                    className={styles.input}
                  />
                </Box>
                <Box className={styles.halfFormRow}>
                  <CustomField
                    type="date"
                    label="Data zakończenia"
                    value={formData.end_date}
                    onChange={handleInputChange('end_date')}
                    fullWidth
                    margin="none"
                    placeholder="Miasto"
                    className={styles.input}
                  />
                </Box>
              </Box>

              <Box className={styles.singleFormRow}>
                <CustomField
                  type="field"
                  label="Typ. branża wydarzenia"
                  value={(formData as any).field || 'all'}
                  onChange={handleInputChange('field')}
                  options={fieldOptions}
                  forceSelectionFromOptions={true}
                  placeholder="Typ. branża wydarzenia"
                  fullWidth
                />
              </Box>

              <Box className={styles.formRow}>
                <Box className={styles.halfFormRow}>
                  <CustomField
                    type="location"
                    label="Lokalizacja"
                    value={formData.location || ''}
                    onChange={handleInputChange('location')}
                    fullWidth
                    margin="none"
                    placeholder="Lokalizację wydarzenia"
                    className={styles.input}
                  />
                </Box>
                <Box className={styles.halfFormRow}>
                  <CustomField
                    type="description"
                    label="Opis wydarzenia"
                    value={formData.description || ''}
                    onChange={handleInputChange('description')}
                    fullWidth
                    margin="none"
                    placeholder="Opis wydarzenia"
                    className={styles.input}
                    multiline={true}
                    rows={4}
                  />
                </Box>
              </Box>

              <Box className={styles.singleFormRow}>
                <CustomTypography className={styles.textInModal}>Logo wystawy</CustomTypography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSelectLogo}
                  style={{ display: 'none' }}
                />
                <Box
                  className={styles.logoUploadBox}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Podgląd logo" className={styles.logoPreviewImg} />
                  ) : ((event as any).event_logo_file_name && token) ? (
                    <img
                      src={getBrandingFileUrl(null, (event as any).event_logo_file_name, token)}
                      alt="Aktualne logo"
                      className={styles.logoPreviewImg}
                    />
                  ) : (
                    <CustomTypography className={styles.logoHint}>Kliknij, aby wgrać logo</CustomTypography>
                  )}
                </Box>
              </Box>
              <Box className={styles.singleFormRow}>
                <Box 
                  className={styles.boxToKlik}
                  onClick={() => handleSubmit()}
                >
                  <CustomTypography className={styles.addText}>zapisz</CustomTypography>
                </Box>
              </Box>

            </Box>
          </form>
        </>
      )}
    </Dialog>
  );
};

export default EditEventModal_;


