import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '@src/client\pages\LanguageSettingsPage.css';

/**
 * Language Settings Page
 * 
 * Allows users to manage language settings and translations
 */
const LanguageSettingsPage = () => {
  const { t, i18n } = useTranslation();
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPath, setFilterPath] = useState('');

  // Fetch available languages
  useEffect(() => {
    const fetchLanguages = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/api/translations/languages/available');
        setLanguages(response.data.data);
        
        // Set current language as selected
        const currentLang = response.data.data.find(lang => lang.code === i18n.language);
        if (currentLang) {
          setSelectedLanguage(currentLang);
        } else if (response.data.data.length > 0) {
          setSelectedLanguage(response.data.data[0]);
        }
      } catch (err) {
        setError(t('error.serverError'));
        console.error('Error fetching languages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguages();
  }, [i18n.language, t]);

  // Fetch translations for selected language
  useEffect(() => {
    if (!selectedLanguage) return;

    const fetchTranslations = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/translations/${selectedLanguage.code}`);
        setTranslations(response.data.data);
      } catch (err) {
        setError(t('error.serverError'));
        console.error(`Error fetching translations for ${selectedLanguage.code}:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [selectedLanguage, t]);

  // Handle language selection
  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setError(null);
    setSuccess(null);
  };

  // Handle language change
  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setSuccess(t('message.saved'));
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };

  // Flatten nested translation object for display
  const flattenTranslations = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, key) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        return { ...acc, ...flattenTranslations(obj[key], newKey) };
      }
      return { ...acc, [newKey]: obj[key] };
    }, {});
  };

  // Filter translations based on search term and path
  const filteredTranslations = () => {
    const flattened = flattenTranslations(translations);
    return Object.entries(flattened).filter(([key, value]) => {
      const matchesSearch = searchTerm === '' || 
        key.toLowerCase().includes(searchTerm.toLowerCase()) || 
        value.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPath = filterPath === '' || key.startsWith(filterPath);
      
      return matchesSearch && matchesPath;
    });
  };

  // Get unique top-level keys for filtering
  const getTopLevelKeys = () => {
    const keys = Object.keys(translations);
    return keys.sort();
  };

  return (
    <div className="language-settings-page">
      <h1 className="page-title">{t('settings.language')}</h1>
      
      {error && (
        <div className="alert alert-error">
          {error}
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
          <button className="alert-close" onClick={() => setSuccess(null)}>×</button>
        </div>
      )}
      
      <div className="language-settings-container">
        <div className="language-selector-panel">
          <h2>{t('language.select')}</h2>
          
          {isLoading && !languages.length ? (
            <div className="loading-spinner">{t('message.loading')}</div>
          ) : (
            <ul className="language-list">
              {languages.map((language) => (
                <li 
                  key={language.code}
                  className={`language-item ${selectedLanguage?.code === language.code ? 'active' : ''}`}
                  onClick={() => handleLanguageSelect(language)}
                >
                  <span className="language-flag">{language.flag}</span>
                  <span className="language-name">{language.name}</span>
                  {language.isRTL && <span className="language-rtl-badge">RTL</span>}
                  
                  {i18n.language !== language.code && (
                    <button 
                      className="language-use-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLanguageChange(language.code);
                      }}
                    >
                      {t('action.use')}
                    </button>
                  )}
                  
                  {i18n.language === language.code && (
                    <span className="language-current-badge">{t('settings.current')}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="translations-panel">
          <h2>{t('settings.translations')}</h2>
          
          {selectedLanguage && (
            <div className="translations-header">
              <div className="translations-title">
                <span className="language-flag">{selectedLanguage.flag}</span>
                <span className="language-name">{selectedLanguage.name}</span>
                {selectedLanguage.isRTL && <span className="language-rtl-badge">RTL</span>}
              </div>
              
              <div className="translations-filters">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder={t('placeholder.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="path-filter">
                  <select 
                    value={filterPath} 
                    onChange={(e) => setFilterPath(e.target.value)}
                  >
                    <option value="">{t('action.filter')}</option>
                    {getTopLevelKeys().map(key => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {isLoading && selectedLanguage ? (
            <div className="loading-spinner">{t('message.loading')}</div>
          ) : (
            <div className="translations-table-container">
              <table className="translations-table">
                <thead>
                  <tr>
                    <th>{t('settings.key')}</th>
                    <th>{t('settings.value')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTranslations().map(([key, value]) => (
                    <tr key={key}>
                      <td className="translation-key">{key}</td>
                      <td className="translation-value">{value}</td>
                    </tr>
                  ))}
                  
                  {filteredTranslations().length === 0 && (
                    <tr>
                      <td colSpan="2" className="no-results">
                        {t('message.noResults')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LanguageSettingsPage;
