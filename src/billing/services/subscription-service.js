/**
 * Subscription Service
 * 
 * Provides business logic for managing subscriptions in the chatbot platform.
 */

const { Subscription, SUBSCRIPTION_TIERS } = require('../models/subscription');
const { logger } = require('../../utils/logger');

class SubscriptionService {
  /**
   * Create a new subscription for a tenant
   * 
   * @param {string} tenantId - ID of the tenant
   * @param {Object} subscriptionData - Subscription details
   * @returns {Promise<Object>} - Created subscription
   */
  async createSubscription(tenantId, subscriptionData = {}) {
    try {
      const tier = subscriptionData.tier || SUBSCRIPTION_TIERS.FREE;
      
      // Check if tenant already has a subscription
      const existingSubscription = await Subscription.findOne({ tenantId });
      if (existingSubscription) {
        throw new Error(`Tenant ${tenantId} already has a subscription`);
      }
      
      // Set billing cycle end date
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      if (subscriptionData.billingCycle === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        // Default to monthly
        endDate.setMonth(endDate.getMonth() + 1);
      }
      
      // Create subscription
      const subscription = new Subscription({
        tenantId,
        tier,
        startDate,
        billingCycle: subscriptionData.billingCycle || 'monthly',
        paymentMethod: subscriptionData.paymentMethod,
        customLimits: subscriptionData.customLimits,
        usageStats: {
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
          conversationsUsed: 0,
          chatbotsCreated: 0,
          knowledgeBasesCreated: 0
        }
      });
      
      await subscription.save();
      logger.info(`Created ${tier} subscription for tenant ${tenantId}`);
      
      return subscription;
    } catch (error) {
      logger.error(`Failed to create subscription: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get subscription by tenant ID
   * 
   * @param {string} tenantId - ID of the tenant
   * @returns {Promise<Object>} - Subscription
   */
  async getSubscriptionByTenantId(tenantId) {
    try {
      const subscription = await Subscription.findOne({ tenantId });
      
      if (!subscription) {
        throw new Error(`No subscription found for tenant ${tenantId}`);
      }
      
      return subscription;
    } catch (error) {
      logger.error(`Failed to get subscription: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update subscription tier
   * 
   * @param {string} tenantId - ID of the tenant
   * @param {string} newTier - New subscription tier
   * @returns {Promise<Object>} - Updated subscription
   */
  async updateSubscriptionTier(tenantId, newTier) {
    try {
      const subscription = await this.getSubscriptionByTenantId(tenantId);
      
      // Validate tier
      if (!Object.values(SUBSCRIPTION_TIERS).includes(newTier)) {
        throw new Error(`Invalid subscription tier: ${newTier}`);
      }
      
      // Check if downgrading to free while having active paid features
      if (newTier === SUBSCRIPTION_TIERS.FREE && 
          subscription.tier !== SUBSCRIPTION_TIERS.FREE) {
        // Check if tenant is using features beyond free tier
        const freeTierLimits = Subscription.getTierLimits(SUBSCRIPTION_TIERS.FREE);
        
        if (subscription.usageStats.chatbotsCreated > freeTierLimits.chatbots ||
            subscription.usageStats.knowledgeBasesCreated > freeTierLimits.knowledgeBases) {
          throw new Error('Cannot downgrade to free tier with active resources exceeding free tier limits');
        }
      }
      
      // Update tier
      subscription.tier = newTier;
      await subscription.save();
      
      logger.info(`Updated subscription for tenant ${tenantId} to ${newTier} tier`);
      return subscription;
    } catch (error) {
      logger.error(`Failed to update subscription tier: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Cancel subscription
   * 
   * @param {string} tenantId - ID of the tenant
   * @returns {Promise<Object>} - Canceled subscription
   */
  async cancelSubscription(tenantId) {
    try {
      const subscription = await this.getSubscriptionByTenantId(tenantId);
      
      // Cancel subscription
      await subscription.cancel();
      
      logger.info(`Canceled subscription for tenant ${tenantId}`);
      return subscription;
    } catch (error) {
      logger.error(`Failed to cancel subscription: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Record conversation usage
   * 
   * @param {string} tenantId - ID of the tenant
   * @param {number} count - Number of conversations to record
   * @returns {Promise<Object>} - Updated subscription
   */
  async recordConversationUsage(tenantId, count = 1) {
    try {
      const subscription = await this.getSubscriptionByTenantId(tenantId);
      
      // Increment usage
      await subscription.incrementConversationUsage(count);
      
      // Check if exceeded limit
      if (subscription.hasExceededConversationLimit()) {
        logger.warn(`Tenant ${tenantId} has exceeded conversation limit`);
      }
      
      return subscription;
    } catch (error) {
      logger.error(`Failed to record conversation usage: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Record chatbot creation
   * 
   * @param {string} tenantId - ID of the tenant
   * @returns {Promise<boolean>} - Whether the chatbot can be created
   */
  async recordChatbotCreation(tenantId) {
    try {
      const subscription = await this.getSubscriptionByTenantId(tenantId);
      
      // Check if exceeded limit
      if (subscription.hasExceededChatbotLimit()) {
        logger.warn(`Tenant ${tenantId} has exceeded chatbot limit`);
        return false;
      }
      
      // Increment usage
      await subscription.incrementChatbotCount();
      return true;
    } catch (error) {
      logger.error(`Failed to record chatbot creation: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Record knowledge base creation
   * 
   * @param {string} tenantId - ID of the tenant
   * @returns {Promise<boolean>} - Whether the knowledge base can be created
   */
  async recordKnowledgeBaseCreation(tenantId) {
    try {
      const subscription = await this.getSubscriptionByTenantId(tenantId);
      
      // Check if exceeded limit
      if (subscription.hasExceededKnowledgeBaseLimit()) {
        logger.warn(`Tenant ${tenantId} has exceeded knowledge base limit`);
        return false;
      }
      
      // Increment usage
      await subscription.incrementKnowledgeBaseCount();
      return true;
    } catch (error) {
      logger.error(`Failed to record knowledge base creation: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calculate current bill for a tenant
   * 
   * @param {string} tenantId - ID of the tenant
   * @returns {Promise<Object>} - Billing information
   */
  async calculateCurrentBill(tenantId) {
    try {
      const subscription = await this.getSubscriptionByTenantId(tenantId);
      
      // Skip for free tier
      if (subscription.tier === SUBSCRIPTION_TIERS.FREE) {
        return {
          baseFee: 0,
          overageCharges: 0,
          total: 0
        };
      }
      
      // Get base price for tier
      const tierLimits = subscription.getLimits();
      const baseFee = tierLimits.price;
      
      // Calculate overage charges
      const overageCharges = subscription.calculateOverageCharges();
      
      // Apply discount for annual billing
      let total = baseFee + overageCharges;
      if (subscription.billingCycle === 'annual') {
        // 20% discount for annual billing
        total = total * 0.8;
      }
      
      return {
        baseFee,
        overageCharges,
        total,
        billingCycle: subscription.billingCycle,
        nextBillingDate: subscription.usageStats.currentPeriodEnd
      };
    } catch (error) {
      logger.error(`Failed to calculate bill: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Process billing for all subscriptions
   * 
   * @returns {Promise<Array>} - Processed billing records
   */
  async processBilling() {
    try {
      const now = new Date();
      
      // Find subscriptions due for billing
      const dueSubscriptions = await Subscription.find({
        'usageStats.currentPeriodEnd': { $lte: now },
        'status': { $in: ['active', 'trialing'] },
        'autoRenew': true
      });
      
      logger.info(`Processing billing for ${dueSubscriptions.length} subscriptions`);
      
      const billingResults = [];
      
      // Process each subscription
      for (const subscription of dueSubscriptions) {
        try {
          // Skip free tier
          if (subscription.tier === SUBSCRIPTION_TIERS.FREE) {
            await subscription.resetUsageStats();
            continue;
          }
          
          // Calculate amount to charge
          const bill = await this.calculateCurrentBill(subscription.tenantId);
          
          // In a real implementation, this would integrate with a payment processor
          // For now, we'll simulate a successful payment
          const paymentResult = {
            success: true,
            invoiceUrl: `https://example.com/invoices/${subscription._id}-${Date.now()}`
          };
          
          // Record billing
          if (paymentResult.success) {
            await subscription.addBillingRecord(
              bill.total,
              'paid',
              paymentResult.invoiceUrl
            );
            
            // Reset usage for new period
            await subscription.resetUsageStats();
            
            billingResults.push({
              tenantId: subscription.tenantId,
              amount: bill.total,
              status: 'paid'
            });
          } else {
            // Handle failed payment
            await subscription.addBillingRecord(
              bill.total,
              'failed',
              null
            );
            
            // Mark subscription as past due
            subscription.status = 'past_due';
            await subscription.save();
            
            billingResults.push({
              tenantId: subscription.tenantId,
              amount: bill.total,
              status: 'failed'
            });
          }
        } catch (error) {
          logger.error(`Error processing billing for tenant ${subscription.tenantId}: ${error.message}`);
          
          billingResults.push({
            tenantId: subscription.tenantId,
            status: 'error',
            error: error.message
          });
        }
      }
      
      return billingResults;
    } catch (error) {
      logger.error(`Failed to process billing: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get subscription usage report
   * 
   * @param {string} tenantId - ID of the tenant
   * @returns {Promise<Object>} - Usage report
   */
  async getUsageReport(tenantId) {
    try {
      const subscription = await this.getSubscriptionByTenantId(tenantId);
      const limits = subscription.getLimits();
      
      return {
        tier: subscription.tier,
        periodStart: subscription.usageStats.currentPeriodStart,
        periodEnd: subscription.usageStats.currentPeriodEnd,
        conversations: {
          used: subscription.usageStats.conversationsUsed,
          limit: limits.conversationsPerMonth,
          percentage: limits.conversationsPerMonth === -1 ? 0 : 
            (subscription.usageStats.conversationsUsed / limits.conversationsPerMonth) * 100
        },
        chatbots: {
          used: subscription.usageStats.chatbotsCreated,
          limit: limits.chatbots,
          percentage: limits.chatbots === -1 ? 0 : 
            (subscription.usageStats.chatbotsCreated / limits.chatbots) * 100
        },
        knowledgeBases: {
          used: subscription.usageStats.knowledgeBasesCreated,
          limit: limits.knowledgeBases,
          percentage: limits.knowledgeBases === -1 ? 0 : 
            (subscription.usageStats.knowledgeBasesCreated / limits.knowledgeBases) * 100
        }
      };
    } catch (error) {
      logger.error(`Failed to get usage report: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new SubscriptionService();
