import React, { useRef, useState, useCallback } from 'react';
import { Box, CircularProgress } from '@mui/material';


import { ReactComponent as ImgIcon } from '../../../../../assets/imgIcon.svg';
import styles from './BrandingFileUpload.module.scss';
import CustomTypography from '../customTypography/CustomTypography';
import ComponentWithAction from '../componentWithAction/ComponentWithAction';
import ComponentWithDocument from '../componentWithDocument/ComponentWithDocument';

interface UploadingBoxProps {
  allowedFormats: string[];
  maxSize?: number;
  isUploading: boolean;
  file?: {
    url: string;
    name: string;
    size: number;
    mimeType: string;
  } | null;
  onUpload: (file: File) => void;
  onDelete: () => void;
}

const UploadingBox: React.FC<UploadingBoxProps> = ({
  allowedFormats,  isUploading, file, onUpload, onDelete
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onUpload(files[0]);
    }
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files[0]);
    }
  }, [onUpload]);

  const handleButtonClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const isImage = file?.mimeType?.startsWith('image/');
  const isPdf = file?.mimeType === 'application/pdf';
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box className={styles.uploadBox}>
      <Box
        className={`${styles.uploadBoxIn} ${isDragOver ? styles.dragOver : ''} ${isUploading ? styles.uploading : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isUploading ? (
          <Box className={styles.uploadingContainer}>
            <CircularProgress size={24} />
            <CustomTypography fontSize="0.75rem" color="#6c757d">Przesyłanie pliku...</CustomTypography>
          </Box>
        ) : (
          <>
            <Box
              className={styles.uploadBox}
              onClick={handleButtonClick}
              sx={isUploading ? { pointerEvents: "none", opacity: 0.6, cursor: "not-allowed" } : {}}
            >
              <Box className={styles.iconCircle}><ImgIcon /></Box>
              <CustomTypography className={styles.infoInUploadBox}>
                {file && (isImage || isPdf)
                  ? file.name + " • " + formatFileSize(file.size)
                  : "Przeciągnij i upuść, aby dodać plik"}
              </CustomTypography>
            </Box>
          </>
        )}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept={allowedFormats.map(format => `.${format}`).join(',')}
          disabled={isUploading}
        />
      </Box>
      <Box className={styles.showView}>
        <CustomTypography className={styles.viewLabel}>{isPdf ? "Twoje pliki" : "Podgląd"}</CustomTypography>
        {(isImage || isPdf) && (
          <Box className={styles.previewArea}>
            <Box className={styles.filePreview}>
              {isImage && file?.url && (
                <img
                  src={file.url}
                  alt={file.name}
                  className={styles.imagePreview}
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              )}
              {isPdf && file?.name && (
                <Box className={styles.pdfRow}>
                  <Box className={styles.chosenPlikWrapper}>
                    <Box className={styles.fileList}>
                      <Box className={styles.singleFile}>
                        <ComponentWithDocument 
                        documentType={'pdf'} 
                        handleDelete={onDelete} 
                        documentName={file.name} 
                        deleteIcon={'cross'}/>
                        </Box>
                    </Box>
                  </Box>
                </Box>
              )}
              {(isUploading || isPdf) ? null : (
                <ComponentWithAction 
                iconType={'delete'} 
                handleAction={ onDelete} 
                buttonTitle={'usuń'}/>
                // <Box
                //   className={styles.actionButton}
                //   onClick={onDelete}
                // >
                //   <WastebasketIcon className={styles.actionIcon} />
                //   <CustomTypography className={styles.actionLabel}>Usuń</CustomTypography>
                // </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default UploadingBox;
