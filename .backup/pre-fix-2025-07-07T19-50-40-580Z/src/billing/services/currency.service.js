/**
 * Currency Service
 * 
 * Service for currency conversion and formatting
 */

const axios = require('axios');
const { 
  supportedCurrencies, 
  defaultCurrency, 
  exchangeRateProvider, 
  exchangeRateConfig, 
  manualExchangeRates 
} = require('../config/currency.config');
const logger = require('../../utils/logger');
const cache = require('../../utils/cache');

// Cache keys
const EXCHANGE_RATES_CACHE_KEY = 'exchange_rates';
const EXCHANGE_RATES_TIMESTAMP_KEY = 'exchange_rates_timestamp';

/**
 * Service for currency operations
 */
class CurrencyService {
  constructor() {
    this.exchangeRates = { ...manualExchangeRates };
    this.lastUpdated = null;
    
    // Initialize exchange rates
    this.initializeExchangeRates();
  }
  
  /**
   * Initialize exchange rates
   * @returns {Promise<void>}
   */
  async initializeExchangeRates() {
    try {
      // Try to load from cache first
      const cachedRates = await cache.get(EXCHANGE_RATES_CACHE_KEY);
      const cachedTimestamp = await cache.get(EXCHANGE_RATES_TIMESTAMP_KEY);
      
      if (cachedRates && cachedTimestamp) {
        this.exchangeRates = JSON.parse(cachedRates);
        this.lastUpdated = new Date(cachedTimestamp);
        
        logger.info('Loaded exchange rates from cache', {
          provider: exchangeRateProvider,
          lastUpdated: this.lastUpdated
        });
        
        // Check if we need to update
        const updateInterval = exchangeRateConfig[exchangeRateProvider]?.updateInterval || 24 * 60 * 60 * 1000;
        const now = new Date();
        
        if (now - this.lastUpdated > updateInterval) {
          this.updateExchangeRates();
        }
      } else {
        // No cache, fetch fresh rates
        await this.updateExchangeRates();
      }
    } catch (error) {
      logger.error(`Error initializing exchange rates: ${error.message}`, { error });
      // Fallback to manual rates
      this.exchangeRates = { ...manualExchangeRates };
      this.lastUpdated = new Date();
    }
  }
  
  /**
   * Update exchange rates from provider
   * @returns {Promise<void>}
   */
  async updateExchangeRates() {
    try {
      if (exchangeRateProvider === 'manual') {
        this.exchangeRates = { ...manualExchangeRates };
        this.lastUpdated = new Date();
        
        logger.info('Using manual exchange rates', {
          provider: 'manual',
          lastUpdated: this.lastUpdated
        });
        
        return;
      }
      
      const config = exchangeRateConfig[exchangeRateProvider];
      
      if (!config || !config.apiKey) {
        logger.warn(`Exchange rate provider ${exchangeRateProvider} not configured properly, using manual rates`);
        this.exchangeRates = { ...manualExchangeRates };
        this.lastUpdated = new Date();
        return;
      }
      
      let response;
      
      // Fetch from appropriate provider
      switch (exchangeRateProvider) {
        case 'openexchangerates':
          response = await axios.get(`${config.baseUrl}/latest.json`, {
            params: {
              app_id: config.apiKey,
              base: 'USD'
            }
          });
          
          if (response.data && response.data.rates) {
            this.exchangeRates = response.data.rates;
            this.exchangeRates.USD = 1.0; // Ensure USD is 1.0
            this.lastUpdated = new Date(response.data.timestamp * 1000);
          }
          break;
          
        case 'exchangeratesapi':
          response = await axios.get(`${config.baseUrl}/latest`, {
            params: {
              access_key: config.apiKey,
              base: 'USD'
            }
          });
          
          if (response.data && response.data.rates) {
            this.exchangeRates = response.data.rates;
            this.exchangeRates.USD = 1.0; // Ensure USD is 1.0
            this.lastUpdated = new Date(response.data.timestamp * 1000);
          }
          break;
          
        default:
          logger.warn(`Unknown exchange rate provider: ${exchangeRateProvider}, using manual rates`);
          this.exchangeRates = { ...manualExchangeRates };
          this.lastUpdated = new Date();
          return;
      }
      
      // Cache the rates
      await cache.set(EXCHANGE_RATES_CACHE_KEY, JSON.stringify(this.exchangeRates));
      await cache.set(EXCHANGE_RATES_TIMESTAMP_KEY, this.lastUpdated.toISOString());
      
      logger.info('Updated exchange rates', {
        provider: exchangeRateProvider,
        lastUpdated: this.lastUpdated
      });
    } catch (error) {
      logger.error(`Error updating exchange rates: ${error.message}`, { error });
      
      // Fallback to manual rates if we don't have any rates yet
      if (!this.lastUpdated) {
        this.exchangeRates = { ...manualExchangeRates };
        this.lastUpdated = new Date();
      }
    }
  }
  
