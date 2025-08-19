import React, { useState, ChangeEvent, useCallback } from "react";
import { Box,  FormControlLabel, Radio, RadioGroup} from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import styles from './AddingEvents.module.scss';
import CustomTypography from "../../customTypography/CustomTypography";
import CustomField from "../../customField/CustomField";
import TextEditor from "../../textEditor/TextEditor";
import { ReactComponent as BlueArrowIcon } from "../../../assets/blueArrow.svg";
import { ReactComponent as BlueCircleSaveIcon } from '../../../assets/submitIconBlueCircleWithCheckMark.svg';
import dayjs from 'dayjs';  
import 'dayjs/locale/pl';
dayjs.locale('pl');

interface AddEvent {
  id?: number;
  exhibition_id?: number;
  name: string;
  eventDate: string; // ISO date (YYYY-MM-DD)
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  description?: string;
  type: string;
  organizer: string;
}

const AddingEvents = () => {
  const [formValues, setFormValues] = useState<AddEvent>({
    name: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    description: '',
    type: '',
    organizer: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({
    name: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    description: '',
    type: '',
    organizer: '',
  });

  const validators: Partial<Record<keyof AddEvent, (value: string) => string>> = {
    name: (value) => (value.trim() ? '' : 'Nazwa jest wymagana'),
    eventDate: (value) => {
      if (!value.trim()) return "Data jest wymagana";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Niepoprawny format (YYYY-MM-DD)";
      return '';
    },
    startTime: (value) => {
      if (!value.trim()) return "Godzina rozpoczęcia jest wymagana";
      if (!/^\d{2}:\d{2}$/.test(value)) return "Format HH:mm";
      return '';
    },
    endTime: (value) => {
      if (!value.trim()) return "Godzina zakończenia jest wymagana";
      if (!/^\d{2}:\d{2}$/.test(value)) return "Format HH:mm";
      if (formValues.startTime && value <= formValues.startTime) {
        return "Zakończenie musi być po rozpoczęciu";
      }
      return '';
    },
    type: (value) => {
      if (!value.trim()) return "Typ wydarzenia jest wymagany";
      if (value.length < 3) return "Typ musi mieć min. 3 znaki";
      return '';
    },
    description: (value) => {
      if (value && value.length > 750) return "Max. 750 znaków";
      return '';
    },
    organizer: (value) => {
      if (!value.trim()) return "Organizator jest wymagany";
      return '';
    },
  };

  const handleFormValueChange = (field: keyof AddEvent) =>
    (e: ChangeEvent<HTMLInputElement> | string) => {
      let newValue: string;
      if (typeof e === 'string') {
        newValue = e;
      } else {
        newValue = e.target.value;
      }

      setFormValues(prev => ({ ...prev, [field]: newValue }));

      if (validators[field]) {
        const errorMessage = validators[field]?.(newValue);
        setFormErrors(prev => ({ ...prev, [field]: errorMessage || '' }));
      }
    };

  const handleDescriptionChange = (value: string) => {
    setFormValues(prev => ({ ...prev, description: value }));
    const errorMessage = validators.description?.(value);
    setFormErrors(prev => ({ ...prev, description: errorMessage || '' }));
  };

  const isFormValid =
    Object.values(formErrors).every(e => e === '') &&
    Object.values(formValues).some(v => String(v).trim() !== '');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      console.log("Formularz zawiera błędy", formErrors);
      return;
    }
    console.log("Wysyłam wydarzenie: ", formValues);
    // TODO: wywołanie API -> addTradeEvent(formValues)
  }, [formValues, formErrors, isFormValid]);

  return (
    <Box className={styles.container}>
      <CustomTypography className={styles.sectionTitle}>Dodawanie wydarzenia:</CustomTypography>
      <form onSubmit={handleSubmit}>
        <Box className={styles.singleRow}>
          <Box className={styles.halfRow}>
            <CustomField
              type="name"
              label="Nazwa wydarzenia"
              value={formValues.name}
              onChange={handleFormValueChange('name')}
              error={!!formErrors.name}
              errorMessage={formErrors.name || ''}
              fullWidth
              placeholder="Nazwa"
              className={styles.input}
              errorMessageClassName={styles.inputErrorMessage}
            />
          </Box>
        </Box>
        <Box className={styles.singleRowWrap}>
          <Box className={styles.pickers}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={formValues.eventDate ? dayjs(formValues.eventDate) : null}
                onChange={(newValue) => {
                  const dateStr = newValue ? newValue.format('YYYY-MM-DD') : '';
                  handleFormValueChange('eventDate')(dateStr);
                }}
                slots={{
                  openPickerIcon: BlueArrowIcon,
                }}
                slotProps={{
                  textField: {
                    error: !!formErrors.eventDate,
                    //helperText: formErrors.eventDate || '',
                    helperText: formErrors.eventDate ||'Data',
                    FormHelperTextProps: {className: styles.datePickerHelperText},
                    fullWidth: true,
                    placeholder: "DD.MMM",
                    className: styles.date,
                  }
                }}

                  format="D MMM"
              />
            </LocalizationProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
              <TimePicker
                value={formValues.startTime ? dayjs(formValues.startTime, 'HH:mm') : null}
                onChange={(newValue) => {
                  const timeStr = newValue ? newValue.format('HH:mm') : '';
                  handleFormValueChange('startTime')(timeStr);
                }}
                slots={{
                  openPickerIcon: BlueArrowIcon,
                }}
                slotProps={{
                  textField: {
                    error: !!formErrors.startTime,
                    helperText: formErrors.startTime || 'Początek',
                    FormHelperTextProps: {className: styles.datePickerHelperText},
                    fullWidth: true,
                    placeholder: "HH:mm",
                    className: styles.date,
                  }
                }}
                format="HH:mm"
              />
            </LocalizationProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
              <TimePicker
                value={formValues.endTime ? dayjs(formValues.endTime, 'HH:mm') : null}
                onChange={(newValue) => {
                  const timeStr = newValue ? newValue.format('HH:mm') : '';
                  handleFormValueChange('endTime')(timeStr);
                }}
                 slots={{openPickerIcon: (props) => <BlueArrowIcon {...props} className={styles.customBlueArrowIconPadding} />}}
                slotProps={{
                  textField: {
                    error: !!formErrors.endTime,
                    helperText:
                    formErrors.endTime 
                    ? (<span className={styles.helperTextError}>{formErrors.endTime}</span>) 
                    : (<span className={styles.helperTextNormal}>Koniec</span>),
                    FormHelperTextProps: {className: styles.datePickerHelperText},
                    fullWidth: true,
                    placeholder: "HH:mm",
                    className: styles.date,
                  }
                }}
                format="HH:mm"
              />
            </LocalizationProvider>
          </Box>

          <Box className={styles.halfRowOrganizer}>
            <CustomField
              type="organizer"
              label="Organizator"
              value={formValues.organizer}
              onChange={handleFormValueChange('organizer')}
              error={!!formErrors.organizer}
              errorMessage={formErrors.organizer || ''}
              fullWidth
              placeholder="Organizator"
              className={styles.organizer}
            />
          </Box>
        </Box>
        {/* Edytor opisu */}
        <Box className={styles.singleRow} sx={{paddingTop:'2em'}}>
          <TextEditor
            legend="Opis wydarzenia"
            placeholder="Opis Twojego wydarzenia"
            value={formValues.description || ''}
            onChange={handleDescriptionChange}
            maxLength={750}
            showToolbar
          />
          {formErrors.description && (
            <Box component="span" sx={{ color: 'error.main', fontSize: '0.75rem', marginTop: '4px' }}>
              {formErrors.description}
            </Box>
          )}
        </Box>
        {/* Radio typ wydarzenia */}
        <Box className={styles.singleRow}>
          <CustomTypography className={styles.ratioGroupLabel}>Określ rodzaj:</CustomTypography>
        </Box>
        <Box className={styles.singleRow}>
          <Box className={styles.halfRowRadioGroup}>
            <RadioGroup
              sx={{ width: '100%'}}
              aria-label="typ wydarzenia"
              name="type"
              value={formValues.type}
              onChange={(e) => {
                const value = e.target.value;
                setFormValues(prev => ({ ...prev, type: value }));
                if (validators.type) {
                  const errorMessage = validators.type(value);
                  setFormErrors(prev => ({ ...prev, type: errorMessage || '' }));
                }
              }}
            >
              <FormControlLabel value="Montaż stoiska" control={<Radio size="small"  />}
                sx={{ "& .MuiFormControlLabel-label": { color: "#2E2E38", fontWeight: "500", padding: "0.25em 0em", fontSize: "13px" } }}
                className={styles.ratioLabel}
                label="Montaż stoiska"
              />
              <FormControlLabel value="Demontaż stoiska" control={<Radio size="small"  />}
                sx={{ "& .MuiFormControlLabel-label": { color: "#2E2E38", fontWeight: "500", padding: "0.25em 0em", fontSize: "13px" } }}
                className={styles.ratioLabel}
                label="Demontaż stoiska" />
              <FormControlLabel value="Dostawa i montaż sprzętu i materiałów" control={<Radio size="small"  />}
                sx={{ "& .MuiFormControlLabel-label": { color: "#2b2b3dff", fontWeight: "500", padding: "0.25em 0em", fontSize: "13px" } }}
                className={styles.ratioLabel}
                label="Dostawa i montaż sprzętu i materiałów" />
            </RadioGroup>
            {formErrors.type && (
              <Box component="span" sx={{ color: 'error.main', fontSize: '0.75rem', marginTop: '4px' }}>
                {formErrors.type}
              </Box>
            )}
          </Box>
          <Box className={styles.halfRowL}>
            <Box 
              className={styles.actionSaveFile} 
              //onClick={handleSave}
              >
                <CustomTypography className={styles.actionLabel}>zapisz</CustomTypography>
                <BlueCircleSaveIcon className={styles.actionIcon} />
              </Box>
          </Box>
         
        </Box>
      </form>
    </Box>
  );
};

export default AddingEvents;