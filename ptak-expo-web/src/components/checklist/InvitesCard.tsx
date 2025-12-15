import { ThemeProvider, Typography } from "@mui/material";
import { blackTheme } from "./ElectronicIdsCard";
import { Box } from "@mui/material";
import ChecklistCard from "./checklistCard";
import { useChecklist } from "../../contexts/ChecklistContext";
import styles from "../../pages/ChecklistPage.module.scss";
import IconEmails from "../../assets/invitationIconWhite.png";
import InvitationProgress from "../chart/InvitationProgress";

export default function InvitesCard() {
  const { checklist, filled } = useChecklist();
  return (
    <ThemeProvider theme={blackTheme}>
      <ChecklistCard
        blackBackground
        title={
          <Typography
            fontSize={16}
            color="#fff"
            fontWeight={700}
            className={styles.invitesCardHeader}
          >
            Wysłane zaproszenia ({checklist.sentInvitesCount}/
            {checklist.availableInvitesCount})
          </Typography>
        }
        icon={<img src={`/assets/checklist-step-1.svg`} alt="" />}
        checked={filled[3]}
      >
        <>
          <Box className={styles.invitationTextContainer}>
            <Box
              sx={{
                display: "block",
                color: "#fff",
                margin: "auto",
              }}
            >
              {/* <Box
                sx={{
                  display: "flex",
                  color: "#fff",
                  marginTop: "auto",
                }}
              >
                <CustomTypography className={styles.invitationCount}>
                  {checklist.sentInvitesCount}
                </CustomTypography>
                <CustomTypography className={styles.invitationLimit}>
                  /{checklist.availableInvitesCount}
                </CustomTypography>
              </Box>

              <CustomTypography className={styles.invitationText}>
                Zaproszeń
              </CustomTypography>
             */}
              <InvitationProgress
                invites={checklist.sentInvitesCount}
                limit={checklist.availableInvitesCount}
              />
            </Box>
            <Box className={styles.eventInvitationRightContainer}>
              <Box
                sx={{
                  fontWeight: 700,
                  color: "#fff",
                  marginTop: "8px",
                  ml: "8px",
                  fontSize: "18px",
                  lineHeight: "100%",
                  mb: "8px",
                }}
              >
                Biznes Priority Pass
              </Box>
              <Box
                sx={{
                  color: "#6F87F6",
                  mb: "8px",
                  fontSize: "13px",
                  lineHeight: "100%",
                  ml: "8px",
                }}
              >
                bilet o wartości x PLN
              </Box>
              <Box
                sx={{
                  color: "#A7A7A7",
                  fontSize: "13px",
                  lineHeight: "100%",
                  ml: "8px",
                  mr: "8px",
                }}
              >
                Zaproś swoich najważniejszych klientów i partnerów, aby
                odwiedzili Cię na targach w wyjątkowych warunkach. Każda osoba
                zaproszona przez Ciebie przez aplikację otrzyma imienny
              </Box>
            </Box>
          </Box>
          <button
            className={styles.cardDarkOtherContentButton}
            onClick={() => {
              try {
                const parts = window.location.pathname
                  .split("/")
                  .filter(Boolean);
                const idx = parts.findIndex((p) => p === "event");
                const eventId =
                  idx >= 0 && parts[idx + 1] ? parts[idx + 1] : "";
                if (eventId) {
                  window.location.href = `/event/${eventId}/invitations`;
                } else {
                  window.location.href = `/invitations`;
                }
              } catch {
                window.location.href = `/invitations`;
              }
            }}
          >
            <img
              src={IconEmails}
              className={styles.inviteButtonIcon}
              alt="ikona zaproszenia"
              width={26}
              height={19}
            />
            Przejdź do generatora zaproszeń
          </button>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {Array.isArray(checklist.sentInvites) &&
            checklist.sentInvites.length > 0 ? (
              checklist.sentInvites.slice(0, 5).map((row) => (
                <Box
                  key={row.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 0.5,
                    borderBottom: "1px solid #d7d9dd",
                  }}
                >
                  <Typography
                    fontSize={12}
                    sx={{
                      mr: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "#A7A7A7",
                    }}
                  >
                    {(row.recipientName || row.recipientEmail) +
                      (row.recipientName
                        ? `, ${row.invitationType}`
                        : ` (${row.invitationType})`)}
                  </Typography>
                  <Typography fontSize={12} sx={{ color: "#6F87F6" }}>
                    {row.status}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography fontSize={12} sx={{ color: "#A7A7A7" }}>
                Brak wysłanych zaproszeń
              </Typography>
            )}
          </Box>
        </>
      </ChecklistCard>
    </ThemeProvider>
  );
}
