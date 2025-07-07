import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../../../utils/formatters';
import './PricingPage.css';

/**
 * Pricing Page Component
 * 
 * Displays available subscription plans and their features
 * Allows users to select a plan and start the subscription process
 */
const PricingPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [processingPlan, setProcessingPlan] = useState(null);
  const navigate = useNavigate();

  // Fetch plans and current subscription on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch available plans
        const plansResponse = await axios.get('/api/billing/plans');
        setPlans(plansResponse.data.plans);

        try {
          // Fetch current subscription if user is logged in
          const subscriptionResponse = await axios.get('/api/billing/subscription');
          setCurrentSubscription(subscriptionResponse.data);
        } catch (subscriptionError) {
          // User might not be logged in or doesn't have a subscription yet
          console.log('No active subscription found');
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load pricing information. Please try again later.');
        setLoading(false);
        console.error('Error fetching pricing data:', err);
      }
    };

    fetchData();
  }, []);

  // Handle plan selection
  const handleSelectPlan = async (planId) => {
    try {
      setProcessingPlan(planId);
      
      // Check if user is authenticated
      const authResponse = await axios.get('/api/auth/status');
      
      if (!authResponse.data.authenticated) {
        // Store selected plan in session storage for after login
        sessionStorage.setItem('selectedPlanId', planId);
        // Redirect to login page
        navigate('/auth/login?redirect=billing/subscribe');
        return;
      }
      
      // User is authenticated, check if they have an existing subscription
      if (currentSubscription) {
        // If they're already subscribed to this plan, redirect to subscription portal
        if (currentSubscription.planId === planId) {
          navigate('/billing/portal');
          return;
        }
        
        // Otherwise, redirect to plan change page
        navigate(`/billing/change-plan/${planId}`);
        return;
      }
      
      // New subscription flow
      navigate(`/billing/subscribe/${planId}`);
    } catch (err) {
      console.error('Error selecting plan:', err);
      setError('Failed to process your selection. Please try again.');
      setProcessingPlan(null);
    }
  };

  // Filter plans based on billing interval
  const filteredPlans = plans.filter(plan => 
    plan.interval === billingInterval || !plan.interval
  );

  // Sort plans by price
  const sortedPlans = [...filteredPlans].sort((a, b) => a.price - b.price);

  // Find recommended plan (if any)
  const recommendedPlan = sortedPlans.find(plan => plan.recommended);

  // Render loading state
  if (loading) {
    return (
      <Container className="pricing-page-loading">
        <Spinner animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
        <p>Loading pricing information...</p>
      </Container>
    );
  }

  return (
    <Container className="pricing-page">
      <div className="pricing-header">
        <h1>Choose the Right Plan for Your Business</h1>
        <p>All plans include a 14-day free trial. No credit card required to start.</p>
        
        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}
        
        <div className="billing-toggle">
          <span className={billingInterval === 'monthly' ? 'active' : ''}>Monthly</span>
          <div 
            className={`toggle-switch ${billingInterval === 'yearly' ? 'yearly' : 'monthly'}`}
            onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
          >
            <div className="toggle-knob"></div>
          </div>
          <span className={billingInterval === 'yearly' ? 'active' : ''}>
            Yearly
            <Badge bg="success" className="yearly-discount">Save 20%</Badge>
          </span>
        </div>
      </div>
      
      <Row className="pricing-plans">
        {sortedPlans.length > 0 ? (
          sortedPlans.map((plan, index) => (
            <Col key={plan.id} md={4} className="mb-4">
              <Card 
                className={`pricing-card ${plan.id === recommendedPlan?.id ? 'recommended' : ''}`}
              >
                {plan.id === recommendedPlan?.id && (
                  <div className="recommended-badge">
                    <span>RECOMMENDED</span>
                  </div>
                )}
                
                <Card.Body>
                  <Card.Title>{plan.name}</Card.Title>
                  
                  <div className="plan-price">
                    <span className="price">{formatCurrency(plan.price)}</span>
                    <span className="period">/{billingInterval === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  
                  <div className="plan-description">
                    <p>{plan.description}</p>
                  </div>
                  
                  <Button 
                    variant={plan.id === recommendedPlan?.id ? 'primary' : 'outline-primary'} 
                    className="select-plan-btn"
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={processingPlan === plan.id}
                  >
                    {processingPlan === plan.id ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="mr-2"
                        />
                        {' '}Processing...
                      </>
                    ) : currentSubscription?.planId === plan.id ? (
                      'Current Plan'
                    ) : (
                      'Select Plan'
                    )}
                  </Button>
                  
                  <ul className="plan-features">
                    {plan.features && plan.features.map((feature, idx) => {
                      const featureName = typeof feature === 'string' ? feature : feature.name;
                      const featureLimits = typeof feature === 'object' && feature.limits ? feature.limits : null;
                      
                      return (
                        <li key={idx} className="feature-item">
                          <i className="bi bi-check-circle"></i>
                          <span>
                            {featureName}
                            {featureLimits && Object.entries(featureLimits).map(([key, value]) => (
                              <Badge key={key} bg="light" text="dark" className="limit-badge">
                                {key === 'monthly' ? 'Monthly' : key === 'total' ? 'Total' : key}: {value}
                              </Badge>
                            ))}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col className="text-center">
            <p>No pricing plans available at the moment. Please check back later.</p>
          </Col>
        )}
      </Row>
      
      <div className="pricing-faq">
        <h2>Frequently Asked Questions</h2>
        
        <div className="faq-item">
          <h4>Can I change my plan later?</h4>
          <p>Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.</p>
        </div>
        
        <div className="faq-item">
          <h4>How does the free trial work?</h4>
          <p>All new accounts start with a 14-day free trial of the Pro plan. No credit card is required to start. At the end of the trial, you can choose to subscribe to any plan or continue with the free plan.</p>
        </div>
        
        <div className="faq-item">
          <h4>What payment methods do you accept?</h4>
          <p>We accept all major credit cards (Visa, Mastercard, American Express) and PayPal.</p>
        </div>
        
        <div className="faq-item">
          <h4>Can I cancel my subscription?</h4>
          <p>Yes, you can cancel your subscription at any time. Your plan will remain active until the end of your current billing period.</p>
        </div>
        
        <div className="faq-item">
          <h4>Do you offer custom plans for larger teams?</h4>
          <p>Yes, we offer custom enterprise plans for larger organizations with specific needs. <Link to="/contact">Contact us</Link> to discuss your requirements.</p>
        </div>
      </div>
    </Container>
  );
};

export default PricingPage;
