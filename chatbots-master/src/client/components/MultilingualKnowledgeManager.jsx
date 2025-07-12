import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '@src/client\components\MultilingualKnowledgeManager.css';

/**
 * Multilingual Knowledge Manager Component
 * 
 * Allows users to manage knowledge bases in multiple languages
 */
const MultilingualKnowledgeManager = ({ kbId }) => {
  const { t, i18n } = useTranslation();
  const [knowledgeBase, setKnowledgeBase] = useState(null);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [targetLanguages, setTargetLanguages] = useState([]);
  const [allLanguages, setAllLanguages] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);

  // Fetch all supported languages
  useEffect(() => {
    const fetchSupportedLanguages = async () => {
      try {
        const response = await axios.get('/api/translations/languages/supported');
        setAllLanguages(response.data.data);
      } catch (err) {
        console.error('Error fetching supported languages:', err);
      }
    };

    fetchSupportedLanguages();
  }, []);

  // Fetch available languages for the knowledge base
  useEffect(() => {
    if (!kbId) return;

    const fetchAvailableLanguages = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/multilingual-kb/${kbId}/languages`);
        setAvailableLanguages(response.data.data);
        
        // If current language is not available, default to English
        if (!response.data.data.some(lang => lang.code === selectedLanguage)) {
          setSelectedLanguage('en');
        }
      } catch (err) {
        console.error('Error fetching available languages:', err);
        setError(t('error.serverError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableLanguages();
  }, [kbId, selectedLanguage, t]);

  // Fetch knowledge base in selected language
  useEffect(() => {
    if (!kbId || !selectedLanguage) return;

    const fetchKnowledgeBase = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/multilingual-kb/${kbId}?lang=${selectedLanguage}`);
        setKnowledgeBase(response.data.data);
      } catch (err) {
        console.error('Error fetching knowledge base:', err);
        setError(t('error.serverError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchKnowledgeBase();
  }, [kbId, selectedLanguage, t]);

  // Handle language change
  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  // Handle target language selection
  const handleTargetLanguageChange = (e) => {
    const value = e.target.value;
    
    if (targetLanguages.includes(value)) {
      setTargetLanguages(targetLanguages.filter(lang => lang !== value));
    } else {
      setTargetLanguages([...targetLanguages, value]);
    }
  };

  // Handle translation
  const handleTranslate = async () => {
    if (targetLanguages.length === 0) {
      setError(t('error.selectLanguages'));
      return;
    }

    setIsTranslating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(`/api/multilingual-kb/${kbId}/translate`, {
        targetLangs: targetLanguages,
        sourceLang: selectedLanguage
      });

      if (response.data.success) {
        setSuccess(t('message.translationSuccess'));
        
        // Refresh available languages
        const langResponse = await axios.get(`/api/multilingual-kb/${kbId}/languages`);
        setAvailableLanguages(langResponse.data.data);
        
        // Clear target languages
        setTargetLanguages([]);
      } else {
        setError(t('error.translationFailed'));
      }
    } catch (err) {
      console.error('Error translating knowledge base:', err);
      setError(t('error.serverError'));
    } finally {
      setIsTranslating(false);
    }
  };

  // Handle knowledge base deletion for a specific language
  const handleDeleteLanguage = async (langCode) => {
    if (langCode === 'en') {
      setError(t('error.cannotDeleteDefault'));
      return;
    }

    if (!window.confirm(t('message.confirmDeleteLanguage'))) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.delete(`/api/multilingual-kb/${kbId}/${langCode}`);

      if (response.data.success) {
        setSuccess(t('message.languageDeleted'));
        
        // Refresh available languages
        const langResponse = await axios.get(`/api/multilingual-kb/${kbId}/languages`);
        setAvailableLanguages(langResponse.data.data);
        
        // If deleted language was selected, switch to English
        if (selectedLanguage === langCode) {
          setSelectedLanguage('en');
        }
      } else {
        setError(t('error.deleteFailed'));
      }
    } catch (err) {
      console.error('Error deleting language:', err);
      setError(t('error.serverError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Get language name from code
  const getLanguageName = (code) => {
    const language = allLanguages.find(lang => lang.code === code);
    return language ? language.name : code;
  };

  // Get language that are not yet available for this KB
  const getUnavailableLanguages = () => {
    const availableCodes = availableLanguages.map(lang => lang.code);
    return allLanguages.filter(lang => !availableCodes.includes(lang.code));
  };

  return (
    <div className="multilingual-knowledge-manager">
      <h2>{t('knowledgeBase.multilingualManagement')}</h2>
      
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
      
      {isLoading ? (
        <div className="loading">{t('message.loading')}</div>
      ) : (
        <div className="multilingual-content">
          <div className="language-selector">
            <h3>{t('knowledgeBase.selectLanguage')}</h3>
            <select value={selectedLanguage} onChange={handleLanguageChange}>
              {availableLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} {lang.isRTL ? '(RTL)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="available-languages">
            <h3>{t('knowledgeBase.availableLanguages')}</h3>
            <ul className="language-list">
              {availableLanguages.map(lang => (
                <li key={lang.code} className="language-item">
                  <span className="language-flag">{lang.flag}</span>
                  <span className="language-name">{lang.name}</span>
                  {lang.isRTL && <span className="language-rtl-badge">RTL</span>}
                  
                  {lang.code !== 'en' && (
                    <button 
                      className="language-delete-button"
                      onClick={() => handleDeleteLanguage(lang.code)}
                    >
                      {t('action.delete')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="translation-section">
            <h3>{t('knowledgeBase.translateTo')}</h3>
            
            <div className="target-languages">
              {getUnavailableLanguages().map(lang => (
                <label key={lang.code} className="language-checkbox">
                  <input
                    type="checkbox"
                    value={lang.code}
                    checked={targetLanguages.includes(lang.code)}
                    onChange={handleTargetLanguageChange}
                  />
                  <span className="language-flag">{lang.flag}</span>
                  <span className="language-name">{lang.name}</span>
                  {lang.isRTL && <span className="language-rtl-badge">RTL</span>}
                </label>
              ))}
            </div>
            
            {getUnavailableLanguages().length === 0 && (
              <p className="no-languages">{t('knowledgeBase.allLanguagesAvailable')}</p>
            )}
            
            {getUnavailableLanguages().length > 0 && (
              <button 
                className="translate-button"
                onClick={handleTranslate}
                disabled={isTranslating || targetLanguages.length === 0}
              >
                {isTranslating ? t('message.translating') : t('action.translate')}
              </button>
            )}
          </div>
          
          {knowledgeBase && (
            <div className="knowledge-base-preview">
              <h3>{t('knowledgeBase.preview')}</h3>
              <div className="preview-content">
                <h4>{knowledgeBase.title || t('knowledgeBase.untitled')}</h4>
                <p>{knowledgeBase.description || t('knowledgeBase.noDescription')}</p>
                
                {knowledgeBase.entries && knowledgeBase.entries.length > 0 ? (
                  <div className="entries-list">
                    <h5>{t('knowledgeBase.entries')}</h5>
                    <ul>
                      {knowledgeBase.entries.slice(0, 5).map((entry, index) => (
                        <li key={index} className="entry-item">
                          <div className="entry-question">{entry.question}</div>
                          <div className="entry-answer">{entry.answer}</div>
                        </li>
                      ))}
                      
                      {knowledgeBase.entries.length > 5 && (
                        <li className="more-entries">
                          {t('knowledgeBase.moreEntries', { count: knowledgeBase.entries.length - 5 })}
                        </li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <p className="no-entries">{t('knowledgeBase.noEntries')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultilingualKnowledgeManager;
