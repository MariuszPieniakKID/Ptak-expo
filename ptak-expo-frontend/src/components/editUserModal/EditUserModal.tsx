import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  Typography,
  Avatar,
  Button,
} from '@mui/material';
import CustomField from '../customField/CustomField';
import CountryPhoneField from '../countryPhoneField/CountryPhoneField';
import { updateUser, UpdateUserPayload, User } from '../../services/api';
import CustomTypography from '../customTypography/CustomTypography';
import { ReactComponent as CloseIcon } from '../../assets/closeIcon.svg';
import { ReactComponent as AddCircleButton } from '../../assets/addCircleButton.svg';

import UsersPageIcon from '../../assets/mask-group-5@2x.png';
import styles from '../addUserModal/AddUserModal.module.scss';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  token: string;
  user: User | null;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  onUserUpdated,
  token,
  user,
}) => {
  const [fullName, setFullName] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setPassword(''); // Password field starts empty
      setFullNameError('');
      setEmailError('');
      setPhoneError('');
      setPasswordError('');
      setApiError('');
      setError('');
      setLoading(false);
      setAvatarFile(null);
    }
  }, [isOpen, user]);

  const validateFullName = (fullName: string) => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      setFullNameError('Imię i nazwisko jest wymagane');
      return false;
    }
    const re = /^[A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ]+([ '-][A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)+$/;
    if (!re.test(trimmed)) {
      setFullNameError(
        'Wypełnij poprawnie pole: min. dwa wyrazy, tylko litery, spacje, myślniki lub apostrofy.'
      );
      return false;
    }
    setFullNameError('');
    return true;
  };

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('Adres email jest wymagany');
      return false;
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      setEmailError('Podaj poprawny adres e-mail np.: email@mail.com');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneError('Telefon jest wymagany');
      return false;
    }

    // Normalize phone number: remove spaces, hyphens, parentheses
    const normalized = phone.trim().replace(/[\s\-()]/g, '');

    // Allow international format: + followed by 9-15 digits
    const re = /^\+?\d{9,15}$/;
    if (!re.test(normalized)) {
      setPhoneError(
        'Podaj poprawny numer telefonu (9-15 cyfr, dozwolone: +, spacje, myślniki, nawiasy)'
      );
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validatePassword = (password: string) => {
    // Password is optional when editing
    if (!password || password.trim() === '') {
      setPasswordError('');
      return true;
    }
    
    if (password.length < 6) {
      setPasswordError('Hasło musi mieć minimum 6 znaków');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleFullNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newFullName = e.target.value;
    setFullName(newFullName);
    if (validateFullName(newFullName)) {
      setError('');
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (validateEmail(newEmail)) {
      setError('');
    }
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    setPhone(newPhone);
    if (validatePhone(newPhone)) {
      setError('');
    }
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (validatePassword(newPassword)) {
      setError('');
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!user) return;

      const isFullNameValid = validateFullName(fullName);
      const isEmailValid = validateEmail(email);
      const isPhoneValid = validatePhone(phone);
      const isPasswordValid = validatePassword(password);

      if (!isFullNameValid || !isEmailValid || !isPhoneValid || !isPasswordValid) return;

      setLoading(true);
      setApiError('');

      const nameParts = fullName.trim().split(' ');
      const payload: UpdateUserPayload = {
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' '),
        email: email,
        phone: phone || null,
      };

      // Only include password if it was provided
      if (password && password.trim() !== '') {
        payload.password = password;
      }

      try {
        console.log('[EditUserModal] submit payload:', payload);
        const res = await updateUser(user.id, payload, token);
        console.log('[EditUserModal] API response:', res);

        // Upload avatar if provided
        if (avatarFile) {
          try {
            const form = new FormData();
            form.append('avatar', avatarFile);
            await fetch(
              `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/users/${user.id}/avatar`,
              {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form,
              }
            );
          } catch (upErr: any) {
            console.warn('[EditUserModal] avatar upload failed:', upErr?.message || upErr);
          }
        }

        onUserUpdated();
        onClose();
      } catch (err: any) {
        console.error('[EditUserModal] API error:', err);
        setApiError(err.message || 'Wystąpił nieznany błąd.');
        setError(err.message || 'Wystąpił nieznany błąd.');
      } finally {
        setLoading(false);
      }
    },
    [fullName, email, phone, password, token, onUserUpdated, onClose, avatarFile, user]
  );

  const buildAvatarUrl = (userId: number) => {
    const base = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    return `${base}/api/v1/users/${userId}/avatar?t=${Date.now()}`;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      PaperProps={{ className: styles.customDialogPaper }}
    >
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <>
          <DialogTitle className={styles.dialogTitle}>
            <img src={UsersPageIcon} alt="Edytuj Użytkownika" className={styles.titleIcon} />
            <Box>
              <Typography variant="h6" className={styles.modalTitle}>
                Użytkownicy
              </Typography>
              <Typography variant="body2" className={styles.helperTitle}>
                Edytuj użytkownika
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              disableRipple
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon className={styles.closeIcon} />
            </IconButton>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            {apiError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {apiError}
              </Alert>
            )}
            <Box className={styles.inputWrapper}>
              <CustomField
                type="fullName"
                label="Imię i nazwisko"
                value={fullName}
                onChange={handleFullNameChange}
                error={!!fullNameError}
                errorMessage={fullNameError}
                fullWidth
                margin="none"
                placeholder={'Imię i nazwisko'}
                className={styles.input}
                errorMessageClassName={styles.inputErrorMessage}
              />
              <CustomField
                label="Adres E-mail"
                type="email"
                value={email}
                onChange={handleEmailChange}
                error={!!emailError}
                errorMessage={emailError}
                placeholder="adres@mail.com"
                fullWidth
                margin="none"
                className={styles.input}
                errorMessageClassName={styles.inputErrorMessage}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <CountryPhoneField
                  value={phone}
                  onChange={(v) => {
                    handlePhoneChange({ target: { value: v } } as any);
                  }}
                  label="Telefon"
                  error={!!phoneError}
                  errorMessage={phoneError}
                  className={styles.input}
                  fullWidth
                />
                <CustomField
                  label="Nowe hasło (pozostaw puste aby nie zmieniać)"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  error={!!passwordError}
                  errorMessage={passwordError}
                  placeholder="••••••••"
                  fullWidth
                  margin="none"
                  className={styles.input}
                  errorMessageClassName={styles.inputErrorMessage}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{ width: 48, height: 48 }}
                    src={
                      avatarFile
                        ? URL.createObjectURL(avatarFile)
                        : user
                        ? buildAvatarUrl(user.id)
                        : ''
                    }
                  />
                  <Button variant="outlined" component="label" disabled={loading}>
                    {avatarFile ? 'Zmień avatar' : 'Dodaj avatar'}
                    <input
                      hidden
                      accept="image/png, image/jpeg, image/webp"
                      type="file"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    />
                  </Button>
                </Box>
              </Box>
            </Box>

            <Box>
              <Box className={styles.lineBox} />

              {/* Tekst pod linią */}
              <Box className={styles.actionContainer}>
                <CustomTypography className={styles.additionalInfo}>
                  * Zmiany zostaną zapisane dla użytkownika
                </CustomTypography>
                <DialogActions className={styles.dialogActions}>
                  {loading ||
                  !!emailError ||
                  !!phoneError ||
                  !!fullNameError ||
                  !!passwordError ||
                  !fullName ||
                  !email ||
                  !phone ||
                  !!error ? (
                    <></>
                  ) : (
                    <Box className={styles.actionBox} onClick={handleSubmit}>
                      <CustomTypography className={styles.addText}>zapisz</CustomTypography>
                      <AddCircleButton className={styles.addCircleButton} />
                    </Box>
                  )}
                </DialogActions>
              </Box>
            </Box>
          </form>
        </>
      )}
    </Dialog>
  );
};

export default EditUserModal;

