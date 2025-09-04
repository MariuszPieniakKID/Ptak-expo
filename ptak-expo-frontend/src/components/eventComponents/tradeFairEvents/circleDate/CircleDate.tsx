
import { Box } from '@mui/material';
import { Exhibition } from '../../../../services/api';
import { getShortListColorForEvent } from '../../../../helpers/function';


import styles from './CircleDate.module.scss';

interface CircleDateProps {
dayId:number;
circleColor?:string,
date?:string,
event:Exhibition,
isStartAndEndDateVisible?:boolean;
isActive?:boolean;
}

const CircleDate = ({
    dayId,
    date,
    circleColor='',
    event,
    isStartAndEndDateVisible=false,
    isActive=false,
 }: CircleDateProps) => {

 const eventDateObj = new Date(date?date:event.start_date);
 const ccolor_= circleColor ? circleColor: getShortListColorForEvent(dayId);



return (
    <Box className={styles.date}>
        <Box className={styles.iconWith}>
            <Box
            className={styles.coloredCircle}
            style={{
                '--circle-border-color': ccolor_,
                '--circle-color': isActive ? ccolor_ : 'transparent',
                // enforce light text for all dates on dark background
                '--circle-text-color': '#FFFFFF',
            } as React.CSSProperties}
            >
            {eventDateObj.getDate()}<br />
            {eventDateObj.toLocaleString('pl-PL', { month: 'short' })}
            </Box>
        </Box>
   {isStartAndEndDateVisible
    &&
    <Box 
    className={styles.startAndEndDate}> 
         {event.start_date} - {event.end_date}
    </Box>}
    </Box>
)};

export default CircleDate;