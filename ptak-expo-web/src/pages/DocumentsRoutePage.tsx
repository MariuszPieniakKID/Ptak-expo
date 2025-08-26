import React from 'react';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import EventLayout from '../components/eventLayout/EventLayout';
import LeftColumn from '../components/event-left/LeftColumn';
import DocumentsPage from './DocumentsPage';

const DocumentsRoutePage: React.FC = () => {
  const { eventId } = useParams();

  return (
    <EventLayout
      left={<LeftColumn eventId={eventId || '0'} />}
      right={<Box sx={{ paddingTop: '2rem' }}><DocumentsPage /></Box>}
      colorLeft="#145d5a"
    />
  );
};

export default DocumentsRoutePage;


