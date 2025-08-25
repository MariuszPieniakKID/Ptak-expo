import { Avatar, Box, Typography } from '@mui/material';
import styles from './AvatarBanner.module.scss';
import { useAuth } from '../../contexts/AuthContext';

const AvatarBanner = () => {
  const { user } = useAuth();
  return (
    <Box className={styles.avatarBanner}>
      <Avatar></Avatar>
      <Box>
        <Typography variant="h6" fontWeight={600}>
          Witaj {user?.firstName || 'Użytkowniku'} 👋
        </Typography>
        <Typography color="text.secondary">Sprawdź możliwości panelu</Typography>
      </Box>
    </Box>
  );
};

export default AvatarBanner;


