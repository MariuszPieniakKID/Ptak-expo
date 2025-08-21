import React from "react";
import { Box } from "@mui/material";
import styles from "./ContentOfTheExhibitorsApplication.module.scss";
import CustomTypography from "../../customTypography/CustomTypography";
import TextEditor from "../../textEditor/TextEditor";
import { ReactComponent as BlueCircleSaveIcon } from '../../../assets/submitIconBlueCircleWithCheckMark.svg';

export interface _TradeAwardsFair {
  id: number;
  message: string;
}

interface ContentOfTheExhibitorsApplicationProps {
  data: _TradeAwardsFair[];
}

const ContentOfTheExhibitorsApplication: React.FC<ContentOfTheExhibitorsApplicationProps> = ({ data }) => {
  
  const handleAcceptanceOftheApplication = (id: number) => {
    console.log("Akcept zgłoszenia wystawcy o id:", id);
  }

  const handleSentMessage = () => {
    console.log("Wysłanie wiadomości");
  }

  return (
    <Box className={styles.container}>
      {data.length === 0 ? (
        <CustomTypography className={styles.title}>
          Brak zgłoszeń wystawcy
        </CustomTypography>
      ) : (
        <Box className={styles.page}>
          {data.map((item) => (
            <Box key={item.id} className={styles.applicationItem}>
              <CustomTypography className={styles.title}>
                Treść zgłoszenia wystawcy:
              </CustomTypography>

              <TextEditor 
                legend="" 
                value={item.message}
                showToolbar={false}
              />

              <Box className={styles.inRow}>
                <Box 
                  className={styles.actionAccept} 
                  onClick={() => handleAcceptanceOftheApplication(item.id)}
                >
                  <CustomTypography className={styles.actionLabel}>
                    akceptuj zgłoszenie
                  </CustomTypography>
                  <BlueCircleSaveIcon className={styles.actionIcon} />
                </Box>
              </Box>
            </Box>
          ))}

          <CustomTypography className={styles.title}>
            Wyślij wiadomość
          </CustomTypography>

          <Box className={styles.message}>
            <TextEditor 
              legend="Treść powiadomienia"
              value=""
              showToolbar={true}
              placeholder="Wyślij wiadomość dotyczącą zgłoszenia (max. 750 znaków)"         
            />
          </Box>

          <Box className={styles.inRow}>
            <Box 
              className={styles.actionAccept} 
              onClick={handleSentMessage}
            >
              <CustomTypography className={styles.actionLabel}>
                wyślij
              </CustomTypography>
              <BlueCircleSaveIcon className={styles.actionIcon} />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ContentOfTheExhibitorsApplication;
