import React from "react";
import Box from "@mui/material/Box";
import { ReactComponent as BellIcon } from '../../assets/bell.svg';
import { ReactComponent as GreenCircle } from '../../assets/greenCircleWithChecked.svg';
import styles from "./Bell.module.scss";
import CustomTooltip from "../customTooltip/CustomTooltip";

interface BellProps {
  reminder: boolean | null | undefined;
 tooltipText?: string | undefined;
boxShadowColor?: string | undefined;
}

const Bell: React.FC<BellProps> = ({ reminder, tooltipText, boxShadowColor }) => {
  if (reminder === true) {
    const content = (
      <span className={styles.iconBellWrapper}>
        <BellIcon className={styles.iconBell} />
        <GreenCircle className={styles.iconGreenCircle} />
      </span>
    );
    return (
      <Box className={styles.bell}>
        {tooltipText ? (
          <CustomTooltip 
            title={tooltipText}
            boxShadowColor={boxShadowColor}
          >
            {content}
          </CustomTooltip>
        ) : (
          content
        )}
      </Box>
    );
  }
  if (reminder === false) {
    const content = (
      <span className={styles.iconBellWrapper}>
        <BellIcon className={styles.iconBell} />
      </span>
    );
    return (
      <Box className={styles.bell}>
        {tooltipText ? (
          <CustomTooltip 
            title={tooltipText}
            boxShadowColor={boxShadowColor}
          >
            {content}
          </CustomTooltip>
        ) : (
          content
        )}
      </Box>
    );
  }
  // reminder === null lub undefined
  return null;
};

export default Bell;