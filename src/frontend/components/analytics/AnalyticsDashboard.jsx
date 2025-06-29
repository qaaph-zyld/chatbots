import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Tab, Alert, Spinner } from 'react-bootstrap';
import OverviewPanel from './panels/OverviewPanel';
import ConversationsPanel from './panels/ConversationsPanel';
import TemplatesPanel from './panels/TemplatesPanel';
import UserEngagementPanel from './panels/UserEngagementPanel';
import ResponseQualityPanel from './panels/ResponseQualityPanel';
import DateRangePicker from './common/DateRangePicker';
import analyticsDashboardService from '../../services/analytics-dashboard.service';

/**
 * Main Analytics Dashboard component
 * Provides tab navigation between different analytics panels
 */
const AnalyticsDashboard = () => {
  // State for date range
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
    period: 'daily'
  });

  // State for analytics data
  const [analyticsData, setAnalyticsData] = useState({
    overview: null,
    conversations: null,
    templates: null,
    userEngagement: null,
    responseQuality: null
  });

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch data when date range changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // For development/testing, use mock data
        const useMockData = process.env.REACT_APP_USE_MOCK_DATA === 'true';
        
        if (useMockData) {
          // Fetch mock data for each panel
          const overview = await analyticsDashboardService.getMockData('overview');
          const conversations = await analyticsDashboardService.getMockData('conversations');
          const templates = await analyticsDashboardService.getMockData('templates');
          const userEngagement = await analyticsDashboardService.getMockData('user-engagement');
          const responseQuality = await analyticsDashboardService.getMockData('response-quality');
          
          setAnalyticsData({
            overview,
            conversations,
            templates,
            userEngagement,
            responseQuality
          });
        } else {
          // Fetch real data from API
          const params = {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            period: dateRange.period
          };
          
          const data = await analyticsDashboardService.getAllAnalytics(params);
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange]);

  // Handle date range change
  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <Container fluid className="analytics-dashboard py-4">
      <Row className="mb-4">
        <Col>
          <h1>Analytics Dashboard</h1>
          <p className="text-muted">
            Comprehensive insights into your chatbot performance and user engagement
          </p>
        </Col>
        <Col md="auto">
          <DateRangePicker 
            dateRange={dateRange} 
            onChange={handleDateRangeChange} 
          />
        </Col>
      </Row>
      
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger">
              {error}
            </Alert>
          </Col>
        </Row>
      )}
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading analytics data...</p>
        </div>
      ) : (
        <Tab.Container id="analytics-tabs" activeKey={activeTab} onSelect={handleTabChange}>
          <Row>
            <Col md={2}>
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link eventKey="overview">Overview</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="conversations">Conversations</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="templates">Templates</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="userEngagement">User Engagement</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="responseQuality">Response Quality</Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
            <Col md={10}>
              <Tab.Content>
                <Tab.Pane eventKey="overview">
                  <OverviewPanel data={analyticsData.overview} />
                </Tab.Pane>
                <Tab.Pane eventKey="conversations">
                  <ConversationsPanel data={analyticsData.conversations} />
                </Tab.Pane>
                <Tab.Pane eventKey="templates">
                  <TemplatesPanel data={analyticsData.templates} />
                </Tab.Pane>
                <Tab.Pane eventKey="userEngagement">
                  <UserEngagementPanel data={analyticsData.userEngagement} />
                </Tab.Pane>
                <Tab.Pane eventKey="responseQuality">
                  <ResponseQualityPanel data={analyticsData.responseQuality} />
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      )}
    </Container>
  );
};

export default AnalyticsDashboard;