import React, { useCallback, useState, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../../../../contexts/AuthContext';
import { deleteBrandingFile, getBrandingFileUrl, uploadBrandingFile } from '../../../../../services/api';
import CustomTypography from '../../../../customTypography/CustomTypography';
//import CustomButton from '../../../../customButton/CustomButton';
import styles from './BrandingFileUpload.module.scss';

import { ReactComponent as GreenCiorcleIcon} from '../../../../../assets/greenCircleWithACheck.svg';
import { ReactComponent as GrayCircleIcon} from '../../../../../assets/grayDashedCircle.svg';
import { ReactComponent as MoreInfoIcon} from '../../../../../assets/moreInfoIcon.svg';
import { ReactComponent as ImgIcon} from '../../../../../assets/imgIcon.svg';
import { ReactComponent as WastebasketIcon } from "../../../../../assets/wastebasket.svg";



interface BrandingFileUploadProps {
  fileType: string;
  title: string;
  description: string;
  dimensions?: string | null;
  allowedFormats: string[];
  maxSize: number;
  exhibitorId?: number | null;
  exhibitionId: number;
  existingFile?: {
    id: number;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
  } | null;
  onUploadSuccess: () => void;
  onUploadError: (error: string) => void;
  onDeleteSuccess?: () => void;
}

const BrandingFileUpload: React.FC<BrandingFileUploadProps> = ({
  fileType,
  title,
  description,
  dimensions,
  allowedFormats,
  maxSize,
  exhibitorId,
  exhibitionId,
  existingFile,
  onUploadSuccess,
  onUploadError,
  onDeleteSuccess
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = useCallback((file: File): string | null => {
    console.log('🔍 Validating file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      allowedFormats,
      maxSize
    });

    // Check file format
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
      console.log('❌ Invalid format:', fileExtension, 'allowed:', allowedFormats);
      return `Nieprawidłowy format pliku. Dozwolone formaty: ${allowedFormats.join(', ')}`;
    }

    // Check file size
    if (file.size > maxSize) {
      console.log('❌ File too large:', file.size, 'max:', maxSize);
      return `Plik jest za duży. Maksymalny rozmiar: ${formatFileSize(maxSize)}`;
    }

    console.log('✅ File validation passed');
    return null;
  }, [allowedFormats, maxSize]);

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      console.log('🔄 Input value reset');
    }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    console.log('🔄 Starting file upload:', file.name, file.size, file.type);
    console.log('📋 Upload parameters:', {
      exhibitorId,
      exhibitionId,
      fileType,
      hasToken: !!token,
              note: exhibitorId ? 'Using exhibitor-specific branding' : 'Using global event branding'
    });
    
    if (!token) {
      console.error('❌ No token available');
      onUploadError('Brak autoryzacji');
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      console.error('❌ Validation error:', validationError);
      onUploadError(validationError);
      return;
    }

    console.log('✅ File validation passed, starting upload...');
    setIsUploading(true);

    try {
      console.log('📤 Calling uploadBrandingFile API...');
      await uploadBrandingFile(file, exhibitorId ?? null, exhibitionId, fileType, token);
      console.log('✅ Upload successful!');
      resetFileInput(); // Reset input after successful upload
      onUploadSuccess();
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      resetFileInput(); // Reset input also on error to allow retry
      onUploadError(error.message || 'Błąd podczas przesyłania pliku');
    } finally {
      setIsUploading(false);
    }
  }, [token, validateFile, exhibitorId, exhibitionId, fileType, onUploadSuccess, onUploadError, resetFileInput]);

  const handleDeleteFile = useCallback(async () => {
    if (!existingFile || !token) {
      console.error('❌ No file to delete or no token');
      return;
    }

    console.log('🗑️ Starting file deletion:', existingFile.fileName);
    setIsDeleting(true);

    try {
      await deleteBrandingFile(existingFile.id, exhibitorId ?? null, token);
      console.log('✅ File deleted successfully');
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      onUploadError(error.message || 'Błąd podczas usuwania pliku');
    } finally {
      setIsDeleting(false);
    }
  }, [existingFile, token, exhibitorId, onDeleteSuccess, onUploadError]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

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
    console.log('📁 File select triggered, files:', files?.length || 0);
    
    if (files && files.length > 0) {
      console.log('📄 Selected file:', files[0].name, files[0].size, files[0].type);
      handleFileUpload(files[0]);
    } else {
      console.log('❌ No files selected');
    }
  }, [handleFileUpload]);

  const handleButtonClick = useCallback(() => {
    console.log('🖱️ Button clicked, opening file dialog');
    if (fileInputRef.current) {
      fileInputRef.current.click();
      console.log('📂 File input clicked');
    } else {
      console.error('❌ File input ref not available');
    }
  }, []);

  const getPreviewUrl = (): string | null => {
    if (!existingFile || !token) return null;
    return getBrandingFileUrl(exhibitorId ?? null, existingFile.fileName, token);
  };

  const isImage = existingFile?.mimeType?.startsWith('image/');
  const isPdf = existingFile?.mimeType === 'application/pdf';

  return (
   <>
   <Box className={styles.brandingContainer}>
    <Box className={styles.titleWithUpload}>
      <Box className={styles.titleInLine}>
        <Box className={styles.iconBox}>
          {(isImage||isPdf)
          ?<GreenCiorcleIcon className={styles.icon} />
          :<GrayCircleIcon className={styles.iconGray}/>
         }
        </Box>
        <CustomTypography className={styles.titleUpload}>{title}</CustomTypography>
         <Box className={styles.iconBox}>
          <MoreInfoIcon 
          className={styles.moreInfoIcon}
          onClick={()=>console.log(`Please add more info about: ${title} event.`)}
          />
        </Box>
      </Box>
      <Box className={styles.technicalInfoView}>
        <Box className={styles.technicalInfoViewText}> {description}</Box>
        <Box className={styles.technicalInfoViewText}> {dimensions} px</Box>
      </Box>
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
              <CustomTypography fontSize="0.75rem" color="#6c757d">
                Przesyłanie pliku...
              </CustomTypography>
            </Box>
          ) : (
            <>
            <Box
                className={styles.uploadBox}
                onClick={(e) => {
                  if (isUploading) {
                    e.preventDefault();
                    e.stopPropagation();
                    return; 
                  }
                  handleButtonClick();
                }}
                sx={{
                  ...(isUploading ? {
                    pointerEvents: "none",
                    opacity: 0.6,
                    cursor: "not-allowed",
                  } : {}),
                }}
              >
                 <Box className={styles.iconCircle}><ImgIcon/></Box>
                <CustomTypography className={styles.infoInUploadBox}>
                  {existingFile && (isImage || isPdf)
                    ? existingFile.originalName + " • " + formatFileSize(existingFile?.fileSize)
                    : "Przeciągnij i upuść, aby dodać plik"}
                </CustomTypography>
            </Box>
             
            </>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedFormats.map(format => `.${format}`).join(',')}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={isUploading}
          />
        </Box>
      </Box>
    </Box>
    <Box className={styles.showView}>
      <CustomTypography className={styles.viewLabel}>
        {isPdf? "Twoje pliki": "Podgląd"}
        </CustomTypography>
      {(isImage || isPdf)
      ? <Box className={styles.previewArea}>
          {existingFile 
          ? (<Box className={styles.filePreview}>

             {(isDeleting
              ?  <CircularProgress size={48} style={{ margin: 'auto auto', color: '#6F87F6' }} />
              : <>
                  {isImage && (
                  <img 
                    src={getPreviewUrl() || ''} 
                    alt={existingFile.originalName}
                    className={styles.imagePreview}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}

                {isPdf && (
                  <Box className={styles.pdfRow}>

                  </Box>
                // <Box className={styles.pdfPreview}>
                //   <CustomTypography fontSize="0.75rem" fontWeight={500}>
                //     📄 {existingFile.originalName}
                //   </CustomTypography>
                //   <CustomTypography fontSize="0.6rem" color="#6c757d">
                //     PDF • {formatFileSize(existingFile.fileSize)}
                //   </CustomTypography>
                // </Box>
                )}
               </>  
             )} 
                {(isDeleting || isUploading)
                ? null
                : <Box
                  className={styles.actionButton}
                  onClick={handleDeleteFile}
                  >
                    <WastebasketIcon className={styles.actionIcon} />
                    <CustomTypography className={styles.actionLabel}>
                      Usuń
                    </CustomTypography>
                  </Box>}

            </Box>) 
          : 
          (<CustomTypography fontSize="0.75rem" color="#6c757d">{null}</CustomTypography>)
          }
        </Box>
      :null
      }
    </Box>
   </Box>
    </>
  );
};

export default BrandingFileUpload; 