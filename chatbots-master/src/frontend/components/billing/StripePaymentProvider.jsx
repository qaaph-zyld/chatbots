import React from 'react';
import PropTypes from 'prop-types';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from './PaymentForm';

/**
 * Stripe payment provider component
 * Wraps payment components with Stripe Elements context
 */
const StripePaymentProvider = ({ 
  publishableKey, 
  subscriptionId, 
  onSuccess, 
  onError 
}) => {
  // Initialize Stripe outside of component render
  const stripePromise = loadStripe(publishableKey);

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm 
        subscriptionId={subscriptionId} 
        onSuccess={onSuccess} 
        onError={onError} 
      />
    </Elements>
  );
};

StripePaymentProvider.propTypes = {
  publishableKey: PropTypes.string.isRequired,
  subscriptionId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  onError: PropTypes.func
};

export default StripePaymentProvider;
