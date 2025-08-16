import React, { useState } from "react";
import { Box, IconButton, Paper, TextField, Tooltip } from "@mui/material";
import styles from "./SendMessageContainer.module.scss";
import CustomTypography from "../../customTypography/CustomTypography";

// PNG jako zwykły string z URL
import emotionIcon from "../../../assets/EmotionIcon_m (1).png";

// SVG jako komponenty React
import { ReactComponent as LinkIcon } from "../../../assets/chainIcon.svg";
import { ReactComponent as ItalicIconFormat } from "../../../assets/I.svg";
import { ReactComponent as BoldIconFormat } from "../../../assets/B.svg";
import { ReactComponent as BlueCircleSendIcon } from "../../../assets/submitIconBlueCircleWithCheckMark.svg";


interface SendMessageContainerProps {
  onSend?: (message: string) => void;
}

const SendMessageContainer: React.FC<SendMessageContainerProps> = ({ onSend }) => {
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= 750) {
      setMessage(e.target.value);
    }
  };

  const handleSendClick = () => {
    if (onSend && message.trim() !== "") {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <Paper className={styles.messageCard} elevation={0}>
      <Box className={styles.textAreaWrapper}>
        <legend className={styles.legend}>Treść powiadomienia</legend>
        <TextField
          value={message}
          onChange={handleChange}
          placeholder="Wyślij wiadomość dotyczącą zgłoszenia (max. 750 znaków)"
          fullWidth
          multiline
          minRows={3}
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
          }}
        />

        {/* Pasek narzędzi */}
        <Box className={styles.toolbar}>
          <Tooltip title="Pogrubienie">
            <IconButton size="small">
              <BoldIconFormat className={styles.icon} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Kursywa">
            <IconButton size="small">
              <ItalicIconFormat 
              className={styles.icon}/>
            </IconButton>
          </Tooltip>
          <Tooltip title="Emotikona">
            <IconButton size="small">
              <img src={emotionIcon} alt="Emotikona" className={styles.iconImage} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Dodaj link">
            <IconButton size="small">
              <LinkIcon className={styles.icon} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Przycisk wysyłania */}
      <Box className={styles.actionSendFile} onClick={handleSendClick}>
        <CustomTypography className={styles.actionLabel}>Wyślij</CustomTypography>
        <BlueCircleSendIcon className={styles.actionIcon} />
      </Box>
    </Paper>
  );
};

export default SendMessageContainer;