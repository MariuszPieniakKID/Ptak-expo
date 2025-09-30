import React, { useEffect, useState, useCallback } from "react";
import { Box, Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import styles from "./ExhibitoiIdentifiers.module.scss";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Exhibitor, fetchExhibitorPeople, type ExhibitorPerson } from "../../services/api";
import { ReactComponent as  BadgesIcon} from '../../assets/blue_badgesIcon.svg';
import IdentifiersCard from "./identifiersCard/IdentifiersCard";
import { useAuth } from "../../contexts/AuthContext";

type ExhibitoiIdentifiersProps = {
  allowMultiple?: boolean;
  exhibitorId: number;
  exhibitor?: Exhibitor;
  exhibitionId?: number;
};

function ExhibitoiIdentifiers({
  allowMultiple = true,
  exhibitorId,
  exhibitor,
  exhibitionId,
}: ExhibitoiIdentifiersProps) {

  const { token } = useAuth();
  const [people, setPeople] = useState<ExhibitorPerson[]>([]);
  const [error, setError] = useState<string>("");

  const load = useCallback(async () => {
    if (!token || !exhibitorId || !exhibitionId) { setPeople([]); return; }
    try {
      const list = await fetchExhibitorPeople(token, { exhibitorId, exhibitionId });
      setPeople(list);
      setError("");
    } catch (e: any) {
      setError(e?.message || "Nie udało się pobrać identyfikatorów");
      setPeople([]);
    }
  }, [token, exhibitorId, exhibitionId]);

  useEffect(() => { load(); }, [load]);

  const data = people.map(p => ({ id: p.id, imieNazwisko: p.fullName, typ: p.type || "" }));



  // Definicja sekcji
  const items = [
    {
      icon: <BadgesIcon fontSize="small" />,
      title: "Identyfikatory",
      container: <IdentifiersCard data={data}/>,
    }
    
  ];

  // Stany accordionów
  const [expandedAccordions, setExpandedAccordions] = useState<boolean[]>(Array(items.length).fill(false));
  const [expandedOne, setExpandedOne] = useState<number | false>(false);

  const handleChangeMultiple = (index: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordions((prev) => prev.map((opened, i) => (i === index ? isExpanded : opened)));
  };

  const handleChangeSingle = (index: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedOne(isExpanded ? index : false);
  };

  const alwaysOpenIndexes = [0, 1, 2, 3];
  const overlapIndexes = [1, 2];
    
  useEffect(() => {
     console.log('exhibitorId:', exhibitorId, 'exhibitionId:', exhibitionId, 'exhibitor:', exhibitor)
    }, [exhibitorId, exhibitionId, exhibitor]); 
  
  return (
    <Box className={styles.container}>
      {items.map((item, idx) => {
        const isLastAccordion = idx === items.length - 1;
        const isAlwaysOpen = alwaysOpenIndexes.includes(idx);

        return (
          <React.Fragment key={item.title}>
            {isLastAccordion && <Box sx={{ height: 40 }} />}

            <Accordion
              expanded={isAlwaysOpen ? true : allowMultiple ? expandedAccordions[idx] : expandedOne === idx}
            onChange={
            isAlwaysOpen
              ? () => {} 
              : allowMultiple
              ? handleChangeMultiple(idx)
              : handleChangeSingle(idx)
          }
              disableGutters
              elevation={0}
              square
              sx={{
                padding: "0px 24px !important",
               '@media (max-width:440px)': {
                padding: '0px 8px !important',
              },
                borderRadius: "20px",
                backgroundColor: idx % 2 === 0 ? "#f5f5f5" : "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                border: "none",
                position: "relative",
                "&:before": { display: "none" },
                zIndex: isAlwaysOpen ? 2 : 1,
                ...(overlapIndexes.includes(idx) && { mt: -3, mb: -3 }),
                ...(!overlapIndexes.includes(idx) && { marginBottom: "40px" }),
              }}
            >
              <AccordionSummary
                expandIcon={
                  !isAlwaysOpen && (
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
                      }}
                    >
                      <ExpandMoreIcon sx={{ color: "#6f87f6", fontSize: 28 }} />
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginTop:'1em' }}>
                  {item.icon && (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",


                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: idx % 2 === 0 ? "#fff" : "#f5f5f5",
                        boxShadow: "0 2px 8px rgba(94,101,119,0.06)",
                      }}
                    >
                      {item.icon}
                    </Box>
                  )}
                  <Typography 
                  sx={{ fontWeight: 600, 
                    fontSize: "1rem", 
                    '@media (max-width:440px)': {
                    fontSize:'13px',
                  },
                   }} component="span">
                    {item.title}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ borderRadius: "0 0 20px 20px", pb: 2, pt: 1.5 }}>
                {item.container}
              </AccordionDetails>
            </Accordion>
          </React.Fragment>
        );
      })}
    </Box>
  );
}

export default ExhibitoiIdentifiers;