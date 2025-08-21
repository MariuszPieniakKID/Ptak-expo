import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import loginEN from './locales/en/login.json';
import loginPL from './locales/pl/login.json';
import homeEN from './locales/en/home.json';
import homePL from './locales/pl/home.json';
import calendarEN from './locales/en/calendar.json';
import calendarPL from './locales/pl/calendar.json';
import commonEN from './locales/en/common.json';
import commonPL from './locales/pl/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        login: loginEN,
        home: homeEN,
        calendar: calendarEN,
        common: commonEN,
      },
      pl: {
        login: loginPL,
        home: homePL,
        calendar: calendarPL,
        common: commonPL,
      },
    },
    fallbackLng: 'pl',
    interpolation: { escapeValue: false },
  });

export default i18n;
