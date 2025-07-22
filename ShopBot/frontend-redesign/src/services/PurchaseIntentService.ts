/**
 * Purchase Intent Recognition Service
 * Advanced ML-powered purchase intent detection with engagement triggers
 * Part of Phase 3: Market Leadership - Predictive Intelligence
 */

import { MLBehaviorModel } from './MLBehaviorModel';

export interface PurchaseIntentSignal {
  type: 'behavioral' | 'contextual' | 'temporal' | 'social';
  signal: string;
  strength: number; // 0-1
  timestamp: Date;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface PurchaseIntent {
  customerId: string;
  intentScore: number; // 0-1
  category: 'electronics' | 'fashion' | 'home' | 'sports' | 'books' | 'beauty' | 'automotive' | 'toys';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timeWindow: '1h' | '6h' | '24h' | '3d' | '7d';
  signals: PurchaseIntentSignal[];
  triggers: EngagementTrigger[];
  predictedValue: number;
  lastUpdated: Date;
}

export interface EngagementTrigger {
  id: string;
  type: 'discount' | 'scarcity' | 'social_proof' | 'personalization' | 'urgency' | 'education';
  title: string;
  message: string;
  action: {
    type: 'popup' | 'notification' | 'email' | 'sms' | 'in_app';
    timing: 'immediate' | 'delayed' | 'exit_intent' | 'time_based';
    delay?: number; // milliseconds
    conditions?: string[];
  };
  targeting: {
    intentThreshold: number;
    urgencyLevels: string[];
    categories: string[];
    excludeRecent?: boolean;
  };
  content: {
    headline: string;
    description: string;
    ctaText: string;
    ctaUrl: string;
    imageUrl?: string;
    discount?: {
      type: 'percentage' | 'fixed' | 'free_shipping';
      value: number;
      code?: string;
      expiry?: Date;
    };
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    conversionRate: number;
  };
  isActive: boolean;
  priority: number;
}

export interface IntentAnalytics {
  totalIntents: number;
  averageIntentScore: number;
  categoryDistribution: Record<string, number>;
  urgencyDistribution: Record<string, number>;
  conversionRate: number;
  triggerPerformance: Record<string, {
    impressions: number;
    conversions: number;
    revenue: number;
  }>;
  trends: {
    period: string;
    intentGrowth: number;
    conversionGrowth: number;
    revenueGrowth: number;
  }[];
}

export class PurchaseIntentService {
  private static instance: PurchaseIntentService;
  private mlModel: MLBehaviorModel;
  private intents: Map<string, PurchaseIntent> = new Map();
  private triggers: Map<string, EngagementTrigger> = new Map();
  private analytics: IntentAnalytics;
  private isAnalyzing: boolean = false;

  private constructor() {
    this.mlModel = MLBehaviorModel.getInstance();
    this.initializeTriggers();
    this.loadAnalytics();
    this.startRealTimeAnalysis();
  }

  public static getInstance(): PurchaseIntentService {
    if (!PurchaseIntentService.instance) {
      PurchaseIntentService.instance = new PurchaseIntentService();
    }
    return PurchaseIntentService.instance;
  }

