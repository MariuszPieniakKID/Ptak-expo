import React, { useState, useEffect, useRef } from 'react';
import { Box,  Divider, Alert, CircularProgress } from '@mui/material';
import styles from './TradeInfo.module.scss';
import { useAuth } from '../../../../../contexts/AuthContext';
import { downloadTradePlan, getTradeInfo, saveTradeInfo, TradeInfoData, uploadTradePlan } from '../../../../../services/api';
import CustomTypography from '../../../../customTypography/CustomTypography';
import CustomField from '../../../../customField/CustomField';
import { buildDaysOption} from '../../../../../helpers/mockData';
import CustomSelectMui from '../../../../customSelectMui/CustomSelectMui';
import { ReactComponent as Wastebasket} from "../../../../../assets/wastebasket.svg";
import { ReactComponent as AddIconSVG} from "../../../../../assets/blackAddIcon.svg";
import ComponentWithDocument from '../../../../componentWithDocument/ComponentWithDocument';
import ComponentWithAction from '../../../../componentWithAction/ComponentWithAction';
import SendMessageContainer from '../../../../exhibitorDatabaseDocuments/messageContainer/SendMessageContainer';

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
//const [buildType, setBuildType] = useState<string | number | Array<string | number>>("Montaż indywidualny");
const [buildType, setBuildType] = useState<string>('');





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
  const [_saving, setSaving] = useState<boolean>(false);
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
  
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    inputRef.current?.click();
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
    <Box className={styles.tradeInfo_}>
       <Divider className={styles.divider_}/>
      
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
      <Box className={styles.section_}>
        <CustomTypography className={styles.subsectionTitle_}> Godziny otwarcia targów:</CustomTypography>
        <Box className={styles.hoursWrapper_}>
             <Box className={styles.hoursForGroup}>
                <CustomTypography className={styles.hoursGrup_}>Dla wystawców:</CustomTypography>
                  <Box className={styles.timeBox_}>
                    <Box className={styles.widthChange_}>
                        <CustomField
                        type="time"
                        label="Początek"
                        value={tradeHours.exhibitorStart}
                        onChange={(e) => setTradeHours({...tradeHours, exhibitorStart: e.target.value})}
                        size="small"
                        fullWidth
                        />
                    </Box>
                    <CustomTypography className={styles.timeSeparator_}>–</CustomTypography>
                    <Box className={styles.widthChange_}>
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
             <Box className={styles.hoursForGroup}>
                <CustomTypography className={styles.hoursGrup_}>Dla odwiedzających:</CustomTypography>
                <Box className={styles.timeBox_}>
                    <Box className={styles.widthChange_}>
                        <CustomField
                            type="time"
                            label="Początek"
                            value={tradeHours.visitorStart}
                            onChange={(e) => setTradeHours({...tradeHours, visitorStart: e.target.value})}
                            size="small"
                            fullWidth
                        />
                    </Box>
                   <CustomTypography className={styles.timeSeparator_}>–</CustomTypography>
                    <Box className={styles.widthChange_}>
                        <CustomField
                            type="time"
                            label="Koniec"
                            value={tradeHours.visitorEnd}
                            onChange={(e) => setTradeHours({...tradeHours, visitorEnd: e.target.value})}
                            size="small"
                            fullWidth
                         />
                    </Box>
                </Box>
        </Box>
             
        </Box>
      </Box>

      <Divider className={styles.divider_}/>

      {/* Kontakt podczas targów */}
      <Box  className={styles.section_}>
        <CustomTypography className={styles.subsectionTitle_}> Kontakt podczas targów:</CustomTypography>
        <Box className={styles.contactWrapper_}>
            <Box className={styles.contactWidth_}>
                <CustomField
                    type="text"
                    label=""
                    value={contactInfo.guestService}
                    onChange={(e) => setContactInfo({...contactInfo, guestService: e.target.value})}
                    size="small"
                    placeholder="Numer telefonu"
                    fullWidth
                />
                <CustomTypography className={styles.LabelInfo_}>Obsługa Gości</CustomTypography>
            </Box>
            <Box className={styles.contactWidth_}>
                 <CustomField
                    type="text"
                    label=""
                    value={contactInfo.security}
                    onChange={(e) => setContactInfo({...contactInfo, security: e.target.value})}
                    size="small"
                    placeholder="Numer telefonu"
                    fullWidth
                />
                <CustomTypography className={styles.LabelInfo_}>Ochrona</CustomTypography>
            </Box>
        </Box>
      </Box>

      <Divider className={styles.divider_} />

      {/* Zabudowa targowa */}
      <Box className={styles.section_}>
        <CustomTypography className={styles.subsectionTitle_}>Zabudowa targowa:</CustomTypography>
        <Box className={styles.technicalsWrapper_}>
           <Box className={styles.selectWrtapper_}>
              <CustomTypography className={styles.selectLabel_}>Typ wydarzenia</CustomTypography>
                <CustomSelectMui
                    label=""
                    placeholder="Wybierz typ"
                    value={buildType} 
                    onChange={(value) => setBuildType(String(value))}
                    options={buildDaysOption}
                    size="small"
                    fullWidth
                    />
          </Box>
          <Box className={styles.dataWrapper_}>
               {buildDays.map((day) => (
                  <Box key={day.id} className={styles.singleDate_}>
                    <Box className={styles.dataPart_}>
                      <Box className={styles.technicalDate_}>
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
                          fullWidth
                        />
                      </Box>
                    </Box>
                    <Box  className={styles.startEndTime_}>
                      <Box  className={styles.technicalTime_}>
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
                  
                      </Box>
                      <CustomTypography className={styles.separatorIndustry_}>–</CustomTypography>
                      <Box className={styles.technicalTime_}>
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
                      </Box> 
                    </Box> 
                    {buildDays.length > 1 && (
                      <Box className={styles.IconTrash}>
                        <Wastebasket
                        onClick={() => handleRemoveBuildDay(day.id)}
                        className={styles.removeButton_}
                        />
                      </Box>
                      )}
                  </Box>
               ))} 
          </Box>

        </Box>
        <Box className={styles.sectionWithAction}>
          <Box className={styles.actionBox} onClick={handleAddBuildDay}>
            <AddIconSVG className={styles.actionIcon}/>
            <CustomTypography className={styles.actionLabel}>dodaj dzień</CustomTypography>
          </Box>
         </Box>
      </Box>
      <Divider className={styles.divider} />

      {/* Plan Targów - Nowa uproszczona wersja */}
      <Box className={styles.section_}>
        <CustomTypography className={styles.subsectionTitle_}>Plan Targów:</CustomTypography>
        <Box className={styles.fairPlnRow}>
          <Box className={styles.fairPlnIn}>
            <CustomField
                  type="text"
                  label="Nazwa Hali"
                  value={newHallName}
                  onChange={(e) => setNewHallName(e.target.value)}
                  size="small"
                  placeholder="np. HALA A"
                  fullWidth
                />
          </Box>
          
          <Box className={styles.fairPlnIn} 
              sx={{
                  paddingTop: '1.25rem',
                  '@media (max-width:600px)': {
                    paddingTop: '0rem',
                  },
                }}
              >
            {newHallFile
            ? <ComponentWithDocument 
            documentType={'pdf'} 
            handleDelete={()=>setNewHallFile(null)}
            documentName={'hallName'} 
            deleteIcon={'cross'}/>
            :<Box>
              <>
              <ComponentWithAction
                iconType={"upload"}
                handleAction={handleButtonClick}
                buttonTitle={"wgraj plik"}
              />
              <input
                type="file"
                accept="application/pdf"
                ref={inputRef}
                style={{ display: "none" }}
                onChange={handleNewHallFileUpload}
              />
            </>
            </Box>}

          </Box>
        </Box>
        <Box className={styles.actionRow}>
          <Box className={styles.fairPlnIn}>
            {(newHallFile && newHallName.trim() !== '' )
            &&<Box 
            className={styles.actionBox} 
            onClick={handleAddHall}>
              <AddIconSVG className={styles.actionIcon}/>
              <CustomTypography className={styles.actionLabel}>dodaj przestrzeń</CustomTypography>
            </Box>}
          </Box>
        </Box>
        <Box className={styles.planSection}>
          {/* Lista dodanych hal */}
          {hallEntries.length > 0 && (
            <Box className={styles.wrapperHallList_}>
              <CustomTypography className={styles.fileListTitle_}>Przestrzeń:</CustomTypography>
              {hallEntries.map((hall) => (
                <Box key={hall.id} className={styles.singleHallFile_} >
                  <Box className={styles.infoHallRow_}>
                    <CustomTypography className={styles.hallNameLabel_}>Nazwa hali: </CustomTypography>
                    <CustomTypography className={styles.hallName_}>{hall.hallName}</CustomTypography>                    
                  </Box>
                  {hall.originalFilename 
                  ?<Box className={styles.actionRow_}> 
                      <ComponentWithDocument 
                        documentType={'pdf'} 
                        handleDelete={() => handleRemoveHall(hall.id)}
                        documentName={hall.originalFilename} 
                        deleteIcon={'cross'}
                        />
                      <ComponentWithAction 
                        iconType={'download'} 
                        handleAction={() => handleDownloadHallFile(hall.id, hall.originalFilename!)}
                        buttonTitle={''}
                        />
                    </Box>
                  :hall.file 
                    ? <Box className={styles.actionRow_}>
                        <ComponentWithDocument 
                        documentType={'pdf'} 
                        handleDelete={() => handleRemoveHall(hall.id)}
                        documentName={`${hall.file.name} (nie zapisany)`} 
                        deleteIcon={'cross'}
                        />
                      </Box>
                    : <Box className={styles.actionRow_}>
                        <CustomTypography className={styles.noFile_}>Brak pliku</CustomTypography>
                        <ComponentWithDocument 
                        documentType={'noFile'} 
                        handleDelete={() => handleRemoveHall(hall.id)}
                        documentName={``} 
                        deleteIcon={'cross'}
                        />
                      </Box>
                  }
                </Box>
              ))}
            </Box>)
          }
        </Box>   
      </Box>

      <Divider className={styles.divider} />

      {/* Zapisz button */}

      <Box className={styles.section_}>
        <Box className={styles.saveButtonRow}>
            <ComponentWithAction
              iconType={"save"}
              handleAction={handleSave}
              buttonTitle={"zapisz"}
              iconFirst={false}
            />
          </Box>
        </Box>
      <Divider className={styles.divider} />

      {/* Wiadomości dotyczące targów */}
      <Box className={styles.section_}>
        <CustomTypography className={styles.subsectionTitle_}>Wiadomości dotyczące targów:</CustomTypography>
        <Box className={styles.messageWrapper_}>
          <SendMessageContainer
             onSend={  handleSendMessage}
             paperBackground={'#f5f5f5'}
             legendBackground={'#f5f5f5'}
             textAreaBackground={'#f5f5f5'}
          />
        </Box>
      </Box>
  </Box>
  );
};

export default TradeInfo; 