import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import {
  User,
  UserAssignments,
  fetchUserAssignments,
  reassignUserStands,
  setUserStatus,
} from '../../services/api';

export type UserStatusDialogMode = 'deactivate' | 'reassign' | 'blockedDelete';

interface Props {
  open: boolean;
  mode: UserStatusDialogMode;
  user: User | null;
  staff: User[];
  token: string;
  onClose: () => void;
  onDone: (message: string) => void;
}

const UserStatusDialog: React.FC<Props> = ({ open, mode, user, staff, token, onClose, onDone }) => {
  const [assignments, setAssignments] = useState<UserAssignments | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reassignTo, setReassignTo] = useState<number | ''>('');

  useEffect(() => {
    if (!open || !user) return;
    setAssignments(null);
    setError('');
    setReassignTo('');
    setLoading(true);
    fetchUserAssignments(user.id, token)
      .then(setAssignments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, user, token]);

  if (!user) return null;

  const candidates = staff.filter(
    (s) => s.id !== user.id && s.role === 'admin' && (s.status || 'active') === 'active'
  );
  const upcoming = assignments?.upcomingStands || 0;

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      if (mode === 'reassign') {
        if (!reassignTo) return;
        const r = await reassignUserStands(user.id, Number(reassignTo), token);
        onDone(r.message);
      } else {
        const r = await setUserStatus(user.id, 'inactive', token, reassignTo ? Number(reassignTo) : null);
        onDone(r.message);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const title =
    mode === 'reassign' ? `Przepisz stoiska: ${user.fullName}` : `Dezaktywuj konto: ${user.fullName}`;

  return (
    <Dialog open={open} onClose={() => { if (!saving) onClose(); }} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {mode === 'blockedDelete' && assignments && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Tego konta nie można usunąć, bo ma powiązania:{' '}
            {assignments.references.map((r) => `${r.label} (${r.count})`).join(', ')}. Usunięcie odebrałoby
            wystawcom opiekuna, a historii autora. Zamiast tego dezaktywuj konto.
          </Alert>
        )}
        {mode !== 'reassign' && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Konto nieaktywne nie zaloguje się do panelu (zalogowana osoba straci dostęp od razu) i nie będzie
            można go wybrać jako opiekuna. Wystawcy, historia i dokumenty zostają bez zmian. Konto można w każdej
            chwili aktywować ponownie.
          </Typography>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {assignments && (
          <>
            {upcoming > 0 ? (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Opiekun stoisk na nadchodzących targach: <strong>{upcoming}</strong>
                </Typography>
                <Box component="ul" sx={{ mt: 0, mb: 2, pl: 3 }}>
                  {assignments.upcomingByExhibition.map((e) => (
                    <li key={e.exhibitionId}>
                      <Typography variant="body2">
                        {e.exhibitionName}: {e.stands}
                      </Typography>
                    </li>
                  ))}
                </Box>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={mode === 'reassign' ? 'Nowy opiekun' : 'Przepisz te stoiska na (opcjonalnie)'}
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value === '' ? '' : Number(e.target.value))}
                >
                  {mode !== 'reassign' && <MenuItem value="">Nie przepisuj</MenuItem>}
                  {candidates.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.fullName}
                    </MenuItem>
                  ))}
                </TextField>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Stoiska z zakończonych targów zostają przy dotychczasowym opiekunie.
                </Typography>
              </>
            ) : (
              <Typography variant="body2">Brak stoisk na nadchodzących targach.</Typography>
            )}
          </>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Anuluj
        </Button>
        <Button
          variant="contained"
          color={mode === 'reassign' ? 'primary' : 'warning'}
          onClick={submit}
          disabled={saving || loading || !assignments || (mode === 'reassign' && !reassignTo)}
        >
          {saving ? 'Zapisywanie…' : mode === 'reassign' ? 'Przepisz stoiska' : 'Dezaktywuj konto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserStatusDialog;
