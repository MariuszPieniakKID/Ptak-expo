import { Dialog, DialogTitle, DialogActions, IconButton, Box } from "@mui/material";
import CustomTypography from "../customTypography/CustomTypography";
import CustomButton from "../customButton/CustomButton";
import { ReactComponent as CloseIcon } from "../../assets/blackAddIcon.svg";
import { ReactComponent as DeleteConfirmIcon } from "../../assets/delete_confirm.svg";
import styles from "./ConfirmationDialog.module.scss";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmButtonText?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmButtonText = "Tak, potwierdzam",
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={styles.confirmModal}
      PaperProps={{
        className: styles.customDialogPaper,
      }}
    >
      <IconButton
        onClick={onClose}
        disableRipple
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
        }}
      >
        <CloseIcon className={styles.closeIcon} />
      </IconButton>

      <DialogTitle className={styles.titleConfirmation}>{title}</DialogTitle>

      <CustomTypography className={styles.blackBoldText}>Czy na pewno?</CustomTypography>
      <CustomTypography className={styles.descriptionConfirmation}>{description}</CustomTypography>

      <DeleteConfirmIcon className={styles.confirmationIcon} />

      <Box className={styles.messageMidle}>
        <CustomTypography className={styles.greyText}>
          Usunięte zostaną wszystkie dane.
        </CustomTypography>
        <CustomTypography className={styles.greyText}>
          Ta czynność jest nieodtwarzalna.
        </CustomTypography>
      </Box>

      <DialogActions className={styles.dialogAction}>
        <CustomButton
          onClick={onConfirm}
          className={styles.confirmButton}
           sx={{
                backgroundColor: '#a82d29',
                color: '#fff',
                '&:hover': {
                backgroundColor: '#fff',
                color: '#a82d29',
                border: '1px solid #a82d29',
                }
                }}
        >
          {confirmButtonText}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;