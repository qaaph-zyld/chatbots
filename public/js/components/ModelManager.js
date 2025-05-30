/**
 * Model Manager Component
 * 
 * A React component for managing voice models for the open-source voice interface.
 * Allows users to view, download, and delete models for speech-to-text, text-to-speech,
 * and voice recognition.
 */

class ModelManager extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      loading: true,
      error: null,
      activeTab: 'stt', // 'stt', 'tts', or 'recognition'
      modelStatus: null,
      availableModels: {},
      installedModels: {},
      downloadProgress: {},
      diskUsage: null
    };
    
    // Bind methods
    this.fetchModelStatus = this.fetchModelStatus.bind(this);
    this.fetchDiskUsage = this.fetchDiskUsage.bind(this);
    this.handleTabChange = this.handleTabChange.bind(this);
    this.handleDownloadModel = this.handleDownloadModel.bind(this);
    this.handleDeleteModel = this.handleDeleteModel.bind(this);
    this.checkDownloadProgress = this.checkDownloadProgress.bind(this);
    this.renderModels = this.renderModels.bind(this);
  }
  
  componentDidMount() {
    this.fetchModelStatus();
    this.fetchDiskUsage();
    
    // Set up interval to check download progress
    this.progressInterval = setInterval(this.checkDownloadProgress, 2000);
  }
  
  componentWillUnmount() {
    // Clear interval
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }
  
  /**
   * Fetch model status
   */
  async fetchModelStatus() {
    try {
      this.setState({ loading: true });
      
      const response = await fetch('/api/model-manager/status');
      const data = await response.json();
      
      if (data.success) {
        this.setState({
          modelStatus: data.status,
          availableModels: {
            stt: data.status.stt.available,
            tts: data.status.tts.available,
            recognition: data.status.recognition.available
          },
          installedModels: {
            stt: data.status.stt.installed,
            tts: data.status.tts.installed,
            recognition: data.status.recognition.installed
          },
          loading: false,
          error: null
        });
      } else {
        this.setState({
          error: data.message || 'Error fetching model status',
          loading: false
        });
      }
    } catch (error) {
      console.error('Error fetching model status:', error);
      
      this.setState({
        error: 'Error fetching model status: ' + error.message,
        loading: false
      });
    }
  }
  
  /**
   * Fetch disk usage
   */
  async fetchDiskUsage() {
    try {
      const response = await fetch('/api/model-manager/disk-usage');
      const data = await response.json();
      
      if (data.success) {
        this.setState({
          diskUsage: data.usage
        });
      }
    } catch (error) {
      console.error('Error fetching disk usage:', error);
    }
  }
  
  /**
   * Handle tab change
   * @param {String} tab - Tab to switch to
   */
  handleTabChange(tab) {
    this.setState({ activeTab: tab });
  }
  
  /**
   * Handle download model
   * @param {String} type - Model type
   * @param {String} modelId - Model ID
   */
  async handleDownloadModel(type, modelId) {
    try {
      // Update download progress
      this.setState(prevState => ({
        downloadProgress: {
          ...prevState.downloadProgress,
          [`${type}/${modelId}`]: 0
        }
      }));
      
      // Start download
      const response = await fetch('/api/model-manager/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          modelId
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        this.setState(prevState => ({
          error: data.message || 'Error downloading model',
          downloadProgress: {
            ...prevState.downloadProgress,
            [`${type}/${modelId}`]: -1 // Error
          }
        }));
      }
    } catch (error) {
      console.error('Error downloading model:', error);
      
      this.setState(prevState => ({
        error: 'Error downloading model: ' + error.message,
        downloadProgress: {
          ...prevState.downloadProgress,
          [`${type}/${modelId}`]: -1 // Error
        }
      }));
    }
  }
  
  /**
   * Handle delete model
   * @param {String} type - Model type
   * @param {String} modelId - Model ID
   */
  async handleDeleteModel(type, modelId) {
    try {
      if (!confirm(`Are you sure you want to delete this model? This cannot be undone.`)) {
        return;
      }
      
      const response = await fetch(`/api/model-manager/${type}/${modelId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh model status
        this.fetchModelStatus();
        this.fetchDiskUsage();
      } else {
        this.setState({
          error: data.message || 'Error deleting model'
        });
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      
      this.setState({
        error: 'Error deleting model: ' + error.message
      });
    }
  }
  
  /**
   * Check download progress
   */
  async checkDownloadProgress() {
    try {
      const { downloadProgress } = this.state;
      
      // Check progress for each downloading model
      for (const key in downloadProgress) {
        if (downloadProgress[key] >= 0 && downloadProgress[key] < 100) {
          const [type, modelId] = key.split('/');
          
          const response = await fetch(`/api/model-manager/progress/${type}/${modelId}`);
          const data = await response.json();
          
          if (data.success) {
            this.setState(prevState => ({
              downloadProgress: {
                ...prevState.downloadProgress,
                [key]: data.progress
              }
            }));
            
            // If download is complete, refresh model status
            if (data.progress === 100) {
              this.fetchModelStatus();
              this.fetchDiskUsage();
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking download progress:', error);
    }
  }
  
  /**
   * Format file size
   * @param {Number} bytes - Size in bytes
   * @returns {String} Formatted size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Render models
   * @returns {JSX.Element} Models list
   */
  renderModels() {
    const { activeTab, availableModels, installedModels, downloadProgress } = this.state;
    
    // Get models for active tab
    const models = availableModels[activeTab] || [];
    
    if (models.length === 0) {
      return (
        <div className="alert alert-info">
          No models available for {activeTab.toUpperCase()}.
        </div>
      );
    }
    
    return (
      <div className="model-list">
        {models.map(model => {
          // Check if model is installed
          const isInstalled = installedModels[activeTab]?.some(m => m.path === model.path);
          
          // Check if model is downloading
          const progressKey = `${activeTab}/${model.path}`;
          const isDownloading = downloadProgress[progressKey] !== undefined && downloadProgress[progressKey] >= 0 && downloadProgress[progressKey] < 100;
          const downloadFailed = downloadProgress[progressKey] === -1;
          
          return (
            <div key={model.path} className="model-card">
              <div className="model-info">
                <h4>{model.name}</h4>
                <p><strong>Language:</strong> {model.language}</p>
                <p><strong>Version:</strong> {model.version}</p>
                <p><strong>Size:</strong> {this.formatFileSize(model.size)}</p>
                {model.engine && <p><strong>Engine:</strong> {model.engine}</p>}
                <p><strong>Status:</strong> {isInstalled ? 'Installed' : 'Not Installed'}</p>
              </div>
              
              <div className="model-actions">
                {isDownloading ? (
                  <div className="download-progress">
                    <div className="progress">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${downloadProgress[progressKey]}%` }}
                        aria-valuenow={downloadProgress[progressKey]}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {downloadProgress[progressKey]}%
                      </div>
                    </div>
                    <p>Downloading... {downloadProgress[progressKey]}%</p>
                  </div>
                ) : downloadFailed ? (
                  <div className="alert alert-danger">
                    Download failed. <button className="btn btn-sm btn-primary" onClick={() => this.handleDownloadModel(activeTab, model.path)}>Retry</button>
                  </div>
                ) : isInstalled ? (
                  <button className="btn btn-danger" onClick={() => this.handleDeleteModel(activeTab, model.path)}>
                    Delete
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={() => this.handleDownloadModel(activeTab, model.path)}>
                    Download
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  
  /**
   * Render disk usage
   * @returns {JSX.Element} Disk usage information
   */
  renderDiskUsage() {
    const { diskUsage } = this.state;
    
    if (!diskUsage) {
      return null;
    }
    
    return (
      <div className="disk-usage">
        <h4>Disk Usage</h4>
        <div className="usage-stats">
          <div className="usage-item">
            <span>Speech-to-Text:</span>
            <span>{this.formatFileSize(diskUsage.stt.size)}</span>
          </div>
          <div className="usage-item">
            <span>Text-to-Speech:</span>
            <span>{this.formatFileSize(diskUsage.tts.size)}</span>
          </div>
          <div className="usage-item">
            <span>Voice Recognition:</span>
            <span>{this.formatFileSize(diskUsage.recognition.size)}</span>
          </div>
          <div className="usage-item total">
            <span>Total:</span>
            <span>{this.formatFileSize(diskUsage.total)}</span>
          </div>
        </div>
      </div>
    );
  }
  
  render() {
    const { loading, error, activeTab, modelStatus } = this.state;
    
    if (loading) {
      return (
        <div className="model-manager loading">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading model information...</p>
        </div>
      );
    }
    
    return (
      <div className="model-manager">
        <h2>Voice Model Manager</h2>
        <p className="lead">Manage voice models for the open-source voice interface.</p>
        
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
        
        {this.renderDiskUsage()}
        
        <div className="model-tabs">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'stt' ? 'active' : ''}`}
                onClick={() => this.handleTabChange('stt')}
              >
                Speech-to-Text
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'tts' ? 'active' : ''}`}
                onClick={() => this.handleTabChange('tts')}
              >
                Text-to-Speech
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'recognition' ? 'active' : ''}`}
                onClick={() => this.handleTabChange('recognition')}
              >
                Voice Recognition
              </button>
            </li>
          </ul>
        </div>
        
        <div className="tab-content">
          <div className="tab-pane active">
            <div className="model-section">
              <div className="section-header">
                <h3>{activeTab === 'stt' ? 'Speech-to-Text' : activeTab === 'tts' ? 'Text-to-Speech' : 'Voice Recognition'} Models</h3>
                {modelStatus && activeTab === 'stt' && (
                  <p>Default Engine: <strong>{modelStatus.stt.defaultEngine}</strong></p>
                )}
                {modelStatus && activeTab === 'tts' && (
                  <p>Default Engine: <strong>{modelStatus.tts.defaultEngine}</strong></p>
                )}
              </div>
              
              {this.renderModels()}
            </div>
          </div>
        </div>
        
        <div className="model-info-section">
          <h3>About Voice Models</h3>
          <p>
            The open-source voice interface uses various models for speech-to-text, text-to-speech, and voice recognition.
            These models are downloaded and processed locally on your server, ensuring privacy and eliminating the need for commercial APIs.
          </p>
          
          <div className="info-cards">
            <div className="info-card">
              <h4>Speech-to-Text</h4>
              <p>
                Speech-to-Text (STT) models convert spoken language into written text.
                We support Mozilla DeepSpeech and Vosk as open-source STT engines.
              </p>
            </div>
            
            <div className="info-card">
              <h4>Text-to-Speech</h4>
              <p>
                Text-to-Speech (TTS) models convert written text into spoken language.
                We support Coqui TTS and eSpeak NG as open-source TTS engines.
              </p>
            </div>
            
            <div className="info-card">
              <h4>Voice Recognition</h4>
              <p>
                Voice Recognition models identify and verify speakers based on their voice characteristics.
                These models enable personalized interactions with your chatbots.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Export component
if (typeof module !== 'undefined') {
  module.exports = { ModelManager };
}
