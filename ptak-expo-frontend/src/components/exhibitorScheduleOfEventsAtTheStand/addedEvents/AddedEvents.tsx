import { Box } from '@mui/material';
import styles from './AddedEvents.module.scss';
import CustomTypography from '../../customTypography/CustomTypography';
import LogoPtakExpo from '../../../assets/LogoPtakExpo.png';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import { ReactComponent as Wastebasket } from '../../../assets/wastebasket.svg';
import { ReactComponent as EditIcon} from '../../../assets/edit.svg';
import { ReactComponent as EditBlueIcon} from '../../../assets/editBlue.svg';
import { useState } from 'react';
import { _AddedEvent } from '../../../types/types';
import EventTypeBadge from '../../eventTypeBadge/EventTypeBadge';



interface AddedEventsProps {
  events: _AddedEvent[];
}

const AddedEvents = ({ events }: AddedEventsProps) => {
  const [editHovered, setEditHovered] = useState<number | null>(null);

 //TO DO 
function getColorForEvent(eventId: string): string {
  const colors = ["#6f87f6", "#89f4c9", "#fc8a06"];
  const hash = eventId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}
  const haondleAddToOfficialCatalog = () => {
    console.log("Dodawanie wydarzenia do oficjalnego katalogu");
  }

  const handleEditEven = () => {
    console.log("Edycja wydarzenia:");
  }
  const handleDeleteEven = () => {
    console.log("Detete event");
  }
 //END



  // Funkcja mapująca circleColor na circleTextColor
  const textColorPicker = (circleColor: string): string => {
    switch (circleColor.toLowerCase()) {
      case '#6f87f6':
        return '#FFFFFF'; // biały tekst na #6F87F6
      case '#89f4c9':
        return '#2E2E38'; // ciemny tekst na #89F4C9
      case '#fc8a06':
        return '#FFFFFF'; // biały tekst na #FC8A06
      default:
        return '#000000'; // domyślny kolor tekstu (czarny)
    }
  };


  return (
    <>
      {events.map((event, index) => {
        const circleColor = getColorForEvent(event.id ? String(event.id) : '');

        const eventDateObj = new Date(event.eventDate);

        return (
          <Box key={index} className={styles.container}>
            <Box className={styles.inRow}>
                {/* Sekcja Data */}
                <Box className={styles.date}>
                    <Box className={styles.iconWith}>
                        <Box
                        className={styles.coloredCircle}
                        style={{
                            '--circle-color': circleColor,
                            '--circle-text-color': textColorPicker(circleColor),
                        } as React.CSSProperties}
                        >
                        {eventDateObj.getDate()}<br />
                        {eventDateObj.toLocaleString('pl-PL', { month: 'short' })}
                        </Box>
                    </Box>
                    <Box className={styles.startAndEndDate}> {event.startTime} - {event.endTime}</Box>
                </Box>

                {/* Sekcja Info */}
                <Box className={styles.eventInfo}>
                    <Box className={styles.inRow}>
                        <Box>
                            <EventTypeBadge eventType={event.eventType} />
                            <Box className={styles.eventTitle}>{event.eventTitle}</Box>
                        </Box>
                        {('isEdited' in event)
                        ? <Box>
                            <span
                                onMouseEnter={() => setEditHovered(index)}
                                onMouseLeave={() => setEditHovered(null)}
                                onClick={handleEditEven}
                                style={{ cursor: 'pointer', display: 'inline-flex' }}
                            >
                                {editHovered === index
                                ? <EditBlueIcon className={styles.editIcon} />
                                : <EditIcon className={styles.editIcon} />}
                            </span>
                          </Box>
                        :null}
                    </Box>
                    <Box className={styles.eventDescription}>{event.description}</Box>
                </Box>
            </Box>
            {/* Sekcja Organizator + Akcje */}
            <Box className={styles.lastRow}>
              <Box className={styles.organizer}>
                <CustomTypography className={styles.organizerLabel}>Organizuje:</CustomTypography>
                <Box className={styles.organizerIcon}><img src={LogoPtakExpo} alt="Organizer logo" /></Box>
              </Box>

              <Box className={styles.actionButton}>
                {!('addedToOfficialCatalog' in event) ? (
                  <Box className={styles.inLine} onClick={handleDeleteEven}>
                    <Wastebasket className={styles.actionLabelIcon} />
                    <Box className={styles.actionLabel}>Delete</Box>
                  </Box>
                ) : event.addedToOfficialCatalog ? (
                  <Box className={styles.inLine}>
                    <StarOutlineIcon className={styles.addedToOfficialCataloglIcon} />
                    <CustomTypography className={styles.addedToOfficialCatalog}>
                      Wydarzenie dodane do oficjalnego katalogu
                    </CustomTypography>
                  </Box>
                ) : (
                  <Box
                    className={styles.inLine}
                    onClick={haondleAddToOfficialCatalog}
                  >
                    <StarOutlineIcon sx={{ color: '#2E2E38' }} className={styles.notAddedToOfficialCatalogIcon} />
                    <CustomTypography className={styles.notAddedToOfficialCatalog}>
                      Dodaj wydarzenie do oficjalnego katalogu
                    </CustomTypography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        );
      })}
    </>
  );
};

export default AddedEvents;