import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Box, Tooltip, IconButton } from "@mui/material";
import styles from "./TextEditor.module.scss";

// Ikony do paska narzędzi
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
  const editorRef = useRef<HTMLDivElement | null>(null);

  const setHtmlValue = useCallback((html: string) => {
    onChange?.(html);
  }, [onChange]);

  // Keep editor HTML in sync when parent value changes externally
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== (value || '')) {
      el.innerHTML = value || '';
    }
  }, [value]);

  // Helpers to execute formatting commands within the contentEditable
  const focusEditor = () => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
  };

  const handleBold = useCallback(() => {
    focusEditor();
    document.execCommand('bold');
    setHtmlValue(editorRef.current?.innerHTML || '');
  }, [setHtmlValue]);

  const handleItalic = useCallback(() => {
    focusEditor();
    document.execCommand('italic');
    setHtmlValue(editorRef.current?.innerHTML || '');
  }, [setHtmlValue]);

  const handleUnderline = useCallback(() => {
    focusEditor();
    document.execCommand('underline');
    setHtmlValue(editorRef.current?.innerHTML || '');
  }, [setHtmlValue]);

  const plainTextLength = useMemo(() => {
    try {
      const el = document.createElement('div');
      el.innerHTML = value || '';
      return (el.innerText || '').length;
    } catch {
      return (value || '').length;
    }
  }, [value]);

  return (
    <Box 
    className={styles.textAreaWrapper}
     style={{ background: textAreaBackground }}
     >
      <legend 
      className={styles.legend}
      style={{ background: legendBackground }}
      >{legend}</legend>
      <Box
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-label={legend}
        suppressContentEditableWarning
        onInput={() => setHtmlValue(editorRef.current?.innerHTML || '')}
        sx={{
          width: '100%',
          minHeight: '4.5em',
          outline: 'none',
          padding: '8px 12px',
          borderRadius: '6px',
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
          <Tooltip title="Podkreślenie">
            <IconButton size="small" onClick={handleUnderline}>
              <span className={styles.icon} style={{ textDecoration: 'underline', display: 'inline-block' }}>U</span>
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* licznik znaków */}
      {maxLength && (
        <Box className={styles.charCounter}>
          {plainTextLength}/{maxLength}
        </Box>
      )}
    </Box>
  );
};

export default TextEditor;