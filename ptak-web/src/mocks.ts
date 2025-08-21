import type { SelectOption } from './components/multiselect/MultiSelect';
import type { Event } from './components/planned-event-card/PlannedEventCard';

export const mockEvents: Event[] = [
  {
    id: '1',
    title:
      'International Trade Fair for Building Technologies and Materials. Test of very long message in title it should be overflow',
    dateFrom: '11.03.2026',
    dateTo: '15.03.2026',
    readiness: 65,
    logoUrl: 'src/assets/images/logo1.png',
  },
  {
    id: '2',
    title: 'Green Energy & Sustainable Building Expo',
    dateFrom: '20.05.2026',
    dateTo: '23.05.2026',
    readiness: 28,
    logoUrl: 'src/assets/images/logo2.png',
  },
  {
    id: '3',
    title: 'Smart Cities Conference',
    dateFrom: '02.09.2026',
    dateTo: '05.09.2026',
    readiness: 45,
    logoUrl: 'src/assets/images/logo3.png',
  },
  {
    id: '4',
    title: 'Future of Construction Summit',
    dateFrom: '12.11.2026',
    dateTo: '15.11.2026',
    readiness: 90,
    logoUrl: 'src/assets/images/logo4.png',
  },
  {
    id: '5',
    title: 'International Fair for Interior Design',
    dateFrom: '18.01.2027',
    dateTo: '21.01.2027',
    readiness: 12,
    logoUrl: 'src/assets/images/logo5.png',
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
