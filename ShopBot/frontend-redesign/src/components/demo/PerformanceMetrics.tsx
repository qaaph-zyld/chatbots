'use client';

import React, { useState, useEffect } from 'react';

// Performance data interface
interface PerformanceData {
  averageResponseTime: number;
  messageCount: number;
  userMessages: number;
  botMessages: number;
  timestamp: Date;
}

// Sample performance metrics
const SAMPLE_METRICS = {
  responseTime: [
    { time: '10:00', value: 850 },
    { time: '10:05', value: 750 },
    { time: '10:10', value: 900 },
    { time: '10:15', value: 600 },
    { time: '10:20', value: 500 },
  ],
  accuracy: [
    { time: '10:00', value: 92 },
    { time: '10:05', value: 94 },
    { time: '10:10', value: 91 },
    { time: '10:15', value: 96 },
    { time: '10:20', value: 98 },
  ],
  satisfaction: [
    { time: '10:00', value: 4.2 },
    { time: '10:05', value: 4.3 },
    { time: '10:10', value: 4.1 },
    { time: '10:15', value: 4.5 },
    { time: '10:20', value: 4.8 },
  ],
};

// Industry benchmarks
const INDUSTRY_BENCHMARKS = {
  responseTime: 1200, // ms
  accuracy: 85, // percentage
  satisfaction: 4.0, // out of 5
  resolutionRate: 78, // percentage
};

