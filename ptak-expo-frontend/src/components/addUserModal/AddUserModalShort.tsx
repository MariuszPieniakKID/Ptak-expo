import React, { ChangeEvent,useCallback,useEffect,useState} from 'react';
import {Alert, Box,CircularProgress,Dialog,DialogActions,DialogTitle, IconButton,Typography} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CustomField from '../customField/CustomField';
import { addUserByAdmin, AddUserPayloadByAdmin } from '../../services/api';
import CustomTypography from '../customTypography/CustomTypography';
import CustomButton from '../customButton/CustomButton';

import UsersPageIcon from '../../assets/mask-group-5@2x.png';
import styles from './AddUserModal.module.scss';


 interface AddUserModalProps {
   isOpen: boolean;
   onClose: () => void;
   onUserAdded: () => void;
   token: string;
 }

 const AddUserModalShort: React.FC<AddUserModalProps> = ({ 
  isOpen, 
  onClose, 
  onUserAdded, 
  token
 }) => {
const [fullName,setFullName]=useState('');
const [fullNameError, setFullNameError]=useState('');
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');
const [phone,setPhone]=useState('');
const [phoneError, setPhoneError] = useState('');
const [error, setError]=useState('');
const [loading, setLoading] = useState(false);
const [apiError, setApiError] = useState('');



//   Reset form when modal opens/closes
  useEffect(() => {
     if (isOpen) {
      setFullName('');
      setEmail('');
      setPhone('');
      setFullNameError('');
      setEmailError('');
      setPhoneError('');
      setApiError('');
      setError('');
      setLoading(false);
    }
   }, [isOpen]);


  const validateFullName = (fullName: string) => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      setFullNameError('Imię i nazwisko jest wymagane');
      return false;
    } 
    const re= /^[A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ]+([ '-][A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)+$/;
    if(!re.test(trimmed)){
      setFullNameError('Wypełnij poprawnie pole: min. dwa wyrazy, tylko litery, spacje, myślniki lub apostrofy.');
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
    
    const re =  /^\+?\d{9,12}$/;
    if (!re.test(phone)) {
      setPhoneError('Podaj poprawny numer telefonu');
      return false;
    }
    setPhoneError('');
    return true;
  };
  const handleFullNameChange = (e: ChangeEvent<HTMLInputElement>) => {
     const newFullName = e.target.value;
     setFullName(newFullName);
     if (validateFullName (newFullName)) {
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

  const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const isFullNameValid =validateFullName(fullName);
        const isEmailValid = validateEmail(email);
        const isPhoneValid = validatePhone(phone);

        if (!isFullNameValid || !isEmailValid || !isPhoneValid) return;
  
        setLoading(true);
        setApiError('');


        const nameParts =fullName.trim().split(' ');
        const payload: AddUserPayloadByAdmin={
              first_name: nameParts[0],
              last_name: nameParts.slice(1).join(' '),
              email: email,
              phone: phone || null,
          }

        try {
          await addUserByAdmin(payload, token);
          onUserAdded();
          onClose();
          
        } catch (err:any) {
          setApiError(err.message || 'Wystąpił nieznany błąd.');
          setError(err.message || 'Wystąpił nieznany błąd.');
          
        } finally {
          setLoading(false);
        }
      },
      [fullName, email, phone, token, onUserAdded, onClose]
    );
  

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      maxWidth="sm"  
      PaperProps={{ className: styles.customDialogPaper}}
     >


          {loading
          ? <CircularProgress size={24} />
          :( <>
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
          {/* <DialogContent className={styles.dialogContent}> */}
            {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>} 
            <Box className={styles.inputWrapper}>
               <CustomField
                  type="fullName"
                  label="Imię i nazwisko"
                  value= {fullName}
                  onChange={handleFullNameChange}
                  error={!!fullNameError}
                  errorMessage={fullNameError}
                  fullWidth
                  margin="none"
                  placeholder={"Imię i nazwisko"}
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
                <CustomField
                  label="Telefon"
                  type="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  error={!!phoneError}
                  errorMessage={phoneError}
                  placeholder="600600600"
                  fullWidth
                  margin="none"
                  className={styles.input}
                  errorMessageClassName={styles.inputErrorMessage}
                /> 
            </Box>

            <Box>
                <Box className={styles.line}/>
              
                {/* Tekst pod linią */}
                <Box className={styles.actionContainer}>
                    <CustomTypography className={styles.additionalInfo}> 
                      * Na podany e-mail użytkownik otrzyma hasło i dane dostępowe do aplikacji
                    </CustomTypography> 
                    <DialogActions className={styles.dialogActions}> 
                        <CustomButton
                          type="submit"
                           sx={{display:'none'}}
                              disabled={
                                loading || 
                                !!emailError || 
                                !!phoneError|| 
                                !!fullNameError|| 
                                !fullName ||
                                !email || 
                                !phone || 
                                !!error
                          } >
                            Dodaj
                        </CustomButton>

                        <CustomTypography className={styles.addText}>dodaj</CustomTypography>
                        <button
                        className={styles.circleButton}
                        disabled={
                                loading || 
                                !!emailError || 
                                !!phoneError|| 
                                !!fullNameError|| 
                                !fullName ||
                                !email || 
                                !phone || 
                                !!error
                              }
                        
                        ><span className={styles.plusIcon}>+</span></button>
                    </DialogActions>
                </Box>
            </Box>
        </form>
          </>)
          }
        
    </Dialog>
  );
};

export default AddUserModalShort; 


