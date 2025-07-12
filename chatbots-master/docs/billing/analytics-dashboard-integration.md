# Subscription Analytics Dashboard Integration Guide

This guide provides technical instructions for integrating the Subscription Analytics Dashboard into your application architecture.

## Architecture Overview

The Subscription Analytics Dashboard follows a layered architecture:

```
Frontend (React) → API Routes → Controllers → Services → Database
```

## Prerequisites

- Node.js 14+
- MongoDB database with subscription data
- Express.js backend
- React frontend with Chart.js

## Backend Integration Steps

### 1. Database Models

Ensure your database has the following models:

- `Subscription` - For subscription data
- `PaymentAttempt` - For payment processing history
- `Tenant` - For multi-tenant support

### 2. Analytics Service

The analytics service (`analytics.service.js`) provides methods for calculating subscription metrics:

```javascript
// Import the service
const analyticsService = require('../billing/services/analytics.service');

// Use the service methods
const mrrData = await analyticsService.getMonthlyRecurringRevenue();
const churnData = await analyticsService.getChurnRate();
const ltvData = await analyticsService.getCustomerLifetimeValue();
// etc.
```

### 3. API Controller

The analytics controller (`analytics.controller.js`) exposes REST endpoints:

```javascript
// In your main routes file
const billingRoutes = require('./routes/billing.routes');
app.use('/api/billing', billingRoutes);
```

### 4. Authentication & Authorization

All analytics endpoints are protected by middleware:

```javascript
// Ensure these middleware are implemented
const authMiddleware = require('../../middleware/auth');
const adminMiddleware = require('../../middleware/admin');

// Apply them to routes
router.get('/dashboard', [authMiddleware, adminMiddleware], async (req, res) => {
  // Route handler
});
```

## Frontend Integration Steps

### 1. Install Dependencies

```bash
npm install chart.js react-chartjs-2
```

### 2. Import the Dashboard Component

```javascript
import AnalyticsDashboard from '../components/billing/AnalyticsDashboard';
```

### 3. Add to Routes

```javascript
import { Route } from 'react-router-dom';

// In your routes configuration
<Route path="/admin/billing/analytics" element={<AnalyticsDashboard />} />
```

### 4. Add Navigation Link

```javascript
import { NavLink } from 'react-router-dom';

// In your admin navigation component
<NavLink 
  to="/admin/billing/analytics"
  className={({ isActive }) => isActive ? 'active' : ''}
>
  Subscription Analytics
</NavLink>
```

## Customization Options

### Custom Date Ranges

Modify the date range options in the dashboard component:

```javascript
// In AnalyticsDashboard.jsx
const dateRanges = [
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '12m', label: 'Last 12 Months' },
  // Add custom ranges here
];
```

### Chart Customization

Customize chart appearance by modifying the chart options:

```javascript
// Example: Customize MRR chart
const mrrChartOptions = {
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => formatCurrency(value)
      }
    }
  },
  plugins: {
    legend: {
      position: 'bottom'
    },
    tooltip: {
      callbacks: {
        label: (context) => formatCurrency(context.raw)
      }
    }
  }
};
```

## Data Refresh Strategy

By default, the dashboard fetches data when:

1. The component mounts
2. The date range or interval changes
3. The user manually refreshes

To implement automatic refresh:

```javascript
// In AnalyticsDashboard.jsx
useEffect(() => {
  // Initial fetch
  fetchDashboardData();
  
  // Set up auto-refresh every 5 minutes
  const refreshInterval = setInterval(() => {
    fetchDashboardData();
  }, 5 * 60 * 1000);
  
  // Clean up on unmount
  return () => clearInterval(refreshInterval);
}, [dateRange, interval]);
```

## Performance Optimization

For large datasets, consider these optimizations:

1. **Data Aggregation**: Pre-aggregate data in the database
   ```javascript
   // Example MongoDB aggregation
   const mrrData = await Subscription.aggregate([
     { $match: { status: 'active' } },
     { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, totalMRR: { $sum: '$amount' } } },
     { $sort: { _id: 1 } }
   ]);
   ```

