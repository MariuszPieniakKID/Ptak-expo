import React, { useCallback, useState, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../../../../contexts/AuthContext';
import { BrandingFile, deleteBrandingFile, getBrandingFileUrl, uploadBrandingFile } from '../../../../../services/api';
import CustomTypography from '../../../../customTypography/CustomTypography';
//import CustomButton from '../../../../customButton/CustomButton';
import styles from './BrandingFileUpload.module.scss';

import { ReactComponent as GreenCiorcleIcon} from '../../../../../assets/greenCircleWithACheck.svg';
import { ReactComponent as GrayCircleIcon} from '../../../../../assets/grayDashedCircle.svg';
import { ReactComponent as MoreInfoIcon} from '../../../../../assets/moreInfoIcon.svg';
import { ReactComponent as ImgIcon} from '../../../../../assets/imgIcon.svg';
import { ReactComponent as WastebasketIcon } from "../../../../../assets/wastebasket.svg";

import { ReactComponent as ContractIcon } from "../../../../../assets/redPDF.svg";
import { ReactComponent as RedXIcon } from '../../../../../assets/redX.svg';
import { ReactComponent as BlackUploadIcon } from '../../../../../assets/blackUploadIcon.svg';
import CustomField from '../../../../customField/CustomField';

interface BrandingFileUploadProps {
  fileType: string;
  title: string;
  description: string;
  dimensions?: string | null;
  allowedFormats: string[];
  maxSize: number;
  exhibitorId?: number | null;
  exhibitionId: number;
  existingFile?: BrandingFile | BrandingFile[] | null;
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
  const [newPdfName,setNewPdfName]=useState('');

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

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
      console.log('❌ Invalid format:', fileExtension, 'allowed:', allowedFormats);
      return `Nieprawidłowy format pliku. Dozwolone formaty: ${allowedFormats.join(', ')}`;
    }

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
      resetFileInput();
      onUploadSuccess();
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      resetFileInput();
      onUploadError(error.message || 'Błąd podczas przesyłania pliku');
    } finally {
      setIsUploading(false);
    }
  }, [token, validateFile, exhibitorId, exhibitionId, fileType, onUploadSuccess, onUploadError, resetFileInput]);

  const handleMultipleFilesUpload = useCallback(async (files: FileList) => {
    if (!token) {
      onUploadError('Brak autoryzacji');
      return;
    }
    const list = Array.from(files);
    for (const f of list) {
      const validationError = validateFile(f);
      if (validationError) {
        onUploadError(validationError);
        return;
      }
    }
    setIsUploading(true);
    try {
      for (const f of list) {
        await uploadBrandingFile(f, exhibitorId ?? null, exhibitionId, fileType, token);
      }
      resetFileInput();
      onUploadSuccess();
    } catch (error: any) {
      resetFileInput();
      onUploadError(error.message || 'Błąd podczas przesyłania plików');
    } finally {
      setIsUploading(false);
    }
  }, [token, exhibitorId, exhibitionId, fileType, validateFile, onUploadSuccess, onUploadError, resetFileInput]);

  const handleDeleteFile = useCallback(async () => {
    if (!existingFile || !token) {
      console.error('❌ No file to delete or no token');
      return;
    }

    if (Array.isArray(existingFile)) return; // usuwanie per-element dla PDF poniżej
    console.log('🗑️ Starting file deletion:', (existingFile as BrandingFile).fileName);
    setIsDeleting(true);

    try {
      await deleteBrandingFile((existingFile as BrandingFile).id, exhibitorId ?? null, token);
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
      const isPdfType = allowedFormats.includes('pdf');
      if (isPdfType && files.length > 1) {
        void handleMultipleFilesUpload(files);
      } else {
        handleFileUpload(files[0]);
      }
    }
  }, [handleFileUpload, handleMultipleFilesUpload, allowedFormats]);

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
      const isPdfType = allowedFormats.includes('pdf');
      if (isPdfType && files.length > 1) {
        void handleMultipleFilesUpload(files);
      } else {
        console.log('📄 Selected file:', files[0].name, files[0].size, files[0].type);
        handleFileUpload(files[0]);
      }
    } else {
      console.log('❌ No files selected');
    }
  }, [handleFileUpload, handleMultipleFilesUpload, allowedFormats]);

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
    if (Array.isArray(existingFile)) return null;
    return getBrandingFileUrl(exhibitorId ?? null, (existingFile as BrandingFile).fileName, token);
  };

  const handleChangePdfName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPdfName(e.target.value);
  };

  const isPdfType = allowedFormats.includes('pdf');
  const isImage = !isPdfType && !Array.isArray(existingFile) && (existingFile as BrandingFile | undefined)?.mimeType?.startsWith('image/');
  const isPdf = isPdfType;
  const pdfFiles: BrandingFile[] = Array.isArray(existingFile)
    ? existingFile
    : (existingFile && isPdfType ? [existingFile as BrandingFile] : []);

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
          {description!=="Format: PDF" &&<Box className={styles.technicalInfoViewText}> {dimensions} px</Box>}
        </Box>
        {description==="Format: PDF" 
        ?<Box className={styles.pdfUploadBox}>
          <Box className={styles.changeFileName}>
            <CustomField 
              type={'text'}
              value={newPdfName}
              onChange={handleChangePdfName}   
              placeholder='Nazwa' 
              label="Nazwa dokumentu" 
              fullWidth   
            />
          </Box>
          <Box className={styles.actionUploadFile} 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={(e) => {
                      if (isUploading) {
                        e.preventDefault();
                        e.stopPropagation();
                        return; 
                      }
                      handleButtonClick();
              }}
            >
            <BlackUploadIcon className={styles.actionIcon} />
            <CustomTypography className={styles.actionLabel}>wgraj plik</CustomTypography>
          </Box>

        </Box>
        :
          <Box className={styles.uploadBox}>
          <Box 
            className={`${styles.uploadBoxIn} ${isDragOver ? styles.dragOver : ''} ${isUploading ? styles.uploading : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isUploading ? (
              <Box className={styles.uploadingContainer}>
                <CircularProgress size={32} />
                <CustomTypography fontSize="0.875rem" fontWeight={600} color="#6F87F6" sx={{ mt: 1 }}>
                  Przesyłanie pliku...
                </CustomTypography>
                {fileType === 'dokumenty_brandingowe' && (
                  <CustomTypography fontSize="0.7rem" color="#6c757d" sx={{ mt: 0.5, textAlign: 'center', maxWidth: '250px' }}>
                    Duże pliki PDF mogą potrwać do 30 sekund
                  </CustomTypography>
                )}
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
                      {(!Array.isArray(existingFile) && existingFile && (isImage || isPdf))
                        ? (existingFile as BrandingFile).originalName + " • " + formatFileSize((existingFile as BrandingFile)?.fileSize)
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
              multiple={isPdfType}
            />
          </Box>
          </Box>
        }
        {/* Ensure hidden file input exists also for PDF variant */}
        {description==="Format: PDF" && (
          <input 
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            accept={allowedFormats.map(format => `.${format}`).join(',')}
            disabled={isUploading}
            multiple={isPdfType}
          />
        )}
      </Box>
      <Box className={styles.showView}>
        <CustomTypography className={styles.viewLabel}>
          {isPdf? "Twoje pliki": "Podgląd"}
          </CustomTypography>
        {(isImage || isPdf)
        ? <Box className={styles.previewArea}>
            {(isImage || pdfFiles.length>0)
            ? (<Box className={styles.filePreview}>

              {(isDeleting
                ?  <CircularProgress size={48} style={{ margin: 'auto auto', color: '#6F87F6' }} />
                : <>
                    {isImage && (
                    <img 
                      src={getPreviewUrl() || ''} 
                      alt={(existingFile as BrandingFile).originalName}
                      className={styles.imagePreview}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}

                  {isPdf && (
                    <Box className={styles.pdfRow}>
                      <Box className={styles.chosenPlikWrapper}>
                        <Box className={styles.fileList}>
                            {pdfFiles.map(file => (
                              <Box key={file.id} className={styles.singleFile}>
                                <ContractIcon/>
                                <CustomTypography className={styles.viewPdfTitle}>{file.originalName}</CustomTypography>
                                <RedXIcon 
                                  onClick={async () => {
                                    if (!token) return;
                                    setIsDeleting(true);
                                    try {
                                      await deleteBrandingFile(file.id, exhibitorId ?? null, token);
                                      if (onDeleteSuccess) onDeleteSuccess();
                                    } catch (error: any) {
                                      onUploadError(error.message || 'Błąd podczas usuwania pliku');
                                    } finally {
                                      setIsDeleting(false);
                                    }
                                  }} 
                                  style={{ cursor: "pointer" }} 
                                />
                              </Box>
                            ))}
                        </Box>
                      </Box>
                    </Box>
                  )}
                </>  
              )} 
                  {(isDeleting || isUploading ||isPdf)
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
