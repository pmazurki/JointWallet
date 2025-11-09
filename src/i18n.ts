import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationPL from './locales/pl/translation.json';
import translationEN from './locales/en/translation.json';

// Konfiguracja zasobów językowych
const resources = {
  pl: {
    translation: translationPL,
  },
  en: {
    translation: translationEN,
  },
};

i18n
  // Wykrywanie języka przeglądarki
  .use(LanguageDetector)
  // Przekazanie instancji i18n do react-i18next
  .use(initReactI18next)
  // Inicjalizacja i18next
  .init({
    resources,
    fallbackLng: 'pl', // Domyślny język, jeśli nie można wykryć
    debug: false,

    interpolation: {
      escapeValue: false, // React już chroni przed XSS
    },

    detection: {
      // Kolejność wykrywania języka
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],

      // Cachowanie wyboru języka
      caches: ['localStorage'],

      // Klucz w localStorage
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
