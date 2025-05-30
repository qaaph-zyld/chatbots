/**
 * IndexedDB Utility
 * 
 * Provides functions for working with IndexedDB to store and retrieve data for offline use
 */

// Database name and version
const DB_NAME = 'chatbot-platform-db';
const DB_VERSION = 1;

// Object store names
const STORES = {
  CHATBOTS: 'chatbots',
  MESSAGES: 'messages',
  KNOWLEDGE_BASE: 'knowledge-base',
  PENDING_REQUESTS: 'pending-requests',
  USER_DATA: 'user-data',
  SETTINGS: 'settings',
  MODELS: 'models'
};

/**
 * Initialize the database
 * 
 * @returns {Promise<IDBDatabase>} The database instance
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      console.error('Your browser does not support IndexedDB');
      reject(new Error('IndexedDB not supported'));
      return;
    }

    // Open the database
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    // Handle database upgrade (called when the database is created or version changes)
    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores with indexes
      if (!db.objectStoreNames.contains(STORES.CHATBOTS)) {
        const chatbotsStore = db.createObjectStore(STORES.CHATBOTS, { keyPath: 'id' });
        chatbotsStore.createIndex('name', 'name', { unique: false });
        chatbotsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const messagesStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id', autoIncrement: true });
        messagesStore.createIndex('chatbotId', 'chatbotId', { unique: false });
        messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
        messagesStore.createIndex('chatbotId_timestamp', ['chatbotId', 'timestamp'], { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.KNOWLEDGE_BASE)) {
        const kbStore = db.createObjectStore(STORES.KNOWLEDGE_BASE, { keyPath: 'id' });
        kbStore.createIndex('chatbotId', 'chatbotId', { unique: false });
        kbStore.createIndex('language', 'language', { unique: false });
        kbStore.createIndex('chatbotId_language', ['chatbotId', 'language'], { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PENDING_REQUESTS)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_REQUESTS, { keyPath: 'id', autoIncrement: true });
        pendingStore.createIndex('url', 'url', { unique: false });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        pendingStore.createIndex('status', 'status', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        const userDataStore = db.createObjectStore(STORES.USER_DATA, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        const settingsStore = db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.MODELS)) {
        const modelsStore = db.createObjectStore(STORES.MODELS, { keyPath: 'id' });
        modelsStore.createIndex('type', 'type', { unique: false });
        modelsStore.createIndex('language', 'language', { unique: false });
        modelsStore.createIndex('size', 'size', { unique: false });
      }

      console.log('Database setup complete');
    };

    // Handle success
    request.onsuccess = (event) => {
      const db = event.target.result;
      console.log('Database initialized successfully');
      resolve(db);
    };

    // Handle error
    request.onerror = (event) => {
      console.error('Database initialization error:', event.target.error);
      reject(event.target.error);
    };
  });
};

/**
 * Get a database connection
 * 
 * @returns {Promise<IDBDatabase>} The database instance
 */
export const getDB = async () => {
  try {
    return await initDB();
  } catch (error) {
    console.error('Error getting database connection:', error);
    throw error;
  }
};

/**
 * Add an item to an object store
 * 
 * @param {string} storeName - Name of the object store
 * @param {Object} item - Item to add
 * @returns {Promise<any>} The key of the added item
 */
export const addItem = async (storeName, item) => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      // Add timestamp if not present
      if (!item.createdAt) {
        item.createdAt = new Date().toISOString();
      }
      if (!item.updatedAt) {
        item.updatedAt = new Date().toISOString();
      }

      const request = store.add(item);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error(`Error adding item to ${storeName}:`, event.target.error);
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    } catch (error) {
      console.error(`Error in addItem for ${storeName}:`, error);
      reject(error);
    }
  });
};

/**
 * Get an item from an object store by key
 * 
 * @param {string} storeName - Name of the object store
 * @param {string|number} key - Key of the item to get
 * @returns {Promise<any>} The requested item
 */
