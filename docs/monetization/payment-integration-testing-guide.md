# Payment Integration Testing Guide

This guide outlines the process for testing the Stripe payment integration in the Customizable Chatbots platform.

## Prerequisites

Before testing the payment integration, ensure the following:

1. Environment variables are properly configured:
   - `STRIPE_SECRET_KEY` - Your Stripe secret API key for server-side operations
   - `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key for client-side operations
   - `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret

2. Required dependencies are installed:
   ```bash
   npm install stripe @stripe/react-stripe-js @stripe/stripe-js
   ```

3. Stripe CLI is installed for webhook testing (optional but recommended)

## Testing Checklist

### 1. Backend API Tests

- [ ] Run integration tests for payment service:
  ```bash
  npm run test:integration -- --testPathPattern=billing/payment.integration.test.js
  ```

- [ ] Verify payment intent creation
- [ ] Verify setup intent creation
- [ ] Verify payment method management (add, set default, remove)
- [ ] Verify webhook handling

### 2. Frontend Component Tests

- [ ] Test payment form component
- [ ] Test payment method management
- [ ] Test subscription management
- [ ] Test plan selection

### 3. End-to-End Testing

- [ ] Run E2E tests for payment onboarding flow:
  ```bash
  npm run test:e2e -- --testPathPattern=payment-onboarding.test.js
  ```

- [ ] Manually test the complete payment flow:
  1. Select a plan
  2. Enter payment details
  3. Complete payment
  4. Verify subscription activation
  5. Add additional payment methods
  6. Set default payment method
  7. Remove payment method

## Testing with Stripe Test Cards

Use the following Stripe test cards for different scenarios:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Declined payment (generic) |
| 4000 0000 0000 9995 | Declined payment (insufficient funds) |
| 4000 0000 0000 3220 | 3D Secure authentication required |

For all test cards:
- Use any future expiration date
- Use any 3-digit CVC
- Use any postal code

## Testing Webhooks Locally

1. Install the Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows (with Chocolatey)
   choco install stripe-cli
   ```

2. Log in to your Stripe account:
   ```bash
   stripe login
   ```

3. Start forwarding webhooks to your local server:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/billing/payment/webhook
   ```

4. Trigger webhook events for testing:
   ```bash
   # Successful payment
   stripe trigger payment_intent.succeeded
   
   # Failed payment
   stripe trigger payment_intent.payment_failed
   ```

## Troubleshooting

### Common Issues

1. **Payment intent creation fails**
   - Check that your Stripe secret key is valid
   - Verify that the subscription ID exists
   - Ensure the amount is greater than the minimum (usually $0.50 USD)

2. **Webhook signature verification fails**
   - Confirm the webhook secret is correctly set
   - Check that the raw request body is being used for verification
   - Ensure the Stripe-Signature header is being passed correctly

3. **Frontend payment form errors**
   - Verify that the Stripe Elements are properly initialized
   - Check browser console for errors
   - Ensure the client secret is being passed correctly to confirmCardPayment

### Debugging Tips

1. Use Stripe Dashboard to inspect events, payments, and logs
2. Enable detailed logging in the payment service
3. Use browser developer tools to monitor network requests
4. Check Stripe CLI output for webhook events

## Production Considerations

Before deploying to production:

1. Switch to production Stripe API keys
2. Configure proper error handling and monitoring
3. Implement idempotency keys for payment operations
4. Set up production webhooks in Stripe Dashboard
5. Implement proper security measures (TLS, CORS, etc.)
6. Test the complete payment flow in a staging environment

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Elements Documentation](https://stripe.com/docs/stripe-js)
- [Stripe Testing Documentation](https://stripe.com/docs/testing)
- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
