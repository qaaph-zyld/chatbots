# Payment Recovery System Guide

## Overview

The Payment Recovery System is designed to handle failed payments gracefully, providing automatic retry mechanisms, customer communication, and subscription lifecycle management during payment failures. This system helps maximize revenue retention by recovering failed payments that would otherwise result in subscription cancellations.

## Key Features

- **Automated Payment Retry**: Configurable retry schedule with exponential backoff
- **Customer Communication**: Automated emails for payment retry notifications, successful recoveries, and final notices
- **Grace Period Management**: Configurable grace period for subscriptions with failed payments
- **Recovery Analytics**: Detailed statistics on recovery attempts and success rates
- **Admin Controls**: API endpoints for manual intervention and monitoring

## Architecture

The Payment Recovery System consists of the following components:

1. **Payment Error Handler**: Standardizes error responses from payment providers
2. **Payment Recovery Service**: Core business logic for retry scheduling and processing
3. **Payment Attempt Model**: Data model for tracking retry attempts
4. **Payment Recovery Controller**: API endpoints for interacting with the recovery system
5. **Payment Retry Scheduler**: Cron job for automatic processing of scheduled retries
6. **Email Notifications**: Templates for customer communication

## Configuration

The Payment Recovery System can be configured through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PAYMENT_RETRY_CRON` | Cron schedule for retry processing | `0 * * * *` (hourly) |
| `ENABLE_PAYMENT_RETRY_SCHEDULER` | Enable/disable the scheduler | `true` |
| `RUN_PAYMENT_RETRY_ON_STARTUP` | Run retry processing on application startup | `false` |
| `PAYMENT_RETRY_MAX_ATTEMPTS` | Maximum number of retry attempts | `4` |
| `PAYMENT_GRACE_PERIOD_DAYS` | Grace period duration in days | `7` |

## Retry Schedule

The default retry schedule follows an exponential backoff pattern:

1. First retry: 1 hour after failure
2. Second retry: 24 hours (1 day) after failure
3. Third retry: 72 hours (3 days) after failure
4. Fourth retry: 168 hours (7 days) after failure

After all retry attempts are exhausted, the subscription enters a grace period before being suspended.

## API Endpoints

### Schedule a Payment Retry

```
POST /api/billing/payment-recovery/retry
```

**Request Body:**
```json
{
  "subscriptionId": "60a1b2c3d4e5f6g7h8i9j0k1",
  "invoiceId": "in_1234567890",
  "paymentError": {
    "success": false,
    "error": {
      "type": "card_error",
      "code": "card_declined",
      "message": "Your card was declined. Please try a different payment method.",
      "technical": "The card was declined",
      "operation": "create_invoice"
    }
  }
}
```

**Response:**
```json
{
  "message": "Payment retry scheduled successfully",
  "retry": {
    "subscriptionId": "60a1b2c3d4e5f6g7h8i9j0k1",
    "invoiceId": "in_1234567890",
    "attemptNumber": 1,
    "retryDate": "2025-07-01T18:30:00.000Z",
    "status": "scheduled"
  }
}
```

### Process Scheduled Retries (Admin Only)

```
POST /api/billing/admin/payment-recovery/process-retries
```

**Response:**
```json
{
  "message": "Processed 3 payment retry attempts",
  "results": [
    {
      "attemptId": "60a1b2c3d4e5f6g7h8i9j0k1",
      "subscriptionId": "60a1b2c3d4e5f6g7h8i9j0k1",
      "status": "succeeded",
      "invoiceId": "in_1234567890"
    },
    {
      "attemptId": "60a1b2c3d4e5f6g7h8i9j0k1",
      "subscriptionId": "60a1b2c3d4e5f6g7h8i9j0k1",
      "status": "failed",
      "error": "card_declined"
    }
  ]
}
```

### Handle Recovered Payment (Admin Only)

```
POST /api/billing/admin/payment-recovery/recovered
```

**Request Body:**
```json
{
  "subscriptionId": "60a1b2c3d4e5f6g7h8i9j0k1",
  "invoiceId": "in_1234567890"
}
```

**Response:**
```json
{
  "message": "Payment recovery processed successfully",
  "subscription": {
    "_id": "60a1b2c3d4e5f6g7h8i9j0k1",
    "status": "active",
    "planName": "Premium Plan",
    "currentPeriodEnd": "2025-08-01T00:00:00.000Z"
  }
}
```

### Get Recovery Statistics

```
GET /api/billing/payment-recovery/stats/:subscriptionId
```

**Response:**
```json
{
  "stats": {
    "subscriptionId": "60a1b2c3d4e5f6g7h8i9j0k1",
    "totalAttempts": 3,
    "successfulAttempts": 1,
    "failedAttempts": 1,
    "pendingAttempts": 1,
    "recoveryRate": 33.33,
    "invoiceCount": 2,
    "mostCommonErrors": [
      {
        "code": "card_declined",
        "count": 1
      }
    ],
    "lastAttempt": "2025-07-01T15:30:00.000Z"
  }
}
```

## Customer Communication

The Payment Recovery System sends the following email notifications:

1. **Payment Retry Email**: Sent when a payment fails and a retry is scheduled
2. **Payment Recovered Email**: Sent when a payment is successfully recovered
3. **Payment Final Notice Email**: Sent when all retry attempts are exhausted and the subscription enters the grace period
4. **Subscription Reactivated Email**: Sent when a subscription is reactivated after payment recovery

## Subscription States

During the payment recovery process, a subscription can be in the following states:

1. **Active**: Subscription is active and payments are up-to-date
2. **Past Due**: Payment has failed and is in the retry/grace period
3. **Canceled**: Subscription has been canceled after all recovery attempts failed

## Best Practices

1. **Monitor Recovery Rates**: Regularly review recovery statistics to identify patterns in payment failures
2. **Optimize Retry Schedule**: Adjust the retry schedule based on recovery data
3. **Improve Customer Communication**: Customize email templates to maximize customer response
4. **Implement Dunning Management**: Consider implementing a more sophisticated dunning management system for high-value customers

## Integration with Other Systems

The Payment Recovery System integrates with:

1. **Subscription Lifecycle Service**: For managing subscription state changes
2. **Email Service**: For customer communications
3. **Analytics Service**: For tracking recovery events
4. **Admin Dashboard**: For monitoring and manual intervention

## Troubleshooting

### Common Issues

1. **Retries Not Processing**: Check that the cron job is running correctly
2. **Emails Not Sending**: Verify SMTP configuration and email templates
3. **Recovery Rate Low**: Review most common error types and adjust retry strategy

### Logging

The Payment Recovery System logs all activities with detailed context:

```
[INFO] Starting scheduled payment retry processing
[INFO] Completed payment retry processing in 1200ms {processed: 3, succeeded: 1, failed: 2, duration: 1200}
[ERROR] Error processing payment retries: Network error
```

## Future Enhancements

1. **Smart Retry Timing**: Machine learning-based optimization of retry schedules
2. **Multi-Payment Method Fallback**: Automatically try alternative payment methods
3. **Customizable Recovery Strategies**: Different strategies for different customer segments
4. **Proactive Card Updates**: Integration with card updater services
5. **Recovery Performance Dashboard**: Visual analytics for recovery performance
