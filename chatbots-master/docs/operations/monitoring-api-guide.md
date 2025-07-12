# Monitoring API Guide

This guide provides information on how to use the monitoring API endpoints to access system metrics and health information.

## API Endpoints

### Get Recent Metrics

Retrieve recent system metrics with optional filtering.

```
GET /api/monitoring/metrics
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | Number | Maximum number of metrics to return (default: 100) |
| skip | Number | Number of metrics to skip (for pagination) |
| type | String | Filter by metric type (e.g., 'database', 'cache', 'external-service', 'system') |
| component | String | Filter by component name |
| status | String | Filter by status ('healthy', 'unhealthy', 'degraded', 'unknown') |
| startTime | ISO Date | Filter metrics after this timestamp |
| endTime | ISO Date | Filter metrics before this timestamp |

#### Example Request

```
GET /api/monitoring/metrics?type=database&limit=10&status=healthy
```

#### Example Response

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "60f1e5b3c7f9d42e8c8b4567",
      "timestamp": "2025-07-05T09:00:00.000Z",
      "type": "database",
      "component": "mongodb",
      "status": "healthy",
      "responseTime": 15,
      "details": {
        "connections": 5,
        "freeConnections": 95
      }
    },
    // ... more metrics
  ]
}
```

### Get Aggregated Metrics

Retrieve aggregated metrics grouped by time intervals.

