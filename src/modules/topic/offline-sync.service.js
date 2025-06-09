/**
 * Offline Synchronization Service
 * 
 * Manages synchronization of data between local storage and server
 */

require('@src/modules\utils');
require('@src/modules\utils\indexedDB');

class OfflineSyncService {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
    this.onlineStatus = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    // Initialize listeners if in browser environment
    if (typeof window !== 'undefined') {
      this.initEventListeners();
    }
  }

  /**
   * Initialize event listeners for online/offline events
   */
  initEventListeners() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Listen for messages from service worker
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
    }
  }

  /**
   * Handle online event
   */
  handleOnline() {
    logger.info('Device is online. Starting sync...');
    this.onlineStatus = true;
    
    // Start sync when we come online
    this.syncData();
    
    // Notify service worker that we're online
    this.notifyServiceWorker('ONLINE');
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    logger.info('Device is offline. Pausing sync...');
    this.onlineStatus = false;
    
    // Stop sync interval when offline
    this.stopSyncInterval();
    
    // Notify service worker that we're offline
    this.notifyServiceWorker('OFFLINE');
  }

  /**
   * Handle messages from service worker
   * 
   * @param {MessageEvent} event - Message event
   */
  handleServiceWorkerMessage(event) {
    const { data } = event;
    
    if (!data || !data.type) return;
    
    logger.debug('Received message from service worker:', data);
    
    switch (data.type) {
      case 'STORE_FOR_SYNC':
        this.storeRequestForSync(data.payload.url, data.payload.method, data.payload.data);
        break;
      
      case 'SYNC_PENDING_REQUESTS':
        this.syncData();
        break;
      
      default:
        // Unknown message type
        break;
    }
  }

  /**
   * Send message to service worker
   * 
   * @param {string} type - Message type
   * @param {Object} payload - Message payload
   */
  notifyServiceWorker(type, payload = {}) {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type,
        payload
      });
    }
  }

  /**
   * Start periodic synchronization
   * 
   * @param {number} interval - Sync interval in milliseconds (default: 5 minutes)
   */
  startSyncInterval(interval = 5 * 60 * 1000) {
    // Clear any existing interval
    this.stopSyncInterval();
    
    // Set new interval
    this.syncInterval = setInterval(() => {
      if (this.onlineStatus && !this.isSyncing) {
        this.syncData();
      }
    }, interval);
    
    logger.info(`Sync interval started (${interval}ms)`);
  }

  /**
   * Stop periodic synchronization
   */
  stopSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Sync interval stopped');
    }
  }

  /**
   * Store a request for later synchronization
   * 
   * @param {string} url - Request URL
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise<number>} ID of the stored request
   */
  async storeRequestForSync(url, method, data) {
    try {
      const id = await storePendingRequest(url, method, data);
      logger.info(`Request stored for later sync: ${method} ${url} (ID: ${id})`);
      return id;
    } catch (error) {
      logger.error('Error storing request for sync:', error);
      throw error;
    }
  }

  /**
   * Synchronize all pending requests
   * 
   * @returns {Promise<Object>} Sync results
   */
  async syncData() {
    // Prevent multiple syncs running simultaneously
    if (this.isSyncing || !this.onlineStatus) {
      return { success: false, message: this.isSyncing ? 'Sync already in progress' : 'Device is offline' };
    }
    
    this.isSyncing = true;
    logger.info('Starting data synchronization...');
    
    try {
      // Get pending requests and sync them
      const results = await syncPendingRequests();
      
      logger.info(`Sync completed: ${results.synced} synced, ${results.failed} failed`);
      
      // If there are still failed requests, schedule retry
      if (results.failed > 0) {
        logger.info(`Scheduling retry for ${results.failed} failed requests`);
        setTimeout(() => this.syncData(), 60000); // Retry after 1 minute
      }
      
      // Trigger sync complete event
      this.triggerSyncCompleteEvent(results);
      
      return results;
    } catch (error) {
      logger.error('Error during data synchronization:', error);
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Trigger sync complete event
   * 
   * @param {Object} results - Sync results
   */
  triggerSyncCompleteEvent(results) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('sync-complete', { detail: results });
      window.dispatchEvent(event);
    }
  }

  /**
   * Get sync status
   * 
   * @returns {Object} Sync status
   */
  getSyncStatus() {
    return {
      online: this.onlineStatus,
      syncing: this.isSyncing,
      syncIntervalActive: !!this.syncInterval
    };
  }

  /**
   * Get pending requests count
   * 
   * @returns {Promise<number>} Number of pending requests
   */
  async getPendingRequestsCount() {
    try {
      const pendingRequests = await getPendingRequests();
      return pendingRequests.length;
    } catch (error) {
      logger.error('Error getting pending requests count:', error);
      return 0;
    }
  }
}

module.exports = new OfflineSyncService();
