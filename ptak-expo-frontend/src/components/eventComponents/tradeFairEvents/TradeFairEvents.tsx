import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import {ReactComponent as DocumentIcon} from'../../../assets/documentIconBlue.svg';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import styles from './TradeFairEvents.module.scss';

import { Exhibition, getTradeEvents, TradeEvent } from '../../../services/api';
import TradeFairEventsContent from './tradeFairEventsContent/TradeFairEventsContent';
import AccompanyingEvents from './accompanyingEvents/AccompanyingEvents';
import { useAuth } from '../../../contexts/AuthContext';
import { tradeEventsMock } from '../../../helpers/mockData';


// removed local default newEvent; form handled in child content

type TradeFairEventsProps = {
  allowMultiple?: boolean; 
  alwaysExpanded?: boolean; 
  event: Exhibition;
};

function TradeFairEvents({ 
  allowMultiple = true,
  alwaysExpanded = false,
  event,
}: TradeFairEventsProps) {

  const { token } = useAuth();
  const [expandedAccordions, setExpandedAccordions] = useState<boolean[]>([false, false]);
  const [expandedOne, setExpandedOne] = useState<number | false>(false);
  const [tradeEvents, setTradeEvents] = useState<TradeEvent[]>([]);
  // child manages its own form state for official events

  const loadTradeEvents = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getTradeEvents(event.id, token);
      // setTradeEvents(res.data || []);
      setTradeEvents(tradeEventsMock); //TYLKO DO TESTÓW 
    } catch (_e: any) {
      // ignore for now; child content handles errors in its own flow
    }
  }, [event.id, token]);

  useEffect(() => {
    loadTradeEvents();
  }, [loadTradeEvents]);

  // removed unused handler (child manages its own form)

  // save handled in child in current UI
  


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
  const items =[
    {
      id: 1,
      icon: <DocumentIcon fontSize="small" />,
      title: 'Oficjalne wydarzenia targowe',
      container: (
        <TradeFairEventsContent
          event={event}
        />
      ),
    },
    {
      id: 2,
      icon: null,
      title: <>Wszystkie wydarzenia towarzyszące ({tradeEvents.length})</>,
      container: (
        <AccompanyingEvents 
        event={event} 
        tradeEvents={tradeEvents} 
        />
      ),
      style: {
        backgroundColor: '#2b2b2d',
        boxShadow: '0px -34px 24px #2E2E380D',
        border: '1px solid #4D4C4F',
        titleColor: '#EEEFF1',
      },
      showBadge: false
    }
  ];

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
        const {
          backgroundColor = accordionBg,
          boxShadow = 'none',
          border = 'none',
          titleColor=''
          
          } = item.style || {}; 

        return (
          
          <Accordion
            key={item.id}
            expanded={isExpanded}
            onChange={handleChange}
            disableGutters
            elevation={0}
            square
           sx={{
              mb: idx !== items.length - 1 ? '2rem' : 0,
              padding: '0px 24px !important',
              '@media (max-width:440px)': {
                padding: '0px 8px !important',
              },
              borderRadius: "20px",
              backgroundColor,
              boxShadow,
              border,
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
                 {item.icon && <Box
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
                </Box>}
                <Typography
                  sx={{
                    margin: "24px 0",
                    fontWeight: 600,
                    fontSize: '1rem',
                    color:titleColor,
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
                marginBottom:'1.5rem',
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

export default TradeFairEvents;