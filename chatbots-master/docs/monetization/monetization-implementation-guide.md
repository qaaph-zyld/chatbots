# Monetization Implementation Guide

## Overview

This guide provides detailed information on the monetization features implemented in the Customizable Chatbots platform. It covers the architecture, components, configuration, and usage of the billing system, multi-tenancy, sales process, pricing implementation, and analytics integration.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Billing System](#billing-system)
3. [Multi-Tenancy](#multi-tenancy)
4. [Sales Process](#sales-process)
5. [Pricing Implementation](#pricing-implementation)
6. [Analytics Integration](#analytics-integration)
7. [API Reference](#api-reference)
8. [Configuration Guide](#configuration-guide)
9. [Testing Procedures](#testing-procedures)
10. [Troubleshooting](#troubleshooting)

## System Architecture

The monetization system is built on a modular architecture with clear separation of concerns:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Client Layer   │────▶│   API Layer     │────▶│ Service Layer   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  External APIs  │◀───▶│ Integration Layer│◀───▶│   Data Layer   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Components

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Models**: Define data structures and database schemas
- **Middleware**: Provide authentication, authorization, and request processing
- **Utilities**: Offer helper functions and shared code

## Billing System

The billing system manages subscriptions, payments, and invoices for customers.

### Subscription Model

The subscription model supports:

- Multiple pricing tiers
- Monthly and annual billing cycles
- Trial periods
- Usage-based billing with overages
- Subscription lifecycle management (creation, updates, cancellation)

### Key Files

- `src/billing/models/subscription.model.js`: Defines the subscription schema
- `src/billing/services/billing.service.js`: Implements subscription management logic
- `src/billing/controllers/billing.controller.js`: Exposes subscription API endpoints

### Usage Example

```javascript
// Create a subscription
const subscription = await billingService.createSubscription({
  tenantId: 'tenant123',
  plan: {
    name: 'professional',
    price: 99,
    billingCycle: 'monthly'
  },
  status: 'active',
  billingDetails: {
    name: 'John Doe',
    email: 'john@example.com'
  }
});

// Update subscription
await billingService.updateSubscription(subscription._id, {
  plan: {
    name: 'enterprise',
    price: 499,
    billingCycle: 'annual'
  }
});

// Cancel subscription
await billingService.cancelSubscription(subscription._id);
```

## Multi-Tenancy

The multi-tenancy system provides isolation between different customers and their resources.

### Tenant Model

The tenant model supports:

- Organization details
- Contact information
- API key management
- Resource allocation and limits
- Tenant lifecycle management

### Key Files

- `src/tenancy/models/tenant.model.js`: Defines the tenant schema
- `src/tenancy/services/tenant.service.js`: Implements tenant management logic
- `src/tenancy/controllers/tenant.controller.js`: Exposes tenant API endpoints

### Usage Example

```javascript
// Create a tenant
const tenant = await tenantService.createTenant({
  name: 'Acme Inc',
  organizationDetails: {
    companyName: 'Acme Inc',
    website: 'https://acme.com',
    industry: 'Technology',
    size: '51-200'
  },
  contactDetails: {
    email: 'contact@acme.com',
    phone: '555-123-4567'
  }
});

// Generate API key
const apiKey = await tenantService.generateApiKey(tenant._id, {
  name: 'Production API Key',
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
});

// Validate API key
const isValid = await tenantService.validateApiKey('api_key_string');
```

## Sales Process

The sales process manages leads, opportunities, and the sales pipeline.

### Lead Model

The lead model supports:

- Contact and company information
- Lead source tracking
- Status and stage management
- Notes and activities
- Conversion to customer

### Key Files

- `src/sales/models/lead.model.js`: Defines the lead schema
- `src/sales/services/sales.service.js`: Implements sales process logic
- `src/sales/controllers/sales.controller.js`: Exposes sales API endpoints

### Usage Example

```javascript
// Create a lead
const lead = await salesService.createLead({
  company: {
    name: 'Acme Inc',
    website: 'https://acme.com',
    industry: 'Technology',
    size: '51-200'
  },
  contact: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@acme.com',
    phone: '555-123-4567',
    jobTitle: 'CTO'
  },
  source: 'website',
  status: 'new'
});

// Update lead status
await salesService.updateLeadStatus(lead._id, 'qualified', userId);

// Convert lead to customer
await salesService.convertLeadToCustomer(
  lead._id,
  { name: 'Acme Inc' }, // tenant data
  { plan: { name: 'professional', billingCycle: 'monthly' } }, // subscription data
  userId
);
```

## Pricing Implementation

The pricing implementation manages pricing plans, tiers, and features.

### Pricing Model

The pricing model supports:

- Multiple pricing plans
- Tiered pricing structure
- Feature differentiation
- Usage limits and overages
- Trial periods
- Discount calculations

### Key Files

- `src/billing/models/pricing.model.js`: Defines the pricing schema
- `src/billing/services/pricing.service.js`: Implements pricing logic
- `src/billing/controllers/pricing.controller.js`: Exposes pricing API endpoints

### Usage Example

```javascript
// Get current pricing plan
const plan = await pricingService.getCurrentPricingPlan();

// Calculate price for a subscription
const priceInfo = await pricingService.calculatePrice('professional', 'annual');

// Calculate usage charges
const charges = await pricingService.calculateUsageCharges(tenantId, {
  conversations: 12000,
  knowledgeBaseSize: 1200,
  apiCalls: 15000
});
```

## Analytics Integration

The analytics integration provides insights into revenue, subscriptions, and sales performance.

### Revenue Analytics

The revenue analytics supports:

- Monthly Recurring Revenue (MRR) tracking
- Customer Acquisition Cost (CAC) calculation
- Customer Lifetime Value (LTV) calculation
- Churn rate analysis
- Revenue forecasting
- Subscription metrics

### Key Files

- `src/analytics/services/revenue-analytics.service.js`: Implements revenue analytics logic
- `src/analytics/controllers/revenue-analytics.controller.js`: Exposes revenue analytics API endpoints

### Usage Example

```javascript
// Get revenue dashboard data
const dashboardData = await revenueAnalyticsService.getRevenueDashboardData();

// Get MRR data
const mrrData = await revenueAnalyticsService.getMonthlyRecurringRevenue({
  months: 12
});

// Get churn rate
const churnData = await revenueAnalyticsService.getChurnRate({
  months: 6
});

// Get revenue forecast
const forecastData = await revenueAnalyticsService.getRevenueForecast({
  months: 12,
  growthRate: 0.1
});
```

## API Reference

### Billing API

#### Subscriptions

- `GET /api/billing/subscriptions` - Get all subscriptions
- `GET /api/billing/subscriptions/:id` - Get subscription by ID
- `POST /api/billing/subscriptions` - Create subscription
- `PUT /api/billing/subscriptions/:id` - Update subscription
- `DELETE /api/billing/subscriptions/:id` - Cancel subscription

#### Invoices

- `GET /api/billing/invoices` - Get all invoices
- `GET /api/billing/invoices/:id` - Get invoice by ID
- `POST /api/billing/invoices` - Create invoice
- `PUT /api/billing/invoices/:id` - Update invoice

### Tenancy API

- `GET /api/tenants` - Get all tenants
- `GET /api/tenants/:id` - Get tenant by ID
- `POST /api/tenants` - Create tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant
- `POST /api/tenants/:id/api-keys` - Generate API key
- `GET /api/tenants/:id/api-keys` - Get API keys
- `DELETE /api/tenants/:id/api-keys/:keyId` - Delete API key

### Sales API

- `GET /api/sales/leads` - Get all leads
- `GET /api/sales/leads/:id` - Get lead by ID
- `POST /api/sales/leads` - Create lead
- `PUT /api/sales/leads/:id` - Update lead
- `PUT /api/sales/leads/:id/status` - Update lead status
- `POST /api/sales/leads/:id/notes` - Add note to lead
- `POST /api/sales/leads/:id/activities` - Add activity to lead
- `POST /api/sales/leads/:id/convert` - Convert lead to customer
- `GET /api/sales/pipeline` - Get sales pipeline data
- `GET /api/sales/forecast` - Get sales forecast
- `GET /api/sales/dashboard` - Get sales dashboard data

### Pricing API

- `GET /api/pricing/public` - Get public pricing information
- `GET /api/pricing/calculate` - Calculate price for a subscription
- `GET /api/pricing/plans` - Get all pricing plans
- `GET /api/pricing/plans/:id` - Get pricing plan by ID
- `POST /api/pricing/plans` - Create pricing plan
- `PUT /api/pricing/plans/:id` - Update pricing plan
- `POST /api/pricing/plans/:id/tiers` - Add tier to pricing plan
- `PUT /api/pricing/plans/:id/tiers/:tierId` - Update tier in pricing plan
- `DELETE /api/pricing/plans/:id/tiers/:tierId` - Remove tier from pricing plan
- `POST /api/pricing/usage` - Calculate usage charges
- `POST /api/pricing/initialize` - Initialize default pricing plan

### Analytics API

- `GET /api/analytics/revenue/dashboard` - Get revenue dashboard data
- `GET /api/analytics/revenue/mrr` - Get MRR data
- `GET /api/analytics/revenue/churn` - Get churn rate data
- `GET /api/analytics/revenue/ltv` - Get LTV data
- `GET /api/analytics/revenue/forecast` - Get revenue forecast
- `GET /api/analytics/revenue/subscriptions` - Get subscription metrics
- `GET /api/analytics/revenue/cac` - Get CAC data

## Configuration Guide

### Environment Variables

```
# Billing Configuration
BILLING_CURRENCY=USD
BILLING_DEFAULT_TRIAL_DAYS=14
BILLING_PAYMENT_GATEWAY=stripe

# Stripe Configuration (if using Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Configuration (for invoices and notifications)
EMAIL_FROM=billing@example.com
EMAIL_SMTP_HOST=smtp.example.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=user
EMAIL_SMTP_PASS=password
```

### Default Pricing Plan

The default pricing plan can be initialized using the `/api/pricing/initialize` endpoint. This will create a standard pricing plan with the following tiers:

- **Free**: Basic features, limited usage
- **Starter**: Small business features, moderate usage
- **Professional**: Business features, high usage
- **Enterprise**: Enterprise features, very high usage
- **Custom**: Custom solutions

## Testing Procedures

### Unit Tests

Run unit tests for the monetization components:

```bash
npm test -- --testPathPattern=src/billing
npm test -- --testPathPattern=src/tenancy
npm test -- --testPathPattern=src/sales
npm test -- --testPathPattern=src/analytics
```

### Integration Tests

Run integration tests for the monetization API:

```bash
npm run test:integration -- --testPathPattern=billing
npm run test:integration -- --testPathPattern=tenancy
npm run test:integration -- --testPathPattern=sales
npm run test:integration -- --testPathPattern=analytics
```

### End-to-End Tests

Run end-to-end tests for the subscription lifecycle:

```bash
npm run test:e2e -- --testPathPattern=subscription-lifecycle
```

## Troubleshooting

### Common Issues

#### Subscription Creation Fails

- Check that the pricing tier exists in the current pricing plan
- Verify that the tenant exists and is active
- Ensure that billing details are complete

#### API Key Validation Fails

- Check that the API key has not expired
- Verify that the tenant is active
- Ensure that the API key has not been revoked

#### Revenue Analytics Shows No Data

- Check that there are active subscriptions in the system
- Verify that the date range for the analytics query is correct
- Ensure that the MongoDB aggregation pipeline is working correctly

### Logging

The monetization system uses structured logging for troubleshooting:

```javascript
// Example log output
{
  "level": "error",
  "message": "Failed to create subscription",
  "timestamp": "2025-06-30T09:46:58+02:00",
  "service": "billing-service",
  "error": "Pricing tier 'enterprise' not found",
  "tenantId": "tenant123",
  "requestId": "req-456"
}
```

### Support

For additional support with the monetization system, contact:

- Technical Support: tech-support@example.com
- Billing Support: billing-support@example.com
