import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import CustomField, { OptionType } from '../customField/CustomField';
import CustomTypography from '../customTypography/CustomTypography';
import { addExhibitor, AddExhibitorPayload, Exhibition, fetchExhibitions, fetchUsers, User, fetchCompanyByNip } from '../../services/api';
import {
  validateAddress,
  validateCity,
  validateCompanyName,
  validateContactPerson,
  validateContactRole,
  validateEmail,
  validateHallName,
  validateNip,
  validatePhone,
  validatePostalCode,
  validateStandNumber,
} from '../../helpers/validators';

import { Box, CircularProgress, Dialog, DialogTitle, IconButton, Typography } from '@mui/material';
import { ReactComponent as AddCircleButton } from '../../assets/addCircleButton.svg';
import { ReactComponent as CheckIcon } from '../../assets/checkIcon.svg';
import { ReactComponent as CloseIcon } from '../../assets/closeIcon.svg';
import ExhibitorsPageIcon from '../../assets/mask-group-6@2x.png';

import styles from './AddExhibitorModal.module.scss';

interface AddExhibitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExhibitorAdded: () => void;
  token: string;
}

interface EventProps {
  selectedExhibitionId: string; 
  standNumber: string;
  hallName: string;
  exhibitionSupervisor: string;
}

const validateSelection = (
  value: string | number,
  options: OptionType[],
): string => {
  const trimmed = String(value).trim();
  if (!trimmed) return ''; 
  const optionValues = options.map(opt => String(opt.value));
  if (!optionValues.includes(trimmed))
    return `Wybierz jedną z dostępnych opcji: ${optionValues.join(', ')}`;

  return '';
};

const validateExhibitionSupervisor = (
  value: string,
  options: OptionType[],
): string => {
  const trimmed = String(value).trim();
  if (!trimmed) return ''; 
     const optionValues = options.map(opt => String(opt.value));
  if (!optionValues.includes(trimmed))
    return `Wybierz jedną z dostępnych opcji: ${optionValues.join(', ')}`;

  return '';
};


