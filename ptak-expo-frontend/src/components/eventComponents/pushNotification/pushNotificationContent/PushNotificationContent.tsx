import React from 'react';
import { Box } from '@mui/material';
import CustomTypography from '../../../../components/customTypography/CustomTypography';
import CustomButton from '../../../../components/customButton/CustomButton';
import { Exhibition } from '../../../../services/api';
import styles from './PushNotificationContent.module.scss';
import pageStyles from '../../../../pages/EventDetailPage.module.scss';

interface PushNotificationContentProps {
  event: Exhibition;
}

const PushNotificationContent: React.FC<PushNotificationContentProps> = () => {
  return (
    <div className={styles.container}>
      <Box className={pageStyles.tabContent}>
        <CustomTypography fontSize="1.25rem" fontWeight={600}>
          Powiadomienia Push
        </CustomTypography>
        <Box className={pageStyles.notificationsSection}>
          <CustomTypography fontSize="1rem">
            Wyślij powiadomienia do uczestników wydarzenia
          </CustomTypography>

          <Box className={pageStyles.notificationCard}>
            <CustomTypography fontSize="0.875rem" fontWeight={500}>
              Ogłoszenia targowe
            </CustomTypography>
            <CustomTypography fontSize="0.75rem" color="#6c757d">
              Informacje o rozpoczęciu, przerwach i zakończeniu
            </CustomTypography>
            <CustomButton
              bgColor="#6F87F6"
              textColor="#fff"
              width="auto"
              height="36px"
              fontSize="0.75rem"
            >
              Wyślij ogłoszenie
            </CustomButton>
          </Box>

          <Box className={pageStyles.notificationCard}>
            <CustomTypography fontSize="0.875rem" fontWeight={500}>
              Przypomnienia
            </CustomTypography>
            <CustomTypography fontSize="0.75rem" color="#6c757d">
              Automatyczne przypomnienia o ważnych terminach
            </CustomTypography>
            <CustomButton
              bgColor="transparent"
              textColor="#6F87F6"
              width="auto"
              height="36px"
              fontSize="0.75rem"
              sx={{ border: '1px solid #6F87F6' }}
            >
              Ustaw przypomnienia
            </CustomButton>
          </Box>

          <Box className={pageStyles.notificationCard}>
            <CustomTypography fontSize="0.875rem" fontWeight={500}>
              Wydarzenia specjalne
            </CustomTypography>
            <CustomTypography fontSize="0.75rem" color="#6c757d">
              Powiadomienia o konkursach i dodatkowych atrakcjach
            </CustomTypography>
            <CustomButton
              bgColor="transparent"
              textColor="#6F87F6"
              width="auto"
              height="36px"
              fontSize="0.75rem"
              sx={{ border: '1px solid #6F87F6' }}
            >
              Powiadom o wydarzenia
            </CustomButton>
          </Box>

          <Box className={pageStyles.notificationHistory}>
            <CustomTypography fontSize="0.875rem" fontWeight={500}>
              Historia powiadomień
            </CustomTypography>
            <Box className={pageStyles.historyList}>
              <Box className={pageStyles.historyItem}>
                <CustomTypography fontSize="0.75rem">
                  "Rozpoczęcie rejestracji na targi" - wysłano 2 dni temu
                </CustomTypography>
                <CustomTypography fontSize="0.65rem" color="#6c757d">
                  Dostarczono do 156 odbiorców
                </CustomTypography>
              </Box>
              <Box className={pageStyles.historyItem}>
                <CustomTypography fontSize="0.75rem">
                  "Przypomnienie o terminie zgłoszeń" - wysłano 5 dni temu
                </CustomTypography>
                <CustomTypography fontSize="0.65rem" color="#6c757d">
                  Dostarczono do 203 odbiorców
                </CustomTypography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default PushNotificationContent;