import NotificationsIcon from '@mui/icons-material/Notifications';
import DescriptionIcon from '@mui/icons-material/Description';
import CampaignIcon from '@mui/icons-material/Campaign';
import EmailIcon from '@mui/icons-material/Email';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import styles from './EventHomeMenu.module.scss';
import { useNavigate } from 'react-router-dom';

interface Props { id: string }

const EventHomeMenu: React.FC<Props> = ({ id }) => {
  const navigate = useNavigate();
  const menu = [
    { id: 'info', title: 'Informacje targowe', icon: NotificationsIcon, href: `/event/${id}/trade-info` },
    { id: 'docs', title: 'Portal dokumentów', icon: DescriptionIcon, href: `/event/${id}/documents` },
    { id: 'marketing', title: 'Materiały marketingowe', icon: CampaignIcon, href: `/event/${id}` },
    { id: 'invites', title: 'Generator zaproszeń', icon: EmailIcon, href: `/event/${id}` },
  ];
  return (
    <Box sx={{ mt: 4 }} className={styles.container}>
      <Typography variant="subtitle1" sx={{ mb: 4 }}>Menu wydarzenia</Typography>
      <Grid container spacing={4}>
        {menu.map((tile) => {
          const Icon = tile.icon;
          return (
            <Grid size={{ xs: 12, md: 6 }} key={tile.id}>
              <Card onClick={() => navigate(tile.href)} className={styles.card}>
                <CardContent>
                  <Icon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body1" fontWeight={500}>{tile.title}</Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default EventHomeMenu;


