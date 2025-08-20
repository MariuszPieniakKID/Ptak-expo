import React from 'react';
import { Box } from '@mui/material';
import Menu from '../components/menu/Menu';

const ApiDocsPage: React.FC = () => {
  const src = `${window.location.origin.replace(':3000', ':3001')}/api-docs`;
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Menu />
      <iframe title="API Docs" src={src} style={{ flex: 1, border: 0 }} />
    </Box>
  );
};

export default ApiDocsPage;

