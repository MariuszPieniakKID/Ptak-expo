import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Menu from '../components/Menu';
import AddUserModal from '../components/AddUserModal';
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
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [avatarErrors, setAvatarErrors] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const { token, logout, user } = useAuth();

  const USERS_PER_PAGE = 5;

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
      
      // Sort users alphabetically by full name and show all users
      const sortedUsers = data.data.sort((a: User, b: User) => 
        a.fullName.localeCompare(b.fullName)
      );
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

  const getAvatarSrc = (index: number) => {
    // Use different avatar images, cycling through available ones
    const avatarIndex = (index % 4) + 1;
    return `/assets/7bb764a0137abc7a8142b6438e52913${avatarIndex === 1 ? '' : avatarIndex}@2x.png`;
  };

  const getUserInitials = (fullName: string) => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return fullName.charAt(0).toUpperCase();
  };

  // Oblicz dane dla stronicowania
  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const currentUsers = users.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setAvatarErrors(new Set()); // Clear avatar errors when changing page
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setAvatarErrors(new Set()); // Clear avatar errors when changing page
    }
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

  const handleAddUserClick = () => {
    setIsAddUserModalOpen(true);
  };

  const handleCloseAddUserModal = () => {
    setIsAddUserModalOpen(false);
  };

  const handleUserAdded = () => {
    // Refresh the users list after adding a new user
    fetchUsers();
    // Reset to first page to show newly added user
    setCurrentPage(1);
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
        <div className={styles.dodajUytkownikaParent} onClick={handleAddUserClick}>
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

        {/* Phone column header */}
        <div className={styles.phoneHeader}>Telefon</div>
        
        {/* Line separator for first user */}
        <div className={styles.lineDiv} />
        
        {/* Users with original positioning */}
        {currentUsers.map((user, index) => {
          const isOriginalUser = index < 4; // Pierwsze 4 użytkowników mają oryginalne pozycje
          const userClass = isOriginalUser ? `user${index}` : 'userDynamic';
          const separatorClass = isOriginalUser && index < 3 ? `sep${index}` : 'sepDynamic';
          const dynamicOffset = !isOriginalUser ? `${(index - 4) * 40}px` : '0px';
          
          return (
            <React.Fragment key={user.id}>
              {/* User Avatar */}
              {avatarErrors.has(index) ? (
                <div
                  className={`${styles.userAvatarDefault} ${styles[userClass]}`}
                  style={!isOriginalUser ? { '--user-offset': dynamicOffset } as React.CSSProperties : undefined}
                >
                  {getUserInitials(user.fullName)}
                </div>
              ) : (
                <img
                  className={`${styles.userAvatar} ${styles[userClass]}`}
                  alt=""
                  src={getAvatarSrc(index)}
                  style={!isOriginalUser ? { '--user-offset': dynamicOffset } as React.CSSProperties : undefined}
                  onError={() => {
                    setAvatarErrors(prev => new Set(prev).add(index));
                  }}
                />
              )}
              
              {/* User Name */}
              <div 
                className={`${styles.userName} ${styles[userClass]}`}
                style={!isOriginalUser ? { '--user-offset': dynamicOffset } as React.CSSProperties : undefined}
              >
                {user.fullName}
              </div>
              
              {/* User Email */}
              <div 
                className={`${styles.userEmail} ${styles[userClass]}`}
                style={!isOriginalUser ? { '--user-offset': dynamicOffset } as React.CSSProperties : undefined}
              >
                {user.email}
              </div>
              
              {/* User Phone */}
              <div 
                className={`${styles.userPhone} ${styles[userClass]}`}
                style={!isOriginalUser ? { '--user-offset': dynamicOffset } as React.CSSProperties : undefined}
              >
                {user.phone || 'Brak numeru'}
              </div>
              
              {/* Reset Password Button */}
              <div 
                className={`${styles.userButton} ${styles[userClass]}`}
                onClick={() => resetPassword(user.id)}
                style={!isOriginalUser ? { '--user-offset': dynamicOffset } as React.CSSProperties : undefined}
              >
                <div className={styles.userButtonText}>Wyślij nowe hasło</div>
                <img className={styles.userButtonIcon} alt="" src="/assets/path-11981.svg" />
              </div>
              
              {/* Row separator - nie dla ostatniego użytkownika */}
              {index < currentUsers.length - 1 && (
                <div 
                  className={`${styles.userSeparator} ${styles[separatorClass]}`}
                  style={!isOriginalUser ? { '--user-offset': dynamicOffset } as React.CSSProperties : undefined}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Pagination Controls */}
        {users.length > USERS_PER_PAGE && (
          <div className={styles.paginationControls}>
            <button 
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={styles.paginationButton}
            >
              ← Poprzednia
            </button>
            
            <div className={styles.paginationInfo}>
              Strona {currentPage} z {totalPages} ({users.length} użytkowników)
            </div>
            
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={styles.paginationButton}
            >
              Następna →
            </button>
          </div>
        )}
        </div>

        {/* Add User Modal */}
        <AddUserModal
          isOpen={isAddUserModalOpen}
          onClose={handleCloseAddUserModal}
          onUserAdded={handleUserAdded}
          token={token || ''}
        />
    </div>
  );
};

export default UsersPage; 