/**
 * Currency Controller
 * 
 * API endpoints for currency operations
 */

const currencyService = require('../services/currency.service');
const logger = require('../../utils/logger');
const { isAdmin } = require('../../middleware/auth.middleware');

/**
 * Get supported currencies
 * @route GET /api/billing/currencies
 * @access Public
 */
const getSupportedCurrencies = async (req, res) => {
  try {
    const currencies = currencyService.getSupportedCurrencies();
    
    return res.status(200).json({
      success: true,
      currencies
    });
  } catch (error) {
    logger.error(`Error getting supported currencies: ${error.message}`, { error });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get supported currencies'
    });
  }
};

/**
 * Get exchange rates
 * @route GET /api/billing/currencies/rates
 * @access Public
 */
const getExchangeRates = async (req, res) => {
  try {
    const exchangeRates = currencyService.getExchangeRates();
    
    return res.status(200).json({
      success: true,
      ...exchangeRates
    });
  } catch (error) {
    logger.error(`Error getting exchange rates: ${error.message}`, { error });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get exchange rates'
    });
  }
};

/**
 * Convert amount between currencies
 * @route POST /api/billing/currencies/convert
 * @access Public
 */
const convertCurrency = async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    
    // Validate required fields
    if (amount === undefined || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, fromCurrency, toCurrency'
      });
    }
    
    // Validate amount is a number
    if (isNaN(parseFloat(amount))) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a valid number'
      });
    }
    
    // Convert currency
    const convertedAmount = currencyService.convert(
      parseFloat(amount),
      fromCurrency,
      toCurrency
    );
    
    // Format amounts
    const formattedOriginal = currencyService.format(parseFloat(amount), fromCurrency);
    const formattedConverted = currencyService.format(convertedAmount, toCurrency);
    
    return res.status(200).json({
      success: true,
      original: {
        amount: parseFloat(amount),
        currency: fromCurrency,
        formatted: formattedOriginal
      },
      converted: {
        amount: convertedAmount,
        currency: toCurrency,
        formatted: formattedConverted
      },
      rate: currencyService.getExchangeRates().rates[toCurrency] / 
            currencyService.getExchangeRates().rates[fromCurrency]
    });
  } catch (error) {
    logger.error(`Error converting currency: ${error.message}`, { error });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to convert currency'
    });
  }
};

/**
 * Format amount according to currency
 * @route POST /api/billing/currencies/format
 * @access Public
 */
const formatCurrency = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    // Validate required fields
    if (amount === undefined || !currency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, currency'
      });
    }
    
    // Validate amount is a number
    if (isNaN(parseFloat(amount))) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a valid number'
      });
    }
    
    // Format amount
    const formatted = currencyService.format(parseFloat(amount), currency);
    
    return res.status(200).json({
      success: true,
      amount: parseFloat(amount),
      currency,
      formatted
    });
  } catch (error) {
    logger.error(`Error formatting currency: ${error.message}`, { error });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to format currency'
    });
  }
};

/**
 * Force update of exchange rates
 * @route POST /api/billing/currencies/update-rates
 * @access Admin only
 */
const updateExchangeRates = async (req, res) => {
  try {
    // Verify admin access
    if (!req.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    // Update rates
    const exchangeRates = await currencyService.forceUpdateRates();
    
    return res.status(200).json({
      success: true,
      message: 'Exchange rates updated successfully',
      ...exchangeRates
    });
  } catch (error) {
    logger.error(`Error updating exchange rates: ${error.message}`, { error });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update exchange rates'
    });
  }
};

module.exports = {
  getSupportedCurrencies,
  getExchangeRates,
  convertCurrency,
  formatCurrency,
  updateExchangeRates
};
