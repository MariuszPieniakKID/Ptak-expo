import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import styles from './IdentifierCard.module.scss';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');
  return (
    <Card className={styles.card}>
      {/* HEADER IMAGE */}
      <Box className={styles.headerImage}>
        <img src={data.headerImageUrl} alt={data.eventName} />
      </Box>

      {/* CONTENT */}
      <CardContent className={styles.content}>
        <Typography variant="h6" className={styles.title}>
          {data.eventName}
        </Typography>

        <Grid container spacing={1} className={styles.details}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" className={styles.label}>
              {t('identifier.date')}
            </Typography>
            <Typography variant="body2" className={styles.value}>
              {data.dateFrom} – {data.dateTo}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" className={styles.label}>
              {t('identifier.hour')}
            </Typography>
            <Typography variant="body2" className={styles.value}>
              {data.time}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" className={styles.label}>
              {t('identifier.type')}
            </Typography>
            <Typography variant="body2" className={styles.value}>
              {data.type}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" className={styles.label}>
              ID
            </Typography>
            <Typography variant="body2" className={styles.value}>
              {data.id}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" className={styles.label}>
              {t('identifier.place')}
            </Typography>
            <Typography variant="body2" className={styles.value}>
              {data.location}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>

      {/* SEPARATOR */}
      <Box className={styles.separator}>
        <div className={styles.cutLeft}></div>
        <div className={styles.dash}></div>
        <div className={styles.cutRight}></div>
      </Box>

      {/* FOOTER */}
      <Grid container alignItems="center" className={styles.footer}>
        <Grid size={{ xs: 6 }} className={styles.logo}>
          <img src={data.logoUrl} alt="Logo" />
        </Grid>
        <Grid size={{ xs: 6 }} className={styles.qr}>
          <Box>
            <Typography variant="caption" pb={12}>
              {t('identifier.code')}
            </Typography>
          </Box>
          <img src={data.qrCodeUrl} alt="QR Code" />
        </Grid>
      </Grid>
    </Card>
  );
};

export default IdentifierCard;
