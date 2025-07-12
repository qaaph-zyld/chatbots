/**
 * Payment Error Middleware Unit Tests
 */

const paymentErrorMiddleware = require('../../../src/billing/middleware/payment-error.middleware');

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Payment Error Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock request and response objects
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });
  
  it('should handle payment errors correctly', () => {
    // Create a mock payment error
    const paymentError = new Error('Payment failed');
    paymentError.isPaymentError = true;
    paymentError.code = 'card_declined';
    paymentError.statusCode = 400;
    paymentError.suggestion = 'Try another card';
    
    // Call middleware with payment error
    paymentErrorMiddleware(paymentError, req, res, next);
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Payment failed',
      code: 'card_declined',
      suggestion: 'Try another card'
    });
    expect(next).not.toHaveBeenCalled();
  });
  
  it('should use default status code if not provided', () => {
    // Create a mock payment error without status code
    const paymentError = new Error('Payment failed');
    paymentError.isPaymentError = true;
    paymentError.code = 'card_declined';
    paymentError.suggestion = 'Try another card';
    
    // Call middleware with payment error
    paymentErrorMiddleware(paymentError, req, res, next);
    
    // Verify response uses default status code
    expect(res.status).toHaveBeenCalledWith(400); // Default status code
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Payment failed',
      code: 'card_declined',
      suggestion: 'Try another card'
    });
  });
  
  it('should pass non-payment errors to next middleware', () => {
    // Create a regular error
    const regularError = new Error('Some other error');
    
    // Call middleware with regular error
    paymentErrorMiddleware(regularError, req, res, next);
    
    // Verify next was called with the error
    expect(next).toHaveBeenCalledWith(regularError);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
  
  it('should include error details if available', () => {
    // Create a mock payment error with details
    const paymentError = new Error('Payment failed');
    paymentError.isPaymentError = true;
    paymentError.code = 'card_declined';
    paymentError.statusCode = 400;
    paymentError.suggestion = 'Try another card';
    paymentError.details = {
      declineCode: 'insufficient_funds',
      attemptCount: 1
    };
    
    // Call middleware with payment error
    paymentErrorMiddleware(paymentError, req, res, next);
    
    // Verify response includes details
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Payment failed',
      code: 'card_declined',
      suggestion: 'Try another card',
      details: {
        declineCode: 'insufficient_funds',
        attemptCount: 1
      }
    });
  });
  
  it('should handle errors with missing properties gracefully', () => {
    // Create a minimal payment error
    const minimalError = new Error('Payment failed');
    minimalError.isPaymentError = true;
    
    // Call middleware with minimal error
    paymentErrorMiddleware(minimalError, req, res, next);
    
    // Verify response has default values
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Payment failed',
      code: 'payment_error', // Default code
      suggestion: expect.any(String) // Default suggestion
    });
  });
  
  it('should log payment errors when configured to do so', () => {
    // Create middleware with logging enabled
    const loggingMiddleware = paymentErrorMiddleware.withLogging;
    
    // Create a mock payment error
    const paymentError = new Error('Payment failed');
    paymentError.isPaymentError = true;
    paymentError.code = 'card_declined';
    paymentError.statusCode = 400;
    
    // Mock logger
    const logger = require('../../../src/utils/logger');
    
    // Call middleware with payment error
    loggingMiddleware(paymentError, req, res, next);
    
    // Verify logger was called
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Payment error'),
      expect.objectContaining({
        code: 'card_declined',
        message: 'Payment failed'
      })
    );
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'Payment failed',
      code: 'card_declined'
    }));
  });
});
