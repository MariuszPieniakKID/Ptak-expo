import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CustomTypography from '../customTypography/CustomTypography';
import CustomField from '../customField/CustomField';
import CustomButton from '../customButton/CustomButton';
import config from '../../config/config';
import styles from './ForgotPasswordModal.module.scss';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ 
  isOpen, 
  onClose
}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setEmailError('');
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen]);

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('Adres email jest wymagany');
      return false;
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      setEmailError('Podaj poprawny adres e-mail');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    validateEmail(newEmail);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/v1/auth/exhibitor-forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(data.message || 'Nowe hasło zostało wysłane na podany adres email');
        setEmail('');
        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setErrorMessage(data.message || 'Wystąpił błąd podczas resetowania hasła');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setErrorMessage('Błąd połączenia z serwerem. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: styles.dialogPaper
      }}
    >
      <DialogTitle className={styles.dialogTitle}>
        <CustomTypography fontSize="1.25rem" fontWeight={500}>
          Przypomnienie hasła
        </CustomTypography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          className={styles.closeButton}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent className={styles.dialogContent}>
          <CustomTypography fontSize="0.875rem" className={styles.description}>
            Podaj adres email przypisany do Twojego konta. Nowe hasło zostanie wygenerowane i wysłane na podany adres.
          </CustomTypography>
          
          {successMessage && (
            <Box className={styles.successMessage}>
              <CustomTypography fontSize="0.875rem" color="#2e7d32">
                {successMessage}
              </CustomTypography>
            </Box>
          )}
          
          {errorMessage && (
            <Box className={styles.errorMessage}>
              <CustomTypography fontSize="0.875rem" color="#c7353c">
                {errorMessage}
              </CustomTypography>
            </Box>
          )}
          
          <CustomField
            label="Adres E-mail"
            type="email"
            value={email}
            onChange={handleEmailChange}
            error={!!emailError}
            errorMessage={emailError}
            placeholder="adres@mail.com"
            fullWidth
            margin="normal"
          />
        </DialogContent>
        
        <DialogActions className={styles.dialogActions}>
          <CustomButton
            onClick={onClose}
            bgColor="transparent"
            textColor="#2e2e38"
            withBorder
            disabled={loading}
          >
            Anuluj
          </CustomButton>
          <CustomButton
            type="submit"
            disabled={loading || !!emailError || !email || !!successMessage}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Wyślij nowe hasło'
            )}
          </CustomButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ForgotPasswordModal;

