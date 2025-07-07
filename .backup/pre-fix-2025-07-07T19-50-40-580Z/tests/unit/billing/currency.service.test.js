/**
 * Currency Service Unit Tests
 */

const currencyService = require('../../../src/billing/services/currency.service');
const { supportedCurrencies, manualExchangeRates } = require('../../../src/billing/config/currency.config');

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

jest.mock('../../../src/utils/cache', () => ({
  get: jest.fn(),
  set: jest.fn()
}));

jest.mock('axios');

describe('Currency Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('convert', () => {
    it('should convert amount between currencies correctly', () => {
      // Set up test exchange rates
      currencyService.exchangeRates = {
        USD: 1.0,
        EUR: 0.85,
        GBP: 0.75
      };
      
      // Convert USD to EUR
      const usdToEur = currencyService.convert(100, 'USD', 'EUR');
      expect(usdToEur).toBe(85);
      
      // Convert EUR to USD
      const eurToUsd = currencyService.convert(85, 'EUR', 'USD');
      expect(eurToUsd).toBe(100);
      
      // Convert EUR to GBP
      const eurToGbp = currencyService.convert(85, 'EUR', 'GBP');
      expect(eurToGbp).toBe(75);
    });
    
    it('should handle same currency conversion', () => {
      const amount = currencyService.convert(100, 'USD', 'USD');
      expect(amount).toBe(100);
    });
    
    it('should use default currency if source currency is not supported', () => {
      // Set up test exchange rates
      currencyService.exchangeRates = {
        USD: 1.0,
        EUR: 0.85
      };
      
      // Mock console.warn
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      const amount = currencyService.convert(100, 'XYZ', 'EUR');
      
      // Should convert from USD (default) to EUR
      expect(amount).toBe(85);
      
      // Restore console.warn
      console.warn = originalWarn;
    });
    
    it('should use default currency if target currency is not supported', () => {
      // Set up test exchange rates
      currencyService.exchangeRates = {
        USD: 1.0,
        EUR: 0.85
      };
      
      // Mock console.warn
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      const amount = currencyService.convert(100, 'EUR', 'XYZ');
      
      // Should convert from EUR to USD (default)
      expect(amount).toBe(100);
      
      // Restore console.warn
      console.warn = originalWarn;
    });
    
    it('should handle errors gracefully', () => {
      // Force an error by passing invalid parameters
      const amount = currencyService.convert('invalid', 'USD', 'EUR');
      
      // Should return original amount on error
      expect(amount).toBe('invalid');
    });
  });
  
  describe('format', () => {
    it('should format amount according to currency rules', () => {
      // USD (symbol before, 2 decimal places)
      const usdFormatted = currencyService.format(1234.56, 'USD');
      expect(usdFormatted).toBe('$1,234.56');
      
      // EUR (symbol after, 2 decimal places)
      const eurFormatted = currencyService.format(1234.56, 'EUR');
      expect(eurFormatted).toBe('1,234.56 €');
      
      // JPY (symbol before, 0 decimal places)
      const jpyFormatted = currencyService.format(1234.56, 'JPY');
      expect(jpyFormatted).toBe('¥1,235');
    });
    
    it('should use default currency if specified currency is not supported', () => {
      const formatted = currencyService.format(1234.56, 'XYZ');
      
      // Should format using USD (default)
      expect(formatted).toBe('$1,234.56');
    });
    
    it('should handle errors gracefully', () => {
      // Force an error by passing invalid parameters
      const formatted = currencyService.format('invalid', 'USD');
      
      // Should return simple fallback format
      expect(formatted).toBe('invalid USD');
    });
  });
  
  describe('getSupportedCurrencies', () => {
    it('should return all supported currencies', () => {
      const currencies = currencyService.getSupportedCurrencies();
      
      expect(currencies).toBeDefined();
      expect(currencies).toEqual(supportedCurrencies);
      expect(Object.keys(currencies).length).toBeGreaterThan(0);
      
      // Check a few specific currencies
      expect(currencies.USD).toBeDefined();
      expect(currencies.EUR).toBeDefined();
      expect(currencies.GBP).toBeDefined();
    });
  });
  
  describe('getExchangeRates', () => {
    it('should return current exchange rates', () => {
      // Set up test exchange rates
      currencyService.exchangeRates = {
        USD: 1.0,
        EUR: 0.85,
        GBP: 0.75
      };
      currencyService.lastUpdated = new Date();
      
      const rates = currencyService.getExchangeRates();
      
      expect(rates).toBeDefined();
      expect(rates.base).toBe('USD');
      expect(rates.rates).toEqual(currencyService.exchangeRates);
      expect(rates.lastUpdated).toEqual(currencyService.lastUpdated);
    });
  });
  
  describe('initializeExchangeRates', () => {
    it('should initialize with manual rates if cache is empty', async () => {
      // Mock cache to return null (empty cache)
      const cache = require('../../../src/utils/cache');
      cache.get.mockResolvedValue(null);
      
      await currencyService.initializeExchangeRates();
      
      // Should use manual rates
      expect(currencyService.exchangeRates).toEqual(manualExchangeRates);
      expect(currencyService.lastUpdated).toBeDefined();
    });
    
    it('should load rates from cache if available', async () => {
      // Mock cache to return cached rates
      const cache = require('../../../src/utils/cache');
      const cachedRates = {
        USD: 1.0,
        EUR: 0.9,
        GBP: 0.8
      };
      const cachedTimestamp = new Date().toISOString();
      
      cache.get.mockImplementation((key) => {
        if (key === 'exchange_rates') {
          return Promise.resolve(JSON.stringify(cachedRates));
        } else if (key === 'exchange_rates_timestamp') {
          return Promise.resolve(cachedTimestamp);
        }
        return Promise.resolve(null);
      });
      
      await currencyService.initializeExchangeRates();
      
      // Should use cached rates
      expect(currencyService.exchangeRates).toEqual(cachedRates);
      expect(currencyService.lastUpdated.toISOString()).toBe(cachedTimestamp);
    });
  });
  
  describe('updateExchangeRates', () => {
    it('should use manual rates if provider is set to manual', async () => {
      // Set provider to manual
      jest.resetModules();
      jest.mock('../../../src/billing/config/currency.config', () => ({
        supportedCurrencies: {},
        defaultCurrency: 'USD',
        exchangeRateProvider: 'manual',
        exchangeRateConfig: {},
        manualExchangeRates: {
          USD: 1.0,
          EUR: 0.9,
          GBP: 0.8
        }
      }));
      
      await currencyService.updateExchangeRates();
      
      // Should use manual rates
      expect(currencyService.exchangeRates).toEqual({
        USD: 1.0,
        EUR: 0.9,
        GBP: 0.8
      });
      expect(currencyService.lastUpdated).toBeDefined();
    });
    
    it('should handle errors gracefully', async () => {
      // Force an error
      const axios = require('axios');
      axios.get.mockRejectedValue(new Error('API error'));
      
      // Set initial rates
      currencyService.exchangeRates = { ...manualExchangeRates };
      currencyService.lastUpdated = new Date();
      
      const initialRates = { ...currencyService.exchangeRates };
      const initialTimestamp = currencyService.lastUpdated;
      
      await currencyService.updateExchangeRates();
      
      // Should keep existing rates on error
      expect(currencyService.exchangeRates).toEqual(initialRates);
      expect(currencyService.lastUpdated).toEqual(initialTimestamp);
    });
  });
});
