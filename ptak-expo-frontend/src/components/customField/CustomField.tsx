import React, { useState, FC, ChangeEvent, useRef, useEffect, KeyboardEvent } from "react";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
//import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import styles from './CustomField.module.scss';

export type OptionType = {
  value: string | number;
  label: React.ReactNode;
  description?: React.ReactNode; // opcjonalne dodatkowe info
  [key: string]: any; // inne pola, jeśli potrzebujesz
};


type CustomFieldProps = {
  placeholder?: string;
  label?: string;
  size?: "small" | "medium";
  margin?: "none" | "dense" | "normal";
  fullWidth?: boolean;
  error?: boolean;
  errorMessage?: string;
  type: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  borderColor?: string;
  activeBorderColor?: string;
  className?: string;
  errorMessageClassName?: string;
  name?: string;
  options?: OptionType[];
  showOptionsExternal?: boolean; // Sterowanie widocznością listy z zewnątrz
  onShowOptionsChange?: (visible: boolean) => void; // Callback do zmiany widoczności
  forceSelectionFromOptions?: boolean; // Wymuszanie wyboru tylko spośród opcji
};

const CustomField: FC<CustomFieldProps> = ({
  placeholder,
  label,
  size,
  margin,
  fullWidth,
  error,
  errorMessage,
  type,
  value,
  onChange,
  borderColor = '#D7D9DD',
  activeBorderColor = '#6F87F6',
  className,
  errorMessageClassName,
  name,
  options = [],
  showOptionsExternal,
  onShowOptionsChange,
  forceSelectionFromOptions = false,
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOptionsInternal, setShowOptionsInternal] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isPasswordField = type === 'password';
  const hasOptions = options.length > 0;

  // Kontrolowana widoczność opcji
  const isControlled = showOptionsExternal !== undefined;
  const showOptions = isControlled ? showOptionsExternal : showOptionsInternal;
  const [openUpward, setOpenUpward] = useState(false); //??
  const maxDropdownHeight = Math.min(200, window.innerHeight * 0.4);


  const setShowOptions = (visible: boolean) => {
    if (isControlled) {
      onShowOptionsChange && onShowOptionsChange(visible);
    } else {
      setShowOptionsInternal(visible);
    }
  };

  // Zamknięcie listy przy kliknięciu poza komponentem
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowOptions(false);
        setHighlightedIndex(-1);
      }
    }
    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);

  //??
  useEffect(() => {
  if (showOptions && wrapperRef.current) {
    const rect = wrapperRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 200; // maxHeight Twojej listy w px

    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }
  } else {
    setOpenUpward(false);
  }
}, [showOptions]);


  // Obsługa wyboru opcji - wywołuje onChange z wartością value opcji
  const handleOptionClick = (optionValue: string | number) => {
    const fakeEvent = {
      target: { value: optionValue, name: name ?? undefined },
    } as ChangeEvent<HTMLInputElement>;
    onChange(fakeEvent);
    setShowOptions(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Gdy wylatuje focus - jeśli wymuszamy wybór z listy i wartość nie jest na liście - zeruj
  const handleBlur = () => {
    setFocused(false);

    if (forceSelectionFromOptions && hasOptions) {
      const allowedValues = options.map((opt) => String(opt.value));
      if (!allowedValues.includes(String(value))) {
        const fakeEvent = {
          target: { value: '', name: name ?? undefined },
        } as ChangeEvent<HTMLInputElement>;
        onChange(fakeEvent);
      }
    }
  };

  // Obsługa wpisywania - dopuszcza wyjątkowo tylko dopasowania (jeśli wymuszamy)
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (forceSelectionFromOptions && hasOptions && newValue) {
      const matches = options.filter((opt) =>
        String(opt.label).toLowerCase().startsWith(newValue.toLowerCase())
      );
      if (matches.length === 0) return; // blokuj wprowadzenie niedozwolonej wartości
    }
    onChange(e);
  };

  // Obsługa klawiatury dla dropdown
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!hasOptions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setShowOptions(true);
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setShowOptions(true);
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case 'Enter':
        if (showOptions && highlightedIndex >= 0 && highlightedIndex < options.length) {
          e.preventDefault();
          handleOptionClick(options[highlightedIndex].value);
        }
        break;
      case 'Escape':
        setShowOptions(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setShowOptions(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Icona na końcu pola
  const getEndAdornment = () => {
    if (isPasswordField) {
      return (
        <InputAdornment position="end">
          <IconButton
            aria-label="toggle password visibility"
            onClick={() => setShowPassword((prev) => !prev)}
            edge="end"
            size={size ?? 'medium'}
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      );
    }
    if (hasOptions) {
      return (
        <InputAdornment position="end">
          <IconButton
            aria-label={showOptions ? 'Ukryj opcje' : 'Pokaż opcje'}
            onClick={() => setShowOptions(!showOptions)}
            edge="end"
            size={size ?? 'medium'}
            tabIndex={-1}
            disableRipple
          >
            {!showOptions 
            ? <ExpandMoreIcon 
            sx={{color:'#6f87f6'}} 
            /> 
            : <ExpandLessIcon
             sx={{color:'#6f87f6'}} 
             />}
          </IconButton>
        </InputAdornment>
      );
    }
    return null;
  };

  // Obliczamy tekst wyświetlany w inpucie, jeśli forceSelectionFromOptions
  // to pokazujemy label odpowiadający wartości value
  // const displayValue = React.useMemo(() => {
  //   if (forceSelectionFromOptions && hasOptions) {
  //     const found = options.find((opt) => String(opt.value) === String(value));
  //     return found ? found.label : '';
  //   }
  //   return value;
  // }, [value, forceSelectionFromOptions, options, hasOptions]);
  const displayValue = React.useMemo(() => {
    if (forceSelectionFromOptions && hasOptions) {
      const found = options.find((opt) => String(opt.value) === String(value));
      return found ? String(found.label) : '';
    }
    return value;
  }, [value, forceSelectionFromOptions, options, hasOptions]);

  const isPlaceholderActive = !displayValue && !!placeholder;

  return (
    <div style={{ position: 'relative' }} className={className} ref={wrapperRef}>
      <TextField
        inputRef={inputRef}
        label=""
        variant="outlined"
        type={isPasswordField ? (showPassword ? 'text' : 'password') : type}
        value={displayValue as string}
        onChange={handleChange}
        placeholder={placeholder ?? ''}
        size={size ?? 'small'}
        margin={margin ?? 'normal'}
        fullWidth={!!fullWidth}
        error={!!error}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        InputProps={{
          endAdornment: getEndAdornment(),
          autoComplete: 'off',
          readOnly: forceSelectionFromOptions && hasOptions, // wymuszamy wybór z listy
           style: {
           color: isPlaceholderActive ? '#A7A7A7' : 'inherit',
    },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '20px',
            '& fieldset': {
              borderColor: borderColor,
            },
            '&:hover fieldset': {
              borderColor: activeBorderColor,
            },
            '&.Mui-focused fieldset': {
              borderColor: activeBorderColor,
            },
            '&.Mui-error fieldset': {
              borderColor: '#c7353c',
            },
          },
        }}
      />

      <span className={styles.helperText}>
        {!error && (focused || (value && String(value) !== '')) && label ? label : '\u00A0'}
      </span>
    
        {error && (
        <span className={`${styles.errorMessage} ${errorMessageClassName ?? ''}`}>
          {errorMessage ?? 'Błąd'}
        </span>
      )}

      {showOptions && hasOptions && (
        <ul
            className={`${styles.dropdownList} ${openUpward ? styles.dropdownListUpward : styles.dropdownListDownward}`}
            role="listbox"
            tabIndex={-1}
            style={{ maxHeight: maxDropdownHeight }}
          >
            {options.map((option, index) => (
              <li
                key={index}
                onClick={() => handleOptionClick(option.value)}
                className={`${styles.dropdownItem} ${highlightedIndex === index ? styles.highlighted : ''}`}
                role="option"
                aria-selected={String(option.value) === String(value)}
                tabIndex={-1}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseLeave={() => setHighlightedIndex(-1)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOptionClick(option.value);
                  }
                }}
              >
                {option.label}
                {option.description && (
                  <div className={styles.dropdownDescription}>
                    {option.description}
                  </div>
                )}
              </li>
            ))}
          </ul>
      )}
    </div>
  );
};

export default CustomField;