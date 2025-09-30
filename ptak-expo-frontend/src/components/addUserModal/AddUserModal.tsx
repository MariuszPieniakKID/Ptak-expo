import React, { useState, useEffect} from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Typography,
  Alert,
  IconButton,
  Box,
  Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { addUser, AddUserPayload, uploadUserAvatar } from '../../services/api';
import CountryPhoneField from '../countryPhoneField/CountryPhoneField';
import styles from './AddUserModal.module.scss';
import UsersPageIcon from '../../assets/mask-group-5@2x.png';


interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
  token: string;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ 
  isOpen, 
  onClose, 
  onUserAdded, 
  token
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    isAdmin: false,
  });
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({ 
        fullName: '', 
        email: '', 
        phone: '', 
        password: '', 
        isAdmin: false 
      });
      setErrors({ 
        fullName: '', 
        email: '', 
        password: '' 
      });
      setApiError('');
    }
  }, [isOpen]);

  const validate = (): boolean => {
    let isValid = true;
    const newErrors = { 
      fullName: '', 
      email: '', 
      password: '', 
    };

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Imię i nazwisko jest wymagane.';
      isValid = false;
    } else if (formData.fullName.trim().split(' ').length < 2) {
        newErrors.fullName = 'Podaj imię i nazwisko.';
        isValid = false;
    }

    if (!formData.email) {
      newErrors.email = 'Adres email jest wymagany.';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy format adresu email.';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Hasło jest wymagane.';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Hasło musi mieć co najmniej 6 znaków.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    console.log("Hello");
  
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');

    const nameParts = formData.fullName.trim().split(' ');
    const payload: AddUserPayload = {
      first_name: nameParts[0],
      last_name: nameParts.slice(1).join(' '),
      email: formData.email,
      phone: formData.phone || null,
      password: formData.password,
      role: formData.isAdmin ? 'admin' : 'exhibitor',
    };

    try {
      console.log('[AddUserModal] submit payload:', { ...payload, password: payload.password ? '***' : undefined });
      const res = await addUser(payload, token);
      console.log('[AddUserModal] API response:', res);
      // If avatar selected, upload it
      const newUserId = res?.data?.id;
      if (avatarFile && newUserId) {
        try {
          await uploadUserAvatar(newUserId, avatarFile, token);
        } catch (upErr: any) {
          console.warn('Avatar upload failed:', upErr?.message || upErr);
        }
      }
      onUserAdded();
      onClose();
    } catch (err: any) {
      console.error('[AddUserModal] API error:', err);
      setApiError(err.message || 'Wystąpił nieznany błąd.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm"  sx={{
    '& .MuiPaper-root': {
      backgroundColor: '#f5f6f7',   
      borderRadius:'20px',
      maxWidth:'600px',
      padding:'24px 50px',
    },
  }}>
        <DialogTitle className={styles.dialogTitle}>
            <img src={UsersPageIcon} alt="Dodaj Użytkownika" className={styles.titleIcon} />
            <Box>
                <Typography variant="h6" className={styles.modalTitle}>Użytkownicy</Typography>
                <Typography variant="body2" className={styles.helperTitle}>Dodaj użytkownika</Typography>
            </Box>
            <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
            </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
            <DialogContent className={styles.dialogContent}>
            {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'flex-start' }}>
            
                <TextField
                    name="fullName"
                    label="Imię i nazwisko"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    error={!!errors.fullName}
                    helperText={errors.fullName}
                    fullWidth
                    required
                    disabled={loading}
                />
                  <TextField
                        name="email"
                        label="Adres E-mail"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        fullWidth
                        required
                        disabled={loading}
                    /> 
                    <Button
                      component="label"
                      variant="outlined"
                      disabled={loading}
                    >
                      Dodaj zdjęcie użytkownika
                      <input
                        hidden
                        accept="image/png,image/jpeg,image/webp"
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setAvatarFile(file);
                        }}
                      />
                    </Button>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                      <CountryPhoneField
                        value={formData.phone}
                        onChange={(v) => handleInputChange({ target: { name: 'phone', value: v } } as any)}
                        label="Telefon"
                        fullWidth
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 48, height: 48 }} src={avatarFile ? URL.createObjectURL(avatarFile) : undefined} />
                        <Button variant="outlined" component="label" disabled={loading}>
                          Dodaj avatar
                          <input hidden accept="image/png, image/jpeg, image/webp" type="file" onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            setAvatarFile(f);
                          }} />
                        </Button>
                      </Box>
                    </Box>

            </Box>
            {/* <Box
              sx={{
                width: '100%',
                height: '2px',
                backgroundColor:'#6F87F6',
                borderRadius: '3px',
                mb: 2, // margines dolny pod linią
                }}
              />
          {/* Tekst pod linią */}
            {/* <CustomTypography className={styles.additionalInfo}> 
            * Na podany e-mail użytkownik otrzyma hasło i dane dostępowe do aplikacji
          </CustomTypography> */} 
 

                {/* <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        name="email"
                        label="Adres E-mail"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        fullWidth
                        required
                        disabled={loading}
                    />
                    <TextField
                        name="phone"
                        label="Telefon"
                        value={formData.phone}
                        onChange={handleInputChange}
                        fullWidth
                        disabled={loading}
                    />
                </Box> */}
                <TextField
                    name="password"
                    label="Hasło"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={!!errors.password}
                    helperText={errors.password}
                    fullWidth
                    required
                    disabled={loading}
                />
                <FormControlLabel
                    control={
                    <Checkbox
                        name="isAdmin"
                        checked={formData.isAdmin}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    }
                    label="Nadaj uprawnienia administratora"
                />
  
            <Typography variant="caption" display="block" className={styles.infoText}>
                *Użytkownik otrzyma wygenerowane hasło na podany e-mail wraz z danymi dostępowymi.
            </Typography>

            </DialogContent>
            <DialogActions>
            <Button onClick={onClose} disabled={loading}>Anuluj</Button> 
            <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Dodaj'}
            </Button>
            </DialogActions>
        </form>
    </Dialog>
  );
};

export default AddUserModal; 


