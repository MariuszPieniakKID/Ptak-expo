import { Box } from "@mui/material";
import { Exhibition } from "../../../../services/api";
//import styles from './InvitationsContent.module.scss';


interface InvitationsContentProps {
  event: Exhibition;
}

function InvitationsContent({ event }: InvitationsContentProps) {


  return (
    <Box>3:{event.name}</Box>
  );
}

export default InvitationsContent;