export interface PerformanceMetricsProps {
  data?: PerformanceData | null;
  className?: string;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ 
  data = null,
  className 
}) => {
  const [metrics, setMetrics] = useState(SAMPLE_METRICS);
  const [currentResponseTime, setCurrentResponseTime] = useState<number | null>(null);
  const [sessionData, setSessionData] = useState<PerformanceData[]>([]);

  // Update metrics when new data is received
  useEffect(() => {
    if (data) {
      setCurrentResponseTime(data.averageResponseTime);
      setSessionData(prev => [...prev, data]);
      
      // Update metrics with new data point
      const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      setMetrics(prev => ({
        ...prev,
        responseTime: [
          ...prev.responseTime.slice(-4),
          { time: newTime, value: data.averageResponseTime }
        ],
        // Simulate accuracy and satisfaction updates based on response time
        // Lower response time = higher accuracy and satisfaction (for demo purposes)
        accuracy: [
          ...prev.accuracy.slice(-4),
          { time: newTime, value: Math.min(100, 90 + (1000 - data.averageResponseTime) / 100) }
        ],
        satisfaction: [
          ...prev.satisfaction.slice(-4),
          { time: newTime, value: Math.min(5, 4 + (1000 - data.averageResponseTime) / 1000) }
        ],
      }));
    }
  }, [data]);

  // Calculate average response time from session data
  const averageResponseTime = sessionData.length > 0
    ? sessionData.reduce((sum, item) => sum + item.averageResponseTime, 0) / sessionData.length
    : null;

  // Calculate message counts
  const totalMessages = sessionData.reduce((sum, item) => sum + item.messageCount, 0);
  const userMessageCount = sessionData.reduce((sum, item) => sum + item.userMessages, 0);
  const botMessageCount = sessionData.reduce((sum, item) => sum + item.botMessages, 0);

  // Calculate resolution rate (simulated for demo)
  const resolutionRate = sessionData.length > 0 ? 92 : 0;

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Performance Dashboard</h2>
        <p className="text-gray-600">
          Real-time analytics and metrics for your ShopBot implementation.
        </p>
      </div>

      {/* Current session metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Response Time"
          value={averageResponseTime !== null ? `${averageResponseTime.toFixed(0)}ms` : 'N/A'}
          comparison={averageResponseTime !== null ? `${Math.round((INDUSTRY_BENCHMARKS.responseTime - averageResponseTime) / INDUSTRY_BENCHMARKS.responseTime * 100)}% faster than average` : ''}
          trend={averageResponseTime !== null && averageResponseTime < INDUSTRY_BENCHMARKS.responseTime ? 'positive' : 'negative'}
        />
        
        <MetricCard
          title="Accuracy Rate"
          value={sessionData.length > 0 ? '95%' : 'N/A'}
          comparison={sessionData.length > 0 ? `${95 - INDUSTRY_BENCHMARKS.accuracy}% above industry average` : ''}
          trend="positive"
        />
        
        <MetricCard
          title="Resolution Rate"
          value={resolutionRate > 0 ? `${resolutionRate}%` : 'N/A'}
          comparison={resolutionRate > 0 ? `${resolutionRate - INDUSTRY_BENCHMARKS.resolutionRate}% above average` : ''}
          trend="positive"
        />
        
        <MetricCard
          title="Customer Satisfaction"
          value={sessionData.length > 0 ? '4.7/5' : 'N/A'}
          comparison={sessionData.length > 0 ? `${((4.7 - INDUSTRY_BENCHMARKS.satisfaction) / INDUSTRY_BENCHMARKS.satisfaction * 100).toFixed(0)}% above average` : ''}
          trend="positive"
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-4">Response Time Trend (ms)</h3>
          <div className="h-64 flex items-end justify-between">
            {metrics.responseTime.map((point, index) => (
              <div key={index} className="flex flex-col items-center w-1/5">
                <div 
                  className="bg-blue-500 w-12 rounded-t"
                  style={{ 
                    height: `${Math.max(5, (point.value / 1200) * 200)}px`,
                    backgroundColor: point.value < INDUSTRY_BENCHMARKS.responseTime ? '#3B82F6' : '#EF4444'
                  }}
                ></div>
                <div className="text-xs mt-2">{point.time}</div>
                <div className="text-xs text-gray-500">{point.value}ms</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Lower is better</span>
            <span>Industry avg: {INDUSTRY_BENCHMARKS.responseTime}ms</span>
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-4">Accuracy Rate (%)</h3>
          <div className="h-64 flex items-end justify-between">
            {metrics.accuracy.map((point, index) => (
              <div key={index} className="flex flex-col items-center w-1/5">
                <div 
                  className="bg-green-500 w-12 rounded-t"
                  style={{ 
                    height: `${Math.max(5, (point.value / 100) * 200)}px`,
                    backgroundColor: point.value > INDUSTRY_BENCHMARKS.accuracy ? '#10B981' : '#EF4444'
                  }}
                ></div>
                <div className="text-xs mt-2">{point.time}</div>
                <div className="text-xs text-gray-500">{point.value.toFixed(0)}%</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Higher is better</span>
            <span>Industry avg: {INDUSTRY_BENCHMARKS.accuracy}%</span>
          </div>
        </div>
      </div>

      {/* Session statistics */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Current Session Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm text-gray-500">Total Messages</h4>
            <p className="text-2xl font-bold">{totalMessages || 'N/A'}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm text-gray-500">User Messages</h4>
            <p className="text-2xl font-bold">{userMessageCount || 'N/A'}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm text-gray-500">Bot Responses</h4>
            <p className="text-2xl font-bold">{botMessageCount || 'N/A'}</p>
          </div>
        </div>
        
        {currentResponseTime !== null && (
          <div className="mt-6">
            <h4 className="text-sm text-gray-500 mb-2">Latest Response Time</h4>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="h-2.5 rounded-full" 
                style={{ 
                  width: `${Math.min(100, (currentResponseTime / 2000) * 100)}%`,
                  backgroundColor: currentResponseTime < INDUSTRY_BENCHMARKS.responseTime ? '#3B82F6' : '#EF4444'
                }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>0ms</span>
              <span>{currentResponseTime}ms</span>
              <span>2000ms</span>
            </div>
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-500">
          {sessionData.length > 0 ? (
            <p>Session started at {sessionData[0].timestamp.toLocaleTimeString()}</p>
          ) : (
            <p>No active session data. Try interacting with the chatbot simulation.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Metric card component
interface MetricCardProps {
  title: string;
  value: string;
  comparison: string;
  trend: 'positive' | 'negative' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, comparison, trend }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
      {comparison && (
        <div className="flex items-center mt-2">
          {trend === 'positive' && (
            <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
            </svg>
          )}
          {trend === 'negative' && (
            <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1v-5a1 1 0 112 0v2.586l4.293-4.293a1 1 0 011.414 0L16 9.586V7a1 1 0 112 0v5a1 1 0 01-1 1h-5z" clipRule="evenodd"></path>
            </svg>
          )}
          <span className={`text-xs ${trend === 'positive' ? 'text-green-600' : trend === 'negative' ? 'text-red-600' : 'text-gray-500'}`}>
            {comparison}
          </span>
        </div>
      )}
    </div>
  );
};

export default PerformanceMetrics;
