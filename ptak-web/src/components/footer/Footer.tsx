import { Box, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import styles from './Footer.module.scss';

const Footer = () => {
  const { t } = useTranslation('home');
  return (
    <Box mt={4} color={'text.secondary'}>
      <Link className={styles.link}>{t('contact')}</Link>•
      <Link className={styles.link}>{t('privacyPolicy')}</Link>•
      <Link className={styles.link}>www.warsawexpo.eu</Link>
    </Box>
  );
};

export default Footer;
