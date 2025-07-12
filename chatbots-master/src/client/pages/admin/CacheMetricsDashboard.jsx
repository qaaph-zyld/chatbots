/**
 * Cache Metrics Dashboard Component
 * 
 * Displays real-time and historical cache metrics with interactive charts
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Box,
  Tabs,
  Tab,
  Paper,
  Divider,
  Alert,
  TextField,
  Slider,
  FormControlLabel,
  Switch,
  InputAdornment
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CachedIcon from '@mui/icons-material/Cached';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import SaveIcon from '@mui/icons-material/Save';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

/**
 * Cache Metrics Dashboard Component
 * 
 * Displays real-time and historical cache metrics with interactive charts
 */
const CacheMetricsDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [warmingStatus, setWarmingStatus] = useState({ isWarming: false, result: null });
  const [adaptiveTTLConfig, setAdaptiveTTLConfig] = useState(null);
  const [adaptiveTTLEnabled, setAdaptiveTTLEnabled] = useState(false);
  const [adaptiveTTLLoading, setAdaptiveTTLLoading] = useState(false);
  const [adaptiveTTLError, setAdaptiveTTLError] = useState(null);
  const [accessTracking, setAccessTracking] = useState({});
  const [decayStatus, setDecayStatus] = useState({ isDecaying: false, result: null });

  // Fetch current metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/metrics/cache');
      setMetrics(response.data.metrics);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to fetch cache metrics: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch adaptive TTL configuration
  const fetchAdaptiveTTLConfig = async () => {
    try {
      setAdaptiveTTLLoading(true);
      const response = await axios.get('/api/metrics/cache/adaptive-ttl');
      setAdaptiveTTLConfig(response.data.config);
      setAdaptiveTTLEnabled(response.data.config?.enabled || false);
      setAdaptiveTTLError(null);
    } catch (err) {
      setAdaptiveTTLError('Failed to fetch adaptive TTL configuration: ' + 
        (err.response?.data?.message || err.message));
    } finally {
      setAdaptiveTTLLoading(false);
    }
  };
  
  // Fetch resource access tracking data
  const fetchAccessTracking = async () => {
    try {
      const response = await axios.get('/api/metrics/cache/access-tracking');
      setAccessTracking(response.data.tracking || {});
    } catch (err) {
      console.error('Failed to fetch access tracking data:', err);
    }
  };

  // Fetch historical metrics
  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/metrics/cache/history?limit=24');
      setHistory(response.data.history);
    } catch (err) {
      console.error('Failed to fetch cache history:', err);
    }
  };

  // Trigger cache warming
  const triggerCacheWarming = async () => {
    try {
      setWarmingStatus({ isWarming: true, result: null });
      const response = await axios.post('/api/metrics/cache/warm');
      setWarmingStatus({ isWarming: false, result: response.data.result });
      
      // Refresh metrics after warming
      fetchMetrics();
    } catch (err) {
      setWarmingStatus({ 
        isWarming: false, 
        result: { error: err.response?.data?.message || err.message }
      });
    }
  };

  // Reset cache metrics
  const resetMetrics = async () => {
    try {
      await axios.post('/api/metrics/cache/reset');
      fetchMetrics();
      fetchHistory();
    } catch (err) {
      setError('Failed to reset metrics: ' + (err.response?.data?.message || err.message));
    }
  };
  
  // Update adaptive TTL configuration
  const updateAdaptiveTTLConfig = async () => {
    try {
      setAdaptiveTTLLoading(true);
      await axios.put('/api/metrics/cache/adaptive-ttl', { config: adaptiveTTLConfig });
      fetchAdaptiveTTLConfig();
    } catch (err) {
      setAdaptiveTTLError('Failed to update adaptive TTL configuration: ' + 
        (err.response?.data?.message || err.message));
    } finally {
      setAdaptiveTTLLoading(false);
    }
  };
  
  // Decay resource access counts
  const decayAccessCounts = async () => {
    try {
      setDecayStatus({ isDecaying: true, result: null });
      await axios.post('/api/metrics/cache/decay-access');
      setDecayStatus({ isDecaying: false, result: { success: true } });
      fetchAccessTracking();
    } catch (err) {
      setDecayStatus({ 
        isDecaying: false, 
        result: { error: err.response?.data?.message || err.message }
      });
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Set up automatic refresh
  useEffect(() => {
    fetchMetrics();
    fetchHistory();
    fetchAdaptiveTTLConfig();
    fetchAccessTracking();

    const intervalId = setInterval(() => {
      fetchMetrics();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  // Prepare data for charts
  const prepareResourceData = () => {
    if (!metrics || !metrics.resources) return [];
    
    return Object.entries(metrics.resources).map(([name, data]) => ({
      name,
      hits: data.hits,
      misses: data.misses,
      hitRate: data.hitRate * 100, // Convert to percentage
      avgLatency: data.avgLatency,
      avgSize: data.avgSize / 1024, // Convert to KB
      ttl: data.ttl || adaptiveTTLConfig?.defaultTTL || 300 // Include TTL if available
    }));
  };

  const prepareHistoryData = () => {
    return history.map(snapshot => ({
      time: new Date(snapshot.timestamp).toLocaleTimeString(),
      hitRate: snapshot.overall.hitRate * 100, // Convert to percentage
      hits: snapshot.overall.hits,
      misses: snapshot.overall.misses
    }));
  };

  const preparePieData = () => {
    if (!metrics || !metrics.overall) return [];
    
    return [
      { name: 'Hits', value: metrics.overall.hits },
      { name: 'Misses', value: metrics.overall.misses }
    ];
  };

  // Render loading state
  if (loading && !metrics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1">
          <CachedIcon fontSize="large" sx={{ mr: 1, verticalAlign: 'middle' }} />
          Cache Metrics Dashboard
        </Typography>
        <Box>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={fetchMetrics} 
            variant="outlined" 
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button 
            startIcon={<CachedIcon />} 
            onClick={triggerCacheWarming} 
            variant="contained" 
            color="primary"
            disabled={warmingStatus.isWarming}
          >
            {warmingStatus.isWarming ? 'Warming...' : 'Warm Cache'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {warmingStatus.result && !warmingStatus.result.error && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Cache warming completed: {warmingStatus.result.warmed}/{warmingStatus.result.total} resources warmed in {warmingStatus.result.duration}ms
        </Alert>
      )}

      {warmingStatus.result && warmingStatus.result.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Cache warming failed: {warmingStatus.result.error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="textSecondary">
          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
          Last refreshed: {lastRefreshed.toLocaleTimeString()}
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Overview" icon={<SpeedIcon />} iconPosition="start" />
          <Tab label="Resources" icon={<StorageIcon />} iconPosition="start" />
          <Tab label="History" icon={<AccessTimeIcon />} iconPosition="start" />
          <Tab label="Adaptive TTL" icon={<TuneIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      {activeTab === 0 && metrics && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Overall Hit Rate
                </Typography>
                <Typography variant="h3">
                  {(metrics.overall.hitRate * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {metrics.overall.hits} hits / {metrics.overall.total} requests
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Cache Hits
                </Typography>
                <Typography variant="h3">
                  {metrics.overall.hits}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Successful cache retrievals
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Cache Misses
                </Typography>
                <Typography variant="h3">
                  {metrics.overall.misses}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Cache lookups that missed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Resource Types
                </Typography>
                <Typography variant="h3">
                  {Object.keys(metrics.resources).length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Different cached resources
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Hit vs Miss Distribution</Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={preparePieData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {preparePieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Recent Hit Rate Trend</Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={prepareHistoryData().slice(-10)}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Hit Rate']} />
                      <Legend />
                      <Line type="monotone" dataKey="hitRate" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Resources Tab */}
      {activeTab === 1 && metrics && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6">Resource Hit Rates</Typography>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareResourceData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="hits" name="Hits" fill="#8884d8" />
                      <Bar yAxisId="left" dataKey="misses" name="Misses" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Average Latency by Resource</Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareResourceData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgLatency" name="Avg. Latency (ms)" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Average Size by Resource</Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareResourceData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgSize" name="Avg. Size (KB)" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* History Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Historical Hit Rate</Typography>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="secondary" 
                    onClick={resetMetrics}
                  >
                    Reset Metrics
                  </Button>
                </Box>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={prepareHistoryData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Hit Rate']} />
                      <Legend />
                      <Line type="monotone" dataKey="hitRate" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6">Historical Hits and Misses</Typography>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={prepareHistoryData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="hits" stroke="#00C49F" />
                      <Line type="monotone" dataKey="misses" stroke="#FF8042" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Adaptive TTL Tab */}
      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Adaptive TTL Configuration
          </Typography>
          
          {adaptiveTTLError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {adaptiveTTLError}
            </Alert>
          )}
          
          {adaptiveTTLLoading && !adaptiveTTLConfig ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Configuration Card */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Configuration
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={updateAdaptiveTTLConfig}
                        disabled={adaptiveTTLLoading}
                      >
                        Save Changes
                      </Button>
                    </Box>
                    
                    <Box mb={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={adaptiveTTLEnabled}
                            onChange={(e) => setAdaptiveTTLEnabled(e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Enable Adaptive TTL"
                      />
                    </Box>
                    
                    {adaptiveTTLConfig && (
                      <>
                        <Box mb={3}>
                          <Typography gutterBottom>Default TTL (seconds)</Typography>
                          <TextField
                            type="number"
                            value={adaptiveTTLConfig.defaultTTL}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value > 0) {
                                setAdaptiveTTLConfig({
                                  ...adaptiveTTLConfig,
                                  defaultTTL: value
                                });
                              }
                            }}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">sec</InputAdornment>,
                            }}
                            fullWidth
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                        
                        <Box mb={3}>
                          <Typography gutterBottom>Minimum TTL (seconds)</Typography>
                          <TextField
                            type="number"
                            value={adaptiveTTLConfig.minTTL}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value >= 0) {
                                setAdaptiveTTLConfig({
                                  ...adaptiveTTLConfig,
                                  minTTL: value
                                });
                              }
                            }}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">sec</InputAdornment>,
                            }}
                            fullWidth
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                        
                        <Box mb={3}>
                          <Typography gutterBottom>Maximum TTL (seconds)</Typography>
                          <TextField
                            type="number"
                            value={adaptiveTTLConfig.maxTTL}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value > 0) {
                                setAdaptiveTTLConfig({
                                  ...adaptiveTTLConfig,
                                  maxTTL: value
                                });
                              }
                            }}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">sec</InputAdornment>,
                            }}
                            fullWidth
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                        
                        <Box mb={3}>
                          <Typography gutterBottom>Decay Interval (seconds)</Typography>
                          <TextField
                            type="number"
                            value={adaptiveTTLConfig.decayInterval}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value > 0) {
                                setAdaptiveTTLConfig({
                                  ...adaptiveTTLConfig,
                                  decayInterval: value
                                });
                              }
                            }}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">sec</InputAdornment>,
                            }}
                            fullWidth
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                        
                        <Box mb={3}>
                          <Typography gutterBottom>Decay Factor (0-1)</Typography>
                          <Slider
                            value={adaptiveTTLConfig.decayFactor}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(e, value) => {
                              setAdaptiveTTLConfig({
                                ...adaptiveTTLConfig,
                                decayFactor: value
                              });
                            }}
                            valueLabelDisplay="auto"
                          />
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Weights Card */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <TuneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Factor Weights
                    </Typography>
                    
                    {adaptiveTTLConfig?.weights && (
                      <>
                        <Box mb={3}>
                          <Typography gutterBottom>Access Frequency Weight ({adaptiveTTLConfig.weights.accessFrequency})</Typography>
                          <Slider
                            value={adaptiveTTLConfig.weights.accessFrequency}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(e, value) => {
                              setAdaptiveTTLConfig({
                                ...adaptiveTTLConfig,
                                weights: {
                                  ...adaptiveTTLConfig.weights,
                                  accessFrequency: value
                                }
                              });
                            }}
                            valueLabelDisplay="auto"
                          />
                        </Box>
                        
                        <Box mb={3}>
                          <Typography gutterBottom>Miss Rate Weight ({adaptiveTTLConfig.weights.missRate})</Typography>
                          <Slider
                            value={adaptiveTTLConfig.weights.missRate}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(e, value) => {
                              setAdaptiveTTLConfig({
                                ...adaptiveTTLConfig,
                                weights: {
                                  ...adaptiveTTLConfig.weights,
                                  missRate: value
                                }
                              });
                            }}
                            valueLabelDisplay="auto"
                          />
                        </Box>
                        
                        <Box mb={3}>
                          <Typography gutterBottom>Latency Weight ({adaptiveTTLConfig.weights.latency})</Typography>
                          <Slider
                            value={adaptiveTTLConfig.weights.latency}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(e, value) => {
                              setAdaptiveTTLConfig({
                                ...adaptiveTTLConfig,
                                weights: {
                                  ...adaptiveTTLConfig.weights,
                                  latency: value
                                }
                              });
                            }}
                            valueLabelDisplay="auto"
                          />
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Resource Access Tracking Card */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Resource Access Tracking
                      </Typography>
                      <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<DeleteSweepIcon />}
                        onClick={decayAccessCounts}
                        disabled={decayStatus.isDecaying}
                      >
                        {decayStatus.isDecaying ? 'Decaying...' : 'Decay Access Counts'}
                      </Button>
                    </Box>
                    
                    {decayStatus.result?.error && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {decayStatus.result.error}
                      </Alert>
                    )}
                    
                    {decayStatus.result?.success && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Access counts decayed successfully
                      </Alert>
                    )}
                    
                    {Object.keys(accessTracking).length > 0 ? (
                      <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Resource Type</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Resource Key</th>
                              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Access Count</th>
                              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Last Accessed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(accessTracking).map(([resourceType, resources]) => (
                              Object.entries(resources).map(([key, data], idx) => (
                                <tr key={`${resourceType}-${key}-${idx}`}>
                                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{resourceType}</td>
                                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                    {key.length > 50 ? `${key.substring(0, 50)}...` : key}
                                  </td>
                                  <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>
                                    {data.count}
                                  </td>
                                  <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>
                                    {new Date(data.lastAccessed).toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    ) : (
                      <Typography variant="body1" color="textSecondary" align="center" py={3}>
                        No resource access tracking data available
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      )}
    </div>
  );
};

export default CacheMetricsDashboard;
