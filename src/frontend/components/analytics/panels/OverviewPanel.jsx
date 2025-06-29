import React from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, Alert } from 'react-bootstrap';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

/**
 * Overview Panel Component
 * Displays key metrics and trends for the Analytics Dashboard
 */
const OverviewPanel = ({ data }) => {
  // Handle loading or error states
  if (!data) {
    return (
      <Alert variant="info">
        Loading overview data...
      </Alert>
    );
  }

  if (!data.success) {
    return (
      <Alert variant="danger">
        Failed to load overview data: {data.error || 'Unknown error'}
      </Alert>
    );
  }

  const { metrics, trends } = data;

  return (
    <div className="overview-panel">
      <h2 className="mb-4">Dashboard Overview</h2>
      
      {/* Key Metrics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Total Conversations</Card.Title>
              <div className="metric-value">{metrics.totalConversations.toLocaleString()}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Active Users</Card.Title>
              <div className="metric-value">{metrics.activeUsers.toLocaleString()}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Avg. Response Time</Card.Title>
              <div className="metric-value">{metrics.avgResponseTime.toFixed(1)}s</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Avg. User Rating</Card.Title>
              <div className="metric-value">{metrics.avgUserRating.toFixed(1)}/5</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Conversation Trend Chart */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Conversation Trends</Card.Title>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={trends.conversations}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => {
                  const d = new Date(date);
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [value, 'Conversations']}
                labelFormatter={(date) => {
                  const d = new Date(date);
                  return d.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                name="Conversations" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
      
      {/* User Trend Chart */}
      <Card>
        <Card.Body>
          <Card.Title>User Trends</Card.Title>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={trends.users}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => {
                  const d = new Date(date);
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [value, 'Users']}
                labelFormatter={(date) => {
                  const d = new Date(date);
                  return d.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                name="Active Users" 
                stroke="#82ca9d" 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    </div>
  );
};

OverviewPanel.propTypes = {
  data: PropTypes.shape({
    success: PropTypes.bool,
    error: PropTypes.string,
    metrics: PropTypes.shape({
      totalConversations: PropTypes.number,
      activeUsers: PropTypes.number,
      avgResponseTime: PropTypes.number,
      avgUserRating: PropTypes.number
    }),
    trends: PropTypes.shape({
      conversations: PropTypes.arrayOf(
        PropTypes.shape({
          date: PropTypes.string,
          count: PropTypes.number
        })
      ),
      users: PropTypes.arrayOf(
        PropTypes.shape({
          date: PropTypes.string,
          count: PropTypes.number
        })
      )
    })
  })
};

export default OverviewPanel;