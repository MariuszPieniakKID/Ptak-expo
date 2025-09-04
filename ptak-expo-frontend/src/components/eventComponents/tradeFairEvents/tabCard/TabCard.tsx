import {Box} from '@mui/material';
import styles from './TabCard.module.scss';
import { Exhibition, TradeEvent } from '../../../../services/api';
import { getDaysBetweenDates } from '../../../../helpers/function';
import SingleLine from '../singleLine/SingleLine';


type TabCardProps = {
  event: Exhibition;
  value:number;
  tradeEvents:TradeEvent[];
};


function TabCard({ 
  event,
  value,
  tradeEvents,
}: TabCardProps) {
 

  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ padding: '24px 0px' }}>{children}</Box>}
      </div>
    );
  }
    const days = getDaysBetweenDates(event.start_date, event.end_date);
  
 return (
  <Box className={styles.container}>
  {days.map((date, index) => (
    <CustomTabPanel 
    key={index}
    value={value} 
    index={index}
    >
      <Box className={styles.tabPaperContainer}>
        {tradeEvents
        .filter(ev => ev.eventDate === date)
        .map(ev => (
            <SingleLine
              key={ev.id}
              time={`${ev.startTime} - ${ev.endTime}`}
              hall={ev.hall || ''}
              title={ev.name}
              shortDescription={ev.description || ''}
              link={ev.link || ''}
            />
          ))
        }
      </Box>            
    </CustomTabPanel>
  ))}

  </Box>
 );
};


export default TabCard;