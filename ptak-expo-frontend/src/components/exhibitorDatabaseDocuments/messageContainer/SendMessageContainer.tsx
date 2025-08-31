import React, { useState } from "react";
import {  Box, Paper } from "@mui/material";
import styles from "./SendMessageContainer.module.scss";
import TextEditor from "../../textEditor/TextEditor";
import ComponentWithAction from "../../componentWithAction/ComponentWithAction";

interface SendMessageContainerProps {
  onSend?: (message: string) => void;
  paperBackground?: string;
  legendBackground?: string;
  textAreaBackground?: string;
}

const SendMessageContainer: React.FC<SendMessageContainerProps> = ({ 
  onSend,
  paperBackground='white',
  legendBackground='white',
  textAreaBackground='white',
 }) => {
  const [message, setMessage] = useState("");

  const handleSendClick = () => {
    if (onSend && message.trim() !== "") {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <Paper 
    className={styles.messageCard} 
    elevation={0}
    style={{ background: paperBackground }}
    >
      <TextEditor
        legend="Treść powiadomienia"
        placeholder="Wyślij wiadomość dotyczącą zgłoszenia (max. 750 znaków)"
        value={message}
        onChange={setMessage}
        maxLength={750}
        showToolbar
        legendBackground={legendBackground}
        textAreaBackground={textAreaBackground}
      />
      <Box className={styles.actionSendFile}>
        <ComponentWithAction
          iconType={'save'}
          handleAction={handleSendClick}
          buttonTitle={'wyślij'}
          iconFirst={false}
        />
      </Box>
    </Paper>
  );
};

export default SendMessageContainer;