import { Box } from "@mui/material";
import { Exhibition } from "../../../../services/api";
//import styles from './TradeFairEventsContent.module.scss';


interface TradeFairEventsContentProps {
  event: Exhibition;
}

function TradeFairEventsContent({ event }: TradeFairEventsContentProps) {


  return (
    <Box>4:{event.name}</Box>
  );
}

export default TradeFairEventsContent;