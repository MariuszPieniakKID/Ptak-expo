import React from "react";
import { Box, TextField, Tooltip, IconButton } from "@mui/material";
import styles from "./TextEditor.module.scss";

// Ikony do paska narzędzi
import emotionIcon from "../../assets/EmotionIcon_m (1).png";
import { ReactComponent as LinkIcon } from "../../assets/chainIcon.svg";
import { ReactComponent as ItalicIconFormat } from "../../assets/I.svg";
import { ReactComponent as BoldIconFormat } from "../../assets/B.svg";

interface TextEditorProps {
  legend: string;
  placeholder?: string;
  value: string;
  onChange?: (value: string) => void;
  maxLength?: number;
  showToolbar?: boolean; // flaga - można wyłączyć pasek gdy niepotrzebny
}

const TextEditor: React.FC<TextEditorProps> = ({
  legend,
  placeholder = "",
  value,
  onChange,
  maxLength,
  showToolbar = true,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (!maxLength || text.length <= maxLength) {
      onChange?.(text);
    }
  };

  return (
    <Box className={styles.textAreaWrapper}>
      <legend className={styles.legend}>{legend}</legend>
      <TextField
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        fullWidth
        multiline
        minRows={3}
        variant="outlined"
        sx={{
          width: "100%",
          "& .MuiOutlinedInput-notchedOutline": {
            border: "none",
          },
        }}
      />

      {/* Pasek narzędzi */}
      {showToolbar && (
        <Box className={styles.toolbar}>
          <Tooltip title="Pogrubienie">
            <IconButton size="small">
              <BoldIconFormat className={styles.icon} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Kursywa">
            <IconButton size="small">
              <ItalicIconFormat className={styles.icon} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Emotikona">
            <IconButton size="small">
              <img
                src={emotionIcon}
                alt="Emotikona"
                className={styles.iconImage}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Dodaj link">
            <IconButton size="small">
              <LinkIcon className={styles.icon} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* licznik znaków */}
      {maxLength && (
        <Box className={styles.charCounter}>
          {value.length}/{maxLength}
        </Box>
      )}
    </Box>
  );
};

export default TextEditor;