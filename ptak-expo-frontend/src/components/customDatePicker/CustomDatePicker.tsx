import * as React from 'react';
import {
  DatePicker,
  DatePickerProps,
  usePickerContext,
  DatePickerFieldProps,
} from '@mui/x-date-pickers';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

function CustomDateField(props: DatePickerFieldProps) {
  const picker = usePickerContext();

  // Odczytujemy własne propsy, jeśli były przekazane (np. przez slotProps.field)
  const error = (props as any).error ?? false;
  const helperText = (props as any).helperText ?? '';
  const placeholder = (props as any).placeholder ?? 'Wybierz datę';

  return (
    <TextField
      {...props}
      label={picker.label ?? ''}
      name={picker.name ?? ''}
      error={error}
      helperText={helperText}
      placeholder={placeholder}
      inputRef={picker.rootRef ?? null}
      className={picker.rootClassName ?? ''}
      sx={{
        ...picker.rootSx,
        '& .MuiInputBase-root': { background: '#f6f8fa' },
        '& .Mui-error': { color: 'red' },
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => picker.setOpen?.((prev) => !prev)}
              ref={picker.triggerRef}
              aria-label="Otwórz wybór daty"
              edge="end"
            >
              <CalendarMonthIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
      autoFocus={picker.autoFocus && !picker.open}
      disabled={picker.disabled}
      // readOnly nie ma w typie TextField, więc też można pominąć lub dodać z as any jeśli potrzebujesz
    />
  );
}

type CustomDatePickerProps = DatePickerProps;

export const CustomDatePicker = React.forwardRef<HTMLDivElement, CustomDatePickerProps>(
  (props, ref) => (
    <DatePicker
      {...props}
      ref={ref}
      slots={{
        ...props.slots,
        field: CustomDateField,
      }}
      format={props.format || 'DD.MM.YYYY'}
    />
  )
);