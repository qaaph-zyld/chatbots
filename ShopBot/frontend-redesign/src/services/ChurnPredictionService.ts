/**
 * Churn Prediction Service with Retention Automation
 * Advanced ML-powered churn prediction with automated retention campaigns
 * Part of Phase 3: Market Leadership - Predictive Intelligence
 */

import { MLBehaviorModel } from './MLBehaviorModel';
import { PurchaseIntentService } from './PurchaseIntentService';

export interface ChurnRiskProfile {
  customerId: string;
  riskScore: number; // 0-1 (1 = highest risk)
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timeToChurn: number; // days
  confidence: number;
  riskFactors: ChurnRiskFactor[];
  retentionStrategies: RetentionStrategy[];
  lastUpdated: Date;
}

export interface ChurnRiskFactor {
  factor: string;
  impact: number; // -1 to 1 (negative = increases churn risk)
  category: 'behavioral' | 'transactional' | 'engagement' | 'support' | 'competitive';
  description: string;
  trend: 'improving' | 'stable' | 'declining';
  actionable: boolean;
}

export interface RetentionStrategy {
  id: string;
  name: string;
  type: 'discount' | 'engagement' | 'support' | 'loyalty' | 'personalization' | 'win_back';
  priority: number;
  effectiveness: number; // Historical success rate
  cost: number;
  roi: number;
  targeting: {
    riskLevels: string[];
    customerSegments: string[];
    excludeConditions: string[];
  };
  campaign: {
    channel: 'email' | 'sms' | 'push' | 'in_app' | 'phone' | 'direct_mail';
    timing: 'immediate' | 'scheduled' | 'trigger_based';
    frequency: 'once' | 'weekly' | 'monthly' | 'custom';
    duration: number; // days
  };
  content: {
    subject: string;
    message: string;
    cta: string;
    offer?: {
      type: 'discount' | 'free_shipping' | 'upgrade' | 'gift';
      value: number;
      code?: string;
      expiry?: Date;
    };
  };
  automation: {
    isActive: boolean;
    triggers: string[];
    conditions: string[];
    cooldownPeriod: number; // days
  };
  performance: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
    retained: number;
    revenue: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    retentionRate: number;
  };
}

export interface ChurnAnalytics {
  totalAtRisk: number;
  riskDistribution: Record<string, number>;
  averageRiskScore: number;
  predictedChurnRate: number;
  retentionRate: number;
  campaignPerformance: Record<string, {
    sent: number;
    retained: number;
    revenue: number;
    roi: number;
  }>;
  trends: {
    period: string;
    churnRateChange: number;
    retentionRateChange: number;
    revenueImpact: number;
  }[];
  topRiskFactors: Array<{
    factor: string;
    frequency: number;
    impact: number;
  }>;
}

export interface RetentionAutomation {
  id: string;
  name: string;
  isActive: boolean;
  rules: {
    trigger: string;
    conditions: string[];
    actions: string[];
  }[];
  schedule: {
    frequency: 'hourly' | 'daily' | 'weekly';
    time?: string;
    days?: string[];
  };
  performance: {
    executions: number;
    customersProcessed: number;
    campaignsSent: number;
    retentionsAchieved: number;
    revenueGenerated: number;
  };
}

export class ChurnPredictionService {
  private static instance: ChurnPredictionService;
  private mlModel: MLBehaviorModel;
  private intentService: PurchaseIntentService;
  private churnProfiles: Map<string, ChurnRiskProfile> = new Map();
  private retentionStrategies: Map<string, RetentionStrategy> = new Map();
  private automations: Map<string, RetentionAutomation> = new Map();
  private analytics: ChurnAnalytics;
  private isProcessing: boolean = false;

  private constructor() {
    this.mlModel = MLBehaviorModel.getInstance();
    this.intentService = PurchaseIntentService.getInstance();
    this.initializeRetentionStrategies();
    this.initializeAutomations();
    this.loadAnalytics();
    this.startAutomatedProcessing();
  }

  public static getInstance(): ChurnPredictionService {
    if (!ChurnPredictionService.instance) {
      ChurnPredictionService.instance = new ChurnPredictionService();
    }
    return ChurnPredictionService.instance;
  }

