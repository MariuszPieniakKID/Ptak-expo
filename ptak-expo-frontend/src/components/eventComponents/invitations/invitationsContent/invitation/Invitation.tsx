import React, { useState, useEffect, useCallback } from 'react';
import { Box, TextField, Alert, CircularProgress, Divider, styled } from '@mui/material';
import styles from './Invitation.module.scss';
import { useAuth } from '../../../../../contexts/AuthContext';
import config from '../../../../../config/config';
import { getInvitations, saveInvitation, getBenefits, createBenefit, updateBenefit, deleteBenefit, getInvitationById, deleteInvitation, sendInvitationTest } from '../../../../../services/api';
import CustomField from '../../../../customField/CustomField';
import CustomTypography from '../../../../customTypography/CustomTypography';
import ComponentWithAction from '../../../../componentWithAction/ComponentWithAction';
import { ReactComponent as ImgIcon} from '../../../../../assets/imgIcon.svg';
import CustomSelectMui from '../../../../customSelectMui/CustomSelectMui';
import { invitationOptions } from '../../../../../helpers/mockData';


interface InvitationData {
  id?: number;
  //price:number;//NEW
  invitation_type: 'standard' | 'vip' | 'exhibitor' | 'guest';
  title: string;
  //benefitsArray: _SpecialOffers[]; zamiennik special_offers
  //activateLink:string;//NEW
  content: string;
  greeting: string;
  company_info: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  booth_info: string;
  special_offers?: number[] | undefined;
}


interface InvitationProps {
  exhibitionId: number;
}


const CustomTextField = styled(TextField)(({ multiline }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "15px",
    height: multiline ? "auto" : "29px", // dynamiczna wysokość
    alignItems: "flex-start",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "1px solid #D7D9DD",
    borderRadius: "15px",
  },
  "& .MuiInputBase-input": {
    height: multiline ? "auto" : "29px",
    minHeight: multiline ? "unset" : "29px",
    padding: multiline ? "10px 14px" : "0 14px",
    boxSizing: "border-box",
    fontSize: "14px",
    fontWeight: 400,
    // multiline: domyślnie textarea, więc flex i align mogą powodować błędy dla textarea, stąd warunek:
    display: multiline ? undefined : "flex",
    alignItems: multiline ? undefined : "center",
    resize: "none", // blokada rozwijania textarea przez użytkownika (opcjonalnie)
  },
  "& .MuiInputLabel-root": {
    color: "#A7A7A7",
    fontSize: "11px",
    fontWeight: 300,
  },
}));



