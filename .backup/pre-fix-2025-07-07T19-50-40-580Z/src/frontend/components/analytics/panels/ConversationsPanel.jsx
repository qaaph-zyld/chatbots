import React from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, Alert } from 'react-bootstrap';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

/**
 * Conversations Panel Component
 * Displays conversation metrics, trends, and distributions
 */
const ConversationsPanel = ({ data }) => {
  // Handle loading or error states
  if (!data) {
    return (
      <Alert variant="info">
        Loading conversation data...
      </Alert>
    );
  }

  if (!data.success) {
    return (
      <Alert variant="danger">
        Failed to load conversation data: {data.error || 'Unknown error'}
      </Alert>
    );
  }

  const { metrics, distribution } = data;
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  return (
    <div className="conversations-panel">
      <h2 className="mb-4">Conversation Analytics</h2>
      
      {/* Key Metrics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Total Messages</Card.Title>
              <div className="metric-value">{metrics.totalMessages.toLocaleString()}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Avg. Messages/Conversation</Card.Title>
              <div className="metric-value">{metrics.avgMessagesPerConversation.toFixed(1)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Avg. Duration (min)</Card.Title>
              <div className="metric-value">{metrics.avgConversationDuration.toFixed(1)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Completion Rate</Card.Title>
              <div className="metric-value">{(metrics.completionRate * 100).toFixed(0)}%</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Distribution by Hour */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Conversation Distribution by Hour</Card.Title>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={distribution.byHour}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tickFormatter={(hour) => {
                  // Format hour as AM/PM
                  const h = hour % 12 || 12;
                  const ampm = hour < 12 ? 'AM' : 'PM';
                  return `${h} ${ampm}`;
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [value, 'Conversations']}
                labelFormatter={(hour) => {
                  // Format hour as AM/PM
                  const h = hour % 12 || 12;
                  const ampm = hour < 12 ? 'AM' : 'PM';
                  return `${h} ${ampm}`;
                }}
              />
              <Legend />
              <Bar 
                dataKey="count" 
                name="Conversations" 
                fill="#8884d8" 
              />
            </BarChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
      
      {/* Distribution by Day */}
      <Row>
        <Col md={8}>
          <Card>
            <Card.Body>
              <Card.Title>Conversation Distribution by Day</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={distribution.byDay}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Conversations']} />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    name="Conversations" 
                    fill="#82ca9d" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Title>Weekly Distribution</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribution.byDay}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="day"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {distribution.byDay.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

ConversationsPanel.propTypes = {
  data: PropTypes.shape({
    success: PropTypes.bool,
    error: PropTypes.string,
    metrics: PropTypes.shape({
      totalMessages: PropTypes.number,
      avgMessagesPerConversation: PropTypes.number,
      avgConversationDuration: PropTypes.number,
      completionRate: PropTypes.number
    }),
    distribution: PropTypes.shape({
      byHour: PropTypes.arrayOf(
        PropTypes.shape({
          hour: PropTypes.number,
          count: PropTypes.number
        })
      ),
      byDay: PropTypes.arrayOf(
        PropTypes.shape({
          day: PropTypes.string,
          count: PropTypes.number
        })
      )
    })
  })
};

export default ConversationsPanel;