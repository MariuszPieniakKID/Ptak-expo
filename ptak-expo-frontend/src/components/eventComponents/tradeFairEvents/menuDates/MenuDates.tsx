import Tabs, { tabsClasses } from '@mui/material/Tabs';
import { Box, Tab } from '@mui/material';
import { Exhibition } from '../../../../services/api';
import CircleDate from '../circleDate/CircleDate';

type MenuDatesProps = {
  event: Exhibition;
  value: number;
  handleChange: (_event: React.SyntheticEvent, newValue: number) => void;
  days: string[];
};

function MenuDates({ event, value, handleChange, days }: MenuDatesProps) {

    function a11yProps(index: number) {
        return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
        };
    }
  return (
    <Box>
      <Tabs
        value={value}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="visible arrows tabs example"
        slotProps={{
          scrollButtons: { disableRipple: true },
        }}
        sx={{
          minHeight: 48,
          '& .MuiTabs-indicator': { display: 'none' }, 
          '& .MuiTabs-scroller': { overflowX: 'auto !important' },
          '& .MuiTab-root': {
            flex: 1,
            maxWidth:30,
            minHeight: '48px',
            color: 'black',
            transition: 'color 0.2s, background-color 0.2s',
            whiteSpace: 'nowrap',
          },
          '& .MuiTab-root:last-child': { marginRight: 0 },
          '& .MuiTab-wrapper': {
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            '& svg': { flexShrink: 0 },
          },
          [`& .${tabsClasses.scrollButtons}`]: {
            '&.Mui-disabled': { opacity: 0.3 },
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
          },
           [`& .${tabsClasses.scrollButtons}`]: {
            color: 'white', 
            '&.Mui-disabled': { opacity: 0.3 },
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
            },
        }}
      >
        <Tab
          key="all"
          disableRipple
          label="Wszystkie"
          aria-label="Wszystkie wydarzenia"
          {...a11yProps(0)}
        />
        {days.map((date, index) => (
          <Tab
            key={index}
            disableRipple
            icon={
              <CircleDate
                dayId={index}
                date={date}
                event={event}
                isActive={index + 1 === value}
              />
            }
            iconPosition="start"
            aria-label={date}
            {...a11yProps(index + 1)}
          />
        ))}
      </Tabs>
    </Box>
  );
}

export default MenuDates;
