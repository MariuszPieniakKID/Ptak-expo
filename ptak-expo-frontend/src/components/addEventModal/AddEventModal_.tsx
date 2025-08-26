import {  useCallback, useState } from 'react';
import CustomField from '../customField/CustomField';
import CustomTypography from '../customTypography/CustomTypography';
import { addExhibition, AddExhibitionPayload} from '../../services/api';


import { Box, CircularProgress, Dialog, DialogTitle, IconButton, Typography } from '@mui/material';
import { ReactComponent as AddCircleButton } from '../../assets/addCircleButton.svg';
import { ReactComponent as CloseIcon } from '../../assets/closeIcon.svg';
import EventsPageIcon from '../../assets/eventIcon.png';

import styles from './AddEventModal_.module.scss';
import { useAuth } from '../../contexts/AuthContext';
import { fieldOptions } from '../../helpers/mockData';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventAdded: () => void;
}

// interface EventProps {
//   selectedExhibitionId: string; 
//   standNumber: string;
//   hallName: string;
//   exhibitionSupervisor: string;
// }

// const validateSelection = (
//   value: string | number,
//   options: OptionType[],
// ): string => {
//   const trimmed = String(value).trim();
//   if (!trimmed) return ''; 
//   const optionValues = options.map(opt => String(opt.value));
//   if (!optionValues.includes(trimmed))
//     return `Wybierz jedną z dostępnych opcji: ${optionValues.join(', ')}`;

//   return '';
// };

// const validateExhibitionSupervisor = (
//   value: string,
//   options: OptionType[],
// ): string => {
//   const trimmed = String(value).trim();
//   if (!trimmed) return ''; 
//      const optionValues = options.map(opt => String(opt.value));
//   if (!optionValues.includes(trimmed))
//     return `Wybierz jedną z dostępnych opcji: ${optionValues.join(', ')}`;

//   return '';
// };


const AddEventModal_: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onEventAdded,
}) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<AddExhibitionPayload>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    status: 'planned',
    field:'all',
  });
 const [loading,setLoading] = useState(false);
 const [_error, setError] = useState<string | null>(null);
//   const [formEventValues, setFormEventValues] = useState<EventProps>({
//     selectedExhibitionId: '',
//     standNumber: '',
//     hallName: '',
//     exhibitionSupervisor: '',
//   });
//   const isNoExhibitionSelected = formEventValues.selectedExhibitionId === '';

//   
//const [error, setError] = useState('');
//   const [formErrors, setFormErrors] = useState<Record<string, string>>({
//     nip: '',
//     companyName: '',
//     address: '',
//     postalCode: '',
//     city: '',
//     contactPerson: '',
//     contactRole: '',
//     phone: '',
//     email: '',
//     selectedExhibitionId: '',
//     standNumber: '',
//     hallName: '',
//     exhibitionSupervisor: '',
//   });
//   const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
//   const [loadingExhibitions, setLoadingExhibitions] = useState(false);

//   const [exhibitionSupervisors, setExhibitionSupervisors] = useState<User[]>([]);
//   const [loadingExhibitionSupervisors, setLoadingExhibitionSupervisors] = useState(false);
//   const isFormEmpty = Object.values(formValues).every(value => String(value).trim() === '') 
//   && Object.values(formEventValues).every(value => String(value).trim() === '');

//   const eventOptions: OptionType[] = [
//     { value: '', label: '' },
//     ...exhibitions.map(exh => ({
//       value: exh.id,
//       label: exh.name,
//       description: `${new Date(exh.start_date).toLocaleDateString('pl-PL')} - ${new Date(
//         exh.end_date
//       ).toLocaleDateString('pl-PL')}`,
//     })),
//   ];
//   const exhibitionSupervisorOptions: OptionType[] = [
//      { value: '', label: '' },
//      ...exhibitionSupervisors.map(exh => ({
//        value: exh.id,
//        label: exh.fullName,
//        description: `${exh.phone}`,
//      })),
//   ];

  const resetForm = useCallback(() => {
     setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      status: 'planned',
      field:'all'
    });
    // setFormEventValues({
    //   selectedExhibitionId: '',
    //   standNumber: '',
    //   hallName: '',
    //   exhibitionSupervisor: '',
    // });
    // setFormErrors({
    //   nip: '',
    //   companyName: '',
    //   address: '',
    //   postalCode: '',
    //   city: '',
    //   contactPerson: '',
    //   contactRole: '',
    //   phone: '',
    //   email: '',
    //   selectedExhibitionId: '',
    //   standNumber: '',
    //   hallName: '',
    //   exhibitionSupervisor: '',
    // });
    setError(null);
  }, []);