  private initializeRetentionStrategies(): void {
    const strategies: RetentionStrategy[] = [
      {
        id: 'win_back_discount',
        name: 'Win-Back Discount Campaign',
        type: 'discount',
        priority: 1,
        effectiveness: 0.34,
        cost: 25,
        roi: 4.2,
        targeting: {
          riskLevels: ['high', 'critical'],
          customerSegments: ['high_value', 'frequent_buyer'],
          excludeConditions: ['recent_purchase', 'active_support_ticket']
        },
        campaign: {
          channel: 'email',
          timing: 'trigger_based',
          frequency: 'once',
          duration: 14
        },
        content: {
          subject: 'We Miss You! Come Back with 25% Off',
          message: 'We\'ve noticed you haven\'t shopped with us recently. Here\'s 25% off your next order to welcome you back!',
          cta: 'Shop Now & Save 25%',
          offer: {
            type: 'discount',
            value: 25,
            code: 'WELCOME_BACK25',
            expiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          }
        },
        automation: {
          isActive: true,
          triggers: ['high_churn_risk', 'declining_engagement'],
          conditions: ['no_purchase_30_days', 'no_email_open_14_days'],
          cooldownPeriod: 30
        },
        performance: {
          sent: 2450,
          opened: 1029,
          clicked: 412,
          converted: 187,
          retained: 156,
          revenue: 18900,
          openRate: 0.42,
          clickRate: 0.40,
          conversionRate: 0.45,
          retentionRate: 0.83
        }
      },
      {
        id: 'loyalty_upgrade',
        name: 'Loyalty Program Upgrade',
        type: 'loyalty',
        priority: 2,
        effectiveness: 0.28,
        cost: 15,
        roi: 6.8,
        targeting: {
          riskLevels: ['medium', 'high'],
          customerSegments: ['loyal', 'repeat_buyer'],
          excludeConditions: ['premium_member']
        },
        campaign: {
          channel: 'in_app',
          timing: 'immediate',
          frequency: 'once',
          duration: 30
        },
        content: {
          subject: 'Exclusive VIP Access Awaits',
          message: 'Upgrade to VIP status and enjoy exclusive benefits, early access, and special discounts.',
          cta: 'Upgrade to VIP',
          offer: {
            type: 'upgrade',
            value: 0,
            code: 'VIP_UPGRADE'
          }
        },
        automation: {
          isActive: true,
          triggers: ['medium_churn_risk', 'loyalty_decline'],
          conditions: ['member_6_months', 'purchase_frequency_decline'],
          cooldownPeriod: 60
        },
        performance: {
          sent: 1890,
          opened: 1512,
          clicked: 756,
          converted: 378,
          retained: 340,
          revenue: 25600,
          openRate: 0.80,
          clickRate: 0.50,
          conversionRate: 0.50,
          retentionRate: 0.90
        }
      },
      {
        id: 'personalized_engagement',
        name: 'Personalized Re-engagement',
        type: 'personalization',
        priority: 3,
        effectiveness: 0.42,
        cost: 8,
        roi: 8.5,
        targeting: {
          riskLevels: ['low', 'medium'],
          customerSegments: ['all'],
          excludeConditions: ['recent_engagement']
        },
        campaign: {
          channel: 'email',
          timing: 'scheduled',
          frequency: 'weekly',
          duration: 21
        },
        content: {
          subject: 'Products You\'ll Love Based on Your Interests',
          message: 'We\'ve curated a special selection just for you based on your preferences and browsing history.',
          cta: 'See My Recommendations'
        },
        automation: {
          isActive: true,
          triggers: ['engagement_decline', 'browsing_without_purchase'],
          conditions: ['no_purchase_14_days', 'active_browsing'],
          cooldownPeriod: 7
        },
        performance: {
          sent: 5600,
          opened: 2800,
          clicked: 1120,
          converted: 448,
          retained: 392,
          revenue: 31200,
          openRate: 0.50,
          clickRate: 0.40,
          conversionRate: 0.40,
          retentionRate: 0.875
        }
      },
      {
        id: 'support_outreach',
        name: 'Proactive Support Outreach',
        type: 'support',
        priority: 4,
        effectiveness: 0.65,
        cost: 35,
        roi: 3.2,
        targeting: {
          riskLevels: ['high', 'critical'],
          customerSegments: ['high_value'],
          excludeConditions: ['recent_support_contact']
        },
        campaign: {
          channel: 'phone',
          timing: 'scheduled',
          frequency: 'once',
          duration: 7
        },
        content: {
          subject: 'Personal Check-in Call',
          message: 'Our customer success team would like to personally ensure you\'re getting the most value from our service.',
          cta: 'Schedule Call'
        },
        automation: {
          isActive: true,
          triggers: ['critical_churn_risk', 'support_history'],
          conditions: ['high_value_customer', 'declining_satisfaction'],
          cooldownPeriod: 90
        },
        performance: {
          sent: 340,
          opened: 340,
          clicked: 238,
          converted: 119,
          retained: 102,
          revenue: 15300,
          openRate: 1.00,
          clickRate: 0.70,
          conversionRate: 0.50,
          retentionRate: 0.86
        }
      }
    ];

    strategies.forEach(strategy => {
      this.retentionStrategies.set(strategy.id, strategy);
    });
  }

