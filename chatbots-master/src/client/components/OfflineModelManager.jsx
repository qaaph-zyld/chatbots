import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '@src/client\components\OfflineModelManager.css';

/**
 * Offline Model Manager Component
 * 
 * Allows users to download, manage, and delete local NLP models for offline use
 */
const OfflineModelManager = () => {
  const { t } = useTranslation();
  const [availableModels, setAvailableModels] = useState([]);
  const [downloadedModels, setDownloadedModels] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Model types
  const modelTypes = [
    { id: 'all', name: t('models.allTypes') },
    { id: 'intent', name: t('models.intent') },
    { id: 'entity', name: t('models.entity') },
    { id: 'sentiment', name: t('models.sentiment') },
    { id: 'embedding', name: t('models.embedding') },
    { id: 'tokenizer', name: t('models.tokenizer') }
  ];

  // Format bytes to human-readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch available and downloaded models
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch available models
        const availableResponse = await axios.get('/api/models/available');
        setAvailableModels(availableResponse.data.data);
        
        // Fetch downloaded models
        const downloadedResponse = await axios.get('/api/models/downloaded');
        setDownloadedModels(downloadedResponse.data.data);
        
        // Fetch storage usage
        const storageResponse = await axios.get('/api/models/storage');
        setStorageUsage(storageResponse.data.data);
      } catch (err) {
        console.error('Error fetching models:', err);
        setError(t('error.fetchModels'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchModels();
  }, [t]);

  // Download a model
  const handleDownload = async (modelId) => {
    if (!isOnline) {
      setError(t('error.offlineDownload'));
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    // Initialize progress
    setDownloadProgress(prev => ({
      ...prev,
      [modelId]: { progress: 0, status: 'downloading' }
    }));
    
    try {
      // Start download
      await axios.post(`/api/models/download/${modelId}`, {}, {
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          
          setDownloadProgress(prev => ({
            ...prev,
            [modelId]: { 
              progress: percentCompleted, 
              status: 'downloading',
              loaded: progressEvent.loaded,
              total: progressEvent.total
            }
          }));
        }
      });
      
      // Update progress to complete
      setDownloadProgress(prev => ({
        ...prev,
        [modelId]: { progress: 100, status: 'complete' }
      }));
      
      // Update downloaded models list
      const response = await axios.get('/api/models/downloaded');
      setDownloadedModels(response.data.data);
      
      // Update storage usage
      const storageResponse = await axios.get('/api/models/storage');
      setStorageUsage(storageResponse.data.data);
      
      setSuccess(t('models.downloadSuccess'));
      
      // Clear progress after a delay
      setTimeout(() => {
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[modelId];
          return newProgress;
        });
      }, 3000);
    } catch (err) {
      console.error('Error downloading model:', err);
      
      setDownloadProgress(prev => ({
        ...prev,
        [modelId]: { progress: 0, status: 'error' }
      }));
      
      setError(t('error.downloadFailed'));
      
      // Clear error progress after a delay
      setTimeout(() => {
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[modelId];
          return newProgress;
        });
      }, 3000);
    }
  };

  // Delete a model
  const handleDelete = async (modelId) => {
    if (!window.confirm(t('models.confirmDelete'))) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      await axios.delete(`/api/models/delete/${modelId}`);
      
      // Update downloaded models list
      const response = await axios.get('/api/models/downloaded');
      setDownloadedModels(response.data.data);
      
      // Update storage usage
      const storageResponse = await axios.get('/api/models/storage');
      setStorageUsage(storageResponse.data.data);
      
      setSuccess(t('models.deleteSuccess'));
    } catch (err) {
      console.error('Error deleting model:', err);
      setError(t('error.deleteFailed'));
    }
  };

  // Filter models by type
  const getFilteredModels = () => {
    if (selectedType === 'all') {
      return availableModels;
    }
    
    return availableModels.filter(model => model.type === selectedType);
  };

  // Check if a model is downloaded
  const isModelDownloaded = (modelId) => {
    return downloadedModels.some(model => model.id === modelId);
  };

  // Get model size in MB
  const getModelSize = (model) => {
    return model.size ? `${model.size} MB` : t('models.unknownSize');
  };

  // Get model languages
  const getModelLanguages = (model) => {
    if (model.languages && model.languages.length > 0) {
      return model.languages.join(', ');
    }
    
    return model.language || 'en';
  };

  // Get download progress for a model
  const getDownloadProgress = (modelId) => {
    return downloadProgress[modelId] || null;
  };

  return (
    <div className="offline-model-manager">
      <div className="model-manager-header">
        <h2>{t('models.offlineModels')}</h2>
        
        <div className="storage-usage">
          <div className="storage-bar">
            <div 
              className="storage-used" 
              style={{ width: `${(storageUsage.used / storageUsage.total) * 100}%` }}
            ></div>
          </div>
          <div className="storage-text">
            {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.total)}
          </div>
        </div>
        
        <div className="connection-status">
          <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
          {isOnline ? t('status.online') : t('status.offline')}
        </div>
      </div>
      
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
      
      <div className="model-type-filter">
        {modelTypes.map(type => (
          <button
            key={type.id}
            className={`type-filter-button ${selectedType === type.id ? 'active' : ''}`}
            onClick={() => setSelectedType(type.id)}
          >
            {type.name}
          </button>
        ))}
      </div>
      
      {isLoading ? (
        <div className="loading-spinner">{t('message.loading')}</div>
      ) : (
        <div className="models-list">
          {getFilteredModels().map(model => {
            const isDownloaded = isModelDownloaded(model.id);
            const progress = getDownloadProgress(model.id);
            
            return (
              <div key={model.id} className={`model-card ${isDownloaded ? 'downloaded' : ''}`}>
                <div className="model-info">
                  <h3 className="model-name">{model.name}</h3>
                  <div className="model-details">
                    <div className="model-type">{t(`models.${model.type}`)}</div>
                    <div className="model-size">{getModelSize(model)}</div>
                    <div className="model-languages">{getModelLanguages(model)}</div>
                  </div>
                </div>
                
                <div className="model-actions">
                  {isDownloaded ? (
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(model.id)}
                    >
                      {t('action.delete')}
                    </button>
                  ) : (
                    <button 
                      className={`download-button ${progress ? 'downloading' : ''} ${!isOnline ? 'disabled' : ''}`}
                      onClick={() => handleDownload(model.id)}
                      disabled={!isOnline || !!progress}
                    >
                      {progress ? `${progress.progress}%` : t('action.download')}
                    </button>
                  )}
                </div>
                
                {progress && (
                  <div className="download-progress-container">
                    <div 
                      className={`download-progress-bar ${progress.status}`}
                      style={{ width: `${progress.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
          
          {getFilteredModels().length === 0 && (
            <div className="no-models">{t('models.noModelsAvailable')}</div>
          )}
        </div>
      )}
      
      {downloadedModels.length > 0 && (
        <div className="downloaded-models-section">
          <h3>{t('models.downloadedModels')}</h3>
          
          <div className="downloaded-models-list">
            {downloadedModels.map(model => (
              <div key={model.id} className="downloaded-model-item">
                <div className="downloaded-model-info">
                  <span className="downloaded-model-name">{model.name}</span>
                  <span className="downloaded-model-type">{t(`models.${model.type}`)}</span>
                  <span className="downloaded-model-size">{getModelSize(model)}</span>
                </div>
                
                <button 
                  className="delete-button small"
                  onClick={() => handleDelete(model.id)}
                >
                  {t('action.delete')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineModelManager;
