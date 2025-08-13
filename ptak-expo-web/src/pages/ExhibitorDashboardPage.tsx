import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { exhibitionsAPI } from '../services/api';
import Menu from '../components/Menu';
import styles from './ExhibitorDashboardPage.module.css';

interface Event {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
}

// TradeInfoData type no longer used here (loaded on dedicated route)

const ExhibitorDashboardPage: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [tradeInfo, setTradeInfo] = useState<TradeInfoData | null>(null);

  // Load event data from API
  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await exhibitionsAPI.getMyEvents();
        
        if (response.data.success && response.data.data) {
          // Find the event that matches our eventId
          const events: Event[] = response.data.data;
          const currentEvent = events.find(event => event.id === parseInt(eventId || '0'));
          
          if (currentEvent) {
            setSelectedEvent(currentEvent);
            console.log('✅ Loaded event:', currentEvent);
            // Trade info is now loaded on a dedicated route
          } else {
            setError('Nie znaleziono wydarzenia o podanym ID');
          }
        } else {
          setError('Nie udało się pobrać danych wydarzenia');
        }
      } catch (err) {
        console.error('❌ Error loading event:', err);
        setError('Błąd podczas pobierania danych wydarzenia');
      } finally {
        setLoading(false);
      }
    };

    if (user && eventId) {
      loadEventData();
    }
  }, [eventId, user]);

  const handleLogout = () => {
    logout();
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleMenuClick = (page: string) => {
    if (page === 'info' && selectedEvent) {
      navigate(`/event/${selectedEvent.id}/trade-info`);
      return;
    }
    if (page === 'checklist' && selectedEvent) {
      navigate(`/event/${selectedEvent.id}/checklist`);
      return;
    }
    if (page === 'documents' && selectedEvent) {
      navigate(`/event/${selectedEvent.id}/documents`);
      return;
    }
    if (page === 'materials' && selectedEvent) {
      // TODO: implement materials route
      return;
    }
    if (page === 'invitations' && selectedEvent) {
      // TODO: implement invitations route
      return;
    }
  };

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
    
    return `${formatDate(start)}-${formatDate(end)}`;
  };

  // Oblicz dni do wydarzenia
  const getDaysUntilEvent = (startDate: string) => {
    const today = new Date();
    const eventDate = new Date(startDate);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Ładowanie danych wydarzenia...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        gap: '20px'
      }}>
        <div style={{ color: '#dc3545' }}>{error}</div>
        <button 
          onClick={handleBackToDashboard}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6f87f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Powrót do listy wydarzeń
        </button>
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        gap: '20px'
      }}>
        <div>Nie znaleziono wydarzenia</div>
        <button 
          onClick={handleBackToDashboard}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6f87f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Powrót do listy wydarzeń
        </button>
      </div>
    );
  }

  const daysUntilEvent = getDaysUntilEvent(selectedEvent.startDate);

  return (
    <div className={styles.webChecklista4}>
      {/* Top Menu */}
      <Menu onMenuClick={handleMenuClick} onLogout={handleLogout} />
      

      

      
      {/* Main content */}
      <section className={styles.frameSection}>
        <div className={styles.frameChild10}></div>
        
        {/* User greeting */}
        <div className={styles.dashboardInner}>
          <div className={styles.dashboardContent}>
            <div className={styles.bb764a0137abc7a8142b6438e52913Wrapper}>
              <img
                className={styles.bb764a0137abc7a8142b6438e52913Icon}
                alt=""
                src="/7bb764a0137abc7a8142b6438e529133@2x.png"
              />
            </div>
            <div className={styles.dzieDobryMtbModulesParent}>
              <div className={styles.dzieDobryMtb}>
                Dzień dobry, {user?.firstName || 'MTB Modules'}
              </div>
              <div className={styles.sprawdCoMoesz}>
                Sprawdź co możesz dzisiaj zrobić!
              </div>
            </div>
            <div className={styles.dashboardContentInner}>
              <img className={styles.frameChild11} alt="" src="/group-27@2x.png" />
            </div>
          </div>
        </div>
        
        {/* Event and countdown section */}
        <div className={styles.eventInnerParent}>
          {/* Event info */}
          <div className={styles.eventInner}>
            <div className={styles.eventInnerChild}></div>
            <div className={styles.eventContent}>
              <img
                className={styles.f4ed2e86e01309533e2483db0fd4Icon}
                alt=""
                src="/4515f4ed2e86e01309533e2483db0fd4@2x.png"
              />
            </div>
            <div className={styles.yourEventParent}>
              <div className={styles.yourEvent}>
                <div className={styles.twojeWydarzenie}>Twoje wydarzenie:</div>
              </div>
              <div className={styles.changeActionWrapper}>
                <div className={styles.changeAction}>
                  {formatDateRange(selectedEvent.startDate, selectedEvent.endDate)}
                </div>
              </div>
              <div className={styles.eventDetails}>
                <div className={styles.warsawIndustryWeej}>
                  {selectedEvent.name}
                </div>
              </div>
              <div className={styles.zmieWrapper}>
                <div className={styles.zmie} onClick={handleBackToDashboard}>zmień</div>
              </div>
            </div>
          </div>
          
          {/* Countdown and progress */}
          <div className={styles.rectangleParent1}>
            <div className={styles.frameChild12}></div>
            <div className={styles.countdownInner}>
              <div className={styles.countdownContent}>
                <div className={styles.countdownContentChild}></div>
                <div className={styles.doWydarzeniaZostaloContainer}>
                  <span>Do wydarzenia zostało</span>
                  <span className={styles.dni}> {daysUntilEvent} dni</span>
                </div>
              </div>
              
              <div className={styles.gratulacjeMamyWszystkoParent}>
                <div className={styles.gratulacjeMamyWszystkoContainer}>
                  <p className={styles.gratulacjeMamyWszystko}>
                    Gratulacje, mamy wszystko!
                  </p>
                  <p className={styles.informacje}>Wasza gotowość do targów:</p>
                </div>
                <div className={styles.frameWrapper10}>
                  <img className={styles.frameChild13} alt="" src="/group-724@2x.png" />
                </div>
                <div className={styles.frameWrapper11}>
                  <div className={styles.rectangleParent2}>
                    <div className={styles.frameChild14}></div>
                    <div className={styles.progressIndicator}>100%</div>
                  </div>
                </div>
              </div>
              
              <div className={styles.uzupenijWszystkieKroki}>
                Uzupełnij wszystkie kroki z checklisty by być jak najlepiej
                przygotowanym na to wydarzenie.
              </div>
              
              <div className={styles.countdownInnerInner}>
                <img className={styles.frameChild15} alt="" src="/group-1.svg" />
              </div>
            </div>
            
            {/* Go to checklist button */}
            <div className={styles.checklistLink}>
              <div className={styles.doWydarzeniaZostaloContainer2}>
                Idź do checklisty
              </div>
              <div className={styles.path10Parent}>
                <img className={styles.path10Icon} alt="" src="/path-10.svg" />
                <img className={styles.frameChild16} alt="" src="/group-549.svg" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className={styles.privacyBottom}>
          <div className={styles.kontakt1}>
            Kontakt • Polityka prywatności • www.warsawexpo.eu
          </div>
        </div>
      </section>
      
      {/* Top section for action cards */}
      <div className={styles.wanesprawyDotyczce}>Ważne sprawy dotyczące wydarzenia:</div>
      
      {/* Action cards */}
      <div className={styles.rectangleParent} onClick={() => handleMenuClick('info')}>
        <div className={styles.frameInner}></div>
        <div className={styles.informacjeTargowe}>
          <p className={styles.informacje}>Informacje</p>
          <p className={styles.informacje}>targowe</p>
        </div>
        <img className={styles.maskGroup6} alt="" src="/mask-group-6@2x.png" />
      </div>
      
      <div className={styles.rectangleGroup} onClick={() => handleMenuClick('documents')}>
        <div className={styles.rectangleDiv}></div>
        <div className={styles.maskGroup5Wrapper}>
          <img className={styles.maskGroup5} alt="" src="/mask-group-5@2x.png" />
        </div>
        <div className={styles.portalDokumentw}>
          <p className={styles.informacje}>Portal</p>
          <p className={styles.informacje}>dokumentów</p>
        </div>
      </div>
      
      <div className={styles.rectangleContainer} onClick={() => handleMenuClick('materials')}>
        <div className={styles.rectangleDiv}></div>
        <div className={styles.maskGroup9Wrapper}>
          <img className={styles.maskGroup5} alt="" src="/mask-group-9@2x.png" />
        </div>
        <div className={styles.portalDokumentw}>
          <p className={styles.informacje}>Materiały</p>
          <p className={styles.informacje}>Marketingowe</p>
        </div>
      </div>
      
      <div className={styles.frameDiv} onClick={() => handleMenuClick('invitations')}>
        <div className={styles.rectangleDiv}></div>
        <div className={styles.maskGroup10Wrapper}>
          <img className={styles.maskGroup5} alt="" src="/mask-group-10@2x.png" />
        </div>
        <div className={styles.portalDokumentw}>
          <p className={styles.informacje}>Generator</p>
          <p className={styles.informacje}>Zaproszeń</p>
        </div>
      </div>
      
      <div className={styles.kontakt}>
        Kontakt • Polityka prywatności • www.warsawexpo.eu
      </div>

      {/* Link to Trade Info page */}
    </div>
  );
};

export default ExhibitorDashboardPage;