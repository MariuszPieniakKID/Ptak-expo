import React, { useState, useEffect, useCallback } from 'react';
import { Box, TextField, Alert, CircularProgress, Divider, styled } from '@mui/material';
import styles from './Invitation.module.scss';
import { useAuth } from '../../../../../contexts/AuthContext';
import { getInvitations, saveInvitation } from '../../../../../services/api';
import CustomField from '../../../../customField/CustomField';
import CustomTypography from '../../../../customTypography/CustomTypography';
import ComponentWithAction from '../../../../componentWithAction/ComponentWithAction';
import { ReactComponent as ImgIcon} from '../../../../../assets/imgIcon.svg';
import CustomSelectMui from '../../../../customSelectMui/CustomSelectMui';
import { invitationOptions, specialOffersOptions } from '../../../../../helpers/mockData';
import {_SpecialOffers} from '../../../../../types/types'


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
  special_offers?: Array<'fastTrack' | 'personalizedPackage' | 'welcomPack' | 'accessToConferencesAndWorkshops' | 'FreeparkingAndConciergrService'>|undefined;
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
const { token } = useAuth();
 const [price, _setPrice]=useState<string>('');
 const [benefitTitle,_setBenefitTitle]=useState<string>('');
 const [benefitContent,_setBenefitContent]=useState<string>('');

