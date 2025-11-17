import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  CircularProgress, 
  Alert,
  TablePagination
} from '@mui/material';
import CustomTypography from '../../components/customTypography/CustomTypography';
import CustomField from '../../components/customField/CustomField';
import config from '../../config/config';
import styles from '../usersPage/UsersPage.module.scss';

interface ActivityLog {
  id: number;
  user_id: number | null;
  user_email: string;
  first_name: string | null;
  last_name: string | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  entity_name: string | null;
  details: string | null;
  created_at: string;
}

interface LogsTabProps {
  token: string;
}

const LogsTab: React.FC<LogsTabProps> = ({ token }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(50);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const loadLogs = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString()
      });
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(
        `${config.API_BASE_URL}/api/v1/activity-logs?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Nie udało się pobrać logów');
      }
      
      const data = await response.json();
      setLogs(data.data || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: any) {
      console.error('Error loading logs:', err);
      setError(err.message || 'Nie udało się pobrać logów aktywności');
    } finally {
      setLoading(false);
    }
  }, [token, page, rowsPerPage, startDate, endDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getActionLabel = (action: string): string => {
    const actions: Record<string, string> = {
      'create': 'Utworzono',
      'update': 'Zaktualizowano',
      'delete': 'Usunięto',
      'assign': 'Przypisano',
      'unassign': 'Odpisano'
    };
    return actions[action] || action;
  };

  const getEntityTypeLabel = (entityType: string): string => {
    const types: Record<string, string> = {
      'event': 'Wydarzenie',
      'exhibitor': 'Wystawca',
      'user': 'Użytkownik',
      'invitation': 'Zaproszenie'
    };
    return types[entityType] || entityType;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getUserName = (log: ActivityLog): string => {
    if (log.first_name && log.last_name) {
      return `${log.first_name} ${log.last_name}`;
    }
    return log.user_email || 'Nieznany';
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <CustomField
          type="date"
          value={startDate}
          onChange={(e: any) => {
            setStartDate(e.target.value);
            setPage(0);
          }}
          placeholder="Data od"
          size="small"
          className={styles.searchField}
          label="Data od"
        />
        <CustomField
          type="date"
          value={endDate}
          onChange={(e: any) => {
            setEndDate(e.target.value);
            setPage(0);
          }}
          placeholder="Data do"
          size="small"
          className={styles.searchField}
          label="Data do"
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper className={styles.tableContainer}>
            <TableContainer>
              <Table>
                <TableHead className={styles.tableHead}>
                  <TableRow>
                    <TableCell className={styles.tableCell}>
                      <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E">
                        Data i godzina
                      </CustomTypography>
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E">
                        Użytkownik
                      </CustomTypography>
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E">
                        Akcja
                      </CustomTypography>
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E">
                        Typ
                      </CustomTypography>
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E">
                        Nazwa
                      </CustomTypography>
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E">
                        Szczegóły
                      </CustomTypography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className={styles.tableCellL}>
                        <CustomTypography fontSize="0.875em" fontWeight={300}>
                          {formatDate(log.created_at)}
                        </CustomTypography>
                      </TableCell>
                      <TableCell className={styles.tableCellL}>
                        <CustomTypography fontSize="0.875em" fontWeight={300}>
                          {getUserName(log)}
                        </CustomTypography>
                      </TableCell>
                      <TableCell className={styles.tableCellL}>
                        <CustomTypography fontSize="0.875em" fontWeight={300}>
                          {getActionLabel(log.action)}
                        </CustomTypography>
                      </TableCell>
                      <TableCell className={styles.tableCellL}>
                        <CustomTypography fontSize="0.875em" fontWeight={300}>
                          {getEntityTypeLabel(log.entity_type)}
                        </CustomTypography>
                      </TableCell>
                      <TableCell className={styles.tableCellL}>
                        <CustomTypography fontSize="0.875em" fontWeight={300}>
                          {log.entity_name || '-'}
                        </CustomTypography>
                      </TableCell>
                      <TableCell className={styles.tableCellL}>
                        <CustomTypography fontSize="0.875em" fontWeight={300}>
                          {log.details || '-'}
                        </CustomTypography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <CustomTypography fontSize="0.875em" fontWeight={300} color="#7F8D8E">
                          Brak logów do wyświetlenia
                        </CustomTypography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[25, 50, 100]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Wierszy na stronie:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} z ${count}`}
            />
          </Paper>
        </>
      )}
    </Box>
  );
};

export default LogsTab;

