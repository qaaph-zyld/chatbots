/**
 * A/B Testing Framework Types
 * Comprehensive type definitions for statistical validation and conversion optimization
 */

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // Traffic allocation percentage (0-100)
  config: Record<string, any>;
  isControl: boolean;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestExperiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  primaryMetric: string;
  secondaryMetrics: string[];
  variants: ABTestVariant[];
  targetAudience: AudienceSegment;
  duration: {
    startDate: Date;
    endDate: Date;
    estimatedDuration: number; // days
  };
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  confidence: number; // Statistical confidence level (e.g., 95)
  minDetectableEffect: number; // Minimum effect size to detect
  sampleSize: {
    required: number;
    current: number;
    perVariant: number;
  };
  results?: ABTestResults;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudienceSegment {
  id: string;
  name: string;
  criteria: {
    demographics?: {
      ageRange?: [number, number];
      location?: string[];
      deviceType?: ('desktop' | 'mobile' | 'tablet')[];
    };
    behavioral?: {
      visitCount?: number;
      lastVisit?: Date;
      pageViews?: number;
      timeOnSite?: number;
    };
    acquisition?: {
      source?: string[];
      medium?: string[];
      campaign?: string[];
    };
  };
  size: number; // Estimated audience size
}

export interface ABTestResults {
  experimentId: string;
  variants: VariantResults[];
  winner?: string; // Variant ID of the winning variant
  confidence: number;
  pValue: number;
  effect: {
    absolute: number;
    relative: number;
    confidenceInterval: [number, number];
  };
  significance: 'significant' | 'not_significant' | 'inconclusive';
  recommendation: string;
  generatedAt: Date;
}

export interface VariantResults {
  variantId: string;
  metrics: {
    [metricName: string]: {
      value: number;
      standardError: number;
      sampleSize: number;
      confidenceInterval: [number, number];
    };
  };
  conversionRate: number;
  visitors: number;
  conversions: number;
  revenue?: number;
  bounceRate: number;
  timeOnPage: number;
}

export interface ConversionEvent {
  id: string;
  experimentId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  eventType: 'view' | 'click' | 'conversion' | 'bounce';
  eventData: Record<string, any>;
  timestamp: Date;
  value?: number; // Revenue or other numeric value
}

export interface StatisticalTest {
  testType: 'chi_square' | 't_test' | 'z_test' | 'bayesian';
  pValue: number;
  confidence: number;
  powerAnalysis: {
    power: number;
    alpha: number;
    beta: number;
    effectSize: number;
  };
  sampleSizeCalculation: {
    required: number;
    current: number;
    daysToSignificance: number;
  };
}

export interface ABTestConfig {
  framework: {
    defaultConfidence: number;
    defaultPower: number;
    minSampleSize: number;
    maxExperimentDuration: number; // days
  };
  tracking: {
    cookieDuration: number; // days
    sessionTimeout: number; // minutes
    enableCrossDomain: boolean;
  };
  analysis: {
    updateFrequency: number; // hours
    earlyStoppingEnabled: boolean;
    sequentialTestingEnabled: boolean;
  };
}

export interface ConversionBarrier {
  id: string;
  name: string;
  type: 'friction' | 'confusion' | 'trust' | 'value' | 'urgency';
  description: string;
  impact: 'high' | 'medium' | 'low';
  frequency: number; // How often this barrier occurs
  location: {
    page: string;
    element: string;
    position: string;
  };
  identificationMethod: 'heatmap' | 'user_feedback' | 'analytics' | 'session_recording';
  suggestedSolutions: string[];
  priority: number;
  status: 'identified' | 'testing' | 'resolved' | 'dismissed';
}

export interface PsychologyTrigger {
  id: string;
  name: string;
  type: 'scarcity' | 'social_proof' | 'authority' | 'reciprocity' | 'commitment' | 'liking';
  description: string;
  implementation: {
    component: string;
    props: Record<string, any>;
    placement: string[];
  };
  effectiveness: {
    conversionLift: number;
    confidenceLevel: number;
    testResults: ABTestResults[];
  };
  applicablePages: string[];
  targetAudience: string[];
  isActive: boolean;
}

export interface ConversionFunnelStage {
  id: string;
  name: string;
  description: string;
  order: number;
  entryPoints: string[];
  exitPoints: string[];
  metrics: {
    visitors: number;
    conversions: number;
    conversionRate: number;
    dropoffRate: number;
    averageTimeSpent: number;
  };
  barriers: ConversionBarrier[];
  optimizations: {
    active: PsychologyTrigger[];
    planned: PsychologyTrigger[];
    tested: PsychologyTrigger[];
  };
}

export interface ConversionFunnel {
  id: string;
  name: string;
  description: string;
  stages: ConversionFunnelStage[];
  overallMetrics: {
    totalVisitors: number;
    totalConversions: number;
    overallConversionRate: number;
    averageTimeToConvert: number;
    revenue: number;
  };
  optimizationOpportunities: {
    highImpact: ConversionBarrier[];
    quickWins: ConversionBarrier[];
    longTerm: ConversionBarrier[];
  };
  lastAnalyzed: Date;
}

// Hook and Context Types
export interface ABTestContextValue {
  currentExperiments: ABTestExperiment[];
  activeVariants: Map<string, string>; // experimentId -> variantId
  trackEvent: (event: Omit<ConversionEvent, 'id' | 'timestamp'>) => void;
  getVariant: (experimentId: string) => ABTestVariant | null;
  isInExperiment: (experimentId: string) => boolean;
  loading: boolean;
  error: string | null;
}

export interface UseABTestResult {
  variant: ABTestVariant | null;
  isLoading: boolean;
  trackConversion: (value?: number) => void;
  trackEvent: (eventType: string, data?: Record<string, any>) => void;
}

// Component Props Types
export interface ABTestComponentProps {
  experimentId: string;
  variants: Record<string, React.ComponentType<any>>;
  fallback?: React.ComponentType<any>;
  trackingProps?: Record<string, any>;
}

export interface ConversionOptimizerProps {
  funnelId: string;
  stage?: string;
  triggers?: PsychologyTrigger[];
  barriers?: ConversionBarrier[];
  onOptimizationApplied?: (trigger: PsychologyTrigger) => void;
}

export interface ABTestDashboardProps {
  experiments: ABTestExperiment[];
  onCreateExperiment: (experiment: Omit<ABTestExperiment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateExperiment: (id: string, updates: Partial<ABTestExperiment>) => void;
  onDeleteExperiment: (id: string) => void;
  onViewResults: (experimentId: string) => void;
}

// API Response Types
export interface ABTestAPIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  metadata?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface CreateExperimentRequest {
  name: string;
  description: string;
  hypothesis: string;
  variants: Omit<ABTestVariant, 'id' | 'createdAt' | 'updatedAt'>[];
  targetAudience: AudienceSegment;
  duration: number; // days
  confidence: number;
  primaryMetric: string;
  secondaryMetrics: string[];
}

export interface UpdateExperimentRequest {
  name?: string;
  description?: string;
  status?: ABTestExperiment['status'];
  variants?: ABTestVariant[];
  targetAudience?: AudienceSegment;
}

export interface ExperimentAnalysisRequest {
  experimentId: string;
  analysisType: 'interim' | 'final';
  includeSegmentation?: boolean;
  customMetrics?: string[];
}
