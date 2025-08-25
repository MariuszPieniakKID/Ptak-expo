import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import styles from './IdentifierCard.module.scss';

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

const IdentifierCard: React.FC<IdentifierCardProps> = ({ data }) => {
  return (
    <Card className={styles.card}>
      <Box className={styles.headerImage}>
        <img src={data.headerImageUrl} alt={data.eventName} />
      </Box>
      <CardContent className={styles.content}>
        <Typography variant="h6" className={styles.title}>{data.eventName}</Typography>
        <Grid container spacing={1} className={styles.details}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" className={styles.label}>Data</Typography>
            <Typography variant="body2" className={styles.value}>{data.dateFrom} – {data.dateTo}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" className={styles.label}>Godzina</Typography>
            <Typography variant="body2" className={styles.value}>{data.time}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" className={styles.label}>Typ</Typography>
            <Typography variant="body2" className={styles.value}>{data.type}</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" className={styles.label}>ID</Typography>
            <Typography variant="body2" className={styles.value}>{data.id}</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" className={styles.label}>Miejsce</Typography>
            <Typography variant="body2" className={styles.value}>{data.location}</Typography>
          </Grid>
        </Grid>
      </CardContent>
      <Box className={styles.separator}>
        <div className={styles.dash}></div>
      </Box>
      <Grid container alignItems="center" className={styles.footer}>
        <Grid size={{ xs: 6 }} className={styles.logo}><img src={data.logoUrl} alt="Logo" /></Grid>
        <Grid size={{ xs: 6 }} className={styles.qr}>
          <Typography variant="caption" pb={12}>Kod QR</Typography>
          <img src={data.qrCodeUrl} alt="QR Code" />
        </Grid>
      </Grid>
    </Card>
  );
};

export default IdentifierCard;


