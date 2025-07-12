# Alert API Guide

This guide provides information on how to use the alert API endpoints to manage system alerts and notifications.

## API Endpoints

### Get Alerts

Retrieve system alerts with optional filtering.

```
GET /api/alerts
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | Number | Maximum number of alerts to return (default: 100) |
| skip | Number | Number of alerts to skip (for pagination) |
| level | String | Filter by alert level ('info', 'warning', 'critical') |
| source | String | Filter by alert source |
| resolved | Boolean | Filter by resolution status ('true' or 'false') |
| acknowledged | Boolean | Filter by acknowledgment status ('true' or 'false') |
| startTime | ISO Date | Filter alerts after this timestamp |
| endTime | ISO Date | Filter alerts before this timestamp |

#### Example Request

```
GET /api/alerts?level=critical&resolved=false&limit=10
```

#### Example Response

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60f1e5b3c7f9d42e8c8b4567",
      "timestamp": "2025-07-05T09:00:00.000Z",
      "level": "critical",
      "source": "database",
      "message": "Database connection failed",
      "details": {
        "error": "Connection timeout",
        "attempts": 3
      },
      "acknowledged": false,
      "resolved": false,
      "notificationsSent": 2
    },
    {
      "_id": "60f1e5b3c7f9d42e8c8b4568",
      "timestamp": "2025-07-05T08:45:00.000Z",
      "level": "critical",
      "source": "payment-gateway",
      "message": "Payment gateway not responding",
      "details": {
        "statusCode": 503,
        "error": "Service unavailable"
      },
      "acknowledged": false,
      "resolved": false,
      "notificationsSent": 2
    }
  ]
}
```

### Create Alert

Create a new system alert.

```
POST /api/alerts
```

#### Request Body

| Field | Type | Description |
|-------|------|-------------|
| level | String | Alert level ('info', 'warning', 'critical') (default: 'info') |
| source | String | Source of the alert (required) |
| message | String | Alert message (required) |
| details | Object | Additional details about the alert |

#### Example Request

```json
{
  "level": "warning",
  "source": "api-server",
  "message": "High API response time detected",
  "details": {
    "avgResponseTime": 1500,
    "threshold": 1000,
    "affectedEndpoints": ["/api/users", "/api/products"]
  }
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Alert created successfully",
  "data": {
    "_id": "60f1e5b3c7f9d42e8c8b4569",
    "timestamp": "2025-07-05T09:30:00.000Z",
    "level": "warning",
    "source": "api-server",
    "message": "High API response time detected",
    "details": {
      "avgResponseTime": 1500,
      "threshold": 1000,
      "affectedEndpoints": ["/api/users", "/api/products"]
    },
    "acknowledged": false,
    "resolved": false,
    "notificationsSent": 1
  }
}
```

### Acknowledge Alert

Acknowledge an existing alert.

```
PUT /api/alerts/:alertId/acknowledge
```

#### URL Parameters

| Parameter | Description |
|-----------|-------------|
| alertId | ID of the alert to acknowledge |

#### Request Body

| Field | Type | Description |
|-------|------|-------------|
| acknowledgedBy | String | Name or ID of the user acknowledging the alert (required) |

#### Example Request

```json
{
  "acknowledgedBy": "john.doe@example.com"
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Alert acknowledged successfully",
  "data": {
    "_id": "60f1e5b3c7f9d42e8c8b4567",
    "timestamp": "2025-07-05T09:00:00.000Z",
    "level": "critical",
    "source": "database",
    "message": "Database connection failed",
    "details": {
      "error": "Connection timeout",
      "attempts": 3
    },
    "acknowledged": true,
    "acknowledgedBy": "john.doe@example.com",
    "acknowledgedAt": "2025-07-05T09:35:00.000Z",
    "resolved": false,
    "notificationsSent": 2
  }
}
```

### Resolve Alert

Mark an alert as resolved.

```
PUT /api/alerts/:alertId/resolve
```

#### URL Parameters