  /**
   * Convert amount from one currency to another
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @returns {number} Converted amount
   */
  convert(amount, fromCurrency = defaultCurrency, toCurrency = defaultCurrency) {
    try {
      // Normalize currency codes
      fromCurrency = fromCurrency.toUpperCase();
      toCurrency = toCurrency.toUpperCase();
      
      // Check if currencies are supported
      if (!this.exchangeRates[fromCurrency]) {
        logger.warn(`Unsupported source currency: ${fromCurrency}, using ${defaultCurrency}`);
        fromCurrency = defaultCurrency;
      }
      
      if (!this.exchangeRates[toCurrency]) {
        logger.warn(`Unsupported target currency: ${toCurrency}, using ${defaultCurrency}`);
        toCurrency = defaultCurrency;
      }
      
      // If same currency, no conversion needed
      if (fromCurrency === toCurrency) {
        return amount;
      }
      
      // Convert to USD first (base currency)
      const amountInUSD = amount / this.exchangeRates[fromCurrency];
      
      // Then convert from USD to target currency
      const convertedAmount = amountInUSD * this.exchangeRates[toCurrency];
      
      // Round to appropriate decimal places
      const decimalPlaces = supportedCurrencies[toCurrency]?.decimalPlaces || 2;
      return parseFloat(convertedAmount.toFixed(decimalPlaces));
    } catch (error) {
      logger.error(`Error converting currency: ${error.message}`, { error, amount, fromCurrency, toCurrency });
      return amount; // Return original amount on error
    }
  }
  
  /**
   * Format amount according to currency rules
   * @param {number} amount - Amount to format
   * @param {string} currencyCode - Currency code
   * @returns {string} Formatted amount with currency symbol
   */
  format(amount, currencyCode = defaultCurrency) {
    try {
      // Normalize currency code
      currencyCode = currencyCode.toUpperCase();
      
      // Get currency configuration
      const currency = supportedCurrencies[currencyCode] || supportedCurrencies[defaultCurrency];
      
      // Format number
      const formattedNumber = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: currency.decimalPlaces,
        maximumFractionDigits: currency.decimalPlaces,
        useGrouping: true
      }).format(amount);
      
      // Add currency symbol
      if (currency.symbolPosition === 'before') {
        return `${currency.symbol}${formattedNumber}`;
      } else {
        return `${formattedNumber} ${currency.symbol}`;
      }
    } catch (error) {
      logger.error(`Error formatting currency: ${error.message}`, { error, amount, currencyCode });
      return `${amount} ${currencyCode}`; // Simple fallback
    }
  }
  
  /**
   * Get all supported currencies
   * @returns {Object} Supported currencies
   */
  getSupportedCurrencies() {
    return supportedCurrencies;
  }
  
  /**
   * Get current exchange rates
   * @returns {Object} Exchange rates
   */
  getExchangeRates() {
    return {
      base: 'USD',
      rates: this.exchangeRates,
      lastUpdated: this.lastUpdated
    };
  }
  
  /**
   * Force update of exchange rates
   * @returns {Promise<Object>} Updated exchange rates
   */
  async forceUpdateRates() {
    await this.updateExchangeRates();
    return this.getExchangeRates();
  }
}

module.exports = new CurrencyService();
