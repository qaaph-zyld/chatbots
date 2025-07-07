/**
 * Internationalization (i18n) Configuration
 * 
 * This file configures the internationalization framework for the application.
 * It uses i18next for translation management and language detection.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Default language resources (English)
// These are fallback translations in case the backend fails to load
const resources = {
  en: {
    translation: {
      // Common
      'app.name': 'Chatbot Platform',
      'app.tagline': 'Build intelligent conversational experiences',
      
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.chatbots': 'Chatbots',
      'nav.workflows': 'Workflows',
      'nav.analytics': 'Analytics',
      'nav.settings': 'Settings',
      'nav.components': 'Components',
      'nav.marketplace': 'Marketplace',
      
      // Actions
      'action.create': 'Create',
      'action.edit': 'Edit',
      'action.delete': 'Delete',
      'action.save': 'Save',
      'action.cancel': 'Cancel',
      'action.confirm': 'Confirm',
      'action.back': 'Back',
      'action.next': 'Next',
      'action.submit': 'Submit',
      
      // Messages
      'message.loading': 'Loading...',
      'message.error': 'An error occurred',
      'message.success': 'Operation successful',
      'message.confirmDelete': 'Are you sure you want to delete this?',
      'message.noResults': 'No results found',
      
      // Auth
      'auth.login': 'Login',
      'auth.logout': 'Logout',
      'auth.register': 'Register',
      'auth.forgotPassword': 'Forgot Password',
      'auth.username': 'Username',
      'auth.password': 'Password',
      'auth.email': 'Email',
      
      // Errors
      'error.required': 'This field is required',
      'error.invalidEmail': 'Invalid email address',
      'error.invalidPassword': 'Password must be at least 8 characters',
      'error.unauthorized': 'You are not authorized to perform this action',
      'error.notFound': 'Resource not found',
      
      // Placeholders
      'placeholder.search': 'Search...',
      'placeholder.email': 'Enter your email',
      'placeholder.password': 'Enter your password',
      
      // Time
      'time.now': 'Just now',
      'time.minutesAgo': '{{count}} minute ago',
      'time.minutesAgo_plural': '{{count}} minutes ago',
      'time.hoursAgo': '{{count}} hour ago',
      'time.hoursAgo_plural': '{{count}} hours ago',
      'time.daysAgo': '{{count}} day ago',
      'time.daysAgo_plural': '{{count}} days ago',
      
      // Language names (in English)
      'language.en': 'English',
      'language.es': 'Spanish',
      'language.fr': 'French',
      'language.de': 'German',
      'language.it': 'Italian',
      'language.pt': 'Portuguese',
      'language.ru': 'Russian',
      'language.zh': 'Chinese',
      'language.ja': 'Japanese',
      'language.ko': 'Korean',
      'language.ar': 'Arabic'
    }
  }
};

/**
 * Initialize i18next with configuration
 */
i18n
  // Load translations from backend
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default resources (fallback)
    resources,
    
    // Default language
    fallbackLng: 'en',
    
    // Debug mode (disable in production)
    debug: process.env.NODE_ENV === 'development',
    
    // Detect language from different sources
    detection: {
      // Order of detection
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      
      // Look for 'lng' parameter in URL
      lookupQuerystring: 'lng',
      
      // Store language in cookies
      lookupCookie: 'i18next',
      cookieExpirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
      
      // Store language in localStorage
      lookupLocalStorage: 'i18nextLng',
      
      // Cache user language
      caches: ['localStorage', 'cookie'],
      
      // HTML lang attribute
      htmlTag: document.documentElement
    },
    
    // Namespace
    ns: ['translation'],
    defaultNS: 'translation',
    
    // Key separator
    keySeparator: '.',
    
    // Interpolation
    interpolation: {
      escapeValue: false, // React already escapes values
      formatSeparator: ',',
      format: (value, format) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        return value;
      }
    },
    
    // React options
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      nsMode: 'default'
    },
    
    // Backend options
    backend: {
      // Path to load translations from
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      
      // Path to post missing translations to
      addPath: '/locales/add/{{lng}}/{{ns}}',
      
      // Allow cross-domain requests
      crossDomain: true,
      
      // Parse JSON
      parse: (data) => JSON.parse(data),
      
      // Stringify JSON
      stringify: (data) => JSON.stringify(data),
      
      // Allow loading from file system
      allowMultiLoading: false
    }
  });

export default i18n;