| Parameter | Description |
|-----------|-------------|
| alertId | ID of the alert to resolve |

#### Example Response

```json
{
  "success": true,
  "message": "Alert resolved successfully",
  "data": {
    "_id": "60f1e5b3c7f9d42e8c8b4567",
    "timestamp": "2025-07-05T09:00:00.000Z",
    "level": "critical",
    "source": "database",
    "message": "Database connection failed",
    "details": {
      "error": "Connection timeout",
      "attempts": 3
    },
    "acknowledged": true,
    "acknowledgedBy": "john.doe@example.com",
    "acknowledgedAt": "2025-07-05T09:35:00.000Z",
    "resolved": true,
    "resolvedAt": "2025-07-05T09:40:00.000Z",
    "notificationsSent": 2
  }
}
```

### Get Alert Statistics

Retrieve statistics about system alerts.

```
GET /api/alerts/stats
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| startTime | ISO Date | Start of the time range for statistics (default: 24 hours ago) |
| endTime | ISO Date | End of the time range for statistics (default: current time) |

#### Example Request

```
GET /api/alerts/stats?startTime=2025-07-04T09:00:00.000Z&endTime=2025-07-05T09:00:00.000Z
```

#### Example Response

```json
{
  "success": true,
  "timeRange": {
    "start": "2025-07-04T09:00:00.000Z",
    "end": "2025-07-05T09:00:00.000Z"
  },
  "stats": {
    "total": 42,
    "byLevel": {
      "info": 20,
      "warning": 15,
      "critical": 7
    },
    "bySource": {
      "database": 10,
      "api-server": 15,
      "payment-gateway": 8,
      "cache": 5,
      "system": 4
    },
    "resolved": 35,
    "unresolved": 7,
    "acknowledged": 38,
    "unacknowledged": 4,
    "averageTimeToAcknowledge": 12.5,
    "averageTimeToResolve": 45.2
  }
}
```

## Integration Examples

### JavaScript Example

```javascript
// Function to get unresolved critical alerts
async function getUnresolvedCriticalAlerts() {
  try {
    const response = await fetch('/api/alerts?level=critical&resolved=false');
    const data = await response.json();
    
    if (data.success) {
      console.log(`Found ${data.count} unresolved critical alerts`);
      return data.data;
    } else {
      console.error('Failed to get alerts:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
}

// Function to acknowledge an alert
async function acknowledgeAlert(alertId, user) {
  try {
    const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        acknowledgedBy: user
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`Alert ${alertId} acknowledged successfully`);
      return true;
    } else {
      console.error('Failed to acknowledge alert:', data.message);
      return false;
    }
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return false;
  }
}

// Function to resolve an alert
async function resolveAlert(alertId) {
  try {
    const response = await fetch(`/api/alerts/${alertId}/resolve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`Alert ${alertId} resolved successfully`);
      return true;
    } else {
      console.error('Failed to resolve alert:', data.message);
      return false;
    }
  } catch (error) {
    console.error('Error resolving alert:', error);
    return false;
  }
}
```

### Alert Dashboard Integration

The alert API can be integrated with dashboards to create real-time alert monitoring and management interfaces. Here's an example of how to use the alert statistics endpoint to create an alert dashboard:

```javascript
async function updateAlertDashboard() {
  try {
    // Get alert statistics for the last 24 hours
    const response = await fetch('/api/alerts/stats');
    const data = await response.json();
    
    if (data.success) {
      // Update summary statistics
      document.getElementById('total-alerts').textContent = data.stats.total;
      document.getElementById('critical-alerts').textContent = data.stats.byLevel.critical;
      document.getElementById('warning-alerts').textContent = data.stats.byLevel.warning;
      document.getElementById('info-alerts').textContent = data.stats.byLevel.info;
      document.getElementById('unresolved-alerts').textContent = data.stats.unresolved;
      
      // Update average response times
      document.getElementById('avg-acknowledge-time').textContent = 
        `${data.stats.averageTimeToAcknowledge.toFixed(1)} minutes`;
      document.getElementById('avg-resolve-time').textContent = 
        `${data.stats.averageTimeToResolve.toFixed(1)} minutes`;
      
      // Update charts using a charting library like Chart.js
      updateLevelDistributionChart(data.stats.byLevel);
      updateSourceDistributionChart(data.stats.bySource);
    }
    
    // Get unresolved alerts for the alert list
    const alertsResponse = await fetch('/api/alerts?resolved=false&limit=10');
    const alertsData = await alertsResponse.json();
    
    if (alertsData.success) {
      // Update the alerts list
      const alertsList = document.getElementById('alerts-list');
      alertsList.innerHTML = '';
      
      alertsData.data.forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item ${alert.level}`;
        alertElement.innerHTML = `
          <div class="alert-header">
            <span class="alert-level">${alert.level}</span>
            <span class="alert-source">${alert.source}</span>
            <span class="alert-time">${new Date(alert.timestamp).toLocaleString()}</span>
          </div>
          <div class="alert-message">${alert.message}</div>
          <div class="alert-actions">
            ${!alert.acknowledged ? 
              `<button class="acknowledge-btn" data-id="${alert._id}">Acknowledge</button>` : 
              `<span class="acknowledged-by">Acknowledged by: ${alert.acknowledgedBy}</span>`
            }
            <button class="resolve-btn" data-id="${alert._id}">Resolve</button>
          </div>
        `;
        alertsList.appendChild(alertElement);
      });
      
      // Add event listeners to buttons
      document.querySelectorAll('.acknowledge-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
          const alertId = e.target.dataset.id;
          const user = getCurrentUser(); // Get current user from your auth system
          await acknowledgeAlert(alertId, user);
          updateAlertDashboard(); // Refresh the dashboard
        });
      });
      
      document.querySelectorAll('.resolve-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
          const alertId = e.target.dataset.id;
          await resolveAlert(alertId);
          updateAlertDashboard(); // Refresh the dashboard
        });
      });
    }
  } catch (error) {
    console.error('Error updating alert dashboard:', error);
  }
}

