/**
 * Language Detector Utility
 * 
 * Provides utilities for detecting and managing language preferences
 */

/**
 * Detect user's preferred language
 * 
 * @returns {string} Language code (e.g., 'en', 'es', 'fr')
 */
export const detectUserLanguage = () => {
  // Check URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lng');
  if (urlLang) {
    return urlLang;
  }

  // Check localStorage
  const localStorageLang = localStorage.getItem('i18nextLng');
  if (localStorageLang) {
    return localStorageLang;
  }

  // Check cookies
  const cookieLang = getCookie('i18next');
  if (cookieLang) {
    return cookieLang;
  }

  // Check browser language
  const browserLang = navigator.language || navigator.userLanguage;
  if (browserLang) {
    // Get the base language code (e.g., 'en-US' -> 'en')
    const baseLanguage = browserLang.split('-')[0];
    return baseLanguage;
  }

  // Default to English
  return 'en';
};

/**
 * Get a cookie value by name
 * 
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
};

/**
 * Set language preference
 * 
 * @param {string} langCode - Language code (e.g., 'en', 'es', 'fr')
 */
export const setLanguagePreference = (langCode) => {
  // Store in localStorage
  localStorage.setItem('i18nextLng', langCode);

  // Store in cookie (expires in 1 year)
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  document.cookie = `i18next=${langCode}; expires=${expirationDate.toUTCString()}; path=/`;

  // Set HTML lang attribute
  document.documentElement.setAttribute('lang', langCode);

  // Set text direction (for RTL languages)
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(langCode);
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
};

/**
 * Get supported languages
 * 
 * @returns {Array} Array of supported language objects
 */
export const getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English', flag: '🇬🇧', isRTL: false },
    { code: 'es', name: 'Español', flag: '🇪🇸', isRTL: false },
    { code: 'fr', name: 'Français', flag: '🇫🇷', isRTL: false },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', isRTL: false },
    { code: 'it', name: 'Italiano', flag: '🇮🇹', isRTL: false },
    { code: 'pt', name: 'Português', flag: '🇵🇹', isRTL: false },
    { code: 'ru', name: 'Русский', flag: '🇷🇺', isRTL: false },
    { code: 'zh', name: '中文', flag: '🇨🇳', isRTL: false },
    { code: 'ja', name: '日本語', flag: '🇯🇵', isRTL: false },
    { code: 'ko', name: '한국어', flag: '🇰🇷', isRTL: false },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', isRTL: true },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', isRTL: false },
    { code: 'he', name: 'עברית', flag: '🇮🇱', isRTL: true },
    { code: 'fa', name: 'فارسی', flag: '🇮🇷', isRTL: true },
    { code: 'ur', name: 'اردو', flag: '🇵🇰', isRTL: true }
  ];
};

/**
 * Check if a language is supported
 * 
 * @param {string} langCode - Language code to check
 * @returns {boolean} Whether the language is supported
 */
export const isLanguageSupported = (langCode) => {
  const supportedLanguages = getSupportedLanguages();
  return supportedLanguages.some(lang => lang.code === langCode);
};

/**
 * Get language information by code
 * 
 * @param {string} langCode - Language code
 * @returns {Object|null} Language information or null if not supported
 */
export const getLanguageInfo = (langCode) => {
  const supportedLanguages = getSupportedLanguages();
  return supportedLanguages.find(lang => lang.code === langCode) || null;
};

export default {
  detectUserLanguage,
  setLanguagePreference,
  getSupportedLanguages,
  isLanguageSupported,
  getLanguageInfo
};
