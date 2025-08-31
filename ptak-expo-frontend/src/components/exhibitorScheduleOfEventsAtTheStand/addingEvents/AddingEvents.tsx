import React, { useState, ChangeEvent, useCallback, useRef, useEffect, useMemo } from "react";
import { Box,  FormControlLabel, Radio, RadioGroup} from "@mui/material";
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
import { useAuth } from '../../../contexts/AuthContext';
import { createTradeEvent, TradeEvent, fetchExhibition, Exhibition } from '../../../services/api';
import { useParams } from 'react-router-dom';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
dayjs.locale('pl');

// Wrap custom SVG to avoid passing unknown props (e.g., ownerState) to DOM
const OpenPickerIcon: React.FC<any> = ({ ownerState, ...rest }) => <BlueArrowIcon {...rest} />;
const OpenPickerIconPadded: React.FC<any> = ({ ownerState, className, ...rest }) => (
  <BlueArrowIcon {...rest} className={`${className || ''} ${styles.customBlueArrowIconPadding || ''}`.trim()} />
);

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

type AddingEventsProps = { exhibitionId?: number | undefined; exhibitorId: number; onCreated?: (ev: TradeEvent) => void };
const AddingEvents: React.FC<AddingEventsProps> = ({ exhibitionId, exhibitorId, onCreated }) => {
  const { token } = useAuth();
  const params = useParams();
  const resolvedExhibitionId = useMemo(() => {
    return exhibitionId || Number(params.id) || Number((window as any).currentSelectedExhibitionId);
  }, [exhibitionId, params.id]);
  const [exhibitionRange, setExhibitionRange] = useState<{ start: string; end: string } | null>(null);
  const [formValues, setFormValues] = useState<AddEvent>({
    name: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    description: '',
    // Default to a valid type so backend doesn't reject empty value
    type: 'Montaż stoiska',
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
      // Range check vs exhibition dates if available
      if (exhibitionRange) {
        if (value < exhibitionRange.start || value > exhibitionRange.end) {
          return `Data poza zakresem (${exhibitionRange.start} – ${exhibitionRange.end})`;
        }
      }
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

  const validateAll = useCallback(() => {
    const nextErrors: Record<string, string> = {
      name: validators.name?.(formValues.name) || '',
      eventDate: validators.eventDate?.(formValues.eventDate) || '',
      startTime: validators.startTime?.(formValues.startTime) || '',
      endTime: validators.endTime?.(formValues.endTime) || '',
      description: validators.description?.(formValues.description || '') || '',
      type: validators.type?.(formValues.type) || '',
      organizer: validators.organizer?.(formValues.organizer) || '',
    };
    setFormErrors(nextErrors);
    return Object.values(nextErrors).every(e => e === '');
  }, [formValues, validators, exhibitionRange]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    try {
      if (!resolvedExhibitionId || !token) return;
      const basePayload: TradeEvent = {
        name: formValues.name,
        eventDate: formValues.eventDate,
        startTime: formValues.startTime,
        endTime: formValues.endTime,
        type: formValues.type,
      };
      const payload: TradeEvent = { ...basePayload, exhibitor_id: exhibitorId };
      if (typeof formValues.description === 'string' && formValues.description.trim() !== '') {
        payload.description = formValues.description;
      }
      if (typeof formValues.organizer === 'string' && formValues.organizer.trim() !== '') {
        payload.organizer = formValues.organizer;
      }
      const res = await createTradeEvent(resolvedExhibitionId, payload, token);
      console.log('✅ Trade event saved', res.data);
      if (onCreated) {
        onCreated(res.data);
      }
      // Clear form after save
      setFormValues({ name: '', eventDate: '', startTime: '', endTime: '', description: '', type: 'Montaż stoiska', organizer: '' });
    } catch (err: any) {
      console.error('❌ Błąd zapisu wydarzenia', err);
      const message = (err && err.message) ? String(err.message) : 'Błąd zapisu wydarzenia';
      if (message.includes('Data wydarzenia musi mieścić się w zakresie dat targów')) {
        setFormErrors(prev => ({ ...prev, eventDate: 'Data wydarzenia musi mieścić się w zakresie dat targów' }));
      }
    }
  }, [formValues, validateAll, token, resolvedExhibitionId, exhibitorId, onCreated]);

  // Load exhibition date range to constrain calendar
  useEffect(() => {
    const loadRange = async () => {
      try {
        if (!resolvedExhibitionId) return;
        const ex: Exhibition = await fetchExhibition(resolvedExhibitionId, token || undefined);
        // ex.start_date / ex.end_date are ISO strings; keep only date part
        const toDateOnly = (s?: string) => (s ? s.slice(0, 10) : '');
        const start = toDateOnly(ex.start_date);
        const end = toDateOnly(ex.end_date);
        if (start && end) setExhibitionRange({ start, end });
      } catch {}
    };
    loadRange();
  }, [resolvedExhibitionId, token]);

  const submitRef = useRef<HTMLButtonElement | null>(null);

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
              <Box sx={{ background: '#f6f8fa', borderRadius: '8px' }}>
                <DateCalendar
                  value={formValues.eventDate ? dayjs(formValues.eventDate) : null}
                  onChange={(newValue) => {
                    const dateStr = newValue ? newValue.format('YYYY-MM-DD') : '';
                    handleFormValueChange('eventDate')(dateStr);
                  }}
                />
              </Box>
            </LocalizationProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
              <TimePicker
                value={formValues.startTime ? dayjs(formValues.startTime, 'HH:mm') : null}
                onChange={(newValue) => {
                  const timeStr = newValue ? newValue.format('HH:mm') : '';
                  handleFormValueChange('startTime')(timeStr);
                }}
                slots={{
                  openPickerIcon: OpenPickerIcon,
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
                 slots={{ openPickerIcon: OpenPickerIconPadded }}
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
              onClick={() => submitRef.current?.click()}
            >
              <CustomTypography className={styles.actionLabel}>zapisz</CustomTypography>
              <BlueCircleSaveIcon className={styles.actionIcon} />
            </Box>
            <button type="submit" ref={submitRef} style={{ display: 'none' }} />
          </Box>
         
        </Box>
      </form>
    </Box>
  );
};

export default AddingEvents;