import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import OfflineModelManager from '../components/OfflineModelManager';
import './OfflineModelsPage.css';

/**
 * Offline Models Page
 * 
 * Page for managing offline NLP models for the chatbot platform
 */
const OfflineModelsPage = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storageInfo, setStorageInfo] = useState(null);
  
  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Get storage info
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        setStorageInfo({
          usage: estimate.usage,
          quota: estimate.quota,
          percent: Math.round((estimate.usage / estimate.quota) * 100)
        });
      });
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="offline-models-page">
      <div className="page-header">
        <div className="header-content">
          <h1>{t('pages.offlineModels.title')}</h1>
          <p className="page-description">{t('pages.offlineModels.description')}</p>
          
          <div className="connection-banner">
            <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
              <span className="status-dot"></span>
              <span className="status-text">
                {isOnline ? t('status.online') : t('status.offline')}
              </span>
            </div>
            
            {!isOnline && (
              <div className="offline-message">
                {t('pages.offlineModels.offlineMessage')}
              </div>
            )}
          </div>
          
          {storageInfo && (
            <div className="storage-info">
              <div className="storage-label">{t('pages.offlineModels.storageUsage')}</div>
              <div className="storage-bar">
                <div 
                  className="storage-used" 
                  style={{ width: `${storageInfo.percent}%` }}
                ></div>
              </div>
              <div className="storage-details">
                {t('pages.offlineModels.used')}: {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
                ({storageInfo.percent}%)
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="page-content">
        <div className="info-cards">
          <div className="info-card">
            <h3>{t('pages.offlineModels.whyOffline.title')}</h3>
            <p>{t('pages.offlineModels.whyOffline.description')}</p>
          </div>
          
          <div className="info-card">
            <h3>{t('pages.offlineModels.howItWorks.title')}</h3>
            <p>{t('pages.offlineModels.howItWorks.description')}</p>
          </div>
          
          <div className="info-card">
            <h3>{t('pages.offlineModels.bestPractices.title')}</h3>
            <p>{t('pages.offlineModels.bestPractices.description')}</p>
          </div>
        </div>
        
        <div className="model-manager-container">
          <OfflineModelManager />
        </div>
        
        <div className="related-features">
          <h2>{t('pages.offlineModels.relatedFeatures')}</h2>
          
          <div className="feature-links">
            <Link to="/offline-settings" className="feature-link">
              <div className="feature-icon">⚙️</div>
              <div className="feature-info">
                <h3>{t('pages.offlineSettings.title')}</h3>
                <p>{t('pages.offlineSettings.shortDescription')}</p>
              </div>
            </Link>
            
            <Link to="/knowledge-base" className="feature-link">
              <div className="feature-icon">📚</div>
              <div className="feature-info">
                <h3>{t('pages.knowledgeBase.title')}</h3>
                <p>{t('pages.knowledgeBase.shortDescription')}</p>
              </div>
            </Link>
            
            <Link to="/language-settings" className="feature-link">
              <div className="feature-icon">🌐</div>
              <div className="feature-info">
                <h3>{t('pages.languageSettings.title')}</h3>
                <p>{t('pages.languageSettings.shortDescription')}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format bytes
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default OfflineModelsPage;
