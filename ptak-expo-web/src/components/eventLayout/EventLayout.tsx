import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import styles from './EventLayout.module.scss';
import Menu from '../Menu';

interface EventLayoutProps {
  left: ReactNode;
  right: ReactNode;
  colorLeft?: string;
  colorRight?: string;
}

const EventLayout = ({ left, right, colorLeft = '#eceef0', colorRight }: EventLayoutProps) => {
  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Menu />
      </Box>
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '5fr 7fr' }}>
        <Box className={styles.left} sx={{ backgroundColor: colorLeft }}>
          {left}
        </Box>
        <Box className={`${styles.right} ${colorRight ? '' : styles.rightBackground}`} sx={{ background: colorRight ?? 'transparent' }}>
          {right}
        </Box>
      </Box>
    </Box>
  );
};

export default EventLayout;


