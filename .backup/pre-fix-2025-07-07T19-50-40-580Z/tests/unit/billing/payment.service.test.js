/**
 * Payment Service Unit Tests
 * 
 * Tests for the payment service functionality
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const paymentService = require('../../../src/billing/services/payment.service');
const Payment = require('../../../src/billing/models/payment.model');
const PaymentMethod = require('../../../src/billing/models/payment-method.model');
const { createPaymentError } = require('../../../src/billing/utils/payment-error-handler');

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => {
    return {
      paymentIntents: {
        create: jest.fn().mockResolvedValue({
          id: 'pi_mock_123',
          client_secret: 'pi_mock_secret_123',
          status: 'requires_payment_method'
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'pi_mock_123',
          status: 'succeeded'
        }),
        update: jest.fn().mockResolvedValue({
          id: 'pi_mock_123',
          status: 'requires_confirmation'
        }),
        confirm: jest.fn().mockResolvedValue({
          id: 'pi_mock_123',
          status: 'succeeded'
        })
      },
      paymentMethods: {
        create: jest.fn().mockResolvedValue({
          id: 'pm_mock_123',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025
          }
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'pm_mock_123',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025
          }
        }),
        attach: jest.fn().mockResolvedValue({
          id: 'pm_mock_123'
        }),
        detach: jest.fn().mockResolvedValue({
          id: 'pm_mock_123',
          deleted: true
        })
      },
      setupIntents: {
        create: jest.fn().mockResolvedValue({
          id: 'seti_mock_123',
          client_secret: 'seti_mock_secret_123',
          status: 'requires_payment_method'
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'seti_mock_123',
          status: 'succeeded',
          payment_method: 'pm_mock_123'
        })
      },
      refunds: {
        create: jest.fn().mockResolvedValue({
          id: 'ref_mock_123',
          status: 'succeeded',
          amount: 500
        })
      },
      customers: {
        create: jest.fn().mockResolvedValue({
          id: 'cus_mock_123'
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'cus_mock_123',
          name: 'Test Customer'
        }),
        update: jest.fn().mockResolvedValue({
          id: 'cus_mock_123',
          name: 'Updated Customer'
        })
      }
    };
  });
});

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// MongoDB Memory Server for testing
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Clear database collections
  await Payment.deleteMany({});
  await PaymentMethod.deleteMany({});
});

describe('Payment Service', () => {
  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      // Arrange
      const paymentData = {
        amount: 999,
        currency: 'usd',
        customerId: 'user_123',
        paymentMethodId: 'pm_123',
        description: 'Test payment'
      };
      
      // Act
      const result = await paymentService.createPaymentIntent(paymentData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('pi_mock_123');
      expect(result.client_secret).toBe('pi_mock_secret_123');
    });
    
    it('should throw error when amount is invalid', async () => {
      // Arrange
      const paymentData = {
        amount: -100,
        currency: 'usd',
        customerId: 'user_123',
        paymentMethodId: 'pm_123',
        description: 'Test payment'
      };
      
      // Act & Assert
      await expect(paymentService.createPaymentIntent(paymentData))
        .rejects.toThrow('Invalid payment amount');
    });
    
    it('should throw error when currency is invalid', async () => {
      // Arrange
      const paymentData = {
        amount: 999,
        currency: 'invalid',
        customerId: 'user_123',
        paymentMethodId: 'pm_123',
        description: 'Test payment'
      };
      
      // Act & Assert
      await expect(paymentService.createPaymentIntent(paymentData))
        .rejects.toThrow('Invalid currency');
    });
    
    it('should create a payment record in the database', async () => {
      // Arrange
      const paymentData = {
        amount: 999,
        currency: 'usd',
        customerId: 'user_123',
        tenantId: 'tenant_123',
        paymentMethodId: 'pm_123',
        description: 'Test payment'
      };
      
      // Act
      await paymentService.createPaymentIntent(paymentData);
      
      // Assert
      const payment = await Payment.findOne({ userId: 'user_123' });
      expect(payment).toBeDefined();
      expect(payment.amount).toBe(paymentData.amount);
      expect(payment.currency).toBe(paymentData.currency.toUpperCase());
      expect(payment.status).toBe('pending');
    });
  });
  
  describe('confirmPaymentIntent', () => {
    it('should confirm a payment intent successfully', async () => {
      // Arrange
      const paymentIntentId = 'pi_mock_123';
      
      // Create a payment record
      await new Payment({
        tenantId: 'tenant_123',
        userId: 'user_123',
        paymentMethodId: 'pm_123',
        paymentIntentId,
        amount: 999,
        currency: 'USD',
        status: 'pending',
        description: 'Test payment'
      }).save();
      
      // Act
      const result = await paymentService.confirmPaymentIntent(paymentIntentId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('succeeded');
      
      // Check that payment record was updated
      const payment = await Payment.findOne({ paymentIntentId });
      expect(payment).toBeDefined();
      expect(payment.status).toBe('succeeded');
    });
    
    it('should throw error when payment intent not found', async () => {
      // Arrange
      const paymentIntentId = 'pi_nonexistent';
      
      // Mock Stripe to throw error
      const stripe = require('stripe')();
      stripe.paymentIntents.retrieve.mockRejectedValueOnce(new Error('No such payment intent'));
      
      // Act & Assert
      await expect(paymentService.confirmPaymentIntent(paymentIntentId))
        .rejects.toThrow('Payment intent not found');
    });
  });
  
  describe('createSetupIntent', () => {
    it('should create a setup intent successfully', async () => {
      // Arrange
      const customerId = 'user_123';
      
      // Act
      const result = await paymentService.createSetupIntent(customerId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('seti_mock_123');
      expect(result.client_secret).toBe('seti_mock_secret_123');
    });
  });
  
  describe('savePaymentMethod', () => {
    it('should save a payment method successfully', async () => {
      // Arrange
      const paymentMethodData = {
        userId: 'user_123',
        tenantId: 'tenant_123',
        paymentMethodId: 'pm_mock_123',
        isDefault: true
      };
      
      // Act
      const result = await paymentService.savePaymentMethod(paymentMethodData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(paymentMethodData.userId);
      expect(result.paymentMethodId).toBe(paymentMethodData.paymentMethodId);
      expect(result.isDefault).toBe(true);
      
      // Check that it was saved to the database
      const paymentMethod = await PaymentMethod.findOne({ paymentMethodId: 'pm_mock_123' });
      expect(paymentMethod).toBeDefined();
      expect(paymentMethod.userId).toBe(paymentMethodData.userId);
    });
    
    it('should retrieve payment method details from Stripe', async () => {
      // Arrange
      const paymentMethodData = {
        userId: 'user_123',
        tenantId: 'tenant_123',
        paymentMethodId: 'pm_mock_123',
        isDefault: true
      };
      
      // Act
      const result = await paymentService.savePaymentMethod(paymentMethodData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.card).toBeDefined();
      expect(result.card.brand).toBe('visa');
      expect(result.card.last4).toBe('4242');
      
      // Check that Stripe API was called
      const stripe = require('stripe')();
      expect(stripe.paymentMethods.retrieve).toHaveBeenCalledWith('pm_mock_123');
    });
  });
  
  describe('getPaymentMethods', () => {
    it('should return payment methods for a user', async () => {
      // Arrange
      const userId = 'user_123';
      const tenantId = 'tenant_123';
      
      // Create payment methods
      await new PaymentMethod({
        userId,
        tenantId,
        paymentMethodId: 'pm_1',
        type: 'card',
        isDefault: true,
        status: 'active',
        card: {
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025
        }
      }).save();
      
      await new PaymentMethod({
        userId,
        tenantId,
        paymentMethodId: 'pm_2',
        type: 'card',
        isDefault: false,
        status: 'active',
        card: {
          brand: 'mastercard',
          last4: '5555',
          expMonth: 10,
          expYear: 2024
        }
      }).save();
      
      // Act
      const result = await paymentService.getPaymentMethods(userId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].isDefault).toBe(true);
      expect(result[0].paymentMethodId).toBe('pm_1');
    });
    
    it('should return empty array when no payment methods exist', async () => {
      // Arrange
      const userId = 'user_without_payment_methods';
      
      // Act
      const result = await paymentService.getPaymentMethods(userId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });
  });
  
  describe('deletePaymentMethod', () => {
    it('should delete a payment method successfully', async () => {
      // Arrange
      const userId = 'user_123';
      const paymentMethodId = 'pm_to_delete';
      
      // Create payment method
      await new PaymentMethod({
        userId,
        tenantId: 'tenant_123',
        paymentMethodId,
        type: 'card',
        isDefault: true,
        status: 'active',
        card: {
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025
        }
      }).save();
      
      // Act
      const result = await paymentService.deletePaymentMethod(userId, paymentMethodId);
      
      // Assert
      expect(result).toBe(true);
      
      // Check that it was removed from the database
      const paymentMethod = await PaymentMethod.findOne({ paymentMethodId });
      expect(paymentMethod).toBeNull();
    });
    
    it('should throw error when payment method not found', async () => {
      // Arrange
      const userId = 'user_123';
      const paymentMethodId = 'pm_nonexistent';
      
      // Act & Assert
      await expect(paymentService.deletePaymentMethod(userId, paymentMethodId))
        .rejects.toThrow('Payment method not found');
    });
    
    it('should throw error when payment method belongs to another user', async () => {
      // Arrange
      const userId = 'user_123';
      const otherUserId = 'user_456';
      const paymentMethodId = 'pm_other_user';
      
      // Create payment method for other user
      await new PaymentMethod({
        userId: otherUserId,
        tenantId: 'tenant_456',
        paymentMethodId,
        type: 'card',
        isDefault: true,
        status: 'active',
        card: {
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025
        }
      }).save();
      
      // Act & Assert
      await expect(paymentService.deletePaymentMethod(userId, paymentMethodId))
        .rejects.toThrow('Payment method not found');
    });
  });
  
  describe('processRefund', () => {
    it('should process a refund successfully', async () => {
      // Arrange
      const paymentIntentId = 'pi_to_refund';
      const refundAmount = 500;
      
      // Create a payment record
      await new Payment({
        tenantId: 'tenant_123',
        userId: 'user_123',
        paymentMethodId: 'pm_123',
        paymentIntentId,
        amount: 1000,
        currency: 'USD',
        status: 'succeeded',
        description: 'Test payment'
      }).save();
      
      // Act
      const result = await paymentService.processRefund({
        paymentIntentId,
        amount: refundAmount,
        reason: 'requested_by_customer'
      });
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('ref_mock_123');
      expect(result.status).toBe('succeeded');
      
      // Check that payment record was updated
      const payment = await Payment.findOne({ paymentIntentId });
      expect(payment).toBeDefined();
      expect(payment.status).toBe('partially_refunded');
      expect(payment.refundedAmount).toBe(refundAmount);
      expect(payment.refunds.length).toBe(1);
    });
    
    it('should set status to refunded when full amount is refunded', async () => {
      // Arrange
      const paymentIntentId = 'pi_to_refund_full';
      const amount = 1000;
      
      // Create a payment record
      await new Payment({
        tenantId: 'tenant_123',
        userId: 'user_123',
        paymentMethodId: 'pm_123',
        paymentIntentId,
        amount,
        currency: 'USD',
        status: 'succeeded',
        description: 'Test payment'
      }).save();
      
      // Act
      const result = await paymentService.processRefund({
        paymentIntentId,
        amount,
        reason: 'requested_by_customer'
      });
      
      // Assert
      expect(result).toBeDefined();
      
      // Check that payment record was updated
      const payment = await Payment.findOne({ paymentIntentId });
      expect(payment).toBeDefined();
      expect(payment.status).toBe('refunded');
      expect(payment.refundedAmount).toBe(amount);
    });
    
    it('should throw error when payment not found', async () => {
      // Arrange
      const paymentIntentId = 'pi_nonexistent';
      
      // Act & Assert
      await expect(paymentService.processRefund({
        paymentIntentId,
        amount: 500,
        reason: 'requested_by_customer'
      })).rejects.toThrow('Payment not found');
    });
    
    it('should throw error when refund amount exceeds payment amount', async () => {
      // Arrange
      const paymentIntentId = 'pi_to_refund_invalid';
      const amount = 1000;
      
      // Create a payment record
      await new Payment({
        tenantId: 'tenant_123',
        userId: 'user_123',
        paymentMethodId: 'pm_123',
        paymentIntentId,
        amount,
        currency: 'USD',
        status: 'succeeded',
        description: 'Test payment'
      }).save();
      
      // Act & Assert
      await expect(paymentService.processRefund({
        paymentIntentId,
        amount: 1500,
        reason: 'requested_by_customer'
      })).rejects.toThrow('Refund amount exceeds payment amount');
    });
  });
  
  describe('getPaymentById', () => {
    it('should return payment by ID', async () => {
      // Arrange
      const payment = new Payment({
        tenantId: 'tenant_123',
        userId: 'user_123',
        paymentMethodId: 'pm_123',
        paymentIntentId: 'pi_123',
        amount: 999,
        currency: 'USD',
        status: 'succeeded',
        description: 'Test payment'
      });
      
      await payment.save();
      
      // Act
      const result = await paymentService.getPaymentById(payment._id);
      
      // Assert
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(payment._id.toString());
      expect(result.paymentIntentId).toBe('pi_123');
    });
    
    it('should return null when payment not found', async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();
      
      // Act
      const result = await paymentService.getPaymentById(nonExistentId);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('getPaymentsByUser', () => {
    it('should return payments for a user', async () => {
      // Arrange
      const userId = 'user_123';
      
      // Create payments
      await new Payment({
        tenantId: 'tenant_123',
        userId,
        paymentMethodId: 'pm_123',
        paymentIntentId: 'pi_1',
        amount: 999,
        currency: 'USD',
        status: 'succeeded',
        description: 'Payment 1'
      }).save();
      
      await new Payment({
        tenantId: 'tenant_123',
        userId,
        paymentMethodId: 'pm_123',
        paymentIntentId: 'pi_2',
        amount: 1999,
        currency: 'USD',
        status: 'succeeded',
        description: 'Payment 2'
      }).save();
      
      // Act
      const result = await paymentService.getPaymentsByUser(userId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].userId).toBe(userId);
      expect(result[1].userId).toBe(userId);
    });
    
    it('should return empty array when no payments exist', async () => {
      // Arrange
      const userId = 'user_without_payments';
      
      // Act
      const result = await paymentService.getPaymentsByUser(userId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });
  });
});
