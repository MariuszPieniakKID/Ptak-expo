
import {  CircularProgress, Dialog, DialogTitle } from '@mui/material';


import styles from './ModalWithconfirmation.module.scss';

interface ModalWithconfirmationProps{
  isOpen: boolean;
  onClose: () => void;
  //onConfirmationCase: () => void;
  //token: string;
}


const ModalWithconfirmation: React.FC<ModalWithconfirmationProps> = ({
  isOpen,
  onClose,
  //onConfirmationCase,
  //token,
}) => {
 

  return (
    <Dialog 
     open={isOpen} 
     onClose={onClose} 
     maxWidth="sm" 
     PaperProps={{ className: styles.customDialogPaper }}
     >
      {true
      ? <CircularProgress size={24} />
      : <DialogTitle className={styles.dialogTitle}></DialogTitle >
       }
    </Dialog>
  );
};

export default ModalWithconfirmation;