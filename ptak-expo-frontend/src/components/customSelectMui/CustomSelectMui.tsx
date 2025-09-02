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
<<<<<<< HEAD
  value: string | number;
  onChange: (value: string) => void;
  options: OptionType[];
  error?: boolean;
  helperText?: string;
=======
  value: string | number | Array<string | number>;
  onChange: (value: string | number | Array<string | number>) => void;
  options: OptionType[];
  error?: boolean;
  helperText?: string;
  multiple?: boolean;
>>>>>>> origin/frontend-admin-panel-cd-events-details
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
<<<<<<< HEAD
  helperText
}) => {
  const [open, setOpen] = useState(false);

=======
  helperText,
  multiple = false,
}) => {
  const [open, setOpen] = useState(false);


  // const renderSelectValue = (selected: unknown) => {
  //   if (
  //     (selected === "" ||
  //       selected === null ||
  //       selected === undefined ||
  //       (Array.isArray(selected) && selected.length === 0)) &&
  //     placeholder
  //   ) {
  //     return <span style={{ color: "#A7A7A7" }}>{placeholder}</span>;
  //   }
  //   if (Array.isArray(selected)) {
  //     const labels = options
  //       .filter((o) => selected.includes(o.value))
  //       .map((o) => o.label);
  //     return labels.length > 0 ? labels.join(", ") : "";
  //   }
  //   if (typeof selected === "string" || typeof selected === "number") {
  //     const found = options.find((o) => o.value === selected);
  //     return found ? found.label : "";
  //   }
  //   return ""; // fallback
  // };
  const renderSelectValue = (selected: unknown) => {
  if (
    (selected === "" ||
      selected === null ||
      selected === undefined ||
      (Array.isArray(selected) && selected.length === 0)) &&
    placeholder
  ) {
    return <span style={{ color: "#A7A7A7" }}>{placeholder}</span>;
  }
  if (Array.isArray(selected)) {
    const labels = options
      .filter((o) => selected.includes(o.value))
      .map((o) => o.label);

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "4px",
          maxHeight: 60,
          overflowY: "auto",
          paddingRight: 4,
        }}
      >
        {labels.map((label, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "#dde5ff",
              borderRadius: 12,
              padding: "2px 8px",
              fontSize: "0.85rem",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
            title={typeof label === "string" ? label : undefined}
          >
            {label}
          </div>
        ))}
      </div>
    );
  }
  if (typeof selected === "string" || typeof selected === "number") {
    const found = options.find((o) => o.value === selected);
    return found ? found.label : "";
  }
  return "";
};

  // Obsługa zmiany wyboru przy multi i single
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedValue = e.target.value;
    if (multiple) {
      // e.target.value jest string, należy przekonwertować na tablicę
      // W MUI przy multi select e.target.value jest tablicą lub stringiem z joinem
      // Dlatego wymuszamy typowanie na tablicę
      onChange(selectedValue as unknown as Array<string | number>);
    } else {
      onChange(selectedValue);
    }
  };

>>>>>>> origin/frontend-admin-panel-cd-events-details
  return (
    <TextField
      select
      label={label}
      fullWidth={fullWidth}
      size={size}
      value={value}
<<<<<<< HEAD
      onChange={(e) => onChange(e.target.value)}
      error={!!error}
      helperText={error ? helperText : ""}
      SelectProps={{
=======
      onChange={handleChange}
      error={!!error}
      helperText={error ? helperText : ""}
      SelectProps={{
        multiple,
>>>>>>> origin/frontend-admin-panel-cd-events-details
        displayEmpty: !!placeholder,
        open: open,
        onOpen: () => setOpen(true),
        onClose: () => setOpen(false),
<<<<<<< HEAD
        IconComponent: () => null,  // Ukrywa domyślną ikonę MUI
        renderValue: (selected) => {
          if ((selected === "" || selected === null || selected === undefined) && placeholder) {
            return <span style={{ color: "#A7A7A7" }}>{placeholder}</span>;
          }
          const found = options.find((o) => o.value === selected);
          return found ? found.label : "";
        },
=======
        IconComponent: () => null, // Ukrywa domyślną ikonę MUI
        renderValue: renderSelectValue,
>>>>>>> origin/frontend-admin-panel-cd-events-details
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
<<<<<<< HEAD
      {placeholder && (
=======
      {placeholder && !multiple && (
>>>>>>> origin/frontend-admin-panel-cd-events-details
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