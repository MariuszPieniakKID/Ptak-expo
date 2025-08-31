import React, { FC, useState } from "react";
import { TextField, MenuItem, InputAdornment, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

export type OptionType = {
  value: string | number;
  label: React.ReactNode;
};

type CustomSelectProps = {
  label?: string;
  placeholder?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
  value: string | number;
  onChange: (value: string) => void;
  options: OptionType[];
  error?: boolean;
  helperText?: string;
};

const CustomSelectMui: FC<CustomSelectProps> = ({
  label,
  placeholder,
  size = "small",
  fullWidth = true,
  value,
  onChange,
  options,
  error,
  helperText
}) => {
  const [open, setOpen] = useState(false);

  return (
    <TextField
      select
      label={label}
      fullWidth={fullWidth}
      size={size}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={!!error}
      helperText={error ? helperText : ""}
      SelectProps={{
        displayEmpty: !!placeholder,
        open: open,
        onOpen: () => setOpen(true),
        onClose: () => setOpen(false),
        IconComponent: () => null,  // Ukrywa domyślną ikonę MUI
        renderValue: (selected) => {
          if ((selected === "" || selected === null || selected === undefined) && placeholder) {
            return <span style={{ color: "#A7A7A7" }}>{placeholder}</span>;
          }
          const found = options.find((o) => o.value === selected);
          return found ? found.label : "";
        },
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              edge="end"
              size="small"
              tabIndex={-1}
              onClick={() => setOpen(!open)}
            >
              {open ? (
                <ExpandLessIcon sx={{ color: "#6f87f6" }} />
              ) : (
                <ExpandMoreIcon sx={{ color: "#6f87f6" }} />
              )}
            </IconButton>
          </InputAdornment>
        ),
      }}
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
      }}
    >
      {placeholder && (
        <MenuItem value="" disabled>
          {placeholder}
        </MenuItem>
      )}
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default CustomSelectMui;