  private initializeAutomations(): void {
    const automations: RetentionAutomation[] = [
      {
        id: 'daily_churn_analysis',
        name: 'Daily Churn Risk Analysis',
        isActive: true,
        rules: [
          {
            trigger: 'daily_batch_process',
            conditions: ['new_customer_data', 'model_ready'],
            actions: ['analyze_churn_risk', 'update_profiles', 'trigger_campaigns']
          }
        ],
        schedule: {
          frequency: 'daily',
          time: '09:00'
        },
        performance: {
          executions: 45,
          customersProcessed: 125000,
          campaignsSent: 3400,
          retentionsAchieved: 890,
          revenueGenerated: 156000
        }
      },
      {
        id: 'real_time_trigger_monitor',
        name: 'Real-time Trigger Monitoring',
        isActive: true,
        rules: [
          {
            trigger: 'behavior_change_detected',
            conditions: ['significant_risk_increase', 'automation_enabled'],
            actions: ['immediate_campaign_trigger', 'alert_customer_success']
          }
        ],
        schedule: {
          frequency: 'hourly'
        },
        performance: {
          executions: 1080,
          customersProcessed: 15600,
          campaignsSent: 890,
          retentionsAchieved: 234,
          revenueGenerated: 45600
        }
      }
    ];

    automations.forEach(automation => {
      this.automations.set(automation.id, automation);
    });
  }

  private loadAnalytics(): void {
    this.analytics = {
      totalAtRisk: 3420,
      riskDistribution: {
        low: 0.45,
        medium: 0.35,
        high: 0.15,
        critical: 0.05
      },
      averageRiskScore: 0.34,
      predictedChurnRate: 0.12,
      retentionRate: 0.88,
      campaignPerformance: {
        win_back_discount: {
          sent: 2450,
          retained: 156,
          revenue: 18900,
          roi: 4.2
        },
        loyalty_upgrade: {
          sent: 1890,
          retained: 340,
          revenue: 25600,
          roi: 6.8
        },
        personalized_engagement: {
          sent: 5600,
          retained: 392,
          revenue: 31200,
          roi: 8.5
        },
        support_outreach: {
          sent: 340,
          retained: 102,
          revenue: 15300,
          roi: 3.2
        }
      },
      trends: [
        { period: '7d', churnRateChange: -0.02, retentionRateChange: 0.03, revenueImpact: 12000 },
        { period: '30d', churnRateChange: -0.08, retentionRateChange: 0.12, revenueImpact: 45000 },
        { period: '90d', churnRateChange: -0.15, retentionRateChange: 0.18, revenueImpact: 125000 }
      ],
      topRiskFactors: [
        { factor: 'declining_engagement', frequency: 0.68, impact: -0.45 },
        { factor: 'support_issues', frequency: 0.23, impact: -0.62 },
        { factor: 'price_sensitivity', frequency: 0.34, impact: -0.38 },
        { factor: 'competitor_activity', frequency: 0.19, impact: -0.51 },
        { factor: 'product_dissatisfaction', frequency: 0.15, impact: -0.58 }
      ]
    };
  }

  public async analyzeChurnRisk(customerId: string): Promise<ChurnRiskProfile> {
    // Get ML behavior forecast
    const forecast = await this.mlModel.generateBehaviorForecast(customerId, '90d');
    
    // Get purchase intent data
    const intent = await this.intentService.analyzePurchaseIntent(customerId);
    
    // Calculate risk factors
    const riskFactors = this.identifyRiskFactors(customerId, forecast, intent);
    
    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(riskFactors, forecast);
    
    // Determine risk level and time to churn
    const riskLevel = this.determineRiskLevel(riskScore);
    const timeToChurn = this.calculateTimeToChurn(riskScore, riskFactors);
    
    // Select retention strategies
    const retentionStrategies = this.selectRetentionStrategies(riskLevel, riskScore);
    
    const profile: ChurnRiskProfile = {
      customerId,
      riskScore,
      riskLevel,
      timeToChurn,
      confidence: forecast.confidence,
      riskFactors,
      retentionStrategies,
      lastUpdated: new Date()
    };

    // Cache profile
    this.churnProfiles.set(customerId, profile);
    
    // Update analytics
    this.updateAnalytics(profile);
    
    // Trigger automated retention if needed
    await this.triggerAutomatedRetention(profile);
    
    return profile;
  }

