# Payment Error Handling Guide

This guide provides detailed information on how payment errors are handled in the Customizable Chatbots platform, including common error types, error handling strategies, and best practices for resolving payment issues.

## Table of Contents

1. [Overview](#overview)
2. [Common Payment Error Types](#common-payment-error-types)
3. [Error Handling Architecture](#error-handling-architecture)
4. [Error Response Format](#error-response-format)
5. [Error Recovery Strategies](#error-recovery-strategies)
6. [Dunning Management](#dunning-management)
7. [User Communication](#user-communication)
8. [Testing Payment Errors](#testing-payment-errors)
9. [Troubleshooting Guide](#troubleshooting-guide)

## Overview

The payment error handling system is designed to:

1. Detect and categorize payment errors
2. Provide clear error messages to users
3. Implement recovery strategies for failed payments
4. Track and analyze payment failure patterns
5. Minimize revenue loss due to payment failures

## Common Payment Error Types

### Card Errors

| Error Code | Description | Suggested Action |
|------------|-------------|------------------|
| `card_declined` | The card was declined by the issuer | Try another payment method or contact your bank |
| `insufficient_funds` | The card has insufficient funds | Add funds to your account or try another payment method |
| `expired_card` | The card has expired | Update your card information with a valid expiration date |
| `incorrect_cvc` | The CVC code is incorrect | Check and re-enter the CVC code |
| `invalid_card_number` | The card number is invalid | Check and re-enter your card number |
| `processing_error` | Error processing the card | Try again later or use a different payment method |

### Authentication Errors

| Error Code | Description | Suggested Action |
|------------|-------------|------------------|
| `authentication_required` | 3D Secure authentication required | Complete the authentication process |
| `authentication_failed` | 3D Secure authentication failed | Try again or use a different payment method |

### Customer Errors

| Error Code | Description | Suggested Action |
|------------|-------------|------------------|
| `customer_not_found` | Customer record not found | Contact support for assistance |
| `payment_method_not_found` | Payment method not found | Add a new payment method |

### System Errors

| Error Code | Description | Suggested Action |
|------------|-------------|------------------|
| `api_connection_error` | Connection to payment gateway failed | Try again later |
| `api_error` | Payment gateway API error | Try again later or contact support |
| `rate_limit_error` | Too many requests to payment gateway | Try again later |
| `internal_server_error` | Internal server error | Contact support for assistance |

## Error Handling Architecture

The payment error handling system consists of the following components:

### 1. Payment Error Handler Utility

Located at `src/billing/utils/payment-error-handler.js`, this utility provides functions for detecting, categorizing, and handling payment errors.

```javascript
// Example usage of payment error handler
const errorHandler = require('../utils/payment-error-handler');

try {
  // Payment operation
  await paymentService.processPayment(paymentData);
} catch (error) {
  const handledError = errorHandler.handlePaymentError(error);
  
  // Log error for monitoring
  logger.error('Payment error', {
    errorCode: handledError.code,
    errorMessage: handledError.message,
    originalError: error
  });
  
  // Return error response
  return {
    success: false,
    error: handledError.message,
    code: handledError.code,
    suggestion: handledError.suggestion
  };
}
```

### 2. Payment Error Middleware

Located at `src/billing/middleware/payment-error.middleware.js`, this middleware intercepts payment errors in API routes and formats appropriate responses.

```javascript
// Example payment error middleware
const paymentErrorMiddleware = (err, req, res, next) => {
  if (err.isPaymentError) {
    return res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
      code: err.code,
      suggestion: err.suggestion
    });
  }
  
  next(err);
};
```

### 3. Dunning Management Service

Located at `src/billing/services/dunning.service.js`, this service manages payment retry attempts and recovery strategies for failed payments.

## Error Response Format

Payment error responses follow a consistent format:

```json
{
  "success": false,
  "error": "Your payment was declined. Please check your card details or try another payment method.",
  "code": "card_declined",
  "suggestion": "Try using a different card or contact your bank to authorize this payment."
}
```

### Response Fields

- `success`: Boolean indicating if the operation was successful (always `false` for errors)
- `error`: Human-readable error message
- `code`: Error code for programmatic handling
- `suggestion`: Suggested action to resolve the issue
- `details`: (Optional) Additional error details

## Error Recovery Strategies

### Immediate Recovery

1. **Retry with Exponential Backoff**: Automatically retry failed payments with increasing intervals
2. **Alternative Payment Method**: Prompt user to use an alternative payment method
3. **Update Payment Information**: Request updated payment information

### Delayed Recovery (Dunning)

1. **Email Notifications**: Send email reminders about failed payments
2. **Grace Period**: Provide a grace period before subscription cancellation
3. **Automatic Retries**: Schedule automatic payment retry attempts
4. **Account Restrictions**: Apply feature restrictions during payment recovery

## Dunning Management

The dunning management system handles the process of communicating with customers about failed payments and attempting to recover revenue.

### Dunning Schedule

| Day | Action |
|-----|--------|
| 0 | Initial payment failure, immediate retry |
| 1 | First email notification |
| 3 | Second payment retry attempt |
| 5 | Second email notification |
| 7 | Third payment retry attempt |
| 10 | Final email notification |
| 14 | Subscription cancellation or downgrade |

### Dunning Configuration

Dunning settings can be configured in the `dunning.config.js` file:

```javascript
// Example dunning configuration
module.exports = {
  retrySchedule: [0, 3, 7], // Days after initial failure
  notificationSchedule: [1, 5, 10], // Days after initial failure
  gracePeriod: 14, // Days before cancellation
  maxRetryAttempts: 3
};
```

## User Communication

### Email Templates

Email templates for payment failure notifications are located in `src/billing/templates/emails/`:

1. `payment-failed.html`: Initial payment failure notification
2. `payment-retry-failed.html`: Notification after retry attempt fails
3. `payment-recovery-success.html`: Notification after successful payment recovery
4. `subscription-cancellation.html`: Notification of subscription cancellation

### In-App Notifications

In-app notifications for payment issues are managed by the notification service:

```javascript
// Example of sending an in-app payment notification
const notificationService = require('../../notifications/services/notification.service');

await notificationService.sendNotification({
  userId: user.id,
  type: 'payment_failed',
  title: 'Payment Failed',
  message: 'Your recent payment for subscription renewal failed.',
  actionUrl: '/account/billing/payment-methods',
  priority: 'high'
});
```

## Testing Payment Errors

### Stripe Test Cards

Use these test cards to simulate different payment error scenarios:

| Card Number | Error Scenario |
|-------------|----------------|
| 4000000000000002 | Card declined |
| 4000000000009995 | Insufficient funds |
| 4000000000000069 | Expired card |
| 4000000000000127 | Incorrect CVC |
| 4000000000000101 | Generic decline |
| 4000008400001629 | Authentication required |

### Testing with the Payment Error Simulator

The payment error simulator allows you to test error handling without making actual payment attempts:

```javascript
// Example of using the payment error simulator
const errorSimulator = require('../utils/payment-error-simulator');

// Simulate a card declined error
const simulatedError = errorSimulator.simulateError('card_declined');

// Test error handling
const handledError = errorHandler.handlePaymentError(simulatedError);
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. High Payment Failure Rate

**Symptoms:**
- Unusually high number of payment failures
- Multiple failures with the same error code

**Possible Causes:**
- Incorrect payment form validation
- Issues with payment gateway integration
- Regional banking restrictions

**Solutions:**
- Review client-side validation logic
- Check payment gateway configuration
- Analyze error patterns by region or card type

#### 2. Failed Dunning Recovery

**Symptoms:**
- Low recovery rate from dunning process
- Users not responding to payment failure notifications

**Possible Causes:**
- Unclear communication in notifications
- Too aggressive or too passive retry schedule
- Outdated contact information

**Solutions:**
- Improve notification clarity and call-to-action
- Adjust dunning schedule based on recovery analytics
- Implement contact information verification

#### 3. Unexpected Subscription Cancellations

**Symptoms:**
- Subscriptions being cancelled unexpectedly
- Users reporting service interruption without warning

**Possible Causes:**
- Dunning process ending prematurely
- Grace period configuration issues
- Failed communication about payment status

**Solutions:**
- Review dunning configuration and logs
- Extend grace period if appropriate
- Improve visibility of account status in user dashboard

### Monitoring and Alerts

Set up monitoring and alerts for payment errors:

1. **Error Rate Monitoring**: Alert when payment error rate exceeds threshold
2. **Recovery Rate Monitoring**: Track dunning recovery success rate
3. **Gateway Status**: Monitor payment gateway availability
4. **Unusual Patterns**: Alert on unusual patterns of specific error types

```javascript
// Example monitoring configuration
const monitoringConfig = {
  errorRateThreshold: 0.05, // 5% of payment attempts
  recoveryRateThreshold: 0.4, // 40% recovery expected
  alertChannels: ['email', 'slack'],
  checkInterval: 3600 // Check every hour
};
```

---

## Additional Resources

- [Stripe Error Handling Documentation](https://stripe.com/docs/error-handling)
- [Payment Recovery Best Practices](https://stripe.com/docs/billing/subscriptions/recovery)
- [Dunning Management Guide](https://www.chargebee.com/blog/dunning-management-guide/)
- [Monetization Features Guide](./monetization-features-guide.md)
