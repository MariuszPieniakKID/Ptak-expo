import { useRef, useState } from "react";
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material";
import styles from "./UploadDocuments.module.scss";
import { ReactComponent as InvoicesIcon } from '../../../assets/redPDF.svg';
import { ReactComponent as ContractsIcon } from '../../../assets/blue-f_Vat.svg';
import { ReactComponent as RedXIcon } from '../../../assets/redX.svg';
import { ReactComponent as BlackUploadIcon } from '../../../assets/blackUploadIcon.svg';
import { ReactComponent as BlueCircleSaveIcon } from '../../../assets/submitIconBlueCircleWithCheckMark.svg';
import CustomTypography from "../../customTypography/CustomTypography";

interface SelectedFileEntry {
  file: File;
  type: string; // invoices | contracts | other
}

interface UploadDocumentsProps {
  onSubmit: (files: SelectedFileEntry[]) => void; 
}

function UploadDocuments({ onSubmit }: UploadDocumentsProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileEntry[]>([]);
  const [docType, setDocType] = useState<string>("invoices");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles: SelectedFileEntry[] = Array.from(event.target.files).map(file => ({
        file,
        type: docType
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const renderFileIcon = (type: string) => {
    switch (type) {
      case "invoices": return <InvoicesIcon />;
      case "contracts": return <ContractsIcon />;
      default: return null;
    }
  };

  const handleSaveFiles = () => {
    onSubmit(selectedFiles);
  };

  return (
    <Box className={styles.uploadMaterialcContainer}>
      {/* Wybór rodzaju dokumentu */}
      <Box className={styles.documentType}>
        <FormControl className={styles.formControl}>
          <FormLabel className={styles.formLabel}>Wybierz rodzaj dokumentu</FormLabel>
          <RadioGroup
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className={styles.radioGroup}
          >
            <FormControlLabel value="invoices" control={<Radio />} label="Faktury"    
            sx={{
                color: '#2E2E38',
                '& .MuiFormControlLabel-label': {
                fontSize: '13px', 
                },
            }}/>
            <FormControlLabel value="contracts" control={<Radio />} label="Umowy"  sx={{
                color: '#2E2E38',
                '& .MuiFormControlLabel-label': {
                fontSize: '13px', 
                },
            }}/>
            <FormControlLabel value="other" control={<Radio />} label="Inne dokumenty"  sx={{
                color: '#2E2E38',
                '& .MuiFormControlLabel-label': {
                fontSize: '13px', 
                },
            }}/>
          </RadioGroup>
        </FormControl>
      </Box>

      {/* Lista wybranych plików */}
      <Box className={styles.chosenPlikWrapper}>
        {selectedFiles.length === 0 ? (
          <CustomTypography className={styles.noFileChosen}>Brak wybranych plików</CustomTypography>
        ) : (
          <Box className={styles.fileList}>
            {selectedFiles.map((entry, index) => (
              <Box key={index} className={styles.singleFile}>
                {renderFileIcon(entry.type)}
                <CustomTypography>{entry.file.name}</CustomTypography>
                <RedXIcon onClick={() => handleRemoveFile(index)} style={{ cursor: "pointer" }} />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Akcje */}
      <Box className={styles.actionWrapper}>
        {/* Ukryty input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          multiple
          onChange={handleFileSelect}
        />

        <Box className={styles.actionUploadFile} onClick={() => fileInputRef.current?.click()}>
          <BlackUploadIcon className={styles.actionIcon} />
          <CustomTypography className={styles.actionLabel}>wgraj plik/i</CustomTypography>
        </Box>

        <Box className={styles.actionSaveFile} onClick={handleSaveFiles}>
          <CustomTypography className={styles.actionLabel}>zapisz</CustomTypography>
          <BlueCircleSaveIcon className={styles.actionIcon} />
        </Box>
      </Box>
    </Box>
  );
}

export default UploadDocuments;
export type { SelectedFileEntry }; 