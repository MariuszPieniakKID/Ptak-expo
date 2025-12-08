import { ReactNode } from "react";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { ApplyGreenCheck } from "./ApplyGreenCheck";
import styles from "../../pages/ChecklistPage.module.scss";

export default function ChecklistCard({
  children,
  title,
  icon,
  checked,
  secondaryBackground,
}: {
  children: ReactNode;
  title: ReactNode;
  icon: ReactNode;
  checked: boolean;
  secondaryBackground?: boolean;
}) {
  return (
    <Accordion
      className={styles.accordion}
      sx={{
        backgroundColor: secondaryBackground ? "#F5F6F7" : "white",
        borderRadius: "20px",
        "&:before": {
          display: "none",
        },
      }}
    >
      <AccordionSummary
        slotProps={{
          content: {
            sx: {
              alignItems: "center",
              gap: "10px",
            },
          },
        }}
        sx={{}}
        expandIcon={<ExpandMore />}
        style={{
          margin: 0,
        }}
      >
        <ApplyGreenCheck checked={checked} nomargin>
          {icon}
        </ApplyGreenCheck>
        {title}
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}
