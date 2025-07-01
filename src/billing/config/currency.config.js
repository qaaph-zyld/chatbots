/**
 * Currency Configuration
 * 
 * Configuration for supported currencies and exchange rates
 */

/**
 * Supported currencies with their configurations
 * - code: ISO 4217 currency code
 * - symbol: Currency symbol
 * - name: Currency name
 * - decimalPlaces: Number of decimal places
 * - symbolPosition: Position of the currency symbol ('before' or 'after')
 * - thousandsSeparator: Character used to separate thousands
 * - decimalSeparator: Character used to separate decimal places
 */
const supportedCurrencies = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimalPlaces: 2,
    symbolPosition: 'after',
    thousandsSeparator: '.',
    decimalSeparator: ','
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimalPlaces: 0,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: '.',
    decimalSeparator: ','
  },
  MXN: {
    code: 'MXN',
    symbol: 'MX$',
    name: 'Mexican Peso',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  }
};

/**
 * Default currency code
 */
const defaultCurrency = 'USD';

/**
 * Default exchange rate provider
 * Options: 'openexchangerates', 'exchangeratesapi', 'manual'
 */
const exchangeRateProvider = process.env.EXCHANGE_RATE_PROVIDER || 'manual';

/**
 * Exchange rate API configuration
 */
const exchangeRateConfig = {
  openexchangerates: {
    apiKey: process.env.OPENEXCHANGERATES_API_KEY,
    baseUrl: 'https://openexchangerates.org/api',
    updateInterval: 24 * 60 * 60 * 1000 // 24 hours
  },
  exchangeratesapi: {
    apiKey: process.env.EXCHANGERATESAPI_API_KEY,
    baseUrl: 'https://api.exchangeratesapi.io/v1',
    updateInterval: 24 * 60 * 60 * 1000 // 24 hours
  }
};

/**
 * Manual exchange rates (fallback)
 * Base currency: USD
 * Last updated: 2025-07-01
 */
const manualExchangeRates = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 110.5,
  CAD: 1.35,
  AUD: 1.48,
  INR: 83.2,
  BRL: 5.45,
  MXN: 17.2,
  SGD: 1.34
};

module.exports = {
  supportedCurrencies,
  defaultCurrency,
  exchangeRateProvider,
  exchangeRateConfig,
  manualExchangeRates
};