```
GET /api/monitoring/metrics/aggregated
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| type | String | Filter by metric type |
| component | String | Filter by component name |
| startTime | ISO Date | Filter metrics after this timestamp |
| endTime | ISO Date | Filter metrics before this timestamp |
| interval | String | Time interval for aggregation ('minute', 'hour', 'day') (default: 'hour') |

#### Example Request

```
GET /api/monitoring/metrics/aggregated?type=database&interval=hour
```

#### Example Response

```json
{
  "success": true,
  "count": 24,
  "data": [
    {
      "time": {
        "year": 2025,
        "month": 7,
        "day": 5,
        "hour": 9
      },
      "type": "database",
      "component": "mongodb",
      "count": 60,
      "healthyCount": 58,
      "unhealthyCount": 2,
      "healthPercentage": 96.67,
      "avgResponseTime": 18.5
    },
    // ... more aggregated metrics
  ]
}
```

### Get System Health Overview

Retrieve a high-level overview of the current system health.

```
GET /api/monitoring/overview
```

#### Example Response

```json
{
  "success": true,
  "timestamp": "2025-07-05T09:15:00.000Z",
  "overview": {
    "database": {
      "_id": "60f1e5b3c7f9d42e8c8b4567",
      "timestamp": "2025-07-05T09:15:00.000Z",
      "type": "database",
      "component": "mongodb",
      "status": "healthy",
      "responseTime": 15,
      "details": {
        "connections": 5,
        "freeConnections": 95
      }
    },
    "cache": {
      "_id": "60f1e5b3c7f9d42e8c8b4568",
      "timestamp": "2025-07-05T09:15:00.000Z",
      "type": "cache",
      "component": "redis",
      "status": "healthy",
      "responseTime": 5,
      "details": {
        "usedMemory": "1.5MB",
        "maxMemory": "128MB"
      }
    },
    "externalServices": {
      "payment-gateway": {
        "_id": "60f1e5b3c7f9d42e8c8b4569",
        "timestamp": "2025-07-05T09:15:00.000Z",
        "type": "external-service",
        "component": "payment-gateway",
        "status": "healthy",
        "responseTime": 120,
        "details": {
          "statusCode": 200,
          "error": null
        }
      },
      "email-service": {
        "_id": "60f1e5b3c7f9d42e8c8b4570",
        "timestamp": "2025-07-05T09:15:00.000Z",
        "type": "external-service",
        "component": "email-service",
        "status": "healthy",
        "responseTime": 85,
        "details": {
          "statusCode": 200,
          "error": null
        }
      }
    },
    "systemResources": {
      "_id": "60f1e5b3c7f9d42e8c8b4571",
      "timestamp": "2025-07-05T09:15:00.000Z",
      "type": "system",
      "component": "resources",
      "status": "healthy",
      "details": {
        "cpu": {
          "usage": 25.5,
          "cores": 8
        },
        "memory": {
          "total": "16GB",
          "used": "8GB",
          "free": "8GB",
          "usagePercentage": 50
        },
        "disk": {
          "total": "500GB",
          "used": "200GB",
          "free": "300GB",
          "usagePercentage": 40
        }
      }
    }
  }
}
```

### Trigger Metrics Collection

Trigger an immediate collection of system metrics.

```
POST /api/monitoring/collect
```

#### Example Response

```json
{
  "success": true,
  "message": "Metrics collected successfully",
  "count": 4,
  "data": [
    // ... collected metrics
  ]
}
```

## Integration Examples

### JavaScript Example

```javascript
async function getSystemOverview() {
  try {
    const response = await fetch('/api/monitoring/overview');
    const data = await response.json();
    
    if (data.success) {
      console.log('System overview:', data.overview);
      
      // Check if any component is unhealthy
      const database = data.overview.database;
      if (database.status !== 'healthy') {
        console.error('Database is not healthy:', database);
      }
      
      // Check external services
      const externalServices = data.overview.externalServices;
      Object.keys(externalServices).forEach(service => {
        if (externalServices[service].status !== 'healthy') {
          console.error(`External service ${service} is not healthy:`, externalServices[service]);
        }
      });
    }
  } catch (error) {
    console.error('Error fetching system overview:', error);
  }
}
```

### Dashboard Integration

The monitoring API can be integrated with dashboards and visualization tools to create real-time monitoring dashboards. Here's an example of how to use the aggregated metrics endpoint to create a system health dashboard:

```javascript
async function updateDashboard() {
  try {
    // Get the last 24 hours of database metrics
    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const response = await fetch(
      `/api/monitoring/metrics/aggregated?type=database&startTime=${startTime}&endTime=${endTime}&interval=hour`
    );
    
    const data = await response.json();
    
    if (data.success) {
      // Process data for charts
      const labels = data.data.map(item => 
        `${item.time.year}-${item.time.month}-${item.time.day} ${item.time.hour}:00`
      );
      
      const healthPercentages = data.data.map(item => item.healthPercentage);
      const responseTimes = data.data.map(item => item.avgResponseTime);
      
      // Update charts using a charting library like Chart.js
      updateHealthChart(labels, healthPercentages);
      updateResponseTimeChart(labels, responseTimes);
    }
  } catch (error) {
    console.error('Error updating dashboard:', error);
  }
}

// Update dashboard every 5 minutes
setInterval(updateDashboard, 5 * 60 * 1000);
```

## Best Practices

1. **Regular Polling**: For dashboards and monitoring tools, poll the `/api/monitoring/overview` endpoint at regular intervals (e.g., every 1-5 minutes).

2. **Historical Analysis**: Use the `/api/monitoring/metrics/aggregated` endpoint for historical analysis and trend identification.

3. **Alerting**: Set up alerts based on the health status of critical components.

4. **Pagination**: When retrieving large amounts of data, use the `limit` and `skip` parameters for pagination.

5. **Filtering**: Use query parameters to filter metrics by type, component, and status to reduce data transfer and processing.

6. **Error Handling**: Always handle API errors gracefully in your client applications.

## Troubleshooting

### Common Issues

1. **No Metrics Available**: If no metrics are returned, ensure that the monitoring service is properly initialized and collecting metrics.

2. **Incorrect Time Range**: When using `startTime` and `endTime` filters, ensure they are properly formatted as ISO date strings.

3. **Performance Issues**: If the API is slow to respond, consider reducing the requested data by using more specific filters or shorter time ranges.

### Support

For additional support or to report issues with the monitoring API, please contact the operations team or create an issue in the project repository.
