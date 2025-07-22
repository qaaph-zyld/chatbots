/**
 * AI Training Interface Types
 * Comprehensive type definitions for AI training and template management system
 */

export interface ResponseTemplate {
  id: string;
  name: string;
  category: 'greeting' | 'product_inquiry' | 'support' | 'checkout' | 'custom';
  template: string;
  variables: TemplateVariable[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  usage_count: number;
  effectiveness_score: number;
  tags: string[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: ValidationRule;
}

export interface ValidationRule {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: string[];
}

export interface TrainingDataEntry {
  id: string;
  input: string;
  expected_output: string;
  actual_output?: string;
  category: string;
  quality_score: number;
  validated: boolean;
  created_by: string;
  created_at: Date;
  feedback?: TrainingFeedback;
}

export interface TrainingFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  comments: string;
  improvements: string[];
  reviewer: string;
  reviewed_at: Date;
}

export interface ModelPerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  response_time_avg: number;
  confidence_avg: number;
  total_interactions: number;
  successful_interactions: number;
  last_updated: Date;
  trend_data: PerformanceTrend[];
}

export interface PerformanceTrend {
  date: Date;
  accuracy: number;
  response_time: number;
  interaction_count: number;
  satisfaction_score: number;
}

export interface AITrainingConfig {
  model_version: string;
  training_mode: 'supervised' | 'reinforcement' | 'hybrid';
  learning_rate: number;
  batch_size: number;
  max_iterations: number;
  validation_split: number;
  early_stopping: boolean;
  performance_threshold: number;
}

export interface TrainingSession {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  config: AITrainingConfig;
  start_time: Date;
  end_time?: Date;
  duration?: number;
  initial_metrics: ModelPerformanceMetrics;
  final_metrics?: ModelPerformanceMetrics;
  improvement_percentage?: number;
  logs: TrainingLog[];
}

export interface TrainingLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details?: Record<string, any>;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  template_count: number;
  avg_effectiveness: number;
}

export interface AITrainingState {
  templates: ResponseTemplate[];
  categories: TemplateCategory[];
  training_data: TrainingDataEntry[];
  performance_metrics: ModelPerformanceMetrics;
  active_session: TrainingSession | null;
  training_history: TrainingSession[];
  loading: boolean;
  error: string | null;
}

export interface AITrainingActions {
  // Template Management
  createTemplate: (template: Omit<ResponseTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<ResponseTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string, name: string) => Promise<void>;
  testTemplate: (id: string, variables: Record<string, any>) => Promise<string>;
  
  // Training Data Management
  addTrainingData: (data: Omit<TrainingDataEntry, 'id' | 'created_at'>) => Promise<void>;
  validateTrainingData: (id: string, feedback: TrainingFeedback) => Promise<void>;
  bulkImportTrainingData: (data: TrainingDataEntry[]) => Promise<void>;
  exportTrainingData: (filters?: TrainingDataFilters) => Promise<Blob>;
  
  // Model Training
  startTrainingSession: (config: AITrainingConfig, name: string) => Promise<void>;
  stopTrainingSession: (id: string) => Promise<void>;
  getTrainingProgress: (id: string) => Promise<TrainingProgress>;
  
  // Performance Monitoring
  refreshMetrics: () => Promise<void>;
  getPerformanceTrends: (timeRange: TimeRange) => Promise<PerformanceTrend[]>;
  generatePerformanceReport: (timeRange: TimeRange) => Promise<PerformanceReport>;
}

export interface TrainingDataFilters {
  category?: string;
  quality_score_min?: number;
  validated?: boolean;
  date_range?: {
    start: Date;
    end: Date;
  };
  created_by?: string;
}

export interface TrainingProgress {
  current_iteration: number;
  total_iterations: number;
  current_accuracy: number;
  best_accuracy: number;
  estimated_time_remaining: number;
  status: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface PerformanceReport {
  summary: ModelPerformanceMetrics;
  trends: PerformanceTrend[];
  insights: string[];
  recommendations: string[];
  generated_at: Date;
}

// Component Props Types
export interface TemplateManagerProps {
  templates: ResponseTemplate[];
  categories: TemplateCategory[];
  onCreateTemplate: (template: Omit<ResponseTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTemplate: (id: string, updates: Partial<ResponseTemplate>) => void;
  onDeleteTemplate: (id: string) => void;
  loading?: boolean;
}

export interface TrainingDataCuratorProps {
  trainingData: TrainingDataEntry[];
  onAddData: (data: Omit<TrainingDataEntry, 'id' | 'created_at'>) => void;
  onValidateData: (id: string, feedback: TrainingFeedback) => void;
  onBulkImport: (data: TrainingDataEntry[]) => void;
  loading?: boolean;
}

export interface ModelPerformanceMonitorProps {
  metrics: ModelPerformanceMetrics;
  trends: PerformanceTrend[];
  activeSession: TrainingSession | null;
  onRefreshMetrics: () => void;
  onStartTraining: (config: AITrainingConfig, name: string) => void;
  loading?: boolean;
}
