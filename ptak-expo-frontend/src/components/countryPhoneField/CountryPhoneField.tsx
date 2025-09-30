import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import CustomSelect, { OptionType } from '../customSelect/CustomSelect';
import CustomField from '../customField/CustomField';

type CountryPhoneFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  fullWidth?: boolean;
  className?: string;
};

const COUNTRY_OPTIONS: Array<{ code: string; dial: string; label: string }> = [
  { code: 'PL', dial: '+48', label: 'Polska (+48)' },
  { code: 'DE', dial: '+49', label: 'Deutschland (+49)' },
  { code: 'CZ', dial: '+420', label: 'Česko (+420)' },
  { code: 'SK', dial: '+421', label: 'Slovensko (+421)' },
  { code: 'UA', dial: '+380', label: 'Україна (+380)' },
  { code: 'GB', dial: '+44', label: 'United Kingdom (+44)' },
  { code: 'FR', dial: '+33', label: 'France (+33)' },
  { code: 'ES', dial: '+34', label: 'España (+34)' },
  { code: 'IT', dial: '+39', label: 'Italia (+39)' },
  { code: 'NL', dial: '+31', label: 'Nederland (+31)' },
  { code: 'BE', dial: '+32', label: 'België (+32)' },
  { code: 'AT', dial: '+43', label: 'Österreich (+43)' },
  { code: 'US', dial: '+1', label: 'United States (+1)' },
];

const DIAL_TO_CODE: Record<string, string> = COUNTRY_OPTIONS.reduce((acc, c) => {
  acc[c.dial] = c.code;
  return acc;
}, {} as Record<string, string>);

const CountryPhoneField: React.FC<CountryPhoneFieldProps> = ({
  value,
  onChange,
  label,
  placeholder,
  error,
  errorMessage,
  fullWidth,
  className,
}) => {
  const options: OptionType[] = useMemo(
    () => COUNTRY_OPTIONS.map((c) => ({ value: c.code, label: c.label, dial: c.dial })),
    []
  );

  const parseValue = useCallback((val: string): { code: string; dial: string; local: string } => {
    const trimmed = String(val || '').replace(/\s+/g, '');
    if (trimmed.startsWith('+')) {
      // Find the longest matching dial prefix
      const match = COUNTRY_OPTIONS
        .map((c) => c.dial)
        .sort((a, b) => b.length - a.length)
        .find((d) => trimmed.startsWith(d));
      if (match) {
        return {
          code: DIAL_TO_CODE[match],
          dial: match,
          local: trimmed.slice(match.length),
        };
      }
    }
    // Default to PL if unknown
    return { code: 'PL', dial: '+48', local: trimmed.replace(/^\+/, '') };
  }, []);

  const [countryCode, setCountryCode] = useState<string>('PL');
  const [dial, setDial] = useState<string>('+48');
  const [localPart, setLocalPart] = useState<string>('');

  // Initialize from value
  useEffect(() => {
    const parsed = parseValue(value);
    setCountryCode(parsed.code);
    setDial(parsed.dial);
    setLocalPart(parsed.local);
  }, [value, parseValue]);

  const emitChange = useCallback(
    (nextDial: string, nextLocal: string) => {
      const normalizedLocal = String(nextLocal || '').replace(/[^0-9]/g, '');
      const combined = `${nextDial}${normalizedLocal}`;
      onChange(combined);
    },
    [onChange]
  );

  const handleCountryChange = (e: any) => {
    const nextCode = String(e.target?.value ?? e?.target?.textContent ?? e);
    const found = COUNTRY_OPTIONS.find((c) => c.code === nextCode);
    const nextDial = found ? found.dial : '+48';
    setCountryCode(nextCode);
    setDial(nextDial);
    emitChange(nextDial, localPart);
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/[^0-9]/g, '');
    setLocalPart(digits);
    emitChange(dial, digits);
  };

  return (
    <Box className={className} sx={{ display: 'flex', gap: 1 }}>
      <Box sx={{ minWidth: 180 }}>
        <CustomSelect
          placeholder={'+48 Polska'}
          value={countryCode}
          onChange={handleCountryChange as any}
          options={options}
          fullWidth
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <CustomField
          type="tel"
          label={label ?? ''}
          value={localPart}
          onChange={handleLocalChange}
          placeholder={placeholder || '600600600'}
          error={!!error}
          errorMessage={errorMessage ?? ''}
          fullWidth={!!fullWidth}
          margin="none"
        />
      </Box>
    </Box>
  );
};

export default CountryPhoneField;


