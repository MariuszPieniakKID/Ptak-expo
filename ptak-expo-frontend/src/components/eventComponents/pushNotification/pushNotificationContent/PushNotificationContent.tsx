import { Box } from "@mui/material";
import { Exhibition } from "../../../../services/api";


interface PushNotificationContentProps {
  event: Exhibition;
}

function PushNotificationContent({ event }: PushNotificationContentProps) {


  return (
    <Box>5:{event.name}</Box>
  );
}

export default PushNotificationContent;