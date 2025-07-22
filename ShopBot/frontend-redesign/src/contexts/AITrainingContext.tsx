/**
 * AI Training Context Provider
 * Centralized state management for AI training interface
 */

'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  AITrainingState,
  AITrainingActions,
  ResponseTemplate,
  TrainingDataEntry,
  TrainingFeedback,
  AITrainingConfig,
  ModelPerformanceMetrics,
  TrainingSession,
  PerformanceTrend,
  TimeRange,
  PerformanceReport,
  TrainingDataFilters,
  TrainingProgress,
  TemplateCategory
} from '@/types/AITrainingTypes';

// Initial state
const initialState: AITrainingState = {
  templates: [],
  categories: [
    {
      id: 'greeting',
      name: 'Greeting',
      description: 'Welcome and initial interaction templates',
      color: '#10B981',
      icon: '👋',
      template_count: 0,
      avg_effectiveness: 0
    },
    {
      id: 'product_inquiry',
      name: 'Product Inquiry',
      description: 'Product questions and information requests',
      color: '#3B82F6',
      icon: '🛍️',
      template_count: 0,
      avg_effectiveness: 0
    },
    {
      id: 'support',
      name: 'Support',
      description: 'Customer support and troubleshooting',
      color: '#F59E0B',
      icon: '🛠️',
      template_count: 0,
      avg_effectiveness: 0
    },
    {
      id: 'checkout',
      name: 'Checkout',
      description: 'Purchase assistance and checkout flow',
      color: '#EF4444',
      icon: '💳',
      template_count: 0,
      avg_effectiveness: 0
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'Custom templates for specific scenarios',
      color: '#8B5CF6',
      icon: '⚡',
      template_count: 0,
      avg_effectiveness: 0
    }
  ],
  training_data: [],
  performance_metrics: {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1_score: 0,
    response_time_avg: 0,
    confidence_avg: 0,
    total_interactions: 0,
    successful_interactions: 0,
    last_updated: new Date(),
    trend_data: []
  },
  active_session: null,
  training_history: [],
  loading: false,
  error: null
};

// Action types
type AITrainingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TEMPLATES'; payload: ResponseTemplate[] }
  | { type: 'ADD_TEMPLATE'; payload: ResponseTemplate }
  | { type: 'UPDATE_TEMPLATE'; payload: { id: string; updates: Partial<ResponseTemplate> } }
  | { type: 'DELETE_TEMPLATE'; payload: string }
  | { type: 'SET_TRAINING_DATA'; payload: TrainingDataEntry[] }
  | { type: 'ADD_TRAINING_DATA'; payload: TrainingDataEntry }
  | { type: 'UPDATE_TRAINING_DATA'; payload: { id: string; updates: Partial<TrainingDataEntry> } }
  | { type: 'SET_PERFORMANCE_METRICS'; payload: ModelPerformanceMetrics }
  | { type: 'SET_ACTIVE_SESSION'; payload: TrainingSession | null }
  | { type: 'ADD_TRAINING_SESSION'; payload: TrainingSession }
  | { type: 'UPDATE_TRAINING_SESSION'; payload: { id: string; updates: Partial<TrainingSession> } }
  | { type: 'UPDATE_CATEGORIES'; payload: TemplateCategory[] };

// Reducer
function aiTrainingReducer(state: AITrainingState, action: AITrainingAction): AITrainingState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    
    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, action.payload] };
    
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map(template =>
          template.id === action.payload.id
            ? { ...template, ...action.payload.updates, updatedAt: new Date() }
            : template
        )
      };
    
    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter(template => template.id !== action.payload)
      };
    
    case 'SET_TRAINING_DATA':
      return { ...state, training_data: action.payload };
    
    case 'ADD_TRAINING_DATA':
      return { ...state, training_data: [...state.training_data, action.payload] };
    
    case 'UPDATE_TRAINING_DATA':
      return {
        ...state,
        training_data: state.training_data.map(data =>
          data.id === action.payload.id
            ? { ...data, ...action.payload.updates }
            : data
        )
      };
    
    case 'SET_PERFORMANCE_METRICS':
      return { ...state, performance_metrics: action.payload };
    
    case 'SET_ACTIVE_SESSION':
      return { ...state, active_session: action.payload };
    
    case 'ADD_TRAINING_SESSION':
      return {
        ...state,
        training_history: [...state.training_history, action.payload],
        active_session: action.payload.status === 'running' ? action.payload : state.active_session
      };
    
    case 'UPDATE_TRAINING_SESSION':
      return {
        ...state,
        training_history: state.training_history.map(session =>
          session.id === action.payload.id
            ? { ...session, ...action.payload.updates }
            : session
        ),
        active_session: state.active_session?.id === action.payload.id
          ? { ...state.active_session, ...action.payload.updates }
          : state.active_session
      };
    
    case 'UPDATE_CATEGORIES':
      return { ...state, categories: action.payload };
    
    default:
      return state;
  }
}

