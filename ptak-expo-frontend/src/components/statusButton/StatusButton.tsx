import React from "react";
import Box from "@mui/material/Box";
import { ReactComponent as BlueSmallCircle } from '../../assets/blueSmallCircle.svg';
import { ReactComponent as WhiteSmallCircle } from '../../assets/whiteSmallCircle.svg';
import { ReactComponent as GreenSmallCircle } from '../../assets/greenSmallCircle.svg';
import styles from "./StatusButton.module.scss";
import CustomTypography from "../customTypography/CustomTypography";

export type InvitationStatus = "Wysłane" | "Aktywowane" | "Potwierdzone";

interface StatusButtonProps {
  status: InvitationStatus | null | undefined;
}

const StatusButton: React.FC<StatusButtonProps> = ({ status }) => {
  if (status === "Potwierdzone") {
    return (
      <Box className={styles.potwierdzone}>
        <BlueSmallCircle className={styles.statusIcon} />
        <CustomTypography className={styles.potwierdzoneLabel}>Potwierdzone</CustomTypography>
      </Box>
    );
  }
  if (status === "Wysłane") {
    return (
      <Box className={styles.wyslane}>
        <WhiteSmallCircle className={styles.statusIcon} />
        <CustomTypography className={styles.wyslaneLabel}>Wysłane</CustomTypography>
      </Box>
    );
  }
  if (status === "Aktywowane") {
    return (
      <Box className={styles.aktywowane}>
        <GreenSmallCircle className={styles.statusIcon} />
        <CustomTypography className={styles.aktywowaneLabel}>Aktywowane</CustomTypography>
      </Box>
    );
  }
  return null;
};

export default StatusButton;