const AddExhibitorModal: React.FC<AddExhibitorModalProps> = ({
  isOpen,
  onClose,
  onExhibitorAdded,
  token,
}) => {
  const [formValues, setFormValues] = useState<AddExhibitorPayload>({
    nip: '',
    companyName: '',
    address: '',
    postalCode: '',
    city: '',
    contactPerson: '',
    contactRole: '',
    phone: '',
    email: '',
    password: '',
  });

  const [formEventValues, setFormEventValues] = useState<EventProps>({
    selectedExhibitionId: '',
    standNumber: '',
    hallName: '',
    exhibitionSupervisor: '',
  });
  const isNoExhibitionSelected = formEventValues.selectedExhibitionId === '';
  const [loading,setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({
    nip: '',
    companyName: '',
    address: '',
    postalCode: '',
    city: '',
    contactPerson: '',
    contactRole: '',
    phone: '',
    email: '',
    selectedExhibitionId: '',
    standNumber: '',
    hallName: '',
    exhibitionSupervisor: '',
  });
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loadingExhibitions, setLoadingExhibitions] = useState(false);

  const [exhibitionSupervisors, setExhibitionSupervisors] = useState<User[]>([]);
  const [loadingExhibitionSupervisors, setLoadingExhibitionSupervisors] = useState(false);
  const isFormEmpty = Object.values(formValues).every(value => String(value).trim() === '') 
  && Object.values(formEventValues).every(value => String(value).trim() === '');

  const eventOptions: OptionType[] = useMemo(() => (
    [
      { value: '', label: '' },
      ...exhibitions.map(exh => ({
        value: exh.id,
        label: exh.name,
        description: `${new Date(exh.start_date).toLocaleDateString('pl-PL')} - ${new Date(
          exh.end_date
        ).toLocaleDateString('pl-PL')}`,
      })),
    ]
  ), [exhibitions]);

  const exhibitionSupervisorOptions: OptionType[] = useMemo(() => (
    [
      { value: '', label: '' },
      ...exhibitionSupervisors.map(exh => ({
        value: exh.id,
        label: exh.fullName,
        description: `${exh.phone}`,
      })),
    ]
  ), [exhibitionSupervisors]);

  const resetForm = useCallback(() => {
    setFormValues({
      nip: '',
      companyName: '',
      address: '',
      postalCode: '',
      city: '',
      contactPerson: '',
      contactRole: '',
      phone: '',
      email: '',
      password: '',
    });
    setFormEventValues({
      selectedExhibitionId: '',
      standNumber: '',
      hallName: '',
      exhibitionSupervisor: '',
    });
    setFormErrors({
      nip: '',
      companyName: '',
      address: '',
      postalCode: '',
      city: '',
      contactPerson: '',
      contactRole: '',
      phone: '',
      email: '',
      selectedExhibitionId: '',
      standNumber: '',
      hallName: '',
      exhibitionSupervisor: '',
    });
    setError('');
  }, []);

  const loadExhibitions = useCallback(async () => {
    setLoadingExhibitions(true);
    try {
      const fetchedExhibitions = await fetchExhibitions(token);
      const now = new Date();
      const upcomingExhibitions = fetchedExhibitions.filter(exh => new Date(exh.end_date) >= now);
      setExhibitions(upcomingExhibitions);
    } catch (err) {
      console.error('Error loading exhibitions:', err);
      setError('Błąd podczas ładowania wydarzeń');
    } finally {
      setLoadingExhibitions(false);
    }
  }, [token]);


  const loadExhibitionSupervisors= useCallback(async () => {
    setLoadingExhibitionSupervisors(true);
    //TODOO sprawdzić czy to faktycznie USER?
    try {
      const fetchedExhibitionSupervisors = await fetchUsers(token);

      setExhibitionSupervisors(fetchedExhibitionSupervisors);
    } catch (err) {
      console.error('Error loading exhibition supervisors:', err);
      setError('Błąd podczas ładowania opiekunów wydarzeń');
    } finally {
      setLoadingExhibitionSupervisors(false);
    }
  }, [token]);



  useEffect(() => {
    if (isOpen) {
      resetForm();
      loadExhibitions();
      loadExhibitionSupervisors();
    }
  }, [isOpen, resetForm, loadExhibitions,loadExhibitionSupervisors]);

  type FormValuesKeys = keyof AddExhibitorPayload;
  type FormEventValuesKeys = keyof EventProps;
  type FormAddExhibitorModalFields = FormValuesKeys | FormEventValuesKeys;

  const validators: Record<FormAddExhibitorModalFields, (value: string) => string> = useMemo(() => ({
    nip: validateNip,
    companyName: validateCompanyName,
    address: validateAddress,
    postalCode: validatePostalCode,
    city: validateCity,
    contactPerson: validateContactPerson,
    contactRole: validateContactRole,
    phone: validatePhone,
    email: (value: string) => {
      if (!String(value).trim()) return 'Adres e-mail jest wymagany';
      return validateEmail(value);
    },
    password: (value: string) => {
      if (!value.trim()) return 'Hasło jest wymagane';
      if (value.length < 6) return 'Hasło musi mieć co najmniej 6 znaków';
      return '';
    },
    selectedExhibitionId: value => validateSelection(value, eventOptions),
    standNumber: validateStandNumber,
    hallName: validateHallName,
    exhibitionSupervisor: value => validateExhibitionSupervisor(value, exhibitionSupervisorOptions),
    exhibitionId: value => validateSelection(value, eventOptions),
  }), [eventOptions, exhibitionSupervisorOptions]);

  const handleFormValueChange =(field: FormValuesKeys) =>(e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setFormValues(prev => ({ ...prev, [field]: newValue }));

      if (validators[field]) {
        const errorMessage = validators[field](newValue);
        setFormErrors(prev => ({ ...prev, [field]: errorMessage }));
      }
    };

  const handleFormEventValueChange = (field: FormEventValuesKeys) =>(e: ChangeEvent<HTMLInputElement>) => {

        //console.log(`!loading: ${!loading}, !error: ${!error}, !loadingExhibitions: ${!loadingExhibitions}, !loadingExhibitionSupervisors: ${!loadingExhibitionSupervisors}, !Object.values(formErrors).some(e => e !== ''): ${!Object.values(formErrors).some(e => e !== '')}`)
      const newValue = e.target.value;
      
      setFormEventValues(prev => ({ ...prev, [field]: newValue }));
       
      if (validators[field]) {
        const errorMessage = validators[field](newValue);
        setFormErrors(prev => ({ ...prev, [field]: errorMessage }));
      }
    };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
        // Validate all required fields
        const newErrors: Record<string, string> = { ...formErrors };

        (Object.keys(formValues) as FormValuesKeys[]).forEach((key) => {
          const value = String(formValues[key] ?? '');
          if (validators[key]) {
            newErrors[key as string] = validators[key](value);
          }
        });

        if (formEventValues.selectedExhibitionId.trim()) {
          newErrors.selectedExhibitionId = validateSelection(
            formEventValues.selectedExhibitionId,
            eventOptions,
          );
          newErrors.hallName = validateHallName(formEventValues.hallName);
          newErrors.standNumber = validateStandNumber(formEventValues.standNumber);
          newErrors.exhibitionSupervisor =
            validateExhibitionSupervisor(
              formEventValues.exhibitionSupervisor,
              exhibitionSupervisorOptions,
            ) || (!formEventValues.exhibitionSupervisor.trim() ? 'Opiekun wystawy jest wymagany' : '');
        } else {
          newErrors.selectedExhibitionId = '';
          newErrors.hallName = '';
          newErrors.standNumber = '';
          newErrors.exhibitionSupervisor = '';
        }

        setFormErrors(newErrors);
        const hasErrors = Object.values(newErrors).some((msg) => msg && msg.length > 0);
        if (hasErrors) {
          setLoading(false);
          return;
        }

        const exhibitorData={
        ...formValues,
        exhibitionId: formEventValues.selectedExhibitionId===''?null:Number(formEventValues.selectedExhibitionId),
        //standNumber: formEventValues.selectedExhibitionId===''? null: formEventValues.standNumber,
        //hallName: formEventValues.selectedExhibitionId===''? null: formEventValues.hallName,
        //exhibitionSupervisor: formEventValues.selectedExhibitionId===''? null: formEventValues.exhibitionSupervisor,
        };

        await addExhibitor(exhibitorData, token);
        onExhibitorAdded();
        resetForm();

      }catch (err:any){
        setError(err.message || 'Błąd podczas dodawania wystawcy');

      }finally{

        setLoading(false);
      }
    },
    [
      formValues,
      formEventValues,
      token,
      onExhibitorAdded,
      resetForm,
      eventOptions,
      exhibitionSupervisorOptions,
      formErrors,
      validators,
    ]
  );

  const handleGusImport = useCallback(async () => {
    try {
      const nipRaw = formValues.nip;
      const nipTrimmed = String(nipRaw || '').trim();
      const nipDigits = nipTrimmed.replace(/^PL/i, '').replace(/[\s-]/g, '');
      const nipError = validateNip(nipDigits);
      if (nipError) {
        setFormErrors(prev => ({ ...prev, nip: nipError }));
        return;
      }
      setLoading(true);
      const data = await fetchCompanyByNip(nipDigits, token);
      setFormValues(prev => ({
        ...prev,
        companyName: data.companyName || prev.companyName,
        address: data.address || prev.address,
        postalCode: data.postalCode || prev.postalCode,
        city: data.city || prev.city,
      }));
      setFormErrors(prev => ({
        ...prev,
        companyName: validators.companyName(data.companyName || ''),
        address: validators.address(data.address || ''),
        postalCode: validators.postalCode(data.postalCode || ''),
        city: validators.city(data.city || ''),
      }));
    } catch (e: any) {
      setError(e?.message || 'Nie udało się pobrać danych z GUS');
    } finally {
      setLoading(false);
    }
  }, [formValues.nip, token, validators]);

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
   }, [loading, onClose]);

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
                Dodaj wystawcę
              </Typography>
            </Box>
            <IconButton 
            onClick={handleClose} 
            disableRipple
            sx={{
                 position: 'absolute', 
                 right: 8, 
                 top: 8,
             }}>
              <CloseIcon className={styles.closeIcon} />
            </IconButton>
          </DialogTitle>

          <form onSubmit={handleSubmit}>
            <Box className={styles.inputWrapper}>
              {/* pola formValues */}
              <Box className={styles.formRow}>
                <Box className={styles.halfFormRow}>
                    <CustomField
                    type="nip"
                    label="NIP np.: 106-00-00-062"
                    value={formValues.nip}
                    onChange={handleFormValueChange('nip')}
                    error={!!formErrors.nip}
                    errorMessage={formErrors.nip}
                    fullWidth
                    margin="none"
                    placeholder="NIP np.: 106-00-00-062"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                    />
                </Box>
                <Box className={styles.halfFormRow}>
                <Box 
                className={styles.iconAndTextButton}
                onClick={handleGusImport}>
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
                    value={formValues.companyName}
                    onChange={handleFormValueChange('companyName')}
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
                    value={formValues.address}
                    onChange={handleFormValueChange('address')}
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
                    value={formValues.postalCode}
                    onChange={handleFormValueChange('postalCode')}
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
                    value={formValues.city}
                    onChange={handleFormValueChange('city')}
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
                    value={formValues.contactPerson}
                    onChange={handleFormValueChange('contactPerson')}
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
                    value={formValues.contactRole}
                    onChange={handleFormValueChange('contactRole')}
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
                    <CustomField
                    type="phone"
                    label="Telefon"
                    value={formValues.phone}
                    onChange={handleFormValueChange('phone')}
                    error={!!formErrors.phone}
                    errorMessage={formErrors.phone}
                    fullWidth
                    margin="none"
                    placeholder="Telefon"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                    />
                </Box>
                <Box className={styles.halfFormRow}>
                    <CustomField
                    type="email"
                    label="Adres E-mail*"
                    value={formValues.email}
                    onChange={handleFormValueChange('email')}
                    error={!!formErrors.email}
                    errorMessage={formErrors.email}
                    fullWidth
                    margin="none"
                    placeholder="Adres E-mail*"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                    />
                </Box>
                <Box className={styles.halfFormRow}>
                    <CustomField
                    type="password"
                    label="Hasło*"
                    value={formValues.password}
                    onChange={handleFormValueChange('password')}
                    error={!!formErrors.password}
                    errorMessage={formErrors.password}
                    fullWidth
                    margin="none"
                    placeholder="Hasło*"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                    />
                </Box>
              </Box>

              <Box className={styles.line} />

              {/* pola formEventValues */}
              <Box className={styles.singleFormRow}>
                <CustomField
                  type="selectedExhibitionId"
                  label="Wydarzenie"
                  value={formEventValues.selectedExhibitionId}
                  onChange={handleFormEventValueChange('selectedExhibitionId')}
                  options={eventOptions}
                  forceSelectionFromOptions={true}
                  placeholder="Wybierz wydarzenie, które chcesz przypisać do wystawcy"
                  fullWidth
                  error={!!formErrors.selectedExhibitionId}
                  errorMessage={formErrors.selectedExhibitionId}
                />
              </Box>
            {!isNoExhibitionSelected && (
                <>
                <Box className={styles.singleFormRow}>
                    <CustomTypography className={styles.textInModal}>Dane Stoiska</CustomTypography>
                </Box>

              <Box className={styles.formRow}>
                <Box className={styles.halfFormRow}>
                    <CustomField
                    type="hallName"
                    label="Nazwa Hali"
                    value={formEventValues.hallName}
                    onChange={handleFormEventValueChange('hallName')}
                    error={!!formErrors.hallName}
                    errorMessage={formErrors.hallName}
                    fullWidth
                    margin="none"
                    placeholder="Nazwa Hali"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                    />
                </Box>
                <Box className={styles.halfFormRow}>
                    <CustomField
                    type="standNumber"
                    label="Numer stoiska"
                    value={formEventValues.standNumber}
                    onChange={handleFormEventValueChange('standNumber')}
                    error={!!formErrors.standNumber}
                    errorMessage={formErrors.standNumber}
                    fullWidth
                    margin="none"
                    placeholder="Numer stoiska"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                    />
                </Box>
              </Box>

              <Box className={styles.singleFormRow}>
                <CustomField
                  type="exhibitionSupervisor"
                  label="Opiekun wystawy"
                  value={formEventValues.exhibitionSupervisor}
                  onChange={handleFormEventValueChange('exhibitionSupervisor')}
                  options={exhibitionSupervisorOptions}
                  forceSelectionFromOptions={true}
                  placeholder="Wybierz opiekuna wystawy"
                  fullWidth
                  error={!!formErrors.exhibitionSupervisor}
                  errorMessage={formErrors.exhibitionSupervisor}
                />
              </Box>
            </>
            )}
             

              <Box className={styles.formRowFooterWithAction}>
                <CustomTypography className={styles.additionalInfo}>
                  * Na podany e-mail użytkownik otrzyma hasło i dane dostępowe do aplikacji
                </CustomTypography>
                
                {(
                    !loading && 
                    !error && 
                    !loadingExhibitions && 
                    !loadingExhibitionSupervisors && 
                    !Object.values(formErrors).some(e => e !== '') &&
                    !isFormEmpty) 
                    ? (
                  <Box 
                   className={styles.boxToKlik}  
                   onClick={handleSubmit}
                   >
                    <CustomTypography className={styles.addText}>zapisz</CustomTypography>
                    <AddCircleButton className={styles.addCircleButton} />
                  </Box>)
                  :<></>
                }
              </Box>
            </Box>
          </form>
        </>
      )}
    </Dialog>
  );
};

export default AddExhibitorModal;