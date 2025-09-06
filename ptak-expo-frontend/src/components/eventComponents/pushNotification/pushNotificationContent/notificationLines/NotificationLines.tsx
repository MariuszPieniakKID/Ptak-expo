import { Box } from '@mui/material';
import styles from './NotificationLines.module.scss';
import CustomTypography from '../../../../customTypography/CustomTypography';
import ComponentWithAction from '../../../../componentWithAction/ComponentWithAction';
import { _NotyficationEveny } from '../../../../../types/types';
import { formatDateToDDMMYYYY } from '../../../../../helpers/function';

// export type _GroupReceivingNotifications =
//   | 'standard'
//   | 'exhibitore'
//   | 'guest'
//   | 'vip'
//   | 'all'
//   | 'biznes_priority';

// export type _NotyficationEveny = {
//   eventId?: string;
//   id: number;
//   date: string;
//   startTime: string;
//   description: string;
//   receivers: _GroupReceivingNotifications;
// };

type NotificationLinesProps = {
  notifications: _NotyficationEveny[];
  //handleDelete: (_event: React.SyntheticEvent, id: number) => void;
};

function NotificationLines({ 
    notifications = [], 
    //handleDelete 
}: NotificationLinesProps) {
  return (
    <Box className={styles.container}>
      <Box className={styles.titleRow}>
        <CustomTypography className={styles.titleRowData}>Data wydarzenia</CustomTypography>
        <CustomTypography className={styles.titleRowMessage}>Treść</CustomTypography>
        <CustomTypography className={styles.titleRowGroup}>Zaproszeni goście</CustomTypography>
        <CustomTypography className={styles.titleRowDelete}>{null}</CustomTypography>
      </Box>

      {notifications.map(({ id, date, startTime, description, receivers }) => (
        <Box key={id} className={styles.singleLine}>
          <Box className={styles.dataAndtimneBox}>
            <CustomTypography className={styles.textContent}>
              {formatDateToDDMMYYYY(date)} - {startTime}
            </CustomTypography>
          </Box>

          <Box className={styles.descriptionBox}>
            <CustomTypography className={styles.textContent}>
              {description}
            </CustomTypography>
          </Box>

          <Box className={styles.groupPeopleBox}>
            <CustomTypography className={styles.textContent}>
              {receivers}
            </CustomTypography>
          </Box>

          <Box className={styles.deleteBox}>
            <ComponentWithAction
              buttonTitle="usuń"
              //handleAction={() => handleDelete(id)}
              handleAction={() => console.log("Hello")}
              iconType="delete"
              disabled
              hideTextOnMobile={true}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default NotificationLines;