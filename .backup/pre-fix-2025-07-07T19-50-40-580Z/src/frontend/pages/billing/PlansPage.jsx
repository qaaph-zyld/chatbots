import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

/**
 * Plans selection page
 */
const PlansPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('monthly');
  const [processingSubscription, setProcessingSubscription] = useState(false);
  
  // Fetch available plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/billing/plans');
        setPlans(data);
        
        // Set default selected plan to the middle tier if available
        if (data.length > 0) {
          const middleIndex = Math.floor(data.length / 2);
          setSelectedPlan(data[middleIndex]._id);
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load plans');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlans();
  }, []);
  
  /**
   * Handle plan selection
   * @param {string} planId - Selected plan ID
   */
  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };
  
  /**
   * Handle billing cycle selection
   * @param {string} cycle - Selected billing cycle
   */
  const handleBillingCycleSelect = (cycle) => {
    setSelectedBillingCycle(cycle);
  };
  
  /**
   * Handle subscription creation
   */
  const handleSubscribe = async () => {
    if (!selectedPlan) {
      showToast('Please select a plan', 'warning');
      return;
    }
    
    try {
      setProcessingSubscription(true);
      
      // Create subscription
      const { data: subscription } = await axios.post('/api/billing/subscriptions', {
        planId: selectedPlan,
        billingCycle: selectedBillingCycle
      });
      
      // Redirect to payment page
      navigate(`/billing/payment/${subscription._id}`);
    } catch (err) {
      showToast(
        err.response?.data?.error || err.message || 'Failed to create subscription',
        'error'
      );
      setProcessingSubscription(false);
    }
  };
  
  /**
   * Get price for selected billing cycle
   * @param {Object} plan - Plan object
   * @returns {number} Price for selected billing cycle
   */
  const getPriceForBillingCycle = (plan) => {
    if (selectedBillingCycle === 'annual') {
      return plan.annualPrice || plan.price * 10; // 2 months free for annual
    }
    return plan.price;
  };
  
  /**
   * Calculate savings percentage for annual billing
   * @param {Object} plan - Plan object
   * @returns {number} Savings percentage
   */
  const calculateAnnualSavings = (plan) => {
    const monthlyTotal = plan.price * 12;
    const annualTotal = plan.annualPrice || plan.price * 10;
    return Math.round(((monthlyTotal - annualTotal) / monthlyTotal) * 100);
  };
  
  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading plans...</p>
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
      <h1 className="text-center mb-2">Choose Your Plan</h1>
      <p className="text-center text-muted mb-5">
        Select the plan that best fits your needs
      </p>
      
      <div className="text-center mb-4">
        <div className="btn-group" role="group" aria-label="Billing cycle selection">
          <Button
            variant={selectedBillingCycle === 'monthly' ? 'primary' : 'outline-primary'}
            onClick={() => handleBillingCycleSelect('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant={selectedBillingCycle === 'annual' ? 'primary' : 'outline-primary'}
            onClick={() => handleBillingCycleSelect('annual')}
          >
            Annual <Badge bg="success">Save up to 20%</Badge>
          </Button>
        </div>
      </div>
      
      <Row className="mb-5">
        {plans.map((plan) => (
          <Col key={plan._id} md={4} className="mb-4">
            <Card 
              className={`shadow-sm h-100 ${selectedPlan === plan._id ? 'border-primary' : ''}`}
              onClick={() => handlePlanSelect(plan._id)}
              style={{ cursor: 'pointer' }}
            >
              {plan.popular && (
                <div className="ribbon ribbon-top-right">
                  <span>Popular</span>
                </div>
              )}
              
              <Card.Header className={`text-center ${plan.popular ? 'bg-primary text-white' : ''}`}>
                <h3 className="my-0 fw-normal">{plan.name}</h3>
              </Card.Header>
              
              <Card.Body className="d-flex flex-column">
                <Card.Title className="text-center mb-4">
                  <span className="display-4">${getPriceForBillingCycle(plan)}</span>
                  <small className="text-muted">/{selectedBillingCycle === 'annual' ? 'year' : 'month'}</small>
                </Card.Title>
                
                {selectedBillingCycle === 'annual' && (
                  <div className="text-center mb-3">
                    <Badge bg="success">Save {calculateAnnualSavings(plan)}%</Badge>
                  </div>
                )}
                
                <ul className="list-unstyled mt-3 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto text-center">
                  <Button
                    variant={selectedPlan === plan._id ? 'primary' : 'outline-primary'}
                    className="w-100"
                    onClick={() => handlePlanSelect(plan._id)}
                  >
                    {selectedPlan === plan._id ? 'Selected' : 'Select Plan'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      
      <div className="text-center">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubscribe}
          disabled={!selectedPlan || processingSubscription}
        >
          {processingSubscription ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">Processing...</span>
            </>
          ) : (
            'Continue to Payment'
          )}
        </Button>
        <p className="mt-3 text-muted">
          You can cancel or change your plan at any time
        </p>
      </div>
    </Container>
  );
};

export default PlansPage;
