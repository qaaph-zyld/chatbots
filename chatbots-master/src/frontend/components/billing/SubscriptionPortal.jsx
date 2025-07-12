import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Badge, Tabs, Tab, Table } from 'react-bootstrap';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import axios from 'axios';
import './SubscriptionPortal.css';

/**
 * Subscription Portal Component
 * 
 * Self-service portal for customers to manage their subscriptions
 * Allows viewing subscription details, updating payment methods, and changing plans
 */
const SubscriptionPortal = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [activeTab, setActiveTab] = useState('subscription');
  const [processingAction, setProcessingAction] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch subscription data on component mount
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch current subscription
        const subscriptionResponse = await axios.get('/api/billing/subscription');
        setSubscription(subscriptionResponse.data);

        // Fetch payment methods
        const paymentMethodsResponse = await axios.get('/api/billing/payment-methods');
        setPaymentMethods(paymentMethodsResponse.data.paymentMethods);

        // Fetch invoices
        const invoicesResponse = await axios.get('/api/billing/invoices');
        setInvoices(invoicesResponse.data.invoices);

        // Fetch available plans
        const plansResponse = await axios.get('/api/billing/plans');
        setAvailablePlans(plansResponse.data.plans);

        setLoading(false);
      } catch (err) {
        setError('Failed to load subscription data. Please try again later.');
        setLoading(false);
        console.error('Error fetching subscription data:', err);
      }
    };

    fetchSubscriptionData();
  }, []);

  // Handle plan change
  const handlePlanChange = async (planId) => {
    try {
      setProcessingAction(true);
      setError(null);
      
      await axios.post('/api/billing/subscription/change-plan', { planId });
      
      // Refresh subscription data
      const subscriptionResponse = await axios.get('/api/billing/subscription');
      setSubscription(subscriptionResponse.data);
      
      setSuccessMessage('Your subscription plan has been updated successfully.');
      setProcessingAction(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setError('Failed to change subscription plan. Please try again later.');
      setProcessingAction(false);
      console.error('Error changing subscription plan:', err);
    }
  };

  // Handle payment method update
  const handleUpdatePaymentMethod = async () => {
    try {
      setProcessingAction(true);
      
      // Open Stripe payment method update modal
      const { paymentMethodId } = await window.openStripePaymentMethodModal();
      
      if (paymentMethodId) {
        await axios.post('/api/billing/payment-methods/update-default', { paymentMethodId });
        
        // Refresh payment methods
        const paymentMethodsResponse = await axios.get('/api/billing/payment-methods');
        setPaymentMethods(paymentMethodsResponse.data.paymentMethods);
        
        setSuccessMessage('Your payment method has been updated successfully.');
      }
      
      setProcessingAction(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setError('Failed to update payment method. Please try again later.');
      setProcessingAction(false);
      console.error('Error updating payment method:', err);
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to cancel your subscription? This will take effect at the end of your current billing period.')) {
      return;
    }
    
    try {
      setProcessingAction(true);
      setError(null);
      
      await axios.post('/api/billing/subscription/cancel');
      
      // Refresh subscription data
      const subscriptionResponse = await axios.get('/api/billing/subscription');
      setSubscription(subscriptionResponse.data);
      
      setSuccessMessage('Your subscription has been canceled and will end at the current billing period.');
      setProcessingAction(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setError('Failed to cancel subscription. Please try again later.');
      setProcessingAction(false);
      console.error('Error canceling subscription:', err);
    }
  };

  // Handle subscription reactivation
  const handleReactivateSubscription = async () => {
    try {
      setProcessingAction(true);
      setError(null);
      
      await axios.post('/api/billing/subscription/reactivate');
      
      // Refresh subscription data
      const subscriptionResponse = await axios.get('/api/billing/subscription');
      setSubscription(subscriptionResponse.data);
      
      setSuccessMessage('Your subscription has been reactivated successfully.');
      setProcessingAction(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setError('Failed to reactivate subscription. Please try again later.');
      setProcessingAction(false);
      console.error('Error reactivating subscription:', err);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="subscription-portal-loading">
        <Spinner animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
        <p>Loading subscription information...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <Button 
          variant="outline-danger" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  // Render no subscription state
  if (!subscription) {
    return (
      <Card className="subscription-portal-no-subscription">
        <Card.Body>
          <Card.Title>No Active Subscription</Card.Title>
          <Card.Text>
            You don't have an active subscription. Choose a plan to get started.
          </Card.Text>
          <Button 
            variant="primary" 
            href="/billing/plans"
          >
            View Plans
          </Button>
        </Card.Body>
      </Card>
    );
  }

  // Get current plan details
  const currentPlan = availablePlans.find(plan => plan.id === subscription.planId) || {
    name: 'Unknown Plan',
    price: 0
  };

  // Render subscription portal
  return (
    <div className="subscription-portal">
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
          {successMessage}
        </Alert>
      )}
      
      <Card className="subscription-summary">
        <Card.Body>
          <div className="subscription-header">
            <div>
              <Card.Title>Your Subscription</Card.Title>
              <h3>{currentPlan.name}</h3>
            </div>
            <div>
              <Badge 
                bg={
                  subscription.status === 'active' ? 'success' : 
                  subscription.status === 'canceled' ? 'warning' : 
                  subscription.status === 'past_due' ? 'danger' : 
                  'secondary'
                }
              >
                {subscription.status === 'active' ? 'Active' : 
                 subscription.status === 'canceled' ? 'Canceled' : 
                 subscription.status === 'past_due' ? 'Past Due' : 
                 subscription.status}
              </Badge>
            </div>
          </div>
          
          <div className="subscription-details">
            <div className="detail-item">
              <span className="detail-label">Price</span>
              <span className="detail-value">{formatCurrency(currentPlan.price)}/month</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Billing Period</span>
              <span className="detail-value">
                {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
            {subscription.cancelAtPeriodEnd && (
              <div className="detail-item">
                <span className="detail-label">Cancellation</span>
                <span className="detail-value">
                  Your subscription will end on {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>
            )}
          </div>
          
          <div className="subscription-actions">
            {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
              <>
                <Button 
                  variant="outline-primary" 
                  onClick={() => setActiveTab('plans')}
                >
                  Change Plan
                </Button>
                <Button 
                  variant="outline-danger" 
                  onClick={handleCancelSubscription}
                  disabled={processingAction}
                >
                  {processingAction ? 'Processing...' : 'Cancel Subscription'}
                </Button>
              </>
            )}
            {subscription.cancelAtPeriodEnd && (
              <Button 
                variant="outline-success" 
                onClick={handleReactivateSubscription}
                disabled={processingAction}
              >
                {processingAction ? 'Processing...' : 'Reactivate Subscription'}
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key)}
        className="subscription-tabs"
      >
        <Tab eventKey="subscription" title="Subscription Details">
          <Card>
            <Card.Body>
              <h4>Subscription Features</h4>
              <ul className="feature-list">
                {currentPlan.features && currentPlan.features.map((feature, index) => (
                  <li key={index} className="feature-item">
                    <i className="bi bi-check-circle"></i>
                    <span>{feature.name || feature}</span>
                    {feature.limits && (
                      <span className="feature-limit">
                        {Object.entries(feature.limits).map(([key, value]) => (
                          <Badge key={key} bg="info" className="limit-badge">
                            {key}: {value}
                          </Badge>
                        ))}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              
              <h4>Payment Method</h4>
              {paymentMethods.length > 0 ? (
                <div className="payment-method">
                  {paymentMethods.map((method, index) => (
                    method.isDefault && (
                      <div key={index} className="payment-method-item">
                        <div className="card-info">
                          <i className={`bi bi-credit-card${method.brand ? `-${method.brand.toLowerCase()}` : ''}`}></i>
                          <span>•••• •••• •••• {method.last4}</span>
                          <span className="expiry">Expires {method.expMonth}/{method.expYear}</span>
                        </div>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={handleUpdatePaymentMethod}
                          disabled={processingAction}
                        >
                          {processingAction ? 'Processing...' : 'Update'}
                        </Button>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <div className="no-payment-method">
                  <p>No payment method on file.</p>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={handleUpdatePaymentMethod}
                    disabled={processingAction}
                  >
                    {processingAction ? 'Processing...' : 'Add Payment Method'}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="invoices" title="Billing History">
          <Card>
            <Card.Body>
              <h4>Invoices</h4>
              {invoices.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice, index) => (
                      <tr key={index}>
                        <td>{formatDate(invoice.created)}</td>
                        <td>{formatCurrency(invoice.amount)}</td>
                        <td>
                          <Badge 
                            bg={
                              invoice.status === 'paid' ? 'success' : 
                              invoice.status === 'open' ? 'warning' : 
                              invoice.status === 'failed' ? 'danger' : 
                              'secondary'
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant="link" 
                            size="sm"
                            href={invoice.invoiceUrl}
                            target="_blank"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No invoices found.</p>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="plans" title="Available Plans">
          <Card>
            <Card.Body>
              <h4>Available Plans</h4>
              <div className="plans-grid">
                {availablePlans.map((plan, index) => (
                  <Card key={index} className={`plan-card ${plan.id === subscription.planId ? 'current-plan' : ''}`}>
                    <Card.Body>
                      <Card.Title>{plan.name}</Card.Title>
                      <div className="plan-price">
                        <span className="price">{formatCurrency(plan.price)}</span>
                        <span className="period">/month</span>
                      </div>
                      <ul className="plan-features">
                        {plan.features && plan.features.map((feature, idx) => (
                          <li key={idx}>
                            <i className="bi bi-check"></i>
                            <span>{feature.name || feature}</span>
                          </li>
                        ))}
                      </ul>
                      {plan.id === subscription.planId ? (
                        <Button variant="success" disabled>Current Plan</Button>
                      ) : (
                        <Button 
                          variant="outline-primary" 
                          onClick={() => handlePlanChange(plan.id)}
                          disabled={processingAction}
                        >
                          {processingAction ? 'Processing...' : 'Switch to this Plan'}
                        </Button>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default SubscriptionPortal;
