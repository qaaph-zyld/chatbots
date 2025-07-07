import React from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, Alert, ProgressBar, Table } from 'react-bootstrap';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

/**
 * User Engagement Panel Component
 * Displays user metrics, retention, and session data
 */
const UserEngagementPanel = ({ data }) => {
  // Handle loading or error states
  if (!data) {
    return (
      <Alert variant="info">
        Loading user engagement data...
      </Alert>
    );
  }

  if (!data.success) {
    return (
      <Alert variant="danger">
        Failed to load user engagement data: {data.error || 'Unknown error'}
      </Alert>
    );
  }

  const { metrics, retention, userSegments } = data;

  // Format retention data for chart
  const retentionData = [
    { name: 'Day 1', retention: retention.day1 * 100 },
    { name: 'Day 7', retention: retention.day7 * 100 },
    { name: 'Day 30', retention: retention.day30 * 100 }
  ];

  return (
    <div className="user-engagement-panel">
      <h2 className="mb-4">User Engagement Analytics</h2>
      
      {/* Key Metrics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">New Users</Card.Title>
              <div className="metric-value">{metrics.newUsers.toLocaleString()}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Returning Users</Card.Title>
              <div className="metric-value">{metrics.returningUsers.toLocaleString()}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Avg. Session Duration</Card.Title>
              <div className="metric-value">{metrics.avgSessionDuration.toFixed(1)} min</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card h-100">
            <Card.Body>
              <Card.Title className="text-muted">Avg. Sessions/User</Card.Title>
              <div className="metric-value">{metrics.avgSessionsPerUser.toFixed(1)}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* User Retention */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>User Retention</Card.Title>
          <Row>
            <Col md={8}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={retentionData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Retention']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="retention" 
                    name="Retention Rate" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </Col>
            <Col md={4}>
              <div className="retention-metrics">
                <h5>Retention Metrics</h5>
                <div className="retention-metric mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Day 1 Retention:</span>
                    <span>{(retention.day1 * 100).toFixed(1)}%</span>
                  </div>
                  <ProgressBar 
                    now={retention.day1 * 100} 
                    variant={retention.day1 > 0.6 ? "success" : retention.day1 > 0.4 ? "warning" : "danger"} 
                  />
                </div>
                <div className="retention-metric mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Day 7 Retention:</span>
                    <span>{(retention.day7 * 100).toFixed(1)}%</span>
                  </div>
                  <ProgressBar 
                    now={retention.day7 * 100} 
                    variant={retention.day7 > 0.4 ? "success" : retention.day7 > 0.2 ? "warning" : "danger"} 
                  />
                </div>
                <div className="retention-metric">
                  <div className="d-flex justify-content-between">
                    <span>Day 30 Retention:</span>
                    <span>{(retention.day30 * 100).toFixed(1)}%</span>
                  </div>
                  <ProgressBar 
                    now={retention.day30 * 100} 
                    variant={retention.day30 > 0.3 ? "success" : retention.day30 > 0.15 ? "warning" : "danger"} 
                  />
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* User Segments */}
      <Row>
        <Col md={7}>
          <Card>
            <Card.Body>
              <Card.Title>User Segments</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={userSegments}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="count" 
                    name="Users" 
                    fill="#8884d8" 
                  />
                  <Bar 
                    yAxisId="right" 
                    dataKey="avgSessions" 
                    name="Avg. Sessions" 
                    fill="#82ca9d" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={5}>
          <Card>
            <Card.Body>
              <Card.Title>User Segment Details</Card.Title>
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Segment</th>
                    <th>Users</th>
                    <th>Avg. Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {userSegments.map((segment, index) => (
                    <tr key={index}>
                      <td>{segment.segment}</td>
                      <td>{segment.count.toLocaleString()}</td>
                      <td>{segment.avgSessions.toFixed(1)}</td>
                    </tr>
                  ))}
                  <tr className="table-secondary">
                    <td><strong>Total</strong></td>
                    <td>
                      <strong>
                        {userSegments.reduce((sum, segment) => sum + segment.count, 0).toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <strong>
                        {(userSegments.reduce((sum, segment) => sum + segment.count * segment.avgSessions, 0) / 
                          userSegments.reduce((sum, segment) => sum + segment.count, 0)).toFixed(1)}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

UserEngagementPanel.propTypes = {
  data: PropTypes.shape({
    success: PropTypes.bool,
    error: PropTypes.string,
    metrics: PropTypes.shape({
      newUsers: PropTypes.number,
      returningUsers: PropTypes.number,
      avgSessionDuration: PropTypes.number,
      avgSessionsPerUser: PropTypes.number
    }),
    retention: PropTypes.shape({
      day1: PropTypes.number,
      day7: PropTypes.number,
      day30: PropTypes.number
    }),
    userSegments: PropTypes.arrayOf(
      PropTypes.shape({
        segment: PropTypes.string,
        count: PropTypes.number,
        avgSessions: PropTypes.number
      })
    )
  })
};

export default UserEngagementPanel;