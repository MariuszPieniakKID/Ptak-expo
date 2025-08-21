import { Avatar, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import styles from './AvatarBanner.module.scss';

const AvatarBanner = () => {
  const { t } = useTranslation('home');
  const { user } = useAuth();
  return (
    <Box className={styles.avatarBanner}>
      <Avatar></Avatar>
      <Box>
        <Typography variant="h6" fontWeight={600}>
          {t('welcome')} {user?.name} 👋
        </Typography>
        <Typography color="text.secondary">{t('checkPossibilities')}</Typography>
      </Box>
    </Box>
  );
};

export default AvatarBanner;
