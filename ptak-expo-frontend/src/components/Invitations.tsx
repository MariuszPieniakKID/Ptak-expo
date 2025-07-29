import React, { useState, useEffect, useCallback } from 'react';
import { Box, TextField, Alert, CircularProgress, Select, MenuItem, FormControl } from '@mui/material';
import CustomTypography from './customTypography/CustomTypography';
import CustomButton from './customButton/CustomButton';
import CustomField from './customField/CustomField';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import EmailIcon from '@mui/icons-material/Email';
import PreviewIcon from '@mui/icons-material/Preview';
import { useAuth } from '../contexts/AuthContext';
import { saveInvitation, getInvitations } from '../services/api';
import styles from './Invitations.module.scss';

interface InvitationData {
  id?: number;
  invitation_type: 'standard' | 'vip' | 'exhibitor' | 'guest';
  title: string;
  content: string;
  greeting: string;
  company_info: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  booth_info: string;
  special_offers: string;
}

interface InvitationsProps {
  exhibitionId: number;
}

const Invitations: React.FC<InvitationsProps> = ({ exhibitionId }) => {
  const { token } = useAuth();
  
  const [invitationData, setInvitationData] = useState<InvitationData>({
    invitation_type: 'vip',
    title: 'Zaproszenie VIP na Warsaw Industry Week! + plan wydarzeń na naszym stoisku',
    content: '',
    greeting: 'Szanowna Pani / Szanowny Panie,',
    company_info: '',
    contact_person: 'Zespół organizacyjny',
    contact_email: 'kontakt@warsawexpo.eu',
    contact_phone: '+48 22 761 49 99',
    booth_info: '',
    special_offers: `🚀 Fast Track – szybkie wejście bez kolejki
📦 Imienny pakiet – dostarczony przed wydarzeniem  
🎁 Welcome Pack z upominkiem
🎤 Dostęp do konferencji i warsztatów
🤝 Darmowy parking i opiekę concierge`
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
        setInvitationData({
          ...invitationData,
          ...(invitation.id && { id: invitation.id }),
          invitation_type: invitation.invitation_type,
          title: invitation.title,
          content: invitation.content,
          greeting: invitation.greeting || invitationData.greeting,
          company_info: invitation.company_info || '',
          contact_person: invitation.contact_person || invitationData.contact_person,
          contact_email: invitation.contact_email || invitationData.contact_email,
          contact_phone: invitation.contact_phone || invitationData.contact_phone,
          booth_info: invitation.booth_info || '',
          special_offers: invitation.special_offers || invitationData.special_offers
        });
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

  const handleInputChange = (field: keyof InvitationData, value: string) => {
    setInvitationData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear messages when user starts typing
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
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
      
      const response = await saveInvitation(exhibitionId, invitationData, token);
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
    return `${invitationData.greeting}

z radością zapraszamy do udziału w Warsaw Industry Week, które odbędą się w dniach 23.05.2025r. w Ptak Warsaw Expo.

Jako nasz gość specjalny otrzymuje Pan/Pani Biznes Priority Pass – bilet VIP o wartości 249 PLN, który obejmuje m.in.:

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
    <Box className={styles.invitationsContainer}>
      <CustomTypography fontSize="1.25rem" fontWeight={600} className={styles.title}>
        Zaproszenia
      </CustomTypography>

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

      <Box className={styles.invitationCard}>
        <Box className={styles.cardHeader}>
          <CustomTypography fontSize="1rem" fontWeight={500}>
            Treść przykładowa zaproszenia
          </CustomTypography>
          
          <Box className={styles.actionButtons}>
            <CustomButton
              onClick={() => setPreviewMode(!previewMode)}
              bgColor="transparent"
              textColor="#6F87F6"
              width="auto"
              height="32px"
              fontSize="0.75rem"
              startIcon={<PreviewIcon />}
              sx={{ border: '1px solid #6F87F6', mr: 1 }}
            >
              {previewMode ? 'Edycja' : 'Podgląd'}
            </CustomButton>
          </Box>
        </Box>

        <Box className={styles.formSection}>
          {/* Invitation Type */}
          <Box className={styles.fieldGroup}>
            <CustomTypography fontSize="0.875rem" fontWeight={500}>
              Typ zaproszenia
            </CustomTypography>
            <FormControl fullWidth size="small">
              <Select
                value={invitationData.invitation_type}
                onChange={(e) => handleInputChange('invitation_type', e.target.value as any)}
                className={styles.selectField}
              >
                <MenuItem value="vip">VIP</MenuItem>
                <MenuItem value="standard">Standardowe</MenuItem>
                <MenuItem value="exhibitor">Dla wystawców</MenuItem>
                <MenuItem value="guest">Dla gości</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Title */}
          <Box className={styles.fieldGroup}>
            <TextField
              label="Tytuł zaproszenia"
              value={invitationData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              multiline
              rows={2}
              fullWidth
              size="small"
              className={styles.textField}
            />
          </Box>

          {!previewMode ? (
            <>
              {/* Greeting */}
              <Box className={styles.fieldGroup}>
                <CustomField
                  label="Zwrot grzecznościowy"
                  value={invitationData.greeting}
                  onChange={(e) => handleInputChange('greeting', e.target.value)}
                  type="text"
                  className={styles.textField}
                />
              </Box>

              {/* Special Offers */}
              <Box className={styles.fieldGroup}>
                <TextField
                  label="Oferta specjalna / Benefity"
                  value={invitationData.special_offers}
                  onChange={(e) => handleInputChange('special_offers', e.target.value)}
                  multiline
                  rows={5}
                  fullWidth
                  size="small"
                  className={styles.textField}
                  placeholder="🚀 Fast Track – szybkie wejście bez kolejki"
                />
              </Box>

              {/* Booth Info */}
              <Box className={styles.fieldGroup}>
                <CustomField
                  label="Informacje o stoisku"
                  value={invitationData.booth_info}
                  onChange={(e) => handleInputChange('booth_info', e.target.value)}
                  type="text"
                  className={styles.textField}
                  placeholder="Hala A, stoisko 123"
                />
              </Box>

              {/* Contact Information */}
              <Box className={styles.contactSection}>
                <CustomTypography fontSize="0.875rem" fontWeight={500}>
                  Dane kontaktowe
                </CustomTypography>
                
                <Box className={styles.contactRow}>
                  <CustomField
                    label="Osoba kontaktowa"
                    value={invitationData.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    type="text"
                    className={styles.halfField}
                  />
                  <CustomField
                    label="Email kontaktowy"
                    value={invitationData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    type="email"
                    className={styles.halfField}
                  />
                </Box>
                
                <CustomField
                  label="Telefon kontaktowy"
                  value={invitationData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  type="tel"
                  className={styles.textField}
                />
              </Box>

              {/* Company Info */}
              <Box className={styles.fieldGroup}>
                <TextField
                  label="Informacje o firmie/organizatorze"
                  value={invitationData.company_info}
                  onChange={(e) => handleInputChange('company_info', e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                  className={styles.textField}
                />
              </Box>
            </>
          ) : (
            /* Preview Mode */
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
          )}

          {/* Action Buttons */}
          <Box className={styles.buttonGroup}>
            <CustomButton
              onClick={handleSave}
              disabled={loading}
              bgColor="#6F87F6"
              textColor="#fff"
              width="auto"
              height="36px"
              fontSize="0.875rem"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            >
              {loading ? 'Zapisywanie...' : 'Zapisz zaproszenie'}
            </CustomButton>

            <CustomButton
              bgColor="transparent"
              textColor="#6F87F6"
              width="auto"
              height="36px"
              fontSize="0.875rem"
              startIcon={<SendIcon />}
              sx={{ border: '1px solid #6F87F6', ml: 1 }}
            >
              Wyślij testowe
            </CustomButton>

            <CustomButton
              bgColor="transparent"
              textColor="#6F87F6"
              width="auto"
              height="36px"
              fontSize="0.875rem"
              startIcon={<EmailIcon />}
              sx={{ border: '1px solid #6F87F6', ml: 1 }}
            >
              Zarządzaj odbiorcami
            </CustomButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Invitations; 