import { Avatar, Box, Typography } from '@mui/material';
import styles from './AvatarBanner.module.scss';
import { useAuth } from '../../contexts/AuthContext';

const AvatarBanner = ({isWhite = false} : {isWhite?: Boolean})  => {
  const { user } = useAuth();
  return (
    <Box className={styles.avatarBanner}>
      <Avatar></Avatar>
      <Box>
        <Typography variant="h6" fontWeight={600} color={isWhite ? "white" : "text.primary"}>
          Witaj {user?.firstName || 'Użytkowniku'} 👋
        </Typography>
        <Typography color={isWhite ? "white" : "text.secondary"}>Sprawdź możliwości panelu</Typography>
      </Box>
    </Box>
  );
};

export default AvatarBanner;


