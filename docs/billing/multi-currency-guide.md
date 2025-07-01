# Multi-Currency Support Guide

## Overview

This guide provides comprehensive documentation for the multi-currency support features implemented in the Customizable Chatbots platform. These features enable pricing, payments, and reporting in multiple currencies, providing a global solution for businesses with international customers.

## Table of Contents

1. [Supported Currencies](#supported-currencies)
2. [Currency Service](#currency-service)
3. [Frontend Integration](#frontend-integration)
4. [Pricing Configuration](#pricing-configuration)
5. [Payment Processing](#payment-processing)
6. [Reporting and Analytics](#reporting-and-analytics)
7. [Tax Considerations](#tax-considerations)
8. [Best Practices](#best-practices)

## Supported Currencies

The platform supports the following currencies:

| Currency Code | Currency Name      | Symbol |
|---------------|-------------------|--------|
| USD           | US Dollar         | $      |
| EUR           | Euro              | €      |
| GBP           | British Pound     | £      |
| CAD           | Canadian Dollar   | $      |
| AUD           | Australian Dollar | $      |
| JPY           | Japanese Yen      | ¥      |
| CNY           | Chinese Yuan      | ¥      |
| INR           | Indian Rupee      | ₹      |
| BRL           | Brazilian Real    | R$     |
| MXN           | Mexican Peso      | $      |

Additional currencies can be added by extending the currency service configuration.

## Currency Service

The Currency Service is the core component that handles all currency-related operations, including conversion, formatting, and validation.

### Key Features

- **Currency Conversion**: Convert amounts between different currencies using up-to-date exchange rates
- **Currency Formatting**: Format monetary amounts according to locale-specific conventions
- **Exchange Rate Management**: Update and cache exchange rates from external providers
- **Default Currency Configuration**: Set system-wide and tenant-specific default currencies

### Usage

#### Converting Between Currencies

```javascript
const currencyService = require('../src/billing/services/currency.service');

// Convert 100 USD to EUR
const eurAmount = await currencyService.convert({
  amount: 10000, // Amount in cents (100.00)
  fromCurrency: 'USD',
  toCurrency: 'EUR'
});

console.log(`100 USD = ${eurAmount / 100} EUR`);
```

#### Formatting Currency Amounts

```javascript
const currencyService = require('../src/billing/services/currency.service');

// Format 29.99 USD for US locale
const formattedUSD = currencyService.format({
  amount: 2999, // Amount in cents (29.99)
  currency: 'USD',
  locale: 'en-US'
}); // Returns "$29.99"

// Format 29.99 EUR for German locale
const formattedEUR = currencyService.format({
  amount: 2999, // Amount in cents (29.99)
  currency: 'EUR',
  locale: 'de-DE'
}); // Returns "29,99 €"
```

#### Getting Exchange Rates

```javascript
const currencyService = require('../src/billing/services/currency.service');

// Get current exchange rate from USD to EUR
const rate = await currencyService.getExchangeRate('USD', 'EUR');

// Get all exchange rates with USD as base
const allRates = await currencyService.getAllExchangeRates('USD');
```

## Frontend Integration

### Currency Selector Component

The platform includes a reusable currency selector component that allows users to choose their preferred currency.

```jsx
import { CurrencySelector } from '../components/billing/CurrencySelector';

function CheckoutPage() {
  const handleCurrencyChange = (currency) => {
    console.log(`Selected currency: ${currency}`);
    // Update pricing display, etc.
  };

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>
      <CurrencySelector 
        defaultCurrency="USD"
        onChange={handleCurrencyChange}
      />
      {/* Rest of checkout form */}
    </div>
  );
}
```

### Price Display Component

The `PriceDisplay` component automatically formats prices according to the selected currency and locale.

```jsx
import { PriceDisplay } from '../components/billing/PriceDisplay';

function PricingTable({ selectedCurrency }) {
  return (
    <div className="pricing-table">
      <div className="pricing-tier">
        <h3>Basic Plan</h3>
        <PriceDisplay 
          amount={1999} // 19.99 in cents
          currency={selectedCurrency}
          period="month"
        />
      </div>
      {/* Other pricing tiers */}
    </div>
  );
}
```

## Pricing Configuration

### Setting Up Multi-Currency Pricing

Prices for subscription plans can be configured in multiple currencies using the admin dashboard or directly in the database.

#### Example Plan Configuration

```javascript
const plan = {
  id: 'pro_monthly',
  name: 'Pro Plan (Monthly)',
  description: 'Professional features with monthly billing',
  prices: {
    USD: 2999, // 29.99 USD
    EUR: 2499, // 24.99 EUR
    GBP: 2199, // 21.99 GBP
    // Other currencies...
  },
  interval: 'month',
  features: ['advanced_analytics', 'unlimited_templates', 'priority_support']
};

await planService.createPlan(plan);
```

### Dynamic Pricing Strategy

If you don't want to manually set prices for each currency, you can use the currency service to dynamically calculate prices based on exchange rates:

```javascript
const currencyService = require('../src/billing/services/currency.service');

// Base price in USD
const basePriceUSD = 2999; // 29.99 USD

// Get price in EUR based on current exchange rate
const priceEUR = await currencyService.convert({
  amount: basePriceUSD,
  fromCurrency: 'USD',
  toCurrency: 'EUR'
});

// Round to appropriate value for display (e.g., 24.99)
const roundedPriceEUR = Math.round(priceEUR / 100) * 100 - 1;
```

## Payment Processing

### Creating Payment Intents

When processing payments, you need to specify the currency:

```javascript
const paymentService = require('../src/billing/services/payment.service');

// Create a payment intent in EUR
const paymentIntent = await paymentService.createPaymentIntent({
  amount: 2499, // 24.99 EUR
  currency: 'eur', // Currency codes should be lowercase for Stripe
  customerId: 'cus_123456',
  description: 'Pro Plan Subscription'
});
```

### Handling Currency Conversion

The payment service automatically handles currency conversion when necessary:

```javascript
// Customer wants to pay in GBP but subscription is in USD
const paymentIntent = await paymentService.createPaymentIntentWithConversion({
  amount: 2999, // 29.99 USD
  fromCurrency: 'USD',
  toCurrency: 'GBP',
  customerId: 'cus_123456',
  description: 'Pro Plan Subscription'
});
```

## Reporting and Analytics

### Multi-Currency Revenue Reports

The analytics service provides methods to generate revenue reports in different currencies:

```javascript
const analyticsService = require('../src/analytics/services/analytics.service');

// Get revenue report in USD (default currency)
const revenueReportUSD = await analyticsService.getRevenueReport({
  tenantId: 'tenant_id',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-06-30')
});

// Get revenue report in EUR
const revenueReportEUR = await analyticsService.getRevenueReport({
  tenantId: 'tenant_id',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-06-30'),
  currency: 'EUR'
});
```

### Currency Breakdown Reports

You can also generate reports showing revenue breakdown by currency:

```javascript
const currencyBreakdown = await analyticsService.getRevenueByCurrency({
  tenantId: 'tenant_id',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-06-30')
});

// Returns:
// {
//   USD: 45000, // $450.00
//   EUR: 32000, // €320.00
//   GBP: 18000, // £180.00
//   // Other currencies...
// }
```

## Tax Considerations

### Currency-Specific Tax Rates

The tax service supports currency-specific tax rates and rules:

```javascript
const taxService = require('../src/billing/services/tax.service');

// Calculate tax for a transaction in USD
const taxUSD = await taxService.calculateTax({
  amount: 2999,
  currency: 'USD',
  countryCode: 'US',
  stateCode: 'CA'
});

// Calculate tax for a transaction in EUR
const taxEUR = await taxService.calculateTax({
  amount: 2499,
  currency: 'EUR',
  countryCode: 'DE'
});
```

### VAT/GST Handling

The platform automatically handles VAT/GST for different countries based on the currency and customer location:

```javascript
// Calculate price including VAT for EU customer
const priceWithVAT = await taxService.calculatePriceWithTax({
  amount: 2499,
  currency: 'EUR',
  countryCode: 'DE',
  isBusiness: false
});
```

## Best Practices

### 1. Default Currency Selection

Choose a default currency based on the user's location:

```javascript
function determineDefaultCurrency(countryCode) {
  const currencyMap = {
    'US': 'USD',
    'CA': 'CAD',
    'GB': 'GBP',
    'DE': 'EUR',
    'FR': 'EUR',
    // Add more country-to-currency mappings
  };
  
  return currencyMap[countryCode] || 'USD'; // Default to USD if not found
}

// Usage
const userCountry = getUserCountryFromIP();
const defaultCurrency = determineDefaultCurrency(userCountry);
```

### 2. Currency Rounding

Always round currency amounts appropriately for display:

```javascript
function roundCurrencyAmount(amount, currency) {
  // JPY doesn't use decimal places
  if (currency === 'JPY') {
    return Math.round(amount);
  }
  
  // Most currencies use 2 decimal places
  return Math.round(amount * 100) / 100;
}
```

### 3. Exchange Rate Caching

Cache exchange rates to improve performance and reduce API calls:

```javascript
// In currency.service.js
async function getExchangeRate(fromCurrency, toCurrency) {
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  
  // Check cache first
  const cachedRate = await cache.get(cacheKey);
  if (cachedRate) {
    return cachedRate;
  }
  
  // Fetch from API if not in cache
  const rate = await fetchExchangeRateFromAPI(fromCurrency, toCurrency);
  
  // Cache for 1 hour
  await cache.set(cacheKey, rate, 3600);
  
  return rate;
}
```

### 4. Handling Currency Changes

When a user changes their currency preference, update all relevant displays:

```javascript
function handleCurrencyChange(newCurrency) {
  // Update user preference
  updateUserPreferredCurrency(userId, newCurrency);
  
  // Update pricing display
  updatePricingDisplay(newCurrency);
  
  // Update cart totals
  updateCartTotals(newCurrency);
  
  // Update subscription estimates
  updateSubscriptionEstimates(newCurrency);
}
```

### 5. Currency-Specific Formatting

Always format currency amounts according to locale conventions:

```javascript
function getLocaleForCurrency(currency) {
  const currencyLocaleMap = {
    'USD': 'en-US',
    'EUR': 'de-DE',
    'GBP': 'en-GB',
    'JPY': 'ja-JP',
    // Add more mappings
  };
  
  return currencyLocaleMap[currency] || 'en-US';
}

function formatCurrencyAmount(amount, currency) {
  const locale = getLocaleForCurrency(currency);
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
}
```

## Additional Resources

- [Exchange Rate API Documentation](https://exchangeratesapi.io/documentation/)
- [Stripe Multi-Currency Documentation](https://stripe.com/docs/currencies)
- [Intl.NumberFormat Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [VAT/GST Rules by Country](https://taxfoundation.org/value-added-tax-vat-rates-by-country-2020/)
