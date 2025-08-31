import React from "react";
import Box from "@mui/material/Box";

import { ReactComponent as Wastebasket } from "../../assets/wastebasket.svg";
import { ReactComponent as DownloadIcon } from "../../assets/uploadingIcon.svg";
import { ReactComponent as UploadIcon } from "../../assets/uploadIcon.svg";
import { ReactComponent as BlackCross } from "../../assets/blackAddIcon.svg";
import { ReactComponent as BlueCircleSendIcon } from "../../assets/submitIconBlueCircleWithCheckMark.svg";
import { ReactComponent as BlueCircle } from "../../assets/blueCircle.svg";
import { ReactComponent as EditIcon } from '../../assets/editIcon.svg';
import styles from "./ComponentWithAction.module.scss";
import CustomTypography from "../customTypography/CustomTypography";

interface ComponentWithActionProps {
  iconType: "add" | "upload" | "download"|'accept'|'edit'|'delete'|'noIcon'|'other'|'save';
  iconSVG?: React.FC<React.SVGProps<SVGSVGElement>>;
  handleAction: () => void;
  buttonTitle: string;
  nameStyle?: React.CSSProperties;
  hideTextOnMobile?: boolean; // NOWY, opcjonalny props
  iconFirst?: boolean; // Nowy props, domyślnie true
}

const ComponentWithAction: React.FC<ComponentWithActionProps> = ({
  iconType='upload',
  iconSVG: IconSVG,
  handleAction,
  buttonTitle,
  nameStyle,
  hideTextOnMobile=false,
  iconFirst=true,
}) => {
  const ButtonIcon = (() => {
    switch (iconType) {
      case "add": return BlackCross;
      case "upload": return UploadIcon;
      case "download": return DownloadIcon;
      case "save": return BlueCircleSendIcon;
      case "accept": return BlueCircle;
      case "edit": return EditIcon;
      case "delete": return Wastebasket;
      case "other": return IconSVG;
      default: return null;
    }
  })();

  return (
  <Box className={styles.container} onClick={handleAction}>
    {iconFirst ? (
      <>
        {ButtonIcon && <ButtonIcon className={styles.actionIcon} />}
        <Box style={nameStyle}>
          <CustomTypography
            className={`${styles.actionTitle} ${hideTextOnMobile ? styles.hideOnMobile : ''}`}>
            {buttonTitle}
          </CustomTypography>
        </Box>
      </>
    ) : (
      <>
        <Box style={nameStyle}>
          <CustomTypography
            className={`${styles.actionTitle} ${hideTextOnMobile ? styles.hideOnMobile : ''}`}>
            {buttonTitle}
          </CustomTypography>
        </Box>
        {ButtonIcon && <ButtonIcon className={styles.actionIcon} />}
      </>
    )}
  </Box>
);
};

export default ComponentWithAction;