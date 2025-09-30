import React, { useState, ChangeEvent, useRef, useEffect, useMemo } from "react";
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
import { createTradeEvent, updateTradeEvent, TradeEvent, fetchExhibition, Exhibition } from '../../../services/api';
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

type AddingEventsProps = { exhibitionId?: number | undefined; exhibitorId: number; onCreated?: (ev: TradeEvent) => void; onUpdated?: (ev: TradeEvent) => void };
const AddingEvents: React.FC<AddingEventsProps> = ({ exhibitionId, exhibitorId, onCreated, onUpdated }) => {
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
    organizer: (_value) => '',
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

  const validateAll = () => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = validateAll();
    console.log('[AddingEvents] validateAll ->', ok, { formErrors });
    if (!ok) return;
    try {
      if (!resolvedExhibitionId || !token) {
        console.warn('[AddingEvents] Missing resolvedExhibitionId or token', { resolvedExhibitionId, hasToken: !!token });
        return;
      }
      console.log('[AddingEvents] Submit start', { formValues, resolvedExhibitionId, hasToken: !!token });
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
      if (typeof formValues.id === 'number' && formValues.id > 0) {
        // update existing
        console.log('[AddingEvents] Calling updateTradeEvent', { exhibitionId: resolvedExhibitionId, eventId: formValues.id, payload });
        const res = await updateTradeEvent(resolvedExhibitionId, formValues.id, payload, token);
        console.log('✅ Trade event updated', res.data);
        if (onUpdated) onUpdated(res.data);
      } else {
        // create new
        console.log('[AddingEvents] Calling createTradeEvent', { exhibitionId: resolvedExhibitionId, payload });
        const res = await createTradeEvent(resolvedExhibitionId, payload, token);
        console.log('✅ Trade event saved', res.data);
        if (onCreated) onCreated(res.data);
      }
      // Clear form after save/update
      setFormValues({ name: '', eventDate: '', startTime: '', endTime: '', description: '', type: 'Montaż stoiska', organizer: '' });
    } catch (err: any) {
      console.error('❌ Błąd zapisu wydarzenia', err);
      const message = (err && err.message) ? String(err.message) : 'Błąd zapisu wydarzenia';
      if (message.includes('Data wydarzenia musi mieścić się w zakresie dat targów')) {
        setFormErrors(prev => ({ ...prev, eventDate: 'Data wydarzenia musi mieścić się w zakresie dat targów' }));
      }
    }
  };

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

  // Allow external prefill (from AddedEvents edit click)
  useEffect(() => {
    const applyPrefill = () => {
      const data = (window as any).prefillAddingEventForm;
      if (data && typeof data === 'object') {
        console.log('[AddingEvents] Applying prefill', data);
        const toDateOnly = (s?: string) => {
          if (!s) return '';
          // ISO like 2025-08-27T22:00:00.000Z -> 2025-08-27
          if (s.includes('T')) return s.slice(0, 10);
          // already YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
          return s;
        };
        const toHm = (s?: string) => {
          if (!s) return '';
          // HH:mm:ss -> HH:mm
          if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s.slice(0, 5);
          return s;
        };
        setFormValues(prev => ({
          ...prev,
          id: typeof data.id === 'number' ? data.id : prev.id,
          name: data.name ?? prev.name,
          eventDate: toDateOnly(data.eventDate ?? prev.eventDate),
          startTime: toHm(data.startTime ?? prev.startTime),
          endTime: toHm(data.endTime ?? prev.endTime),
          description: data.description ?? prev.description,
          type: data.type ?? prev.type,
          organizer: data.organizer ?? prev.organizer,
        }));
        // Clear after applying
        delete (window as any).prefillAddingEventForm;
      }
    };
    // Initial apply and also when user navigates within the page
    applyPrefill();
    const i = setInterval(applyPrefill, 500);
    return () => clearInterval(i);
  }, []);

  return (
    <Box className={styles.container}>
      <CustomTypography className={styles.sectionTitle}>Dodawanie wydarzenia:</CustomTypography>
      <form onSubmit={handleSubmit} id="adding-events-form">
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
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
              <Box sx={{ background: '#f6f8fa', borderRadius: '8px' }}>
                <DateCalendar
                  value={formValues.eventDate ? dayjs(formValues.eventDate) : null}
                  {...(exhibitionRange?.start ? { minDate: dayjs(exhibitionRange.start) } : {})}
                  {...(exhibitionRange?.end ? { maxDate: dayjs(exhibitionRange.end) } : {})}
                  onChange={(newValue) => {
                    const dateStr = newValue ? newValue.format('YYYY-MM-DD') : '';
                    handleFormValueChange('eventDate')(dateStr);
                  }}
                />
                {formErrors.eventDate && (
                  <Box component="span" sx={{ color: 'error.main', fontSize: '0.75rem', marginTop: '4px', display: 'block', px: 1 }}>
                    {formErrors.eventDate}
                  </Box>
                )}
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