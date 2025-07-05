/**
 * Admin Reporting Dashboard Component
 * 
 * Provides comprehensive reporting and analytics for system administrators
 * Features include:
 * - Revenue and subscription metrics
 * - User growth and engagement statistics
 * - System performance indicators
 * - Exportable reports
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../../auth/hooks/useAuth';
import { formatCurrency } from '../../../utils/formatters';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AdminReportingDashboard = () => {
  const { authToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [tabValue, setTabValue] = useState(0);
  const [reportData, setReportData] = useState({
    summary: {},
    revenueData: [],
    subscriptionData: [],
    userGrowthData: [],
    planDistribution: [],
    performanceData: []
  });

  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `/api/admin/reports?timeRange=${timeRange}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Error fetching report data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setReportData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [timeRange, authToken]);

  // Handle time range change
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle data refresh
  const handleRefresh = () => {
    // Re-fetch data with current time range
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `/api/admin/reports?timeRange=${timeRange}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Error fetching report data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setReportData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  };

  // Handle export report
  const handleExport = async () => {
    try {
      const response = await fetch(
        `/api/admin/reports/export?timeRange=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error exporting report: ${response.statusText}`);
      }
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a link element to download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    }
  };

  // Render summary cards
  const renderSummaryCards = () => {
    const { summary } = reportData;
    
    if (!summary || Object.keys(summary).length === 0) {
      return (
        <Grid item xs={12}>
          <Alert severity="info">No summary data available</Alert>
        </Grid>
      );
    }
    
    return (
      <>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Total Revenue" />
            <CardContent>
              <Typography variant="h4">
                {formatCurrency(summary.totalRevenue, 'USD')}
              </Typography>
              <Typography variant="body2" color={summary.revenueChange >= 0 ? 'success.main' : 'error.main'}>
                {summary.revenueChange >= 0 ? '+' : ''}{summary.revenueChange}% from previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Active Subscriptions" />
            <CardContent>
              <Typography variant="h4">
                {summary.activeSubscriptions}
              </Typography>
              <Typography variant="body2" color={summary.subscriptionChange >= 0 ? 'success.main' : 'error.main'}>
                {summary.subscriptionChange >= 0 ? '+' : ''}{summary.subscriptionChange}% from previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Total Users" />
            <CardContent>
              <Typography variant="h4">
                {summary.totalUsers}
              </Typography>
              <Typography variant="body2" color={summary.userChange >= 0 ? 'success.main' : 'error.main'}>
                {summary.userChange >= 0 ? '+' : ''}{summary.userChange}% from previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardHeader title="Avg. Response Time" />
            <CardContent>
              <Typography variant="h4">
                {summary.avgResponseTime} ms
              </Typography>
              <Typography variant="body2" color={summary.responseTimeChange <= 0 ? 'success.main' : 'error.main'}>
                {summary.responseTimeChange <= 0 ? '' : '+'}{summary.responseTimeChange}% from previous period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </>
    );
  };

  // Render revenue chart
  const renderRevenueChart = () => {
    const { revenueData } = reportData;
    
    if (!revenueData || revenueData.length === 0) {
      return (
        <Alert severity="info">No revenue data available</Alert>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={revenueData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(value, 'USD')} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
          <Line type="monotone" dataKey="mrr" stroke="#82ca9d" name="MRR" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Render subscription chart
  const renderSubscriptionChart = () => {
    const { subscriptionData } = reportData;
    
    if (!subscriptionData || subscriptionData.length === 0) {
      return (
        <Alert severity="info">No subscription data available</Alert>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={subscriptionData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="new" name="New" fill="#8884d8" />
          <Bar dataKey="cancelled" name="Cancelled" fill="#FF8042" />
          <Bar dataKey="net" name="Net Change" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Render plan distribution chart
  const renderPlanDistributionChart = () => {
    const { planDistribution } = reportData;
    
    if (!planDistribution || planDistribution.length === 0) {
      return (
        <Alert severity="info">No plan distribution data available</Alert>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={planDistribution}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {planDistribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [`${value} subscriptions`, name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Render performance chart
  const renderPerformanceChart = () => {
    const { performanceData } = reportData;
    
    if (!performanceData || performanceData.length === 0) {
      return (
        <Alert severity="info">No performance data available</Alert>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={performanceData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="responseTime" stroke="#8884d8" name="Avg Response Time (ms)" />
          <Line yAxisId="right" type="monotone" dataKey="requestCount" stroke="#82ca9d" name="Request Count" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Admin Reporting Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              label="Time Range"
            >
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
              <MenuItem value="quarter">Last 90 Days</MenuItem>
              <MenuItem value="year">Last 365 Days</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export Report
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {renderSummaryCards()}
          </Grid>
          
          {/* Chart Tabs */}
          <Paper sx={{ mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Revenue" />
              <Tab label="Subscriptions" />
              <Tab label="Plan Distribution" />
              <Tab label="System Performance" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {tabValue === 0 && renderRevenueChart()}
              {tabValue === 1 && renderSubscriptionChart()}
              {tabValue === 2 && renderPlanDistributionChart()}
              {tabValue === 3 && renderPerformanceChart()}
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default AdminReportingDashboard;
