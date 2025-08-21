/* eslint-disable @typescript-eslint/no-explicit-any */
import { TextField } from '@mui/material';
import { Controller, type Control } from 'react-hook-form';

interface FormTextFieldProps {
  name: string;
  label: string;
  control: Control<any>;
  type?: string;
}

export default function FormTextField({ name, label, control, type = 'text' }: FormTextFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={label}
          type={type}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          fullWidth
          variant="outlined"
        />
      )}
    />
  );
}
