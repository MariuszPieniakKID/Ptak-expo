import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { exhibitionsAPI } from '../services/api';
import styles from './DashboardPage.module.css';
import groupLogo from '../assets/group-257@3x.png';

interface Event {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
}

const DashboardPage: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load exhibitor events on component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await exhibitionsAPI.getMyEvents();
        
        if (response.data.success && response.data.data) {
          setEvents(response.data.data);
          console.log('✅ Loaded events:', response.data.data);
        } else {
          setError('Nie udało się pobrać wydarzeń');
        }
      } catch (err) {
        console.error('❌ Error loading events:', err);
        setError('Błąd podczas pobierania wydarzeń');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadEvents();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
  };

  const handleCalendarClick = () => {
    // Placeholder for calendar functionality
    console.log('Calendar clicked');
  };

  const handleEventSelect = (eventId: number) => {
    // Navigate to the event home view for this event
    navigate(`/event/${eventId}/home`);
  };

  // Format date for display
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

  // Get completion percentage (mock for now)
  const getCompletionPercentage = (event: Event) => {
    // Mock completion based on event id for demo
    const completions = [65, 45, 21];
    return completions[event.id % 3] || 50;
  };

  return (
    <div className={styles.dashboard}>
      <img className={styles.image35Icon} alt="" src="/image-35@2x.png" />
      <div className={styles.dashboardChild} />
      <div className={styles.dashboardItem} />
      <img className={styles.dashboardInner} alt="" src={groupLogo} />
      
      {/* Logout button */}
      <button className={styles.logoutButton} onClick={handleLogout}>
        <span>Wyloguj</span>
      </button>
      
      <div className={styles.twojeZaplanowaneWydarzenia}>
        Twoje zaplanowane wydarzenia:
      </div>
      
      <div className={styles.path10Parent} onClick={handleCalendarClick}>
        <img className={styles.path10Icon} alt="" src="/path-10.svg" />
        <div className={styles.zobaczKalendariumPtak}>
          Zobacz kalendarium Ptak Warsaw Expo
        </div>
      </div>
      
      <div className={styles.kontakt}>
        Kontakt • Polityka prywatności • www.warsawexpo.eu
      </div>
      
      {/* Loading state */}
      {loading && (
        <div style={{ 
          position: 'absolute', 
          top: '350px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          fontSize: '18px',
          color: '#666'
        }}>
          Ładowanie wydarzeń...
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div style={{ 
          position: 'absolute', 
          top: '350px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          fontSize: '18px',
          color: '#dc3545'
        }}>
          {error}
        </div>
      )}
      
      {/* Dynamic event boxes */}
      {!loading && !error && events.map((event, index) => {
        const completion = getCompletionPercentage(event);
        
        // Define CSS classes for positioning based on index
        const getEventBoxClass = (index: number) => {
          if (index === 0) return styles.groupParent2;  // Left position
          if (index === 1) return styles.groupDiv;      // Middle position  
          if (index === 2) return styles.groupParent;   // Right position
          // For more than 3 events, we'll need to handle positioning differently
          return styles.groupParent2;
        };
        
        const getInnerContainerClass = (index: number) => {
          if (index === 0) return styles.groupParent3;  // Left inner container
          return styles.groupContainer;                  // Standard inner container
        };
        
        const getProgressBarClass = (index: number, isLow: boolean) => {
          if (index === 0) return styles.frame;         // Left progress bar (red)
          return isLow ? styles.frame : styles.wrapper; // Low completion = red, high = green
        };
        
        const getProgressTextClass = (index: number) => {
          if (index === 0) return styles.gotowo2;       // Left progress text
          return styles.gotowo;                         // Standard progress text
        };

        const getProgressContainerClass = (index: number) => {
          if (index === 0) return styles.groupParent4;  // Left progress container
          return styles.wrapper;                        // Standard progress container
        };

        return (
          <div key={event.id} className={getEventBoxClass(index)}>
            <div className={getInnerContainerClass(index)}>
              <div className={styles.internationalTradeFairForBParent}>
                <div className={styles.internationalTradeFair}>
                  {event.name}
                </div>
                <div className={styles.div}>
                  {formatDateRange(event.startDate, event.endDate)}
                </div>
              </div>
              <div 
                className={styles.wybierz}
                onClick={() => handleEventSelect(event.id)}
              >
                wybierz
              </div>
              <img 
                className={styles.image29Icon} 
                alt="" 
                src={index === 2 ? "/4515f4ed2e86e01309533e2483db0fd4@2x.png" : "/image-29@2x.png"} 
              />
            </div>
            
            {/* Progress bar - only for first 3 events */}
            {index < 3 && (
              <>
                {index === 0 ? (
                  <div className={getProgressContainerClass(index)}>
                    <div className={getProgressBarClass(index, completion < 50)}>
                      <b className={styles.b}>{completion}%</b>
                    </div>
                    <div className={getProgressTextClass(index)}>Gotowość:</div>
                  </div>
                ) : (
                  <>
                    <div className={getProgressBarClass(index, completion < 50)}>
                      <b className={styles.b}>{completion}%</b>
                    </div>
                    <div className={getProgressTextClass(index)}>Gotowość:</div>
                  </>
                )}
              </>
            )}
          </div>
        );
      })}
      
      {/* No events message */}
      {!loading && !error && events.length === 0 && (
        <div style={{ 
          position: 'absolute', 
          top: '350px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          fontSize: '18px',
          color: '#666',
          textAlign: 'center'
        }}>
          Brak przypisanych wydarzeń
        </div>
      )}
      
      {/* User greeting */}
      <div className={styles.dzieDobryUserParent}>
        <div className={styles.dzieDobryUser}>
          Dzień dobry, {user?.firstName || 'Użytkowniku'}
        </div>
        <img
          className={styles.bb764a0137abc7a8142b6438e52913Icon}
          alt=""
          src="/7bb764a0137abc7a8142b6438e529133@2x.png"
        />
        <div className={styles.sprawdCoMoesz}>
          Sprawdź co możesz dzisiaj zrobić!
        </div>
        <img className={styles.groupChild} alt="" src="/group-27@2x.png" />
      </div>
    </div>
  );
};

export default DashboardPage; 