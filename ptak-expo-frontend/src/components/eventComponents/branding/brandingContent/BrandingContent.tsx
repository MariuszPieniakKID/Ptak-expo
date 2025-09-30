import React, { useCallback, useEffect, useState } from 'react';
import { Box, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../../../../contexts/AuthContext';
import { Exhibition, getBrandingFiles, BrandingFilesResponse } from '../../../../services/api';
import styles from './BrandingContent.module.scss';
import BrandingFileUpload from './brandingFileUpload/BrandingFileUpload';
import CustomTypography from '../../../customTypography/CustomTypography';
import { ReactComponent as BlueCircleSaveIcon } from '../../../../assets/submitIconBlueCircleWithCheckMark.svg';
interface BrandingContentProps {
  event: Exhibition;
}

const BrandingContent: React.FC<BrandingContentProps> = ({ event }) => {
  const { user, token, logout } = useAuth();
  const [brandingFiles, setBrandingFiles] = useState<BrandingFilesResponse | null>(null);
  const [brandingLoading, setBrandingLoading] = useState<boolean>(false);
  const [brandingError, setBrandingError] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const loadBrandingFiles = useCallback(async (exhibitorId: number | null, exhibitionId: number) => {
    if (!token) {
      setBrandingError('Brak autoryzacji - zaloguj się ponownie');
      return;
    }

    setBrandingLoading(true);
    setBrandingError('');

    try {
      const files = await getBrandingFiles(exhibitorId, exhibitionId, token);
      setBrandingFiles(files);
    } catch (error: any) {
      setBrandingError(error.message || 'Błąd podczas ładowania plików');
      if (error.message?.includes('401')) {
        logout();
      }
    } finally {
      setBrandingLoading(false);
    }
  }, [token, logout]);

  const handleUploadSuccess = useCallback(async (exhibitorId: number | null) => {
    if (event && token) {
      await loadBrandingFiles(exhibitorId, event.id);
      setRefreshKey(prev => prev + 1);
    }
  }, [event, token, loadBrandingFiles]);

  const handleUploadError = useCallback((error: string) => {
    setBrandingError(error);
  }, []);

  useEffect(() => {
    if (event && token) {
      loadBrandingFiles(null, event.id);
    }
  }, [event, token, loadBrandingFiles]);

  return (
    <Box className={styles.tabContent}>

      {brandingError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {brandingError}
        </Alert>
      )}

      {brandingLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box className={styles.brandingSection} key={refreshKey}>
          {event && brandingFiles && user && (
            <BrandingFileUpload
              fileType="kolorowe_tlo_logo_wydarzenia"
              title="Kolorowe tło z logiem wydarzenia (E-Identyfikator wystawcy)"
              description="Format: png, jpg, webp"
              dimensions="305x106"
              allowedFormats={['png', 'jpg', 'jpeg', 'webp']}
              maxSize={5 * 1024 * 1024}
              exhibitorId={null}
              exhibitionId={event.id}
              existingFile={(Array.isArray(brandingFiles.files['kolorowe_tlo_logo_wydarzenia'])
                ? (brandingFiles.files['kolorowe_tlo_logo_wydarzenia'] as any[])[0]
                : brandingFiles.files['kolorowe_tlo_logo_wydarzenia']) || null}
              onUploadSuccess={() => handleUploadSuccess(null)}
              onUploadError={handleUploadError}
              onDeleteSuccess={() => handleUploadSuccess(null)}
            />
          )}

          {event && brandingFiles && user && (
            <BrandingFileUpload
              fileType="tlo_wydarzenia_logo_zaproszenia"
              title="Tło wydarzenia z logiem (E-zaproszenia)"
              description="Format: png, svg, webp"
              dimensions="152x106"
              allowedFormats={['png', 'svg', 'webp']}
              maxSize={5 * 1024 * 1024}
              exhibitorId={null}
              exhibitionId={event.id}
              existingFile={(Array.isArray(brandingFiles.files['tlo_wydarzenia_logo_zaproszenia'])
                ? (brandingFiles.files['tlo_wydarzenia_logo_zaproszenia'] as any[])[0]
                : brandingFiles.files['tlo_wydarzenia_logo_zaproszenia']) || null}
              onUploadSuccess={() => handleUploadSuccess(null)}
              onUploadError={handleUploadError}
              onDeleteSuccess={() => handleUploadSuccess(null)}
            />
          )}

          {event && brandingFiles && user && (
            <BrandingFileUpload
              fileType="biale_logo_identyfikator"
              title="Białe Logo (E-Identyfikator)"
              description="Format: png, svg, webp"
              dimensions="104x34"
              allowedFormats={['png', 'svg', 'webp']}
              maxSize={5 * 1024 * 1024}
              exhibitorId={null}
              exhibitionId={event.id}
              existingFile={(Array.isArray(brandingFiles.files['biale_logo_identyfikator'])
                ? (brandingFiles.files['biale_logo_identyfikator'] as any[])[0]
                : brandingFiles.files['biale_logo_identyfikator']) || null}
              onUploadSuccess={() => handleUploadSuccess(null)}
              onUploadError={handleUploadError}
              onDeleteSuccess={() => handleUploadSuccess(null)}
            />
          )}

          {event && brandingFiles && user && (
            <BrandingFileUpload
              fileType="banner_wystawcy_800"
              title="Banner dla wystawcy z miejscem na logo"
              description="Format: png, jpg, webp"
              dimensions="800x800"
              allowedFormats={['png', 'jpg', 'jpeg', 'webp']}
              maxSize={10 * 1024 * 1024}
              exhibitorId={null}
              exhibitionId={event.id}
              existingFile={(Array.isArray(brandingFiles.files['banner_wystawcy_800'])
                ? (brandingFiles.files['banner_wystawcy_800'] as any[])[0]
                : brandingFiles.files['banner_wystawcy_800']) || null}
              onUploadSuccess={() => handleUploadSuccess(null)}
              onUploadError={handleUploadError}
              onDeleteSuccess={() => handleUploadSuccess(null)}
            />
          )}

          {event && brandingFiles && user && (
            <BrandingFileUpload
              fileType="banner_wystawcy_1200"
              title="Banner dla wystawcy z miejscem na logo (duży)"
              description="Format: png, jpg, webp"
              dimensions="1200x1200"
              allowedFormats={['png', 'jpg', 'jpeg', 'webp']}
              maxSize={15 * 1024 * 1024}
              exhibitorId={null}
              exhibitionId={event.id}
              existingFile={(Array.isArray(brandingFiles.files['banner_wystawcy_1200'])
                ? (brandingFiles.files['banner_wystawcy_1200'] as any[])[0]
                : brandingFiles.files['banner_wystawcy_1200']) || null}
              onUploadSuccess={() => handleUploadSuccess(null)}
              onUploadError={handleUploadError}
              onDeleteSuccess={() => handleUploadSuccess(null)}
            />
          )}

          {event && brandingFiles && user && (
            <BrandingFileUpload
              fileType="logo_ptak_expo"
              title="Logo PTAK WARSAW EXPO"
              description="Format: png, jpg, webp"
              dimensions="200x200"
              allowedFormats={['png', 'jpg', 'jpeg', 'webp']}
              maxSize={5 * 1024 * 1024}
              exhibitorId={null}
              exhibitionId={event.id}
              existingFile={(Array.isArray(brandingFiles.files['logo_ptak_expo'])
                ? (brandingFiles.files['logo_ptak_expo'] as any[])[0]
                : brandingFiles.files['logo_ptak_expo']) || null}
              onUploadSuccess={() => handleUploadSuccess(null)}
              onUploadError={handleUploadError}
              onDeleteSuccess={() => handleUploadSuccess(null)}
            />
          )}

          {event && brandingFiles && user && (
            <BrandingFileUpload
              fileType="mailing_header_800x300"
              title="Heder w mailingu"
              description="Format: png, jpg, webp"
              dimensions="800x300"
              allowedFormats={['png', 'jpg', 'jpeg', 'webp']}
              maxSize={5 * 1024 * 1024}
              exhibitorId={null}
              exhibitionId={event.id}
              existingFile={(Array.isArray(brandingFiles.files['mailing_header_800x300'])
                ? (brandingFiles.files['mailing_header_800x300'] as any[])[0]
                : brandingFiles.files['mailing_header_800x300']) || null}
              onUploadSuccess={() => handleUploadSuccess(null)}
              onUploadError={handleUploadError}
              onDeleteSuccess={() => handleUploadSuccess(null)}
            />
          )}

          {event && brandingFiles && user && (
            <BrandingFileUpload
              fileType="dokumenty_brandingowe"
              title="Dokumenty brandingowe dla wystawcy"
              description="Format: PDF"
              dimensions={null}
              allowedFormats={['pdf']}
              maxSize={20 * 1024 * 1024}
              exhibitorId={null}
              exhibitionId={event.id}
              existingFile={(brandingFiles.files['dokumenty_brandingowe'] as any) || null}
              onUploadSuccess={() => handleUploadSuccess(null)}
              onUploadError={handleUploadError}
              onDeleteSuccess={() => handleUploadSuccess(null)}
            />
          )}


          <Box className={styles.saveButtonContainer}>
            <Box 
              className={styles.actionSaveFile}
              onClick={()=>console.log("Do podpięcia endpoint")}
            > 
              <BlueCircleSaveIcon className={styles.actionIcon} />
              <CustomTypography className={styles.actionLabel}>zapisz</CustomTypography>
                         
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default BrandingContent;