export const getItem = async (storeName, key) => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error(`Error getting item from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    } catch (error) {
      console.error(`Error in getItem for ${storeName}:`, error);
      reject(error);
    }
  });
};

/**
 * Update an item in an object store
 * 
 * @param {string} storeName - Name of the object store
 * @param {Object} item - Item to update (must include key)
 * @returns {Promise<any>} The updated item
 */
export const updateItem = async (storeName, item) => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      // Update timestamp
      item.updatedAt = new Date().toISOString();

      const request = store.put(item);

      request.onsuccess = (event) => {
        resolve(item);
      };

      request.onerror = (event) => {
        console.error(`Error updating item in ${storeName}:`, event.target.error);
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    } catch (error) {
      console.error(`Error in updateItem for ${storeName}:`, error);
      reject(error);
    }
  });
};

/**
 * Delete an item from an object store
 * 
 * @param {string} storeName - Name of the object store
 * @param {string|number} key - Key of the item to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteItem = async (storeName, key) => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = (event) => {
        resolve(true);
      };

      request.onerror = (event) => {
        console.error(`Error deleting item from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    } catch (error) {
      console.error(`Error in deleteItem for ${storeName}:`, error);
      reject(error);
    }
  });
};

/**
 * Get all items from an object store
 * 
 * @param {string} storeName - Name of the object store
 * @returns {Promise<Array>} All items in the store
 */
export const getAllItems = async (storeName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error(`Error getting all items from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    } catch (error) {
      console.error(`Error in getAllItems for ${storeName}:`, error);
      reject(error);
    }
  });
};

/**
 * Get items by index
 * 
 * @param {string} storeName - Name of the object store
 * @param {string} indexName - Name of the index
 * @param {any} value - Value to search for
 * @returns {Promise<Array>} Matching items
 */
export const getItemsByIndex = async (storeName, indexName, value) => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error(`Error getting items by index from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    } catch (error) {
      console.error(`Error in getItemsByIndex for ${storeName}:`, error);
      reject(error);
    }
  });
};

/**
 * Clear all items from an object store
 * 
 * @param {string} storeName - Name of the object store
 * @returns {Promise<boolean>} Success status
 */
export const clearStore = async (storeName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = (event) => {
        resolve(true);
      };

      request.onerror = (event) => {
        console.error(`Error clearing ${storeName}:`, event.target.error);
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    } catch (error) {
      console.error(`Error in clearStore for ${storeName}:`, error);
      reject(error);
    }
  });
};

/**
 * Store a pending request for later synchronization
 * 
 * @param {string} url - Request URL
 * @param {string} method - HTTP method
 * @param {Object} data - Request data
 * @returns {Promise<number>} ID of the stored request
 */
export const storePendingRequest = async (url, method, data) => {
  const pendingRequest = {
    url,
    method,
    data,
    timestamp: new Date().toISOString(),
    status: 'pending',
    retryCount: 0
  };

  return await addItem(STORES.PENDING_REQUESTS, pendingRequest);
};

/**
 * Get all pending requests
 * 
 * @returns {Promise<Array>} Pending requests
 */
export const getPendingRequests = async () => {
  return await getItemsByIndex(STORES.PENDING_REQUESTS, 'status', 'pending');
};

/**
 * Update a pending request status
 * 
 * @param {number} id - Request ID
 * @param {string} status - New status ('pending', 'synced', 'failed')
 * @param {Object} result - Result of the sync attempt
 * @returns {Promise<Object>} Updated request
 */
export const updatePendingRequestStatus = async (id, status, result = null) => {
  const request = await getItem(STORES.PENDING_REQUESTS, id);
  
  if (!request) {
    throw new Error(`Pending request with ID ${id} not found`);
  }

  request.status = status;
  request.lastSyncAttempt = new Date().toISOString();
  
  if (status === 'failed') {
    request.retryCount = (request.retryCount || 0) + 1;
  }
  
  if (result) {
    request.result = result;
  }

  return await updateItem(STORES.PENDING_REQUESTS, request);
};

