import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Tab, Spinner, Alert } from 'react-bootstrap';
import DateRangePicker from './DateRangePicker';
import OverviewPanel from './panels/OverviewPanel';
import ConversationsPanel from './panels/ConversationsPanel';
import TemplatesPanel from './panels/TemplatesPanel';
import UserEngagementPanel from './panels/UserEngagementPanel';
import ResponseQualityPanel from './panels/ResponseQualityPanel';
import AnalyticsDashboardService from '../../services/analytics-dashboard.service';

/**
 * Analytics Dashboard Component
 * Main container for the analytics dashboard with tab navigation
 */
const AnalyticsDashboard = () => {
  // State for date range
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  
  // State for analytics data
  const [overviewData, setOverviewData] = useState(null);
  const [conversationsData, setConversationsData] = useState(null);
  const [templatesData, setTemplatesData] = useState(null);
  const [userEngagementData, setUserEngagementData] = useState(null);
  const [responseQualityData, setResponseQualityData] = useState(null);
  
  // State for loading and errors
  const [loading, setLoading] = useState({
    overview: false,
    conversations: false,
    templates: false,
    userEngagement: false,
    responseQuality: false
  });
  const [error, setError] = useState(null);
  
  // Handle date range change
  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
  };
  
  // Fetch overview data
  const fetchOverviewData = async () => {
    setLoading(prev => ({ ...prev, overview: true }));
    try {
      const startDateStr = dateRange.startDate.toISOString().split('T')[0];
      const endDateStr = dateRange.endDate.toISOString().split('T')[0];
      
      const response = await AnalyticsDashboardService.getOverview(startDateStr, endDateStr);
      
      if (response.success) {
        setOverviewData(response.data);
      } else {
        setError(`Failed to load overview data: ${response.error}`);
      }
    } catch (err) {
      setError(`Error fetching overview data: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, overview: false }));
    }
  };
  
  // Fetch conversations data
  const fetchConversationsData = async () => {
    setLoading(prev => ({ ...prev, conversations: true }));
    try {
      const startDateStr = dateRange.startDate.toISOString().split('T')[0];
      const endDateStr = dateRange.endDate.toISOString().split('T')[0];
      
      const response = await AnalyticsDashboardService.getConversations(startDateStr, endDateStr);
      
      if (response.success) {
        setConversationsData(response.data);
      } else {
        setError(`Failed to load conversations data: ${response.error}`);
      }
    } catch (err) {
      setError(`Error fetching conversations data: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, conversations: false }));
    }
  };
  
  // Fetch templates data
  const fetchTemplatesData = async () => {
    setLoading(prev => ({ ...prev, templates: true }));
    try {
      const startDateStr = dateRange.startDate.toISOString().split('T')[0];
      const endDateStr = dateRange.endDate.toISOString().split('T')[0];
      
      const response = await AnalyticsDashboardService.getTemplates(startDateStr, endDateStr);
      
      if (response.success) {
        setTemplatesData(response.data);
      } else {
        setError(`Failed to load templates data: ${response.error}`);
      }
    } catch (err) {
      setError(`Error fetching templates data: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, templates: false }));
    }
  };
  
  // Fetch user engagement data
  const fetchUserEngagementData = async () => {
    setLoading(prev => ({ ...prev, userEngagement: true }));
    try {
      const startDateStr = dateRange.startDate.toISOString().split('T')[0];
      const endDateStr = dateRange.endDate.toISOString().split('T')[0];
      
      const response = await AnalyticsDashboardService.getUserEngagement(startDateStr, endDateStr);
      
      if (response.success) {
        setUserEngagementData(response.data);
      } else {
        setError(`Failed to load user engagement data: ${response.error}`);
      }
    } catch (err) {
      setError(`Error fetching user engagement data: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, userEngagement: false }));
    }
  };
  
  // Fetch response quality data
  const fetchResponseQualityData = async () => {
    setLoading(prev => ({ ...prev, responseQuality: true }));
    try {
      const startDateStr = dateRange.startDate.toISOString().split('T')[0];
      const endDateStr = dateRange.endDate.toISOString().split('T')[0];
      
      const response = await AnalyticsDashboardService.getResponseQuality(startDateStr, endDateStr);
      
      if (response.success) {
        setResponseQualityData(response.data);
      } else {
        setError(`Failed to load response quality data: ${response.error}`);
      }
    } catch (err) {
      setError(`Error fetching response quality data: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, responseQuality: false }));
    }
  };
  
  // Fetch all data when date range changes
  useEffect(() => {
    fetchOverviewData();
    fetchConversationsData();
    fetchTemplatesData();
    fetchUserEngagementData();
    fetchResponseQualityData();
  }, [dateRange]);
  
  // Handle tab selection to fetch data on demand
  const handleTabSelect = (key) => {
    switch (key) {
      case 'overview':
        if (!overviewData) fetchOverviewData();
        break;
      case 'conversations':
        if (!conversationsData) fetchConversationsData();
        break;
      case 'templates':
        if (!templatesData) fetchTemplatesData();
        break;
      case 'userEngagement':
        if (!userEngagementData) fetchUserEngagementData();
        break;
      case 'responseQuality':
        if (!responseQualityData) fetchResponseQualityData();
        break;
      default:
        break;
    }
  };
  
  return (
    <Container fluid className="analytics-dashboard p-4">
      <Row className="mb-4">
        <Col>
          <h1>Analytics Dashboard</h1>
          <p className="text-muted">
            Monitor and analyze chatbot performance, user engagement, and conversation metrics
          </p>
        </Col>
        <Col md={4} className="d-flex justify-content-end align-items-center">
          <DateRangePicker 
            startDate={dateRange.startDate} 
            endDate={dateRange.endDate} 
            onChange={handleDateRangeChange} 
          />
        </Col>
      </Row>
      
      {/* Display any errors */}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <Tab.Container defaultActiveKey="overview" onSelect={handleTabSelect}>
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
                {loading.overview ? (
                  <div className="text-center p-5">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : (
                  <OverviewPanel data={overviewData} />
                )}
              </Tab.Pane>
              <Tab.Pane eventKey="conversations">
                {loading.conversations ? (
                  <div className="text-center p-5">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : (
                  <ConversationsPanel data={conversationsData} />
                )}
              </Tab.Pane>
              <Tab.Pane eventKey="templates">
                {loading.templates ? (
                  <div className="text-center p-5">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : (
                  <TemplatesPanel data={templatesData} />
                )}
              </Tab.Pane>
              <Tab.Pane eventKey="userEngagement">
                {loading.userEngagement ? (
                  <div className="text-center p-5">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : (
                  <UserEngagementPanel data={userEngagementData} />
                )}
              </Tab.Pane>
              <Tab.Pane eventKey="responseQuality">
                {loading.responseQuality ? (
                  <div className="text-center p-5">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : (
                  <ResponseQualityPanel data={responseQualityData} />
                )}
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default AnalyticsDashboard;