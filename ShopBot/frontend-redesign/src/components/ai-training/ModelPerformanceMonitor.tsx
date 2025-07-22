/**
 * Model Performance Monitor Component
 * Real-time AI model performance tracking with accuracy metrics and training insights
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  Play,
  Square,
  BarChart3,
  LineChart,
  PieChart,
  Settings,
  Download,
  RefreshCw,
  Calendar,
  Users,
  MessageSquare,
  ThumbsUp,
  Brain,
  Gauge
} from 'lucide-react';
import { useAITraining } from '@/contexts/AITrainingContext';
import {
  ModelPerformanceMetrics,
  PerformanceTrend,
  TrainingSession,
  AITrainingConfig
} from '@/types/AITrainingTypes';

interface ModelPerformanceMonitorProps {
  className?: string;
}

export default function ModelPerformanceMonitor({ className = '' }: ModelPerformanceMonitorProps) {
  const { state, actions } = useAITraining();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [showTrainingConfig, setShowTrainingConfig] = useState(false);
  const [isStartingTraining, setIsStartingTraining] = useState(false);
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);

  // Training configuration state
  const [trainingConfig, setTrainingConfig] = useState<AITrainingConfig>({
    model_version: 'v2.1',
    training_mode: 'supervised',
    learning_rate: 0.001,
    batch_size: 32,
    max_iterations: 1000,
    validation_split: 0.2,
    early_stopping: true,
    performance_threshold: 0.85
  });

  // Load performance trends
  useEffect(() => {
    const loadTrends = async () => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedTimeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      try {
        const trends = await actions.getPerformanceTrends({
          start: startDate,
          end: endDate,
          granularity: selectedTimeRange === '24h' ? 'hour' : 'day'
        });
        setPerformanceTrends(trends);
      } catch (error) {
        console.error('Failed to load performance trends:', error);
      }
    };

    loadTrends();
  }, [selectedTimeRange, actions]);

  // Performance metrics calculations
  const performanceInsights = useMemo(() => {
    const { performance_metrics } = state;
    const trends = performanceTrends;

    if (trends.length < 2) {
      return {
        accuracyTrend: 'stable',
        responseTimeTrend: 'stable',
        satisfactionTrend: 'stable',
        improvementRate: 0
      };
    }

    const recent = trends.slice(-7);
    const previous = trends.slice(-14, -7);

    const recentAvgAccuracy = recent.reduce((sum, t) => sum + t.accuracy, 0) / recent.length;
    const previousAvgAccuracy = previous.length > 0 
      ? previous.reduce((sum, t) => sum + t.accuracy, 0) / previous.length 
      : recentAvgAccuracy;

    const recentAvgResponseTime = recent.reduce((sum, t) => sum + t.response_time, 0) / recent.length;
    const previousAvgResponseTime = previous.length > 0 
      ? previous.reduce((sum, t) => sum + t.response_time, 0) / previous.length 
      : recentAvgResponseTime;

    const recentAvgSatisfaction = recent.reduce((sum, t) => sum + t.satisfaction_score, 0) / recent.length;
    const previousAvgSatisfaction = previous.length > 0 
      ? previous.reduce((sum, t) => sum + t.satisfaction_score, 0) / previous.length 
      : recentAvgSatisfaction;

    return {
      accuracyTrend: recentAvgAccuracy > previousAvgAccuracy ? 'up' : 
                    recentAvgAccuracy < previousAvgAccuracy ? 'down' : 'stable',
      responseTimeTrend: recentAvgResponseTime < previousAvgResponseTime ? 'up' : 
                        recentAvgResponseTime > previousAvgResponseTime ? 'down' : 'stable',
      satisfactionTrend: recentAvgSatisfaction > previousAvgSatisfaction ? 'up' : 
                        recentAvgSatisfaction < previousAvgSatisfaction ? 'down' : 'stable',
      improvementRate: ((recentAvgAccuracy - previousAvgAccuracy) / previousAvgAccuracy) * 100
    };
  }, [state.performance_metrics, performanceTrends]);

  // Handle training session start
  const handleStartTraining = async () => {
    setIsStartingTraining(true);
    try {
      const sessionName = `Training Session ${new Date().toLocaleString()}`;
      await actions.startTrainingSession(trainingConfig, sessionName);
      setShowTrainingConfig(false);
    } catch (error) {
      console.error('Failed to start training session:', error);
    } finally {
      setIsStartingTraining(false);
    }
  };

  // Handle training session stop
  const handleStopTraining = async () => {
    if (state.active_session) {
      try {
        await actions.stopTrainingSession(state.active_session.id);
      } catch (error) {
        console.error('Failed to stop training session:', error);
      }
    }
  };

  // Performance score calculation
  const getPerformanceScore = (metrics: ModelPerformanceMetrics): number => {
    const weights = {
      accuracy: 0.3,
      precision: 0.2,
      recall: 0.2,
      f1_score: 0.2,
      response_time: 0.1 // Inverted - lower is better
    };

    const normalizedResponseTime = Math.max(0, (500 - metrics.response_time_avg) / 500);
    
    return (
      metrics.accuracy * weights.accuracy +
      metrics.precision * weights.precision +
      metrics.recall * weights.recall +
      metrics.f1_score * weights.f1_score +
      normalizedResponseTime * weights.response_time
    ) * 100;
  };

  const performanceScore = getPerformanceScore(state.performance_metrics);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Model Performance Monitor</h2>
          <p className="text-gray-600">Real-time AI model performance tracking and optimization</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => actions.refreshMetrics()}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={state.loading}
          >
            <RefreshCw className={`w-4 h-4 ${state.loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {state.active_session ? (
            <button
              onClick={handleStopTraining}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop Training
            </button>
          ) : (
            <button
              onClick={() => setShowTrainingConfig(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Training
            </button>
          )}
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Performance Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Gauge className="w-6 h-6" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{performanceScore.toFixed(1)}</div>
              <div className="text-blue-100 text-sm">Performance Score</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {performanceInsights.improvementRate > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-300" />
            ) : performanceInsights.improvementRate < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-300" />
            ) : (
              <Activity className="w-4 h-4 text-blue-300" />
            )}
            <span className="text-sm text-blue-100">
              {performanceInsights.improvementRate > 0 ? '+' : ''}
              {performanceInsights.improvementRate.toFixed(1)}% vs last period
            </span>
          </div>
        </motion.div>

        {/* Accuracy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {(state.performance_metrics.accuracy * 100).toFixed(1)}%
              </div>
              <div className="text-gray-600 text-sm">Accuracy</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {performanceInsights.accuracyTrend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : performanceInsights.accuracyTrend === 'down' ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : (
              <Activity className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm text-gray-600">
              {performanceInsights.accuracyTrend === 'up' ? 'Improving' : 
               performanceInsights.accuracyTrend === 'down' ? 'Declining' : 'Stable'}
            </span>
          </div>
        </motion.div>

        {/* Response Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {state.performance_metrics.response_time_avg.toFixed(0)}ms
              </div>
              <div className="text-gray-600 text-sm">Avg Response Time</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {performanceInsights.responseTimeTrend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : performanceInsights.responseTimeTrend === 'down' ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : (
              <Activity className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm text-gray-600">
              {performanceInsights.responseTimeTrend === 'up' ? 'Faster' : 
               performanceInsights.responseTimeTrend === 'down' ? 'Slower' : 'Stable'}
            </span>
          </div>
        </motion.div>

        {/* Total Interactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {state.performance_metrics.total_interactions.toLocaleString()}
              </div>
              <div className="text-gray-600 text-sm">Total Interactions</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">
              {((state.performance_metrics.successful_interactions / state.performance_metrics.total_interactions) * 100).toFixed(1)}% success rate
            </span>
          </div>
        </motion.div>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Precision</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${state.performance_metrics.precision * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-12">
                  {(state.performance_metrics.precision * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Recall</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${state.performance_metrics.recall * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-12">
                  {(state.performance_metrics.recall * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">F1 Score</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${state.performance_metrics.f1_score * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-12">
                  {(state.performance_metrics.f1_score * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Confidence</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${state.performance_metrics.confidence_avg * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-12">
                  {(state.performance_metrics.confidence_avg * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Training Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Status</h3>
          {state.active_session ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">Training Active</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Session:</span>
                  <span className="text-gray-900">{state.active_session.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Started:</span>
                  <span className="text-gray-900">
                    {new Date(state.active_session.start_time).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-700 capitalize">{state.active_session.status}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-gray-600">No Active Training</span>
              </div>
              <p className="text-sm text-gray-500">
                Start a new training session to improve model performance
              </p>
            </div>
          )}

          {/* Recent Training History */}
          {state.training_history.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Sessions</h4>
              <div className="space-y-2">
                {state.training_history.slice(-3).map(session => (
                  <div key={session.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 truncate">{session.name}</span>
                    <div className="flex items-center gap-2">
                      {session.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : session.status === 'failed' ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className={`capitalize ${
                        session.status === 'completed' ? 'text-green-700' :
                        session.status === 'failed' ? 'text-red-700' :
                        'text-yellow-700'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
          <div className="flex items-center gap-2">
            {(['24h', '7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedTimeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Simple trend visualization */}
        <div className="h-64 flex items-end justify-between gap-2 bg-gray-50 rounded-lg p-4">
          {performanceTrends.slice(-20).map((trend, index) => (
            <div
              key={index}
              className="flex-1 bg-blue-500 rounded-t opacity-70 hover:opacity-100 transition-opacity"
              style={{ 
                height: `${trend.accuracy * 100}%`,
                minHeight: '4px'
              }}
              title={`${new Date(trend.date).toLocaleDateString()}: ${(trend.accuracy * 100).toFixed(1)}% accuracy`}
            />
          ))}
        </div>
        
        {performanceTrends.length === 0 && (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <BarChart3 className="w-8 h-8 mx-auto mb-2" />
              <p>No trend data available</p>
              <p className="text-sm">Performance data will appear here over time</p>
            </div>
          </div>
        )}
      </div>

      {/* Training Configuration Modal */}
      <AnimatePresence>
        {showTrainingConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900">Training Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Training Mode
                  </label>
                  <select
                    value={trainingConfig.training_mode}
                    onChange={(e) => setTrainingConfig(prev => ({ 
                      ...prev, 
                      training_mode: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="supervised">Supervised Learning</option>
                    <option value="reinforcement">Reinforcement Learning</option>
                    <option value="hybrid">Hybrid Approach</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Learning Rate
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={trainingConfig.learning_rate}
                      onChange={(e) => setTrainingConfig(prev => ({ 
                        ...prev, 
                        learning_rate: parseFloat(e.target.value) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch Size
                    </label>
                    <input
                      type="number"
                      value={trainingConfig.batch_size}
                      onChange={(e) => setTrainingConfig(prev => ({ 
                        ...prev, 
                        batch_size: parseInt(e.target.value) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Iterations
                  </label>
                  <input
                    type="number"
                    value={trainingConfig.max_iterations}
                    onChange={(e) => setTrainingConfig(prev => ({ 
                      ...prev, 
                      max_iterations: parseInt(e.target.value) 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="early_stopping"
                    checked={trainingConfig.early_stopping}
                    onChange={(e) => setTrainingConfig(prev => ({ 
                      ...prev, 
                      early_stopping: e.target.checked 
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="early_stopping" className="ml-2 block text-sm text-gray-900">
                    Enable Early Stopping
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowTrainingConfig(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartTraining}
                  disabled={isStartingTraining}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isStartingTraining ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 inline mr-2" />
                      Start Training
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {state.loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
