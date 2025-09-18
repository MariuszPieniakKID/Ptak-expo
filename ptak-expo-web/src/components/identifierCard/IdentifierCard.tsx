import {Box, CardContent, Grid} from "@mui/material";
import styles from "./IdentifierCard.module.scss";
import IconMain from "../../assets/group-21.png";
import IconEmail from "../../assets/email.png";
import {Gauge, gaugeClasses} from "@mui/x-charts/Gauge";

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
}

interface IdentifierCardProps {
  data: Identifier;
}

const IdentifierCard: React.FC<IdentifierCardProps> = ({data}) => {
  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <div className={styles.mainHeader}>
          <div className={styles.headerInner}>
            <img alt="główna ikona" src={IconMain} height={54} width={55} />
            <div className={styles.headerTitle}>E-Indentyfikator</div>
          </div>
        </div>
        <div className={styles.cardWrapper}>
          <div className={styles.card}>
            <div className={styles.leftBackground}></div>
            <div className={styles.rightBackground}></div>
            <div className={styles.cardContent}>
              <div className={styles.cardContentUp}>
                <Box className={styles.headerImage}>
                  <img src={data.headerImageUrl} alt={data.eventName} />
                </Box>
                <CardContent className={styles.content}>
                  <p className={styles.title}>{data.eventName}</p>
                  <Grid container spacing={1} className={styles.details}>
                    <Grid size={{xs: 8}}>
                      <p className={styles.label}>Data</p>
                      <p className={styles.value}>
                        {data.dateFrom} – {data.dateTo}
                      </p>
                    </Grid>
                    <Grid size={{xs: 4}}>
                      <p className={styles.label}>Godzina</p>
                      <p className={styles.value}>{data.time}</p>
                    </Grid>
                    <Grid size={{xs: 8}}>
                      <p className={styles.label}>Typ wejściówki</p>
                      <p className={styles.value}>{data.type}</p>
                    </Grid>
                    <Grid size={{xs: 4}}>
                      <p className={styles.label}>ID</p>
                      <p className={styles.value}>{data.id}</p>
                    </Grid>
                    <Grid size={{xs: 12}}>
                      <p className={styles.label}>Miejsce</p>
                      <p className={styles.value}>{data.location}</p>
                    </Grid>
                  </Grid>
                </CardContent>
              </div>
              <div className={styles.dash}></div>
              <div className={styles.cardContentDown}>
                <Grid container alignItems="center" className={styles.footer}>
                  <Grid size={{xs: 6}}></Grid>
                  <Grid size={{xs: 6}}>
                    <p className={styles.qrParagraph}>Twój kod wstępu</p>
                  </Grid>
                  <Grid size={{xs: 6}} className={styles.logo}>
                    <img src={data.logoUrl} alt="Logo" />
                  </Grid>
                  <Grid size={{xs: 6}} className={styles.qr}>
                    <img src={data.qrCodeUrl} alt="QR Code" />
                  </Grid>
                </Grid>
              </div>
            </div>
            <div className={styles.cardDark}>
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
                    __html: `Wysłane<br/>zaproszenia (15 <span>/ 50</span>)`,
                  }}
                ></div>
              </div>
              <div className={styles.cardDarkChart}>
                <div className={styles.cardDarkChartValueContent}>
                  <div
                    className={styles.cardDarkChartValue}
                    dangerouslySetInnerHTML={{
                      __html: `15<span> / 50</span>`,
                    }}
                  ></div>
                  <div className={styles.cardDarkChartDescription}>
                    Zaproszeń
                  </div>
                </div>
                <Gauge
                  width={120}
                  height={120}
                  value={15}
                  valueMax={50}
                  cornerRadius="50%"
                  sx={(theme) => ({
                    [`& .${gaugeClasses.valueText}`]: {
                      fontSize: 16,
                      display: "none",
                    },
                    [`& .${gaugeClasses.valueArc}`]: {
                      fill: "#6F87F6",
                    },
                    [`& .${gaugeClasses.referenceArc}`]: {
                      fill: theme.palette.text.disabled,
                    },
                  })}
                />
              </div>
              <div className={styles.cardDarkOtherContentTitle}>
                Biznes Priority Pass
              </div>
              <div className={styles.cardDarkOtherContentPrice}>
                bilet o wartości 249 PLN
              </div>
              <div className={styles.cardDarkOtherContentDescription}>
                Zaproś swoich najważniejszych klientów i partnerów, aby
                odwiedzili Cię na targach w wyjątkowych warunkach. Każda osoba
                zaproszona przez Ciebie przez aplikację otrzyma imienny
              </div>
              <button className={styles.cardDarkOtherContentButton}>
                Przejdź do generatora zaproszeń
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IdentifierCard;


