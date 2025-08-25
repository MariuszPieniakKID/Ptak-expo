import NotificationsIcon from '@mui/icons-material/Notifications';
import DescriptionIcon from '@mui/icons-material/Description';
import CampaignIcon from '@mui/icons-material/Campaign';
import EmailIcon from '@mui/icons-material/Email';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styles from './EventHomeMenu.module.scss';

interface EventHomeMenuProps {
  id: string;
}

const EventHomeMenu: React.FC<EventHomeMenuProps> = ({ id }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const menu = [
    {
      id: 'info',
      title: t('eventMenu.info'),
      icon: NotificationsIcon,
      href: `/event/${id}/info`,
    },
    {
      id: 'docs',
      title: t('eventMenu.docs'),
      icon: DescriptionIcon,
      href: `/event/${id}/documents`,
    },
    {
      id: 'marketing',
      title: t('eventMenu.marketing'),
      icon: CampaignIcon,
      href: `/event/${id}/marketing`,
    },
    {
      id: 'invites',
      title: t('eventMenu.invites'),
      icon: EmailIcon,
      href: `/event/${id}/invites`,
    },
  ];
  return (
    <Box sx={{ mt: 4 }} className={styles.container}>
      <Typography variant="subtitle1" sx={{ mb: 4 }}>
        {t('eventMenu.title')}
      </Typography>
      <Grid container spacing={4}>
        {menu.map((tile) => {
          const Icon = tile.icon;
          return (
            <Grid size={{ xs: 12, md: 6 }} key={tile.id}>
              <Card onClick={() => navigate(tile.href)} className={styles.card}>
                <CardContent>
                  <Icon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body1" fontWeight={500}>
                    {tile.title}
                  </Typography>
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
