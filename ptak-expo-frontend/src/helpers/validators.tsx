
export const validateNip = (nip: string): string => {
  const trimmed = nip.trim().replace(/^PL/i, '').replace(/[\s-]/g, '');
  if (!trimmed) return 'NIP jest wymagany';
  if (!/^\d{10}$/.test(trimmed)) return 'NIP musi zawierać dokładnie 10 cyfr.';
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(trimmed[i]) * weights[i];
  const control = sum % 11;
  if (control === 10 || control !== parseInt(trimmed[9]))
    return 'NIP jest nieprawidłowy.';
  return '';
};

export const validateCompanyName = (companyName: string): string => {
  const trimmed = companyName.trim();
  if (!trimmed) return 'Nazwa firmy jest wymagana';
  if (trimmed.length < 2) return 'Nazwa firmy musi zawierać co najmniej 2 znaki.';
  const re = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9 .,'"-/&+]+$/;
  if (!re.test(trimmed))
    return 'Nazwa firmy może zawierać tylko litery, cyfry, spacje oraz . , - / & + \' "';
  return '';
};

export const validateAddress = (address: string): string => {
  const trimmed = address.trim();
  if (!trimmed) return 'Adres jest wymagany';
  if (trimmed.length < 5) return 'Adres musi zawierać co najmniej 5 znaków.';
  const re = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9\s,.-/\\#]+$/;
  if (!re.test(trimmed))
    return 'Adres zawiera niedozwolone znaki. Dozwolone są litery, cyfry, spacje oraz , . - / \\ #';
  return '';
};

export const validatePostalCode = (postalCode: string): string => {
  const trimmed = postalCode.trim();
  if (!trimmed) return 'Kod pocztowy jest wymagany';
  const re = /^\d{2}-\d{3}$/;
  if (!re.test(trimmed))
    return 'Kod pocztowy powinien mieć format XX-XXX, gdzie X to cyfra';
  return '';
};

export const validateCity = (city: string): string => {
  const trimmed = city.trim();
  if (!trimmed) return 'Nazwa miejscowości jest wymagana';
  if (trimmed.length < 2) return 'Nazwa miejscowości musi zawierać co najmniej 2 znaki.';
  const re = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż\s\-']+$/;
  if (!re.test(trimmed))
    return 'Nazwa miejscowości może zawierać tylko litery, spacje, myślniki i apostrofy.';
  return '';
};

export const validateContactPerson = (contactPerson: string): string => {
  const trimmed = contactPerson.trim();
  if (!trimmed) return 'Imię i nazwisko osoby kontaktowej jest wymagane';
  const words = trimmed.split(/\s+/);
  if (words.length < 2) return 'Podaj imię i nazwisko (min. dwa wyrazy)';
  const wordRe = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż'-]+$/;
  for (const word of words) {
    if (!wordRe.test(word))
      return 'Imię i nazwisko może zawierać tylko litery, apostrofy i myślniki.';
  }
  return '';
};

export const validateContactRole = (role: string): string => {
  const trimmed = role.trim();
  if (!trimmed) return 'Rola w organizacji jest wymagana';
  if (trimmed.length < 2) return 'Rola musi mieć co najmniej 2 znaki';
  const re = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9\s-/&.]+$/;
  if (!re.test(trimmed))
    return 'Rola może zawierać tylko litery, cyfry, spacje oraz znaki: - / & .';
  return '';
};

export const validatePhone = (phone: string): string => {
  if (!phone.trim()) return 'Telefon jest wymagany';
  const re = /^\+?\d{9,12}$/;
  if (!re.test(phone))
    return 'Podaj poprawny numer telefonu (9-12 cyfr, opcjonalnie + na początku)';
  return '';
};

export const validateEmail = (email: string): string => {
  if (!email.trim()) return '';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Podaj poprawny adres e-mail, np.: email@mail.com';
  return '';
};
export  const validateStandNumber = (standNumber: string): string => {
  if (!standNumber.trim()) return 'Numer stoiska jest wymagany';
  const re = /^[A-Za-z0-9-]{1,8}$/;
  if (!re.test(standNumber))
    return 'Numer stoiska może zawierać tylko litery, cyfry i myślniki (max. 8 znaków)';
  return '';
};

export  const validateHallName = (hallName: string): string => {
  const trimmed = hallName.trim();
  if (!trimmed) return 'Nazwa hali jest wymagana';
  if (trimmed.length < 2) return 'Nazwa hali musi zawierać co najmniej 2 znaki';
  if (trimmed.length > 50) return 'Nazwa hali może zawierać maksymalnie 50 znaków';
  const re = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9\s.-/]+$/;
  if (!re.test(trimmed))
    return 'Nazwa hali może zawierać tylko litery, cyfry, spacje oraz znaki: . - /';
  return '';
};
export const validateEventName = (eventName: string): string => {
  const trimmed = eventName.trim();

  if (!trimmed) return 'Nazwa wydarzenia jest wymagana';
  if (trimmed.length < 3) return 'Nazwa wydarzenia musi zawierać co najmniej 3 znaki';
  if (trimmed.length > 100) return 'Nazwa wydarzenia może zawierać maksymalnie 100 znaków';

  // Dozwolone: litery PL/ENG, cyfry, spacje oraz . , - / & ( )
  const re = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9\s.,\-\/&()]+$/;

  if (!re.test(trimmed))
    return 'Nazwa wydarzenia może zawierać tylko litery, cyfry, spacje oraz znaki: . , - / & ( )';

  return '';
};