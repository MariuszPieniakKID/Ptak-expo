import { Box, Grid } from '@mui/material';
import styles from './EventLayout.module.scss';
import type { ReactNode } from 'react';
import theme from '../../styles/theme';
import Header from '../header/Header';

interface EventLayoutProps {
  left: ReactNode;
  right: ReactNode;
  colorLeft?: string;
  colorRight?: string;
}

const EventLayout = ({
  left,
  right,
  colorLeft = theme.palette.grey[700],
  colorRight,
}: EventLayoutProps) => {
  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Header />
      </Box>
      <Grid container>
        <Grid size={{ xs: 12, md: 5 }} className={styles.left} sx={{ backgroundColor: colorLeft }}>
          {left}
        </Grid>
        <Grid
          size={{ xs: 12, md: 7 }}
          className={`${styles.right} ${colorRight ? '' : styles.rightBackground}`}
          sx={{ background: colorRight ?? 'transparent' }}
        >
          {right}
        </Grid>
      </Grid>
    </Box>
  );
};

export default EventLayout;
