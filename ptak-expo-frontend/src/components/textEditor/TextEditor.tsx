import React, { useCallback, useRef } from "react";
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
  legendBackground?: string;
  textAreaBackground?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({
  legend,
  placeholder = "",
  value,
  onChange,
  maxLength,
  showToolbar = true,
  legendBackground='white',
  textAreaBackground='white',
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (!maxLength || text.length <= maxLength) {
      onChange?.(text);
    }
  };

  const applyChangeWithCaret = useCallback((nextValue: string, caretStart: number, caretEnd?: number) => {
    if (maxLength && nextValue.length > maxLength) {
      return; // do not exceed limit
    }
    onChange?.(nextValue);
    // restore selection/caret after value updates
    window.requestAnimationFrame(() => {
      const el = textAreaRef.current;
      if (!el) return;
      try {
        el.focus();
        const end = typeof caretEnd === 'number' ? caretEnd : caretStart;
        el.setSelectionRange(caretStart, end);
      } catch {}
    });
  }, [maxLength, onChange]);

  const wrapSelection = useCallback((prefix: string, suffix: string) => {
    const el = textAreaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);

    // If already wrapped with same markers, unwrap
    const alreadyWrapped = selected.startsWith(prefix) && selected.endsWith(suffix);
    if (alreadyWrapped) {
      const inner = selected.slice(prefix.length, selected.length - suffix.length);
      const nextValue = before + inner + after;
      const newStart = start;
      const newEnd = start + inner.length;
      applyChangeWithCaret(nextValue, newStart, newEnd);
      return;
    }

    const nextValue = before + prefix + selected + suffix + after;
    const newStart = start + prefix.length;
    const newEnd = newStart + selected.length;
    applyChangeWithCaret(nextValue, newStart, newEnd);
  }, [value, applyChangeWithCaret]);

  const insertAtCursor = useCallback((text: string) => {
    const el = textAreaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const nextValue = before + text + after;
    const caret = start + text.length;
    applyChangeWithCaret(nextValue, caret);
  }, [value, applyChangeWithCaret]);

  const handleBold = useCallback(() => {
    wrapSelection("**", "**");
  }, [wrapSelection]);

  const handleItalic = useCallback(() => {
    wrapSelection("_", "_");
  }, [wrapSelection]);

  const handleEmoji = useCallback(() => {
    insertAtCursor("🙂");
  }, [insertAtCursor]);

  const handleLink = useCallback(() => {
    const el = textAreaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.slice(start, end) || "link";
    const url = window.prompt("Wklej URL dla linku:", "https://");
    if (!url) return;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const insertion = `[${selected}](${url})`;
    const nextValue = before + insertion + after;
    const caretStart = before.length + 1; // after opening [
    const caretEnd = caretStart + selected.length;
    applyChangeWithCaret(nextValue, caretStart, caretEnd);
  }, [value, applyChangeWithCaret]);

  return (
    <Box 
    className={styles.textAreaWrapper}
     style={{ background: textAreaBackground }}
     >
      <legend 
      className={styles.legend}
      style={{ background: legendBackground }}
      >{legend}</legend>
      <TextField
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        fullWidth
        multiline
        minRows={3}
        variant="outlined"
        inputRef={textAreaRef}
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
            <IconButton size="small" onClick={handleBold}>
              <BoldIconFormat className={styles.icon} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Kursywa">
            <IconButton size="small" onClick={handleItalic}>
              <ItalicIconFormat className={styles.icon} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Emotikona">
            <IconButton size="small" onClick={handleEmoji}>
              <img
                src={emotionIcon}
                alt="Emotikona"
                className={styles.iconImage}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Dodaj link">
            <IconButton size="small" onClick={handleLink}>
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