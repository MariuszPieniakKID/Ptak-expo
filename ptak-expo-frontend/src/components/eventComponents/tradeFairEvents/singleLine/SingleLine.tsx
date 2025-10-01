import { Box } from '@mui/material';
import styles from './SingleLine.module.scss';
import CustomTypography from '../../../customTypography/CustomTypography';
import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
//import { TradeEvent } from '../../../../services/api';

type SingleLineProps = {
  time?: string;
  date?: string; // Add date prop
  hall?: string;
  title?: string;
  shortDescription?: string;
  link?: string;
  rightAction?: React.ReactNode;
  //tradeEvents:TradeEvent[];
};

function SingleLine({
  time = '9:00-17:00',
  date,
  hall = 'Hala A',
  title = 'Arch day',
  shortDescription = "Wymagany dodatkowy sprzęt",
  link = " ",
  rightAction,
}: SingleLineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

  const handleClick = () => setIsOpen((prev) => !prev);

  const handleGoToLink = () => {
    if (link && link.trim() !== '') {
      // Otwieranie linku -- odkomentuj jeśli chcesz aktywować
      // const url = link.startsWith('http') ? link : `https://${link}`;
      // window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      setError('Problem z linkiem');
    }
  };

  return (
    <Box className={styles.container}>
      <Box className={`${styles.singleLine} ${isOpen ? styles.open : ''}`}>
        <Box className={styles.inline}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <CustomTypography className={styles.time} sx={{ fontSize: '0.7rem' }}>{time}</CustomTypography>
            {date && <CustomTypography sx={{ fontSize: '0.55rem', color: '#888' }}>{date}</CustomTypography>}
          </Box>
          <CustomTypography className={styles.hall}>{hall}</CustomTypography>
        </Box>
        <Box className={styles.titleWithButton}>
          <CustomTypography className={styles.title}>{title}</CustomTypography>
          <Box 
            className={styles.boxIcon} 
            onClick={handleClick}>
            {isOpen 
              ? (<ExpandMoreIcon className={styles.expandIcon} />) 
              : (<ExpandMoreIcon className={`${styles.expandIcon} ${styles.rotateIcon}`} />)}
          </Box>
          {rightAction && (
            <Box sx={{ ml: 1 }}>
              {rightAction}
            </Box>
          )}
        </Box>
      </Box>
      {isOpen && (
        <>
          <Box className={`${styles.shortInfo} ${error !== '' ? styles.noBorder : ''}`}>
            <CustomTypography className={styles.description}>{shortDescription}</CustomTypography>
            {(link !== '' && error === '') &&
              <Box 
                className={styles.boxWithAction}
                onClick={handleGoToLink}
              >
                <CustomTypography className={styles.more}>więcej</CustomTypography>
                <ArrowOutwardIcon className={styles.arrowIcon} sx={{ color: 'white' }}/>
              </Box>
            }
          </Box>
          {error !== '' && <Box className={styles.shortInfoError}>Ups... {error}</Box>}
        </>
      )}
    </Box>
  );
}

export default SingleLine;