const [invitationData, setInvitationData] = useState<InvitationData>({
  invitation_type: 'vip',
  //price:0,
  title: 'Zaproszenie VIP na Warsaw Industry Week! + plan wydarzeń na naszym stoisku',
  content: '',
  greeting: 'Szanowna Pani / Szanowny Panie,',
 // benefitsArray:[],
  //activateLink:'',
  company_info: '',
  contact_person: 'Zespół organizacyjny',
  contact_email: 'kontakt@warsawexpo.eu',
  contact_phone: '+48 22 761 49 99',
  booth_info: '',
  special_offers: ['fastTrack', 'welcomPack'], 
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
          special_offers: Array.isArray(invitation.special_offers) ? invitation.special_offers : prev.special_offers
        }));
      }
    } catch (error: any) {
      console.error('Error loading invitation data:', error);
      setError('Błąd podczas ładowania danych zaproszeń');
    } finally {
      setLoading(false);
    }
  }, [exhibitionId, token]);

  // Load existing invitation data
  useEffect(() => {
    loadInvitationData();
  }, [loadInvitationData]);

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
  
  special_offers: invitationData.special_offers
  ? invitationData.special_offers.join(',')
  :'', // konwersja tablicy na string jeśli API tego wymaga
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


    const offerDescriptions = {
    fastTrack: '🚀 Fast Track – szybkie wejście bez kolejki',
    personalizedPackage: '📦 Imienny pakiet – dostarczony przed wydarzeniem',
    welcomPack: '🎁 Welcome Pack z upominkiem',
    accessToConferencesAndWorkshops: '🎤 Dostęp do konferencji i warsztatów',
    FreeparkingAndConciergrService: '🤝 Darmowy parking i opiekę concierge'
  };

  const specialOffersText = invitationData.special_offers
  ?invitationData.special_offers
    .map(key => offerDescriptions[key])
    .join('\n')
  :null
    return `${invitationData.greeting}

z radością zapraszamy do udziału w Warsaw Industry Week, które odbędą się w dniach 23.05.2025r. w Ptak Warsaw Expo.

Jako nasz gość specjalny otrzymuje Pan/Pani Biznes Priority Pass – bilet VIP o wartości 249 PLN, który obejmuje m.in.:
${specialOffersText} ??

${invitationData.special_offers}

${invitationData.booth_info ? `\nNasze stoisko: ${invitationData.booth_info}` : ''}

Aktywuj swoje zaproszenie klikając w poniższy link:
[LINK AKTYWACYJNY]

W razie pytań prosimy o kontakt:
${invitationData.contact_person}
${invitationData.contact_email}
${invitationData.contact_phone}

${invitationData.company_info}

Serdecznie zapraszamy!
Zespół Warsaw Industry Week`;
  }, [
    invitationData.greeting,
    invitationData.special_offers,
    invitationData.booth_info,
    invitationData.contact_person,
    invitationData.contact_email,
    invitationData.contact_phone,
    invitationData.company_info
  ]);

  // Auto-generate content when fields change
  useEffect(() => {
    const content = generateInvitationContent();
    setInvitationData(prev => ({
      ...prev,
      content
    }));
  }, [generateInvitationContent]);

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
                onChange={()=>console.log("Ustawianie wartości zaproszenia")}
                label="Określ wartość zaproszenia VIP"
                placeholder="Określ wartość zaproszenia VIP"
                fullWidth
                />
            </Box>
            <Box className={styles.savePrise}>
            <ComponentWithAction 
                iconType={'save'} 
                handleAction={()=>console.log("Add endpoint to save")}
                buttonTitle={'zapisz'}
                iconFirst={false}
                disabled={price===''}
                />
            </Box>
        </Box>

        <Divider className={styles.divider_} />

       {/* Opis Priority Bussiness Pass */}
         <Box className={styles.section} sx={{marginTop:'1rem', marginBottom:'1rem'}}>
            <Box className={styles.column}> 
                <CustomTypography className={styles.titleUpload}>Nazwa Pliku</CustomTypography>
                <Box className={styles.technicalInfoView}>
                    <Box className={styles.technicalInfoViewText}> opis</Box>
                    {<Box className={styles.technicalInfoViewText}> wymiar px</Box>}
                </Box>
           <Box className={styles.row}>
             <Box className={styles.imageBenefit}>
                <Box className={styles.uploadFile}>
                    <Box className={styles.uploadBox}>
                        <Box className={`${styles.uploadBoxIn} `}>
                           <Box className={styles.insideUploadBox}>
                            <Box className={styles.iconCircle}><ImgIcon/></Box>
                            <CustomTypography className={styles.infoInUploadBox}>
                             Przeciągnij i upuść, aby dodać plik
                            </CustomTypography>
                           </Box>
                        </Box>
                    </Box>
                    
                </Box>
                <Box className={styles.column}> 
                    <Box className={styles.viewLabel}>Podgląd:</Box>
                    <Box className={styles.view}></Box>
                </Box>
            </Box>
             <Box className={styles.infoBenefit}>
                <Box  className={styles.column}>
                    <Box className={styles.onetextField}>
                        <CustomTextField
                        label="Tytuł benefitu"
                        value={benefitTitle}
                        onChange={() => console.log("Tytuł benefitu")}
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
                        onChange={() => console.log("Treść benefitu")}
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
                handleAction={()=>console.log("Add another Benefit")} 
                buttonTitle={'dodaj benefit'}/>
            </Box>
             <Box className={styles.saveBenefit}>
               <ComponentWithAction 
                iconType={'save'} 
                handleAction={()=>console.log("Zapisz zmiany w benefit")} 
                buttonTitle={'zapisz zmiany'}
                iconFirst={false}/>
             </Box>
           </Box>
           </Box>
         </Box>

        <Divider className={styles.divider_} sx={{margin:'2rem 0rem'}}/>
    


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
                                label="Tytuł zaproszeniau"
                                value={invitationData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                multiline
                                rows={3}
                                fullWidth
                                size="small"
                                className={styles.textField}
                                placeholder=""
                                inputProps={{ maxLength: 840}}
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
                                placeholder=""
                                inputProps={{ }}
                                />              
                        </Box>
                    {/* Special Offers */} 
                        <Box>
                            <CustomSelectMui
                            label="Oferta specjalna / Benefity"
                            value={invitationData.special_offers?invitationData.special_offers:''}
                            onChange={(value) => handleInputChange('special_offers', value as typeof invitationData.special_offers)}
                            options={specialOffersOptions}
                            size="small"
                            fullWidth
                            multiple
                            />
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
                                value={'Numer stoiska?'}
                                onChange={()=>console.log("Jeżlei ptrzebne pole na nr stoiska")}
                                fullWidth
                                size="small"
                                className={styles.textField}
                                placeholder="Numer stoiska"
                            /> 
                            <CustomTextField
                                label="Informacje o stoisku"
                                value={'Nazwa wystawcy?'}
                                onChange={()=>console.log("Jeżlei ptrzebne nazwa wystawcy")}
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
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    fullWidth
                                    size="small"
                                    className={styles.textField}
                                    placeholder=""
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
                                        placeholder=""
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
                                        placeholder=""
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
                    {invitationData.title}
                    </CustomTypography>
                    
                    <Box className={styles.previewContent}>
                    <pre className={styles.previewText}>
                        {invitationData.content}
                    </pre>
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
                      handleAction={()=>console.log("Testowe wysyłanie")} 
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












      


      </Box>
    </Box>
  );
};

export default Invitation; 