//   const loadExhibitions = useCallback(async () => {
//     setLoadingExhibitions(true);
//     try {
//       const fetchedExhibitions = await fetchExhibitions(token);
//       const now = new Date();
//       const upcomingExhibitions = fetchedExhibitions.filter(exh => new Date(exh.end_date) >= now);
//       setExhibitions(upcomingExhibitions);
//     } catch (err) {
//       console.error('Error loading exhibitions:', err);
//       setError('Błąd podczas ładowania wydarzeń');
//     } finally {
//       setLoadingExhibitions(false);
//     }
//   }, [token]);


//   const loadExhibitionSupervisors= useCallback(async () => {
//     setLoadingExhibitionSupervisors(true);
//     //TODOO sprawdzić czy to faktycznie USER?
//     try {
//       const fetchedExhibitionSupervisors = await fetchUsers(token);

//       setExhibitionSupervisors(fetchedExhibitionSupervisors);
//     } catch (err) {
//       console.error('Error loading exhibition supervisors:', err);
//       setError('Błąd podczas ładowania opiekunów wydarzeń');
//     } finally {
//       setLoadingExhibitionSupervisors(false);
//     }
//   }, [token]);



//   useEffect(() => {
//     if (isOpen) {
//       resetForm();
//       loadExhibitions();
//       loadExhibitionSupervisors();
//     }
//   }, [isOpen, resetForm, loadExhibitions,loadExhibitionSupervisors]);

//   type FormValuesKeys = keyof AddExhibitorPayload;
//   type FormEventValuesKeys = keyof EventProps;
//   type FormAddExhibitorModalFields = FormValuesKeys | FormEventValuesKeys;

//   const validators: Record<FormAddExhibitorModalFields, (value: string) => string> = {
//       nip: validateNip,
//       companyName: validateCompanyName,
//       address: validateAddress,
//       postalCode: validatePostalCode,
//       city: validateCity,
//       contactPerson: validateContactPerson,
//       contactRole: validateContactRole,
//       phone: validatePhone,
//       email: validateEmail,
//       password: (value: string) => {
//         if (!value.trim()) return 'Hasło jest wymagane';
//         if (value.length < 6) return 'Hasło musi mieć co najmniej 6 znaków';
//         return '';
//       },
//       selectedExhibitionId: value => validateSelection(value, eventOptions),
//       standNumber: validateStandNumber,
//       hallName: validateHallName,
//       exhibitionSupervisor: value => validateExhibitionSupervisor(value, exhibitionSupervisorOptions),
//       exhibitionId: value => validateSelection(value, eventOptions),
//   };

//   const handleFormValueChange =(field: FormValuesKeys) =>(e: ChangeEvent<HTMLInputElement>) => {
//       const newValue = e.target.value;
//       setFormValues(prev => ({ ...prev, [field]: newValue }));

//       if (validators[field]) {
//         const errorMessage = validators[field](newValue);
//         setFormErrors(prev => ({ ...prev, [field]: errorMessage }));
//       }
//     };

//   const handleFormEventValueChange = (field: FormEventValuesKeys) =>(e: ChangeEvent<HTMLInputElement>) => {

//         //console.log(`!loading: ${!loading}, !error: ${!error}, !loadingExhibitions: ${!loadingExhibitions}, !loadingExhibitionSupervisors: ${!loadingExhibitionSupervisors}, !Object.values(formErrors).some(e => e !== ''): ${!Object.values(formErrors).some(e => e !== '')}`)
//       const newValue = e.target.value;
      
//       setFormEventValues(prev => ({ ...prev, [field]: newValue }));
       
//       if (validators[field]) {
//         const errorMessage = validators[field](newValue);
//         setFormErrors(prev => ({ ...prev, [field]: errorMessage }));
//       }
//     };

//   const handleSubmit = useCallback(async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
    
