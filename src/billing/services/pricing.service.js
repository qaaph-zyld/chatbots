/**
 * Pricing Service
 * 
 * Provides business logic for pricing plan and tier management
 */

const PricingPlan = require('../models/pricing.model');
const Subscription = require('../models/subscription.model');
const logger = require('../../utils/logger');
const mongoose = require('mongoose');

/**
 * Service for pricing plan and tier management
 */
class PricingService {
  /**
   * Create a new pricing plan
   * @param {Object} planData - Pricing plan data
   * @returns {Promise<Object>} Created pricing plan
   */
  async createPricingPlan(planData) {
    try {
      // Check if plan with same name already exists
      const existingPlan = await PricingPlan.findOne({ name: planData.name });
      
      if (existingPlan) {
        throw new Error(`Pricing plan with name "${planData.name}" already exists`);
      }
      
      // Create plan
      const plan = new PricingPlan(planData);
      await plan.save();
      
      logger.info(`Created pricing plan: ${plan.name} (${plan._id})`);
      
      return plan;
    } catch (error) {
      logger.error(`Error creating pricing plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get pricing plan by ID
   * @param {string} planId - Pricing plan ID
   * @returns {Promise<Object>} Pricing plan
   */
  async getPricingPlan(planId) {
    try {
      const plan = await PricingPlan.findById(planId);
      
      if (!plan) {
        throw new Error('Pricing plan not found');
      }
      
      return plan;
    } catch (error) {
      logger.error(`Error getting pricing plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current active pricing plan
   * @returns {Promise<Object>} Current pricing plan
   */
  async getCurrentPricingPlan() {
    try {
      const plan = await PricingPlan.getCurrentPlan();
      
      if (!plan) {
        throw new Error('No active pricing plan found');
      }
      
      return plan;
    } catch (error) {
      logger.error(`Error getting current pricing plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update pricing plan
   * @param {string} planId - Pricing plan ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated pricing plan
   */
  async updatePricingPlan(planId, updateData) {
    try {
      const plan = await PricingPlan.findById(planId);
      
      if (!plan) {
        throw new Error('Pricing plan not found');
      }
      
      // Update allowed fields
      if (updateData.name) plan.name = updateData.name;
      if (updateData.description) plan.description = updateData.description;
      if (updateData.active !== undefined) plan.active = updateData.active;
      if (updateData.effectiveFrom) plan.effectiveFrom = updateData.effectiveFrom;
      if (updateData.effectiveTo) plan.effectiveTo = updateData.effectiveTo;
      
      await plan.save();
      
      logger.info(`Updated pricing plan: ${plan._id}`);
      
      return plan;
    } catch (error) {
      logger.error(`Error updating pricing plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add tier to pricing plan
   * @param {string} planId - Pricing plan ID
   * @param {Object} tierData - Tier data
   * @returns {Promise<Object>} Updated pricing plan
   */
  async addTierToPlan(planId, tierData) {
    try {
      const plan = await PricingPlan.findById(planId);
      
      if (!plan) {
        throw new Error('Pricing plan not found');
      }
      
      // Check if tier with same name already exists
      const existingTier = plan.tiers.find(tier => tier.name === tierData.name);
      
      if (existingTier) {
        throw new Error(`Tier with name "${tierData.name}" already exists in this plan`);
      }
      
      // Add tier
      plan.tiers.push(tierData);
      await plan.save();
      
      logger.info(`Added tier ${tierData.name} to pricing plan: ${plan._id}`);
      
      return plan;
    } catch (error) {
      logger.error(`Error adding tier to pricing plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update tier in pricing plan
   * @param {string} planId - Pricing plan ID
   * @param {string} tierId - Tier ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated pricing plan
   */
  async updateTier(planId, tierId, updateData) {
    try {
      const plan = await PricingPlan.findById(planId);
      
      if (!plan) {
        throw new Error('Pricing plan not found');
      }
      
      // Find tier
      const tierIndex = plan.tiers.findIndex(tier => tier._id.toString() === tierId);
      
      if (tierIndex === -1) {
        throw new Error('Tier not found in pricing plan');
      }
      
      // Update allowed fields
      const tier = plan.tiers[tierIndex];
      
      if (updateData.displayName) tier.displayName = updateData.displayName;
      if (updateData.description) tier.description = updateData.description;
      if (updateData.monthlyPrice !== undefined) tier.monthlyPrice = updateData.monthlyPrice;
      if (updateData.annualPrice !== undefined) tier.annualPrice = updateData.annualPrice;
      if (updateData.currency) tier.currency = updateData.currency;
      if (updateData.features) tier.features = updateData.features;
      if (updateData.limits) tier.limits = { ...tier.limits, ...updateData.limits };
      if (updateData.overages) tier.overages = { ...tier.overages, ...updateData.overages };
      if (updateData.trialDays !== undefined) tier.trialDays = updateData.trialDays;
      if (updateData.popular !== undefined) tier.popular = updateData.popular;
      if (updateData.visible !== undefined) tier.visible = updateData.visible;
      if (updateData.order !== undefined) tier.order = updateData.order;
      
      await plan.save();
      
      logger.info(`Updated tier ${tierId} in pricing plan: ${plan._id}`);
      
      return plan;
    } catch (error) {
      logger.error(`Error updating tier in pricing plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove tier from pricing plan
   * @param {string} planId - Pricing plan ID
   * @param {string} tierId - Tier ID
   * @returns {Promise<Object>} Updated pricing plan
   */
  async removeTierFromPlan(planId, tierId) {
    try {
      const plan = await PricingPlan.findById(planId);
      
      if (!plan) {
        throw new Error('Pricing plan not found');
      }
      
      // Check if tier exists
      const tierIndex = plan.tiers.findIndex(tier => tier._id.toString() === tierId);
      
      if (tierIndex === -1) {
        throw new Error('Tier not found in pricing plan');
      }
      
      // Check if tier is in use by any subscriptions
      const tierName = plan.tiers[tierIndex].name;
      const subscriptionsUsingTier = await Subscription.countDocuments({
        'plan.name': tierName
      });
      
      if (subscriptionsUsingTier > 0) {
        throw new Error(`Cannot remove tier "${tierName}" as it is being used by ${subscriptionsUsingTier} subscriptions`);
      }
      
      // Remove tier
      plan.tiers.splice(tierIndex, 1);
      await plan.save();
      
      logger.info(`Removed tier ${tierId} from pricing plan: ${plan._id}`);
      
      return plan;
    } catch (error) {
      logger.error(`Error removing tier from pricing plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all pricing plans
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Pricing plans
   */
  async getAllPricingPlans(options = {}) {
    try {
      const query = {};
      
      if (options.active !== undefined) {
        query.active = options.active;
      }
      
      const plans = await PricingPlan.find(query)
        .sort({ effectiveFrom: -1 });
      
      return plans;
    } catch (error) {
      logger.error(`Error getting all pricing plans: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get public pricing information
   * @returns {Promise<Object>} Public pricing information
   */
  async getPublicPricingInfo() {
    try {
      const plan = await this.getCurrentPricingPlan();
      
      // Filter out invisible tiers and sensitive information
      const publicTiers = plan.tiers
        .filter(tier => tier.visible)
        .map(tier => ({
          name: tier.name,
          displayName: tier.displayName,
          description: tier.description,
          monthlyPrice: tier.monthlyPrice,
          annualPrice: tier.annualPrice,
          currency: tier.currency,
          features: tier.features.map(feature => ({
            name: feature.name,
            description: feature.description,
            included: feature.included,
            value: feature.value,
            highlight: feature.highlight
          })),
          limits: {
            conversationsPerMonth: tier.limits.conversationsPerMonth,
            chatbots: tier.limits.chatbots,
            knowledgeBaseSize: tier.limits.knowledgeBaseSize,
            users: tier.limits.users,
            apiCalls: tier.limits.apiCalls
          },
          trialDays: tier.trialDays,
          popular: tier.popular,
          order: tier.order
        }))
        .sort((a, b) => a.order - b.order);
      
      return {
        planName: plan.name,
        description: plan.description,
        tiers: publicTiers
      };
    } catch (error) {
      logger.error(`Error getting public pricing info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate price for a subscription
   * @param {string} tierName - Tier name
   * @param {string} billingCycle - Billing cycle (monthly/annual)
   * @returns {Promise<Object>} Price information
   */
  async calculatePrice(tierName, billingCycle = 'monthly') {
    try {
      const plan = await this.getCurrentPricingPlan();
      const tier = plan.getTierByName(tierName);
      
      if (!tier) {
        throw new Error(`Tier "${tierName}" not found in current pricing plan`);
      }
      
      let basePrice = 0;
      let interval = '';
      
      if (billingCycle === 'annual') {
        basePrice = tier.annualPrice;
        interval = 'year';
      } else {
        basePrice = tier.monthlyPrice;
        interval = 'month';
      }
      
      // Calculate discount if annual
      let discount = 0;
      let discountPercentage = 0;
      
      if (billingCycle === 'annual') {
        discountPercentage = plan.getAnnualDiscountPercentage(tierName);
        discount = (tier.monthlyPrice * 12) - tier.annualPrice;
      }
      
      return {
        tierName,
        displayName: tier.displayName,
        basePrice,
        currency: tier.currency,
        billingCycle,
        interval,
        discount,
        discountPercentage,
        total: basePrice,
        trialDays: tier.trialDays
      };
    } catch (error) {
      logger.error(`Error calculating price: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate usage-based charges for a tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} usage - Usage data
   * @returns {Promise<Object>} Usage charges
   */
  async calculateUsageCharges(tenantId, usage) {
    try {
      // Get tenant's subscription
      const subscription = await Subscription.findOne({
        tenantId,
        status: { $in: ['active', 'trialing'] }
      });
      
      if (!subscription) {
        throw new Error(`No active subscription found for tenant ${tenantId}`);
      }
      
      const plan = await this.getCurrentPricingPlan();
      const tierName = subscription.plan.name;
      
      // Calculate overage charges
      const overageCharges = plan.calculateOverageCharges(tierName, usage);
      
      return {
        tenantId,
        subscriptionId: subscription._id,
        tierName,
        usage,
        overageCharges,
        currency: subscription.plan.currency || 'USD'
      };
    } catch (error) {
      logger.error(`Error calculating usage charges: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize default pricing plan
   * @returns {Promise<Object>} Created pricing plan
   */
  async initializeDefaultPricingPlan() {
    try {
      // Check if any pricing plan exists
      const existingPlans = await PricingPlan.countDocuments();
      
      if (existingPlans > 0) {
        logger.info('Default pricing plan already exists');
        return await this.getCurrentPricingPlan();
      }
      
      // Create default pricing plan
      const defaultPlan = {
        name: 'Standard Pricing',
        description: 'Standard pricing plan for chatbot platform',
        active: true,
        tiers: [
          {
            name: 'free',
            displayName: 'Free',
            description: 'Get started with basic chatbot functionality',
            monthlyPrice: 0,
            annualPrice: 0,
            currency: 'USD',
            features: [
              {
                name: 'Single Chatbot',
                description: 'Create one chatbot',
                included: true,
                order: 1
              },
              {
                name: 'Basic Templates',
                description: 'Access to basic templates',
                included: true,
                order: 2
              },
              {
                name: 'Community Support',
                description: 'Access to community forums',
                included: true,
                order: 3
              },
              {
                name: 'Knowledge Base',
                description: 'Limited knowledge base integration',
                included: true,
                order: 4
              },
              {
                name: 'Analytics',
                description: 'Basic analytics',
                included: true,
                order: 5
              }
            ],
            limits: {
              conversationsPerMonth: 100,
              chatbots: 1,
              knowledgeBaseSize: 10,
              users: 1,
              apiCalls: 100
            },
            trialDays: 0,
            popular: false,
            visible: true,
            order: 1
          },
          {
            name: 'starter',
            displayName: 'Starter',
            description: 'Perfect for small businesses',
            monthlyPrice: 29,
            annualPrice: 290,
            currency: 'USD',
            features: [
              {
                name: 'Multiple Chatbots',
                description: 'Create up to 3 chatbots',
                included: true,
                order: 1
              },
              {
                name: 'All Templates',
                description: 'Access to all templates',
                included: true,
                order: 2
              },
              {
                name: 'Email Support',
                description: '24/7 email support',
                included: true,
                order: 3
              },
              {
                name: 'Knowledge Base',
                description: 'Full knowledge base integration',
                included: true,
                order: 4
              },
              {
                name: 'Advanced Analytics',
                description: 'Detailed conversation analytics',
                included: true,
                order: 5
              },
              {
                name: 'Custom Branding',
                description: 'Remove branding',
                included: false,
                order: 6
              }
            ],
            limits: {
              conversationsPerMonth: 1000,
              chatbots: 3,
              knowledgeBaseSize: 100,
              users: 3,
              apiCalls: 1000
            },
            overages: {
              conversationPrice: 0.01,
              knowledgeBasePrice: 0.5,
              apiCallPrice: 0.005
            },
            trialDays: 14,
            popular: true,
            visible: true,
            order: 2
          },
          {
            name: 'professional',
            displayName: 'Professional',
            description: 'For growing businesses',
            monthlyPrice: 99,
            annualPrice: 990,
            currency: 'USD',
            features: [
              {
                name: 'Unlimited Chatbots',
                description: 'Create unlimited chatbots',
                included: true,
                order: 1
              },
              {
                name: 'All Templates',
                description: 'Access to all templates',
                included: true,
                order: 2
              },
              {
                name: 'Priority Support',
                description: 'Priority email and chat support',
                included: true,
                order: 3
              },
              {
                name: 'Knowledge Base',
                description: 'Advanced knowledge base with AI',
                included: true,
                order: 4
              },
              {
                name: 'Advanced Analytics',
                description: 'Detailed analytics and reporting',
                included: true,
                order: 5
              },
              {
                name: 'Custom Branding',
                description: 'Remove branding',
                included: true,
                order: 6
              },
              {
                name: 'API Access',
                description: 'Full API access',
                included: true,
                order: 7
              }
            ],
            limits: {
              conversationsPerMonth: 10000,
              chatbots: 999999, // Unlimited
              knowledgeBaseSize: 1000,
              users: 10,
              apiCalls: 10000
            },
            overages: {
              conversationPrice: 0.008,
              knowledgeBasePrice: 0.4,
              apiCallPrice: 0.004
            },
            trialDays: 14,
            popular: false,
            visible: true,
            order: 3
          },
          {
            name: 'enterprise',
            displayName: 'Enterprise',
            description: 'For large organizations',
            monthlyPrice: 499,
            annualPrice: 4990,
            currency: 'USD',
            features: [
              {
                name: 'Unlimited Everything',
                description: 'No limits on usage',
                included: true,
                order: 1
              },
              {
                name: 'Dedicated Support',
                description: 'Dedicated account manager',
                included: true,
                order: 2
              },
              {
                name: 'Custom Integrations',
                description: 'Custom integrations',
                included: true,
                order: 3
              },
              {
                name: 'SLA',
                description: '99.9% uptime SLA',
                included: true,
                order: 4
              },
              {
                name: 'On-Premises',
                description: 'On-premises deployment option',
                included: true,
                order: 5
              },
              {
                name: 'SSO',
                description: 'Single sign-on',
                included: true,
                order: 6
              }
            ],
            limits: {
              conversationsPerMonth: 100000,
              chatbots: 999999, // Unlimited
              knowledgeBaseSize: 10000,
              users: 100,
              apiCalls: 100000
            },
            trialDays: 30,
            popular: false,
            visible: true,
            order: 4
          },
          {
            name: 'custom',
            displayName: 'Custom',
            description: 'Custom solution for your needs',
            monthlyPrice: 0, // Price on request
            annualPrice: 0,
            currency: 'USD',
            features: [
              {
                name: 'Custom Solution',
                description: 'Tailored to your requirements',
                included: true,
                order: 1
              }
            ],
            limits: {
              conversationsPerMonth: 0, // Custom
              chatbots: 0, // Custom
              knowledgeBaseSize: 0, // Custom
              users: 0, // Custom
              apiCalls: 0 // Custom
            },
            trialDays: 0,
            popular: false,
            visible: true,
            order: 5
          }
        ]
      };
      
      const plan = await this.createPricingPlan(defaultPlan);
      logger.info(`Initialized default pricing plan: ${plan.name} (${plan._id})`);
      
      return plan;
    } catch (error) {
      logger.error(`Error initializing default pricing plan: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new PricingService();
