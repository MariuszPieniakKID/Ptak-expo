import React from 'react';
import { Box, Alert, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Divider } from '@mui/material';
import CustomTypography from '../../../../components/customTypography/CustomTypography';
import CustomField from '../../../../components/customField/CustomField';
import { Exhibition, TradeEvent} from '../../../../services/api';
import styles from './TradeFairEventsContent.module.scss';
import ComponentWithAction from '../../../componentWithAction/ComponentWithAction';

interface TradeFairEventsContentProps {
  event: Exhibition;
  newEvent: TradeEvent; 
  tradeEventsError: string;
  handleNewEventChange: (field: keyof TradeEvent) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveTradeEvent: () => void;
}


const TradeFairEventsContent: React.FC<TradeFairEventsContentProps> = ({ 
  event,
  newEvent,
  tradeEventsError,
  handleNewEventChange,
  handleSaveTradeEvent,
 }) => {

 const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  // Załóżmy, że data jest w formacie ISO: "2025-09-04T12:00:00Z", więc tniemy do "YYYY-MM-DD"
  const tIndex = dateStr.indexOf('T');
  return tIndex > 0 ? dateStr.slice(0, tIndex) : dateStr;
};
  


  const typeOptions = [
  {value:' ceremonia_otwarcia_targow',label:'Ceremonia otwarcia targów'},
  {value:' gala_wreczenia_medali_nagród_targowych', label:'Gala wręczenia medali/ nagród targowych'},
  {value:' glowna_konferencja_targowa', label:'Główna konferencja targowa'},
  {value:' wystapienia_honorowych_gosci_patronow', label:'Wystąpienia honorowych gości/ patronów'},
  {value:' spotkania_zorganizowanie_przez_organizatora_targów', label:'Spotkania zorganizowane przez organizatora targów'}
];

  // const dateOnly = (value?: string) => {
  //   if (!value) return '';
  //   const tIdx = value.indexOf('T');
  //   return tIdx > 0 ? value.slice(0, tIdx) : value;
  // };
  // const timeHM = (value?: string) => {
  //   if (!value) return '';
  //   const parts = value.split(':');
  //   if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  //   return value;
  // };

  return (
    <>
    {tradeEventsError && (<Alert severity="error" sx={{ mb: 2 }}>{tradeEventsError}</Alert>)}
    <Box className={styles.container}>
      <Divider className={styles.divider_} />
      <CustomTypography className={styles.sectionTitle}>Dodawanie wydarzenia</CustomTypography>
      <Box className={styles.halfRowInD}>
        <Box className={styles.name}>
          <CustomField 
            type={'text'} 
            value={newEvent.name} 
            onChange={handleNewEventChange('name')}
            label="Nazwa wydarzenia"
            placeholder='Nazwa'
            fullWidth
          />          
        </Box>
      </Box>
      <Box className={styles.locationInfo}>
        <Box className={styles.timeInfo}>
          <Box className={styles.date}>
            <CustomField 
              type={'date'} 
              value={newEvent.eventDate} 
              onChange={handleNewEventChange('eventDate')}
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
              value={newEvent.startTime} 
              onChange={handleNewEventChange('startTime')}
              label="Godzina początku"
              fullWidth
            />  
          </Box>
          <Box className={styles.endTime}>
            <CustomField 
              type={'time'} 
              value={newEvent.endTime} 
              onChange={handleNewEventChange('endTime')}
              label="Godzina końca"
              fullWidth
            />  
          </Box>  
        </Box>
        <Box className={styles.place}>
          <CustomField 
            type={'text'} 
            value={newEvent?.hall?newEvent?.hall:''} 
            onChange={handleNewEventChange('hall')}
            label="Oznaczenie Hali"
            placeholder='Hala'
            fullWidth
          /> 
        </Box>
      </Box>
      <Box className={styles.description}>
        <CustomField 
          type={'text'} 
          value={newEvent.description || ''} 
          onChange={handleNewEventChange('description')}
          label="Opis wydarzenia"
          placeholder='Opis wydarzenia w tym szczegółowe miejsce wydarzenia (max. 750 znaków)'
          fullWidth
          multiline
          rows={4}
        />  
      </Box>
      <Box className={styles.eventType}>
      {/* Wybór typu eventu*/}
        <FormControl className={styles.formControl}>
          <FormLabel className={styles.formLabel}>Wybierz rodzaj dokumentu</FormLabel>
          <RadioGroup
            value={newEvent.type}
            onChange={handleNewEventChange('type')}
            className={styles.radioGroup}
          >
            {typeOptions.map(option => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio />}
              label={option.label}
           
              sx={{
                color: '#2E2E38',
                height:'36px',
                '& .MuiFormControlLabel-label': {
                  fontSize: '13px',
                  color:'#666A73 ',
                  fontWeight:'300',
                },
              }}
            />
          ))}
          </RadioGroup>
        </FormControl>
      </Box>
      <Box className={styles.actionBox}>
        <Box className={styles.link}>
            <CustomField 
            type={'text'} 
            value={newEvent.link||''} 
            onChange={handleNewEventChange('link')}
            label="Link do wydarzenie na stronie targów"
            placeholder='https://'
            fullWidth
          />  
        </Box>
        <Box className={styles.saveButton}>
          <ComponentWithAction 
          iconType={'save'} 
          handleAction={handleSaveTradeEvent} 
          buttonTitle={'zapisz'}
          iconFirst={false}/>
        
        </Box>
      </Box>
    </Box>
   </>

  );
};

export default TradeFairEventsContent;