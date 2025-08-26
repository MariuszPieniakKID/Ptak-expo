import React from 'react';
import { useParams } from 'react-router-dom';
import EventLayout from '../components/eventLayout/EventLayout';
import LeftColumn from '../components/event-left/LeftColumn';
import ChecklistPage from './ChecklistPage';

const ChecklistRoutePage: React.FC = () => {
  const { eventId } = useParams();
  return (
    <EventLayout
      left={<LeftColumn eventId={eventId || '0'} />}
      right={<ChecklistPage />}
      colorLeft="#eceef0"
    />
  );
};

export default ChecklistRoutePage;


