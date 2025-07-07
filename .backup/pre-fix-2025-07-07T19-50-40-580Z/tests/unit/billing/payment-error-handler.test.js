/**
 * Payment Error Handler Unit Tests
 */

const paymentErrorHandler = require('../../../src/billing/utils/payment-error-handler');

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Payment Error Handler', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });
  
  describe('handlePaymentError', () => {
    it('should handle Stripe card_declined error', () => {
      // Create a mock Stripe card_declined error
      const stripeError = {
        type: 'StripeCardError',
        code: 'card_declined',
        message: 'Your card was declined.',
        decline_code: 'generic_decline'
      };
      
      const handledError = paymentErrorHandler.handlePaymentError(stripeError);
      
      expect(handledError).toBeDefined();
      expect(handledError.code).toBe('card_declined');
      expect(handledError.message).toContain('Your card was declined');
      expect(handledError.statusCode).toBe(400);
      expect(handledError.suggestion).toBeDefined();
      expect(handledError.isPaymentError).toBe(true);
    });
    
    it('should handle Stripe insufficient_funds error', () => {
      // Create a mock Stripe insufficient_funds error
      const stripeError = {
        type: 'StripeCardError',
        code: 'card_declined',
        message: 'Your card has insufficient funds.',
        decline_code: 'insufficient_funds'
      };
      
      const handledError = paymentErrorHandler.handlePaymentError(stripeError);
      
      expect(handledError).toBeDefined();
      expect(handledError.code).toBe('insufficient_funds');
      expect(handledError.message).toContain('insufficient funds');
      expect(handledError.statusCode).toBe(400);
      expect(handledError.suggestion).toContain('funds');
      expect(handledError.isPaymentError).toBe(true);
    });
    
    it('should handle Stripe expired_card error', () => {
      // Create a mock Stripe expired_card error
      const stripeError = {
        type: 'StripeCardError',
        code: 'expired_card',
        message: 'Your card has expired.'
      };
      
      const handledError = paymentErrorHandler.handlePaymentError(stripeError);
      
      expect(handledError).toBeDefined();
      expect(handledError.code).toBe('expired_card');
      expect(handledError.message).toContain('expired');
      expect(handledError.statusCode).toBe(400);
      expect(handledError.suggestion).toContain('expiration date');
      expect(handledError.isPaymentError).toBe(true);
    });
    
    it('should handle Stripe incorrect_cvc error', () => {
      // Create a mock Stripe incorrect_cvc error
      const stripeError = {
        type: 'StripeCardError',
        code: 'incorrect_cvc',
        message: 'Your card\'s security code is incorrect.'
      };
      
      const handledError = paymentErrorHandler.handlePaymentError(stripeError);
      
      expect(handledError).toBeDefined();
      expect(handledError.code).toBe('incorrect_cvc');
      expect(handledError.message).toContain('security code');
      expect(handledError.statusCode).toBe(400);
      expect(handledError.suggestion).toContain('CVC');
      expect(handledError.isPaymentError).toBe(true);
    });
    
    it('should handle Stripe processing_error', () => {
      // Create a mock Stripe processing_error
      const stripeError = {
        type: 'StripeCardError',
        code: 'processing_error',
        message: 'An error occurred while processing your card.'
      };
      
      const handledError = paymentErrorHandler.handlePaymentError(stripeError);
      
      expect(handledError).toBeDefined();
      expect(handledError.code).toBe('processing_error');
      expect(handledError.message).toContain('processing');
      expect(handledError.statusCode).toBe(500);
      expect(handledError.suggestion).toContain('try again');
      expect(handledError.isPaymentError).toBe(true);
    });
    
    it('should handle Stripe authentication_required error', () => {
      // Create a mock Stripe authentication_required error
      const stripeError = {
        type: 'StripeCardError',
        code: 'authentication_required',
        message: 'Your card was declined. This transaction requires authentication.'
      };
      
      const handledError = paymentErrorHandler.handlePaymentError(stripeError);
      
      expect(handledError).toBeDefined();
      expect(handledError.code).toBe('authentication_required');
      expect(handledError.message).toContain('authentication');
      expect(handledError.statusCode).toBe(400);
      expect(handledError.suggestion).toContain('authenticate');
      expect(handledError.isPaymentError).toBe(true);
    });
    
    it('should handle Stripe rate_limit_error', () => {
      // Create a mock Stripe rate_limit_error
      const stripeError = {
        type: 'StripeRateLimitError',
        code: 'rate_limit',
        message: 'Too many requests. Try again later.'
      };
      
      const handledError = paymentErrorHandler.handlePaymentError(stripeError);
      
      expect(handledError).toBeDefined();
      expect(handledError.code).toBe('rate_limit_error');
      expect(handledError.message).toContain('Too many requests');
      expect(handledError.statusCode).toBe(429);
      expect(handledError.suggestion).toContain('try again later');
      expect(handledError.isPaymentError).toBe(true);
    });
    
    it('should handle Stripe api_connection_error', () => {
      // Create a mock Stripe api_connection_error
      const stripeError = {
        type: 'StripeConnectionError',
        code: 'api_connection_error',
        message: 'Could not connect to Stripe API.'
      };
      
      const handledError = paymentErrorHandler.handlePaymentError(stripeError);
      
      expect(handledError).toBeDefined();
      expect(handledError.code).toBe('api_connection_error');
      expect(handledError.message).toContain('connection');
      expect(handledError.statusCode).toBe(503);
      expect(handledError.suggestion).toContain('try again');
      expect(handledError.isPaymentError).toBe(true);
    });
    
    it('should handle unknown Stripe errors', () => {
      // Create a mock unknown Stripe error
      const stripeError = {
        type: 'StripeError',
        code: 'unknown_error',
        message: 'An unknown error occurred.'
      };
      
      const handledError = paymentErrorHandler.handlePaymentError(stripeError);
      
      expect(handledError).toBeDefined();
      expect(handledError.code).toBe('payment_error');
      expect(handledError.message).toContain('error');
      expect(handledError.statusCode).toBe(500);
      expect(handledError.suggestion).toBeDefined();
      expect(handledError.isPaymentError).toBe(true);
    });
    
    it('should handle non-Stripe payment errors', () => {
      // Create a mock non-Stripe payment error
      const error = new Error('Payment failed');
      error.code = 'payment_failed';
      
      const handledError = paymentErrorHandler.handlePaymentError(error);
      
      expect(handledError).toBeDefined();
      expect(handledError.code).toBe('payment_error');
      expect(handledError.message).toContain('Payment failed');
      expect(handledError.statusCode).toBe(500);
      expect(handledError.suggestion).toBeDefined();
      expect(handledError.isPaymentError).toBe(true);
    });
    
    it('should handle generic errors', () => {
      // Create a generic error
      const error = new Error('Something went wrong');
      
      const handledError = paymentErrorHandler.handlePaymentError(error);
      
      expect(handledError).toBeDefined();
      expect(handledError.code).toBe('payment_error');
      expect(handledError.message).toContain('Something went wrong');
      expect(handledError.statusCode).toBe(500);
      expect(handledError.suggestion).toBeDefined();
      expect(handledError.isPaymentError).toBe(true);
    });
  });
  
  describe('categorizeError', () => {
    it('should categorize card errors correctly', () => {
      const cardError = {
        type: 'StripeCardError',
        code: 'card_declined'
      };
      
      const category = paymentErrorHandler.categorizeError(cardError);
      
      expect(category).toBe('card_error');
    });
    
    it('should categorize authentication errors correctly', () => {
      const authError = {
        type: 'StripeCardError',
        code: 'authentication_required'
      };
      
      const category = paymentErrorHandler.categorizeError(authError);
      
      expect(category).toBe('authentication_error');
    });
    
    it('should categorize system errors correctly', () => {
      const systemError = {
        type: 'StripeAPIError'
      };
      
      const category = paymentErrorHandler.categorizeError(systemError);
      
      expect(category).toBe('system_error');
    });
    
    it('should categorize unknown errors correctly', () => {
      const unknownError = new Error('Unknown error');
      
      const category = paymentErrorHandler.categorizeError(unknownError);
      
      expect(category).toBe('unknown_error');
    });
  });
  
  describe('getSuggestion', () => {
    it('should return appropriate suggestion for card_declined error', () => {
      const suggestion = paymentErrorHandler.getSuggestion('card_declined');
      
      expect(suggestion).toBeDefined();
      expect(suggestion).toContain('card');
    });
    
    it('should return appropriate suggestion for insufficient_funds error', () => {
      const suggestion = paymentErrorHandler.getSuggestion('insufficient_funds');
      
      expect(suggestion).toBeDefined();
      expect(suggestion).toContain('funds');
    });
    
    it('should return appropriate suggestion for expired_card error', () => {
      const suggestion = paymentErrorHandler.getSuggestion('expired_card');
      
      expect(suggestion).toBeDefined();
      expect(suggestion).toContain('expiration');
    });
    
    it('should return appropriate suggestion for incorrect_cvc error', () => {
      const suggestion = paymentErrorHandler.getSuggestion('incorrect_cvc');
      
      expect(suggestion).toBeDefined();
      expect(suggestion).toContain('CVC');
    });
    
    it('should return appropriate suggestion for processing_error', () => {
      const suggestion = paymentErrorHandler.getSuggestion('processing_error');
      
      expect(suggestion).toBeDefined();
      expect(suggestion).toContain('try again');
    });
    
    it('should return appropriate suggestion for authentication_required error', () => {
      const suggestion = paymentErrorHandler.getSuggestion('authentication_required');
      
      expect(suggestion).toBeDefined();
      expect(suggestion).toContain('authenticate');
    });
    
    it('should return appropriate suggestion for unknown error', () => {
      const suggestion = paymentErrorHandler.getSuggestion('unknown_error');
      
      expect(suggestion).toBeDefined();
      expect(suggestion).toContain('support');
    });
    
    it('should return default suggestion for unrecognized error code', () => {
      const suggestion = paymentErrorHandler.getSuggestion('some_random_error');
      
      expect(suggestion).toBeDefined();
      expect(suggestion).toContain('support');
    });
  });
  
  describe('getStatusCode', () => {
    it('should return 400 for card errors', () => {
      const statusCode = paymentErrorHandler.getStatusCode('card_declined');
      
      expect(statusCode).toBe(400);
    });
    
    it('should return 400 for authentication errors', () => {
      const statusCode = paymentErrorHandler.getStatusCode('authentication_required');
      
      expect(statusCode).toBe(400);
    });
    
    it('should return 429 for rate limit errors', () => {
      const statusCode = paymentErrorHandler.getStatusCode('rate_limit_error');
      
      expect(statusCode).toBe(429);
    });
    
    it('should return 503 for connection errors', () => {
      const statusCode = paymentErrorHandler.getStatusCode('api_connection_error');
      
      expect(statusCode).toBe(503);
    });
    
    it('should return 500 for processing errors', () => {
      const statusCode = paymentErrorHandler.getStatusCode('processing_error');
      
      expect(statusCode).toBe(500);
    });
    
    it('should return 500 for unknown errors', () => {
      const statusCode = paymentErrorHandler.getStatusCode('unknown_error');
      
      expect(statusCode).toBe(500);
    });
    
    it('should return 500 for unrecognized error codes', () => {
      const statusCode = paymentErrorHandler.getStatusCode('some_random_error');
      
      expect(statusCode).toBe(500);
    });
  });
});
