import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CustomTypography from '../customTypography/CustomTypography';
import CustomField from '../customField/CustomField';
import CustomButton from '../customButton/CustomButton';
import { authAPI } from '../../services/api';
import styles from './ChangePasswordModal.module.scss';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset formularza przy otwarciu/zamknięciu
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Reguły silnego hasła (spójne z walidacją backendu)
  const rules = useMemo(() => ([
    { key: 'len', label: 'Co najmniej 8 znaków', ok: newPassword.length >= 8 },
    { key: 'lower', label: 'Małą literę (a-z)', ok: /[a-z]/.test(newPassword) },
    { key: 'upper', label: 'Wielką literę (A-Z)', ok: /[A-Z]/.test(newPassword) },
    { key: 'digit', label: 'Cyfrę (0-9)', ok: /[0-9]/.test(newPassword) },
    { key: 'special', label: 'Znak specjalny (np. !@#$%)', ok: /[^A-Za-z0-9]/.test(newPassword) },
  ]), [newPassword]);

  const allRulesPass = rules.every((r) => r.ok);
  const confirmMatches = confirmPassword.length > 0 && newPassword === confirmPassword;
  const confirmError = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const canSubmit =
    !loading &&
    !successMessage &&
    currentPassword.length > 0 &&
    allRulesPass &&
    confirmMatches;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await authAPI.changePassword(currentPassword, newPassword);
      if (response.data && response.data.success) {
        setSuccessMessage(response.data.message || 'Hasło zostało zmienione');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
        }, 2500);
      } else {
        setErrorMessage((response.data && response.data.message) || 'Nie udało się zmienić hasła');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Błąd połączenia z serwerem. Spróbuj ponownie później.';
      setErrorMessage(msg);
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
      PaperProps={{ className: styles.dialogPaper }}
    >
      <DialogTitle className={styles.dialogTitle}>
        <CustomTypography fontSize="1.25rem" fontWeight={500}>
          Zmiana hasła
        </CustomTypography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          className={styles.closeButton}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off">
        <DialogContent className={styles.dialogContent}>
          <CustomTypography fontSize="0.875rem" className={styles.description}>
            Ustaw własne, indywidualne hasło do konta. Nowe hasło musi spełniać poniższe warunki.
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
            label="Obecne hasło"
            type="password"
            value={currentPassword}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setCurrentPassword(e.target.value);
              setErrorMessage('');
            }}
            placeholder="Obecne hasło"
            fullWidth
            margin="normal"
          />

          <CustomField
            label="Nowe hasło"
            type="password"
            value={newPassword}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
            placeholder="Nowe hasło"
            fullWidth
            margin="normal"
          />

          {/* Reguły silnego hasła */}
          <Box className={styles.rulesBox}>
            <CustomTypography fontSize="0.8125rem" className={styles.rulesTitle}>
              Hasło musi zawierać:
            </CustomTypography>
            <ul className={styles.rulesList}>
              {rules.map((rule) => (
                <li
                  key={rule.key}
                  className={`${styles.ruleItem} ${rule.ok ? styles.ruleItemOk : ''}`}
                >
                  {rule.ok ? (
                    <CheckCircleIcon className={styles.ruleIcon} sx={{ color: '#2e7d32' }} />
                  ) : (
                    <RadioButtonUncheckedIcon className={styles.ruleIcon} sx={{ color: '#b5b6ba' }} />
                  )}
                  <span>{rule.label}</span>
                </li>
              ))}
            </ul>
          </Box>

          <CustomField
            label="Powtórz nowe hasło"
            type="password"
            value={confirmPassword}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            placeholder="Powtórz nowe hasło"
            fullWidth
            margin="normal"
            error={confirmError}
            errorMessage="Hasła nie są takie same"
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
          <CustomButton type="submit" disabled={!canSubmit}>
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Zapisz nowe hasło'
            )}
          </CustomButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ChangePasswordModal;
