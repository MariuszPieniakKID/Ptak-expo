import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Menu from '../components/Menu';
import styles from './UsersPage.module.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token, logout, user } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!token) {
        throw new Error('Brak tokena autoryzacji');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        // Token expired or invalid
        logout();
        navigate('/login');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Błąd podczas pobierania użytkowników');
      }
      
      const data = await response.json();
      
      // Sort users to original order and limit to 4
      const sortedUsers = sortUsersToOriginalOrder(data.data).slice(0, 4);
      setUsers(sortedUsers);
    } catch (err) {
      setError('Nie udało się pobrać użytkowników');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const sortUsersToOriginalOrder = (userArray: User[]) => {
    const orderMap = {
      'Magda Masny': 1,
      'Quang Thuy': 2,
      'Anna Dereszowska': 3,
      'Marian Pienkowski': 4
    };

    const sorted = userArray.sort((a, b) => {
      const aOrder = orderMap[a.fullName as keyof typeof orderMap] || 999;
      const bOrder = orderMap[b.fullName as keyof typeof orderMap] || 999;
      return aOrder - bOrder;
    });

    return sorted;
  };

  const resetPassword = async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/reset-password`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('Hasło zostało zresetowane');
      } else {
        alert('Błąd podczas resetowania hasła');
      }
    } catch (err) {
      alert('Błąd podczas resetowania hasła');
      console.error('Error resetting password:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const getUserCSSClass = (index: number, field: string) => {
    const classMap = {
      name: ['magdaMasny', 'quangThuy', 'annaDereszowska', 'marianPienkowski'],
      avatar: ['bb764a0137abc7a8142b6438e52913Icon1', 'bb764a0137abc7a8142b6438e52913Icon2', 'bb764a0137abc7a8142b6438e52913Icon3', 'bb764a0137abc7a8142b6438e52913Icon4'],
      email: ['mmasnywarsawexpoeu', 'mmasnywarsawexpoeu1', 'mmasnywarsawexpoeu2', 'mmasnywarsawexpoeu3'],
      button: ['component511', 'component512', 'component513', 'component514'],
      phone: ['div', 'div1', 'div2', 'div3'],
      separator: ['component203Child1', 'component203Child2', 'component203Child3']
    };
    
    const className = classMap[field as keyof typeof classMap]?.[index] || '';
    
    // Debug log for CSS mapping
    if (!className && field !== 'separator') {
      console.warn(`Missing CSS class for field: ${field}, index: ${index}`);
    }
    
    return className;
  };

  if (loading) {
    return (
      <div className={styles.web136640}>
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          fontSize: '18px'
        }}>
          Ładowanie użytkowników...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.web136640}>
      <img className={styles.maskGroup28} alt="" src="/assets/mask-group-28@2x.png" />
              <div className={styles.web136640Child} />
        <div className={styles.web136640Item} />
      
      <div className={styles.kontakt}>
        Kontakt • Polityka prywatności • www.warsawexpo.eu
      </div>
      
      <div className={styles.groupParent} onClick={handleLogout}>
        <img className={styles.groupChild} alt="" src="/assets/group-872.svg" />
        <div className={styles.wyloguj}>Wyloguj</div>
      </div>
      
      {/* Menu component */}
      <Menu />
      
      <div className={styles.dzieDobryJoannaParent}>
        <div className={styles.dzieDobryJoanna}>
          Dzień dobry, {user?.firstName || 'Użytkowniku'}
        </div>
        <img
          className={styles.bb764a0137abc7a8142b6438e52913Icon}
          alt=""
          src="/assets/7bb764a0137abc7a8142b6438e529133@2x.png"
        />
        <div className={styles.sprawdCoMoesz}>
          Sprawdź co możesz dzisiaj zrobić!
        </div>
        <img className={styles.groupItem} alt="" src="/assets/group-27@2x.png" />
      </div>
      
      <div className={styles.component224} onClick={goToDashboard}>
        <img
          className={styles.component224Child}
          alt=""
          src="/assets/group-1041.svg"
        />
        <div className={styles.wstecz}>wstecz</div>
      </div>
      
      <div className={styles.component203}>
        <div className={styles.component203Child} />
        <div className={styles.component203Item} />
        <div className={styles.imiINazwisko}>Imię i Nazwisko A-Z</div>
        <div className={styles.akcja}>Akcja:</div>
        <img
          className={styles.component203Inner}
          alt=""
          src="/assets/group-1012.svg"
        />
        <div className={styles.eMail}>E-mail</div>
        <div className={styles.dodajUytkownikaParent}>
          <div className={styles.dodajUytkownika}>+ dodaj użytkownika</div>
          <img className={styles.groupInner} alt="" src="/assets/group-505.svg" />
        </div>
        <div className={styles.homeUytkownicy}>Home / Użytkownicy</div>
        <div className={styles.uytkownicyParent}>
          <div className={styles.uytkownicy}>Użytkownicy</div>
          <img
            className={styles.maskGroup5}
            alt=""
            src="/assets/mask-group-5@2x.png"
          />
        </div>

        {error && (
          <div style={{ 
            position: 'absolute', 
            top: '200px', 
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#c7353c', 
            fontSize: '16px' 
          }}>
            {error}
          </div>
        )}

        {users.map((user, index) => (
          <React.Fragment key={user.id}>
            {/* User Name */}
            <div className={styles[getUserCSSClass(index, 'name')]}>
              {user.fullName}
            </div>
            
            {/* Line separator (only for first user) */}
            {index === 0 && <div className={styles.lineDiv} />}
            
            {/* Reset Password Button */}
            <div 
              className={styles[getUserCSSClass(index, 'button')]}
              onClick={() => resetPassword(user.id)}
            >
              <div className={styles.wylijNoweHaso}>Wyślij nowe hasło</div>
              <img className={styles.path11981Icon} alt="" src="/assets/path-11981.svg" />
            </div>
            
            {/* User Avatar */}
            <img
              className={styles[getUserCSSClass(index, 'avatar')]}
              alt=""
              src={`/assets/7bb764a0137abc7a8142b6438e52913${index === 0 ? '' : index + 1}@2x.png`}
            />
            
            {/* User Email */}
            <div className={styles[getUserCSSClass(index, 'email')]}>
              {user.email}
            </div>
            
            {/* Row separator for subsequent users */}
            {index > 0 && (
              <div className={styles[getUserCSSClass(index - 1, 'separator')]} />
            )}
          </React.Fragment>
                  ))}
          
          {/* Phone numbers container */}
          <div className={styles.telefonParent}>
            <div className={styles.telefon}>Telefon</div>
            {users.map((user, index) => (
              user.phone && (
                <div key={`phone-${user.id}`} className={styles[getUserCSSClass(index, 'phone')]}>
                  {user.phone}
                </div>
              )
            ))}
          </div>
        </div>
    </div>
  );
};

export default UsersPage; 