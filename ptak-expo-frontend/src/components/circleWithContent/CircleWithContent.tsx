import { Box } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import styles from "./CircleWithContent.module.scss";
import CustomTypography from "../customTypography/CustomTypography";

interface CircleWithContentProps {
  invited: number;
  limit: number;
}

export const CircleWithContent = ({ invited, limit }: CircleWithContentProps) => {
  return (
    <Box className={styles.circleWrapper}>
      <CircleIcon className={styles.circleIcon} />
      <Box className={styles.circleChildren}>
        <Box className={styles.singleLineInvitation}>
          <CustomTypography className={styles.numberInvitedguests}>{invited}</CustomTypography>
          <CustomTypography className={styles.limit}>/{limit}</CustomTypography>
        </Box>
        <CustomTypography className={styles.invitation}>Zaproszeń</CustomTypography>
      </Box>
    </Box>
  );
};