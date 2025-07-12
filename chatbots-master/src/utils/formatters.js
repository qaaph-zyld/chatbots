/**
 * Utility functions for formatting values
 */

/**
 * Format a number as currency
 * @param {number} value - The value to format
 * @param {string} currency - The currency code (default: USD)
 * @param {string} locale - The locale to use for formatting (default: en-US)
 * @returns {string} - Formatted currency string
 */
const formatCurrency = (value, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
};

/**
 * Format a number as a percentage
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted percentage string
 */
const formatPercentage = (value, decimals = 2) => {
  return `${(value || 0).toFixed(decimals)}%`;
};

/**
 * Format a date
 * @param {string|Date} date - The date to format
 * @param {string} format - The format to use (short, medium, long, full)
 * @param {string} locale - The locale to use for formatting (default: en-US)
 * @returns {string} - Formatted date string
 */
const formatDate = (date, format = 'medium', locale = 'en-US') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  };
  
  return new Intl.DateTimeFormat(locale, options[format] || options.medium).format(dateObj);
};

/**
 * Format a number with thousands separators
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @param {string} locale - The locale to use for formatting (default: en-US)
 * @returns {string} - Formatted number string
 */
const formatNumber = (value, decimals = 0, locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value || 0);
};

/**
 * Format a file size
 * @param {number} bytes - The size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted file size string
 */
const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

/**
 * Format a duration in milliseconds to a human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} - Formatted duration string
 */
const formatDuration = (ms) => {
  if (!ms || ms < 0) return '0s';
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
};

module.exports = {
  formatCurrency,
  formatPercentage,
  formatDate,
  formatNumber,
  formatFileSize,
  formatDuration
};
