import React from "react";
import styles from "./StatusOfSentInvitations.module.scss";
import Box from "@mui/material/Box";
import CustomTypography from "../../customTypography/CustomTypography";
import { ReactComponent as BellIcon } from '../../../assets/bell.svg';
import { ReactComponent as GreenCircle } from '../../../assets/greenCircleWithChecked.svg';
// import CustomTooltip from "../../customTooltip/CustomTooltip";
import StatusButton from "../../statusButton/StatusButton";
import Bell from "../../bell/Bell";
export type InvitationStatus = "Wysłane" | "Aktywowane" | "Potwierdzone";

interface SentInvitation {
  id: number;
  fullName: string;
  email: string; 
  status: InvitationStatus;
  reminder?: boolean;
}

interface StatusOfSentInvitationsProps {
  data: SentInvitation[];
}

const StatusOfSentInvitations: React.FC<StatusOfSentInvitationsProps> = ({data }) => {
 

  return (
    <Box className={styles.container}>
      <CustomTypography className={styles.title}>Sprawdz status wysłanych zaproszeń.</CustomTypography>
      <Box className={styles.inLine}>
        <Box>
          <span className={styles.iconBellWrapper}>
            <BellIcon className={styles.iconBell} />
            <GreenCircle className={styles.iconGreenCircle} />
          </span>
        </Box>
        <CustomTypography className={styles.infoLabel}>
          Gość już otrzymał ponowne przypomnienie
        </CustomTypography>
    </Box>
    <Box className={styles.list}>
      {data.map((inv, index) => (
        <Box key={inv.id} className={styles.singleLineInList}>
          <Box className={styles.inLineNrAndFullNamer}>
            <CustomTypography className={styles.listNumber}>{index + 1}.</CustomTypography>
            <CustomTypography className={styles.fullName}>{inv.fullName}</CustomTypography>
          </Box>
          <CustomTypography className={styles.email}>{inv.email}</CustomTypography>
          <Box className={styles.status}>
            <StatusButton status={inv.status}/>
              <Box className={styles.reminder}>
                {inv.reminder !== undefined
                  ? <Bell 
                    reminder={inv.reminder} 
                    tooltipText={inv.reminder === true ? "Przypomnienie zostało wysłane." : undefined}
                    boxShadowColor={inv.reminder === true ? '#6F87F6' : undefined}
                  />
                  : <Box className={styles.bell}></Box>
                }
              </Box>
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
  );
 

  
};

export default StatusOfSentInvitations;