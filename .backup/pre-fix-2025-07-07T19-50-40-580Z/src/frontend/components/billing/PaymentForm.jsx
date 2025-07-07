import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

/**
 * Payment form component for processing payments with Stripe
 */
const PaymentForm = ({ subscriptionId, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
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
    
    // Validate required props
    if (!subscriptionId) {
      setError('Subscription ID is required');
      return;
    }
    
    // Validate Stripe is loaded
    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create payment intent
      const { data: paymentIntent } = await axios.post('/api/billing/payment/intent', {
        subscriptionId
      });
      
      // Confirm card payment
      const result = await stripe.confirmCardPayment(paymentIntent.clientSecret, {
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
        if (onError) onError(result.error.message);
      } else {
        // Payment succeeded
        if (result.paymentIntent.status === 'succeeded') {
          if (onSuccess) onSuccess(result.paymentIntent);
        } else {
          // Handle other statuses
          setError(`Payment status: ${result.paymentIntent.status}. Please contact support.`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred processing your payment');
      if (onError) onError(err.message);
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
      
      <Button 
        type="submit" 
        variant="primary" 
        size="lg" 
        className="w-100" 
        disabled={!stripe || loading}
      >
        {loading ? (
          <>
            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            <span className="ms-2">Processing...</span>
          </>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  );
};

PaymentForm.propTypes = {
  subscriptionId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  onError: PropTypes.func
};

export default PaymentForm;
