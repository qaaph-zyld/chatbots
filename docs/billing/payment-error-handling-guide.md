# Payment Error Handling Guide

## Overview

This guide provides comprehensive documentation for handling payment errors in the Customizable Chatbots platform. It covers common error scenarios, troubleshooting steps, and best practices for implementing robust payment error handling.

## Table of Contents

1. [Common Payment Errors](#common-payment-errors)
2. [Error Handling Architecture](#error-handling-architecture)
3. [Implementing Error Handlers](#implementing-error-handlers)
4. [User Communication](#user-communication)
5. [Recovery Strategies](#recovery-strategies)
6. [Testing Error Scenarios](#testing-error-scenarios)
7. [Monitoring and Alerts](#monitoring-and-alerts)

## Common Payment Errors

### Card Errors

| Error Code | Description | Suggested Action |
|------------|-------------|------------------|
| `card_declined` | The card was declined | Suggest trying another card or contacting the bank |
| `insufficient_funds` | The card has insufficient funds | Suggest using another payment method |
| `expired_card` | The card has expired | Prompt to update card information |
| `incorrect_cvc` | The CVC code is incorrect | Ask to verify and re-enter CVC |
| `invalid_card_number` | The card number is invalid | Ask to check and re-enter card details |

### Authentication Errors

| Error Code | Description | Suggested Action |
|------------|-------------|------------------|
| `authentication_required` | 3D Secure authentication required | Redirect to 3D Secure flow |
| `card_not_supported` | Card doesn't support this type of purchase | Suggest using a different card |

### Processing Errors

| Error Code | Description | Suggested Action |
|------------|-------------|------------------|
| `processing_error` | An error occurred while processing the card | Suggest trying again later |
| `rate_limit` | Too many requests made to the API | Implement exponential backoff |

## Error Handling Architecture

Our payment error handling system consists of several components working together:

1. **Payment Error Handler Utility**: Standardizes error objects and provides helper methods
2. **Payment Error Middleware**: Catches and processes payment errors in API requests
3. **Error Logging Service**: Records errors for monitoring and analysis
4. **Notification System**: Alerts users and administrators about payment issues

### Flow Diagram

```
API Request → Controller → Payment Service → Stripe API
                                   ↓
                              Error occurs
                                   ↓
Payment Error Handler → Payment Error Middleware → Standardized Error Response
       ↓                            ↓
Error Logging                 User Notification
```

## Implementing Error Handlers

### Payment Error Handler

The `payment-error-handler.js` utility provides methods for creating standardized payment error objects:

```javascript
const { createPaymentError, isPaymentError, getErrorDetails } = require('../billing/utils/payment-error-handler');

// Create a payment error
const error = createPaymentError({
  message: 'Your card was declined',
  code: 'card_declined',
  statusCode: 400,
  suggestion: 'Please try another card or contact your bank',
  details: { declineCode: 'insufficient_funds' }
});

// Check if an error is a payment error
if (isPaymentError(error)) {
  // Handle payment error
}

// Get detailed information about an error
const errorDetails = getErrorDetails(error);
```

### Payment Error Middleware

The `payment-error.middleware.js` catches payment errors and returns standardized responses:

```javascript
const paymentErrorMiddleware = require('../middleware/payment-error.middleware');

// Add to Express error handling chain
app.use(paymentErrorMiddleware);

// With logging enabled
app.use(paymentErrorMiddleware.withLogging);
```

## User Communication

### Error Messages

When communicating payment errors to users, follow these guidelines:

1. **Be clear and specific**: Explain what went wrong in simple terms
2. **Provide actionable guidance**: Tell users what they can do to resolve the issue
3. **Maintain brand voice**: Keep messages consistent with your overall tone
4. **Avoid technical jargon**: Use language that non-technical users can understand

### Example Error Messages

| Scenario | Good Message | Poor Message |
|----------|--------------|--------------|
| Card declined | "Your card was declined. Please try another card or contact your bank for assistance." | "Error: card_declined" |
| Expired card | "The card you provided has expired. Please update your card information to continue." | "Payment failed due to card expiration" |
| Processing error | "We're having trouble processing your payment right now. Please try again in a few minutes." | "Processing error occurred" |

### Notification Templates

We provide HTML email templates for different payment scenarios:

- `payment-failed.html`: Sent when a payment attempt fails
- `payment-recovered.html`: Sent when a previously failed payment succeeds
- `subscription-canceled.html`: Sent when a subscription is canceled due to payment failures

## Recovery Strategies

### Dunning Management

Our dunning management system automatically handles payment recovery:

1. **Retry Schedule**: Configurable schedule for retrying failed payments
2. **Smart Retries**: Intelligent retry timing based on failure reason
3. **Communication**: Automated emails at key points in the recovery process
4. **Grace Period**: Configurable grace period before subscription cancellation

### Implementation Example

```javascript
const dunningService = require('../billing/services/dunning.service');

// Configure dunning for a subscription
await dunningService.configureDunning({
  subscriptionId: 'sub_123456',
  retrySchedule: [3, 5, 7], // Days to retry
  gracePeriod: 14, // Days before cancellation
  notifyUser: true
});

// Manually trigger payment retry
await dunningService.retryPayment({
  subscriptionId: 'sub_123456',
  paymentMethodId: 'pm_123456' // Optional new payment method
});
```

## Testing Error Scenarios

### Stripe Test Cards

Use these Stripe test cards to simulate different error scenarios:

| Card Number | Scenario |
|-------------|----------|
| 4000000000000002 | Card declined |
| 4000000000009995 | Insufficient funds |
| 4000000000000069 | Expired card |
| 4000000000000101 | Invalid CVC |
| 4000000000000119 | Processing error |
| 4000002500003155 | 3D Secure required |

### Integration Tests

We provide integration tests that simulate various payment error scenarios:

```javascript
// Run payment error handling tests
npm run test:integration:billing:payment-errors
```

See `tests/integration/billing/payment-error-handling.test.js` for implementation details.

## Monitoring and Alerts

### Error Logging

All payment errors are logged with detailed information:

```javascript
// Example log entry
{
  level: 'error',
  message: 'Payment error: card_declined',
  timestamp: '2025-07-01T05:30:00Z',
  data: {
    code: 'card_declined',
    userId: '60d21b4667d0d8992e610c81',
    tenantId: '60d21b4667d0d8992e610c80',
    subscriptionId: 'sub_123456',
    amount: 2000,
    currency: 'usd',
    declineCode: 'insufficient_funds'
  }
}
```

### Alert Thresholds

Configure alerts for these payment error scenarios:

1. **High error rate**: More than 10% of payment attempts failing
2. **Critical errors**: Processing errors or API issues
3. **Recovery failures**: Multiple failed retry attempts
4. **Subscription cancellations**: Subscriptions canceled due to payment failures

### Dashboard Integration

The Analytics Dashboard includes a Payment Health section that displays:

- Payment success rate over time
- Common error types
- Recovery success rate
- Subscription churn due to payment failures

## Best Practices

1. **Graceful degradation**: Allow users to continue using the service during the grace period
2. **Clear communication**: Keep users informed about payment issues and recovery steps
3. **Multiple payment options**: Offer alternative payment methods
4. **Proactive notifications**: Alert users before cards expire or when retries are scheduled
5. **Comprehensive logging**: Log all payment events for troubleshooting and analysis
6. **Regular testing**: Periodically test error handling with Stripe test cards
7. **User feedback**: Collect feedback on payment error messages to improve clarity

## Additional Resources

- [Stripe Error Handling Documentation](https://stripe.com/docs/error-handling)
- [Payment Recovery Best Practices](https://stripe.com/docs/billing/subscriptions/billing-cycle)
- [Dunning Management Guide](https://stripe.com/docs/billing/subscriptions/overview#dunning-management)
