import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/dateUtils';

/**
 * Subscriptions management page
 */
const SubscriptionsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [actionInProgress, setActionInProgress] = useState(false);
  
  // Fetch subscriptions and payment methods
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch subscriptions
        const subscriptionsResponse = await axios.get('/api/billing/subscriptions');
        setSubscriptions(subscriptionsResponse.data);
        
        // Fetch payment methods
        const paymentMethodsResponse = await axios.get('/api/billing/payment/methods');
        setPaymentMethods(paymentMethodsResponse.data.paymentMethods || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  /**
   * Handle subscription cancellation
   * @param {string} subscriptionId - ID of subscription to cancel
   */
  const handleCancelSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionInProgress(true);
      
      await axios.post(`/api/billing/subscriptions/${subscriptionId}/cancel`);
      
      // Update subscription list
      setSubscriptions(subscriptions.map(sub => {
        if (sub._id === subscriptionId) {
          return { ...sub, status: 'canceled', canceledAt: new Date() };
        }
        return sub;
      }));
      
      showToast('Subscription canceled successfully', 'success');
    } catch (err) {
      showToast(
        err.response?.data?.error || err.message || 'Failed to cancel subscription',
        'error'
      );
    } finally {
      setActionInProgress(false);
    }
  };
  
  /**
   * Get badge variant based on subscription status
   * @param {string} status - Subscription status
   * @returns {string} Badge variant
   */
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending_payment':
        return 'warning';
      case 'canceled':
        return 'danger';
      case 'past_due':
        return 'warning';
      default:
        return 'secondary';
    }
  };
  
  /**
   * Format subscription status for display
   * @param {string} status - Subscription status
   * @returns {string} Formatted status
   */
  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading subscription data...</p>
        </div>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <h1 className="mb-4">Subscriptions</h1>
      
      {subscriptions.length === 0 ? (
        <Card className="shadow-sm">
          <Card.Body className="p-4 text-center">
            <h4>No Active Subscriptions</h4>
            <p className="mb-4">You don't have any active subscriptions yet.</p>
            <Link to="/billing/plans" className="btn btn-primary">
              View Available Plans
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm">
                <Card.Header>
                  <h5 className="mb-0">Your Subscriptions</h5>
                </Card.Header>
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Price</th>
                      <th>Billing Cycle</th>
                      <th>Next Billing Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((subscription) => (
                      <tr key={subscription._id}>
                        <td>
                          <strong>{subscription.plan.name}</strong>
                        </td>
                        <td>
                          <Badge bg={getStatusBadgeVariant(subscription.status)}>
                            {formatStatus(subscription.status)}
                          </Badge>
                        </td>
                        <td>
                          ${subscription.plan.price} {subscription.plan.currency?.toUpperCase() || 'USD'}
                        </td>
                        <td>
                          {subscription.plan.billingCycle?.charAt(0).toUpperCase() + 
                            subscription.plan.billingCycle?.slice(1)}
                        </td>
                        <td>
                          {subscription.status === 'active' 
                            ? formatDate(subscription.currentPeriodEnd) 
                            : '-'}
                        </td>
                        <td>
                          {subscription.status === 'active' && (
                            <div className="d-flex gap-2">
                              <Link 
                                to={`/billing/subscriptions/${subscription._id}/change-plan`}
                                className="btn btn-sm btn-outline-primary"
                              >
                                Change Plan
                              </Link>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleCancelSubscription(subscription._id)}
                                disabled={actionInProgress}
                              >
                                {actionInProgress ? (
                                  <>
                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                    <span className="visually-hidden">Loading...</span>
                                  </>
                                ) : (
                                  'Cancel'
                                )}
                              </Button>
                            </div>
                          )}
                          {subscription.status === 'pending_payment' && (
                            <Link 
                              to={`/billing/payment/${subscription._id}`}
                              className="btn btn-sm btn-warning"
                            >
                              Complete Payment
                            </Link>
                          )}
                          {subscription.status === 'canceled' && (
                            <span className="text-muted">
                              Canceled on {formatDate(subscription.canceledAt)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            </Col>
          </Row>
          
          <Row>
            <Col>
              <Card className="shadow-sm">
                <Card.Header>
                  <h5 className="mb-0">Payment Methods</h5>
                </Card.Header>
                <Card.Body>
                  {paymentMethods.length === 0 ? (
                    <div className="text-center py-3">
                      <p>No payment methods on file.</p>
                      <Link to="/billing/payment-methods/add" className="btn btn-primary">
                        Add Payment Method
                      </Link>
                    </div>
                  ) : (
                    <>
                      <Table responsive>
                        <thead>
                          <tr>
                            <th>Card</th>
                            <th>Expiration</th>
                            <th>Default</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentMethods.map((method) => (
                            <tr key={method.paymentMethodId}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="me-2">
                                    {method.brand === 'visa' && <i className="bi bi-credit-card-fill"></i>}
                                    {method.brand === 'mastercard' && <i className="bi bi-credit-card-fill"></i>}
                                    {method.brand === 'amex' && <i className="bi bi-credit-card-fill"></i>}
                                    {!['visa', 'mastercard', 'amex'].includes(method.brand) && 
                                      <i className="bi bi-credit-card-fill"></i>}
                                  </div>
                                  <div>
                                    <strong>{method.brand?.toUpperCase()}</strong> ending in {method.last4}
                                  </div>
                                </div>
                              </td>
                              <td>
                                {method.expiryMonth}/{method.expiryYear}
                              </td>
                              <td>
                                {method.isDefault && <Badge bg="success">Default</Badge>}
                              </td>
                              <td>
                                <div className="d-flex gap-2">
                                  {!method.isDefault && (
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          setActionInProgress(true);
                                          await axios.put(`/api/billing/payment/methods/${method.paymentMethodId}/default`);
                                          
                                          // Update payment methods
                                          setPaymentMethods(paymentMethods.map(pm => ({
                                            ...pm,
                                            isDefault: pm.paymentMethodId === method.paymentMethodId
                                          })));
                                          
                                          showToast('Default payment method updated', 'success');
                                        } catch (err) {
                                          showToast(
                                            err.response?.data?.error || err.message || 'Failed to update default payment method',
                                            'error'
                                          );
                                        } finally {
                                          setActionInProgress(false);
                                        }
                                      }}
                                      disabled={actionInProgress}
                                    >
                                      Set Default
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={async () => {
                                      if (!window.confirm('Are you sure you want to remove this payment method?')) {
                                        return;
                                      }
                                      
                                      try {
                                        setActionInProgress(true);
                                        await axios.delete(`/api/billing/payment/methods/${method.paymentMethodId}`);
                                        
                                        // Update payment methods
                                        setPaymentMethods(paymentMethods.filter(
                                          pm => pm.paymentMethodId !== method.paymentMethodId
                                        ));
                                        
                                        showToast('Payment method removed', 'success');
                                      } catch (err) {
                                        showToast(
                                          err.response?.data?.error || err.message || 'Failed to remove payment method',
                                          'error'
                                        );
                                      } finally {
                                        setActionInProgress(false);
                                      }
                                    }}
                                    disabled={actionInProgress}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      <div className="mt-3">
                        <Link to="/billing/payment-methods/add" className="btn btn-primary">
                          Add Payment Method
                        </Link>
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default SubscriptionsPage;
