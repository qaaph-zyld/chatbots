import React from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, Alert, Table } from 'react-bootstrap';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

/**
 * Templates Panel Component
 * Displays template usage statistics and performance metrics
 */
const TemplatesPanel = ({ data }) => {
  // Handle loading or error states
  if (!data) {
    return (
      <Alert variant="info">
        Loading template data...
      </Alert>
    );
  }

  if (!data.success) {
    return (
      <Alert variant="danger">
        Failed to load template data: {data.error || 'Unknown error'}
      </Alert>
    );
  }

  const { metrics, topTemplates } = data;
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  // Format data for pie chart
  const pieData = topTemplates.map(template => ({
    name: template.name,
    value: template.usage
  }));

  return (
    <div className="templates-panel">
      <h2 className="mb-4">Template Analytics</h2>
      
      {/* Key Metrics */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Total Templates</Card.Title>
              <div className="metric-value">{metrics.totalTemplates}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Active Templates</Card.Title>
              <div className="metric-value">{metrics.activeTemplates}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Avg. Template Usage</Card.Title>
              <div className="metric-value">{metrics.avgTemplateUsage.toFixed(1)}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Template Usage Charts */}
      <Row className="mb-4">
        <Col md={7}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Top Templates by Usage</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={topTemplates}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Usage Count']} />
                  <Legend />
                  <Bar 
                    dataKey="usage" 
                    name="Usage Count" 
                    fill="#8884d8" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={5}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Usage Distribution</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name.substring(0, 10)}${name.length > 10 ? '...' : ''} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Template Performance Table */}
      <Card>
        <Card.Body>
          <Card.Title>Template Performance</Card.Title>
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>Template Name</th>
                <th>Usage Count</th>
                <th>User Rating</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {topTemplates.map((template, index) => (
                <tr key={index}>
                  <td>{template.name}</td>
                  <td>{template.usage.toLocaleString()}</td>
                  <td>
                    {template.rating.toFixed(1)} / 5.0
                    {/* Star rating visualization */}
                    <div className="rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < Math.round(template.rating) ? 'star filled' : 'star'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {/* Simple performance indicator */}
                    <div className={`performance-indicator ${
                      template.rating >= 4.5 ? 'high' : 
                      template.rating >= 4.0 ? 'medium' : 'low'
                    }`}>
                      {template.rating >= 4.5 ? 'Excellent' : 
                       template.rating >= 4.0 ? 'Good' : 'Needs Improvement'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

TemplatesPanel.propTypes = {
  data: PropTypes.shape({
    success: PropTypes.bool,
    error: PropTypes.string,
    metrics: PropTypes.shape({
      totalTemplates: PropTypes.number,
      activeTemplates: PropTypes.number,
      avgTemplateUsage: PropTypes.number
    }),
    topTemplates: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        usage: PropTypes.number,
        rating: PropTypes.number
      })
    )
  })
};

export default TemplatesPanel;