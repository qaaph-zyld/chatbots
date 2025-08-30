/**
 * Tax Service
 * 
 * Handles tax calculation and management for subscriptions
 * Integrates with tax providers like Stripe Tax
 */

const axios = require('axios');
const config = require('../../core/config');
const logger = require('../../utils/logger');
const Tenant = require('../../tenancy/models/tenant.model');
const Subscription = require('../models/subscription.model');
const stripe = require('stripe')(config.stripe.secretKey);

/**
 * Tax Service class for handling tax calculations and management
 */
class TaxService {
  /**
   * Calculate tax for a subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} - Tax calculation result
   */
  async calculateTax(subscriptionId) {
    try {
      // Get subscription details
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }
      
      // Get tenant details
      const tenant = await Tenant.findById(subscription.tenantId);
      if (!tenant) {
        throw new Error(`Tenant not found: ${subscription.tenantId}`);
      }
      
      // Get tax calculation method from config
      const taxProvider = config.tax?.provider || 'internal';
      
      // Calculate tax using the appropriate provider
      switch (taxProvider) {
        case 'stripe':
          return await this.calculateTaxWithStripe(subscription, tenant);
        case 'taxjar':
          return await this.calculateTaxWithTaxJar(subscription, tenant);
        case 'internal':
        default:
          return await this.calculateTaxInternal(subscription, tenant);
      }
    } catch (error) {
      logger.error(`Error calculating tax: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Calculate tax using Stripe Tax
   * @param {Object} subscription - Subscription object
   * @param {Object} tenant - Tenant object
   * @returns {Promise<Object>} - Tax calculation result
   */
  async calculateTaxWithStripe(subscription, tenant) {
    try {
      // Check if Stripe Tax is enabled
      if (!config.stripe?.taxEnabled) {
        logger.warn('Stripe Tax is not enabled in config');
        return this.calculateTaxInternal(subscription, tenant);
      }
      
      // Get customer tax ID
      const customerTaxId = tenant.taxDetails?.taxId;
      
      // Get customer address
      const customerAddress = tenant.organizationDetails?.address || {};
      
      // Create tax calculation
      const taxCalculation = await stripe.tax.calculations.create({
        currency: subscription.plan.currency || 'usd',
        line_items: [
          {
            amount: subscription.plan.price * 100, // Amount in cents
            reference: `plan_${subscription.plan.name}`,
            tax_code: 'txcd_10103001', // Digital goods
            tax_behavior: 'exclusive' // Tax is added to the amount
          }
        ],
        customer_details: {
          address: {
            line1: customerAddress.line1 || '',
            line2: customerAddress.line2 || '',
            city: customerAddress.city || '',
            state: customerAddress.state || '',
            postal_code: customerAddress.postalCode || '',
            country: customerAddress.country || 'US'
          },
          tax_ids: customerTaxId ? [
            {
              type: this.getTaxIdType(customerTaxId, customerAddress.country || 'US'),
              value: customerTaxId
            }
          ] : []
        }
      });
      
      // Format tax calculation result
      return {
        provider: 'stripe',
        taxRate: taxCalculation.tax_breakdown[0]?.tax_rate_percentage || 0,
        taxAmount: taxCalculation.tax_amount_exclusive / 100, // Convert from cents
        taxBreakdown: taxCalculation.tax_breakdown.map(item => ({
          jurisdiction: item.jurisdiction_name,
          rate: item.tax_rate_percentage,
          amount: item.amount / 100 // Convert from cents
        })),
        taxExempt: taxCalculation.tax_amount_exclusive === 0,
        metadata: {
          calculationId: taxCalculation.id,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`Error calculating tax with Stripe: ${error.message}`, { error });
      // Fall back to internal calculation
      return this.calculateTaxInternal(subscription, tenant);
    }
  }
  
  /**
   * Calculate tax using TaxJar
   * @param {Object} subscription - Subscription object
   * @param {Object} tenant - Tenant object
   * @returns {Promise<Object>} - Tax calculation result
   */
  async calculateTaxWithTaxJar(subscription, tenant) {
    try {
      // Check if TaxJar is configured
      if (!config.taxJar?.apiKey) {
        logger.warn('TaxJar API key not configured');
        return this.calculateTaxInternal(subscription, tenant);
      }
      
      // Get customer address
      const customerAddress = tenant.organizationDetails?.address || {};
      
      // Get company address
      const companyAddress = config.company?.address || {};
      
      // Call TaxJar API
      const response = await axios.post(
        'https://api.taxjar.com/v2/taxes',
        {
          from_country: companyAddress.country || 'US',
          from_zip: companyAddress.postalCode || '',
          from_state: companyAddress.state || '',
          from_city: companyAddress.city || '',
          from_street: companyAddress.line1 || '',
          to_country: customerAddress.country || 'US',
          to_zip: customerAddress.postalCode || '',
          to_state: customerAddress.state || '',
          to_city: customerAddress.city || '',
          to_street: customerAddress.line1 || '',
          amount: subscription.plan.price,
          shipping: 0,
          nexus_addresses: [
            {
              country: companyAddress.country || 'US',
              zip: companyAddress.postalCode || '',
              state: companyAddress.state || '',
              city: companyAddress.city || '',
              street: companyAddress.line1 || ''
            }
          ],
          line_items: [
            {
              id: `plan_${subscription.plan.name}`,
              quantity: 1,
              product_tax_code: '30070', // Digital products
              unit_price: subscription.plan.price,
              discount: 0
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${config.taxJar.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const taxData = response.data.tax;
      
      // Format tax calculation result
      return {
        provider: 'taxjar',
        taxRate: taxData.rate * 100, // Convert to percentage
        taxAmount: taxData.amount_to_collect,
        taxBreakdown: [
          {
            jurisdiction: 'State',
            rate: taxData.state_rate * 100,
            amount: taxData.state_tax_collectable
          },
          {
            jurisdiction: 'County',
            rate: taxData.county_rate * 100,
            amount: taxData.county_tax_collectable
          },
          {
            jurisdiction: 'City',
            rate: taxData.city_rate * 100,
            amount: taxData.city_tax_collectable
          },
          {
            jurisdiction: 'Special',
            rate: taxData.special_rate * 100,
            amount: taxData.special_district_tax_collectable
          }
        ].filter(item => item.amount > 0),
        taxExempt: taxData.amount_to_collect === 0,
        metadata: {
          calculationId: response.data.tax.tax_id,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`Error calculating tax with TaxJar: ${error.message}`, { error });
      // Fall back to internal calculation
      return this.calculateTaxInternal(subscription, tenant);
    }
  }
  
  /**
   * Calculate tax using internal rules
   * @param {Object} subscription - Subscription object
   * @param {Object} tenant - Tenant object
   * @returns {Promise<Object>} - Tax calculation result
   */
  async calculateTaxInternal(subscription, tenant) {
    try {
      // Get customer address
      const customerAddress = tenant.organizationDetails?.address || {};
      
      // Get tax rates from config
      const taxRates = config.tax?.rates || {};
      
      // Default tax rate
      let taxRate = taxRates.default || 0;
      let jurisdiction = 'Default';
      
      // Get country-specific tax rate
      const country = customerAddress.country || 'US';
      if (taxRates[country]) {
        taxRate = taxRates[country];
        jurisdiction = country;
        
        // Get state/province-specific tax rate
        const state = customerAddress.state || '';
        if (state && taxRates[`${country}_${state}`]) {
          taxRate = taxRates[`${country}_${state}`];
          jurisdiction = `${country} - ${state}`;
        }
      }
      
      // Check for tax exemption
      const isTaxExempt = tenant.taxDetails?.exempt || false;
      
      // Calculate tax amount
      const taxAmount = isTaxExempt ? 0 : (subscription.plan.price * (taxRate / 100));
      
      // Format tax calculation result
      return {
        provider: 'internal',
        taxRate: taxRate,
        taxAmount: taxAmount,
        taxBreakdown: [
          {
            jurisdiction: jurisdiction,
            rate: taxRate,
            amount: taxAmount
          }
        ],
        taxExempt: isTaxExempt,
        metadata: {
          calculationId: `internal_${Date.now()}`,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`Error calculating tax internally: ${error.message}`, { error });
      // Return zero tax as fallback
      return {
        provider: 'internal',
        taxRate: 0,
        taxAmount: 0,
        taxBreakdown: [],
        taxExempt: true,
        metadata: {
          calculationId: `internal_fallback_${Date.now()}`,
          timestamp: new Date().toISOString(),
          error: error.message
        }
      };
    }
  }
  
  /**
   * Apply tax to a subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} - Updated subscription
   */
  async applyTax(subscriptionId) {
    try {
      // Calculate tax
      const taxCalculation = await this.calculateTax(subscriptionId);
      
      // Get subscription
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }
      
      // Update subscription with tax details
      subscription.taxDetails = {
        provider: taxCalculation.provider,
        taxRate: taxCalculation.taxRate,
        taxAmount: taxCalculation.taxAmount,
        taxBreakdown: taxCalculation.taxBreakdown,
        taxExempt: taxCalculation.taxExempt,
        metadata: taxCalculation.metadata
      };
      
      // Update total amount
      subscription.totalAmount = subscription.plan.price + taxCalculation.taxAmount;
      
      // Save subscription
      await subscription.save();
      
      return subscription;
    } catch (error) {
      logger.error(`Error applying tax to subscription: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Get tax ID type based on country
   * @param {string} taxId - Tax ID
   * @param {string} country - Country code
   * @returns {string} - Tax ID type
   */
  getTaxIdType(taxId, country) {
    // Map country to tax ID type
    const taxIdTypeMap = {
      'US': 'us_ein',
      'CA': 'ca_bn',
      'GB': 'gb_vat',
      'AU': 'au_abn',
      'EU': 'eu_vat',
      'IN': 'in_gst'
    };
    
    return taxIdTypeMap[country] || 'unknown';
  }
  
  /**
   * Validate tax ID
   * @param {string} taxId - Tax ID to validate
   * @param {string} country - Country code
   * @returns {Promise<boolean>} - Whether the tax ID is valid
   */
  async validateTaxId(taxId, country) {
    try {
      // Simple validation for common tax ID formats
      switch (country) {
        case 'US': // US EIN
          return /^\d{2}-\d{7}$/.test(taxId);
        case 'CA': // Canada BN
          return /^\d{9}$/.test(taxId);
        case 'GB': // UK VAT
          return /^GB\d{9}$/.test(taxId) || /^GB\d{12}$/.test(taxId);
        case 'AU': // Australia ABN
          return /^\d{11}$/.test(taxId);
        case 'EU': // EU VAT
          const euVatRegex = {
            'AT': /^ATU\d{8}$/,
            'BE': /^BE0\d{9}$/,
            'DE': /^DE\d{9}$/,
            'FR': /^FR[A-Z0-9]{2}\d{9}$/,
            'IT': /^IT\d{11}$/,
            'ES': /^ES[A-Z0-9]\d{7}[A-Z0-9]$/
          };
          const countryCode = taxId.substring(0, 2);
          return euVatRegex[countryCode] ? euVatRegex[countryCode].test(taxId) : false;
        default:
          return true; // Skip validation for unsupported countries
      }
    } catch (error) {
      logger.error(`Error validating tax ID: ${error.message}`, { error });
      return false;
    }
  }
}

module.exports = new TaxService();
