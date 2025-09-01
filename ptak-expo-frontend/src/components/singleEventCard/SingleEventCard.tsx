import { ReactComponent as WastebasketIcon } from '../../assets/wastebasket.svg';
import { ReactComponent as EditIcon } from '../../assets/editIcon.svg';
import styles from './SingleEventCard.module.scss';
import CustomTypography from '../customTypography/CustomTypography';
import { ReactComponent as EventIconWIW } from '../../assets/warsaw_industry_week.svg';
import { ReactComponent as EventIconIBW } from '../../assets/industrial_bulding_week.svg';
import { getBrandingFileUrl } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ReactComponent as ProgressIcon21 } from '../../assets/21%.svg';
import { ReactComponent as ProgressIcon65 } from '../../assets/65%.svg';
import { Box } from '@mui/material';
import { useState, useCallback, useEffect } from 'react';
import { getBrandingFiles } from '../../services/api';
import ConfirmationDialog from '../confirmationDialog/ConfirmationDialog';

interface SingleEventCardProps {
  id: number;
  exhibitorId?: number;
  title: string;
  start_date: string;
  end_date: string;
  handleSelectEvent?: (id: number) => void;
  handleDeleteEventFromExhibitor?: (id: number, exhibitorId: number) => void;
  iconId: number;
  event_readiness?: number;
  showDelete?: boolean;   
  showSelect?: boolean;  
  showEdit?: boolean;
  eventLogoFileName?: string | null;
}

const SingleEventCard: React.FC<SingleEventCardProps> = ({
  id,
  title,
  start_date,
  end_date,
  exhibitorId,
  iconId,
  event_readiness = 0, // domyślnie brak postępu
  handleSelectEvent,
  handleDeleteEventFromExhibitor,
  showDelete = true,
  showSelect = true,
  showEdit = false,
  eventLogoFileName,
}) => {
  const [openConfirm, setOpenConfirm] = useState(false);
  const { token } = useAuth();
  const [resolvedLogoUrl, setResolvedLogoUrl] = useState<string | null>(null);

  const formatDateRange = useCallback((startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startFormatted = start.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const endFormatted = end.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return `${startFormatted}-${endFormatted}`;
  }, []);

  const renderIcon = (iconId: number) => {
    switch (iconId) {
      case 1:
        return <EventIconWIW className={styles.logo} />;
      case 2:
        return <EventIconIBW className={styles.logo} />;
      default:
        return null;
    }
  };

  const renderProgressIcon = (progress: number) => {
    switch (progress) {
      case 21:
        return <ProgressIcon21 className={styles.progressIcon} />;
      case 65:
        return <ProgressIcon65 className={styles.progressIcon} />;
      default:
        return null;
    }
  };

  const handleConfirmDelete = () => {
    if (handleDeleteEventFromExhibitor && exhibitorId !== undefined) {
      handleDeleteEventFromExhibitor(id, exhibitorId);
    }
    setOpenConfirm(false);
  };

  // Resolve event logo dynamically
  useEffect(() => {
    const resolveLogo = async () => {
      try {
        if (!token) {
          setResolvedLogoUrl(null);
          return;
        }
        // 1) Prefer exhibitor-scoped branding for this event
        if (typeof exhibitorId === 'number') {
          try {
            const filesResp = await getBrandingFiles(exhibitorId, id, token);
            const files = filesResp.files || {};
            const preferredKey = files['event_logo']
              ? 'event_logo'
              : Object.keys(files).find(k => k.toLowerCase().includes('logo'))
                || Object.keys(files)[0];
            if (preferredKey && files[preferredKey]) {
              setResolvedLogoUrl(getBrandingFileUrl(exhibitorId, files[preferredKey].fileName, token));
              return;
            }
          } catch {
            // ignore, try global
          }
        }
        // 2) Fall back to global event_logo
        try {
          const g = await getBrandingFiles(null, id, token);
          if (g.files && g.files['event_logo']) {
            setResolvedLogoUrl(getBrandingFileUrl(null, g.files['event_logo'].fileName, token));
            return;
          }
        } catch {
          // ignore
        }
        setResolvedLogoUrl(null);
      } catch {
        setResolvedLogoUrl(null);
      }
    };
    void resolveLogo();
  }, [token, id, exhibitorId]);

  return (
    <>
      <Box className={`${styles.eventCardContainer} ${token && eventLogoFileName ? styles.hasLogoCard : ''}`}>
        <Box className={styles.deleteIconContainer}>
          {showDelete && handleDeleteEventFromExhibitor && exhibitorId !== undefined ? (
            <WastebasketIcon
              className={styles.wastebasketIcon}
              onClick={() => setOpenConfirm(true)}
            />
          ) : (
            <Box className={styles.wastebasketIcon} /> 
          )}
        </Box>

        <Box className={styles.container}>
          <Box className={`${styles.eventLogo} ${(token && (resolvedLogoUrl || eventLogoFileName)) ? styles.hasLogo : ''}`}>
            {token && (resolvedLogoUrl || eventLogoFileName) ? (
              <img
                src={resolvedLogoUrl || getBrandingFileUrl(null, eventLogoFileName as string, token)}
                alt={`${title} logo`}
                className={styles.logo}
              />
            ) : renderIcon(iconId)}
          </Box>
          <Box className={styles.eventInfo}>
            <Box className={styles.dateInfo}>{formatDateRange(start_date, end_date)}</Box>
            <Box className={styles.eventTitle}>{title || ""}</Box>
          </Box>
        </Box>

        {showEdit ? (
          <Box className={styles.editBox}>
            <Box className={styles.fieldLabelContainer} >
              <CustomTypography className={styles.fieldLabel}>Branża:</CustomTypography>
            </Box>

            <Box className={styles.editInfo}>
              <CustomTypography className={styles.fieldValue}>Dom</CustomTypography>
              <Box className={styles.actionEditButton}>
                <Box 
                  className={styles.boxWithHover}
                  onClick={() => {
                    const evt = new CustomEvent('open-edit-event-modal', { detail: { id, title, start_date, end_date } });
                    window.dispatchEvent(evt);
                  }}
                > 
                  <EditIcon className={styles.editEvent}/>         
                  <CustomTypography className={styles.editEventText}>edytuj</CustomTypography>
                </Box>         
              </Box>
            </Box>
          </Box>
        ) : (
          <Box className={styles.actionInfo}>
            <Box className={styles.readyInfo}>
              <CustomTypography className={styles.readyText}>Gotowość:</CustomTypography>
              {renderProgressIcon(event_readiness)}
            </Box>
            <Box className={styles.action}>
              {showSelect && handleSelectEvent ? (
                <Box
                  className={styles.actionButton}
                  onClick={() => handleSelectEvent(id)}
                >
                  <CustomTypography className={styles.chooseText}>wybierz</CustomTypography>
                </Box>
              ) : (
                <Box className={styles.actionButton} />  
              )}
            </Box>
          </Box>
        )}
      </Box>

      <ConfirmationDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Odłącz wydarzenie od wystawcy"
        description="Czy na pewno chcesz odłączyć to wydarzenie od tego wystawcy?"
      />
    </>
  );
};
export default SingleEventCard;