const Invitation: React.FC<InvitationProps> = ({ exhibitionId }) => {
const { token, user } = useAuth();
 const [price, setPrice] = useState<string>('');
 const [benefitTitle, setBenefitTitle] = useState<string>('');
 const [benefitContent, setBenefitContent] = useState<string>('');
 const [benefitFile, setBenefitFile] = useState<File | null>(null);
 const [benefitPreviewUrl, setBenefitPreviewUrl] = useState<string>('');
 const [isUploadingBenefit, setIsUploadingBenefit] = useState(false);
 const [benefits, setBenefits] = useState<Array<{ id: number; title: string; description: string; file_url?: string | null }>>([]);
 const [editingBenefitId, setEditingBenefitId] = useState<number | null>(null);
 const [savedInvitations, setSavedInvitations] = useState<Array<{ id: number; title: string; type: string }>>([]);

const [invitationData, setInvitationData] = useState<InvitationData>({
  invitation_type: 'vip',
  //price:0,
  title: '',
  content: '',
  greeting: '',
 // benefitsArray:[],
  //activateLink:'',
  company_info: '',
  contact_person: '',
  contact_email: '',
  contact_phone: '',
  booth_info: '',
  special_offers: [], 
}); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

 
  const loadInvitationData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await getInvitations(exhibitionId, token);
      if (response.data?.invitations?.length > 0) {
        const invitation = response.data.invitations.find(inv => inv.invitation_type === 'vip') || response.data.invitations[0];
        setInvitationData(prev => ({
          ...prev,
          ...(invitation.id && { id: invitation.id }),
          //price:invitation.price,
          invitation_type: invitation.invitation_type,
          title: invitation.title,
          content: invitation.content,
          //benefitsArray:invitation.benefitsArray,
          //activateLink:invitation.activeLink,
          greeting: invitation.greeting || prev.greeting,
          company_info: invitation.company_info || '',
          contact_person: invitation.contact_person || prev.contact_person,
          contact_email: invitation.contact_email || prev.contact_email,
          contact_phone: invitation.contact_phone || prev.contact_phone,
          booth_info: invitation.booth_info || '',
          special_offers: typeof (invitation as any).special_offers === 'string'
            ? (invitation as any).special_offers
                .split(',')
                .map((v: string) => v.trim())
                .filter((v: string) => v.length > 0)
                .map((v: string) => Number(v))
                .filter((n: number) => !Number.isNaN(n))
            : (Array.isArray((invitation as any).special_offers) ? (invitation as any).special_offers : prev.special_offers)
        }));
        // ustaw pole VIP price jeśli istnieje
        if ((invitation as any).vip_value) {
          setPrice(String((invitation as any).vip_value));
        }
        // lista zapisanych zaproszeń posortowana po tytule
        const list = [...response.data.invitations]
          .map((i: any) => ({ id: i.id as number, title: String(i.title || ''), type: String(i.invitation_type || '') }))
          .sort((a, b) => a.title.localeCompare(b.title));
        setSavedInvitations(list);
      }
    } catch (error: any) {
      console.error('Error loading invitation data:', error);
      setError('Błąd podczas ładowania danych zaproszeń');
    } finally {
      setLoading(false);
    }
  }, [exhibitionId, token]);

  const loadBenefits = useCallback(async () => {
    if (!token) return;
    try {
      const list = await getBenefits(exhibitionId, token);
      setBenefits(list.map(it => ({ id: it.id, title: it.title, description: it.description, file_url: it.file_url })));
    } catch (e) {
      console.error('Error loading benefits:', e);
    }
  }, [exhibitionId, token]);

  // Load existing invitation data
  useEffect(() => {
    loadInvitationData();
    loadBenefits();
  }, [loadInvitationData, loadBenefits]);

const handleInputChange = (
  field: keyof InvitationData,
  value: string | typeof invitationData.special_offers
) => {
  // Jeśli to 'special_offers', upewnij się, że jest tablica
  if (field === 'special_offers' && !Array.isArray(value)) {
    return; // lub konwersja, albo ignoruj wartość niepoprawną
  }

  setInvitationData(prev => ({
    ...prev,
    [field]: value,
  }));

  if (error) setError('');
  if (successMessage) setSuccessMessage('');
};

