import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

/**
 * Language Selector Component
 * 
 * Allows users to select their preferred language
 */
const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Available languages
  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    // Add more languages as they become available
  ];

  // Get current language
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // Handle language change
  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
    
    // Store language preference
    localStorage.setItem('i18nextLng', langCode);
    
    // Set HTML lang attribute
    document.documentElement.setAttribute('lang', langCode);
    
    // Set text direction (for RTL languages)
    const isRTL = ['ar', 'he', 'fa', 'ur'].includes(langCode);
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button 
        className="language-selector__button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="language-selector__flag">{currentLanguage.flag}</span>
        <span className="language-selector__name">{currentLanguage.name}</span>
        <span className="language-selector__arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <ul className="language-selector__dropdown">
          {languages.map((language) => (
            <li key={language.code}>
              <button
                className={`language-selector__option ${language.code === i18n.language ? 'active' : ''}`}
                onClick={() => changeLanguage(language.code)}
                aria-selected={language.code === i18n.language}
              >
                <span className="language-selector__flag">{language.flag}</span>
                <span className="language-selector__name">{t(`language.${language.code}`)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSelector;
