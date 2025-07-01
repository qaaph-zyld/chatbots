/**
 * Sales Service
 * 
 * Provides business logic for sales pipeline management and lead tracking
 */

const Lead = require('../models/lead.model');
const Tenant = require('../../tenancy/models/tenant.model');
const Subscription = require('../../billing/models/subscription.model');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');

/**
 * Service for sales operations and lead management
 */
class SalesService {
  /**
   * Create a new lead
   * @param {Object} leadData - Lead data
   * @returns {Promise<Object>} Created lead
   */
  async createLead(leadData) {
    try {
      // Check if lead with same email already exists
      const existingLead = await Lead.findOne({
        'contact.email': leadData.contact.email
      });
      
      if (existingLead) {
        logger.info(`Lead with email ${leadData.contact.email} already exists`);
        return existingLead;
      }
      
      // Create lead
      const lead = new Lead(leadData);
      await lead.save();
      
      logger.info(`Created lead: ${lead.contact.firstName} ${lead.contact.lastName} (${lead._id})`);
      
      return lead;
    } catch (error) {
      logger.error(`Error creating lead: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get lead by ID
   * @param {string} leadId - Lead ID
   * @returns {Promise<Object>} Lead
   */
  async getLead(leadId) {
    try {
      const lead = await Lead.findById(leadId)
        .populate('assignedTo', 'firstName lastName email')
        .populate('notes.createdBy', 'firstName lastName')
        .populate('activities.createdBy', 'firstName lastName');
      
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      return lead;
    } catch (error) {
      logger.error(`Error getting lead: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update lead
   * @param {string} leadId - Lead ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated lead
   */
  async updateLead(leadId, updateData) {
    try {
      const lead = await Lead.findById(leadId);
      
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      // Update allowed fields
      if (updateData.company) lead.company = { ...lead.company, ...updateData.company };
      if (updateData.contact) lead.contact = { ...lead.contact, ...updateData.contact };
      if (updateData.source) lead.source = updateData.source;
      if (updateData.sourceDetails) lead.sourceDetails = updateData.sourceDetails;
      if (updateData.assignedTo) lead.assignedTo = updateData.assignedTo;
      if (updateData.interestedIn) lead.interestedIn = updateData.interestedIn;
      if (updateData.requirements) lead.requirements = { ...lead.requirements, ...updateData.requirements };
      if (updateData.estimatedValue) lead.estimatedValue = { ...lead.estimatedValue, ...updateData.estimatedValue };
      if (updateData.timeline) lead.timeline = { ...lead.timeline, ...updateData.timeline };
      if (updateData.tags) lead.tags = updateData.tags;
      
      await lead.save();
      
      logger.info(`Updated lead: ${lead._id}`);
      
      return lead;
    } catch (error) {
      logger.error(`Error updating lead: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update lead status
   * @param {string} leadId - Lead ID
   * @param {string} status - New status
   * @param {string} userId - User ID making the change
   * @returns {Promise<Object>} Updated lead
   */
  async updateLeadStatus(leadId, status, userId) {
    try {
      const lead = await Lead.findById(leadId);
      
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      await lead.updateStatus(status, userId);
      
      logger.info(`Updated lead status: ${lead._id} to ${status}`);
      
      return lead;
    } catch (error) {
      logger.error(`Error updating lead status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add note to lead
   * @param {string} leadId - Lead ID
   * @param {string} content - Note content
   * @param {string} userId - User ID adding the note
   * @returns {Promise<Object>} Updated lead
   */
  async addLeadNote(leadId, content, userId) {
    try {
      const lead = await Lead.findById(leadId);
      
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      await lead.addNote(content, userId);
      
      logger.info(`Added note to lead: ${lead._id}`);
      
      return lead;
    } catch (error) {
      logger.error(`Error adding lead note: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add activity to lead
   * @param {string} leadId - Lead ID
   * @param {Object} activityData - Activity data
   * @param {string} userId - User ID adding the activity
   * @returns {Promise<Object>} Updated lead
   */
  async addLeadActivity(leadId, activityData, userId) {
    try {
      const lead = await Lead.findById(leadId);
      
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      await lead.addActivity(activityData, userId);
      
      logger.info(`Added activity to lead: ${lead._id}`);
      
      return lead;
    } catch (error) {
      logger.error(`Error adding lead activity: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert lead to customer
   * @param {string} leadId - Lead ID
   * @param {Object} tenantData - Tenant data for creation
   * @param {Object} subscriptionData - Subscription data for creation
   * @param {string} userId - User ID performing the conversion
   * @returns {Promise<Object>} Conversion result with tenant and subscription
   */
  async convertLeadToCustomer(leadId, tenantData, subscriptionData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const lead = await Lead.findById(leadId).session(session);
      
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      if (lead.convertedToCustomer) {
        throw new Error('Lead already converted to customer');
      }
      
      // Create tenant
      const tenantService = require('../../tenancy/services/tenant.service');
      const tenant = await tenantService.createTenant({
        name: lead.company.name,
        organizationDetails: {
          companyName: lead.company.name,
          website: lead.company.website,
          industry: lead.company.industry,
          size: lead.company.size
        },
        contactDetails: {
          email: lead.contact.email,
          phone: lead.contact.phone
        },
        createdBy: userId
      });
      
      // Create subscription
      const billingService = require('../../billing/services/billing.service');
      const subscription = await billingService.createSubscription({
        tenantId: tenant._id,
        plan: subscriptionData.plan,
        status: subscriptionData.status || 'active',
        billingDetails: {
          name: `${lead.contact.firstName} ${lead.contact.lastName}`,
          email: lead.contact.email
        }
      });
      
      // Update lead with tenant ID and mark as converted
      lead.tenantId = tenant._id;
      await lead.convertToCustomer(userId);
      
      await session.commitTransaction();
      session.endSession();
      
      logger.info(`Converted lead ${lead._id} to customer. Created tenant ${tenant._id} and subscription ${subscription._id}`);
      
      return {
        lead,
        tenant,
        subscription
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      
      logger.error(`Error converting lead to customer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all leads with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Leads with pagination info
   */
  async getAllLeads(options = {}) {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;
      
      const query = {};
      if (options.status) query.status = options.status;
      if (options.assignedTo) query.assignedTo = options.assignedTo;
      if (options.search) {
        query.$or = [
          { 'company.name': { $regex: options.search, $options: 'i' } },
          { 'contact.firstName': { $regex: options.search, $options: 'i' } },
          { 'contact.lastName': { $regex: options.search, $options: 'i' } },
          { 'contact.email': { $regex: options.search, $options: 'i' } }
        ];
      }
      
      const [leads, total] = await Promise.all([
        Lead.find(query)
          .populate('assignedTo', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Lead.countDocuments(query)
      ]);
      
      return {
        leads,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`Error getting all leads: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get sales pipeline data
   * @returns {Promise<Object>} Pipeline data
   */
  async getSalesPipeline() {
    try {
      const pipeline = await Lead.aggregate([
        {
          $match: {
            status: { $ne: 'closed_lost' }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            value: { 
              $sum: '$estimatedValue.amount' 
            },
            leads: { 
              $push: { 
                _id: '$_id',
                company: '$company.name',
                contact: { 
                  firstName: '$contact.firstName',
                  lastName: '$contact.lastName',
                  email: '$contact.email'
                },
                estimatedValue: '$estimatedValue',
                createdAt: '$createdAt'
              } 
            }
          }
        },
        {
          $sort: { 
            '_id': 1
          }
        }
      ]);
      
      // Format data for frontend
      const stages = {
        new: { name: 'New Leads', order: 0, count: 0, value: 0, leads: [] },
        contacted: { name: 'Contacted', order: 1, count: 0, value: 0, leads: [] },
        qualified: { name: 'Qualified', order: 2, count: 0, value: 0, leads: [] },
        proposal: { name: 'Proposal', order: 3, count: 0, value: 0, leads: [] },
        negotiation: { name: 'Negotiation', order: 4, count: 0, value: 0, leads: [] },
        closed_won: { name: 'Closed Won', order: 5, count: 0, value: 0, leads: [] }
      };
      
      pipeline.forEach(stage => {
        if (stages[stage._id]) {
          stages[stage._id].count = stage.count;
          stages[stage._id].value = stage.value || 0;
          stages[stage._id].leads = stage.leads;
        }
      });
      
      return {
        stages: Object.values(stages).sort((a, b) => a.order - b.order),
        totalLeads: Object.values(stages).reduce((sum, stage) => sum + stage.count, 0),
        totalValue: Object.values(stages).reduce((sum, stage) => sum + stage.value, 0)
      };
    } catch (error) {
      logger.error(`Error getting sales pipeline: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get sales forecast
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Forecast data
   */
  async getSalesForecast(options = {}) {
    try {
      const months = options.months || 3;
      
      // Get leads in negotiation and proposal stages
      const activeLeads = await Lead.find({
        status: { $in: ['proposal', 'negotiation'] }
      });
      
      // Calculate weighted forecast
      const weightByStage = {
        proposal: 0.5,
        negotiation: 0.7
      };
      
      let weightedTotal = 0;
      
      activeLeads.forEach(lead => {
        if (lead.estimatedValue && lead.estimatedValue.amount) {
          weightedTotal += lead.estimatedValue.amount * weightByStage[lead.status];
        }
      });
      
      // Get monthly breakdown based on expected close dates
      const today = new Date();
      const monthlyForecast = [];
      
      for (let i = 0; i < months; i++) {
        const monthStart = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);
        
        const monthLeads = activeLeads.filter(lead => {
          if (!lead.timeline || !lead.timeline.expectedCloseDate) return false;
          const closeDate = new Date(lead.timeline.expectedCloseDate);
          return closeDate >= monthStart && closeDate <= monthEnd;
        });
        
        let monthTotal = 0;
        let weightedMonthTotal = 0;
        
        monthLeads.forEach(lead => {
          if (lead.estimatedValue && lead.estimatedValue.amount) {
            monthTotal += lead.estimatedValue.amount;
            weightedMonthTotal += lead.estimatedValue.amount * weightByStage[lead.status];
          }
        });
        
        const monthName = monthStart.toLocaleString('default', { month: 'long' });
        const year = monthStart.getFullYear();
        
        monthlyForecast.push({
          month: `${monthName} ${year}`,
          total: monthTotal,
          weightedTotal: weightedMonthTotal,
          count: monthLeads.length
        });
      }
      
      return {
        totalForecast: weightedTotal,
        monthlyForecast
      };
    } catch (error) {
      logger.error(`Error getting sales forecast: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get sales dashboard data
   * @returns {Promise<Object>} Dashboard data
   */
  async getSalesDashboardData() {
    try {
      const [pipeline, forecast, recentLeads] = await Promise.all([
        this.getSalesPipeline(),
        this.getSalesForecast(),
        Lead.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('assignedTo', 'firstName lastName')
      ]);
      
      // Get conversion rate
      const totalClosed = await Lead.countDocuments({
        status: { $in: ['closed_won', 'closed_lost'] }
      });
      
      const wonDeals = await Lead.countDocuments({
        status: 'closed_won'
      });
      
      const conversionRate = totalClosed > 0 ? (wonDeals / totalClosed) * 100 : 0;
      
      return {
        pipeline,
        forecast,
        recentLeads,
        metrics: {
          totalLeads: pipeline.totalLeads,
          totalValue: pipeline.totalValue,
          conversionRate,
          forecastValue: forecast.totalForecast
        }
      };
    } catch (error) {
      logger.error(`Error getting sales dashboard data: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new SalesService();
