import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import '@src/i18n\languageDetector';

// Initialize i18next
i18n
  // Load translations using http (default public/locales/{lng}/translation.json)
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Detect language
    lng: detectUserLanguage(),
    // Fallback language
    fallbackLng: 'en',
    // Debug mode (disable in production)
    debug: process.env.NODE_ENV === 'development',
    // Namespace
    defaultNS: 'translation',
    ns: ['translation'],
    // Cache
    cache: {
      enabled: true,
      expirationTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    // Interpolation
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Backend options
    backend: {
      // Path to load translations from
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      // Allow cross-domain requests
      crossDomain: true,
    },
    // React options
    react: {
      useSuspense: true,
      // Wait for translations to be loaded
      wait: true,
    },
    // Detection options
    detection: {
      // Order of detection
      order: ['querystring', 'localStorage', 'cookie', 'navigator'],
      // Query parameter to look for
      lookupQuerystring: 'lng',
      // Cookie name to look for
      lookupCookie: 'i18next',
      // Cache user language
      caches: ['localStorage', 'cookie'],
      // Cookie expiration
      cookieExpirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      // Cookie domain
      cookieDomain: window.location.hostname,
    },
  });

// Listen for language changes
i18n.on('languageChanged', (lng) => {
  // Set language preference
  setLanguagePreference(lng);
  
  // Set HTML lang attribute
  document.documentElement.setAttribute('lang', lng);
  
  // Set text direction (for RTL languages)
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(lng);
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  
  // Add RTL class to body if needed
  if (isRTL) {
    document.body.classList.add('rtl');
  } else {
    document.body.classList.remove('rtl');
  }
});

export default i18n;
