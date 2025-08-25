import { Box, Grid, IconButton, Typography } from '@mui/material';
import Footer from '../../components/footer/Footer';
import styles from './Calendar.module.scss';
import AvatarBanner from '../../components/avatar-banner/AvatarBanner';
import logo from '../../assets/images/logo.png';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { mockEvents, mockIndustryOptions } from '../../mocks';
import type { Event } from '../../components/planned-event-card/PlannedEventCard';
import SuggestedEventCard from '../../components/suggested-event-card/SuggestedEventCard';
import MultiSelect, { type SelectOption } from '../../components/multiselect/MultiSelect';
import { useNavigate } from 'react-router-dom';

const Calendar = () => {
  const { t } = useTranslation('calendar');
  const [similarEvents, setSimilarEvents] = useState<Event[] | null>(null);
  const [otherEvents, setOtherEvents] = useState<Event[] | null>(null);
  const [selectedIndustries, setSelectedIndustries] = useState<SelectOption[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    //todo remove mocks and create api call
    setSimilarEvents(mockEvents);
    setOtherEvents(mockEvents);
  }, [similarEvents, otherEvents]);

  const handleOnChange = (newValue: SelectOption[]) => {
    setSelectedIndustries(newValue);
    //todo get otherEvents for selected industries
  };

  return (
    <Box>
      <Box className={styles.background}>
        <Grid container className={styles.header}>
          <Grid className={styles.avatar} size={{ xs: 6, sm: 3 }}>
            <AvatarBanner />
          </Grid>
          <Grid className={styles.logo} size={{ xs: 6, sm: 3 }}>
            <img src={logo} alt="Logo" />
          </Grid>
          <Grid size={{ sm: 3 }} display={{ xs: 'none', md: 'inline-block' }}></Grid>
        </Grid>
        <Box className={styles.children}>
          <Box className={styles.backButtonContainer}>
            <IconButton
              className={styles.backButton}
              onClick={() => {
                navigate(`/`);
              }}
            >
              <ArrowBackIosIcon className={styles.backIcon} />
            </IconButton>
            <Typography variant="h6" fontWeight={550} style={{ whiteSpace: 'pre-line' }}>
              {t('calendar')}
            </Typography>
          </Box>
          <Box className={styles.title}>
            <Typography>{t('similarEvents')}</Typography>
          </Box>
          <Grid container spacing={2} pt={4}>
            {similarEvents?.map((event) => (
              <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                <SuggestedEventCard event={event} />
              </Grid>
            ))}
          </Grid>
          <Box className={styles.title}>
            <Typography>{t('otherEvents')}</Typography>
          </Box>
        </Box>
      </Box>
      <Box className={styles.whiteBackground}>
        <Box className={styles.otherEventsContainer}>
          <Box className={styles.filtersContainer}>
            <Typography>{t('selectIndustry')}</Typography>
            <MultiSelect
              options={mockIndustryOptions}
              fullWidth
              label={t('selectIndustry')}
              value={selectedIndustries}
              onChange={(event, newValue) => handleOnChange(newValue)}
              sx={{ minWidth: '20rem' }}
            />
          </Box>
          <Box>
            <Grid container spacing={2}>
              {otherEvents?.map((x) => (
                <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                  <SuggestedEventCard event={x} />
                </Grid>
              ))}
            </Grid>
          </Box>
          <Box className={styles.backButtonContainer} onClick={() => navigate(`/`)}>
            <IconButton className={styles.backButton}>
              <ArrowBackIosIcon className={styles.backIcon} />
            </IconButton>
            <Typography sx={{ textDecoration: 'underline' }}>{t('back')}</Typography>
          </Box>
          <Footer />
        </Box>
      </Box>
    </Box>
  );
};

export default Calendar;
