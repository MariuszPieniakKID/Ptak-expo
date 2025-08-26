import { ReactComponent as WastebasketIcon } from '../../assets/wastebasket.svg';
import { ReactComponent as EditIcon } from '../../assets/editIcon.svg';
import styles from './SingleEventCard.module.scss';
import CustomTypography from '../customTypography/CustomTypography';
import { ReactComponent as EventIconWIW } from '../../assets/warsaw_industry_week.svg';
import { ReactComponent as EventIconIBW } from '../../assets/industrial_bulding_week.svg';
import { ReactComponent as ProgressIcon21 } from '../../assets/21%.svg';
import { ReactComponent as ProgressIcon65 } from '../../assets/65%.svg';
import { Box } from '@mui/material';
import { useState, useCallback } from 'react';
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
}) => {
  const [openConfirm, setOpenConfirm] = useState(false);

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

  return (
    <>
      <Box className={styles.eventCardContainer}>
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
          <Box className={styles.eventLogo}>{renderIcon(iconId)}</Box>
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
                  onClick={() => console.log("Edit")}
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