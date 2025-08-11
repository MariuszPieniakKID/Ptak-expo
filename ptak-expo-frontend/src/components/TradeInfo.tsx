import React, { useState, useEffect } from 'react';
import { Box, TextField, IconButton, Divider, Alert, CircularProgress } from '@mui/material';
import CustomTypography from './customTypography/CustomTypography';
import CustomButton from './customButton/CustomButton';
import CustomField from './customField/CustomField';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import { saveTradeInfo, getTradeInfo, TradeInfoData, uploadTradePlan, downloadTradePlan } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import styles from './TradeInfo.module.scss';

interface TradeHours {
  exhibitorStart: string;
  exhibitorEnd: string;
  visitorStart: string;
  visitorEnd: string;
}

interface ContactInfo {
  guestService: string;
  security: string;
}

interface BuildDay {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface TradeSpace {
  id: string;
  name: string;
  hallName: string;
  filePath?: string | null;
  originalFilename?: string | null;
}

interface HallEntry {
  id: string;
  hallName: string;
  file?: File | null;
  filePath?: string | null | undefined;
  originalFilename?: string | null | undefined;
}

interface TradeInfoProps {
  exhibitionId: number;
}

const TradeInfo: React.FC<TradeInfoProps> = ({ exhibitionId }) => {
  const { token } = useAuth();
  
  const [tradeHours, setTradeHours] = useState<TradeHours>({
    exhibitorStart: '09:00',
    exhibitorEnd: '17:00',
    visitorStart: '09:00',
    visitorEnd: '17:00'
  });

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    guestService: '',
    security: ''
  });

  const [buildDays, setBuildDays] = useState<BuildDay[]>([
    { id: '1', date: '', startTime: '09:00', endTime: '17:00' }
  ]);

  const [buildType, setBuildType] = useState<string>('Montaż indywidualny');

  const [tradeSpaces, setTradeSpaces] = useState<TradeSpace[]>([
    { id: '1', name: '', hallName: 'HALA A' }
  ]);


  
  // Nowy stan dla uproszczonej funkcjonalności Plan Targów
  const [hallEntries, setHallEntries] = useState<HallEntry[]>([]);
  const [newHallName, setNewHallName] = useState<string>('');
  const [newHallFile, setNewHallFile] = useState<File | null>(null);
  const [tradeMessage, setTradeMessage] = useState<string>('');
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleAddBuildDay = () => {
    const newId = (buildDays.length + 1).toString();
    setBuildDays([...buildDays, { 
      id: newId, 
      date: '', 
      startTime: '09:00', 
      endTime: '17:00' 
    }]);
  };

  const handleRemoveBuildDay = (id: string) => {
    if (buildDays.length > 1) {
      setBuildDays(buildDays.filter(day => day.id !== id));
    }
  };



  // Load existing trade info when component mounts
  useEffect(() => {
    const loadTradeInfo = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        setError('');
        
        const response = await getTradeInfo(exhibitionId, token);
        
        if (response.success && response.data) {
          const data = response.data;
          setTradeHours(data.tradeHours);
          setContactInfo(data.contactInfo);
          setBuildDays(data.buildDays.length > 0 ? data.buildDays : [
            { id: '1', date: '', startTime: '09:00', endTime: '17:00' }
          ]);
          setBuildType(data.buildType);
          setTradeSpaces(data.tradeSpaces.length > 0 ? data.tradeSpaces : [
            { id: '1', name: '', hallName: 'HALA A' }
          ]);
          


          // Load hall entries from tradeSpaces
          const existingHalls: HallEntry[] = data.tradeSpaces.map(space => ({
            id: space.id,
            hallName: space.hallName,
            filePath: space.filePath || null,
            originalFilename: space.originalFilename || null
          }));
          setHallEntries(existingHalls);
          setTradeMessage(data.tradeMessage);
        }
      } catch (err: any) {
        console.error('Error loading trade info:', err);
        setError(err.message || 'Błąd podczas ładowania informacji targowych');
      } finally {
        setLoading(false);
      }
    };

    loadTradeInfo();
  }, [exhibitionId, token]);

  const handleSave = async () => {
    if (!token) {
      setError('Brak autoryzacji');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      // Convert hall entries back to tradeSpaces format for saving
      const spacesFromHalls: TradeSpace[] = hallEntries.map((hall, index) => ({
        id: (index + 1).toString(),
        name: hall.hallName,
        hallName: hall.hallName,
        filePath: null, // Will be set after file upload
        originalFilename: null
      }));

      const tradeInfoData: TradeInfoData = {
        tradeHours,
        contactInfo,
        buildDays,
        buildType,
        tradeSpaces: spacesFromHalls.length > 0 ? spacesFromHalls : tradeSpaces,
        tradeMessage
      };

      // First save trade info (creates trade_spaces in database)
      const response = await saveTradeInfo(exhibitionId, tradeInfoData, token);
      
      if (response.success) {
        // Now upload files for halls that have them
        const hallsWithFiles = hallEntries.filter(hall => hall.file);
        
        if (hallsWithFiles.length > 0) {
          setSuccessMessage('Zapisywanie i przesyłanie plików...');
          
          for (let i = 0; i < hallsWithFiles.length; i++) {
            const hall = hallsWithFiles[i];
            try {
              // Use index+1 as spaceId to match database structure
              const spaceId = (hallEntries.indexOf(hall) + 1).toString();
              const result = await uploadTradePlan(hall.file!, exhibitionId, spaceId, token!);
              
              // Update hall entry with file info
              setHallEntries(prev => 
                prev.map(h => 
                  h.id === hall.id 
                    ? { 
                        ...h, 
                        filePath: result.file.path,
                        originalFilename: result.file.originalname,
                        file: null // Clear local file after upload
                      }
                    : h
                )
              );
              
            } catch (uploadError: any) {
              console.error(`Error uploading file for ${hall.hallName}:`, uploadError);
              setError(`Błąd podczas przesyłania pliku dla ${hall.hallName}: ${uploadError.message}`);
            }
          }
        }
        
        setSuccessMessage('Informacje targowe i pliki zostały zapisane pomyślnie!');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err: any) {
      console.error('Error saving trade info:', err);
      setError(err.message || 'Błąd podczas zapisywania informacji targowych');
    } finally {
      setSaving(false);
    }
  };



  // Nowe funkcje dla uproszczonej funkcjonalności Plan Targów
  const handleNewHallFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setNewHallFile(file);
    } else if (file) {
      setError('Proszę wybrać plik PDF');
    }
    // Clear the input
    event.target.value = '';
  };

  const handleAddHall = async () => {
    if (!newHallName.trim()) {
      setError('Proszę podać nazwę hali');
      return;
    }

    setError('');
    const newId = Date.now().toString();
    
    // Add to hall entries (locally, without uploading yet)
    const newHall: HallEntry = {
      id: newId,
      hallName: newHallName.trim(),
      file: newHallFile, // Store file locally for now
      filePath: null,
      originalFilename: null
    };

    // Optimistically add hall to UI
    setHallEntries(prev => [...prev, newHall]);

    // Auto-save immediately and upload file (if provided)
    // Defer to next tick to ensure state is applied
    setTimeout(async () => {
      try {
        await handleSave();
        setSuccessMessage('Hala została dodana i zapisana.');
      } catch (e: any) {
        setError(e?.message || 'Błąd podczas automatycznego zapisu');
      } finally {
        // Reset form after save attempt
        setNewHallName('');
        setNewHallFile(null);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    }, 0);
  };

  const handleRemoveHall = (id: string) => {
    setHallEntries(prev => prev.filter(hall => hall.id !== id));
    setSuccessMessage('Hala została usunięta');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDownloadHallFile = async (hallId: string, filename: string) => {
    try {
      const blob = await downloadTradePlan(exhibitionId, hallId, token!);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error: any) {
      console.error('Error downloading file:', error);
      setError(error.message || 'Błąd podczas pobierania pliku');
    }
  };

  const handleSendMessage = () => {
    // Logika wysyłania wiadomości
    console.log('Sending trade message...', tradeMessage);
    setTradeMessage('');
  };

  if (loading) {
    return (
      <Box className={styles.tradeInfo}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box className={styles.tradeInfo}>
      <CustomTypography fontSize="1.25rem" fontWeight={600} className={styles.sectionTitle}>
        Informacje Targowe
      </CustomTypography>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Godziny otwarcia targów */}
      <Box className={styles.section}>
        <CustomTypography fontSize="1rem" fontWeight={500} className={styles.subsectionTitle}>
          Godziny otwarcia targów:
        </CustomTypography>
        
        <Box className={styles.hoursGrid}>
          {/* Dla wystawców */}
          <Box className={styles.hoursGroup}>
            <CustomTypography fontSize="0.875rem" fontWeight={500}>
              Dla wystawców:
            </CustomTypography>
            <Box className={styles.timeFields}>
              <Box className={styles.timeField}>
                <CustomField
                  type="time"
                  label="Początek"
                  value={tradeHours.exhibitorStart}
                  onChange={(e) => setTradeHours({...tradeHours, exhibitorStart: e.target.value})}
                  size="small"
                />
              </Box>
              <CustomTypography className={styles.timeSeparator}>–</CustomTypography>
              <Box className={styles.timeField}>
                <CustomField
                  type="time"
                  label="Koniec"
                  value={tradeHours.exhibitorEnd}
                  onChange={(e) => setTradeHours({...tradeHours, exhibitorEnd: e.target.value})}
                  size="small"
                />
              </Box>
            </Box>
          </Box>

          {/* Dla odwiedzających */}
          <Box className={styles.hoursGroup}>
            <CustomTypography fontSize="0.875rem" fontWeight={500}>
              Dla odwiedzających:
            </CustomTypography>
            <Box className={styles.timeFields}>
              <Box className={styles.timeField}>
                <CustomField
                  type="time"
                  label="Początek"
                  value={tradeHours.visitorStart}
                  onChange={(e) => setTradeHours({...tradeHours, visitorStart: e.target.value})}
                  size="small"
                />
              </Box>
              <CustomTypography className={styles.timeSeparator}>–</CustomTypography>
              <Box className={styles.timeField}>
                <CustomField
                  type="time"
                  label="Koniec"
                  value={tradeHours.visitorEnd}
                  onChange={(e) => setTradeHours({...tradeHours, visitorEnd: e.target.value})}
                  size="small"
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Divider className={styles.divider} />

      {/* Kontakt podczas targów */}
      <Box className={styles.section}>
        <CustomTypography fontSize="1rem" fontWeight={500} className={styles.subsectionTitle}>
          Kontakt podczas targów:
        </CustomTypography>
        
        <Box className={styles.contactGrid}>
          <Box className={styles.contactField}>
            <CustomTypography fontSize="0.875rem" fontWeight={500}>
              Obsługa Gości
            </CustomTypography>
            <CustomField
              type="text"
              label="Numer telefonu"
              value={contactInfo.guestService}
              onChange={(e) => setContactInfo({...contactInfo, guestService: e.target.value})}
              size="small"
              placeholder="+48 XXX XXX XXX"
            />
          </Box>
          
          <Box className={styles.contactField}>
            <CustomTypography fontSize="0.875rem" fontWeight={500}>
              Ochrona
            </CustomTypography>
            <CustomField
              type="text"
              label="Numer telefonu"
              value={contactInfo.security}
              onChange={(e) => setContactInfo({...contactInfo, security: e.target.value})}
              size="small"
              placeholder="+48 XXX XXX XXX"
            />
          </Box>
        </Box>
      </Box>

      <Divider className={styles.divider} />

      {/* Zabudowa targowa */}
      <Box className={styles.section}>
        <CustomTypography fontSize="1rem" fontWeight={500} className={styles.subsectionTitle}>
          Zabudowa targowa:
        </CustomTypography>
        
        <Box className={styles.buildSection}>
          <Box className={styles.buildTypeField}>
            <CustomTypography fontSize="0.875rem" fontWeight={500}>
              Typ wydarzenia
            </CustomTypography>
            <CustomField
              type="text"
              value={buildType}
              onChange={(e) => setBuildType(e.target.value)}
              size="small"
            />
          </Box>

          {buildDays.map((day) => (
            <Box key={day.id} className={styles.buildDay}>
              <Box className={styles.buildDayFields}>
                <CustomField
                  type="date"
                  label="Data"
                  value={day.date}
                  onChange={(e) => {
                    const updatedDays = buildDays.map(d => 
                      d.id === day.id ? {...d, date: e.target.value} : d
                    );
                    setBuildDays(updatedDays);
                  }}
                  size="small"
                />
                
                <CustomField
                  type="time"
                  value={day.startTime}
                  onChange={(e) => {
                    const updatedDays = buildDays.map(d => 
                      d.id === day.id ? {...d, startTime: e.target.value} : d
                    );
                    setBuildDays(updatedDays);
                  }}
                  size="small"
                />
                
                <CustomTypography className={styles.timeSeparator}>–</CustomTypography>
                
                <CustomField
                  type="time"
                  value={day.endTime}
                  onChange={(e) => {
                    const updatedDays = buildDays.map(d => 
                      d.id === day.id ? {...d, endTime: e.target.value} : d
                    );
                    setBuildDays(updatedDays);
                  }}
                  size="small"
                />

                {buildDays.length > 1 && (
                  <IconButton
                    onClick={() => handleRemoveBuildDay(day.id)}
                    size="small"
                    className={styles.removeButton}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </Box>
          ))}

          <CustomButton
            onClick={handleAddBuildDay}
            bgColor="transparent"
            textColor="#6F87F6"
            width="auto"
            height="36px"
            fontSize="0.75rem"
            startIcon={<AddIcon />}
            sx={{ border: '1px solid #6F87F6' }}
          >
            dodaj dzień
          </CustomButton>
        </Box>
      </Box>

      <Divider className={styles.divider} />

      {/* Plan Targów - Nowa uproszczona wersja */}
      <Box className={styles.section}>
        <CustomTypography fontSize="1rem" fontWeight={500} className={styles.subsectionTitle}>
          Plan Targów:
        </CustomTypography>
        
        <Box className={styles.planSection}>
          {/* Formularz dodawania nowej hali */}
          <Box className={styles.addHallForm}>
            <Box className={styles.hallInputRow}>
              <Box sx={{ flexGrow: 1, marginRight: '16px' }}>
                <CustomField
                  type="text"
                  label="Nazwa Hali"
                  value={newHallName}
                  onChange={(e) => setNewHallName(e.target.value)}
                  size="small"
                  placeholder="np. HALA A"
                />
              </Box>
              
              <input
                accept="application/pdf"
                style={{ display: 'none' }}
                id="new-hall-file-upload"
                type="file"
                onChange={handleNewHallFileUpload}
              />
              <label htmlFor="new-hall-file-upload">
                <CustomButton
                  component="span"
                  bgColor="transparent"
                  textColor="#6F87F6"
                  width="auto"
                  height="36px"
                  fontSize="0.75rem"
                  startIcon={<UploadFileIcon />}
                  sx={{ border: '1px solid #6F87F6', marginRight: 1 }}
                >
                  wgraj plik
                </CustomButton>
              </label>
            </Box>

            {newHallFile && (
              <Box className={styles.selectedFile} sx={{ mt: 1 }}>
                <CustomTypography fontSize="0.75rem" color="#6c757d">
                  📄 Wybrany plik: {newHallFile.name}
                </CustomTypography>
              </Box>
            )}

            <Box className={styles.addButtonRow} sx={{ mt: 2 }}>
              <CustomButton
                onClick={handleAddHall}
                bgColor="#6F87F6"
                textColor="#fff"
                width="auto"
                height="36px"
                fontSize="0.75rem"
                startIcon={<AddIcon />}
                disabled={!newHallName.trim()}
              >
                dodaj
              </CustomButton>
            </Box>
          </Box>

          {/* Lista dodanych hal */}
          {hallEntries.length > 0 && (
            <Box className={styles.hallsList} sx={{ mt: 3 }}>
              <Box sx={{ marginBottom: '16px' }}>
                <CustomTypography fontSize="0.875rem" fontWeight={500}>
                  Dodane hale:
                </CustomTypography>
              </Box>
              
              {hallEntries.map((hall) => (
                <Box key={hall.id} className={styles.hallEntry} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  p: 2, 
                  mb: 1, 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <Box sx={{ marginRight: '16px' }}>
                    <CustomTypography fontSize="0.875rem" fontWeight={500}>
                      {hall.hallName}
                    </CustomTypography>
                  </Box>
                  
                  {hall.originalFilename ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 'auto' }}>
                      <Box sx={{ marginRight: '8px' }}>
                        <CustomTypography fontSize="0.75rem" color="#6c757d">
                          📄 {hall.originalFilename}
                        </CustomTypography>
                      </Box>
                      <CustomButton
                        bgColor="transparent"
                        textColor="#6F87F6"
                        width="auto"
                        height="24px"
                        fontSize="0.75rem"
                        onClick={() => handleDownloadHallFile(hall.id, hall.originalFilename!)}
                        sx={{ mr: 1 }}
                      >
                        pobierz
                      </CustomButton>
                    </Box>
                  ) : hall.file ? (
                    <Box sx={{ marginRight: 'auto' }}>
                      <CustomTypography fontSize="0.75rem" color="#ff9800">
                        📄 {hall.file.name} (nie zapisany)
                      </CustomTypography>
                    </Box>
                  ) : (
                    <Box sx={{ marginRight: 'auto' }}>
                      <CustomTypography fontSize="0.75rem" color="#999">
                        Brak pliku
                      </CustomTypography>
                    </Box>
                  )}
                  
                  <CustomButton
                    bgColor="#dc3545"
                    textColor="#fff"
                    width="auto"
                    height="32px"
                    fontSize="0.75rem"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleRemoveHall(hall.id)}
                  >
                    usuń
                  </CustomButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <Divider className={styles.divider} />

      {/* Wiadomości dotyczące targów */}
      <Box className={styles.section}>
        <CustomTypography fontSize="1rem" fontWeight={500} className={styles.subsectionTitle}>
          Wiadomości dotyczące targów:
        </CustomTypography>
        
        <Box className={styles.messageSection}>
          <CustomTypography fontSize="0.875rem" color="#6c757d" className={styles.messageHelp}>
            Wyślij wiadomość dotyczącą zgłoszenia (max. 750 znaków)
          </CustomTypography>
          
          <TextField
            multiline
            rows={4}
            value={tradeMessage}
            onChange={(e) => setTradeMessage(e.target.value)}
            placeholder="Treść Powiadomienia"
            variant="outlined"
            fullWidth
            inputProps={{ maxLength: 750 }}
            className={styles.messageField}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 'var(--br-10, 10px)',
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#6F87F6',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6F87F6',
                },
              },
            }}
          />
          
          <Box className={styles.messageActions}>
            <CustomTypography fontSize="0.75rem" color="#6c757d">
              {tradeMessage.length}/750 znaków
            </CustomTypography>
            
            <CustomButton
              onClick={handleSendMessage}
              bgColor="#6F87F6"
              textColor="#fff"
              width="auto"
              height="36px"
              fontSize="0.75rem"
              startIcon={<SendIcon />}
              disabled={!tradeMessage.trim()}
            >
              wyślij
            </CustomButton>
          </Box>
        </Box>
      </Box>

      {/* Przycisk Zapisz */}
      <Box className={styles.saveSection}>
        <CustomButton
          onClick={handleSave}
          bgColor="#6F87F6"
          textColor="#fff"
          width="120px"
          height="40px"
          fontSize="0.875rem"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          disabled={saving}
        >
          {saving ? 'Zapisywanie...' : 'zapisz'}
        </CustomButton>
      </Box>
    </Box>
  );
};

export default TradeInfo; 