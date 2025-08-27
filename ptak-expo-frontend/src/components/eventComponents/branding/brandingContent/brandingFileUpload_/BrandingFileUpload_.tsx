import React, { useCallback, useState, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../../../../contexts/AuthContext';
import { deleteBrandingFile, getBrandingFileUrl, uploadBrandingFile } from '../../../../../services/api';
import CustomTypography from '../../../../customTypography/CustomTypography';
import CustomButton from '../../../../customButton/CustomButton';
import styles from './BrandingFileUpload_.module.scss';





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

const BrandingFileUpload_: React.FC<BrandingFileUploadProps> = ({
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
    <Box>hello</Box>
   </Box>

    <Box className={styles.brandingCard}>
      <CustomTypography fontSize="0.875rem" fontWeight={500}>
        {title}
      </CustomTypography>
      <CustomTypography fontSize="0.75rem" color="#6c757d">
        {description}
        {dimensions && ` • Wymiary: ${dimensions}px`}
      </CustomTypography>
      
      {/* Upload Area */}
      <Box 
        className={`${styles.uploadArea} ${isDragOver ? styles.dragOver : ''} ${isUploading ? styles.uploading : ''}`}
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
            <CustomTypography fontSize="0.75rem" color="#6c757d">
              Przeciągnij i upuść, aby dodać plik
            </CustomTypography>
            <CustomButton
              bgColor="transparent"
              textColor="#6F87F6"
              width="auto"
              height="32px"
              fontSize="0.75rem"
              sx={{ border: '1px solid #6F87F6', mt: 1 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleButtonClick();
              }}
              disabled={isUploading}
            >
              Wgraj plik
            </CustomButton>
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

      {/* Preview Area */}
      <Box className={styles.previewArea}>
        <CustomTypography fontSize="0.75rem" fontWeight={500}>
          Podgląd:
        </CustomTypography>
        
        {existingFile ? (
          <Box className={styles.filePreview}>
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
              <Box className={styles.pdfPreview}>
                <CustomTypography fontSize="0.75rem" fontWeight={500}>
                  📄 {existingFile.originalName}
                </CustomTypography>
                <CustomTypography fontSize="0.6rem" color="#6c757d">
                  PDF • {formatFileSize(existingFile.fileSize)}
                </CustomTypography>
              </Box>
            )}
            
            <Box className={styles.fileInfo}>
              <CustomTypography fontSize="0.6rem" color="#6c757d">
                {existingFile.originalName} • {formatFileSize(existingFile.fileSize)}
              </CustomTypography>
            </Box>
            
            <Box className={styles.deleteButtonContainer}>
              <CustomButton
                variant="outlined"
                size="small"
                onClick={handleDeleteFile}
                disabled={isDeleting || isUploading}
                style={{
                  borderColor: '#dc3545',
                  color: '#dc3545',
                  fontSize: '0.7rem',
                  padding: '4px 12px',
                  minHeight: 'auto'
                }}
              >
                {isDeleting ? (
                  <>
                    <CircularProgress size={12} style={{ marginRight: 4, color: '#dc3545' }} />
                    Usuwanie...
                  </>
                ) : (
                  '🗑️ Usuń obrazek'
                )}
              </CustomButton>
            </Box>
          </Box>
        ) : (
          <CustomTypography fontSize="0.75rem" color="#6c757d">
            Brak wgranego pliku
          </CustomTypography>
        )}
      </Box>
    </Box>
    </>

  );
};

export default BrandingFileUpload_; 