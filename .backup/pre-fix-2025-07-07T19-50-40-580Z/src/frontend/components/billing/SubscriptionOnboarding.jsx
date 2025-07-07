import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import './SubscriptionOnboarding.css';

/**
 * Subscription Onboarding Component
 * 
 * Guides new users through the subscription process with plan selection,
 * payment method setup, and trial activation.
 */
const SubscriptionOnboarding = () => {
  const navigate = useNavigate();
  const { currentUser, tenantId } = useAuth();
  const { showToast } = useToast();
  const stripe = useStripe();
  const elements = useElements();

  // State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingInterval, setBillingInterval] = useState('month');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cardError, setCardError] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponValid, setCouponValid] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [startTrial, setStartTrial] = useState(true);

  // Fetch plans on component mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get('/api/billing/plans');
        if (response.data.success) {
          setPlans(response.data.plans);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        showToast('Error loading subscription plans', 'error');
      }
    };

    fetchPlans();
  }, [showToast]);

  // Filter plans based on billing interval
  const filteredPlans = plans.filter(plan => 
    plan.id.includes(billingInterval === 'month' ? 'monthly' : 'yearly')
  );

  // Handle plan selection
  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  // Handle billing interval toggle
  const handleIntervalToggle = (interval) => {
    setBillingInterval(interval);
    setSelectedPlan(null);
  };

  // Handle coupon code validation
  const handleCouponValidation = async () => {
    if (!couponCode.trim()) {
      setCouponValid(null);
      setCouponDiscount(0);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/billing/coupons/validate', {
        couponCode,
        planId: selectedPlan?.id
      });

      if (response.data.success && response.data.valid) {
        setCouponValid(true);
        setCouponDiscount(response.data.discount);
        showToast(`Coupon applied: ${response.data.description}`, 'success');
      } else {
        setCouponValid(false);
        setCouponDiscount(0);
        showToast('Invalid or expired coupon code', 'error');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponValid(false);
      showToast('Error validating coupon code', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle card element change
  const handleCardChange = (event) => {
    setCardError(event.error ? event.error.message : null);
  };

  // Handle payment method setup
  const handlePaymentMethodSetup = async () => {
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    try {
      // Create setup intent
      const setupResponse = await axios.post('/api/billing/payment-methods/setup-intent');
      
      if (!setupResponse.data.success || !setupResponse.data.clientSecret) {
        throw new Error('Failed to create setup intent');
      }

      // Confirm card setup
      const result = await stripe.confirmCardSetup(setupResponse.data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: currentUser.displayName || currentUser.email,
            email: currentUser.email
          }
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      setPaymentMethod(result.setupIntent.payment_method);
      showToast('Payment method added successfully', 'success');
      setStep(3);
    } catch (error) {
      console.error('Error setting up payment method:', error);
      setCardError(error.message);
      showToast('Error setting up payment method', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle trial activation
  const handleTrialActivation = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/billing/trials', {
        planId: selectedPlan.id
      });

      if (response.data.success) {
        showToast(`Your ${selectedPlan.name} trial has been activated!`, 'success');
        navigate('/dashboard');
      } else {
        throw new Error('Failed to activate trial');
      }
    } catch (error) {
      console.error('Error activating trial:', error);
      showToast('Error activating trial', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle subscription creation
  const handleSubscriptionCreate = async () => {
    if (!selectedPlan || !paymentMethod) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/billing/subscriptions', {
        planId: selectedPlan.id,
        paymentMethodId: paymentMethod,
        couponCode: couponValid ? couponCode : null,
        autoRenew: true
      });

      if (response.data.success) {
        showToast(`Your subscription to ${selectedPlan.name} has been activated!`, 'success');
        navigate('/dashboard');
      } else {
        throw new Error('Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      showToast('Error creating subscription', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 1 && selectedPlan) {
      setStep(2);
    } else if (step === 2) {
      await handlePaymentMethodSetup();
    } else if (step === 3) {
      if (startTrial && selectedPlan) {
        await handleTrialActivation();
      } else {
        await handleSubscriptionCreate();
      }
    }
  };

  // Format price for display
  const formatPrice = (price, currency = 'usd') => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    });
    
    return formatter.format(price / 100);
  };

  // Calculate discounted price
  const calculateDiscountedPrice = (price) => {
    if (!couponValid || couponDiscount <= 0) {
      return price;
    }
    
    return price - (price * (couponDiscount / 100));
  };

  return (
    <div className="subscription-onboarding">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Get Started with Your Subscription</h1>
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Choose Plan</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Payment Details</div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Confirmation</div>
          </div>
        </div>

        <div className="onboarding-content">
          {step === 1 && (
            <div className="plan-selection">
              <h2>Choose Your Plan</h2>
              
              <div className="billing-toggle">
                <span className={billingInterval === 'month' ? 'active' : ''}>
                  Monthly
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={billingInterval === 'year'}
                    onChange={() => handleIntervalToggle(billingInterval === 'month' ? 'year' : 'month')}
                  />
                  <span className="slider round"></span>
                </label>
                <span className={billingInterval === 'year' ? 'active' : ''}>
                  Yearly <span className="discount-badge">Save 16%</span>
                </span>
              </div>
              
              <div className="plans-grid">
                {filteredPlans.map(plan => (
                  <div
                    key={plan.id}
                    className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    <h3>{plan.name}</h3>
                    <div className="plan-price">
                      {formatPrice(plan.price, plan.currency)}
                      <span className="price-period">
                        /{billingInterval === 'month' ? 'mo' : 'yr'}
                      </span>
                    </div>
                    <ul className="plan-features">
                      {plan.features.map(feature => (
                        <li key={feature}>
                          <span className="feature-check">✓</span>
                          {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </li>
                      ))}
                    </ul>
                    <button
                      className={`select-plan-btn ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
                      onClick={() => handlePlanSelect(plan)}
                    >
                      {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="payment-setup">
              <h2>Payment Details</h2>
              <p>Please enter your payment information to continue.</p>
              
              <div className="card-container">
                <label>Card Information</label>
                <div className="card-element">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                        invalid: {
                          color: '#9e2146',
                        },
                      },
                    }}
                    onChange={handleCardChange}
                  />
                </div>
                {cardError && <div className="card-error">{cardError}</div>}
              </div>
              
              <div className="coupon-container">
                <label>Have a coupon?</label>
                <div className="coupon-input">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                  />
                  <button
                    type="button"
                    onClick={handleCouponValidation}
                    disabled={loading || !couponCode.trim()}
                  >
                    Apply
                  </button>
                </div>
                {couponValid === true && (
                  <div className="coupon-valid">
                    Coupon applied! You'll save {couponDiscount}% on your subscription.
                  </div>
                )}
                {couponValid === false && (
                  <div className="coupon-invalid">
                    Invalid or expired coupon code.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="confirmation">
              <h2>Confirm Your Subscription</h2>
              
              <div className="subscription-summary">
                <h3>Order Summary</h3>
                <div className="summary-item">
                  <span>Plan:</span>
                  <span>{selectedPlan?.name}</span>
                </div>
                <div className="summary-item">
                  <span>Billing:</span>
                  <span>{billingInterval === 'month' ? 'Monthly' : 'Yearly'}</span>
                </div>
                <div className="summary-item">
                  <span>Price:</span>
                  <span>{formatPrice(selectedPlan?.price, selectedPlan?.currency)}</span>
                </div>
                {couponValid && (
                  <div className="summary-item discount">
                    <span>Discount:</span>
                    <span>-{couponDiscount}%</span>
                  </div>
                )}
                <div className="summary-item total">
                  <span>Total:</span>
                  <span>
                    {formatPrice(
                      calculateDiscountedPrice(selectedPlan?.price),
                      selectedPlan?.currency
                    )}
                    <span className="price-period">
                      /{billingInterval === 'month' ? 'mo' : 'yr'}
                    </span>
                  </span>
                </div>
              </div>
              
              <div className="trial-option">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={startTrial}
                    onChange={() => setStartTrial(!startTrial)}
                  />
                  <span className="checkmark"></span>
                  Start with a 14-day free trial
                </label>
                <p className="trial-note">
                  Your card won't be charged until your trial ends. You can cancel anytime.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="onboarding-footer">
          {step > 1 && (
            <button
              className="back-btn"
              onClick={() => setStep(step - 1)}
              disabled={loading}
            >
              Back
            </button>
          )}
          
          <button
            className="next-btn"
            onClick={handleSubmit}
            disabled={
              loading ||
              (step === 1 && !selectedPlan) ||
              (step === 2 && cardError)
            }
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : step === 3 ? (
              startTrial ? 'Start Free Trial' : 'Complete Purchase'
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionOnboarding;
