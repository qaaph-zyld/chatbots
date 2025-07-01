# Subscription Analytics Dashboard Guide

## Overview

The Subscription Analytics Dashboard provides comprehensive insights into your subscription business metrics. This dashboard helps you monitor key performance indicators (KPIs) such as Monthly Recurring Revenue (MRR), churn rate, customer lifetime value, and subscription growth.

## Features

- **Dashboard Summary**: Quick overview of key metrics including MRR, active subscriptions, and churn rate
- **Revenue Analytics**: Track MRR trends and revenue breakdown by plan
- **Subscription Growth**: Monitor new, canceled, and total subscriptions over time
- **Customer Metrics**: Analyze churn rate and customer lifetime value
- **Payment Performance**: Track payment success rates and failed payment recovery

## Accessing the Dashboard

The Subscription Analytics Dashboard is available to administrators and can be accessed at:

```
/admin/billing/analytics
```

## Dashboard Components

### Summary Cards

The top section of the dashboard displays summary cards with the following metrics:

- **Monthly Recurring Revenue**: Total recurring revenue for the current month
- **Active Subscriptions**: Number of currently active subscriptions
- **Churn Rate**: Percentage of subscriptions canceled in the current month
- **New Subscriptions**: Number of new subscriptions in the current month
- **Canceled Subscriptions**: Number of canceled subscriptions in the current month
- **Net Growth**: Net change in subscriptions (new minus canceled) for the current month

### Charts and Visualizations

The dashboard includes the following charts:

1. **Monthly Recurring Revenue (MRR) Chart**
   - Line chart showing MRR trends over time
   - Helps identify revenue growth patterns and seasonality

2. **Churn Rate Chart**
   - Line chart showing churn rate trends over time
   - Helps identify retention issues and improvements

3. **Revenue by Plan Chart**
   - Bar chart showing revenue breakdown by subscription plan
   - Helps identify which plans contribute most to revenue

4. **Payment Success Rate Chart**
   - Pie chart showing the ratio of successful to failed payment attempts
   - Helps monitor payment processing health

5. **Subscription Growth Chart**
   - Line chart showing total, new, and canceled subscriptions over time
   - Helps visualize subscription growth trajectory

6. **Customer Lifetime Value (LTV) Metrics**
   - Displays average monthly revenue per customer, average customer lifetime, and calculated LTV
   - Helps understand the long-term value of acquiring customers

## Filtering and Time Ranges

The dashboard supports filtering data by different time ranges:

- **Last 30 Days**: Recent short-term trends
- **Last 90 Days**: Medium-term trends (quarter)
- **Last 6 Months**: Half-year trends
- **Last 12 Months**: Annual trends
- **Year to Date**: Current year performance
- **All Time**: Complete historical data

## API Integration

The analytics data is available through REST API endpoints for integration with other systems or custom dashboards.

### Base URL

```
/api/billing/analytics
```

### Available Endpoints

| Endpoint | Method | Description | Query Parameters |
|----------|--------|-------------|------------------|
| `/dashboard` | GET | Get dashboard summary | None |
| `/mrr` | GET | Get MRR data | `startDate`, `endDate`, `interval` |
| `/churn` | GET | Get churn rate data | `startDate`, `endDate`, `interval` |
| `/ltv` | GET | Get customer LTV metrics | None |
| `/revenue-by-plan` | GET | Get revenue breakdown by plan | None |
| `/payment-success` | GET | Get payment success rate | `startDate`, `endDate` |
| `/growth` | GET | Get subscription growth data | `startDate`, `endDate`, `interval` |
| `/tenant/:tenantId` | GET | Get analytics for specific tenant | `tenantId` (path parameter) |

### Query Parameters

- `startDate`: Start date for data range (format: YYYY-MM-DD)
- `endDate`: End date for data range (format: YYYY-MM-DD)
- `interval`: Data point interval (`day`, `week`, `month`)

### Example API Request

```javascript
// Fetch MRR data for the last 6 months with monthly intervals
const response = await fetch('/api/billing/analytics/mrr?startDate=2025-01-01&endDate=2025-06-30&interval=month');
const mrrData = await response.json();
```

## Implementation Details

The analytics dashboard is built using the following components:

1. **Backend Service**: `analytics.service.js` processes subscription data and calculates metrics
2. **API Controller**: `analytics.controller.js` exposes REST endpoints for the frontend
3. **Frontend Component**: `AnalyticsDashboard.jsx` renders the dashboard UI with charts
4. **Utility Functions**: `formatters.js` provides formatting helpers for currency, percentages, etc.

## Adding the Dashboard to Your Application

To integrate the analytics dashboard into your application:

1. Import the dashboard component:
   ```javascript
   import AnalyticsDashboard from '../components/billing/AnalyticsDashboard';
   ```

2. Add the component to your admin route:
   ```javascript
   <Route path="/admin/billing/analytics" element={<AnalyticsDashboard />} />
   ```

3. Add a navigation link in your admin menu:
   ```javascript
   <NavLink to="/admin/billing/analytics">Subscription Analytics</NavLink>
   ```

## Best Practices

- **Regular Monitoring**: Check the dashboard at least weekly to identify trends and issues
- **Investigate Spikes**: Look into sudden changes in churn rate or payment failures
- **Compare Time Periods**: Use different time ranges to identify seasonal patterns
- **Track Plan Performance**: Monitor which plans contribute most to revenue and have the lowest churn
- **Set Alerts**: Configure alerts for critical metrics like high churn or payment failure rates

## Troubleshooting

If the dashboard is not displaying data correctly:

1. Check browser console for JavaScript errors
2. Verify API endpoints are returning data correctly
3. Ensure the user has admin permissions
4. Check that subscription data exists in the database
5. Verify date ranges are valid

## Security Considerations

- The analytics dashboard contains sensitive business data
- Access is restricted to admin users only
- All API endpoints are protected by authentication and authorization middleware
- Data is aggregated to protect individual customer privacy

## Future Enhancements

Planned enhancements for future versions:

- Export data to CSV/Excel
- Custom report builder
- Automated insights and recommendations
- Email reports and alerts
- Cohort analysis for customer segments
- Forecasting and predictive analytics
