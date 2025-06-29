import React from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, Alert } from 'react-bootstrap';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

/**
 * Response Quality Panel Component
 * Displays response time, sentiment, and quality metrics
 */
const ResponseQualityPanel = ({ data }) => {
  // Handle loading or error states
  if (!data) {
    return (
      <Alert variant="info">
        Loading response quality data...
      </Alert>
    );
  }

  if (!data.success) {
    return (
      <Alert variant="danger">
        Failed to load response quality data: {data.error || 'Unknown error'}
      </Alert>
    );
  }

  const { metrics, sentimentDistribution, responseTimeDistribution } = data;
  
  // Colors for charts
  const SENTIMENT_COLORS = ['#00C49F', '#FFBB28', '#FF8042'];
  const RESPONSE_TIME_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="response-quality-panel">
      <h2 className="mb-4">Response Quality Analytics</h2>
      
      {/* Key Metrics */}
      <Row className="mb-4">
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
              <div className="rating-stars">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.round(metrics.avgUserRating) ? 'star filled' : 'star'}>
                    ★
                  </span>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Issue Resolution Rate</Card.Title>
              <div className="metric-value">{(metrics.issueResolutionRate * 100).toFixed(0)}%</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Handoff Rate</Card.Title>
              <div className="metric-value">{(metrics.handoffRate * 100).toFixed(0)}%</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Sentiment Distribution */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Sentiment Distribution</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sentimentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="sentiment"
                    label={({ sentiment, percent }) => `${sentiment} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sentimentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[index % SENTIMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} (${(props.payload.percentage * 100).toFixed(0)}%)`, 
                      name
                    ]} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Response Time Distribution</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={responseTimeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="range"
                    label={({ range, percent }) => `${range} ${(percent * 100).toFixed(0)}%`}
                  >
                    {responseTimeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RESPONSE_TIME_COLORS[index % RESPONSE_TIME_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} (${(props.payload.percentage * 100).toFixed(0)}%)`, 
                      name
                    ]} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Detailed Metrics */}
      <Card>
        <Card.Body>
          <Card.Title>Response Time Analysis</Card.Title>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={responseTimeDistribution}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tickFormatter={(value) => `${value}%`} />
              <Tooltip 
                formatter={(value, name, props) => {
                  if (name === 'Count') return [value, name];
                  return [`${value}%`, name];
                }}
              />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="count" 
                name="Count" 
                fill="#8884d8" 
              />
              <Bar 
                yAxisId="right" 
                dataKey="percentage" 
                name="Percentage" 
                fill="#82ca9d"
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
      
      {/* Quality Improvement Suggestions */}
      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Quality Improvement Insights</Card.Title>
          <div className="insights-container">
            {/* Dynamic insights based on data */}
            {metrics.avgResponseTime > 3 && (
              <Alert variant="warning">
                <strong>Response Time Alert:</strong> Average response time is above the recommended threshold (3s). 
                Consider optimizing chatbot response generation.
              </Alert>
            )}
            
            {metrics.handoffRate > 0.15 && (
              <Alert variant="warning">
                <strong>High Handoff Rate:</strong> Handoff rate is above 15%. 
                Review common handoff scenarios to improve chatbot capabilities.
              </Alert>
            )}
            
            {sentimentDistribution.find(item => item.sentiment === 'Negative')?.percentage > 0.1 && (
              <Alert variant="warning">
                <strong>Negative Sentiment Alert:</strong> Negative sentiment responses exceed 10%. 
                Review conversation flows with negative outcomes.
              </Alert>
            )}
            
            {metrics.avgUserRating < 4.0 && (
              <Alert variant="warning">
                <strong>User Rating Alert:</strong> Average user rating is below 4.0. 
                Consider reviewing user feedback for improvement opportunities.
              </Alert>
            )}
            
            {/* Default insight if no alerts are triggered */}
            {metrics.avgResponseTime <= 3 && 
             metrics.handoffRate <= 0.15 && 
             (sentimentDistribution.find(item => item.sentiment === 'Negative')?.percentage <= 0.1 || 
              !sentimentDistribution.find(item => item.sentiment === 'Negative')) && 
             metrics.avgUserRating >= 4.0 && (
              <Alert variant="success">
                <strong>Good Performance:</strong> All quality metrics are within acceptable ranges. 
                Continue monitoring for sustained performance.
              </Alert>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

ResponseQualityPanel.propTypes = {
  data: PropTypes.shape({
    success: PropTypes.bool,
    error: PropTypes.string,
    metrics: PropTypes.shape({
      avgResponseTime: PropTypes.number,
      avgUserRating: PropTypes.number,
      issueResolutionRate: PropTypes.number,
      handoffRate: PropTypes.number
    }),
    sentimentDistribution: PropTypes.arrayOf(
      PropTypes.shape({
        sentiment: PropTypes.string,
        count: PropTypes.number,
        percentage: PropTypes.number
      })
    ),
    responseTimeDistribution: PropTypes.arrayOf(
      PropTypes.shape({
        range: PropTypes.string,
        count: PropTypes.number,
        percentage: PropTypes.number
      })
    )
  })
};

export default ResponseQualityPanel;