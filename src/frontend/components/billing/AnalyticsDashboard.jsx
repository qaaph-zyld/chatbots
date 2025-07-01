import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import axios from 'axios';
import { formatCurrency } from '../../utils/formatters';

// Register Chart.js components
Chart.register(...registerables);

/**
 * Subscription Analytics Dashboard Component
 * Displays key subscription metrics and charts
 */
const AnalyticsDashboard = () => {
  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [mrrData, setMrrData] = useState(null);
  const [churnData, setChurnData] = useState(null);
  const [revenueByPlan, setRevenueByPlan] = useState(null);
  const [growthData, setGrowthData] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [ltvData, setLtvData] = useState(null);
  const [paymentRecoveryData, setPaymentRecoveryData] = useState(null);
  const [error, setError] = useState(null);
  
  // Date range state
  const [dateRange, setDateRange] = useState('12m'); // 3m, 6m, 12m, ytd, all
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [
          summaryRes,
          mrrRes,
          churnRes,
          revenueByPlanRes,
          growthRes,
          paymentSuccessRes,
          ltvRes,
          paymentRecoveryRes
        ] = await Promise.all([
          axios.get('/api/billing/analytics/dashboard'),
          axios.get('/api/billing/analytics/mrr'),
          axios.get('/api/billing/analytics/churn'),
          axios.get('/api/billing/analytics/revenue-by-plan'),
          axios.get('/api/billing/analytics/growth'),
          axios.get('/api/billing/analytics/payment-success'),
          axios.get('/api/billing/analytics/ltv'),
          axios.get('/api/billing/analytics/payment-recovery')
        ]);
        
        // Set state with response data
        setSummary(summaryRes.data);
        setMrrData(mrrRes.data);
        setChurnData(churnRes.data);
        setRevenueByPlan(revenueByPlanRes.data);
        setGrowthData(growthRes.data);
        setPaymentSuccess(paymentSuccessRes.data);
        setLtvData(ltvRes.data);
        setPaymentRecoveryData(paymentRecoveryRes.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [dateRange]);
  
  // Prepare MRR chart data
  const mrrChartData = {
    labels: mrrData?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Monthly Recurring Revenue',
        data: mrrData?.map(item => item.value) || [],
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      }
    ]
  };
  
  // Prepare churn chart data
  const churnChartData = {
    labels: churnData?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Churn Rate (%)',
        data: churnData?.map(item => item.value) || [],
        fill: false,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        tension: 0.1
      }
    ]
  };
  
  // Prepare revenue by plan chart data
  const revenueByPlanChartData = {
    labels: revenueByPlan?.map(item => item.planName) || [],
    datasets: [
      {
        label: 'Monthly Revenue by Plan',
        data: revenueByPlan?.map(item => item.monthlyRevenue) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Prepare growth chart data
  const growthChartData = {
    labels: growthData?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Total Subscriptions',
        data: growthData?.map(item => item.total) || [],
        fill: false,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.1
      },
      {
        label: 'New Subscriptions',
        data: growthData?.map(item => item.new) || [],
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      },
      {
        label: 'Canceled Subscriptions',
        data: growthData?.map(item => item.canceled) || [],
        fill: false,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        tension: 0.1
      }
    ]
  };
  
  // Prepare payment success chart data
  const paymentSuccessChartData = {
    labels: ['Successful', 'Failed'],
    datasets: [
      {
        data: paymentSuccess ? [paymentSuccess.successfulAttempts, paymentSuccess.failedAttempts] : [0, 0],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Prepare payment recovery chart data
  const paymentRecoveryChartData = {
    labels: paymentRecoveryData?.timeSeries?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Recovery Attempts',
        data: paymentRecoveryData?.timeSeries?.map(item => item.total) || [],
        fill: false,
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        tension: 0.1
      },
      {
        label: 'Successful Recoveries',
        data: paymentRecoveryData?.timeSeries?.map(item => item.successful) || [],
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      },
      {
        label: 'Failed Recoveries',
        data: paymentRecoveryData?.timeSeries?.map(item => item.failed) || [],
        fill: false,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        tension: 0.1
      }
    ]
  };
  
  // Prepare payment recovery success rate pie chart data
  const paymentRecoveryRateChartData = {
    labels: ['Successful', 'Failed', 'Pending'],
    datasets: [
      {
        data: paymentRecoveryData ? [
          paymentRecoveryData.successfulAttempts,
          paymentRecoveryData.failedAttempts,
          paymentRecoveryData.pendingAttempts
        ] : [0, 0, 0],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };
  
  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading analytics data...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="mt-4">
        <div className="alert alert-danger">{error}</div>
      </Container>
    );
  }
  
  return (
    <Container fluid className="mt-4">
      <h1 className="mb-4">Subscription Analytics Dashboard</h1>
      
      {/* Date range selector */}
      <div className="mb-4">
        <div className="btn-group" role="group">
          <button 
            type="button" 
            className={`btn ${dateRange === '3m' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleDateRangeChange('3m')}
          >
            3 Months
          </button>
          <button 
            type="button" 
            className={`btn ${dateRange === '6m' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleDateRangeChange('6m')}
          >
            6 Months
          </button>
          <button 
            type="button" 
            className={`btn ${dateRange === '12m' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleDateRangeChange('12m')}
          >
            12 Months
          </button>
          <button 
            type="button" 
            className={`btn ${dateRange === 'ytd' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleDateRangeChange('ytd')}
          >
            Year to Date
          </button>
          <button 
            type="button" 
            className={`btn ${dateRange === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleDateRangeChange('all')}
          >
            All Time
          </button>
        </div>
      </div>
      
      {/* Summary cards */}
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Monthly Revenue</Card.Title>
              <h2 className="text-primary">{formatCurrency(summary?.monthlyRevenue || 0)}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Active Subscriptions</Card.Title>
              <h2 className="text-success">{summary?.activeSubscriptions || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Churn Rate</Card.Title>
              <h2 className="text-danger">{summary?.churnRate || 0}%</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>New Subscriptions (This Month)</Card.Title>
              <h2 className="text-success">{summary?.newSubscriptionsThisMonth || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Canceled Subscriptions (This Month)</Card.Title>
              <h2 className="text-danger">{summary?.canceledSubscriptionsThisMonth || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Net Growth (This Month)</Card.Title>
              <h2 className={summary?.netGrowthThisMonth >= 0 ? 'text-success' : 'text-danger'}>
                {summary?.netGrowthThisMonth || 0}
              </h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Payment Recovery Summary */}
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Payment Recovery Rate</Card.Title>
              <h2 className="text-primary">{summary?.paymentRecovery?.recoveryRate || 0}%</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Revenue Recovered</Card.Title>
              <h2 className="text-success">{formatCurrency(summary?.paymentRecovery?.revenueRecovered || 0)}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Subscriptions Recovered</Card.Title>
              <h2 className="text-info">{summary?.paymentRecovery?.subscriptionsCount || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Charts */}
      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Monthly Recurring Revenue</Card.Title>
              <div style={{ height: '300px' }}>
                <Line 
                  data={mrrChartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => formatCurrency(value)
                        }
                      }
                    }
                  }} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Churn Rate</Card.Title>
              <div style={{ height: '300px' }}>
                <Line 
                  data={churnChartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `${value}%`
                        }
                      }
                    }
                  }} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Revenue by Plan</Card.Title>
              <div style={{ height: '300px' }}>
                <Bar 
                  data={revenueByPlanChartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => formatCurrency(value)
                        }
                      }
                    }
                  }} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Payment Success Rate</Card.Title>
              <div style={{ height: '300px' }}>
                <Pie 
                  data={paymentSuccessChartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = paymentSuccess?.totalAttempts || 1;
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
              <div className="text-center mt-3">
                <p>Success Rate: {paymentSuccess?.successRate || 0}%</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col lg={12}>
          <Card>
            <Card.Body>
              <Card.Title>Subscription Growth</Card.Title>
              <div style={{ height: '300px' }}>
                <Line 
                  data={growthChartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Payment Recovery Analytics Section */}
      <h3 className="mt-5 mb-4">Payment Recovery Analytics</h3>
      
      <Row className="mb-4">
        <Col lg={8}>
          <Card>
            <Card.Body>
              <Card.Title>Payment Recovery Trends</Card.Title>
              <div style={{ height: '300px' }}>
                <Line 
                  data={paymentRecoveryChartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Body>
              <Card.Title>Recovery Distribution</Card.Title>
              <div style={{ height: '300px' }}>
                <Pie 
                  data={paymentRecoveryRateChartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = paymentRecoveryData?.totalAttempts || 1;
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Common Payment Failure Reasons</Card.Title>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Error Code</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentRecoveryData?.mostCommonErrors?.length > 0 ? (
                      paymentRecoveryData.mostCommonErrors.map((error, index) => {
                        const percentage = paymentRecoveryData.failedAttempts > 0 ?
                          ((error.count / paymentRecoveryData.failedAttempts) * 100).toFixed(1) : '0';
                        return (
                          <tr key={index}>
                            <td>{error.code}</td>
                            <td>{error.count}</td>
                            <td>{percentage}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">No error data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Customer LTV */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card>
            <Card.Body>
              <Card.Title>Customer Lifetime Value</Card.Title>
              <Row>
                <Col md={4} className="text-center">
                  <h5>Average Monthly Revenue</h5>
                  <h3 className="text-primary">{formatCurrency(ltvData?.averageMonthlyRevenue || 0)}</h3>
                </Col>
                <Col md={4} className="text-center">
                  <h5>Average Lifetime (Months)</h5>
                  <h3 className="text-info">{ltvData?.averageLifetimeMonths || 0}</h3>
                </Col>
                <Col md={4} className="text-center">
                  <h5>Customer LTV</h5>
                  <h3 className="text-success">{formatCurrency(ltvData?.customerLTV || 0)}</h3>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AnalyticsDashboard;
