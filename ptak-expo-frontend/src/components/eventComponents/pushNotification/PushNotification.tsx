import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import {ReactComponent as DocumentIcon} from'../../../assets/documentIconBlue.svg';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box } from '@mui/material';
import { useState } from 'react';
import styles from './PushNotification.module.scss';

import { Exhibition } from '../../../services/api';
import PushNotificationContent from './pushNotificationContent/PushNotificationContent';



type PushNotificationProps = {
  allowMultiple?: boolean; 
  alwaysExpanded?: boolean; 
  event: Exhibition;
};

function PushNotification({ 
  allowMultiple = true,
  alwaysExpanded = false,
  event,
}: PushNotificationProps) {
    
 const items =[
    {
      icon: <DocumentIcon fontSize="small" />,
      title: 'Powiadomienia Push',
      container: <PushNotificationContent event={event}/>,
    }]

  const [expandedAccordions, setExpandedAccordions] = useState<boolean[]>(Array(items.length).fill(false));
  const [expandedOne, setExpandedOne] = useState<number | false>(false);

  const handleChangeMultiple = (index: number) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedAccordions(prev =>
      prev.map((opened, i) => (i === index ? isExpanded : opened))
    );
  };

  const handleChangeSingle = (index: number) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedOne(isExpanded ? index : false);
  };

  return (
    <Box className={styles.container}>
      {items.map((item, idx) => {
        // logika czy ten accordion ma być rozwinięty
        const isExpanded = alwaysExpanded
          ? true
          : allowMultiple
            ? expandedAccordions[idx]
            : expandedOne === idx;

        // Poprawka: nigdy nie przekazujemy undefined - dajemy pustą funkcję, jeśli alwaysExpanded
        const handleChange = alwaysExpanded
          ? () => {}
          : allowMultiple
            ? handleChangeMultiple(idx)
            : handleChangeSingle(idx);

        const accordionBg = idx % 2 === 0 ? "#f5f5f5" : "#fff";
        const iconBg = idx % 2 === 0 ? "#fff" : "#f5f5f5";

        return (
          <Accordion
            key={item.title}
            expanded={isExpanded}
            onChange={handleChange}
            disableGutters
            elevation={0}
            square
            sx={{
              padding: '0px 24px !important',
              '@media (max-width:440px)': {
                padding: '0px 8px !important',
              },
              borderRadius: "20px",
              backgroundColor: accordionBg,
              boxShadow: "none",
              border: "none",
              position: "relative",
              '&:before': {
                display: 'none',
              },
              zIndex: 'auto',
            }}
          >
            <AccordionSummary
              expandIcon={
                !alwaysExpanded && (
                  <Box
                    sx={{
                      width: 35,
                      height: 35,
                      borderRadius: "50%",
                      backgroundColor: "#fafbfb",
                      border: "2px solid #fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    <ExpandMoreIcon sx={{ color: '#6f87f6', fontSize: 28 }} />
                  </Box>
                )
              }
              aria-controls={`panel${idx + 1}-content`}
              id={`panel${idx + 1}-header`}
              sx={{
                borderRadius: "20px",
                minHeight: 56,
                "&.Mui-expanded": { minHeight: 56 },
                '@media (max-width:440px)': {
                  padding: '0px 0px !important',
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: iconBg,
                    boxShadow: "0 2px 8px 0 rgba(94,101,119,0.06)",
                  }}
                >
                  {item.icon}
                </Box>
                <Typography
                  sx={{
                    margin: "24px 0",
                    fontWeight: 600,
                    fontSize: '1rem',
                    '@media (max-width:440px)': {
                      fontSize: '13px',
                    },
                  }}
                  component="span"
                >
                  {item.title}
                </Typography>
              </Box>
            </AccordionSummary>

            <AccordionDetails
              sx={{
                borderRadius: "0 0 20px 20px",
                pb: 2,
                pt: 1.5,
              }}
            >
              <Typography
                sx={{
                  margin: '0px 0px',
                  marginBottom: '30px',
                }}
                component="div"
              >
                {item.container}
              </Typography>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}

export default PushNotification;