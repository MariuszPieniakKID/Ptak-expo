import  { useState, FC, ChangeEvent} from "react";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";           
import InputAdornment from "@mui/material/InputAdornment";   
import Visibility from "@mui/icons-material/Visibility";     
import VisibilityOff from "@mui/icons-material/VisibilityOff"; 
import styles from './CustomField.module.scss';


type CustomFieldProps = {
  placeholder?: string;
  label?: string;
  size?:"small" | "medium";
  margin?:"none"|"dense"|"normal";
  fullWidth?:boolean;
  error?:boolean;
  errorMessage?:string;
  type:string;
  value:string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  borderColor?: string; 
  activeBorderColor?:string;
  className?: string;
  name?:string;
  errorMessageClassName?: string;
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
    borderColor='#D7D9DD',// default color
    activeBorderColor='#6F87F6',// default color
    className,
    errorMessageClassName,
}) => {
  const [focused, setFocused] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false); 
  const isPasswordField = type === "password";             

  return (
    <div style={{ position: "relative" }} className={className}>
      <TextField
        label=""
        variant="outlined"
        type={isPasswordField ? (showPassword ? "text" : "password") : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder?placeholder:""}
        size={size?size:"small"}
        margin={margin?margin:"normal"}
        fullWidth={fullWidth?true:false}
        error={error?true:false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
          // Eye icon for password fields only                 
         {...(isPasswordField
    ? {
        InputProps: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={() => setShowPassword((prev) => !prev)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }
    : {})}
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
            // Obsługa stanu error (nadpisuje custom kolory)
            '&.Mui-error fieldset': {
              borderColor: '#c7353c',
            },
          }
        }}
      />
      {!error && (focused || value) && label && (<span className={styles.helperText}>{label}</span>)}
      {error && <span className={`${styles.errorMessage} ${errorMessageClassName ?? ''}`}>{errorMessage ? errorMessage : "?????"}</span>}
    </div>
  );
};

export default CustomField;