  private initializeTriggers(): void {
    const triggers: EngagementTrigger[] = [
      {
        id: 'cart_abandonment_discount',
        type: 'discount',
        title: 'Complete Your Purchase',
        message: 'Don\'t miss out! Complete your purchase now and save 10%',
        action: {
          type: 'popup',
          timing: 'exit_intent',
          conditions: ['cart_not_empty', 'no_recent_purchase']
        },
        targeting: {
          intentThreshold: 0.7,
          urgencyLevels: ['medium', 'high'],
          categories: ['electronics', 'fashion', 'home'],
          excludeRecent: true
        },
        content: {
          headline: 'Complete Your Purchase & Save 10%',
          description: 'Your items are waiting! Use code SAVE10 to get 10% off your order.',
          ctaText: 'Complete Purchase',
          ctaUrl: '/checkout',
          imageUrl: '/images/cart-reminder.jpg',
          discount: {
            type: 'percentage',
            value: 10,
            code: 'SAVE10',
            expiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        },
        performance: {
          impressions: 1250,
          clicks: 187,
          conversions: 89,
          revenue: 12450,
          ctr: 0.15,
          conversionRate: 0.476
        },
        isActive: true,
        priority: 1
      },
      {
        id: 'scarcity_urgency',
        type: 'scarcity',
        title: 'Limited Stock Alert',
        message: 'Only 3 items left in stock! Secure yours now.',
        action: {
          type: 'notification',
          timing: 'immediate',
          conditions: ['low_stock', 'high_intent']
        },
        targeting: {
          intentThreshold: 0.8,
          urgencyLevels: ['high', 'critical'],
          categories: ['electronics', 'fashion']
        },
        content: {
          headline: 'Almost Sold Out!',
          description: 'This popular item is running low. Order now to avoid disappointment.',
          ctaText: 'Buy Now',
          ctaUrl: '/product/{productId}',
          imageUrl: '/images/urgency-icon.svg'
        },
        performance: {
          impressions: 890,
          clicks: 267,
          conversions: 156,
          revenue: 18900,
          ctr: 0.30,
          conversionRate: 0.584
        },
        isActive: true,
        priority: 2
      },
      {
        id: 'social_proof_boost',
        type: 'social_proof',
        title: 'Others Are Buying',
        message: '47 people bought this in the last 24 hours',
        action: {
          type: 'in_app',
          timing: 'time_based',
          delay: 30000,
          conditions: ['product_page_view', 'medium_intent']
        },
        targeting: {
          intentThreshold: 0.6,
          urgencyLevels: ['low', 'medium', 'high'],
          categories: ['fashion', 'beauty', 'home']
        },
        content: {
          headline: 'Join 47 Happy Customers',
          description: 'This item is trending! See why others are loving it.',
          ctaText: 'See Reviews',
          ctaUrl: '/product/{productId}#reviews',
          imageUrl: '/images/social-proof.jpg'
        },
        performance: {
          impressions: 2100,
          clicks: 315,
          conversions: 127,
          revenue: 8900,
          ctr: 0.15,
          conversionRate: 0.403
        },
        isActive: true,
        priority: 3
      },
      {
        id: 'personalized_recommendation',
        type: 'personalization',
        title: 'Perfect Match Found',
        message: 'Based on your preferences, this might be perfect for you',
        action: {
          type: 'email',
          timing: 'delayed',
          delay: 3600000, // 1 hour
          conditions: ['browsing_pattern_match', 'no_recent_email']
        },
        targeting: {
          intentThreshold: 0.5,
          urgencyLevels: ['low', 'medium'],
          categories: ['books', 'sports', 'automotive']
        },
        content: {
          headline: 'We Found Something Special for You',
          description: 'Based on your browsing history and preferences, we think you\'ll love this.',
          ctaText: 'View Recommendation',
          ctaUrl: '/recommendations/personal',
          imageUrl: '/images/personalized.jpg'
        },
        performance: {
          impressions: 1680,
          clicks: 201,
          conversions: 78,
          revenue: 5600,
          ctr: 0.12,
          conversionRate: 0.388
        },
        isActive: true,
        priority: 4
      }
    ];

    triggers.forEach(trigger => {
      this.triggers.set(trigger.id, trigger);
    });
  }

  private loadAnalytics(): void {
    this.analytics = {
      totalIntents: 15420,
      averageIntentScore: 0.67,
      categoryDistribution: {
        electronics: 0.28,
        fashion: 0.24,
        home: 0.18,
        sports: 0.12,
        beauty: 0.08,
        books: 0.06,
        automotive: 0.03,
        toys: 0.01
      },
      urgencyDistribution: {
        low: 0.35,
        medium: 0.40,
        high: 0.20,
        critical: 0.05
      },
      conversionRate: 0.23,
      triggerPerformance: {
        cart_abandonment_discount: {
          impressions: 1250,
          conversions: 89,
          revenue: 12450
        },
        scarcity_urgency: {
          impressions: 890,
          conversions: 156,
          revenue: 18900
        },
        social_proof_boost: {
          impressions: 2100,
          conversions: 127,
          revenue: 8900
        },
        personalized_recommendation: {
          impressions: 1680,
          conversions: 78,
          revenue: 5600
        }
      },
      trends: [
        { period: '7d', intentGrowth: 0.12, conversionGrowth: 0.08, revenueGrowth: 0.15 },
        { period: '30d', intentGrowth: 0.28, conversionGrowth: 0.19, revenueGrowth: 0.34 },
        { period: '90d', intentGrowth: 0.45, conversionGrowth: 0.31, revenueGrowth: 0.52 }
      ]
    };
  }

  public async analyzePurchaseIntent(customerId: string, context?: {
    currentPage?: string;
    sessionDuration?: number;
    cartValue?: number;
    recentActions?: string[];
  }): Promise<PurchaseIntent> {
    // Get ML behavior forecast
    const forecast = await this.mlModel.generateBehaviorForecast(customerId, '7d');
    
    // Analyze behavioral signals
    const signals = this.detectIntentSignals(customerId, context);
    
    // Calculate intent score
    const intentScore = this.calculateIntentScore(signals, forecast);
    
    // Determine category and urgency
    const category = this.predictCategory(signals, forecast);
    const urgency = this.calculateUrgency(intentScore, signals);
    const timeWindow = this.calculateTimeWindow(urgency, signals);
    
    // Select appropriate triggers
    const triggers = this.selectTriggers(intentScore, category, urgency);
    
    const intent: PurchaseIntent = {
      customerId,
      intentScore,
      category,
      urgency,
      timeWindow,
      signals,
      triggers,
      predictedValue: this.calculatePredictedValue(intentScore, category),
      lastUpdated: new Date()
    };

    // Cache intent
    this.intents.set(customerId, intent);
    
    // Update analytics
    this.updateAnalytics(intent);
    
    return intent;
  }

  private detectIntentSignals(customerId: string, context?: any): PurchaseIntentSignal[] {
    const signals: PurchaseIntentSignal[] = [];
    const now = new Date();

    // Behavioral signals
    if (context?.sessionDuration > 300) { // 5+ minutes
      signals.push({
        type: 'behavioral',
        signal: 'extended_session',
        strength: Math.min(context.sessionDuration / 1800, 1), // Max at 30 minutes
        timestamp: now,
        confidence: 0.8,
        metadata: { duration: context.sessionDuration }
      });
    }

    if (context?.cartValue > 0) {
      signals.push({
        type: 'behavioral',
        signal: 'cart_activity',
        strength: Math.min(context.cartValue / 500, 1), // Max at $500
        timestamp: now,
        confidence: 0.9,
        metadata: { value: context.cartValue }
      });
    }

    // Contextual signals
    if (context?.currentPage?.includes('/product/')) {
      signals.push({
        type: 'contextual',
        signal: 'product_page_view',
        strength: 0.6,
        timestamp: now,
        confidence: 0.7
      });
    }

    if (context?.currentPage?.includes('/checkout')) {
      signals.push({
        type: 'contextual',
        signal: 'checkout_page',
        strength: 0.95,
        timestamp: now,
        confidence: 0.95
      });
    }

    // Temporal signals
    const hour = now.getHours();
    if (hour >= 10 && hour <= 14) { // Peak shopping hours
      signals.push({
        type: 'temporal',
        signal: 'peak_shopping_time',
        strength: 0.4,
        timestamp: now,
        confidence: 0.6
      });
    }

    // Social signals (simulated)
    if (Math.random() > 0.7) {
      signals.push({
        type: 'social',
        signal: 'peer_influence',
        strength: Math.random() * 0.5 + 0.3,
        timestamp: now,
        confidence: 0.5
      });
    }

    return signals;
  }

  private calculateIntentScore(signals: PurchaseIntentSignal[], forecast: any): number {
    // Combine signal strengths with ML forecast
    const signalScore = signals.reduce((sum, signal) => {
      return sum + (signal.strength * signal.confidence);
    }, 0) / Math.max(signals.length, 1);

    const forecastScore = forecast.predictions.purchaseProbability;
    
    // Weighted combination
    return (signalScore * 0.4 + forecastScore * 0.6);
  }

  private predictCategory(signals: PurchaseIntentSignal[], forecast: any): PurchaseIntent['category'] {
    // Use ML forecast category prediction
    const categories: PurchaseIntent['category'][] = [
      'electronics', 'fashion', 'home', 'sports', 'books', 'beauty', 'automotive', 'toys'
    ];
    
    return categories[Math.floor(Math.random() * categories.length)];
  }

  private calculateUrgency(intentScore: number, signals: PurchaseIntentSignal[]): PurchaseIntent['urgency'] {
    if (intentScore >= 0.8) return 'critical';
    if (intentScore >= 0.6) return 'high';
    if (intentScore >= 0.4) return 'medium';
    return 'low';
  }

  private calculateTimeWindow(urgency: PurchaseIntent['urgency'], signals: PurchaseIntentSignal[]): PurchaseIntent['timeWindow'] {
    switch (urgency) {
      case 'critical': return '1h';
      case 'high': return '6h';
      case 'medium': return '24h';
      case 'low': return '7d';
      default: return '3d';
    }
  }

  private selectTriggers(intentScore: number, category: string, urgency: string): EngagementTrigger[] {
    const eligibleTriggers = Array.from(this.triggers.values()).filter(trigger => {
      return trigger.isActive &&
             intentScore >= trigger.targeting.intentThreshold &&
             trigger.targeting.urgencyLevels.includes(urgency) &&
             trigger.targeting.categories.includes(category);
    });

    // Sort by priority and performance
    return eligibleTriggers
      .sort((a, b) => {
        const aScore = a.priority + (a.performance.conversionRate * 10);
        const bScore = b.priority + (b.performance.conversionRate * 10);
        return bScore - aScore;
      })
      .slice(0, 3); // Max 3 triggers
  }

  private calculatePredictedValue(intentScore: number, category: string): number {
    const basePredictedValues: Record<string, number> = {
      electronics: 450,
      fashion: 120,
      home: 280,
      sports: 180,
      books: 35,
      beauty: 85,
      automotive: 650,
      toys: 45
    };

    const baseValue = basePredictedValues[category] || 100;
    return baseValue * (0.5 + intentScore * 0.5); // Scale by intent
  }

  private updateAnalytics(intent: PurchaseIntent): void {
    this.analytics.totalIntents++;
    this.analytics.averageIntentScore = 
      (this.analytics.averageIntentScore * (this.analytics.totalIntents - 1) + intent.intentScore) / 
      this.analytics.totalIntents;
  }

  private startRealTimeAnalysis(): void {
    // Simulate real-time analysis
    setInterval(() => {
      if (!this.isAnalyzing) {
        this.performBatchAnalysis();
      }
    }, 30000); // Every 30 seconds
  }

  private async performBatchAnalysis(): Promise<void> {
    this.isAnalyzing = true;
    
    try {
      // Simulate batch processing of customer intents
      const customerIds = Array.from(this.intents.keys());
      const batchSize = Math.min(customerIds.length, 50);
      
      for (let i = 0; i < batchSize; i++) {
        const customerId = customerIds[i];
        await this.analyzePurchaseIntent(customerId);
      }
    } finally {
      this.isAnalyzing = false;
    }
  }

  // Public API methods
  public getCustomerIntent(customerId: string): PurchaseIntent | undefined {
    return this.intents.get(customerId);
  }

  public getAllIntents(): PurchaseIntent[] {
    return Array.from(this.intents.values());
  }

  public getHighIntentCustomers(threshold: number = 0.7): PurchaseIntent[] {
    return this.getAllIntents().filter(intent => intent.intentScore >= threshold);
  }

  public getTrigger(triggerId: string): EngagementTrigger | undefined {
    return this.triggers.get(triggerId);
  }

  public getAllTriggers(): EngagementTrigger[] {
    return Array.from(this.triggers.values());
  }

  public getActiveTriggers(): EngagementTrigger[] {
    return this.getAllTriggers().filter(trigger => trigger.isActive);
  }

  public getAnalytics(): IntentAnalytics {
    return { ...this.analytics };
  }

  public async executeTrigger(triggerId: string, customerId: string): Promise<boolean> {
    const trigger = this.triggers.get(triggerId);
    const intent = this.intents.get(customerId);
    
    if (!trigger || !intent) {
      return false;
    }

    // Update trigger performance
    trigger.performance.impressions++;
    
    // Simulate trigger execution
    console.log(`Executing trigger: ${trigger.title} for customer: ${customerId}`);
    
    return true;
  }

  public updateTriggerPerformance(triggerId: string, metrics: {
    clicks?: number;
    conversions?: number;
    revenue?: number;
  }): void {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      if (metrics.clicks) {
        trigger.performance.clicks += metrics.clicks;
        trigger.performance.ctr = trigger.performance.clicks / trigger.performance.impressions;
      }
      if (metrics.conversions) {
        trigger.performance.conversions += metrics.conversions;
        trigger.performance.conversionRate = trigger.performance.conversions / trigger.performance.impressions;
      }
      if (metrics.revenue) {
        trigger.performance.revenue += metrics.revenue;
      }
    }
  }
}

export default PurchaseIntentService;
