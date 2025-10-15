import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import CustomField, { OptionType } from '../customField/CustomField';
import CustomTypography from '../customTypography/CustomTypography';
import {Exhibition, ExhibitorEvent, fetchExhibitions, fetchUsers, User, assignExhibitorToEvent } from '../../services/api';
import {validateHallName,validateStandNumber, validateBoothArea} from '../../helpers/validators';

import { Box, CircularProgress, Dialog, DialogTitle, IconButton, Typography } from '@mui/material';
import { ReactComponent as AddCircleButton } from '../../assets/addCircleButton.svg';
import { ReactComponent as CloseIcon } from '../../assets/closeIcon.svg';
import ExhibitorsPageIcon from '../../assets/mask-group-6@2x.png';

import styles from './AddEventToExhibitorModal.module.scss';

interface AddEventToExhibitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventToExhibitiorAdd: () => void;
  token: string;
  exhibitorId:number;
  companyName:string;
  exhibitorEvents?: ExhibitorEvent[] | undefined;
}

interface EventProps {
  selectedExhibitionId: string; 
  standNumber: string;
  hallName: string;
  exhibitionSupervisor: string;
  boothArea: string;
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


const AddEventToExhibitorModal: React.FC<AddEventToExhibitorModalProps> = ({
  isOpen,
  onClose,
  onEventToExhibitiorAdd,
  token,
  exhibitorId,
  companyName,
  exhibitorEvents=undefined,
}) => {

  const [formEventValues, setFormEventValues] = useState<EventProps>({
    selectedExhibitionId: '',
    standNumber: '',
    hallName: '',
    exhibitionSupervisor: '',
    boothArea: '',
  });
  const [loading,setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [prefillExhibitionId, setPrefillExhibitionId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({
    selectedExhibitionId: '',
    standNumber: '',
    hallName: '',
    exhibitionSupervisor: '',
    boothArea: '',
  });
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loadingExhibitions, setLoadingExhibitions] = useState(false);

  const [exhibitionSupervisors, setExhibitionSupervisors] = useState<User[]>([]);
  const [loadingExhibitionSupervisors, setLoadingExhibitionSupervisors] = useState(false);

 const isFormEmpty = Object.values(formEventValues).every(value => String(value).trim() === '');

  const eventOptions: OptionType[] = [
    { value: '', label: '' },
    ...exhibitions.map(exh => ({
      value: exh.id,
      label: exh.name,
      description: `${new Date(exh.start_date).toLocaleDateString('pl-PL')} - ${new Date(
        exh.end_date
      ).toLocaleDateString('pl-PL')}`,
    })),
  ];
  const exhibitionSupervisorOptions: OptionType[] = [
     { value: '', label: '' },
     ...exhibitionSupervisors.map(exh => ({
       value: exh.id,
       label: exh.fullName,
       description: `${exh.phone}`,
     })),
  ];

  const resetForm = useCallback(() => {

    setFormEventValues({
      selectedExhibitionId: '',
      standNumber: '',
      hallName: '',
      exhibitionSupervisor: '',
      boothArea: '',
    });
    setFormErrors({
      selectedExhibitionId: '',
      standNumber: '',
      hallName: '',
      exhibitionSupervisor: '',
      boothArea: '',
    });
    setError('');
  }, []);

  const loadExhibitions = useCallback(async () => {
    setLoadingExhibitions(true);
    try {
      const fetchedExhibitions = await fetchExhibitions(token);
      console.log(fetchedExhibitions.map(exh => exh.id));
      const now = new Date();
      //const upcomingExhibitions = fetchedExhibitions.filter(exh => new Date(exh.end_date) >= now);
 
      //Lista Wystaw z wykluczeniem wystaw na które jest już zapisany wystawca oraz posortowane po nazwie
      let upcomingExhibitions = fetchedExhibitions
      .filter(exh => {
        const isNotEnded = new Date(exh.end_date) >= now;
        const isNotInExhibitorEvents = !exhibitorEvents?.some(event => event.id === exh.id);
        return isNotEnded && isNotInExhibitorEvents;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
      // If editing, ensure currently assigned exhibition is present in options
      if (isEditMode && prefillExhibitionId) {
        const alreadyIn = upcomingExhibitions.some(exh => Number(exh.id) === Number(prefillExhibitionId));
        if (!alreadyIn) {
          const current = fetchedExhibitions.find(exh => Number(exh.id) === Number(prefillExhibitionId));
          if (current) {
            upcomingExhibitions = [current, ...upcomingExhibitions].sort((a, b) => a.name.localeCompare(b.name));
          }
        }
      }

      setExhibitions(upcomingExhibitions);
    } catch (err) {
      console.error('Error loading exhibitions:', err);
      setError('Błąd podczas ładowania wydarzeń');
    } finally {
      setLoadingExhibitions(false);
    }
  }, [token, exhibitorEvents, isEditMode, prefillExhibitionId]);


  const loadExhibitionSupervisors= useCallback(async () => {
    setLoadingExhibitionSupervisors(true);

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
      try {
        const prefill = (window as any).__prefillExhibitorAssign;
        if (prefill) {
          setFormEventValues((prev) => ({
            ...prev,
            hallName: prefill.hallName ?? '',
            standNumber: prefill.standNumber ?? '',
            boothArea: prefill.boothArea ?? '',
            exhibitionSupervisor: prefill.supervisorUserId ? String(prefill.supervisorUserId) : '',
          }));
          if (prefill.exhibitionId) {
            setIsEditMode(true);
            setPrefillExhibitionId(Number(prefill.exhibitionId));
            setFormEventValues((prev) => ({
              ...prev,
              selectedExhibitionId: String(prefill.exhibitionId)
            }));
          } else {
            setIsEditMode(false);
            setPrefillExhibitionId(null);
          }
        }
      } catch {}
    }
  }, [isOpen, resetForm, loadExhibitions,loadExhibitionSupervisors]);

  type FormEventValuesKeys = keyof EventProps;
  type FormAddExhibitorModalFields = FormEventValuesKeys;

  const validators: Record<FormAddExhibitorModalFields, (value: string) => string> = {
      selectedExhibitionId: value => validateSelection(value, eventOptions),
      standNumber: validateStandNumber,
      hallName: validateHallName,
      exhibitionSupervisor: value => validateExhibitionSupervisor(value, exhibitionSupervisorOptions),
      boothArea: validateBoothArea,
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

       
        const eventAddedToExhibitor={
         exhibitionId: formEventValues.selectedExhibitionId===''?null:Number(formEventValues.selectedExhibitionId),
         standNumber: formEventValues.selectedExhibitionId===''? null: formEventValues.standNumber,
         hallName: formEventValues.selectedExhibitionId===''? null: formEventValues.hallName,
         exhibitionSupervisor: formEventValues.selectedExhibitionId===''? null: formEventValues.exhibitionSupervisor,
         boothArea: formEventValues.selectedExhibitionId===''? null: parseFloat(formEventValues.boothArea.replace(',', '.')),
         };

           console.log(`Dodanie do Wystawcy o id: ${exhibitorId} 
            i nazwie: ${companyName} 
            wydarzenia : ${eventAddedToExhibitor.exhibitionId} 
            z standNumber ${eventAddedToExhibitor.standNumber} 
            oraz opiekunem ${eventAddedToExhibitor.exhibitionSupervisor} DANE ${eventAddedToExhibitor}`)
        if (!eventAddedToExhibitor.exhibitionId) {
          throw new Error('Wybierz wydarzenie');
        }
        await assignExhibitorToEvent(
          exhibitorId,
          eventAddedToExhibitor.exhibitionId,
          token,
          eventAddedToExhibitor.exhibitionSupervisor ? Number(eventAddedToExhibitor.exhibitionSupervisor) : null,
          eventAddedToExhibitor.hallName ?? null,
          eventAddedToExhibitor.standNumber ?? null,
          eventAddedToExhibitor.boothArea ?? null,
        );

        resetForm();
         onEventToExhibitiorAdd();
         onClose();
   
      }catch (err:any){
        setError(err.message || 'Błąd podczas przypisywania wydarzenia do wystawcy');

      }finally{

        setLoading(false);
      }
    },
    [
        formEventValues,
        resetForm,
        exhibitorId,
        companyName,
        onClose,
        onEventToExhibitiorAdd,
        token
    ]
  );

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
          <DialogTitle className={styles.dialogTitle}  >
            <Box>
              <img src={ExhibitorsPageIcon} alt="Wystawcy" className={styles._titleIcon} />
            </Box>
            <Box>
              <Typography variant="h6" className={styles.modalTitle}>
                Wystawcy
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
          <Box className={styles.exhibitorNameRow}>
            <CustomTypography className={styles.label} >Nazwa Wystawcy: </CustomTypography>
            <CustomTypography className={styles.companyName} >{companyName} id: {exhibitorId}</CustomTypography>
          </Box>
           

          <form onSubmit={handleSubmit}>
            <Box className={styles.inputWrapper}>
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
                  {...(isEditMode ? { disabled: true } : {})}
                />
              </Box>
        
              <Box className={styles.singleFormRow}>
                    <CustomTypography className={styles.textInModal}>Dane Stoiska</CustomTypography>
              </Box>

              <Box className={styles.formRow}>
                <Box className={styles.halfFormRow}>
                    <CustomField
                    type="text"
                    label="Nazwa Hali"
                    value={formEventValues.hallName}
                    onChange={handleFormEventValueChange('hallName')}
                    error={!!formErrors.hallName}
                    errorMessage={formErrors.hallName}
                    fullWidth
                    margin="none"
                    placeholder="Wybierz halę"
                    className={styles.input}
                    errorMessageClassName={styles.inputErrorMessage}
                    options={[
                      { value: 'Hala A', label: 'Hala A' },
                      { value: 'Hala B', label: 'Hala B' },
                      { value: 'Hala C', label: 'Hala C' },
                      { value: 'Hala D', label: 'Hala D' },
                      { value: 'Hala E', label: 'Hala E' },
                      { value: 'Hala F', label: 'Hala F' }
                    ]}
                    forceSelectionFromOptions
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

              <Box className={styles.formRow}>
                <Box className={styles.halfFormRow}>
                    <CustomField
                    type="boothArea"
                    label="Metraż stoiska (m²)"
                    value={formEventValues.boothArea}
                    onChange={handleFormEventValueChange('boothArea')}
                    error={!!formErrors.boothArea}
                    errorMessage={formErrors.boothArea}
                    fullWidth
                    margin="none"
                    placeholder="np. 12,5"
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

              <Box className={styles.formRowFooterWithAction}>
                
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
                    <CustomTypography className={styles.addText}>{isEditMode ? 'zapisz' : 'dodaj'}</CustomTypography>
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

export default AddEventToExhibitorModal;