import { Box, CardContent, Grid } from "@mui/material";
import styles from "./IdentifierCard.module.scss";
import IconMain from "../../assets/group-21.png";
import IconEmail from "../../assets/email.png";
import { Ticket } from "../ticket";
import InvitationProgress from "../chart/InvitationProgress";

export interface Identifier {
  id: string;
  eventName: string;
  dateFrom: string;
  dateTo: string;
  time: string;
  type: string;
  location: string;
  qrCodeUrl: string;
  headerImageUrl: string;
  logoUrl: string;
  invitesSentCount?: number;
  invitesLimit?: number;
  vipValue?: string;
}

interface IdentifierCardProps {
  data: Identifier;
}

const IdentifierCard: React.FC<IdentifierCardProps> = ({ data }) => {
  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <div className={styles.mainHeader}>
          <div className={styles.headerInner}>
            <img alt="główna ikona" src={IconMain} height={54} width={55} />
            <div className={styles.headerTitle}>E-Indentyfikator</div>
          </div>
        </div>
        <Ticket
          contentUp={
            <>
              <Box className={styles.headerImage}>
                <img src={data.headerImageUrl} alt={data.eventName} />
              </Box>
              <CardContent className={styles.content}>
                <p className={styles.title}>{data.eventName}</p>
                <Grid container spacing={1} className={styles.details}>
                  <Grid size={{ xs: 8 }}>
                    <p className={styles.label}>Data</p>
                    <p className={styles.value}>
                      {data.dateFrom} – {data.dateTo}
                    </p>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <p className={styles.label}>Godzina</p>
                    <p className={styles.value}>{data.time}</p>
                  </Grid>
                  <Grid size={{ xs: 8 }}>
                    <p className={styles.label}>Typ wejściówki</p>
                    <p className={styles.value}>{data.type}</p>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <p className={styles.label}>ID</p>
                    <p className={styles.value}>{data.id}</p>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <p className={styles.label}>Miejsce</p>
                    <p className={styles.value}>{data.location}</p>
                  </Grid>
                </Grid>
              </CardContent>
            </>
          }
          contentDown={
            <Grid container alignItems="center" className={styles.footer}>
              <Grid size={{ xs: 6 }}></Grid>
              <Grid size={{ xs: 6 }}>
                <p className={styles.qrParagraph}>Twój kod wstępu</p>
              </Grid>
              <Grid size={{ xs: 6 }} className={styles.logo}>
                <img src={data.logoUrl} alt="Logo" />
              </Grid>
              <Grid size={{ xs: 6 }} className={styles.qr}>
                <img src={data.qrCodeUrl} alt="QR Code" />
              </Grid>
            </Grid>
          }
          contentDark={
            <>
              <div className={styles.cardDarkHeader}>
                <div className={styles.cardDarkHeaderIcon}>
                  <img
                    alt="ikona koperty"
                    src={IconEmail}
                    height={15}
                    width="auto"
                  />
                </div>
                <div
                  className={styles.cardDarkHeaderTitle}
                  dangerouslySetInnerHTML={{
                    __html: `Wysłane<br/>zaproszenia (${
                      Number.isFinite(data.invitesSentCount)
                        ? data.invitesSentCount
                        : 0
                    } <span>/ ${
                      Number.isFinite(data.invitesLimit)
                        ? data.invitesLimit
                        : 50
                    }</span>)`,
                  }}
                ></div>
              </div>
              {/* Chart hidden as requested */}
              <InvitationProgress
                invites={
                  Number.isFinite(data.invitesSentCount)
                    ? data.invitesSentCount!
                    : 0
                }
                limit={
                  Number.isFinite(data.invitesLimit) ? data.invitesLimit! : 50
                }
              />
              {/* <Chart value={Number.isFinite(data.invitesSentCount) ? (data.invitesSentCount as number) : 0} valueMax={Number.isFinite(data.invitesLimit) ? (data.invitesLimit as number) : 50} /> */}
              <div className={styles.cardDarkOtherContentTitle}>
                Business Priority Pass
              </div>
              <div className={styles.cardDarkOtherContentPrice}>
                {data.vipValue && data.vipValue.trim().length > 0
                  ? `bilet o wartości ${data.vipValue}`
                  : ""}
              </div>
              <div className={styles.cardDarkOtherContentDescription}>
                Zaproś swoich najważniejszych klientów i partnerów, aby
                odwiedzili Cię na targach w wyjątkowych warunkach. Każda osoba
                zaproszona przez Ciebie przez aplikację otrzyma imienny
              </div>
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
                Przejdź do generatora zaproszeń
              </button>
            </>
          }
        />
      </main>
    </div>
  );
};

export default IdentifierCard;
