# Payment Monitoring and Alerting System

## Overview

The Payment Monitoring and Alerting System provides comprehensive visibility into payment processing operations, automatically detects payment failures, and sends timely alerts to administrators. This system is a critical component of the monetization MVP, ensuring high payment success rates and rapid response to payment issues.

## Key Features

- **Real-time Payment Monitoring**: Track payment attempts, successes, and failures in real-time
- **Configurable Alert Thresholds**: Set custom thresholds for payment failure rates, consecutive failures, and critical amounts
- **Tenant-specific Monitoring**: View payment health metrics for individual tenants
- **System-wide Health Dashboard**: Get an overview of the entire payment system's health
- **Automatic Failure Detection**: Automatically detect payment issues based on configurable thresholds
- **Email Alerts**: Receive email notifications when payment issues are detected
- **Manual Recovery Tools**: Trigger manual payment recovery attempts for failed payments
- **Payment Failure History**: View detailed history of payment failures for analysis

## Architecture

The Payment Monitoring System consists of the following components:

1. **Payment Monitoring Service**: Core service that tracks payment attempts and detects issues
2. **Payment Monitoring Controller**: API endpoints for accessing monitoring data
3. **Payment Monitoring Routes**: Route definitions for the monitoring API
4. **Prometheus Metrics**: Custom metrics for tracking payment health
5. **Alert System**: Email notification system for payment issues

## API Endpoints

### System-wide Monitoring

```
GET /api/billing/monitoring/system
```

Returns system-wide payment health metrics including:
- Daily payment attempts and failures
- Daily failure rate
- Active subscriptions count
- Tenants with active failures
- Overall system health status

**Access**: Admin only

### Tenant-specific Monitoring

```
GET /api/billing/monitoring/tenant/:tenantId
```

Returns payment health metrics for a specific tenant including:
- Daily and weekly payment attempts and failures
- Daily and weekly failure rates
- Current failures (if any)
- Subscription status

**Access**: Tenant admin, System admin

### Payment Failure History

```
GET /api/billing/monitoring/tenant/:tenantId/failures
```

Returns paginated history of payment failures for a tenant with optional date filtering.

**Query Parameters**:
- `startDate`: Start date for filtering (default: 30 days ago)
- `endDate`: End date for filtering (default: current date)
- `limit`: Number of results per page (default: 20)
- `page`: Page number (default: 1)

**Access**: Tenant admin, System admin

### Update Alert Thresholds

```
PUT /api/billing/monitoring/thresholds
```

Updates the alert thresholds for payment monitoring.

**Request Body**:
```json
{
  "failureRate": 10,
  "consecutiveFailures": 3,
  "recoveryTimeout": 86400000,
  "criticalAmount": 1000
}
```

**Access**: Admin only

### Trigger Payment Recovery

```
POST /api/billing/monitoring/recovery
```

Manually triggers a payment recovery attempt for a failed payment.

**Request Body**:
```json
{
  "tenantId": "tenant_id",
  "subscriptionId": "subscription_id"
}
```

**Access**: Admin only

## Alert Thresholds

The system uses the following configurable thresholds for generating alerts:

1. **Failure Rate**: Percentage of failed payments (default: 10%)
2. **Consecutive Failures**: Number of consecutive failures for a tenant (default: 3)
3. **Recovery Timeout**: Time window for payment recovery attempts (default: 24 hours)
4. **Critical Amount**: Dollar amount threshold for high-priority alerts (default: $1000)

## Metrics

The system tracks the following Prometheus metrics:

1. **payment_failures_total**: Counter for payment failures by tenant, error type, and payment method
2. **payment_recoveries_total**: Counter for successful payment recoveries by tenant and retry count
3. **payment_processing_duration_ms**: Histogram for payment processing duration
4. **subscription_status**: Gauge for subscription status by tenant and plan

## Alert Emails

When payment issues are detected, the system sends email alerts to configured recipients. The email includes:

1. Tenant name and ID
2. Reason for the alert
3. Failure details (count, amount, timestamps)
4. Subscription information
5. Link to the admin dashboard for the affected tenant

## Integration with Admin Dashboard

The Payment Monitoring System integrates with the Admin Dashboard, providing:

1. **Payment Health Widget**: Shows overall payment system health
2. **Tenant Payment Status**: Displays payment status for each tenant
3. **Failure Alerts**: Shows active payment failure alerts
4. **Recovery Tools**: Provides tools for manual payment recovery

## Best Practices

1. **Regular Monitoring**: Check the payment health dashboard daily
2. **Alert Configuration**: Adjust alert thresholds based on business requirements
3. **Rapid Response**: Address payment failure alerts within 1 business day
4. **Root Cause Analysis**: Investigate recurring payment failures to identify patterns
5. **Customer Communication**: Proactively communicate with customers about payment issues

## Troubleshooting

### Common Issues and Solutions

1. **High Failure Rate**
   - Check for issues with the payment gateway
   - Verify customer payment methods are valid
   - Look for patterns in error types

2. **Alert Storms**
   - Adjust alert thresholds to reduce noise
   - Use the cooldown period to prevent duplicate alerts

3. **Missing Alerts**
   - Verify email configuration
   - Check alert threshold settings
   - Ensure monitoring service is running

## Security Considerations

1. Payment monitoring data is protected by role-based access control
2. Tenant isolation ensures that tenants can only see their own payment data
3. All API endpoints require authentication
4. Sensitive payment data is never exposed in monitoring metrics

## Future Enhancements

1. **Advanced Analytics**: Predictive analytics for payment failure risk
2. **Custom Alert Channels**: Support for Slack, SMS, and other notification channels
3. **Tenant-specific Thresholds**: Allow different alert thresholds per tenant
4. **Automated Recovery Rules**: Configure automated recovery strategies based on failure types
