import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material';
import EventLayout from '../components/eventLayout/EventLayout';
import styles from './EventHomePage.module.scss';
import { useParams, useNavigate } from 'react-router-dom';

const EventHomePage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Temporary mock data; replace with API when available
  const event = {
    id: eventId || '1',
    title: 'Fashion Expo 2025',
    dateFrom: '12.05.2025',
    dateTo: '16.05.2025',
    readiness: 45,
    logoUrl: '/assets/logo192.png',
    daysLeft: 32,
  };

  return (
    <EventLayout
      left={
        <Box className={styles.leftContainer}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600}>Witaj!</Typography>
              <Typography variant="body2" color="text.secondary">Sprawdź możliwości panelu.</Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Twoje wydarzenie</Typography>
              <Typography variant="body2" color="text.secondary">{event.dateFrom} – {event.dateTo}</Typography>
              <Typography variant="subtitle1" fontWeight={600}>{event.title}</Typography>
              <Box display="flex" gap={1} alignItems="center" mt={1}>
                <Typography variant="body2">Gotowość:</Typography>
                <Chip label={`${event.readiness}%`} color="warning" size="small" />
              </Box>
              <Box mt={2}>
                <Button size="small" onClick={() => navigate(`/dashboard`)}>Zmień</Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6">Checklist</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Przejdź do listy zadań dla wydarzenia
              </Typography>
              <Button variant="contained" color="secondary" fullWidth onClick={() => navigate(`/event/${event.id}/checklist`)}>
                Otwórz checklistę
              </Button>
            </CardContent>
          </Card>
        </Box>
      }
      right={
        <Box className={styles.rightContainer}>
          <Typography variant="subtitle1" className={styles.title}>Panel wydarzenia</Typography>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
            <Card onClick={() => navigate(`/event/${event.id}/trade-info`)} sx={{ cursor: 'pointer' }}>
              <CardContent>
                <Typography>Informacje targowe</Typography>
              </CardContent>
            </Card>
            <Card onClick={() => navigate(`/event/${event.id}/documents`)} sx={{ cursor: 'pointer' }}>
              <CardContent>
                <Typography>Portal dokumentów</Typography>
              </CardContent>
            </Card>
            <Card onClick={() => navigate(`/event/${event.id}`)} sx={{ cursor: 'pointer' }}>
              <CardContent>
                <Typography>Aktualności</Typography>
              </CardContent>
            </Card>
            <Card onClick={() => navigate(`/event/${event.id}/checklist`)} sx={{ cursor: 'pointer' }}>
              <CardContent>
                <Typography>Checklista</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      }
      colorLeft="#eceef0"
    />
  );
};

export default EventHomePage;


