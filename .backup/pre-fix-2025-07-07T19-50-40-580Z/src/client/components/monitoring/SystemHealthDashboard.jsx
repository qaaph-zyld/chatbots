import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SystemHealthDashboard.css';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Chip,
  Box,
  Paper,
  Tabs,
  Tab,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
  WarningAmber as WarningIcon,
  Refresh as RefreshIcon,
  Storage as DatabaseIcon,
  Memory as CacheIcon,
  Cloud as ExternalServiceIcon,
  Computer as SystemIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * System Health Dashboard Component
 * 
 * Displays real-time health information about various system components
 */
const SystemHealthDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Fetch health data
  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/health');
      setHealthData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching health data:', err);
      setError('Failed to fetch system health data');
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
    }
  };

  // Fetch metrics data
  const fetchMetrics = async () => {
    try {
      const response = await axios.get('/api/monitoring/metrics', {
        params: {
          limit: 100
        }
      });
      setMetrics(response.data.data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  };

  // Fetch alerts data
  const fetchAlerts = async () => {
    try {
      const response = await axios.get('/api/alerts', {
        params: {
          limit: 20
        }
      });
      setAlerts(response.data.data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  // Refresh all data
  const refreshData = () => {
    fetchHealthData();
    fetchMetrics();
    fetchAlerts();
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Initialize data and set up refresh interval
  useEffect(() => {
    refreshData();

    const intervalId = setInterval(refreshData, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  // Prepare chart data from metrics
  const prepareChartData = () => {
    // Group metrics by timestamp (rounded to minutes)
    const groupedMetrics = {};
    
    metrics.forEach(metric => {
      const timestamp = new Date(metric.timestamp);
      const timeKey = timestamp.toISOString().substring(0, 16); // Format: YYYY-MM-DDTHH:MM
      
      if (!groupedMetrics[timeKey]) {
        groupedMetrics[timeKey] = {
          time: timeKey,
          database: null,
          cache: null,
          externalServices: null,
          system: null
        };
      }
      
      if (metric.type === 'database') {
        groupedMetrics[timeKey].database = metric.status === 'healthy' ? 100 : 0;
      } else if (metric.type === 'cache') {
        groupedMetrics[timeKey].cache = metric.status === 'healthy' ? 100 : 0;
      } else if (metric.type === 'external-service') {
        if (groupedMetrics[timeKey].externalServices === null) {
          groupedMetrics[timeKey].externalServices = 0;
        }
        groupedMetrics[timeKey].externalServices += metric.status === 'healthy' ? 1 : 0;
      } else if (metric.type === 'system') {
        groupedMetrics[timeKey].system = metric.status === 'healthy' ? 100 : 0;
      }
    });
    
    // Convert to array and sort by time
    return Object.values(groupedMetrics).sort((a, b) => a.time.localeCompare(b.time));
  };

  // Render status chip
  const renderStatusChip = (status) => {
    if (status === 'healthy') {
      return <Chip icon={<CheckIcon />} label="Healthy" color="success" size="small" />;
    } else if (status === 'unhealthy') {
      return <Chip icon={<ErrorIcon />} label="Unhealthy" color="error" size="small" />;
    } else {
      return <Chip icon={<WarningIcon />} label="Unknown" color="warning" size="small" />;
    }
  };

  // Render component icon
  const renderComponentIcon = (type) => {
    switch (type) {
      case 'database':
        return <DatabaseIcon color="primary" />;
      case 'cache':
        return <CacheIcon color="secondary" />;
      case 'external-service':
        return <ExternalServiceIcon style={{ color: '#ff9800' }} />;
      case 'system':
        return <SystemIcon style={{ color: '#2196f3' }} />;
      default:
        return <ErrorIcon color="error" />;
    }
  };

  // Render alert level icon
  const renderAlertLevelIcon = (level) => {
    switch (level) {
      case 'info':
        return <CheckIcon color="info" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'critical':
        return <ErrorIcon color="error" />;
      default:
        return <ErrorIcon color="error" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Render health overview
  const renderHealthOverview = () => {
    if (!healthData) return null;

    const { status, components } = healthData;
    const overallStatus = status;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">System Health</Typography>
                <Box>
                  {renderStatusChip(overallStatus)}
                  <Button 
                    startIcon={<RefreshIcon />} 
                    onClick={refreshData} 
                    size="small" 
                    sx={{ ml: 2 }}
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>
              <Typography variant="caption" display="block" gutterBottom>
                Last updated: {formatDate(lastRefreshed)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Database</Typography>
              {components?.database ? (
                <>
                  <Box display="flex" alignItems="center" mb={1}>
                    <DatabaseIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      Status: {renderStatusChip(components.database.status)}
                    </Typography>
                  </Box>
                  {components.database.responseTime && (
                    <Typography variant="body2">
                      Response Time: {components.database.responseTime}
                    </Typography>
                  )}
                  {components.database.details && (
                    <Typography variant="body2">
                      Host: {components.database.details.host || 'N/A'}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2">No database information available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Cache</Typography>
              {components?.cache ? (
                <>
                  <Box display="flex" alignItems="center" mb={1}>
                    <CacheIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      Status: {renderStatusChip(components.cache.status)}
                    </Typography>
                  </Box>
                  {components.cache.responseTime && (
                    <Typography variant="body2">
                      Response Time: {components.cache.responseTime}
                    </Typography>
                  )}
                  {components.cache.details && (
                    <Typography variant="body2">
                      Host: {components.cache.details.host || 'N/A'}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2">No cache information available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>External Services</Typography>
              {components?.externalServices && Object.keys(components.externalServices).length > 0 ? (
                Object.entries(components.externalServices).map(([name, service]) => (
                  <Box key={name} mb={2}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <ExternalServiceIcon style={{ color: '#ff9800', marginRight: 8 }} />
                      <Typography variant="body1">
                        {name}: {renderStatusChip(service.status)}
                      </Typography>
                    </Box>
                    {service.responseTime && (
                      <Typography variant="body2">
                        Response Time: {service.responseTime}
                      </Typography>
                    )}
                  </Box>
                ))
              ) : (
                <Typography variant="body2">No external services information available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>System Resources</Typography>
              {components?.systemResources ? (
                <>
                  <Box display="flex" alignItems="center" mb={1}>
                    <SystemIcon style={{ color: '#2196f3', marginRight: 8 }} />
                    <Typography variant="body1">
                      Status: {renderStatusChip(components.systemResources.status)}
                    </Typography>
                  </Box>
                  {components.systemResources.details && (
                    <>
                      <Typography variant="body2">
                        CPU Usage: {components.systemResources.details.cpu?.normalizedUsage || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        Memory Usage: {components.systemResources.details.memory?.used || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        Uptime: {components.systemResources.details.uptime || 'N/A'}
                      </Typography>
                    </>
                  )}
                </>
              ) : (
                <Typography variant="body2">No system resources information available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render metrics chart
  const renderMetricsChart = () => {
    const chartData = prepareChartData();
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Health Metrics Over Time</Typography>
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()} 
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="database" 
                      name="Database" 
                      stroke="#3f51b5" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cache" 
                      name="Cache" 
                      stroke="#f50057" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="externalServices" 
                      name="External Services" 
                      stroke="#ff9800" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="system" 
                      name="System Resources" 
                      stroke="#2196f3" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render alerts list
  const renderAlertsList = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Alerts</Typography>
              {alerts.length > 0 ? (
                <List>
                  {alerts.map((alert) => (
                    <React.Fragment key={alert._id}>
                      <ListItem>
                        <ListItemIcon>
                          {renderAlertLevelIcon(alert.level)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="subtitle1">{alert.message}</Typography>
                              <Typography variant="caption">{formatDate(alert.timestamp)}</Typography>
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                Source: {alert.source}
                              </Typography>
                              <br />
                              <Typography variant="body2" component="span">
                                Status: {alert.resolved ? 'Resolved' : 'Active'}
                                {alert.acknowledged && ' (Acknowledged)'}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2">No recent alerts</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Main render
  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>System Health Dashboard</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<CheckIcon />} label="Health Overview" />
          <Tab icon={<TimelineIcon />} label="Metrics" />
          <Tab icon={<WarningIcon />} label="Alerts" />
        </Tabs>
      </Paper>
      
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {activeTab === 0 && renderHealthOverview()}
          {activeTab === 1 && renderMetricsChart()}
          {activeTab === 2 && renderAlertsList()}
        </Box>
      )}
    </Box>
  );
};

export default SystemHealthDashboard;
