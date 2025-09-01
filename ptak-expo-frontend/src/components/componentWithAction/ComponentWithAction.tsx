import React from "react";
import Box from "@mui/material/Box";

import { ReactComponent as Wastebasket } from "../../assets/wastebasket.svg";
import { ReactComponent as DownloadIcon } from "../../assets/uploadingIcon.svg";
import { ReactComponent as UploadIcon } from "../../assets/uploadIcon.svg";
import { ReactComponent as BlackCross } from "../../assets/blackAddIcon.svg";
import { ReactComponent as BlueCircleSendIcon } from "../../assets/submitIconBlueCircleWithCheckMark.svg";
import { ReactComponent as BlueCircle } from "../../assets/blueCircle.svg";
import { ReactComponent as EditIcon } from '../../assets/editIcon.svg';
import { ReactComponent as EyeIcon } from '../../assets/eyeIcon.svg';
import { ReactComponent as SendIcon } from '../../assets/sendIcon.svg';
import { ReactComponent as ToolsIcon } from '../../assets/optionIcon.svg';
import styles from "./ComponentWithAction.module.scss";
import CustomTypography from "../customTypography/CustomTypography";

interface ComponentWithActionProps {
  iconType: "add" | "upload" | "download" | 'accept' |'preview'| 'edit' | 'delete' | 'noIcon' | 'other' | 'save'|'send'|'tools';
  iconSVG?: React.FC<React.SVGProps<SVGSVGElement>>;
  handleAction: () => void;
  buttonTitle: string;
  nameStyle?: React.CSSProperties;
  hideTextOnMobile?: boolean;
  iconFirst?: boolean;
  disabled?: boolean; // optional prop
}

const ComponentWithAction: React.FC<ComponentWithActionProps> = ({
  iconType = 'upload',
  iconSVG: IconSVG,
  handleAction,
  buttonTitle,
  nameStyle,
  hideTextOnMobile = false,
  iconFirst = true,
  disabled = false,
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
      case 'preview':return EyeIcon;
      case 'send':return SendIcon ;
      case 'tools':return ToolsIcon;
      case "other": return IconSVG;
      default: return null;
    }
  })();

  return (
    <Box
      className={`${styles.container} ${disabled ? styles.disabled : ''}`}
      onClick={disabled ? undefined : handleAction}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      role="button"
    >
      {iconFirst ? (
        <>
          {ButtonIcon && <ButtonIcon className={styles.actionIcon} />}
          <Box style={nameStyle}>
            <CustomTypography
              className={`${styles.actionTitle} ${hideTextOnMobile ? styles.hideOnMobile : ''}`}
            >
              {buttonTitle}
            </CustomTypography>
          </Box>
        </>
      ) : (
        <>
          <Box style={nameStyle}>
            <CustomTypography
              className={`${styles.actionTitle} ${hideTextOnMobile ? styles.hideOnMobile : ''}`}
            >
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