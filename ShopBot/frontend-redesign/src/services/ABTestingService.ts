/**
 * A/B Testing Service
 * Core service for managing experiments, statistical analysis, and conversion tracking
 */

import {
  ABTestExperiment,
  ABTestVariant,
  ConversionEvent,
  ABTestResults,
  VariantResults,
  StatisticalTest,
  AudienceSegment,
  ConversionBarrier,
  PsychologyTrigger,
  ConversionFunnel,
  ConversionFunnelStage
} from '../types/ABTestingTypes';

export class ABTestingService {
  private experiments: Map<string, ABTestExperiment> = new Map();
  private userVariants: Map<string, Map<string, string>> = new Map(); // userId -> experimentId -> variantId
  private events: ConversionEvent[] = [];
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api/ab-testing') {
    this.apiBaseUrl = apiBaseUrl;
    this.loadFromStorage();
  }

  /**
   * Experiment Management
   */
  async createExperiment(experiment: Omit<ABTestExperiment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ABTestExperiment> {
    const newExperiment: ABTestExperiment = {
      ...experiment,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate experiment configuration
    this.validateExperiment(newExperiment);

    // Calculate required sample size
    newExperiment.sampleSize = this.calculateSampleSize(
      newExperiment.confidence,
      newExperiment.minDetectableEffect,
      0.1 // Assumed baseline conversion rate
    );

    this.experiments.set(newExperiment.id, newExperiment);
    this.saveToStorage();

    return newExperiment;
  }

  async updateExperiment(id: string, updates: Partial<ABTestExperiment>): Promise<ABTestExperiment> {
    const experiment = this.experiments.get(id);
    if (!experiment) {
      throw new Error(`Experiment ${id} not found`);
    }

    const updatedExperiment = {
      ...experiment,
      ...updates,
      updatedAt: new Date()
    };

    this.experiments.set(id, updatedExperiment);
    this.saveToStorage();

    return updatedExperiment;
  }

  async deleteExperiment(id: string): Promise<void> {
    if (!this.experiments.has(id)) {
      throw new Error(`Experiment ${id} not found`);
    }

    this.experiments.delete(id);
    this.saveToStorage();
  }

  getExperiment(id: string): ABTestExperiment | null {
    return this.experiments.get(id) || null;
  }

  getAllExperiments(): ABTestExperiment[] {
    return Array.from(this.experiments.values());
  }

  getActiveExperiments(): ABTestExperiment[] {
    return this.getAllExperiments().filter(exp => exp.status === 'active');
  }

  /**
   * Variant Assignment and Tracking
   */
  assignUserToVariant(userId: string, experimentId: string): ABTestVariant | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'active') {
      return null;
    }

    // Check if user already has a variant assigned
    const userExperiments = this.userVariants.get(userId);
    if (userExperiments?.has(experimentId)) {
      const variantId = userExperiments.get(experimentId)!;
      return experiment.variants.find(v => v.id === variantId) || null;
    }

    // Assign new variant based on weights
    const variant = this.selectVariantByWeight(experiment.variants, userId);
    
    if (variant) {
      if (!this.userVariants.has(userId)) {
        this.userVariants.set(userId, new Map());
      }
      this.userVariants.get(userId)!.set(experimentId, variant.id);
      this.saveToStorage();

      // Track assignment event
      this.trackEvent({
        experimentId,
        variantId: variant.id,
        userId,
        sessionId: this.getSessionId(),
        eventType: 'view',
        eventData: { assigned: true }
      });
    }

    return variant;
  }

  getUserVariant(userId: string, experimentId: string): ABTestVariant | null {
    const userExperiments = this.userVariants.get(userId);
    if (!userExperiments?.has(experimentId)) {
      return null;
    }

    const variantId = userExperiments.get(experimentId)!;
    const experiment = this.experiments.get(experimentId);
    return experiment?.variants.find(v => v.id === variantId) || null;
  }

  /**
   * Event Tracking
   */
  trackEvent(event: Omit<ConversionEvent, 'id' | 'timestamp'>): void {
    const fullEvent: ConversionEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date()
    };

    this.events.push(fullEvent);
    this.saveToStorage();

    // Real-time analysis for active experiments
    if (event.eventType === 'conversion') {
      this.updateExperimentMetrics(event.experimentId);
    }
  }

  trackConversion(userId: string, experimentId: string, value?: number): void {
    const variant = this.getUserVariant(userId, experimentId);
    if (!variant) return;

    this.trackEvent({
      experimentId,
      variantId: variant.id,
      userId,
      sessionId: this.getSessionId(),
      eventType: 'conversion',
      eventData: { value: value || 1 },
      value
    });
  }

  /**
   * Statistical Analysis
   */
  async analyzeExperiment(experimentId: string): Promise<ABTestResults> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const events = this.events.filter(e => e.experimentId === experimentId);
    const variantResults = this.calculateVariantResults(experiment.variants, events);
    
    // Perform statistical tests
    const statisticalTest = this.performStatisticalTest(variantResults);
    
    // Determine winner
    const winner = this.determineWinner(variantResults, statisticalTest);

    const results: ABTestResults = {
      experimentId,
      variants: variantResults,
      winner: winner?.variantId,
      confidence: statisticalTest.confidence,
      pValue: statisticalTest.pValue,
      effect: this.calculateEffect(variantResults),
      significance: this.determineSignificance(statisticalTest),
      recommendation: this.generateRecommendation(variantResults, statisticalTest),
      generatedAt: new Date()
    };

    // Update experiment with results
    await this.updateExperiment(experimentId, { results });

    return results;
  }

  private calculateVariantResults(variants: ABTestVariant[], events: ConversionEvent[]): VariantResults[] {
    return variants.map(variant => {
      const variantEvents = events.filter(e => e.variantId === variant.id);
      const views = variantEvents.filter(e => e.eventType === 'view').length;
      const conversions = variantEvents.filter(e => e.eventType === 'conversion').length;
      const revenue = variantEvents
        .filter(e => e.eventType === 'conversion' && e.value)
        .reduce((sum, e) => sum + (e.value || 0), 0);

      const conversionRate = views > 0 ? conversions / views : 0;
      const standardError = Math.sqrt((conversionRate * (1 - conversionRate)) / views);

      return {
        variantId: variant.id,
        metrics: {
          conversion_rate: {
            value: conversionRate,
            standardError,
            sampleSize: views,
            confidenceInterval: this.calculateConfidenceInterval(conversionRate, standardError)
          }
        },
        conversionRate,
        visitors: views,
        conversions,
        revenue,
        bounceRate: this.calculateBounceRate(variantEvents),
        timeOnPage: this.calculateAverageTimeOnPage(variantEvents)
      };
    });
  }

  private performStatisticalTest(results: VariantResults[]): StatisticalTest {
    if (results.length < 2) {
      throw new Error('Need at least 2 variants for statistical testing');
    }

    // Chi-square test for conversion rates
    const control = results.find(r => r.variantId.includes('control')) || results[0];
    const treatment = results.find(r => r !== control) || results[1];

    const chiSquare = this.calculateChiSquare(control, treatment);
    const pValue = this.calculatePValue(chiSquare, 1); // 1 degree of freedom
    
    return {
      testType: 'chi_square',
      pValue,
      confidence: (1 - pValue) * 100,
      powerAnalysis: {
        power: 0.8,
        alpha: 0.05,
        beta: 0.2,
        effectSize: Math.abs(treatment.conversionRate - control.conversionRate)
      },
      sampleSizeCalculation: {
        required: this.calculateSampleSize(95, 0.05, control.conversionRate).required,
        current: control.visitors + treatment.visitors,
        daysToSignificance: this.estimateDaysToSignificance(control, treatment)
      }
    };
  }

  /**
   * Conversion Optimization
   */
  identifyConversionBarriers(funnelData: ConversionFunnel): ConversionBarrier[] {
    const barriers: ConversionBarrier[] = [];

    funnelData.stages.forEach((stage, index) => {
      // High drop-off rate barrier
      if (stage.metrics.dropoffRate > 0.5) {
        barriers.push({
          id: this.generateId(),
          name: `High Drop-off at ${stage.name}`,
          type: 'friction',
          description: `${(stage.metrics.dropoffRate * 100).toFixed(1)}% of users drop off at this stage`,
          impact: 'high',
          frequency: stage.metrics.visitors,
          location: {
            page: stage.name,
            element: 'stage_transition',
            position: `stage_${index}`
          },
          identificationMethod: 'analytics',
          suggestedSolutions: [
            'Simplify the process',
            'Add progress indicators',
            'Provide clearer instructions',
            'Reduce form fields'
          ],
          priority: 10 - index, // Earlier stages have higher priority
          status: 'identified'
        });
      }

      // Long time spent without conversion
      if (stage.metrics.averageTimeSpent > 300 && stage.metrics.conversionRate < 0.1) {
        barriers.push({
          id: this.generateId(),
          name: `Confusion at ${stage.name}`,
          type: 'confusion',
          description: `Users spend ${Math.round(stage.metrics.averageTimeSpent / 60)} minutes but don't convert`,
          impact: 'medium',
          frequency: stage.metrics.visitors,
          location: {
            page: stage.name,
            element: 'content_area',
            position: `stage_${index}`
          },
          identificationMethod: 'analytics',
          suggestedSolutions: [
            'Improve content clarity',
            'Add helpful tooltips',
            'Provide examples',
            'Add live chat support'
          ],
          priority: 8 - index,
          status: 'identified'
        });
      }
    });

    return barriers.sort((a, b) => b.priority - a.priority);
  }

  generatePsychologyTriggers(barriers: ConversionBarrier[]): PsychologyTrigger[] {
    const triggers: PsychologyTrigger[] = [];

    barriers.forEach(barrier => {
      switch (barrier.type) {
        case 'trust':
          triggers.push({
            id: this.generateId(),
            name: 'Social Proof Badge',
            type: 'social_proof',
            description: 'Display customer count and testimonials',
            implementation: {
              component: 'SocialProofBadge',
              props: { showCount: true, showTestimonials: true },
              placement: [barrier.location.page]
            },
            effectiveness: {
              conversionLift: 15,
              confidenceLevel: 95,
              testResults: []
            },
            applicablePages: [barrier.location.page],
            targetAudience: ['new_visitors'],
            isActive: false
          });
          break;

        case 'urgency':
          triggers.push({
            id: this.generateId(),
            name: 'Scarcity Timer',
            type: 'scarcity',
            description: 'Limited time offer countdown',
            implementation: {
              component: 'ScarcityTimer',
              props: { duration: 3600, message: 'Limited time offer!' },
              placement: [barrier.location.page]
            },
            effectiveness: {
              conversionLift: 25,
              confidenceLevel: 90,
              testResults: []
            },
            applicablePages: [barrier.location.page],
            targetAudience: ['returning_visitors'],
            isActive: false
          });
          break;

        case 'value':
          triggers.push({
            id: this.generateId(),
            name: 'Value Proposition Highlight',
            type: 'reciprocity',
            description: 'Emphasize unique value and benefits',
            implementation: {
              component: 'ValueHighlight',
              props: { benefits: ['Save time', 'Increase revenue', 'Reduce costs'] },
              placement: [barrier.location.page]
            },
            effectiveness: {
              conversionLift: 20,
              confidenceLevel: 85,
              testResults: []
            },
            applicablePages: [barrier.location.page],
            targetAudience: ['all'],
            isActive: false
          });
          break;
      }
    });

    return triggers;
  }

  /**
   * Utility Methods
   */
  private validateExperiment(experiment: ABTestExperiment): void {
    if (experiment.variants.length < 2) {
      throw new Error('Experiment must have at least 2 variants');
    }

    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error('Variant weights must sum to 100%');
    }

    if (!experiment.variants.some(v => v.isControl)) {
      throw new Error('Experiment must have a control variant');
    }
  }

  private selectVariantByWeight(variants: ABTestVariant[], userId: string): ABTestVariant | null {
    // Use user ID for consistent assignment
    const hash = this.hashString(userId);
    const random = (hash % 10000) / 100; // 0-99.99

    let cumulativeWeight = 0;
    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (random < cumulativeWeight) {
        return variant;
      }
    }

    return variants[variants.length - 1]; // Fallback
  }

  private calculateSampleSize(confidence: number, minEffect: number, baselineRate: number) {
    const alpha = (100 - confidence) / 100;
    const beta = 0.2; // 80% power
    const zAlpha = this.getZScore(1 - alpha / 2);
    const zBeta = this.getZScore(1 - beta);

    const p1 = baselineRate;
    const p2 = baselineRate + minEffect;
    const pPooled = (p1 + p2) / 2;

    const required = Math.ceil(
      (2 * pPooled * (1 - pPooled) * Math.pow(zAlpha + zBeta, 2)) /
      Math.pow(p2 - p1, 2)
    );

    return {
      required,
      current: 0,
      perVariant: Math.ceil(required / 2)
    };
  }

  private calculateChiSquare(control: VariantResults, treatment: VariantResults): number {
    const n1 = control.visitors;
    const n2 = treatment.visitors;
    const x1 = control.conversions;
    const x2 = treatment.conversions;

    const expected1 = (n1 * (x1 + x2)) / (n1 + n2);
    const expected2 = (n2 * (x1 + x2)) / (n1 + n2);

    return Math.pow(x1 - expected1, 2) / expected1 + Math.pow(x2 - expected2, 2) / expected2;
  }

  private calculatePValue(chiSquare: number, degreesOfFreedom: number): number {
    // Simplified p-value calculation (would use proper statistical library in production)
    if (chiSquare > 3.841) return 0.05; // 95% confidence
    if (chiSquare > 2.706) return 0.1;  // 90% confidence
    return 0.5; // Not significant
  }

  private calculateEffect(results: VariantResults[]) {
    if (results.length < 2) return { absolute: 0, relative: 0, confidenceInterval: [0, 0] as [number, number] };

    const control = results[0];
    const treatment = results[1];
    
    const absolute = treatment.conversionRate - control.conversionRate;
    const relative = control.conversionRate > 0 ? absolute / control.conversionRate : 0;

    return {
      absolute,
      relative,
      confidenceInterval: [absolute - 0.02, absolute + 0.02] as [number, number] // Simplified
    };
  }

  private determineWinner(results: VariantResults[], test: StatisticalTest): VariantResults | null {
    if (test.pValue > 0.05) return null; // Not significant

    return results.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    );
  }

  private determineSignificance(test: StatisticalTest): 'significant' | 'not_significant' | 'inconclusive' {
    if (test.pValue <= 0.05) return 'significant';
    if (test.pValue <= 0.1) return 'inconclusive';
    return 'not_significant';
  }

  private generateRecommendation(results: VariantResults[], test: StatisticalTest): string {
    const winner = this.determineWinner(results, test);
    
    if (!winner) {
      return 'Continue testing - no significant difference detected yet.';
    }

    const improvement = ((winner.conversionRate - results[0].conversionRate) / results[0].conversionRate * 100).toFixed(1);
    return `Implement variant ${winner.variantId} - shows ${improvement}% improvement with ${test.confidence.toFixed(1)}% confidence.`;
  }

  private calculateBounceRate(events: ConversionEvent[]): number {
    const sessions = new Set(events.map(e => e.sessionId));
    const bouncedSessions = Array.from(sessions).filter(sessionId => {
      const sessionEvents = events.filter(e => e.sessionId === sessionId);
      return sessionEvents.length === 1 && sessionEvents[0].eventType === 'view';
    });

    return sessions.size > 0 ? bouncedSessions.length / sessions.size : 0;
  }

  private calculateAverageTimeOnPage(events: ConversionEvent[]): number {
    // Simplified calculation - would need proper session tracking in production
    return 120; // 2 minutes average
  }

  private calculateConfidenceInterval(rate: number, standardError: number): [number, number] {
    const margin = 1.96 * standardError; // 95% confidence
    return [Math.max(0, rate - margin), Math.min(1, rate + margin)];
  }

  private estimateDaysToSignificance(control: VariantResults, treatment: VariantResults): number {
    const currentSampleSize = control.visitors + treatment.visitors;
    const requiredSampleSize = this.calculateSampleSize(95, 0.05, control.conversionRate).required;
    
    if (currentSampleSize >= requiredSampleSize) return 0;
    
    const dailyTraffic = currentSampleSize / 7; // Assume 7 days of data
    return Math.ceil((requiredSampleSize - currentSampleSize) / dailyTraffic);
  }

  private updateExperimentMetrics(experimentId: string): void {
    // Real-time metrics update logic
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    // Update sample size
    const events = this.events.filter(e => e.experimentId === experimentId);
    const currentSampleSize = events.filter(e => e.eventType === 'view').length;
    
    experiment.sampleSize.current = currentSampleSize;
    this.experiments.set(experimentId, experiment);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getZScore(probability: number): number {
    // Simplified Z-score calculation
    if (probability >= 0.975) return 1.96;
    if (probability >= 0.95) return 1.645;
    if (probability >= 0.9) return 1.28;
    return 0;
  }

  private getSessionId(): string {
    // In production, this would come from session management
    return 'session_' + Date.now();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('ab_testing_data');
      if (stored) {
        const data = JSON.parse(stored);
        this.experiments = new Map(data.experiments || []);
        this.userVariants = new Map(data.userVariants || []);
        this.events = data.events || [];
      }
    } catch (error) {
      console.warn('Failed to load A/B testing data from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        experiments: Array.from(this.experiments.entries()),
        userVariants: Array.from(this.userVariants.entries()),
        events: this.events
      };
      localStorage.setItem('ab_testing_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save A/B testing data to storage:', error);
    }
  }
}

export default ABTestingService;