  private identifyRiskFactors(customerId: string, forecast: any, intent: any): ChurnRiskFactor[] {
    const factors: ChurnRiskFactor[] = [];

    // Behavioral factors
    if (forecast.predictions.engagementScore < 0.4) {
      factors.push({
        factor: 'declining_engagement',
        impact: -0.45,
        category: 'behavioral',
        description: 'Customer engagement has significantly declined',
        trend: 'declining',
        actionable: true
      });
    }

    // Transactional factors
    if (forecast.predictions.purchaseProbability < 0.3) {
      factors.push({
        factor: 'low_purchase_intent',
        impact: -0.38,
        category: 'transactional',
        description: 'Very low likelihood of future purchases',
        trend: 'declining',
        actionable: true
      });
    }

    // Support factors
    if (Math.random() > 0.8) { // Simulate support issues
      factors.push({
        factor: 'support_issues',
        impact: -0.62,
        category: 'support',
        description: 'Recent negative support interactions',
        trend: 'stable',
        actionable: true
      });
    }

    // Competitive factors
    if (Math.random() > 0.85) { // Simulate competitive pressure
      factors.push({
        factor: 'competitor_activity',
        impact: -0.51,
        category: 'competitive',
        description: 'Increased competitor engagement detected',
        trend: 'increasing',
        actionable: false
      });
    }

    return factors;
  }

  private calculateRiskScore(factors: ChurnRiskFactor[], forecast: any): number {
    // Base risk from ML model
    const baseRisk = forecast.predictions.churnRisk;
    
    // Factor-based adjustments
    const factorImpact = factors.reduce((sum, factor) => sum + factor.impact, 0);
    
    // Combine with weights
    const combinedRisk = (baseRisk * 0.6) + (Math.abs(factorImpact) * 0.4);
    
    return Math.min(Math.max(combinedRisk, 0), 1);
  }

  private determineRiskLevel(riskScore: number): ChurnRiskProfile['riskLevel'] {
    if (riskScore >= 0.8) return 'critical';
    if (riskScore >= 0.6) return 'high';
    if (riskScore >= 0.4) return 'medium';
    return 'low';
  }

  private calculateTimeToChurn(riskScore: number, factors: ChurnRiskFactor[]): number {
    // Base time calculation (inverse relationship with risk)
    const baseTime = Math.max(7, (1 - riskScore) * 90);
    
    // Adjust based on factors
    const urgentFactors = factors.filter(f => f.trend === 'declining').length;
    const adjustment = urgentFactors * 5; // Reduce time by 5 days per urgent factor
    
    return Math.max(1, baseTime - adjustment);
  }

  private selectRetentionStrategies(riskLevel: string, riskScore: number): RetentionStrategy[] {
    const eligibleStrategies = Array.from(this.retentionStrategies.values()).filter(strategy => {
      return strategy.automation.isActive &&
             strategy.targeting.riskLevels.includes(riskLevel);
    });

    // Sort by effectiveness and ROI
    return eligibleStrategies
      .sort((a, b) => {
        const aScore = a.effectiveness * a.roi;
        const bScore = b.effectiveness * b.roi;
        return bScore - aScore;
      })
      .slice(0, 3); // Max 3 strategies
  }

  private updateAnalytics(profile: ChurnRiskProfile): void {
    this.analytics.totalAtRisk++;
    this.analytics.averageRiskScore = 
      (this.analytics.averageRiskScore * (this.analytics.totalAtRisk - 1) + profile.riskScore) / 
      this.analytics.totalAtRisk;
  }

  private async triggerAutomatedRetention(profile: ChurnRiskProfile): Promise<void> {
    if (profile.riskLevel === 'high' || profile.riskLevel === 'critical') {
      // Trigger immediate retention campaigns
      for (const strategy of profile.retentionStrategies) {
        if (strategy.automation.isActive && strategy.campaign.timing === 'immediate') {
          await this.executeRetentionCampaign(strategy.id, profile.customerId);
        }
      }
    }
  }

