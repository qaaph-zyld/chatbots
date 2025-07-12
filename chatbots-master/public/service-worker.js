/**
 * Service Worker for Chatbot Platform
 * 
 * Provides offline capabilities through caching and background sync
 */

// Cache names
const STATIC_CACHE_NAME = 'chatbot-static-v1';
const DYNAMIC_CACHE_NAME = 'chatbot-dynamic-v1';
const API_CACHE_NAME = 'chatbot-api-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/static/css/main.css',
  '/static/js/main.js',
  '/static/js/bundle.js',
  '/offline.html',
  '/locales/en/translation.json',
  '/images/logo.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png',
  '/images/offline.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching App Shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[Service Worker] Precaching failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');
  
  // Claim clients to ensure the service worker controls all clients immediately
  self.clients.claim();
  
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME && key !== API_CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        }));
      })
  );
  
  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Handle static assets and other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then((res) => {
            // Clone the response as it can only be consumed once
            const resClone = res.clone();
            
            // Open dynamic cache and store the response
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                // Only cache successful responses
                if (res.status === 200) {
                  cache.put(event.request.url, resClone);
                }
              });
            
            return res;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            
            // If the request is for an HTML page, return the offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            // For other resources, return a default response
            return new Response('Network error occurred', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

/**
 * Handle API requests with a network-first strategy and background sync
 * 
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} The response
 */
async function handleApiRequest(request) {
  // For GET requests, try network first, then cache
  if (request.method === 'GET') {
    try {
      const networkResponse = await fetch(request);
      const responseClone = networkResponse.clone();
      
      // Store the response in cache
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, responseClone);
      
      return networkResponse;
    } catch (error) {
      console.log('[Service Worker] Network request failed, trying cache', error);
      
      // If network fails, try to get from cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If nothing in cache, return error response
      return new Response(JSON.stringify({ 
        error: 'Network error', 
        offline: true,
        message: 'You are offline and the requested data is not cached'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } else {
    // For non-GET requests (POST, PUT, DELETE), try to send immediately
    try {
      return await fetch(request);
    } catch (error) {
      // If offline, store in IndexedDB for later sync
      const data = await request.json();
      await storeRequestForSync(request.url, request.method, data);
      
      // Return a "fake" successful response
      return new Response(JSON.stringify({
        success: true,
        offline: true,
        message: 'Your request has been saved and will be processed when you are online'
      }), {
        status: 202, // Accepted
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

/**
 * Store request data for later synchronization
 * 
 * @param {string} url - Request URL
 * @param {string} method - HTTP method
 * @param {Object} data - Request data
 * @returns {Promise<void>}
 */
async function storeRequestForSync(url, method, data) {
  // This is a placeholder - the actual implementation will use IndexedDB
  // We'll implement this in the IndexedDB utility
  self.postMessage({
    type: 'STORE_FOR_SYNC',
    payload: { url, method, data, timestamp: Date.now() }
  });
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Sync:', event.tag);
  
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

/**
 * Synchronize pending requests when online
 * 
 * @returns {Promise<void>}
 */
async function syncPendingRequests() {
  // This is a placeholder - the actual implementation will retrieve from IndexedDB
  // We'll implement this in the IndexedDB utility
  self.postMessage({
    type: 'SYNC_PENDING_REQUESTS'
  });
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Notification received:', event);
  
  let data = { title: 'New Message', body: 'You have a new message', icon: '/images/icons/icon-192x192.png' };
  
  if (event.data) {
    data = JSON.parse(event.data.text());
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: '/images/icons/badge.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event);
  
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        const url = event.notification.data.url;
        
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open or not focused, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Message event from client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