//     try {
//         const exhibitorData={
//         ...formValues,
//         exhibitionId: formEventValues.selectedExhibitionId===''?null:Number(formEventValues.selectedExhibitionId),
//         //standNumber: formEventValues.selectedExhibitionId===''? null: formEventValues.standNumber,
//         //hallName: formEventValues.selectedExhibitionId===''? null: formEventValues.hallName,
//         //exhibitionSupervisor: formEventValues.selectedExhibitionId===''? null: formEventValues.exhibitionSupervisor,
//         };

//         await addExhibitor(exhibitorData, token);
//         onExhibitorAdded();
//         resetForm();

//       }catch (err:any){
//         setError(err.message || 'Błąd podczas dodawania wystawcy');

//       }finally{

//         setLoading(false);
//       }
//     },
//     [formValues, formEventValues, token, onExhibitorAdded, resetForm]
//   );

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
   }, [loading, onClose]);

  return (
    <Dialog 
    open={isOpen} 
    onClose={onClose} 
    maxWidth="sm" 
    PaperProps={{ className: styles.customDialogPaper }}>
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
                Dodaj wydarzenie
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
                    {/* <CustomField
                    type="name"
                    label="Podaj nazwe wydarzenia"
                    value={formData.name}
                    onChange={handleFormDataChange('name')}
                    error={!!formErrors.name}
                    errorMessage={formErrors.name}
                    fullWidth
                    margin="none"
                    placeholder="Nazwa wydarzenia"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                    /> */}
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
                    {/* <CustomField
                    type="date"
                    label="Data rozpoczęcia"
                    value={formData.start_date}
                    onChange={handleFormDataChange('start_date')}
                    error={!!formErrors.start_date}
                    errorMessage={formErrors.start_date}
                    fullWidth
                    margin="none"
                    placeholder="DD.MM.RRRR"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                    /> */}
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
                     {/* <CustomField
                    type="date"
                    label="Data zakończenia"
                    value={formData.end_date}
                    onChange={handleInputChange('end_date')}
                    error={!!formErrors.end_date}
                    errorMessage={formErrors.end_date}
                    fullWidth
                    margin="none"
                    placeholder="Miasto"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                    /> */}
                </Box>
              </Box>

 {/* //selekcja poza grafiką */}

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
                    {/* <CustomField
                    type="location"
                    label="Lokalizacja"
                    value={formData.location || ''}
                    onChange={handleFormDataChange('location')}
                    error={!!formErrors.location}
                    errorMessage={formErrors.location}
                    fullWidth
                    margin="none"
                    placeholder="Wprowadź lokalizację wydarzenia"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                    /> */}
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
                    {/* <CustomField
                    type="description"
                    label="Wprowadź opis wydarzenia"
                    value={formData.description || ''}
                    onChange={handleFormDataChange('description')}
                    error={!!formErrors.description}
                    errorMessage={formErrors.description}
                    fullWidth
                    margin="none"
                    placeholder="Wprowadź opis wydarzenia"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                    /> */}
                </Box>
              </Box>

 {/* //selekcja */}

              <Box className={styles.singleFormRow}>
                <CustomField
                  type="field"
                  label="Typ. branża wydarzenia"
                  value={formData.field || 'all'}
                  onChange={handleInputChange('field')}
                  options={fieldOptions}
                  forceSelectionFromOptions={true}
                  placeholder="Typ. branża wydarzenia"
                  fullWidth
                />
                  {/* <CustomField
                  type="field"
                  label="Typ. branża wydarzenia"
                  value={formData.field || 'all'}
                  onChange={handleInputChange('field')}
                  options={fieldOptions}
                  forceSelectionFromOptions={true}
                  placeholder="Typ. branża wydarzenia"
                  fullWidth
                  error={!!formErrors.selectedExhibitionId}
                   errorMessage={formErrors.selectedExhibitionId}
                /> */}
              </Box>


              <Box className={styles.formRow}>
                <Box className={styles.halfFormRow}>
                      Grafika
                </Box>
                <Box className={styles.halfFormRow}>
                    <Box 
                        className={styles.boxToKlik}  
                        onClick={handleSubmit}
                        sx={{}}
                   >
                    <CustomTypography className={styles.addText}>dodaj</CustomTypography>
                    <AddCircleButton className={styles.addCircleButton} />
                  </Box>
                </Box>
               
              </Box>

            </Box>
          </form>
        </>
      )}
    </Dialog>
  );
};

export default AddEventModal_;