/**
 * Synchronize all pending requests
 * 
 * @returns {Promise<Object>} Sync results
 */
export const syncPendingRequests = async () => {
  // Only sync if online
  if (!navigator.onLine) {
    return { success: false, message: 'Device is offline' };
  }

  const pendingRequests = await getPendingRequests();
  
  if (pendingRequests.length === 0) {
    return { success: true, message: 'No pending requests to sync', synced: 0 };
  }

  const results = {
    success: true,
    total: pendingRequests.length,
    synced: 0,
    failed: 0,
    details: []
  };

  for (const request of pendingRequests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request.data)
      });

      const result = await response.json();

      if (response.ok) {
        await updatePendingRequestStatus(request.id, 'synced', result);
        results.synced++;
        results.details.push({
          id: request.id,
          url: request.url,
          method: request.method,
          status: 'synced',
          response: result
        });
      } else {
        await updatePendingRequestStatus(request.id, 'failed', result);
        results.failed++;
        results.details.push({
          id: request.id,
          url: request.url,
          method: request.method,
          status: 'failed',
          error: result
        });
      }
    } catch (error) {
      await updatePendingRequestStatus(request.id, 'failed', { error: error.message });
      results.failed++;
      results.details.push({
        id: request.id,
        url: request.url,
        method: request.method,
        status: 'failed',
        error: error.message
      });
    }
  }

  results.success = results.failed === 0;
  return results;
};

/**
 * Store user settings
 * 
 * @param {Object} settings - User settings
 * @returns {Promise<Object>} Stored settings
 */
export const storeSettings = async (settings) => {
  // Use a fixed ID for settings
  const settingsWithId = { ...settings, id: 'user-settings' };
  return await updateItem(STORES.SETTINGS, settingsWithId);
};

/**
 * Get user settings
 * 
 * @returns {Promise<Object>} User settings
 */
export const getSettings = async () => {
  return await getItem(STORES.SETTINGS, 'user-settings');
};

/**
 * Store a model for offline use
 * 
 * @param {Object} model - Model data
 * @returns {Promise<string>} Model ID
 */
export const storeModel = async (model) => {
  if (!model.id) {
    model.id = `model-${Date.now()}`;
  }
  
  await addItem(STORES.MODELS, model);
  return model.id;
};

/**
 * Get a model by ID
 * 
 * @param {string} modelId - Model ID
 * @returns {Promise<Object>} Model data
 */
export const getModel = async (modelId) => {
  return await getItem(STORES.MODELS, modelId);
};

/**
 * Get models by type
 * 
 * @param {string} type - Model type
 * @returns {Promise<Array>} Models of the specified type
 */
export const getModelsByType = async (type) => {
  return await getItemsByIndex(STORES.MODELS, 'type', type);
};

/**
 * Delete a model
 * 
 * @param {string} modelId - Model ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteModel = async (modelId) => {
  return await deleteItem(STORES.MODELS, modelId);
};

/**
 * Calculate total storage usage
 * 
 * @returns {Promise<Object>} Storage usage statistics
 */
export const getStorageUsage = async () => {
  const usage = {
    total: 0,
    stores: {}
  };

  for (const storeName of Object.values(STORES)) {
    const items = await getAllItems(storeName);
    
    // Calculate size of items in this store
    let storeSize = 0;
    for (const item of items) {
      // Approximate size calculation
      const itemString = JSON.stringify(item);
      storeSize += itemString.length * 2; // UTF-16 characters are 2 bytes each
    }
    
    usage.stores[storeName] = {
      items: items.length,
      size: storeSize
    };
    
    usage.total += storeSize;
  }

  return usage;
};

// Export store names for easy access
export const stores = STORES;
