# Monetization Features Guide

## Overview

This guide provides comprehensive documentation for the monetization features implemented in the Customizable Chatbots platform. These features enable subscription management, payment processing, feature gating, analytics, and reporting capabilities essential for commercial deployment.

## Table of Contents

1. [Subscription Management](#subscription-management)
2. [Payment Processing](#payment-processing)
3. [Feature Gating](#feature-gating)
4. [Free Trial Mechanism](#free-trial-mechanism)
5. [Coupon and Promotion System](#coupon-and-promotion-system)
6. [Multi-Currency Support](#multi-currency-support)
7. [Analytics and Reporting](#analytics-and-reporting)
8. [Data Export](#data-export)
9. [Error Handling](#error-handling)
10. [Integration Guide](#integration-guide)

## Subscription Management

### Overview

The subscription management system allows users to subscribe to different service tiers, manage their subscriptions, and access features based on their subscription level.

### Key Components

- **Subscription Service**: Manages subscription lifecycle (creation, updates, cancellation)
- **Subscription Portal**: User interface for subscription management
- **Pricing Page**: Displays available plans and pricing options

### Usage

#### Creating a Subscription

```javascript
// Backend
const subscriptionService = require('../src/billing/services/subscription.service');

const subscription = await subscriptionService.createSubscription({
  userId: 'user_id',
  tenantId: 'tenant_id',
  planId: 'pro_monthly',
  paymentMethodId: 'pm_123456'
});
```

#### Frontend Integration

```jsx
// React component example
import { useSubscription } from '../hooks/useSubscription';

function SubscriptionManager() {
  const { subscription, createSubscription, cancelSubscription } = useSubscription();
  
  // Component implementation
}
```

## Payment Processing

### Overview

The payment processing system handles secure payment collection, payment method management, and integration with Stripe for payment processing.

### Key Components

- **Payment Service**: Handles payment intents, payment methods, and Stripe integration
- **Payment Controller**: API endpoints for payment operations
- **Payment Method Management**: Add, update, and remove payment methods

### Usage

#### Creating a Payment Intent

```javascript
// Backend
const paymentService = require('../src/billing/services/payment.service');

const paymentIntent = await paymentService.createPaymentIntent({
  amount: 2000, // $20.00
  currency: 'usd',
  customerId: 'cus_123456',
  paymentMethodId: 'pm_123456'
});
```

#### Adding a Payment Method

```javascript
// Backend
const paymentMethod = await paymentService.addPaymentMethod({
  userId: 'user_id',
  tenantId: 'tenant_id',
  paymentMethodId: 'pm_123456',
  isDefault: true
});
```

## Feature Gating

### Overview

The feature gating system controls access to features based on subscription tier, ensuring users can only access features included in their subscription plan.

### Key Components

- **Feature Access Service**: Determines feature access based on subscription
- **Feature Access Middleware**: Enforces access control at the API level

### Usage

#### Checking Feature Access

```javascript
// Backend
const featureAccessService = require('../src/billing/services/feature-access.service');

const hasAccess = await featureAccessService.checkFeatureAccess({
  tenantId: 'tenant_id',
  featureKey: 'advanced_analytics'
});

if (hasAccess) {
  // Allow feature access
} else {
  // Deny access or show upgrade prompt
}
```

#### Using Feature Access Middleware

```javascript
// Route definition
const featureAccessMiddleware = require('../src/middleware/feature-access.middleware');

router.get('/api/advanced-analytics',
  featureAccessMiddleware('advanced_analytics'),
  analyticsController.getAdvancedAnalytics
);
```

## Free Trial Mechanism

### Overview

The free trial mechanism allows users to try premium features for a limited time before committing to a paid subscription.

### Key Components

- **Trial Service**: Manages trial creation, validation, and conversion
- **Trial Controller**: API endpoints for trial operations

### Usage

#### Starting a Free Trial

```javascript
// Backend
const trialService = require('../src/billing/services/trial.service');

const trial = await trialService.startTrial({
  userId: 'user_id',
  tenantId: 'tenant_id',
  planId: 'pro_monthly',
  durationDays: 14
});
```

#### Converting a Trial to Paid Subscription

```javascript
// Backend
const subscription = await trialService.convertTrialToSubscription({
  trialId: 'trial_id',
  paymentMethodId: 'pm_123456'
});
```

## Coupon and Promotion System

### Overview

The coupon system allows for discounts and promotions to be applied to subscriptions, supporting percentage and fixed-amount discounts.

### Key Components

- **Coupon Service**: Manages coupon creation, validation, and application
- **Coupon Controller**: API endpoints for coupon operations

### Usage

#### Creating a Coupon

```javascript
// Backend (admin only)
const couponService = require('../src/billing/services/coupon.service');

const coupon = await couponService.createCoupon({
  code: 'WELCOME25',
  type: 'percentage',
  value: 25,
  description: '25% off for new users',
  duration: 'once',
  expiresAt: new Date('2025-12-31')
});
```

#### Applying a Coupon

```javascript
// Backend
const result = await couponService.applyCoupon({
  subscriptionId: 'sub_123456',
  couponCode: 'WELCOME25'
});
```

## Multi-Currency Support

### Overview

Multi-currency support allows for pricing and payments in different currencies, with automatic conversion and formatting.

### Key Components

- **Currency Service**: Handles currency conversion and formatting
- **Currency Controller**: API endpoints for currency operations

### Usage

#### Converting Currency

```javascript
// Backend
const currencyService = require('../src/billing/services/currency.service');

const convertedAmount = await currencyService.convert({
  amount: 2000,
  fromCurrency: 'USD',
  toCurrency: 'EUR'
});
```

#### Formatting Currency

```javascript
// Backend
const formattedAmount = currencyService.format({
  amount: 2000,
  currency: 'USD',
  locale: 'en-US'
}); // Returns "$20.00"
```

## Analytics and Reporting

### Overview

The analytics and reporting system provides insights into subscription metrics, user behavior, and revenue performance.

### Key Components

- **Analytics Service**: Collects and processes analytics data
- **Analytics Dashboard**: Visual representation of key metrics
- **Reporting Tools**: Generate reports on subscription and revenue data

### Usage

#### Getting Subscription Analytics

```javascript
// Backend
const analyticsService = require('../src/analytics/services/analytics.service');

const subscriptionAnalytics = await analyticsService.getSubscriptionAnalytics({
  tenantId: 'tenant_id',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-06-30')
});
```

#### Tracking Events

```javascript
// Backend
await analyticsService.trackEvent({
  tenantId: 'tenant_id',
  userId: 'user_id',
  eventType: 'subscription_created',
  eventData: { planId: 'pro_monthly', amount: 2000 }
});
```

## Data Export

### Overview

The data export functionality allows users to export analytics and subscription data in various formats (CSV, JSON, Excel).

### Key Components

- **Data Exporter**: Handles data export in different formats
- **Export Controller**: API endpoints for data export operations

### Usage

#### Exporting Data to CSV

```javascript
// Backend
const dataExporter = require('../src/analytics/utils/data-exporter');

const csvFilePath = await dataExporter.exportEventsToCSV({
  tenantId: 'tenant_id',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-06-30'),
  outputDir: '/tmp/exports'
});
```

#### Exporting Data to Excel

```javascript
// Backend
const excelFilePath = await dataExporter.exportAnalyticsToExcel({
  tenantId: 'tenant_id',
  analyticsData: analyticsData,
  outputDir: '/tmp/exports'
});
```

## Error Handling

### Overview

The error handling system provides consistent error responses for payment and subscription-related errors, with user-friendly messages and recovery suggestions.

### Key Components

- **Payment Error Handler**: Standardizes payment error responses
- **Payment Error Middleware**: Processes payment errors in API requests

### Usage

#### Using Payment Error Middleware

```javascript
// Express app setup
const paymentErrorMiddleware = require('../src/middleware/payment-error.middleware');

// Add middleware to Express error handling chain
app.use(paymentErrorMiddleware);
```

#### Creating a Payment Error

```javascript
// Backend
const { createPaymentError } = require('../src/billing/utils/payment-error-handler');

const error = createPaymentError({
  message: 'Payment failed',
  code: 'card_declined',
  suggestion: 'Please try another card or contact your bank'
});

throw error; // Will be caught by payment error middleware
```

## Integration Guide

### Backend Integration

1. **Setup Stripe Integration**:
   - Configure Stripe API keys in environment variables
   - Initialize Stripe client in your application

2. **Configure Database Models**:
   - Ensure subscription, payment, and customer models are properly set up
   - Run database migrations if needed

3. **Set Up API Routes**:
   - Import and use billing routes in your main Express app
   - Apply authentication and authorization middleware

### Frontend Integration

1. **Install Dependencies**:
   - Add Stripe.js to your frontend application
   - Install required UI components

2. **Implement UI Components**:
   - Add subscription portal component
   - Implement pricing page
   - Create payment form components

3. **Connect to Backend API**:
   - Set up API client for billing endpoints
   - Implement error handling for payment failures

### Testing Your Integration

1. **Use Test Mode**:
   - Use Stripe test mode for development and testing
   - Use test card numbers provided by Stripe

2. **Run Integration Tests**:
   - Execute the subscription flow test
   - Test payment error handling
   - Validate feature access controls

3. **Validate with Script**:
   - Run the monetization features validation script
   - Address any issues identified by the script

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Payment Integration Best Practices](https://stripe.com/docs/payments/best-practices)
- [Subscription Billing Guide](https://stripe.com/docs/billing/subscriptions/overview)