// Update dashboard every minute
setInterval(updateAlertDashboard, 60 * 1000);
```

## Best Practices

1. **Alert Levels**: Use appropriate alert levels based on severity:
   - `info`: Informational events that don't require immediate action
   - `warning`: Issues that may require attention but aren't critical
   - `critical`: Serious issues that require immediate attention

2. **Alert Sources**: Use consistent naming for alert sources to make filtering and analysis easier.

3. **Alert Details**: Include relevant details in the alert to help with troubleshooting.

4. **Alert Throttling**: The alert service includes built-in throttling to prevent alert flooding. Similar alerts from the same source will be combined within a 15-minute window.

5. **Regular Polling**: For dashboards and monitoring tools, poll the alert endpoints at regular intervals (e.g., every 1-5 minutes).

6. **Pagination**: When retrieving large amounts of data, use the `limit` and `skip` parameters for pagination.

7. **Filtering**: Use query parameters to filter alerts by level, source, and status to reduce data transfer and processing.

8. **Error Handling**: Always handle API errors gracefully in your client applications.

## Notification Channels

The alert service supports multiple notification channels:

1. **Email**: Sends email notifications for alerts. Configure recipients in the alert configuration.

2. **Slack**: Sends alerts to a Slack channel using webhooks. Configure the webhook URL in the alert configuration.

3. **Webhook**: Sends alerts to custom webhook endpoints for integration with other systems.

## Troubleshooting

### Common Issues

1. **Missing Notifications**: Check the alert configuration to ensure notification channels are properly configured.

2. **Alert Throttling**: If you're not seeing new alerts for similar issues, check if they're being throttled (combined with existing alerts).

3. **Incorrect Time Range**: When using `startTime` and `endTime` filters, ensure they are properly formatted as ISO date strings.

### Support

For additional support or to report issues with the alert API, please contact the operations team or create an issue in the project repository.
