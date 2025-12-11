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
  blackBackground,
}: {
  children: ReactNode;
  title: ReactNode;
  icon: ReactNode;
  checked: boolean;
  secondaryBackground?: boolean;
  blackBackground?: boolean;
}) {
  return (
    <Accordion
      className={styles.accordion}
      sx={{
        backgroundColor: blackBackground
          ? "#2B2B2D"
          : secondaryBackground
          ? "#F5F6F7"
          : "white",
        borderRadius: "20px",
        "&:before": {
          display: "none",
        },
      }}
    >
      <AccordionSummary
        className={blackBackground ? "accordionBlack" : ""}
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
