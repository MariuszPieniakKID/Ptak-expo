import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import { ReactComponent as EnvelopeOnABlackBackground } from '../../assets/envelopeOnABlackBackground.svg';
import { ReactComponent as GreenCircle } from '../../assets/greenCircleWithChecked.svg';
import { Box } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import styles from './ExhibitorInvitations.module.scss';
import { Exhibitor } from '../../services/api';
import TicketType from './ticketType/TicketType';
import StatusOfSentInvitations from './statusOfSentInvitations/StatusOfSentInvitations';
import { useAuth } from '../../contexts/AuthContext';
import { listInvitationRecipients, type InvitationRecipientRow } from '../../services/api';



type ExhibitorInvitationsProps = {
  exhibitorId: number;
  exhibitor?: Exhibitor;
  exhibitionId?: number; // required to fetch recipients
};



 



function ExhibitorInvitations({ 
  exhibitorId,
  exhibitor,
  exhibitionId
}: ExhibitorInvitationsProps) {

  const { token } = useAuth();
  const [recipients, setRecipients] = useState<InvitationRecipientRow[]>([]);

  const loadRecipients = useCallback(async () => {
    if (!token || !exhibitionId) { setRecipients([]); return; }
    try {
      const rows = await listInvitationRecipients(exhibitionId, token);
      setRecipients(rows);
    } catch {
      setRecipients([]);
    }
  }, [token, exhibitionId]);

  useEffect(() => { loadRecipients(); }, [loadRecipients]);


  //dane do przygotowania
    const sampleTickets =   [{
        id: 1,
        type: "Biznes Priority Pass",
        price: 249,
        numberInvitedguests: 50,
        invitationLimit: 50
      }]


  const items = [
    {
      id: 1,
      icon: <EnvelopeOnABlackBackground fontSize="small" />,
      title: <>Wysłane zaproszenia ({sampleTickets[0].numberInvitedguests}/ <span style={{ color: '#7A7A7A', fontSize: '11px' }}>50</span>)</>,
      container: <TicketType data={sampleTickets}/>,
      showBadge: true // tu pojawi się zielone kółko
    },
    {
      id: 2,
      icon: null,
      title: <>Wysłane zaproszenia {recipients.length > 0 ? `(${recipients.length})` : ''}</>,
      container: <StatusOfSentInvitations data={recipients.map((r, idx) => ({
        id: r.id,
        fullName: r.recipientName || r.recipientEmail,
        email: r.recipientEmail,
        status: (r.status && r.status.toLowerCase() === 'wysłane') ? 'Wysłane' : 'Wysłane',
        reminder: undefined,
      }))}/>,
      showBadge: false
    }
  ];

  // Accordions are always expanded in current design; remove unused state to satisfy CI lint rules

  useEffect(() => {
    console.log('exhibitorId:', exhibitorId, 'exhibitionId:', exhibitionId, 'exhibitor:', exhibitor);
  }, [exhibitorId, exhibitionId, exhibitor]);

  return (
    <Box className={styles.container}>
      {items.map((item, idx) => {
        const isExpanded = true;

        return (
          <Accordion
            key={item.id}
            expanded={isExpanded}
            disableGutters
            elevation={0}
            square
            sx={{
              padding: '0px 24px !important',
              '@media (max-width:440px)': {
                padding: '0px 8px !important',
              },
              borderRadius: '20px',
              backgroundColor: '#2B2B2D',
              boxShadow: '0px -34px 24px #2E2E380D',
              border: '1px solid #4D4C4F',
              position: 'relative',
              '&:before': { display: 'none' },
              zIndex: 2,
              mt: idx === 0 ? 0 : -3,
              mb: -3
            }}
          >
            <AccordionSummary
              expandIcon={null}
              aria-controls={`panel${idx + 1}-content`}
              id={`panel${idx + 1}-header`}
              sx={{
                borderRadius: '20px',
                minHeight: 56,
                "&.Mui-expanded": { minHeight: 56 },
                '@media (max-width:440px)': {
                  padding: '0px 0px !important',
                },                 
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                
                {/* Ikona z opcjonalnym badge */}
                {item.icon && (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#1E1E1F",
                      boxShadow: "0 2px 8px 0 rgba(94,101,119,0.06)",
                      position: "relative"
                    }}
                  >
                    {item.icon}

                    {item.showBadge && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: -6,
                          right: 4,
                          width: 16,
                          height: 16
                        }}
                      >
                        <GreenCircle />
                      </Box>
                    )}
                  </Box>
                )}

                {/* Tytuł */}
                <Typography 
                  sx={{ 
                    margin: "24px 0",
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: '#EEEFF1',
                   '@media (max-width:440px)': {
                    fontSize:'13px',
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
                pt: 1.5
              }}
            >
              <Typography
                sx={{
                  margin: '0px 0px',
                  marginBottom: '30px',
                  color: '#EEEFF1'
                }}
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

export default ExhibitorInvitations;