// Context
const AITrainingContext = createContext<{
  state: AITrainingState;
  actions: AITrainingActions;
} | null>(null);

// Provider component
export function AITrainingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(aiTrainingReducer, initialState);

  // Mock API functions (replace with real API calls)
  const mockApiCall = <T,>(data: T, delay = 500): Promise<T> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), delay);
    });
  };

  const generateId = () => `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Actions implementation
  const actions: AITrainingActions = {
    // Template Management
    createTemplate: useCallback(async (templateData) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const newTemplate: ResponseTemplate = {
          ...templateData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          usage_count: 0,
          effectiveness_score: 0
        };
        
        await mockApiCall(newTemplate);
        dispatch({ type: 'ADD_TEMPLATE', payload: newTemplate });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create template' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, []),

    updateTemplate: useCallback(async (id, updates) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await mockApiCall(updates);
        dispatch({ type: 'UPDATE_TEMPLATE', payload: { id, updates } });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update template' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, []),

    deleteTemplate: useCallback(async (id) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await mockApiCall(id);
        dispatch({ type: 'DELETE_TEMPLATE', payload: id });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete template' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, []),

    duplicateTemplate: useCallback(async (id, name) => {
      const template = state.templates.find(t => t.id === id);
      if (template) {
        await actions.createTemplate({
          ...template,
          name,
          isActive: false
        });
      }
    }, [state.templates]),

    testTemplate: useCallback(async (id, variables) => {
      const template = state.templates.find(t => t.id === id);
      if (!template) throw new Error('Template not found');
      
      // Simple variable substitution for testing
      let result = template.template;
      Object.entries(variables).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      
      return mockApiCall(result);
    }, [state.templates]),

    // Training Data Management
    addTrainingData: useCallback(async (data) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const newData: TrainingDataEntry = {
          ...data,
          id: generateId(),
          created_at: new Date()
        };
        
        await mockApiCall(newData);
        dispatch({ type: 'ADD_TRAINING_DATA', payload: newData });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to add training data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, []),

    validateTrainingData: useCallback(async (id, feedback) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await mockApiCall(feedback);
        dispatch({
          type: 'UPDATE_TRAINING_DATA',
          payload: { id, updates: { feedback, validated: true } }
        });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to validate training data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, []),

    bulkImportTrainingData: useCallback(async (data) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const processedData = data.map(item => ({
          ...item,
          id: item.id || generateId(),
          created_at: item.created_at || new Date()
        }));
        
        await mockApiCall(processedData);
        dispatch({ type: 'SET_TRAINING_DATA', payload: [...state.training_data, ...processedData] });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to import training data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, [state.training_data]),

    exportTrainingData: useCallback(async (filters) => {
      let dataToExport = state.training_data;
      
      if (filters) {
        dataToExport = dataToExport.filter(item => {
          if (filters.category && item.category !== filters.category) return false;
          if (filters.quality_score_min && item.quality_score < filters.quality_score_min) return false;
          if (filters.validated !== undefined && item.validated !== filters.validated) return false;
          if (filters.created_by && item.created_by !== filters.created_by) return false;
          if (filters.date_range) {
            const itemDate = new Date(item.created_at);
            if (itemDate < filters.date_range.start || itemDate > filters.date_range.end) return false;
          }
          return true;
        });
      }
      
      const csvContent = [
        'ID,Input,Expected Output,Category,Quality Score,Validated,Created By,Created At',
        ...dataToExport.map(item => 
          `"${item.id}","${item.input}","${item.expected_output}","${item.category}",${item.quality_score},${item.validated},"${item.created_by}","${item.created_at}"`
        )
      ].join('\n');
      
      return new Blob([csvContent], { type: 'text/csv' });
    }, [state.training_data]),

    // Model Training
    startTrainingSession: useCallback(async (config, name) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const session: TrainingSession = {
          id: generateId(),
          name,
          status: 'running',
          config,
          start_time: new Date(),
          initial_metrics: state.performance_metrics,
          logs: [{
            timestamp: new Date(),
            level: 'info',
            message: 'Training session started',
            details: { config }
          }]
        };
        
        await mockApiCall(session);
        dispatch({ type: 'ADD_TRAINING_SESSION', payload: session });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to start training session' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, [state.performance_metrics]),

    stopTrainingSession: useCallback(async (id) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await mockApiCall(id);
        dispatch({
          type: 'UPDATE_TRAINING_SESSION',
          payload: { id, updates: { status: 'cancelled', end_time: new Date() } }
        });
        dispatch({ type: 'SET_ACTIVE_SESSION', payload: null });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to stop training session' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, []),

    getTrainingProgress: useCallback(async (id) => {
      const session = state.training_history.find(s => s.id === id) || state.active_session;
      if (!session) throw new Error('Session not found');
      
      // Mock progress data
      const progress: TrainingProgress = {
        current_iteration: Math.floor(Math.random() * 100),
        total_iterations: 100,
        current_accuracy: 0.75 + Math.random() * 0.2,
        best_accuracy: 0.85 + Math.random() * 0.1,
        estimated_time_remaining: Math.floor(Math.random() * 3600),
        status: session.status
      };
      
      return mockApiCall(progress);
    }, [state.training_history, state.active_session]),

    // Performance Monitoring
    refreshMetrics: useCallback(async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const metrics: ModelPerformanceMetrics = {
          accuracy: 0.85 + Math.random() * 0.1,
          precision: 0.82 + Math.random() * 0.15,
          recall: 0.78 + Math.random() * 0.18,
          f1_score: 0.80 + Math.random() * 0.15,
          response_time_avg: 150 + Math.random() * 100,
          confidence_avg: 0.75 + Math.random() * 0.2,
          total_interactions: Math.floor(1000 + Math.random() * 5000),
          successful_interactions: Math.floor(800 + Math.random() * 4000),
          last_updated: new Date(),
          trend_data: []
        };
        
        await mockApiCall(metrics);
        dispatch({ type: 'SET_PERFORMANCE_METRICS', payload: metrics });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh metrics' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, []),

    getPerformanceTrends: useCallback(async (timeRange) => {
      const trends: PerformanceTrend[] = [];
      const days = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i < days; i++) {
        const date = new Date(timeRange.start);
        date.setDate(date.getDate() + i);
        
        trends.push({
          date,
          accuracy: 0.75 + Math.random() * 0.2,
          response_time: 100 + Math.random() * 150,
          interaction_count: Math.floor(50 + Math.random() * 200),
          satisfaction_score: 3.5 + Math.random() * 1.5
        });
      }
      
      return mockApiCall(trends);
    }, []),

    generatePerformanceReport: useCallback(async (timeRange) => {
      const trends = await actions.getPerformanceTrends(timeRange);
      
      const report: PerformanceReport = {
        summary: state.performance_metrics,
        trends,
        insights: [
          'Response accuracy has improved by 12% over the selected period',
          'Average response time decreased by 8% indicating better optimization',
          'Customer satisfaction scores show consistent upward trend'
        ],
        recommendations: [
          'Consider expanding training data for product inquiry category',
          'Implement caching for frequently asked questions',
          'Review and optimize templates with low effectiveness scores'
        ],
        generated_at: new Date()
      };
      
      return mockApiCall(report);
    }, [state.performance_metrics])
  };

  // Initialize data on mount
  useEffect(() => {
    actions.refreshMetrics();
  }, []);

  return (
    <AITrainingContext.Provider value={{ state, actions }}>
      {children}
    </AITrainingContext.Provider>
  );
}

// Hook to use the context
export function useAITraining() {
  const context = useContext(AITrainingContext);
  if (!context) {
    throw new Error('useAITraining must be used within an AITrainingProvider');
  }
  return context;
}
