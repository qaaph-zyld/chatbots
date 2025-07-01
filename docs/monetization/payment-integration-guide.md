# Payment Gateway Integration Guide

## Overview

This document provides a comprehensive guide to the Stripe payment gateway integration implemented in the Customizable Chatbots platform. The integration enables secure payment processing for subscriptions, saving payment methods, and handling payment events through webhooks.

## Architecture

The payment integration follows a modular architecture with the following components:

1. **Payment Service** - Core business logic for payment processing
2. **Payment Controller** - API endpoints for payment operations
3. **Stripe Webhook Middleware** - Middleware for handling Stripe webhook events
4. **Tenant Model Extensions** - Storage for payment methods and customer information

## Prerequisites

To use the payment integration, you need:

1. A Stripe account
2. Stripe API keys (publishable and secret)
3. Webhook endpoint configuration in Stripe dashboard

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Middleware Configuration

The Stripe webhook middleware is configured in `app.js` to handle raw body parsing for webhook signature verification.

## API Endpoints

### Payment Intents

**Create Payment Intent**
- **Endpoint**: `POST /api/billing/payment/intent`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "subscriptionId": "subscription_id_here"
  }
  ```
- **Response**:
  ```json
  {
    "paymentIntentId": "pi_...",
    "clientSecret": "pi_..._secret_...",
    "amount": 9900,
    "currency": "usd",
    "status": "requires_payment_method"
  }
  ```

### Setup Intents

**Create Setup Intent**
- **Endpoint**: `POST /api/billing/payment/setup`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "setupIntentId": "seti_...",
    "clientSecret": "seti_..._secret_...",
    "status": "requires_payment_method"
  }
  ```

### Payment Methods

**Get Payment Methods**
- **Endpoint**: `GET /api/billing/payment/methods`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "paymentMethods": [
      {
        "paymentMethodId": "pm_...",
        "type": "card",
        "isDefault": true,
        "last4": "4242",
        "brand": "visa",
        "expiryMonth": 12,
        "expiryYear": 2025,
        "createdAt": "2025-06-30T08:12:32.000Z"
      }
    ]
  }
  ```

**Set Default Payment Method**
- **Endpoint**: `PUT /api/billing/payment/methods/:paymentMethodId/default`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "paymentMethods": [...]
  }
  ```

**Remove Payment Method**
- **Endpoint**: `DELETE /api/billing/payment/methods/:paymentMethodId`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "paymentMethods": [...]
  }
  ```

### Webhooks

**Stripe Webhook Handler**
- **Endpoint**: `POST /api/billing/payment/webhook`
- **Authentication**: None (uses Stripe signature verification)
- **Headers**:
  ```
  stripe-signature: t=timestamp,v1=signature
  ```
- **Response**:
  ```json
  {
    "received": true,
    "processed": true,
    "event": "payment_intent.succeeded"
  }
  ```

## Frontend Integration

### Payment Form Component

```javascript
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe outside of component render
const stripePromise = loadStripe('your_publishable_key');

const PaymentForm = ({ subscriptionId, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      // Create payment intent
      const response = await fetch('/api/billing/payment/intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });
      
      const { clientSecret } = await response.json();
      
      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: 'Customer Name',
          },
        },
      });
      
      if (result.error) {
        onError(result.error.message);
      } else {
        onSuccess(result.paymentIntent);
      }
    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

// Wrap with Elements provider
const StripePaymentForm = (props) => (
  <Elements stripe={stripePromise}>
    <PaymentForm {...props} />
  </Elements>
);

export default StripePaymentForm;
```

### Save Payment Method Component

```javascript
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('your_publishable_key');

const SaveCardForm = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      // Create setup intent
      const response = await fetch('/api/billing/payment/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const { clientSecret } = await response.json();
      
      // Confirm setup with Stripe
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: 'Customer Name',
          },
        },
      });
      
      if (result.error) {
        onError(result.error.message);
      } else {
        onSuccess(result.setupIntent);
      }
    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Save Card'}
      </button>
    </form>
  );
};

// Wrap with Elements provider
const StripeSaveCardForm = (props) => (
  <Elements stripe={stripePromise}>
    <SaveCardForm {...props} />
  </Elements>
);

export default StripeSaveCardForm;
```

## Webhook Events

The payment service handles the following Stripe webhook events:

1. **payment_intent.succeeded** - Processes successful payments and updates subscription status
2. **payment_intent.payment_failed** - Handles failed payments and updates subscription status
3. **setup_intent.succeeded** - Saves payment methods for future use

## Testing

### Test Cards

Use these test card numbers for testing:

- **Success**: 4242 4242 4242 4242
- **Authentication Required**: 4000 0025 0000 3155
- **Declined**: 4000 0000 0000 0002

### Testing Webhooks

Use the Stripe CLI to test webhooks locally:

```bash
stripe listen --forward-to http://localhost:3000/api/billing/payment/webhook
```

## Security Considerations

1. **API Key Security** - Never expose your Stripe secret key in client-side code
2. **Webhook Signature Verification** - Always verify webhook signatures to prevent fraud
3. **PCI Compliance** - Use Stripe Elements to avoid handling card data directly
4. **HTTPS** - Ensure all API endpoints are served over HTTPS

## Troubleshooting

### Common Issues

1. **Webhook Signature Verification Failed**
   - Check that you're using the correct webhook secret
   - Ensure the raw body is being properly parsed

2. **Payment Intent Creation Failed**
   - Verify that the Stripe secret key is valid
   - Check that the subscription exists and has valid pricing

3. **Payment Method Attachment Failed**
   - Ensure the customer ID exists in Stripe
   - Verify that the payment method ID is valid

## Further Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe React Components](https://github.com/stripe/react-stripe-js)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
