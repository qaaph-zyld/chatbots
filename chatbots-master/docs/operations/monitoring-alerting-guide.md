# Monitoring and Alerting System Guide

## Overview

This document provides a comprehensive guide to the monitoring and alerting system implemented in the chatbot platform. The system is designed to track system health, collect metrics, detect issues, and notify administrators when problems occur.

## Components

The monitoring and alerting system consists of the following components:

1. **Health Check Service**: Monitors the health of various system components including database, cache, external services, and system resources.
2. **Monitoring Service**: Collects and stores system metrics at regular intervals.
3. **Alert Service**: Sends notifications when system issues are detected.
4. **Admin Dashboard**: Provides a visual interface for monitoring system health and viewing alerts.

## Health Check Endpoints

The system provides several health check endpoints that can be used by monitoring tools and load balancers:

### Public Endpoints

- `GET /health`: Returns the overall system health status
- `GET /health/liveness`: Simple liveness probe for kubernetes
- `GET /health/readiness`: Readiness probe for kubernetes
- `GET /health/components/:component`: Get health status for a specific component (database, cache, external-services, system-resources)

### Response Format

The health endpoints return responses in the following format:

```json
{
  "status": "healthy", // or "unhealthy"
  "timestamp": "2025-07-05T00:32:38+02:00",
  "components": {
    "database": {
      "status": "healthy",
      "responseTime": "5ms",
      "details": { ... }
    },
    "cache": { ... },
    "externalServices": { ... },
    "systemResources": { ... }
  }
}
```

## Monitoring API

The monitoring API provides access to system metrics:

- `GET /api/monitoring/metrics`: Get recent system metrics
- `GET /api/monitoring/metrics/aggregated`: Get aggregated system metrics
- `GET /api/monitoring/overview`: Get system health overview
- `POST /api/monitoring/collect`: Trigger an immediate metrics collection

### Query Parameters

- `limit`: Maximum number of metrics to return (default: 100)
- `skip`: Number of metrics to skip (for pagination)
- `type`: Filter by metric type (database, cache, external-service, system)
- `component`: Filter by component name
- `status`: Filter by status (healthy, unhealthy)
- `startTime`: Filter by start time (ISO format)
- `endTime`: Filter by end time (ISO format)
- `interval`: Aggregation interval (hour, day, week, month) - only for aggregated metrics

## Alert System

The alert system detects issues and sends notifications through various channels:

### Alert API

- `GET /api/alerts`: Get recent system alerts
- `POST /api/alerts`: Create a new alert
- `PUT /api/alerts/:alertId/acknowledge`: Acknowledge an alert
- `PUT /api/alerts/:alertId/resolve`: Resolve an alert
- `GET /api/alerts/stats`: Get alert statistics

### Alert Levels

- `info`: Informational alerts that don't require immediate action
- `warning`: Warnings that may require attention
- `critical`: Critical issues that require immediate attention

### Notification Channels

The system supports the following notification channels:

1. **Email**: Sends email notifications for warning and critical alerts
2. **Slack**: Sends Slack messages for warning and critical alerts
3. **Webhook**: Sends HTTP requests to a configured webhook URL

## Admin Dashboard

The admin dashboard provides a visual interface for monitoring system health and viewing alerts. It can be accessed at `/admin/monitoring`.

### Dashboard Features

1. **Health Overview**: Shows the current health status of all system components
2. **Metrics Chart**: Displays system metrics over time
3. **Alert List**: Shows recent alerts with their status

## Configuration

The monitoring and alerting system can be configured in the application configuration file:

```javascript
// Example configuration
module.exports = {
  // ... other configuration
  monitoring: {
    collectionFrequency: 60000, // 1 minute
    retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  alerts: {
    email: {
      enabled: true,
      host: 'smtp.example.com',
      port: 587,
      secure: true,
      user: 'alerts@example.com',
      password: 'password',
      from: 'alerts@example.com',
      recipients: ['admin@example.com']
    },
    slack: {
      enabled: true,
      webhookUrl: 'https://hooks.slack.com/services/xxx/yyy/zzz'
    },
    webhook: {
      enabled: true,
      url: 'https://example.com/webhook',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer token'
      },
      levels: ['warning', 'critical']
    }
  }
};
```

## Integration with External Monitoring Tools

The health check endpoints can be integrated with external monitoring tools such as:

1. **Prometheus**: Use the `/health` endpoint as a target for Prometheus scraping
2. **Grafana**: Create dashboards using Prometheus data
3. **Kubernetes**: Use the `/health/liveness` and `/health/readiness` endpoints for pod health checks
4. **AWS CloudWatch**: Set up HTTP health checks to monitor the `/health` endpoint

## Best Practices

1. **Regular Monitoring**: Check the admin dashboard regularly to identify potential issues
2. **Alert Configuration**: Configure alert notifications to ensure the right people are notified
3. **Alert Acknowledgement**: Acknowledge alerts when you start working on them
4. **Alert Resolution**: Resolve alerts once the issue has been fixed
5. **Metric Analysis**: Analyze metrics over time to identify trends and potential issues

## Troubleshooting

### Common Issues

1. **Database Connection Issues**: Check database connectivity and credentials
2. **Cache Connection Issues**: Verify Redis server is running and accessible
3. **External Service Issues**: Check external service endpoints and credentials
4. **System Resource Issues**: Monitor CPU, memory, and disk usage

### Debugging

1. Use the `/health/components/:component` endpoint to check specific component health
2. Check application logs for error messages
3. Use the admin dashboard to view recent alerts and metrics

## Conclusion

The monitoring and alerting system provides comprehensive tools for monitoring system health, collecting metrics, and receiving notifications when issues occur. By following the guidelines in this document, you can ensure that your system remains healthy and issues are addressed promptly.
