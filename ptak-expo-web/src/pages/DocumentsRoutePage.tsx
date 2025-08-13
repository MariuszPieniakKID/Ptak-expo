import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Menu from '../components/Menu';
import DocumentsPage from './DocumentsPage';

const DocumentsRoutePage: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const handleMenuClick = (page: string) => {
    if (!eventId) return;
    if (page === 'info') {
      navigate(`/event/${eventId}/trade-info`);
      return;
    }
    if (page === 'checklist') {
      navigate(`/event/${eventId}/checklist`);
      return;
    }
    if (page === 'documents') {
      navigate(`/event/${eventId}/documents`);
      return;
    }
    if (page === 'home') {
      navigate(`/event/${eventId}`);
      return;
    }
  };

  return (
    <div>
      <Menu onMenuClick={handleMenuClick} onLogout={() => navigate('/login')} />
      <DocumentsPage />
    </div>
  );
};

export default DocumentsRoutePage;


