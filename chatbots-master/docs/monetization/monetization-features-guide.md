# Monetization Features Guide

This guide provides comprehensive documentation for the monetization features of the Customizable Chatbots platform, including billing, subscription management, and analytics integration.

## Table of Contents

1. [Overview](#overview)
2. [Subscription Management](#subscription-management)
3. [Payment Processing](#payment-processing)
4. [Free Trial Mechanism](#free-trial-mechanism)
5. [Coupon and Promotion System](#coupon-and-promotion-system)
6. [Multi-Currency Support](#multi-currency-support)
7. [Analytics Integration](#analytics-integration)
8. [Data Export](#data-export)
9. [Error Handling](#error-handling)
10. [Testing and Validation](#testing-and-validation)

## Overview

The monetization system provides a complete solution for managing subscriptions, processing payments, and analyzing revenue data. It integrates with the analytics system to provide insights into user behavior and revenue metrics.

### Key Components

- **Subscription Management**: Create, update, and cancel subscriptions
- **Payment Processing**: Process payments using Stripe
- **Free Trial Mechanism**: Manage free trial periods for new users
- **Coupon System**: Apply discounts and promotions
- **Multi-Currency Support**: Handle payments in different currencies
- **Analytics Integration**: Track subscription events and revenue metrics
- **Data Export**: Export billing and analytics data in various formats

## Subscription Management

### Subscription Plans

Plans are defined in the `plans.model.js` file and managed through the `plans.service.js` service.

```javascript
// Example of creating a subscription plan
const planService = require('../src/billing/services/plans.service');

const newPlan = await planService.createPlan({
  name: 'Pro Plan',
  description: 'Professional plan with advanced features',
  price: 49.99,
  currency: 'USD',
  interval: 'month',
  features: ['feature1', 'feature2', 'feature3']
});
```

### Subscription Lifecycle

The subscription lifecycle is managed by the `subscription.service.js` service:

1. **Creation**: When a user subscribes to a plan
2. **Activation**: When payment is confirmed
3. **Renewal**: Automatic renewal at the end of the billing period
4. **Cancellation**: When a user cancels their subscription
5. **Expiration**: When a subscription ends without renewal

```javascript
// Example of subscription lifecycle management
const subscriptionService = require('../src/billing/services/subscription.service');

// Create subscription
const subscription = await subscriptionService.createSubscription({
  tenantId: 'tenant123',
  planId: 'pro-plan',
  paymentMethodId: 'pm_card_visa'
});

// Cancel subscription
await subscriptionService.cancelSubscription(subscription.id, {
  cancelAtPeriodEnd: true
});
```

## Payment Processing

Payment processing is handled by the `payment.service.js` service, which integrates with Stripe.

### Payment Flow

1. **Create Payment Intent**: Generate a payment intent for a subscription
2. **Confirm Payment**: Process the payment using the customer's payment method
3. **Handle Success/Failure**: Update subscription status based on payment result

```javascript
// Example of payment processing
const paymentService = require('../src/billing/services/payment.service');

// Create payment intent
const paymentIntent = await paymentService.createPaymentIntent({
  amount: 4999,
  currency: 'USD',
  customerId: 'cus_123',
  description: 'Pro Plan Subscription'
});

// Confirm payment
const result = await paymentService.confirmPayment(paymentIntent.id, {
  paymentMethodId: 'pm_card_visa'
});
```

### Webhook Handling

Payment events from Stripe are processed by the webhook handler in `webhook.controller.js`:

```javascript
// Example webhook event types handled
const webhookEvents = [
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed'
];
```

## Free Trial Mechanism

Free trials are managed by the `trial.service.js` service.

### Trial Creation

```javascript
// Example of creating a free trial
const trialService = require('../src/billing/services/trial.service');

const trial = await trialService.createTrial({
  tenantId: 'tenant123',
  planId: 'pro-plan',
  durationDays: 14
});
```

### Trial Eligibility

```javascript
// Check if a tenant is eligible for a trial
const isEligible = await trialService.checkEligibility('tenant123');
```

### Trial Expiration

```javascript
// Get trial expiration date
const expirationDate = await trialService.getTrialExpirationDate('tenant123');

// Check if trial is active
const isActive = await trialService.isTrialActive('tenant123');
```

## Coupon and Promotion System

Coupons and promotions are managed by the `coupon.service.js` service.

### Coupon Types

- **Percentage Discount**: Discount as a percentage of the total amount
- **Fixed Amount Discount**: Discount as a fixed amount
- **Free Trial Extension**: Extend the free trial period

### Creating Coupons

```javascript
// Example of creating a coupon
const couponService = require('../src/billing/services/coupon.service');

// Create percentage discount coupon
const percentageCoupon = await couponService.createCoupon({
  code: 'SAVE20',
  type: 'percentage',
  value: 20,
  expiresAt: new Date('2023-12-31')
});

// Create fixed amount discount coupon
const fixedCoupon = await couponService.createCoupon({
  code: 'SAVE10USD',
  type: 'fixed_amount',
  value: 10,
  currency: 'USD',
  expiresAt: new Date('2023-12-31')
});
```

### Applying Coupons

```javascript
// Apply coupon to subscription
const result = await subscriptionService.applyCoupon('subscription123', 'SAVE20');
```

## Multi-Currency Support

Multi-currency support is provided by the `currency.service.js` service.

### Supported Currencies

The system supports the following currencies:
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)
- JPY (Japanese Yen)

### Currency Conversion

```javascript
// Example of currency conversion
const currencyService = require('../src/billing/services/currency.service');

// Convert amount from USD to EUR
const eurAmount = await currencyService.convertCurrency(100, 'USD', 'EUR');
```

### Setting Preferred Currency

```javascript
// Set tenant's preferred currency
await currencyService.setPreferredCurrency('tenant123', 'EUR');

// Get tenant's preferred currency
const preferredCurrency = await currencyService.getPreferredCurrency('tenant123');
```

## Analytics Integration

The billing system integrates with the analytics system to track subscription events and revenue metrics.

### Tracked Events

- `subscription_created`
- `subscription_updated`
- `subscription_cancelled`
- `payment_succeeded`
- `payment_failed`
- `trial_started`
- `trial_ended`

### Revenue Metrics

- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Customer Lifetime Value (LTV)
- Churn Rate
- Revenue by Plan
- Conversion Rate

```javascript
// Example of getting revenue metrics
const analyticsService = require('../src/analytics/services/analytics.service');

// Get MRR for a specific month
const mrr = await analyticsService.getMonthlyRecurringRevenue('2023-06');

// Get churn rate
const churnRate = await analyticsService.getChurnRate({
  startDate: '2023-01-01',
  endDate: '2023-06-30'
});
```

## Data Export

Data export functionality is provided by the `export.controller.js` controller and `data-exporter.js` utility.

### Export Formats

- CSV
- JSON
- Excel (XLSX)

### Exporting Data

```javascript
// Example API endpoints for exporting data
GET /api/analytics/export/events/csv?startDate=2023-01-01&endDate=2023-06-30
GET /api/analytics/export/events/json?startDate=2023-01-01&endDate=2023-06-30
GET /api/analytics/export/events/excel?startDate=2023-01-01&endDate=2023-06-30
GET /api/analytics/export/report?format=csv&startDate=2023-01-01&endDate=2023-06-30
```

## Error Handling

Error handling for payment and subscription operations is managed by the `payment-error-handler.js` utility and `payment-error.middleware.js` middleware.

### Common Error Types

- **Payment Declined**: Card declined by the bank
- **Insufficient Funds**: Not enough funds in the account
- **Invalid Card**: Card number, expiry date, or CVV is invalid
- **Processing Error**: Error during payment processing
- **Network Error**: Connection issues during payment

### Error Handling Flow

1. **Detect Error**: Identify the type of error
2. **Log Error**: Log error details for debugging
3. **Handle Error**: Apply appropriate handling strategy
4. **Notify User**: Provide clear error message to the user
5. **Suggest Recovery**: Suggest actions to resolve the issue

```javascript
// Example of error handling
const errorHandler = require('../src/billing/utils/payment-error-handler');

try {
  // Payment operation
} catch (error) {
  const handledError = errorHandler.handlePaymentError(error);
  
  // Return appropriate response to the user
  res.status(handledError.statusCode).json({
    success: false,
    error: handledError.message,
    code: handledError.code,
    suggestion: handledError.suggestion
  });
}
```

## Testing and Validation

The monetization system includes comprehensive testing utilities to validate billing and analytics functionality.

### Unit Tests

Unit tests for individual components are located in the `tests/unit/billing` and `tests/unit/analytics` directories.

```bash
# Run billing unit tests
npm run test:billing

# Run analytics unit tests
npm run test:analytics
```

### Integration Tests

Integration tests for the monetization system are located in the `tests/integration` directory.

```bash
# Run monetization integration tests
npm run test:monetization-integration
```

### Test Scripts

The following scripts are available for testing the monetization system:

- `scripts/run-monetization-tests.js`: Run all monetization unit tests
- `scripts/validate-monetization-integration.js`: Validate integration between billing and analytics

```bash
# Run all monetization tests
node scripts/run-monetization-tests.js

# Validate monetization integration
node scripts/validate-monetization-integration.js
```

---

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Subscription Management Best Practices](https://stripe.com/docs/billing/subscriptions/overview)
- [Analytics Dashboard Documentation](../analytics/analytics-dashboard-guide.md)
- [Payment Error Handling Guide](./payment-error-handling-guide.md)