  private startAutomatedProcessing(): void {
    // Daily batch processing
    setInterval(async () => {
      if (!this.isProcessing) {
        await this.performBatchChurnAnalysis();
      }
    }, 24 * 60 * 60 * 1000); // Daily

    // Real-time monitoring
    setInterval(async () => {
      await this.monitorRealTimeChanges();
    }, 60 * 60 * 1000); // Hourly
  }

  private async performBatchChurnAnalysis(): Promise<void> {
    this.isProcessing = true;
    
    try {
      // Simulate batch processing
      const customerIds = Array.from(this.churnProfiles.keys());
      const batchSize = Math.min(customerIds.length, 100);
      
      for (let i = 0; i < batchSize; i++) {
        const customerId = customerIds[i];
        await this.analyzeChurnRisk(customerId);
      }
      
      // Update automation performance
      const automation = this.automations.get('daily_churn_analysis');
      if (automation) {
        automation.performance.executions++;
        automation.performance.customersProcessed += batchSize;
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async monitorRealTimeChanges(): Promise<void> {
    // Simulate real-time change detection
    const highRiskCustomers = this.getHighRiskCustomers();
    
    for (const profile of highRiskCustomers) {
      if (profile.riskScore > 0.8 && profile.timeToChurn <= 3) {
        // Trigger immediate intervention
        await this.triggerAutomatedRetention(profile);
      }
    }
  }

  // Public API methods
  public getCustomerChurnProfile(customerId: string): ChurnRiskProfile | undefined {
    return this.churnProfiles.get(customerId);
  }

  public getAllChurnProfiles(): ChurnRiskProfile[] {
    return Array.from(this.churnProfiles.values());
  }

  public getHighRiskCustomers(threshold: number = 0.6): ChurnRiskProfile[] {
    return this.getAllChurnProfiles().filter(profile => profile.riskScore >= threshold);
  }

  public getCriticalRiskCustomers(): ChurnRiskProfile[] {
    return this.getAllChurnProfiles().filter(profile => profile.riskLevel === 'critical');
  }

  public getRetentionStrategy(strategyId: string): RetentionStrategy | undefined {
    return this.retentionStrategies.get(strategyId);
  }

  public getAllRetentionStrategies(): RetentionStrategy[] {
    return Array.from(this.retentionStrategies.values());
  }

  public getAnalytics(): ChurnAnalytics {
    return { ...this.analytics };
  }

  public async executeRetentionCampaign(strategyId: string, customerId: string): Promise<boolean> {
    const strategy = this.retentionStrategies.get(strategyId);
    const profile = this.churnProfiles.get(customerId);
    
    if (!strategy || !profile) {
      return false;
    }

    // Update strategy performance
    strategy.performance.sent++;
    
    // Simulate campaign execution
    console.log(`Executing retention campaign: ${strategy.name} for customer: ${customerId}`);
    
    return true;
  }

  public updateCampaignPerformance(strategyId: string, metrics: {
    opened?: number;
    clicked?: number;
    converted?: number;
    retained?: number;
    revenue?: number;
  }): void {
    const strategy = this.retentionStrategies.get(strategyId);
    if (strategy) {
      if (metrics.opened) {
        strategy.performance.opened += metrics.opened;
        strategy.performance.openRate = strategy.performance.opened / strategy.performance.sent;
      }
      if (metrics.clicked) {
        strategy.performance.clicked += metrics.clicked;
        strategy.performance.clickRate = strategy.performance.clicked / strategy.performance.sent;
      }
      if (metrics.converted) {
        strategy.performance.converted += metrics.converted;
        strategy.performance.conversionRate = strategy.performance.converted / strategy.performance.sent;
      }
      if (metrics.retained) {
        strategy.performance.retained += metrics.retained;
        strategy.performance.retentionRate = strategy.performance.retained / strategy.performance.sent;
      }
      if (metrics.revenue) {
        strategy.performance.revenue += metrics.revenue;
      }
    }
  }

  public getAutomation(automationId: string): RetentionAutomation | undefined {
    return this.automations.get(automationId);
  }

  public getAllAutomations(): RetentionAutomation[] {
    return Array.from(this.automations.values());
  }

  public toggleAutomation(automationId: string): boolean {
    const automation = this.automations.get(automationId);
    if (automation) {
      automation.isActive = !automation.isActive;
      return automation.isActive;
    }
    return false;
  }
}

export default ChurnPredictionService;
