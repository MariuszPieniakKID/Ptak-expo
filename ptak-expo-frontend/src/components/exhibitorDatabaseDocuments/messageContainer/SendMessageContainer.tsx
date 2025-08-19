import React, { useState } from "react";
import { Box, Paper } from "@mui/material";
import styles from "./SendMessageContainer.module.scss";
import CustomTypography from "../../customTypography/CustomTypography";
import { ReactComponent as BlueCircleSendIcon } from "../../../assets/submitIconBlueCircleWithCheckMark.svg";
import TextEditor from "../../textEditor/TextEditor";

interface SendMessageContainerProps {
  onSend?: (message: string) => void;
}

const SendMessageContainer: React.FC<SendMessageContainerProps> = ({ onSend }) => {
  const [message, setMessage] = useState("");

  const handleSendClick = () => {
    if (onSend && message.trim() !== "") {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <Paper className={styles.messageCard} elevation={0}>
      <TextEditor
        legend="Treść powiadomienia"
        placeholder="Wyślij wiadomość dotyczącą zgłoszenia (max. 750 znaków)"
        value={message}
        onChange={setMessage}
        maxLength={750}
        showToolbar
      />

      <Box className={styles.actionSendFile} onClick={handleSendClick}>
        <CustomTypography className={styles.actionLabel}>Wyślij</CustomTypography>
        <BlueCircleSendIcon className={styles.actionIcon} />
      </Box>
    </Paper>
  );
};

export default SendMessageContainer;