import React, { useState } from 'react';
import { Box } from '@mui/material';
import CustomTypography from '../../../../components/customTypography/CustomTypography';
//import CustomButton from '../../../../components/customButton/CustomButton';
import { Exhibition } from '../../../../services/api';
import styles from './PushNotificationContent.module.scss';
//import pageStyles from '../../../../pages/EventDetailPage.module.scss';
import SendMessageContainer from '../../../exhibitorDatabaseDocuments/messageContainer/SendMessageContainer';
import ComponentWithAction from '../../../componentWithAction/ComponentWithAction';
import { _NotyficationEveny } from '../../../../types/types'; // poprawny import typu bez \
import CustomField from '../../../customField/CustomField';
import CustomSelectMui from '../../../customSelectMui/CustomSelectMui';
import { groupReceivingNotification, notificationsMock} from '../../../../helpers/mockData';
import NotificationLines from './notificationLines/NotificationLines';

interface PushNotificationContentProps {
  event: Exhibition;
  notification?: _NotyficationEveny[] | []; // opcjonalny, może być null
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const tIndex = dateStr.indexOf('T');
  return tIndex > 0 ? dateStr.slice(0, tIndex) : dateStr;
};

const PushNotificationContent: React.FC<PushNotificationContentProps> = ({
  event,
  //notification = [],
}) => {
  const [newNotification, _setNewNotification] = useState<_NotyficationEveny>({
    date: '',
    startTime: '',
    description: '',
    receivers: 'all',
  });

  const handleInputChange = (field: keyof _NotyficationEveny) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    _setNewNotification((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange = (field: keyof _NotyficationEveny) => (
    value: string | number | (string | number)[]
  ) => {
    _setNewNotification((prev) => ({
      ...prev,
      [field]: value as string, 
    }));
  };
  return (
    <>
    <Box className={styles.containerNotyfications}>
      <CustomTypography className={styles.titleNotification}>
        Treść powiadomienia
      </CustomTypography>
      <SendMessageContainer
        onSend={() => console.log('onSend')}
        paperBackground={'#f5f5f5'}
        legendBackground={'#f5f5f5'}
        textAreaBackground={'#f5f5f5'}
        isSendVisible={false}
      />
      <Box className={styles.notificationRow}>
        <Box className={styles.dateAndStartTime}>
          <Box className={styles.date}>
            <CustomField
              type={'date'}
              value={newNotification.date}
              onChange={handleInputChange('date')}
              label="Data"
              fullWidth
              inputProps={{
                min: formatDate(event.start_date),
                max: formatDate(event.end_date),
              }}
            />
          </Box>
          <Box className={styles.startTime}>
            <CustomField
              type={'time'}
              value={newNotification.startTime}
              onChange={handleInputChange('startTime')}
              label="Godzina początku"
              fullWidth
            />
          </Box>
        </Box>
        <Box className={styles.receivesSelect}>
          <CustomSelectMui
            label="Typ zaproszenia"
            placeholder=""
            value={newNotification.receivers}
            onChange={handleSelectChange('receivers')}
            options={groupReceivingNotification}
            size="small"
            fullWidth
          />
        </Box>
        <Box className={styles.actionBox}>
          <ComponentWithAction
            buttonTitle={'zaplanuj wysyłkę'}
            handleAction={() => console.log('Zaplanuj wysylke')}
            iconType={'save'}
            iconFirst={false}
          />
        </Box>
      </Box>
      {/* <div className={styles.container}>
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
      </div> */}
    </Box>
    <NotificationLines notifications={notificationsMock}/>
    </>
  );
};

export default PushNotificationContent;