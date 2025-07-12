import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StripePaymentProvider from '../../components/billing/StripePaymentProvider';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

/**
 * Payment page for processing subscription payments
 */
const PaymentPage = () => {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Fetch subscription details
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/billing/subscriptions/${subscriptionId}`);
        setSubscription(data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load subscription details');
      } finally {
        setLoading(false);
      }
    };
    
    if (subscriptionId) {
      fetchSubscription();
    } else {
      setError('Subscription ID is required');
      setLoading(false);
    }
  }, [subscriptionId]);
  
  /**
   * Handle successful payment
   * @param {Object} paymentIntent - Stripe payment intent
   */
  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Update subscription status
      await axios.put(`/api/billing/subscriptions/${subscriptionId}/status`, {
        status: 'active'
      });
      
      setPaymentSuccess(true);
      showToast('Payment successful! Your subscription is now active.', 'success');
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      setError('Payment was processed but we could not update your subscription. Please contact support.');
    }
  };
  
  /**
   * Handle payment error
   * @param {string} errorMessage - Error message
   */
  const handlePaymentError = (errorMessage) => {
    setError(`Payment failed: ${errorMessage}`);
    showToast(`Payment failed: ${errorMessage}`, 'error');
  };
  
  if (loading) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Body className="p-5 text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading subscription details...</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="danger">
              {error}
            </Alert>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </Col>
        </Row>
      </Container>
    );
  }
  
  if (paymentSuccess) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Body className="p-5 text-center">
                <div className="mb-4">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                </div>
                <h2>Payment Successful!</h2>
                <p className="lead">Your subscription is now active.</p>
                <p>You will be redirected to your dashboard shortly...</p>
                <Button variant="primary" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
  
  if (!subscription) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="warning">
              Subscription not found. Please contact support.
            </Alert>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </Col>
        </Row>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Complete Your Payment</h4>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-4">
                <h5>Subscription Details</h5>
                <p className="mb-1">
                  <strong>Plan:</strong> {subscription.plan.name}
                </p>
                <p className="mb-1">
                  <strong>Billing Cycle:</strong> {subscription.plan.billingCycle}
                </p>
                <p className="mb-3">
                  <strong>Amount:</strong> ${subscription.plan.price} {subscription.plan.currency?.toUpperCase() || 'USD'}
                </p>
                <hr />
              </div>
              
              <h5>Payment Information</h5>
              <StripePaymentProvider
                publishableKey={process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY}
                subscriptionId={subscriptionId}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
              
              <div className="mt-4 text-center">
                <small className="text-muted">
                  Your payment is processed securely through Stripe. We do not store your card details.
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentPage;
