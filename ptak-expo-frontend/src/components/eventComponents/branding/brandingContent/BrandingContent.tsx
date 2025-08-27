import React, { useCallback, useEffect, useState } from 'react';
import { Box, Alert, CircularProgress } from '@mui/material';
import CustomTypography from '../../../../components/customTypography/CustomTypography';
import CustomButton from '../../../../components/customButton/CustomButton';
import BrandingFileUpload from '../../../../components/BrandingFileUpload';
import { useAuth } from '../../../../contexts/AuthContext';
import { Exhibition, getBrandingFiles, BrandingFilesResponse } from '../../../../services/api';
import styles from './BrandingContent.module.scss';

interface BrandingContentProps {
  event: Exhibition;
}

const BrandingContent: React.FC<BrandingContentProps> = ({ event }) => {
  const { user, token, logout } = useAuth();
  const [brandingFiles, setBrandingFiles] = useState<BrandingFilesResponse | null>(null);
  const [brandingLoading, setBrandingLoading] = useState<boolean>(false);
  const [brandingError, setBrandingError] = useState<string>('');

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

  const handleUploadSuccess = useCallback((exhibitorId: number | null) => {
    if (event && token) {
      loadBrandingFiles(exhibitorId, event.id);
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
      <CustomTypography fontSize="1.25rem" fontWeight={600}>
        Branding wystawcy
      </CustomTypography>

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
        <Box className={styles.brandingSection}>
          <CustomTypography fontSize="1rem">
            Materiały brandingowe i promocyjne dla wydarzenia
          </CustomTypography>

          {event && brandingFiles && user && (
            <BrandingFileUpload
              fileType="kolorowe_tlo_logo_wydarzenia"
              title="Kolorowe tło z logiem wydarzenia (E-Identyfikator wystawcy)"
              description="Format: png, jpg"
              dimensions="305x106"
              allowedFormats={['png', 'jpg', 'jpeg']}
              maxSize={5 * 1024 * 1024}
              exhibitorId={null}
              exhibitionId={event.id}
              existingFile={brandingFiles.files['kolorowe_tlo_logo_wydarzenia'] || null}
              onUploadSuccess={() => handleUploadSuccess(null)}
              onUploadError={handleUploadError}
              onDeleteSuccess={() => handleUploadSuccess(null)}
            />
          )}

          {event && brandingFiles && user && (
            <BrandingFileUpload
              fileType="tlo_wydarzenia_logo_zaproszenia"
              title="Tło wydarzenia z logiem (E-zaproszenia)"
              description="Format: png, svg"
              dimensions="152x106"
              allowedFormats={['png', 'svg']}
              maxSize={5 * 1024 * 1024}
              exhibitorId={null}
              exhibitionId={event.id}
              existingFile={brandingFiles.files['tlo_wydarzenia_logo_zaproszenia'] || null}
              onUploadSuccess={() => handleUploadSuccess(null)}
              onUploadError={handleUploadError}
              onDeleteSuccess={() => handleUploadSuccess(null)}
            />
          )}

          {event && brandingFiles && user && (
            <BrandingFileUpload
              fileType="biale_logo_identyfikator"
              title="Białe Logo (E-Identyfikator)"
              description="Format: png, svg"
              dimensions="104x34"
              allowedFormats={['png', 'svg']}
              maxSize={5 * 1024 * 1024}
              exhibitorId={null}
              exhibitionId={event.id}
              existingFile={brandingFiles.files['biale_logo_identyfikator'] || null}
              onUploadSuccess={() => handleUploadSuccess(null)}
              onUploadError={handleUploadError}
              onDeleteSuccess={() => handleUploadSuccess(null)}
            />
          )}

          {event && brandingFiles && user && (
            <BrandingFileUpload
              fileType="banner_wystawcy_800"
              title="Banner dla wystawcy z miejscem na logo"
              description="Format: png, jpg"
              dimensions="800x800"
              allowedFormats={['png', 'jpg', 'jpeg']}
              maxSize={10 * 1024 * 1024}
              exhibitorId={null}
              exhibitionId={event.id}
              existingFile={brandingFiles.files['banner_wystawcy_800x800'] || null}
              onUploadSuccess={() => handleUploadSuccess(null)}
              onUploadError={handleUploadError}
              onDeleteSuccess={() => handleUploadSuccess(null)}
            />
          )}

          {event && brandingFiles && user && (
            <BrandingFileUpload
              fileType="banner_wystawcy_1200"
              title="Banner dla wystawcy z miejscem na logo (duży)"
              description="Format: png, jpg"
              dimensions="1200x1200"
              allowedFormats={['png', 'jpg', 'jpeg']}
              maxSize={15 * 1024 * 1024}
              exhibitorId={null}
              exhibitionId={event.id}
              existingFile={brandingFiles.files['banner_wystawcy_1200x1200'] || null}
              onUploadSuccess={() => handleUploadSuccess(null)}
              onUploadError={handleUploadError}
              onDeleteSuccess={() => handleUploadSuccess(null)}
            />
          )}

          {event && brandingFiles && user && (
            <BrandingFileUpload
              fileType="logo_ptak_expo"
              title="Logo PTAK EXPO"
              description="Format: png, jpg"
              dimensions="200x200"
              allowedFormats={['png', 'jpg', 'jpeg']}
              maxSize={5 * 1024 * 1024}
              exhibitorId={null}
              exhibitionId={event.id}
              existingFile={brandingFiles.files['logo_ptak_expo'] || null}
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
              existingFile={brandingFiles.files['dokumenty_brandingowe'] || null}
              onUploadSuccess={() => handleUploadSuccess(null)}
              onUploadError={handleUploadError}
              onDeleteSuccess={() => handleUploadSuccess(null)}
            />
          )}

          <Box className={styles.saveButtonContainer}>
            <CustomButton
              bgColor="#6F87F6"
              textColor="#fff"
              width="120px"
              height="40px"
              fontSize="0.875rem"
            >
              Zapisz
            </CustomButton>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default BrandingContent;