const saveData = {
  ...invitationData,
  ...(price ? { vip_value: price } : {}),
  
  special_offers: invitationData.special_offers
  ? invitationData.special_offers.join(',')
  :'', // konwersja tablicy na string jeśli API tego wymaga
};

  const benefitFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const handleBenefitFileClick = () => benefitFileInputRef.current?.click();
  const handleBenefitFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setBenefitFile(file);
      const url = URL.createObjectURL(file);
      setBenefitPreviewUrl(url);
    }
  };

  const handleCreateBenefit = async () => {
    if (!token) {
      setError('Brak autoryzacji - zaloguj się ponownie');
      return;
    }
    if (!benefitTitle.trim() || !benefitContent.trim()) {
      setError('Podaj tytuł i treść benefitu');
      return;
    }
    try {
      setIsUploadingBenefit(true);
      setError('');
      const result = await createBenefit(exhibitionId, { file: benefitFile as any, title: benefitTitle.trim(), description: benefitContent.trim() }, token);
      if (result.success) {
        setSuccessMessage('Benefit został dodany');
        setBenefitFile(null);
        setBenefitPreviewUrl('');
        setBenefitTitle('');
        setBenefitContent('');
        await loadBenefits();
      } else {
        setError(result.message || 'Nie udało się dodać benefitu');
      }
    } catch (e: any) {
      setError(e.message || 'Błąd podczas dodawania benefitu');
    } finally {
      setIsUploadingBenefit(false);
    }
  };

  const handleToggleBenefit = (id: number) => {
    setInvitationData(prev => {
      const selected = new Set(prev.special_offers || []);
      if (selected.has(id)) selected.delete(id); else selected.add(id);
      return { ...prev, special_offers: Array.from(selected) };
    });
  };

  const handleStartEditBenefit = (id: number) => {
    const b = benefits.find(x => x.id === id);
    if (!b) return;
    setEditingBenefitId(id);
    setBenefitTitle(b.title);
    setBenefitContent(b.description || '');
    setBenefitFile(null);
    setBenefitPreviewUrl('');
  };

  const handleSaveBenefitEdit = async () => {
    if (!token || editingBenefitId === null) return;
    try {
      setIsUploadingBenefit(true);
      const payload: { file?: File; title?: string; description?: string } = {
        title: benefitTitle.trim(),
        description: benefitContent.trim(),
      };
      if (benefitFile) payload.file = benefitFile;
      await updateBenefit(editingBenefitId, payload, token);
      setEditingBenefitId(null);
      setBenefitTitle('');
      setBenefitContent('');
      setBenefitFile(null);
      setBenefitPreviewUrl('');
      await loadBenefits();
    } catch (e: any) {
      setError(e.message || 'Błąd podczas zapisywania benefitu');
    } finally {
      setIsUploadingBenefit(false);
    }
  };

  const handleDeleteBenefit = async (id: number) => {
    if (!token) return;
    try {
      await deleteBenefit(id, token);
      setInvitationData(prev => ({
        ...prev,
        special_offers: (prev.special_offers || []).filter(x => x !== id)
      }));
      await loadBenefits();
    } catch (e: any) {
      setError(e.message || 'Błąd podczas usuwania benefitu');
    }
  };

  const handleEditInvitationClick = async (id: number) => {
    if (!token) return;
    try {
      const res = await getInvitationById(id, token);
      const inv = res.data;
      setInvitationData(prev => ({
        ...prev,
        ...(inv.id ? { id: inv.id as number } : {}),
        invitation_type: (inv as any).invitation_type || prev.invitation_type,
        title: inv.title || '',
        content: inv.content || '',
        greeting: (inv as any).greeting || '',
        company_info: (inv as any).company_info || '',
        contact_person: (inv as any).contact_person || '',
        contact_email: (inv as any).contact_email || '',
        contact_phone: (inv as any).contact_phone || '',
        booth_info: (inv as any).booth_info || '',
        special_offers: typeof (inv as any).special_offers === 'string'
          ? (inv as any).special_offers.split(',').map((v: string)=>Number(v)).filter((n:number)=>!Number.isNaN(n))
          : Array.isArray((inv as any).special_offers) ? (inv as any).special_offers : []
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setError(e.message || 'Nie udało się wczytać zaproszenia do edycji');
    }
  };

  const handleDeleteInvitationClick = async (id: number) => {
    if (!token) return;
    try {
      await deleteInvitation(id, token);
      await loadInvitationData();
    } catch (e: any) {
      setError(e.message || 'Nie udało się usunąć zaproszenia');
    }
  };

  const handleSave = async () => {
    if (!token) {
      setError('Brak autoryzacji - zaloguj się ponownie');
      return;
    }

    if (!invitationData.title.trim() || !invitationData.content.trim()) {
      setError('Tytuł i treść zaproszenia są wymagane');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await saveInvitation(exhibitionId, saveData, token);
      if (response.success) {
        setSuccessMessage(response.message || 'Zaproszenie zostało zapisane pomyślnie');
                 if (response.data?.id && !invitationData.id) {
           setInvitationData(prev => {
             const newData = { ...prev };
             if (response.data?.id) {
               newData.id = response.data.id;
             }
             return newData;
           });
         }
        // Refresh list after save so the new/updated invitation appears immediately
        await loadInvitationData();
      } else {
        setError(response.message || 'Błąd podczas zapisywania zaproszenia');
      }
      
    } catch (error: any) {
      console.error('Error saving invitation:', error);
      setError(error.message || 'Błąd podczas zapisywania zaproszenia');
    } finally {
      setLoading(false);
    }
  };

  const generateInvitationContent = useCallback(() => {


    const selectedBenefits = (invitationData.special_offers || [])
      .map(id => benefits.find(o => o.id === id))
      .filter(Boolean) as Array<{ id: number; title: string; description: string; file_url?: string | null }>;

    const benefitsBlock = selectedBenefits.length
      ? selectedBenefits.map(b => `• ${b.title}${b.description ? ' – ' + b.description : ''}`).join('\n')
      : '';

    // Domyślna treść tylko kiedy puste
    return `${invitationData.greeting || ''}

${benefitsBlock}

${invitationData.booth_info ? `Nasze stoisko: ${invitationData.booth_info}` : ''}

${invitationData.company_info || ''}`;
  }, [
    invitationData.greeting,
    invitationData.special_offers,
    invitationData.booth_info,
    invitationData.company_info,
    benefits
  ]);

  // Auto-generate content once when empty; do not overwrite user input
  useEffect(() => {
    setInvitationData(prev => {
      if (prev.content && prev.content.trim().length > 0) return prev;
      const content = generateInvitationContent();
      return { ...prev, content };
    });
  }, [generateInvitationContent]);

  const handleTestSend = async () => {
    try {
      if (!token) {
        setError('Brak autoryzacji - zaloguj się ponownie');
        return;
      }
      const meEmail = user?.email || '';
      if (!meEmail) {
        setError('Brak adresu e-mail zalogowanego użytkownika');
        return;
      }
      setError('');
      // Ensure the latest form data is saved to template
      const saveRes = await saveInvitation(exhibitionId, saveData as any, token);
      const templateId = (saveRes && saveRes.data && saveRes.data.id) ? saveRes.data.id : invitationData.id;
      const payload: { templateId?: number; recipientName?: string; recipientEmail: string } = { recipientEmail: meEmail };
      if (typeof templateId === 'number') payload.templateId = templateId;
      const rn = user?.firstName ? `${user?.firstName} ${user?.lastName || ''}`.trim() : '';
      if (rn) payload.recipientName = rn;
      const res = await sendInvitationTest(exhibitionId, payload, token);
      if (res.success) {
        setSuccessMessage('Wysłano testowe zaproszenie');
      } else {
        setError(res.message || 'Nie udało się wysłać testowego zaproszenia');
      }
    } catch (e: any) {
      setError(e.message || 'Błąd podczas wysyłki testowej');
    }
  };

  if (loading && !invitationData.title) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress size={40} />
        <CustomTypography fontSize="0.875rem">
          Ładowanie danych zaproszeń...
        </CustomTypography>
      </Box>
    );
  }

  return (
    <Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Box >
        <Divider 
        sx={{marginTop:'-2.5rem'}}
        className={styles.divider_}
        />

        {/* Wartość przykładowego zaproszenia */}
         <Box className={styles.section}>
            <Box className={styles.priceInvitationRow}>
                <CustomField 
                type={'text'} 
                value={price} 
                onChange={(e)=>setPrice(e.target.value)}
                label="Określ wartość zaproszenia VIP"
                placeholder="Określ wartość zaproszenia VIP"
                fullWidth
                />
            </Box>
        </Box>

        <Divider className={styles.divider_} />
    


         {/* Treść przykładowa zaproszenia */}
        <Box className={styles.section} sx={{marginTop:'2rem'}}>
            <Box className={styles.columnInvitation}> 
                <Box className={styles.titleWithAction}>
                    <CustomTypography className={styles.titleUpload}>Treść przykładowa zaproszenia</CustomTypography>
                    <ComponentWithAction 
                        iconType={'preview'} 
                        handleAction={() => setPreviewMode(!previewMode)} 
                        buttonTitle={!previewMode?'zobacz podgląd':'wyłącz podgląd'}
                       //hideTextOnMobile={true}
                    />
                </Box>


                {!previewMode 
                ?  
                <>
                    {/* Invitation Type */}
                        <Box>
                            <CustomSelectMui
                            label="Typ zaproszenia"
                            placeholder=""
                            value={invitationData.invitation_type}
                            onChange={(value) => handleInputChange('invitation_type', value as string)}
                            options={invitationOptions}
                            size="small"
                            fullWidth
                            />
                        </Box>
                    {/* Title */}
                        <Box>
                            <CustomTextField
                                label="Tytuł zaproszenia"
                                value={invitationData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                multiline
                                rows={3}
                                fullWidth
                                size="small"
                                className={styles.textField}
                                placeholder="Zaproszenie VIP na Warsaw Industry Week! + plan wydarzeń na naszym stoisku"
                                inputProps={{ maxLength: 840}}
                                />              
                        </Box>
                    {/* Content (Treść zaproszenia) - shown after type selection */}
                        <Box>
                            <CustomTextField
                                label="Treść zaproszenia"
                                value={invitationData.content}
                                onChange={(e) => handleInputChange('content', e.target.value)}
                                multiline
                                rows={6}
                                fullWidth
                                size="small"
                                className={styles.textField}
                                placeholder="Treść zaproszenia"
                                inputProps={{ maxLength: 4000}}
                            />
                        </Box>
                    {/*Zwrot grzecznościowy */}
                        <Box>
                            <CustomTextField
                                label="Zwrot grzecznościowy"
                                value={invitationData.greeting}
                                onChange={(e) => handleInputChange('greeting', e.target.value)}
                                rows={1}
                                fullWidth
                                size="small"
                                className={styles.textField}
                                placeholder="Szanowna Pani / Szanowny Panie,"
                                inputProps={{ }}
                                />              
                        </Box>
                    {/* Dodaj nowy benefit – przeniesione nad listę benefitów */}
                        <Box className={styles.section} sx={{marginTop:'1rem', marginBottom:'1rem'}}>
                          <Box className={styles.column}> 
                            <CustomTypography className={styles.titleUpload}>Benefit</CustomTypography>
                            <Box className={styles.technicalInfoView}>
                              <Box className={styles.technicalInfoViewText}> opis</Box>
                              {<Box className={styles.technicalInfoViewText}> wymiar px</Box>}
                            </Box>
                            <Box className={styles.row}>
                              <Box className={styles.imageBenefit}>
                                <Box className={styles.uploadFile}>
                                  <Box className={styles.uploadBox}>
                                    <Box className={`${styles.uploadBoxIn} `}>
                                      <Box className={styles.insideUploadBox} onClick={handleBenefitFileClick}>
                                        <Box className={styles.iconCircle}><ImgIcon/></Box>
                                        <CustomTypography className={styles.infoInUploadBox}>
                                          {benefitFile ? benefitFile.name : 'Przeciągnij i upuść, aby dodać plik'}
                                        </CustomTypography>
                                      </Box>
                                    </Box>
                                  </Box>
                                </Box>
                                <Box className={styles.column}> 
                                  <Box className={styles.viewLabel}>Podgląd:</Box>
                                  <Box className={styles.view}>{benefitPreviewUrl && (
                                    <img src={benefitPreviewUrl} alt="benefit" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                  )}</Box>
                                  <input type="file" ref={benefitFileInputRef} style={{ display: 'none' }} onChange={handleBenefitFileChange} />
                                </Box>
                              </Box>
                              <Box className={styles.infoBenefit}>
                                <Box  className={styles.column}>
                                  <Box className={styles.onetextField}>
                                    <CustomTextField
                                      label="Tytuł benefitu"
                                      value={benefitTitle}
                                      onChange={(e) => setBenefitTitle(e.target.value)}
                                      multiline
                                      rows={1}
                                      fullWidth
                                      size="small"
                                      className={styles.textField}
                                    />
                                  </Box>
                                  <Box>       
                                    <CustomTextField
                                      label="Treść benefitu"
                                      value={benefitContent}
                                      onChange={(e) => setBenefitContent(e.target.value)}
                                      multiline
                                      rows={4}
                                      fullWidth
                                      size="small"
                                      className={styles.textField}
                                      placeholder="Opis (max 840znaków)"
                                      inputProps={{ maxLength: 840}}
                                    />
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                            <Box className={styles.rowWithAction}>
                              <Box className={styles.addBenefit}>
                                <ComponentWithAction 
                                  iconType={'add'} 
                                  handleAction={handleCreateBenefit} 
                                  buttonTitle={'dodaj benefit'}
                                  disabled={isUploadingBenefit || (!benefitTitle.trim() || !benefitContent.trim())}
                                />
                              </Box>
                              <Box className={styles.saveBenefit}>
                                <ComponentWithAction 
                                  iconType={'save'} 
                                  handleAction={editingBenefitId ? handleSaveBenefitEdit : handleCreateBenefit} 
                                  buttonTitle={editingBenefitId ? 'zapisz zmiany' : 'zapisz zmiany'}
                                  iconFirst={false}
                                  disabled={isUploadingBenefit}
                                />
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                    {/* Special Offers - checkbox list with edit/delete */}
                        <Box>
                          <CustomTypography className={styles.label}>Oferta specjalna / Benefity</CustomTypography>
                          <Box className={styles.column}>
                            {benefits.map(b => (
                              <Box key={b.id} className={styles.row} style={{ alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                                <input
                                  type="checkbox"
                                  checked={(invitationData.special_offers || []).includes(b.id)}
                                  onChange={() => handleToggleBenefit(b.id)}
                                  style={{ width: 16, height: 16 }}
                                />
                                <CustomTypography className={styles.benefitListItemText}>{b.title}</CustomTypography>
                                <Box style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                                  <ComponentWithAction iconType={'tools'} handleAction={() => handleStartEditBenefit(b.id)} buttonTitle={'edytuj'} />
                                  <ComponentWithAction iconType={'delete'} handleAction={() => handleDeleteBenefit(b.id)} buttonTitle={'usuń'} />
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </Box>

                    <Divider className={styles.divider_} />  
                    {/* Booth Info */}
                        <Box className={styles.columnInput}>
                            <CustomTypography className={styles.label}>Informacje o stoisku:</CustomTypography>
                            <CustomTextField
                                label="Informacje o stoisku"
                                value={invitationData.booth_info}
                                onChange={(e) => handleInputChange('booth_info', e.target.value)}
                                fullWidth
                                size="small"
                                className={styles.textField}
                                placeholder="Numer Hali"
                            /> 
                            <CustomTextField
                                label="Informacje o stoisku"
                                value={''}
                                onChange={()=>console.log("Jeżeli potrzebne pole na nr stoiska")}
                                fullWidth
                                size="small"
                                className={styles.textField}
                                placeholder="Numer stoiska"
                            /> 
                            <CustomTextField
                                label="Informacje o stoisku"
                                value={''}
                                onChange={()=>console.log("Jeżeli potrzebna nazwa wystawcy")}
                                fullWidth
                                size="small"
                                className={styles.textField}
                                placeholder="Nazwa wystawcy"
                            />   
                        </Box>
                    {/* Contact Information */}
                        <Box>
                            <Box className={styles.contactSection_}>
                                <CustomTypography className={styles.label}>Dane kontaktowe:</CustomTypography>
                                <CustomTextField
                                    label="Osoba kontaktowa"
                                    value={invitationData.contact_person}
                                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                                    fullWidth
                                    size="small"
                                    className={styles.textField}
                                    placeholder="Zespół organizacyjny"
                                />
                                <Box className={styles.row} sx={{paddingBottom:'1rem'}}>
                                    <Box className={styles.contactRow}>
                                        <CustomTextField
                                        label="Email kontaktowy"
                                        value={invitationData.contact_email}
                                        onChange={(e) => handleInputChange('contact_email', e.target.value)}
                                        fullWidth
                                        size="small"
                                        className={styles.textField}
                                        placeholder="kontakt@warsawexpo.eu"
                                        /> 
                                    </Box>  
                                    <Box className={styles.contactRow}>
                                        <CustomTextField
                                        label="Telefon kontaktowy"
                                        value={invitationData.contact_phone}
                                        onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                                        fullWidth
                                        size="small"
                                        className={styles.textField}
                                        placeholder="+48 22 761 49 99"
                                    />
                                    </Box>

                                </Box>
                            

                            </Box>
                    </Box>
                    {/* Company Info */}
                        <Box>
                            <CustomTextField
                                label="Informacje o firmie/organizatorze"
                                value={invitationData.company_info}
                                onChange={(e) => handleInputChange('company_info', e.target.value)}
                                multiline
                                rows={4}
                                fullWidth
                                size="small"
                                className={styles.textField}
                                />
                        </Box>
                </>
                : 
                <>
                <Box className={styles.previewSection}>
                  <Box className={styles.invitationPreview}>
                    <CustomTypography fontSize="1.125rem" fontWeight={600} className={styles.previewTitle}>
                      {invitationData.title || 'Podgląd zaproszenia'}
                    </CustomTypography>
                    <Box className={styles.previewContent}>
                      <div className={styles.previewText}
                        dangerouslySetInnerHTML={{ __html: `
                          <p>${(invitationData.greeting || '').replace(/\n/g,'<br/>')}</p>
                          <p>${(invitationData.content || '').replace(/\n/g,'<br/>')}</p>
                          ${((invitationData.special_offers||[]).length ? '<h4>Benefity:</h4><ul>' + (invitationData.special_offers||[]).map(id => {
                            const b = benefits.find(x=>x.id===id);
                            return b ? `<li><strong>${b.title}</strong>${b.description ? ' – ' + b.description : ''}</li>` : '';
                          }).join('') + '</ul>' : '')}
                          ${(invitationData.booth_info ? `<p><strong>Informacje o stoisku:</strong> ${invitationData.booth_info}</p>` : '')}
                          ${(invitationData.contact_person ? `<p><strong>Osoba kontaktowa:</strong> ${invitationData.contact_person}</p>` : '')}
                          ${(invitationData.contact_email ? `<p><strong>Email:</strong> ${invitationData.contact_email}</p>` : '')}
                          ${(invitationData.contact_phone ? `<p><strong>Telefon:</strong> ${invitationData.contact_phone}</p>` : '')}
                          ${(invitationData.company_info ? `<p><strong>Informacje o firmie/organizatorze:</strong><br/>${invitationData.company_info.replace(/\n/g,'<br/>')}</p>` : '')}
                          ${(() => {
                            const files = (invitationData.special_offers||[])
                              .map(id => benefits.find(x=>x.id===id)?.file_url)
                              .filter((u): u is string => !!u);
                            if (!files.length) return '';
                            const list = files.map(u => {
                              const name = u.split('/').pop() || 'plik';
                              const href = `${config.API_BASE_URL}${u}`;
                              return `<li><a href="${href}" target="_blank" rel="noopener noreferrer">${name}</a></li>`;
                            }).join('');
                            return `<p><strong>Załączniki:</strong></p><ul>${list}</ul>`;
                          })()}
                        `}} />
                    </Box>
                  </Box>
                </Box>
                </>
                
                }


                <Box className={styles.rowWithAction}>
                    <Box>
                      <ComponentWithAction 
                      iconType={'save'} 
                      handleAction={handleSave} 
                      buttonTitle={'zapisz'}/>
                    </Box>
                    <Box>
                    <ComponentWithAction 
                      iconType={'send'} 
                      handleAction={handleTestSend} 
                      buttonTitle={'Testowe wysyłanie'}/>
                    </Box>
                    <Box>
                    <ComponentWithAction 
                      iconType={'tools'} 
                      handleAction={()=>console.log("Zarządzanie odpbiorcami")} 
                      buttonTitle={'Zarządzanie odpbiorcami'}/>
                    </Box>

                </Box>
            </Box>

        </Box>

        {/* Lista zapisanych zaproszeń */}
        <Box className={styles.savedListSection}>
          <CustomTypography className={styles.savedListTitle}>Zapisane zaproszenia</CustomTypography>
          <Box className={styles.savedList}>
            {savedInvitations.length === 0 ? (
              <CustomTypography>Brak zapisanych zaproszeń</CustomTypography>
            ) : (
              savedInvitations.map((it) => (
                <Box key={it.id} className={styles.savedListItem}>
                  <Box className={styles.savedListItemType}>
                    <CustomTypography fontSize="0.85rem" fontWeight={600}>{it.type}</CustomTypography>
                  </Box>
                  <CustomTypography className={styles.savedListItemTitle} fontSize="0.95rem" fontWeight={600}>{it.title}</CustomTypography>
                  <Box className={styles.savedListItemActions}>
                    <ComponentWithAction iconType={'tools'} handleAction={() => handleEditInvitationClick(it.id)} buttonTitle={'edytuj'} />
                    <ComponentWithAction iconType={'delete'} handleAction={() => handleDeleteInvitationClick(it.id)} buttonTitle={'usuń'} />
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>












      


      </Box>
    </Box>
  );
};

export default Invitation; 