2. **Data Caching**: Cache API responses
   ```javascript
   const cacheService = require('../../services/cache.service');
   
   // In controller
   const cacheKey = `analytics_mrr_${startDate}_${endDate}_${interval}`;
   let mrrData = await cacheService.get(cacheKey);
   
   if (!mrrData) {
     mrrData = await analyticsService.getMonthlyRecurringRevenue(options);
     await cacheService.set(cacheKey, mrrData, 3600); // Cache for 1 hour
   }
   ```

3. **Lazy Loading**: Load charts only when visible
   ```javascript
   import { lazy, Suspense } from 'react';
   
   const LazyChurnChart = lazy(() => import('./ChurnChart'));
   
   // In render
   <Suspense fallback={<div>Loading chart...</div>}>
     <LazyChurnChart data={churnData} />
   </Suspense>
   ```

## Error Handling

Implement robust error handling:

```javascript
// In API calls
try {
  const response = await axios.get('/api/billing/analytics/mrr');
  setMrrData(response.data);
} catch (error) {
  console.error('Error fetching MRR data:', error);
  
  // Check for specific error types
  if (error.response) {
    // Server responded with error status
    if (error.response.status === 401) {
      // Unauthorized - redirect to login
      navigate('/login');
    } else {
      setError(`Server error: ${error.response.data.message || 'Unknown error'}`);
    }
  } else if (error.request) {
    // Request made but no response
    setError('Network error: Could not connect to server');
  } else {
    // Something else went wrong
    setError(`Error: ${error.message}`);
  }
}
```

## Testing

### Unit Tests

```javascript
// Example Jest test for analytics service
describe('AnalyticsService', () => {
  test('getMonthlyRecurringRevenue returns correct data format', async () => {
    const mrrData = await analyticsService.getMonthlyRecurringRevenue();
    
    expect(Array.isArray(mrrData)).toBe(true);
    if (mrrData.length > 0) {
      expect(mrrData[0]).toHaveProperty('date');
      expect(mrrData[0]).toHaveProperty('value');
      expect(mrrData[0]).toHaveProperty('subscriptionCount');
    }
  });
});
```

### Integration Tests

```javascript
// Example Supertest API test
const request = require('supertest');
const app = require('../../app');

describe('Analytics API', () => {
  test('GET /api/billing/analytics/dashboard returns 200 for admin users', async () => {
    const response = await request(app)
      .get('/api/billing/analytics/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('activeSubscriptions');
    expect(response.body).toHaveProperty('monthlyRevenue');
  });
  
  test('GET /api/billing/analytics/dashboard returns 403 for non-admin users', async () => {
    const response = await request(app)
      .get('/api/billing/analytics/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
      
    expect(response.status).toBe(403);
  });
});
```

## Deployment Considerations

1. **Database Indexes**: Create indexes for frequently queried fields
   ```javascript
   // In your MongoDB schema
   subscriptionSchema.index({ createdAt: 1 });
   subscriptionSchema.index({ status: 1 });
   subscriptionSchema.index({ tenantId: 1 });
   ```

2. **API Rate Limiting**: Protect analytics endpoints from abuse
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const analyticsLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // Limit each IP to 100 requests per windowMs
     message: 'Too many requests, please try again later'
   });
   
   router.use(analyticsLimiter);
   ```

3. **Monitoring**: Add monitoring for analytics performance
   ```javascript
   const responseTime = require('response-time');
   
   router.use(responseTime((req, res, time) => {
     logger.info(`Analytics API ${req.path} responded in ${time}ms`);
     
     // Report to monitoring system if response time is too high
     if (time > 1000) {
       logger.warn(`Slow analytics response: ${req.path} took ${time}ms`);
     }
   }));
   ```

## Troubleshooting Common Issues

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| No data displayed | Missing subscription data | Check database for active subscriptions |
| Charts not rendering | Chart.js initialization error | Check browser console for errors |
| Slow dashboard loading | Large dataset without pagination | Implement data aggregation and caching |
| "Unauthorized" error | Missing or expired auth token | Ensure user is logged in with admin privileges |
| Incorrect metrics | Calculation logic error | Verify calculation methods in analytics service |

## Next Steps

After integrating the dashboard, consider these enhancements:

1. Add export functionality for reports
2. Implement email notifications for key metric changes
3. Create custom dashboards for different user roles
4. Add predictive analytics using historical data
5. Integrate with business intelligence tools
