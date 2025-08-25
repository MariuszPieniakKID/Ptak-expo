import React, { FC } from "react";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
//import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import styles from "./CustomSelect.module.scss";

export type OptionType = {
  value: string | number;
  label: React.ReactNode;
  description?: React.ReactNode;
  [key: string]: any;
};

type CustomSelectProps = {
  label?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: SelectChangeEvent<string | number>) => void;
  options: OptionType[];
  size?: "small" | "medium";
  fullWidth?: boolean;
  error?: boolean;
  errorMessage?: string;
  errorMessageClassName?: string;
  className?: string;
  name?: string;
};

const CustomSelect: FC<CustomSelectProps> = ({
  label,
  placeholder,
  value,
  onChange,
  options,
  size = "small",
  fullWidth = true,
  error,
  errorMessage,
  errorMessageClassName,
  className,
  name,
}) => {
  const isPlaceholder = !value && !!placeholder;

  return (
    <div style={{ position: "relative" }} className={className}>
      <Select
        value={value}
        onChange={onChange as any}
        displayEmpty
        {...(name ? { name } : {})}
        size={size}
        fullWidth={fullWidth}
        error={!!error}
        IconComponent={(props) => (
          <IconButton
            edge="end"
            disableRipple
            {...props}
            size={size}
            className={styles.selectIcon}
          >
            {props.className?.includes("MuiSelect-iconOpen") ? (
              <ExpandLessIcon sx={{ color: "#6f87f6" }} />
            ) : (
              <ExpandMoreIcon sx={{ color: "#6f87f6" }} />
            )}
          </IconButton>
        )}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "20px",
            "& fieldset": {
              borderColor: "#D7D9DD",
            },
            "&:hover fieldset": {
              borderColor: "#6F87F6",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#6F87F6",
            },
            "&.Mui-error fieldset": {
              borderColor: "#c7353c",
            },
          },
          "& .MuiSelect-select": {
            color: isPlaceholder ? "#A7A7A7" : "inherit",
          },
        }}
        renderValue={(selected) => {
          if (isPlaceholder) {
            return <span style={{ color: "#A7A7A7" }}>{placeholder}</span>;
          }
          const found = options.find((opt) => String(opt.value) === String(selected));
          return found ? found.label : placeholder;
        }}
      >
        {options.map((option, index) => (
          <MenuItem key={index} value={option.value}>
            <div>
              {option.label}
              {option.description && (
                <div className={styles.dropdownDescription}>{option.description}</div>
              )}
            </div>
          </MenuItem>
        ))}
      </Select>

      {/* Helper-text zamiast labela */}
      <span className={styles.helperText}>
        {!error && label ? label : "\u00A0"}
      </span>

      {error && (
        <span className={`${styles.errorMessage} ${errorMessageClassName ?? ""}`}>
          {errorMessage ?? "Błąd"}
        </span>
      )}
    </div>
  );
};

export default CustomSelect;