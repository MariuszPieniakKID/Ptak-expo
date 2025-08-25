import type { Identifier } from './components/identifier-card/IdentifierCard';
import type { SelectOption } from './components/multiselect/MultiSelect';
import type { NewsItem } from './components/news/News';
import type { Event } from './components/planned-event-card/PlannedEventCard';

export const mockEvents: Event[] = [
  {
    id: '1',
    title:
      'International Trade Fair for Building Technologies and Materials. Test of very long message in title it should be overflow',
    dateFrom: '11.03.2026',
    dateTo: '15.03.2026',
    readiness: 65,
    logoUrl: '/images/logo1.png',
    daysLeft: 365,
  },
  {
    id: '2',
    title: 'Green Energy & Sustainable Building Expo',
    dateFrom: '20.05.2026',
    dateTo: '23.05.2026',
    readiness: 28,
    logoUrl: '/images/logo2.png',
    daysLeft: 1,
  },
  {
    id: '3',
    title: 'Smart Cities Conference',
    dateFrom: '02.09.2026',
    dateTo: '05.09.2026',
    readiness: 45,
    logoUrl: '/images/logo3.png',
    daysLeft: 2,
  },
  {
    id: '4',
    title: 'Future of Construction Summit',
    dateFrom: '12.11.2026',
    dateTo: '15.11.2026',
    readiness: 90,
    logoUrl: '/images/logo4.png',
    daysLeft: 5,
  },
];

export const mockIndustryOptions: SelectOption[] = [
  { text: 'IT', value: 'it' },
  { text: 'Marketing', value: 'marketing' },
  { text: 'Finanse', value: 'finance' },
  { text: 'Edukacja', value: 'education' },
  { text: 'Medycyna', value: 'healthcare' },
  { text: 'Budownictwo', value: 'construction' },
  { text: 'Transport', value: 'transport' },
  { text: 'Kultura', value: 'culture' },
  { text: 'Sport', value: 'sport' },
  { text: 'Turystyka', value: 'tourism' },
];

export const mockNews: NewsItem[] = [
  {
    id: 1,
    title: 'Zmiana statusu zaproszenia dla gości',
    description: 'Katarzyna Sułkowska potwierdziła Twoje zaproszenie jako „Gość VIP”',
    category: 'Portal dokumentów',
    date: new Date(),
  },
  {
    id: 2,
    title: 'Portal dokumentów',
    description: 'Pojawiły się nowe dokumenty do akceptacji.',
    category: 'Dokumenty',
    date: new Date(),
  },
  {
    id: 3,
    title: 'Zmiany organizacyjne',
    description: 'Uwaga zmiana godzin funkcjonowania biura targowego',
    category: 'Organizacja',
    date: new Date(),
  },
  {
    id: 4,
    title: 'Aktualności',
    description: 'Nowe wydarzenie dodane w agendzie targów',
    category: 'Agenda',
    date: new Date('2025-08-20'),
  },
  {
    id: 5,
    title: 'Materiały marketingowe',
    description: 'Dodano nowe materiały marketingowe',
    category: 'Marketing',
    date: new Date('2025-08-19'),
  },
];

export const mockIdentifiers: Identifier[] = [
  {
    id: '1',
    eventName: 'Warsaw Industry Week',
    dateFrom: '11.03.2026',
    dateTo: '15.03.2026',
    time: '6:00–23:00',
    type: 'Wystawca',
    location: 'Hala A, B, C, G, Sala VIP, Konferencje',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=54637-22-22',
    headerImageUrl: '/images/event-header.png',
    logoUrl: '/images/event-logo.png',
  },
  {
    id: '2',
    eventName: 'Tech Expo 2026',
    dateFrom: '20.04.2026',
    dateTo: '22.04.2026',
    time: '9:00–18:00',
    type: 'Gość VIP',
    location: 'Hala E, F, Main Stage',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=78421-11-33',
    headerImageUrl: '/images/event-header.svg',
    logoUrl: '/images/event-logo.png',
  },
  {
    id: '3',
    eventName: 'IT Future Summit',
    dateFrom: '01.06.2026',
    dateTo: '03.06.2026',
    time: '10:00–19:00',
    type: 'Prelegent',
    location: 'Centrum Konferencyjne, Sala A',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=22999-55-10',
    headerImageUrl: '/images/event-header.svg',
    logoUrl: '/images/event-logo.png',
  },
  {
    id: '4',
    eventName: 'Startup Days',
    dateFrom: '15.09.2026',
    dateTo: '17.09.2026',
    time: '8:00–20:00',
    type: 'Inwestor',
    location: 'Expo Center, Hall 1',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=66222-88-77',
    headerImageUrl: '/images/event-header.png',
    logoUrl: '/images/event-logo.png',
  },
];
