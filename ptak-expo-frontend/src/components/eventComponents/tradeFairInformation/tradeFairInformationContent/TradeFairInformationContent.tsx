import { Box } from "@mui/material";
import { Exhibition } from "../../../../services/api";


interface TradeFairInformationContentProps {
  event: Exhibition;
}

function TradeFairInformationContent({ event }: TradeFairInformationContentProps) {


  return (
    <Box>2:{event.name}</Box>
  );
}

export default TradeFairInformationContent;