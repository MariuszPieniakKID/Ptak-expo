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
  // Poland first (default)
  { code: 'PL', dial: '+48', label: 'Polska (+48)' },
  
  // EU Countries (alphabetically)
  { code: 'AT', dial: '+43', label: 'Austria (+43)' },
  { code: 'BE', dial: '+32', label: 'Belgium (+32)' },
  { code: 'BG', dial: '+359', label: 'Bulgaria (+359)' },
  { code: 'HR', dial: '+385', label: 'Croatia (+385)' },
  { code: 'CY', dial: '+357', label: 'Cyprus (+357)' },
  { code: 'CZ', dial: '+420', label: 'Czech Republic (+420)' },
  { code: 'DK', dial: '+45', label: 'Denmark (+45)' },
  { code: 'EE', dial: '+372', label: 'Estonia (+372)' },
  { code: 'FI', dial: '+358', label: 'Finland (+358)' },
  { code: 'FR', dial: '+33', label: 'France (+33)' },
  { code: 'DE', dial: '+49', label: 'Germany (+49)' },
  { code: 'GR', dial: '+30', label: 'Greece (+30)' },
  { code: 'HU', dial: '+36', label: 'Hungary (+36)' },
  { code: 'IE', dial: '+353', label: 'Ireland (+353)' },
  { code: 'IT', dial: '+39', label: 'Italy (+39)' },
  { code: 'LV', dial: '+371', label: 'Latvia (+371)' },
  { code: 'LT', dial: '+370', label: 'Lithuania (+370)' },
  { code: 'LU', dial: '+352', label: 'Luxembourg (+352)' },
  { code: 'MT', dial: '+356', label: 'Malta (+356)' },
  { code: 'NL', dial: '+31', label: 'Netherlands (+31)' },
  { code: 'PT', dial: '+351', label: 'Portugal (+351)' },
  { code: 'RO', dial: '+40', label: 'Romania (+40)' },
  { code: 'SK', dial: '+421', label: 'Slovakia (+421)' },
  { code: 'SI', dial: '+386', label: 'Slovenia (+386)' },
  { code: 'ES', dial: '+34', label: 'Spain (+34)' },
  { code: 'SE', dial: '+46', label: 'Sweden (+46)' },
  
  // Popular European countries (non-EU)
  { code: 'GB', dial: '+44', label: 'United Kingdom (+44)' },
  { code: 'NO', dial: '+47', label: 'Norway (+47)' },
  { code: 'CH', dial: '+41', label: 'Switzerland (+41)' },
  { code: 'UA', dial: '+380', label: 'Ukraine (+380)' },
  { code: 'TR', dial: '+90', label: 'Turkey (+90)' },
  { code: 'RS', dial: '+381', label: 'Serbia (+381)' },
  { code: 'BA', dial: '+387', label: 'Bosnia and Herzegovina (+387)' },
  { code: 'AL', dial: '+355', label: 'Albania (+355)' },
  { code: 'IS', dial: '+354', label: 'Iceland (+354)' },
  { code: 'BY', dial: '+375', label: 'Belarus (+375)' },
  { code: 'MD', dial: '+373', label: 'Moldova (+373)' },
  { code: 'ME', dial: '+382', label: 'Montenegro (+382)' },
  { code: 'MK', dial: '+389', label: 'North Macedonia (+389)' },
  
  // Popular countries worldwide
  { code: 'US', dial: '+1', label: 'United States (+1)' },
  { code: 'CA', dial: '+1', label: 'Canada (+1)' },
  { code: 'CN', dial: '+86', label: 'China (+86)' },
  { code: 'JP', dial: '+81', label: 'Japan (+81)' },
  { code: 'KR', dial: '+82', label: 'South Korea (+82)' },
  { code: 'IN', dial: '+91', label: 'India (+91)' },
  { code: 'AU', dial: '+61', label: 'Australia (+61)' },
  { code: 'BR', dial: '+55', label: 'Brazil (+55)' },
  { code: 'MX', dial: '+52', label: 'Mexico (+52)' },
  { code: 'AR', dial: '+54', label: 'Argentina (+54)' },
  { code: 'ZA', dial: '+27', label: 'South Africa (+27)' },
  { code: 'EG', dial: '+20', label: 'Egypt (+20)' },
  { code: 'AE', dial: '+971', label: 'United Arab Emirates (+971)' },
  { code: 'SA', dial: '+966', label: 'Saudi Arabia (+966)' },
  { code: 'IL', dial: '+972', label: 'Israel (+972)' },
  { code: 'SG', dial: '+65', label: 'Singapore (+65)' },
  { code: 'TH', dial: '+66', label: 'Thailand (+66)' },
  { code: 'MY', dial: '+60', label: 'Malaysia (+60)' },
  { code: 'ID', dial: '+62', label: 'Indonesia (+62)' },
  { code: 'PH', dial: '+63', label: 'Philippines (+63)' },
  { code: 'VN', dial: '+84', label: 'Vietnam (+84)' },
  { code: 'NZ', dial: '+64', label: 'New Zealand (+64)' },
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


