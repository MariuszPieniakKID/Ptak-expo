import React, { useState } from "react";
import { Box } from "@mui/material";
import styles from "./TicketType.module.scss";
import CustomTypography from "../../customTypography/CustomTypography";
import CircleOrangeIcon from "../../CircleOrangeIcon";
import MiniStepper from "../../MiniStepper";
import { ReactComponent as CircleIcon } from '../../../assets/blue_blackCircle.svg';

interface Ticket {
  id: number;
  type: string;
  price: number;
  numberInvitedguests: number;
  invitationLimit: number;
}

interface TicketTypeProps {
  data: Ticket[];
  hideLimitControls?: boolean;
}

const TicketType: React.FC<TicketTypeProps> = ({ data, hideLimitControls = false }) => {
  const [stepperValues, setStepperValues] = useState<Record<number, number>>(
    () => Object.fromEntries(data.map(ticket => [ticket.id, ticket.numberInvitedguests]))
  );

  const handleStepperChange = (ticketId: number, value: number) => {
    setStepperValues(prev => ({ ...prev, [ticketId]: value }));
  };

  const handleIncreasingTheTicketLimit = (ticketId: number) => {
    //TODOO ENDPOINT
    console.log("ID biletu:", ticketId);
    console.log("Nowy limit:", stepperValues[ticketId]);
    // tu możesz zrobić fetch/axios do API
  };

  if (data.length === 0) {
    return (
      <CustomTypography className={styles.title}>
        Brak wygenerowanych zaproszeń
      </CustomTypography>
    );
  }

  return (
    <Box className={styles.container}>
      {data.map(ticket => (
        <React.Fragment key={ticket.id}>
          {/* Sekcja info */}
          <Box className={styles.ticketInfo}>
            <Box className={styles.singleLine}>
              <Box className={styles.icon}>
                <CircleIcon />
                <Box className={styles.circleContent}>
                  <Box className={styles.singleLineInvitation}>
                    <CustomTypography className={styles.numberInvitedguests}>
                      {ticket.numberInvitedguests}
                    </CustomTypography>
                    <CustomTypography className={styles.limit}>/{ticket.invitationLimit}</CustomTypography>
                  </Box>
                  <CustomTypography className={styles.invitation}>Zaproszeń</CustomTypography>
                </Box>
              </Box>
              <Box className={styles.ticketStatistics}>
                <CustomTypography className={styles.ticketType}>{ticket.type}</CustomTypography>
                <CustomTypography className={styles.ticketPrice}>
                  {`bilet o wartości ${ticket.price} PLN`}
                </CustomTypography>
                <CustomTypography className={styles.numberOfInvitationSent}>
                  {`Wystawcy udało się zaprosić ${ticket.numberInvitedguests} gości specjalnych!`}
                </CustomTypography>
              </Box>
            </Box>
          </Box>

          {/* Sekcja akcji (ukryta na życzenie) */}
          {hideLimitControls ? null : (
            <Box className={styles.actionRow}>
              <Box className={styles.limitationLine}>
                <Box className={styles.inLine1}>
                  <CustomTypography className={styles.limitLabel}>
                    Zwiększ limit dostępnych zaproszeń specjalnych
                  </CustomTypography>
                  <Box>
                    <MiniStepper
                      value={stepperValues[ticket.id]}
                      min={10}
                      noMax
                      disableDecrease
                      onChange={(value) => handleStepperChange(ticket.id, value)}
                    />
                  </Box>
                </Box>
                <Box className={styles.inLine2}>
                  <Box
                    className={styles.actionBox}
                    onClick={() => handleIncreasingTheTicketLimit(ticket.id)}
                  >
                    <CustomTypography className={styles.actionLabel}>potwierdź ilość</CustomTypography>
                    <CircleOrangeIcon className={styles.actionIcon} />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default TicketType;