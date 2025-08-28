import React from 'react';
import { useParams } from 'react-router-dom';
import EventLayout from '../components/eventLayout/EventLayout';
import LeftColumn from '../components/event-left/LeftColumn';
import ChecklistPage from './ChecklistPage';
import { ChecklistProvider } from '../contexts/ChecklistContext';

const ChecklistRoutePage: React.FC = () => {
  const { eventId } = useParams();
  const eventIdNumber = +(eventId || '0')
  return (
    <EventLayout
      left={<LeftColumn eventId={eventId || '0'} isDarkBg={true} />}
      right={<ChecklistProvider eventId={eventIdNumber}><ChecklistPage /></ChecklistProvider>}
      colorLeft="#bb1821"
    />
  );
};

export default ChecklistRoutePage;


