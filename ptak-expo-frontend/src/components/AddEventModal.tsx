import React, { useState, useCallback } from 'react';
import CustomButton from './customButton/CustomButton';
import CustomField from './customField/CustomField';
import CustomTypography from './customTypography/CustomTypography';
import { addExhibition, AddExhibitionPayload } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import styles from './AddEventModal.module.scss';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventAdded: () => void;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onEventAdded }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<AddExhibitionPayload>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    status: 'planned'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback((field: keyof AddExhibitionPayload) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Brak autoryzacji');
      return;
    }

    if (!formData.name.trim()) {
      setError('Nazwa wydarzenia jest wymagana');
      return;
    }

    if (!formData.start_date) {
      setError('Data rozpoczęcia jest wymagana');
      return;
    }

    if (!formData.end_date) {
      setError('Data zakończenia jest wymagana');
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError('Data rozpoczęcia nie może być późniejsza niż data zakończenia');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addExhibition(formData, token!);

      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        location: '',
        status: 'planned'
      });
      onEventAdded();
      onClose();
    } catch (err) {
      setError('Wystąpił błąd podczas dodawania wydarzenia. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.rectangleGroup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.rectangleDiv}></div>
        
        <div className={styles.dodajWystawcParent}>
          <CustomTypography className={styles.dodajWystawc}>
            Dodaj wydarzenie
          </CustomTypography>
          <CustomTypography className={styles.wydarzenia}>
            Wydarzenia
          </CustomTypography>
          <img className={styles.maskGroup30} alt="" src="/assets/mask-group-29@2x.png" />
        </div>

        <img className={styles.groupChild7} alt="" src="/assets/group-30324.svg" onClick={handleClose} />

        <form onSubmit={handleSubmit}>
          <div className={styles.nazwaWydarzeniaParent}>
            <CustomTypography className={styles.nazwaWydarzenia}>
              Nazwa wydarzenia
            </CustomTypography>
            <CustomField
              type="text"
              placeholder="Podaj nazwę wydarzenia"
              value={formData.name}
              onChange={handleInputChange('name')}
              className={styles.inputField}
            />

            <CustomTypography className={styles.dataWydarzenia}>
              Data wydarzenia
            </CustomTypography>
            
            <div className={styles.dateContainer}>
              <div className={styles.dateField}>
                <CustomField
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange('start_date')}
                  className={styles.dateInput}
                />
                <CustomTypography className={styles.dataRozpoczecia}>
                  Data rozpoczęcia
                </CustomTypography>
              </div>
              
              <div className={styles.dateField}>
                <CustomField
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange('end_date')}
                  className={styles.dateInput}
                />
                <CustomTypography className={styles.dataZakoczenia}>
                  Data zakończenia
                </CustomTypography>
              </div>
            </div>
          </div>

          <div className={styles.lokalizacjaParent}>
            <CustomTypography className={styles.lokalizacja}>
              Lokalizacja
            </CustomTypography>
            <CustomField
              type="text"
              placeholder="Podaj lokalizację wydarzenia"
              value={formData.location || ''}
              onChange={handleInputChange('location')}
              className={styles.inputField}
            />
          </div>

          <div className={styles.opisParent}>
            <CustomTypography className={styles.opis}>
              Opis wydarzenia
            </CustomTypography>
            <CustomField
              type="text"
              placeholder="Opis wydarzenia"
              value={formData.description || ''}
              onChange={handleInputChange('description')}
              className={styles.inputField}
            />
          </div>

          {error && (
            <CustomTypography className={styles.error}>
              {error}
            </CustomTypography>
          )}

          <div className={styles.groupParent8}>
            <CustomButton
              type="submit"
              disabled={loading}
              className={styles.dodajButton}
            >
              {loading ? 'Dodawanie...' : 'Dodaj'}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal; 