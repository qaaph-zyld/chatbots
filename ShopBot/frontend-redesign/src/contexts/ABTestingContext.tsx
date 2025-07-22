/**
 * A/B Testing Context & Hooks
 * React context for managing A/B tests throughout the application
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import ABTestingService from '../services/ABTestingService';
import {
  ABTestExperiment,
  ABTestVariant,
  ConversionEvent,
  ABTestContextValue,
  UseABTestResult
} from '../types/ABTestingTypes';

// Create the context
const ABTestingContext = createContext<ABTestContextValue | null>(null);

// Provider Props
interface ABTestingProviderProps {
  children: ReactNode;
  userId?: string;
  apiBaseUrl?: string;
  config?: {
    enableLocalStorage?: boolean;
    enableAnalytics?: boolean;
    debugMode?: boolean;
  };
}

// A/B Testing Provider Component
export function ABTestingProvider({ 
  children, 
  userId = 'anonymous',
  apiBaseUrl = '/api/ab-testing',
  config = {}
}: ABTestingProviderProps) {
  const [service] = useState(() => new ABTestingService(apiBaseUrl));
  const [currentExperiments, setCurrentExperiments] = useState<ABTestExperiment[]>([]);
  const [activeVariants, setActiveVariants] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and load experiments
  useEffect(() => {
    const initializeABTesting = async () => {
      try {
        setLoading(true);
        
        // Load active experiments
        const experiments = service.getActiveExperiments();
        setCurrentExperiments(experiments);

        // Assign user to variants for active experiments
        const variants = new Map<string, string>();
        for (const experiment of experiments) {
          const variant = service.assignUserToVariant(userId, experiment.id);
          if (variant) {
            variants.set(experiment.id, variant.id);
          }
        }
        setActiveVariants(variants);

        if (config.debugMode) {
          console.log('A/B Testing initialized:', {
            experiments: experiments.length,
            userVariants: Array.from(variants.entries())
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize A/B testing');
        console.error('A/B Testing initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeABTesting();
  }, [service, userId, config.debugMode]);

  // Track conversion events
  const trackEvent = useCallback((event: Omit<ConversionEvent, 'id' | 'timestamp'>) => {
    try {
      service.trackEvent({
        ...event,
        userId: event.userId || userId
      });

      if (config.debugMode) {
        console.log('A/B Test event tracked:', event);
      }
    } catch (err) {
      console.error('Failed to track A/B test event:', err);
    }
  }, [service, userId, config.debugMode]);

  // Get variant for specific experiment
  const getVariant = useCallback((experimentId: string): ABTestVariant | null => {
    const experiment = currentExperiments.find(exp => exp.id === experimentId);
    if (!experiment) return null;

    const variantId = activeVariants.get(experimentId);
    if (!variantId) return null;

    return experiment.variants.find(v => v.id === variantId) || null;
  }, [currentExperiments, activeVariants]);

  // Check if user is in experiment
  const isInExperiment = useCallback((experimentId: string): boolean => {
    return activeVariants.has(experimentId);
  }, [activeVariants]);

  // Context value
  const contextValue: ABTestContextValue = {
    currentExperiments,
    activeVariants,
    trackEvent,
    getVariant,
    isInExperiment,
    loading,
    error
  };

  return (
    <ABTestingContext.Provider value={contextValue}>
      {children}
    </ABTestingContext.Provider>
  );
}

// Hook to use A/B Testing context
export function useABTesting(): ABTestContextValue {
  const context = useContext(ABTestingContext);
  if (!context) {
    throw new Error('useABTesting must be used within an ABTestingProvider');
  }
  return context;
}

// Hook for specific A/B test
export function useABTest(experimentId: string): UseABTestResult {
  const { getVariant, trackEvent, isInExperiment, loading } = useABTesting();
  const [variant, setVariant] = useState<ABTestVariant | null>(null);

  useEffect(() => {
    if (!loading) {
      const currentVariant = getVariant(experimentId);
      setVariant(currentVariant);
    }
  }, [experimentId, getVariant, loading]);

  // Track conversion for this experiment
  const trackConversion = useCallback((value?: number) => {
    if (!variant) return;

    trackEvent({
      experimentId,
      variantId: variant.id,
      userId: '', // Will be filled by trackEvent
      sessionId: '', // Will be filled by trackEvent
      eventType: 'conversion',
      eventData: { value: value || 1 },
      value
    });
  }, [experimentId, variant, trackEvent]);

  // Track custom event for this experiment
  const trackCustomEvent = useCallback((eventType: string, data?: Record<string, any>) => {
    if (!variant) return;

    trackEvent({
      experimentId,
      variantId: variant.id,
      userId: '', // Will be filled by trackEvent
      sessionId: '', // Will be filled by trackEvent
      eventType: eventType as any,
      eventData: data || {}
    });
  }, [experimentId, variant, trackEvent]);

  return {
    variant,
    isLoading: loading,
    trackConversion,
    trackEvent: trackCustomEvent
  };
}

// Hook for conditional rendering based on A/B test
export function useABTestVariant<T extends Record<string, any>>(
  experimentId: string,
  variants: T,
  fallback?: keyof T
): T[keyof T] | null {
  const { variant, isLoading } = useABTest(experimentId);

  if (isLoading) {
    return fallback ? variants[fallback] : null;
  }

  if (!variant) {
    return fallback ? variants[fallback] : null;
  }

  // Try to match variant by name or ID
  const variantKey = Object.keys(variants).find(key => 
    key === variant.name || 
    key === variant.id || 
    key.toLowerCase() === variant.name.toLowerCase()
  );

  if (variantKey) {
    return variants[variantKey];
  }

  return fallback ? variants[fallback] : null;
}

// Component for A/B test rendering
interface ABTestComponentProps {
  experimentId: string;
  variants: Record<string, React.ComponentType<any>>;
  fallback?: React.ComponentType<any>;
  trackingProps?: Record<string, any>;
}

export function ABTestComponent({ 
  experimentId, 
  variants, 
  fallback,
  trackingProps = {}
}: ABTestComponentProps) {
  const { variant, isLoading, trackEvent } = useABTest(experimentId);

  useEffect(() => {
    // Track view event when component mounts
    if (variant) {
      trackEvent('view', { component: 'ABTestComponent', ...trackingProps });
    }
  }, [variant, trackEvent, trackingProps]);

  if (isLoading) {
    return fallback ? React.createElement(fallback, trackingProps) : null;
  }

  if (!variant) {
    return fallback ? React.createElement(fallback, trackingProps) : null;
  }

  // Find matching component
  const VariantComponent = variants[variant.name] || variants[variant.id];
  
  if (!VariantComponent) {
    console.warn(`No component found for variant ${variant.name} in experiment ${experimentId}`);
    return fallback ? React.createElement(fallback, trackingProps) : null;
  }

  return React.createElement(VariantComponent, {
    ...trackingProps,
    variant,
    experimentId,
    onConversion: (value?: number) => trackEvent('conversion', { value })
  });
}

// Higher-order component for A/B testing
export function withABTest<P extends object>(
  experimentId: string,
  variants: Record<string, React.ComponentType<P>>,
  fallback?: React.ComponentType<P>
) {
  return function ABTestWrapper(props: P) {
    return (
      <ABTestComponent
        experimentId={experimentId}
        variants={variants}
        fallback={fallback}
        trackingProps={props}
      />
    );
  };
}

// Hook for feature flags (simple A/B test with boolean result)
export function useFeatureFlag(flagName: string, defaultValue: boolean = false): boolean {
  const { getVariant, isInExperiment } = useABTesting();

  if (!isInExperiment(flagName)) {
    return defaultValue;
  }

  const variant = getVariant(flagName);
  if (!variant) {
    return defaultValue;
  }

  // Assume feature flags have variants named 'enabled' and 'disabled'
  return variant.name.toLowerCase() === 'enabled' || variant.name.toLowerCase() === 'true';
}

// Hook for multivariate testing
export function useMultivariateTest(experimentId: string): {
  variant: ABTestVariant | null;
  config: Record<string, any>;
  isLoading: boolean;
  trackConversion: (value?: number) => void;
} {
  const { variant, isLoading, trackConversion } = useABTest(experimentId);

  return {
    variant,
    config: variant?.config || {},
    isLoading,
    trackConversion
  };
}

// Utility function to create experiment configuration
export function createExperimentConfig(
  name: string,
  variants: Array<{
    name: string;
    weight: number;
    config?: Record<string, any>;
    isControl?: boolean;
  }>,
  options: {
    hypothesis?: string;
    primaryMetric?: string;
    secondaryMetrics?: string[];
    duration?: number;
    confidence?: number;
    minDetectableEffect?: number;
  } = {}
): Omit<ABTestExperiment, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name,
    description: options.hypothesis || `A/B test for ${name}`,
    hypothesis: options.hypothesis || `Testing different variants of ${name}`,
    primaryMetric: options.primaryMetric || 'conversion_rate',
    secondaryMetrics: options.secondaryMetrics || [],
    variants: variants.map((v, index) => ({
      id: `${name.toLowerCase().replace(/\s+/g, '_')}_${v.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: v.name,
      description: `${v.name} variant for ${name}`,
      weight: v.weight,
      config: v.config || {},
      isControl: v.isControl || index === 0,
      status: 'draft' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    targetAudience: {
      id: 'all_users',
      name: 'All Users',
      criteria: {},
      size: 10000
    },
    duration: {
      startDate: new Date(),
      endDate: new Date(Date.now() + (options.duration || 14) * 24 * 60 * 60 * 1000),
      estimatedDuration: options.duration || 14
    },
    status: 'draft',
    confidence: options.confidence || 95,
    minDetectableEffect: options.minDetectableEffect || 0.05,
    sampleSize: {
      required: 0,
      current: 0,
      perVariant: 0
    },
    createdBy: 'system'
  };
}

export default ABTestingContext;
