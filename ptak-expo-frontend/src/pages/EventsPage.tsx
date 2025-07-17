import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/Menu';
import AddEventModal from '../components/AddEventModal';
import { fetchExhibitions, Exhibition } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import styles from './EventsPage.module.scss';

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = useCallback(() => {
    // TODO: Implement actual logout logic
    navigate('/');
  }, [navigate]);

  const handleBackClick = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const loadExhibitions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchExhibitions(token || undefined);
      setExhibitions(data);
    } catch (err) {
      setError('Nie udało się załadować wydarzeń');
      console.error('Error loading exhibitions:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleEventAdded = useCallback(() => {
    // Reload exhibitions after adding new event
    loadExhibitions();
  }, [loadExhibitions]);

  useEffect(() => {
    loadExhibitions();
  }, [loadExhibitions]);

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // Rozdziel wydarzenia na nadchodzące i pozostałe
  const now = new Date();
  const upcomingEvents = exhibitions.filter(exhibition => {
    const startDate = new Date(exhibition.start_date);
    return startDate > now && exhibition.status !== 'completed';
  }).slice(0, 9); // Maksymalnie 9 wydarzeń w siatce 3x3

  const otherEvents = exhibitions.filter(exhibition => {
    const startDate = new Date(exhibition.start_date);
    return startDate <= now || exhibition.status === 'completed';
  }).slice(0, 4); // Maksymalnie 4 wydarzenia w sekcji "pozostałe"

  if (loading) {
    return (
      <div className={styles.web136622}>
        <div className={styles.loading}>Ładowanie wydarzeń...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.web136622}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.web136622}>
      <img className={styles.maskGroup28} alt="" src="/assets/mask-group-28@2x.png" />
      <div className={styles.web136622Child} />
      <div className={styles.web136622Item} />
      <div className={styles.wydarzeniaParent}>
        <div className={styles.wydarzenia}>Wydarzenia</div>
        <img className={styles.maskGroup29} alt="" src="/assets/mask-group-29@2x.png" />
      </div>
      <div className={styles.groupParent} onClick={handleLogout}>
        <img className={styles.groupChild} alt="" src="/assets/group-872.svg" />
        <div className={styles.wyloguj}>Wyloguj</div>
      </div>
      <Menu />
      <div className={styles.nadchodzceWydarzenia}>Nadchodzące Wydarzenia:</div>
      <div className={styles.kontakt}>
        Kontakt • Polityka prywatności • www.warsawexpo.eu
      </div>
      
      <div className={styles.eventsGrid}>
        {upcomingEvents.map((exhibition, index) => (
          <div className={styles[`groupContainer${index + 1}`]} key={exhibition.id}>
            <div className={styles.branoweTargiTechnologiiFilParent}>
              <div className={styles.branoweTargiTechnologii}>
                {exhibition.name}
              </div>
              <div className={styles.div}>
                {formatDateRange(exhibition.start_date, exhibition.end_date)}
              </div>
            </div>
            <img
              className={styles.zrzutEkranu2025059O1359}
              alt=""
              src="/assets/zrzut-ekranu-2025059-o-135948@2x.png"
            />
            <img
              className={styles.c0b3b89d0a9a62260363c86ec53366Icon}
              alt=""
              src="/assets/c0b3b89d0a9a62260363c86ec53366e8@2x.png"
            />
          </div>
        ))}
      </div>

      {otherEvents.length > 0 && (
        <div className={styles.otherEventsSection}>
          <div className={styles.pozostaeWydarzenia}>Pozostałe wydarzenia:</div>
          <div className={styles.rectangleParent}>
            <div className={styles.groupChild2}></div>
            <div className={styles.wybierzBran}>Wybierz branżę</div>
            <img className={styles.path11762Icon} alt="" src="/assets/path-11762.svg" />
          </div>
          
          <div className={styles.otherEventsGrid}>
            {otherEvents.map(exhibition => (
              <div className={styles.groupParent6} key={exhibition.id}>
                <img className={styles.path11929Icon} alt="" src="/assets/path-11930.svg" />
                <div className={styles.branoweTargiTechnologiiFilContainer}>
                  <div className={styles.branoweTargiTechnologii1}>{exhibition.name}</div>
                  <div className={styles.div8}>
                    {formatDateRange(exhibition.start_date, exhibition.end_date)}
                  </div>
                </div>
                <img className={styles.zrzutEkranu2025059O1256} alt="" src="/assets/zrzut-ekranu-2025059-o-125633@2x.png" />
                <img className={styles.b1092d553226c40a2a909e94e07841Icon} alt="" src="/assets/b1092d553226c40a2a909e94e07841f4@2x.png" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.wstecz} onClick={handleBackClick}>wstecz</div>
      <img className={styles.web136622Inner} alt="" src="/assets/group-1027.svg" onClick={handleBackClick} />

      <div className={styles.dodajWydarzenieParent} onClick={handleOpenModal}>
        <div className={styles.dodajWydarzenie}>+ dodaj wydarzenie</div>
        <img className={styles.groupChild3} alt="" src="/assets/group-505.svg" />
      </div>

      <div className={styles.homeWydarzenia}>Home / Wydarzenia</div>
      
      <div className={styles.dzieDobryJoannaParent}>
        <div className={styles.dzieDobryJoanna}>Dzień dobry, Joanna!</div>
        <img className={styles.bb764a0137abc7a8142b6438e52913Icon} alt="" src="/assets/7bb764a0137abc7a8142b6438e529133@2x.png" />
        <div className={styles.sprawdCoMoesz}>Sprawdź co możesz dzisiaj zrobić!</div>
        <img className={styles.groupChild4} alt="" src="/assets/group-27@2x.png" />
      </div>

      <AddEventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEventAdded={handleEventAdded}
      />
    </div>
  );
};

export default EventsPage; 