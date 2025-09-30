import React, { useEffect, useState } from "react";
import { Box, Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import styles from "./ExhibitorTradeFairAwards.module.scss";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ExhibitorAward, getExhibitorAward, saveExhibitorAward, addExhibitorAwardMessage, listExhibitorAwardMessages } from "../../services/api";
import { ReactComponent as  TradeAwardcIcon} from '../../assets/trade_fair_awardsIcon.svg';
import ContentOfTheExhibitorsApplication from "./contentOfTheExhibitorsApplication/ContentOfTheExhibitorsApplication";
import { useAuth } from "../../contexts/AuthContext";
import TextEditor from "../textEditor/TextEditor";
import CustomTypography from "../customTypography/CustomTypography";
import CustomButton from "../customButton/CustomButton";

 type ExhibitorTradeFairAwardsProps = {
   allowMultiple?: boolean;
   exhibitorId: number;
   exhibitionId?: number; // selected event
 };

 function ExhibitorTradeFairAwards({
   allowMultiple = true,
   exhibitorId,
   exhibitionId,
 }: ExhibitorTradeFairAwardsProps) {
   const { token } = useAuth();
   const [expandedAccordions, setExpandedAccordions] = useState<boolean[]>([false]);
   const [expandedOne, setExpandedOne] = useState<number | false>(false);
   const [loading, setLoading] = useState<boolean>(false);
   const [error, setError] = useState<string>("");
   const [success, setSuccess] = useState<string>("");
   const [award, setAward] = useState<ExhibitorAward | null>(null);
   const [draftText, setDraftText] = useState<string>("");
   const [isEditing, setIsEditing] = useState<boolean>(false);
   const [messages, setMessages] = useState<Array<{ id: number; message: string; created_at?: string }>>([]);

   const items = [
     {
       icon: <TradeAwardcIcon fontSize="small" />,
       title: "Nagrody targowe",
       container: (
         <ContentOfTheExhibitorsApplication
           data={(award ? [{ id: award.id || 0, message: award.applicationText }] : []).concat(
             messages.map(m => ({ id: m.id, message: m.message }))
           )}
           onAddMessage={async (text: string) => {
             if (!token || !exhibitionId) return;
             try {
               const row = await addExhibitorAwardMessage(exhibitorId, exhibitionId, text, token);
               setMessages(prev => [{ id: row.id, message: row.message, created_at: row.created_at }, ...prev]);
             } catch (e: any) {
               setError(e?.message || 'Nie udało się zapisać wiadomości');
             }
           }}
         />
       ),
     },
   ];

   const handleChangeMultiple = (index: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
     setExpandedAccordions((prev) => prev.map((opened, i) => (i === index ? isExpanded : opened)));
   };

   const handleChangeSingle = (index: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
     setExpandedOne(isExpanded ? index : false);
   };

   const alwaysOpenIndexes = [0];
   const overlapIndexes = [] as number[];

   useEffect(() => {
     const load = async () => {
       if (!token || !exhibitionId) {
         setAward(null);
         setDraftText("");
         setMessages([]);
         return;
       }
       try {
         setLoading(true);
         setError("");
         const res = await getExhibitorAward(exhibitorId, exhibitionId, token);
         if (res.success && res.data) {
           setAward(res.data);
           setDraftText(res.data.applicationText || "");
           setIsEditing(false);
         } else {
           setAward(null);
           setDraftText("");
           setIsEditing(true);
         }
         try {
           const list = await listExhibitorAwardMessages(exhibitorId, exhibitionId, token);
           setMessages(list);
         } catch {}
       } catch (e: any) {
         setError(e?.message || "Błąd podczas pobierania zgłoszenia");
       } finally {
         setLoading(false);
       }
     };
     load();
   }, [token, exhibitorId, exhibitionId]);

   const handleSave = async () => {
     if (!token || !exhibitionId) return;
     try {
       setLoading(true);
       setError("");
       const res = await saveExhibitorAward(exhibitorId, exhibitionId, { applicationText: draftText, status: award?.status ?? 'draft' }, token);
       if (res.success) {
         setAward(res.data);
         setSuccess('Zapisano.');
         setIsEditing(false);
         setTimeout(() => setSuccess(""), 1500);
       }
     } catch (e: any) {
       setError(e?.message || "Błąd podczas zapisywania");
     } finally {
       setLoading(false);
     }
   };

   return (
     <Box className={styles.container}>
       {items.map((item, idx) => {
         const isLastAccordion = idx === items.length - 1;
         const isAlwaysOpen = alwaysOpenIndexes.includes(idx);
         const isFirstAccordion = idx === 0;

         return (
           <React.Fragment key={item.title}>
             {isLastAccordion && <Box sx={{ height: 40 }} />}

             <Accordion
               expanded={isAlwaysOpen ? true : allowMultiple ? expandedAccordions[idx] : expandedOne === idx}
               onChange={isAlwaysOpen ? () => {} : allowMultiple ? handleChangeMultiple(idx) : handleChangeSingle(idx)}
               disableGutters
               elevation={0}
               square
               sx={{
                 padding: "0px 24px !important",
                 '@media (max-width:440px)': { padding: '0px 8px !important' },
                 borderRadius: "20px",
                 backgroundColor: isFirstAccordion ? "#fff" : idx % 2 === 0 ? "#f5f5f5" : "#fff",
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
                 expandIcon={!isAlwaysOpen && (
                   <Box sx={{
                     width: 35,
                     height: 35,
                     borderRadius: "50%",
                     backgroundColor: "#fafbfb",
                     border: "2px solid #fff",
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                   }}>
                     <ExpandMoreIcon sx={{ color: "#6f87f6", fontSize: 28 }} />
                   </Box>
                 )}
                 aria-controls={`panel${idx + 1}-content`}
                 id={`panel${idx + 1}-header`}
                 sx={{
                   borderRadius: "20px",
                   minHeight: 56,
                   "&.Mui-expanded": { minHeight: 56 },
                   '@media (max-width:440px)': { padding: '0px 0px !important' },
                 }}
               >
                 <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginTop: "1em" }}>
                   {item.icon && (
                     <Box sx={{
                       width: 40,
                       height: 40,
                       borderRadius: "50%",
                       display: "flex",
                       alignItems: "center",
                       justifyContent: "center",
                       backgroundColor: isFirstAccordion ? "#f5f5f5" : idx % 2 === 0 ? "#fff" : "#f5f5f5",
                       boxShadow: "0 2px 8px rgba(94,101,119,0.06)",
                     }}>
                       {item.icon}
                     </Box>
                   )}
                   <Typography sx={{ fontWeight: 600, fontSize: "1rem", '@media (max-width:440px)': { fontSize:'13px' }}} component="span">
                     {item.title}
                   </Typography>
                 </Box>
               </AccordionSummary>

               <AccordionDetails sx={{ borderRadius: "0 0 20px 20px", pb: 2, pt: 1.5 }}>
                 {award && !isEditing ? (
                   <ContentOfTheExhibitorsApplication data={[{ id: award.id || 0, message: award.applicationText }]} />
                 ) : (
                   <Box>
                     <CustomTypography className={styles.titleLabel}>Zgłoszenie do nagrody targowej</CustomTypography>
                     <TextEditor
                       legend="Treść zgłoszenia"
                       value={draftText}
                       onChange={setDraftText}
                       maxLength={750}
                       showToolbar={true}
                     />
                   </Box>
                 )}
                 <Box sx={{ display: 'flex', gap: 12, mt: 2 }}>
                   {!award || isEditing ? (
                     <CustomButton onClick={handleSave} disabled={loading || !exhibitionId}>
                       Zapisz zgłoszenie
                     </CustomButton>
                   ) : (
                     <CustomButton onClick={() => setIsEditing(true)}>
                       Edytuj zgłoszenie
                     </CustomButton>
                   )}
                 </Box>
                 {error && <div className={styles.error}>{error}</div>}
                 {success && <div className={styles.success}>{success}</div>}
               </AccordionDetails>
             </Accordion>
           </React.Fragment>
         );
       })}
     </Box>
   );
 }

 export default ExhibitorTradeFairAwards;