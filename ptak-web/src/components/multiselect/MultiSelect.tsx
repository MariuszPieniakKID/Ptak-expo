/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import Autocomplete, { type AutocompleteProps } from '@mui/material/Autocomplete';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

export interface SelectOption {
  text?: string;
  value: any;
}

interface Props
  extends Omit<
    AutocompleteProps<SelectOption[], true, true, false> & TextFieldProps,
    'options' | 'onChange' | 'value' | 'renderInput'
  > {
  options: SelectOption[];
  onChange?: (event: React.SyntheticEvent<Element, Event>, newValue: SelectOption[]) => void;
  value: SelectOption[];
  withCheckboxes?: boolean;
}

export default function MultiSelect({
  options,
  onChange,
  value,
  readOnly = false,
  disabled,
  ...props
}: Props) {
  const { t } = useTranslation('common');
  return (
    <>
      <Autocomplete
        multiple
        noOptionsText={t('selectNoOptionsText')}
        clearText={t('selectClearText')}
        loadingText={t('selectLoadingText')}
        closeText={t('selectCloseText')}
        openText={t('selectOpenText')}
        readOnly={readOnly}
        options={options}
        getOptionLabel={(option) => option.text || ''}
        isOptionEqualToValue={(option: SelectOption, value: SelectOption) =>
          option.value == value.value
        }
        value={value}
        onChange={onChange}
        disableClearable
        renderInput={(params) => <TextField {...params} {...props} variant="outlined" />}
        sx={{ mb: 1 }}
        disabled={disabled}
        renderOption={(props, option) => <li {...props}>{option.text}</li>}
        limitTags={3}
        ChipProps={{ size: 'small' }}
      />
    </>
  );
}
