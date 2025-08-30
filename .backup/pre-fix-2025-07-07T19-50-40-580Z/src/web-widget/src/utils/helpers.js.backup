/**
 * Helper utilities for the Chatbots Platform Web Widget
 */

/**
 * Generate a UUID v4
 * @returns {String} UUID
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validate widget configuration
 * @param {Object} config - Configuration to validate
 * @throws {Error} If configuration is invalid
 */
export function validateConfig(config) {
  // Required fields
  if (!config.apiKey) {
    throw new Error('API key is required');
  }
  
  if (!config.chatbotId) {
    throw new Error('Chatbot ID is required');
  }
  
  // Validate position
  if (config.position && !['left', 'right'].includes(config.position)) {
    throw new Error('Position must be "left" or "right"');
  }
  
  // Validate theme
  if (config.theme && !['light', 'dark', 'auto'].includes(config.theme)) {
    throw new Error('Theme must be "light", "dark", or "auto"');
  }
  
  // Validate colors
  if (config.primaryColor && !isValidColor(config.primaryColor)) {
    throw new Error('Primary color must be a valid CSS color');
  }
  
  if (config.secondaryColor && !isValidColor(config.secondaryColor)) {
    throw new Error('Secondary color must be a valid CSS color');
  }
  
  if (config.textColor && !isValidColor(config.textColor)) {
    throw new Error('Text color must be a valid CSS color');
  }
  
  // Validate numeric values
  if (config.messageDelay !== undefined && (
    typeof config.messageDelay !== 'number' || 
    config.messageDelay < 0
  )) {
    throw new Error('Message delay must be a non-negative number');
  }
  
  // Validate URLs
  if (config.apiUrl && !isValidUrl(config.apiUrl)) {
    throw new Error('API URL must be a valid URL');
  }
  
  if (config.proxyUrl && !isValidProxyUrl(config.proxyUrl)) {
    throw new Error('Proxy URL must be a valid proxy URL (host:port)');
  }
}

/**
 * Merge default and user configurations
 * @param {Object} defaultConfig - Default configuration
 * @param {Object} userConfig - User configuration
 * @returns {Object} Merged configuration
 */
export function mergeConfig(defaultConfig, userConfig) {
  return {
    ...defaultConfig,
    ...userConfig
  };
}

/**
 * Check if a string is a valid CSS color
 * @param {String} color - Color to validate
 * @returns {Boolean} Whether the color is valid
 */
function isValidColor(color) {
  // Simple validation for common color formats
  return (
    /^#([0-9A-F]{3}){1,2}$/i.test(color) || // Hex
    /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(color) || // RGB
    /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i.test(color) || // RGBA
    /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/i.test(color) || // HSL
    /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/i.test(color) || // HSLA
    /^[a-z]+$/i.test(color) // Named color
  );
}

/**
 * Check if a string is a valid URL
 * @param {String} url - URL to validate
 * @returns {Boolean} Whether the URL is valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a string is a valid proxy URL (host:port)
 * @param {String} proxyUrl - Proxy URL to validate
 * @returns {Boolean} Whether the proxy URL is valid
 */
function isValidProxyUrl(proxyUrl) {
  // Simple validation for host:port format
  return /^.+:\d+$/.test(proxyUrl);
}

/**
 * Sanitize HTML to prevent XSS
 * @param {String} html - HTML to sanitize
 * @returns {String} Sanitized HTML
 */
export function sanitizeHtml(html) {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

/**
 * Format a timestamp
 * @param {String|Date} timestamp - Timestamp to format
 * @returns {String} Formatted timestamp
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // Format as HH:MM
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Detect browser features
 * @returns {Object} Object with feature detection results
 */
export function detectFeatures() {
  return {
    localStorage: !!window.localStorage,
    speechSynthesis: !!window.speechSynthesis,
    speechRecognition: !!window.SpeechRecognition || !!window.webkitSpeechRecognition,
    mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    webWorkers: !!window.Worker,
    webSockets: !!window.WebSocket,
    indexedDB: !!window.indexedDB
  };
}

/**
 * Detect device type
 * @returns {String} Device type (mobile, tablet, desktop)
 */
export function detectDeviceType() {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    return 'tablet';
  }
  
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * Detect preferred color scheme
 * @returns {String} Preferred color scheme (light, dark)
 */
export function detectColorScheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {Number} wait - Debounce wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function
 * @param {Function} func - Function to throttle
 * @param {Number} limit - Throttle limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
