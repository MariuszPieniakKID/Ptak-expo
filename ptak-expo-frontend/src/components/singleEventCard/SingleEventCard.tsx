import { Box } from '@mui/material';
import { ReactComponent as WastebasketIcon } from '../../assets/wastebasket.svg';
import styles from './SingleEventCard.module.scss';
import CustomTypography from '../customTypography/CustomTypography';
import { ReactComponent as EventIconWIW} from '../../assets/warsaw_industry_week.svg';
import { ReactComponent as EventIconIBW } from '../../assets/industrial_bulding_week.svg';
import { ReactComponent as ProgressIcon21 } from '../../assets/21%.svg';
import { ReactComponent as ProgressIcon65 } from '../../assets/65%.svg';
import { useCallback } from 'react';


interface SingleEventCardProps {
 id:number;
 exhibitorId:number;
 title:string;
 start_date:string;
 end_date:string;
 handleSelectEvent:(id:number)=>void;
 handleDeleteEventFromExhibitor:(id:number,exhibitorId:number)=>void;
 iconId:number;
 event_readiness:number;
 }

 const SingleEventCard: React.FC<SingleEventCardProps> = ({ 
    id,
    title,
    start_date,
    end_date,
    exhibitorId,
    iconId,
    event_readiness,
    handleSelectEvent,
    handleDeleteEventFromExhibitor,
 }) => {
  
    const formatDateRange = useCallback((startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startFormatted = start.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const endFormatted = end.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
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
    const renderProgressIcon = (event_readiness: number) => {
    switch (event_readiness) {
        case 21:
        return <ProgressIcon21 className={styles.progressIcon} />;
        case 65:
        return <ProgressIcon65 className={styles.progressIcon}/>;

        default:
        return null; 
    }
    };

  return (
    <Box className={styles.eventCardContainer}>
        <Box className={styles.deleteIconContainer}>
            <WastebasketIcon className={styles.wastebasketIcon} onClick={()=> handleDeleteEventFromExhibitor(id,exhibitorId)}/>
        </Box>
        <Box className={styles.container}>
            <Box className={styles.eventLogo}>{renderIcon(iconId)}</Box>
            <Box className={styles.eventInfo}>
                <Box className={styles.dateInfo}> {formatDateRange(start_date,end_date)}</Box>
                <Box className={styles.eventTitle}>{title?title:""}</Box> 
            </Box>
        </Box>
        <Box className={styles.actionInfo}>
            <Box className={styles.readyInfo}>
                <CustomTypography className={styles.readyText} >Gotowość:</CustomTypography>
                {renderProgressIcon (event_readiness)}
            </Box>
            <Box className={styles.action}>
                <Box className={styles.actionButton} onClick={()=>handleSelectEvent(id)}>
                   <CustomTypography className={styles.chooseText} >wybierz</CustomTypography>
                </Box>
            </Box>
        </Box>
        
    </Box>
  )
};

export default SingleEventCard; 





