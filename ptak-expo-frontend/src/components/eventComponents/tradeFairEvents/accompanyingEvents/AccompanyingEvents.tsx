import React from "react";
import styles from "./AccompanyingEvents.module.scss";
import Box from "@mui/material/Box";
import CustomTypography from "../../../customTypography/CustomTypography";

import { Exhibition, TradeEvent } from "../../../../services/api";
import MenuDates from "../menuDates/MenuDates";
import TabCard from "../tabCard/TabCard";

interface AccompanyingEventsProps {
  tradeEvents:TradeEvent[];
  event:Exhibition;
}

const AccompanyingEvents: React.FC<AccompanyingEventsProps> = ({
  event,
  tradeEvents 
}) => {
  const [value, setValue] = React.useState(0);
    
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    console.log('[AccompanyingEvents] tab change', { from: value, to: newValue });
    setValue(newValue);
  };

  return (

    <Box className={styles.container}>
      <Box className={styles.selectDate} >
        <CustomTypography className={styles.title} >Wybierz dzień targów</CustomTypography>
        <MenuDates 
        event={event}
        value={value}
        handleChange={handleChange} 
        /> 
      </Box>
        <TabCard 
        tradeEvents={tradeEvents}
        event={event} 
        value={value}
        />
    </Box>  
  );
};

export default AccompanyingEvents;