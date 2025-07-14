import React, { useState } from 'react';
import styles from './AddUserModal.module.css';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
  token: string;
}

interface AddUserFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'exhibitor' | 'guest';
  isAdmin: boolean;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded, token }) => {
  const [formData, setFormData] = useState<AddUserFormData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'exhibitor',
    isAdmin: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        role: checked ? 'admin' : 'exhibitor'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Walidacja podstawowa
      if (!formData.fullName || !formData.email || !formData.password) {
        throw new Error('Imię i nazwisko, email oraz hasło są wymagane');
      }

      // Rozdzielenie imienia i nazwiska
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      if (!firstName || !lastName) {
        throw new Error('Podaj imię i nazwisko');
      }

      // Walidacja email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Nieprawidłowy format adresu email');
      }

      // Walidacja hasła
      if (formData.password.length < 6) {
        throw new Error('Hasło musi mieć co najmniej 6 znaków');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: formData.email,
          phone: formData.phone || null,
          password: formData.password,
          role: formData.role
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Błąd podczas dodawania użytkownika');
      }

      // Sukces - resetuj formularz i zamknij modal
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'exhibitor',
        isAdmin: false
      });
      onUserAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    // Symuluj submit formularza
    const form = document.querySelector('form');
    if (form) {
      form.requestSubmit();
    }
  };

  const handleClose = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      role: 'exhibitor',
      isAdmin: false
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Przycisk zamknięcia w prawym górnym rogu */}
        <button type="button" className={styles.closeButton} onClick={handleClose}>
          ×
        </button>
        
        {/* AddUserOK - tło/kontener */}
        <div className={styles.addUserOKContainer} />
        
        {/* AddUser - formularz - z poprawkami */}
        <form onSubmit={handleSubmit} className={styles.groupParent}>
          <div className={styles.uytkownicyParent}>
            <div className={styles.uytkownicy}>Użytkownicy</div>
            <div className={styles.dodajUytkownika}>Dodaj użytkownika</div>
            <img className={styles.maskGroup31} alt="" src="/assets/mask-group-5@2x.png" />
          </div>
          
          <img className={styles.groupChild} alt="" src="/assets/group-470.svg" />
          
          {/* Przycisk dodaj */}
          <div 
            className={`${styles.dodaj} ${loading ? styles.disabled : ''}`} 
            onClick={loading ? undefined : handleAddClick}
          >
            {loading ? 'Dodawanie...' : 'dodaj'}
          </div>
          <img className={styles.groupItem} alt="" src="/assets/group-1047.svg" />
          
          <div className={styles.naPodanyEMail}>
            *Użytkownik otrzyma wygenerowane hasło na podany e-mail wraz z danymi dostępowymi.
          </div>
          <img className={styles.groupInner} alt="" src="/assets/group-30324.svg" />
          
          <div className={styles.lineDiv} />
          
          {/* Pole Imię i Nazwisko - poprawione */}
          <div className={styles.rectangleDiv} />
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            className={styles.janiInput}
            placeholder="Imię i nazwisko"
            required
            disabled={loading}
          />
          <div className={styles.imiINazwisko}>Imię i Nazwisko</div>
          
          {/* Pole Email - z dodanym odstępem */}
          <div className={styles.adresEMail}>Adres E-mail*</div>
          <div className={styles.groupChild1} />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={styles.emailInput}
            placeholder="email@example.com"
            required
            disabled={loading}
          />
          
          {/* Pole Telefon - teraz po lewej */}
          <div className={styles.telefon}>Telefon</div>
          <div className={styles.groupChild2} />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className={styles.phoneInput}
            placeholder="+48 123 456 789"
            disabled={loading}
          />
          
          {/* Nowe pole Hasło - po prawej obok telefonu */}
          <div className={styles.haslo}>Hasło*</div>
          <div className={styles.groupChild3} />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={styles.passwordInput}
            placeholder="Min. 6 znaków"
            required
            disabled={loading}
          />
          
          {/* Checkbox uprawnień administratora */}
          <div className={styles.adminCheckboxContainer}>
            <input
              type="checkbox"
              id="isAdmin"
              name="isAdmin"
              checked={formData.isAdmin}
              onChange={handleInputChange}
              className={styles.adminCheckbox}
              disabled={loading}
            />
            <label htmlFor="isAdmin" className={styles.adminLabel}>
              Nadaj uprawnienia administratora
            </label>
          </div>
          
          {/* Komunikat błędu */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddUserModal; 