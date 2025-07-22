/**
 * AI Training Components Index
 * Centralized exports for AI training interface components
 */

export { default as ResponseTemplateManager } from './ResponseTemplateManager';
export { default as TrainingDataCurator } from './TrainingDataCurator';
export { default as ModelPerformanceMonitor } from './ModelPerformanceMonitor';

// Re-export context and types for convenience
export { AITrainingProvider, useAITraining } from '@/contexts/AITrainingContext';
export type {
  ResponseTemplate,
  TrainingDataEntry,
  TrainingFeedback,
  ModelPerformanceMetrics,
  PerformanceTrend,
  TrainingSession,
  AITrainingConfig,
  AITrainingState,
  AITrainingActions
} from '@/types/AITrainingTypes';
