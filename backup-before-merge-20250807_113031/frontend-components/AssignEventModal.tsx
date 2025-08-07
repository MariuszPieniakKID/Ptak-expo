import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import CustomButton from './customButton/CustomButton';
import CustomTypography from './customTypography/CustomTypography';
import { fetchExhibitions, assignExhibitorToEvent, Exhibition } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AssignEventModalProps {
  open: boolean;
  onClose: () => void;
  exhibitorId: number;
  exhibitorName: string;
  onAssignSuccess: (exhibitionName: string) => void;
  existingEventIds?: number[];
}

const AssignEventModal: React.FC<AssignEventModalProps> = ({
  open,
  onClose,
  exhibitorId,
  exhibitorName,
  onAssignSuccess,
  existingEventIds = []
}) => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [assigning, setAssigning] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { token } = useAuth();

  const loadExhibitions = useCallback(async () => {
    if (!token) {
      setError('Brak autoryzacji');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const fetchedExhibitions = await fetchExhibitions(token);
      
      // Filter out already assigned exhibitions and show only active/planned
      const availableExhibitions = fetchedExhibitions.filter(
        (exhibition) => 
          !existingEventIds.includes(exhibition.id) &&
          (exhibition.status === 'active' || exhibition.status === 'planned')
      );
      
      setExhibitions(availableExhibitions);
    } catch (err: any) {
      setError(err.message || 'Błąd podczas ładowania wydarzeń');
    } finally {
      setLoading(false);
    }
  }, [token, existingEventIds]);

  useEffect(() => {
    if (open && token) {
      loadExhibitions();
    }
    // Reset state when modal opens
    if (open) {
      setError('');
    }
  }, [open, token, loadExhibitions]);

  const handleAssignExhibition = async (exhibition: Exhibition) => {
    if (!token) return;

    try {
      setAssigning(true);
      setError('');
      
      const result = await assignExhibitorToEvent(exhibitorId, exhibition.id, token);
      
      if (result.success) {
        onAssignSuccess(exhibition.name);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Błąd podczas przypisywania wydarzenia');
    } finally {
      setAssigning(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'planned':
        return 'primary';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktywne';
      case 'planned':
        return 'Planowane';
      case 'completed':
        return 'Zakończone';
      case 'cancelled':
        return 'Anulowane';
      default:
        return status;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle>
        <CustomTypography fontSize="1.25rem" fontWeight={600}>
          Przypisz wydarzenie do wystawcy
        </CustomTypography>
        <CustomTypography fontSize="0.875rem" color="#6c757d">
          Wystawca: <strong>{exhibitorName}</strong>
        </CustomTypography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : exhibitions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CustomTypography fontSize="1rem" color="#6c757d">
              Brak dostępnych wydarzeń do przypisania
            </CustomTypography>
            <CustomTypography fontSize="0.875rem" color="#6c757d">
              Wszystkie aktywne wydarzenia są już przypisane do tego wystawcy
            </CustomTypography>
          </Box>
        ) : (
          <List sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            {exhibitions.map((exhibition) => (
              <ListItem key={exhibition.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleAssignExhibition(exhibition)}
                  disabled={assigning}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    p: 2,
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      borderColor: '#6F87F6',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CustomTypography fontSize="1rem" fontWeight={500}>
                          {exhibition.name}
                        </CustomTypography>
                        <Chip
                          label={getStatusLabel(exhibition.status)}
                          size="small"
                          color={getStatusColor(exhibition.status) as any}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <CustomTypography fontSize="0.875rem" color="#6c757d">
                          📅 {formatDate(exhibition.start_date)} - {formatDate(exhibition.end_date)}
                        </CustomTypography>
                        {exhibition.location && (
                          <CustomTypography fontSize="0.875rem" color="#6c757d">
                            📍 {exhibition.location}
                          </CustomTypography>
                        )}
                        {exhibition.description && (
                          <Box sx={{ mt: 0.5 }}>
                            <CustomTypography fontSize="0.75rem" color="#6c757d">
                              {exhibition.description}
                            </CustomTypography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  {assigning && (
                    <CircularProgress size={20} sx={{ ml: 2 }} />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <CustomButton
          onClick={onClose}
          bgColor="transparent"
          textColor="#6c757d"
          width="auto"
          height="36px"
          sx={{
            border: '1px solid #e0e0e0',
            '&:hover': {
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          Anuluj
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
};

export default AssignEventModal;