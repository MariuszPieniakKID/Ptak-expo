import { Box } from '@mui/material';
import styles from './EventTypeBadge.module.scss';
import { _EventStatus } from '../../types/types';




interface EventTypeBadgeProps {
  eventType: _EventStatus;
}

const EventTypeBadge: React.FC<EventTypeBadgeProps> = ({ eventType }) => {

  const getClassNameByEventType = (type: _EventStatus): string => {

    switch (type) {
      case 'Montaż stoiska':
      case 'Demontaż stoiska':
      case 'Dostawa i montaż sprzętu/materiałów':
        return styles.typeEvents3;
      case 'Prezentacja produktów i marek':
        return styles.typeEvents1;
      case 'Edukacyjne i eksperckie':
        return styles.typeEvents2;
      default:
        return '';
    }

  };

  return <Box className={getClassNameByEventType(eventType)}>{eventType}</Box>;
};

export default EventTypeBadge;