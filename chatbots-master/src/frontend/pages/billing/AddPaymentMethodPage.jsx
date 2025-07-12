import React, { useState } from 'react';
import { Container, Row, Col, Card, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

/**
 * Card element form component
 */
const CardForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Card element styles
  const cardElementOptions = {
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
  };
  
  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Clear any previous errors
    setError(null);
    
    // Validate Stripe is loaded
    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create setup intent
      const { data: setupIntent } = await axios.post('/api/billing/payment/setup');
      
      // Confirm card setup
      const result = await stripe.confirmCardSetup(setupIntent.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value
          }
        }
      });
      
      if (result.error) {
        // Show error to customer
        setError(result.error.message);
      } else {
        // Setup succeeded
        if (result.setupIntent.status === 'succeeded') {
          // Save payment method to database
          await axios.post('/api/billing/payment/methods', {
            paymentMethodId: result.setupIntent.payment_method,
            isDefault: true
          });
          
          showToast('Payment method added successfully', 'success');
          navigate('/billing/subscriptions');
        } else {
          // Handle other statuses
          setError(`Setup status: ${result.setupIntent.status}. Please contact support.`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred adding your payment method');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="form-group mb-3">
        <label htmlFor="name">Name on Card</label>
        <input
          id="name"
          className="form-control"
          type="text"
          placeholder="Jane Doe"
          required
        />
      </div>
      
      <div className="form-group mb-3">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          className="form-control"
          type="email"
          placeholder="jane@example.com"
          required
        />
      </div>
      
      <div className="form-group mb-4">
        <label htmlFor="card-element">Credit or Debit Card</label>
        <div className="card-element-container p-3 border rounded">
          <CardElement id="card-element" options={cardElementOptions} />
        </div>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}
      
      <div className="d-flex gap-2">
        <Button 
          type="submit" 
          variant="primary" 
          disabled={!stripe || loading}
        >
          {loading ? 'Adding...' : 'Add Payment Method'}
        </Button>
        
        <Button 
          type="button" 
          variant="outline-secondary" 
          onClick={() => navigate('/billing/subscriptions')}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

/**
 * Add payment method page
 */
const AddPaymentMethodPage = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Add Payment Method</h4>
            </Card.Header>
            <Card.Body className="p-4">
              <Elements stripe={stripePromise}>
                <CardForm />
              </Elements>
              
              <div className="mt-4 text-center">
                <small className="text-muted">
                  Your payment information is processed securely through Stripe. We do not store your card details.
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AddPaymentMethodPage;
