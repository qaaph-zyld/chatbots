/**
 * Test script for Performance Optimizer Service
 * 
 * This script demonstrates the functionality of the Performance Optimizer Service
 * including data source registration, performance analysis, and recommendation generation.
 */

// Import the performance optimizer service
require('@src/analytics\optimization\performance-optimizer.service');
require('@src/utils\mock-utils');

/**
 * Generate mock system metrics
 * @returns {Array} - Array of system metrics
 */
function generateMockSystemMetrics() {
  const metrics = [];
  const now = Date.now();
  
  // Generate 24 hours of hourly metrics
  for (let i = 0; i < 24; i++) {
    const timestamp = now - (23 - i) * 3600000; // Go back 23 hours and move forward
    
    // Generate realistic-looking metrics with some variation
    const baselineLoad = 30 + Math.sin(i / 4) * 15; // Simulate daily load patterns
    const randomVariation = Math.random() * 10;
    
    metrics.push({
      timestamp: new Date(timestamp).toISOString(),
      cpuUsage: baselineLoad + randomVariation,
      memoryUsage: 40 + baselineLoad / 2 + randomVariation,
      diskUsage: 65 + Math.random() * 5,
      networkIn: 15000000 + Math.random() * 5000000,
      networkOut: 8000000 + Math.random() * 3000000,
      concurrentUsers: 50 + Math.floor(baselineLoad) + Math.floor(Math.random() * 20)
    });
  }
  
  return metrics;
}

/**
 * Generate mock API metrics
 * @returns {Array} - Array of API metrics
 */
function generateMockApiMetrics() {
  const metrics = [];
  const now = Date.now();
  
  // Generate 24 hours of hourly metrics
  for (let i = 0; i < 24; i++) {
    const timestamp = now - (23 - i) * 3600000;
    
    // Generate realistic-looking metrics with some variation
    const baselineLoad = 30 + Math.sin(i / 4) * 15;
    const randomVariation = Math.random() * 10;
    
    metrics.push({
      timestamp: new Date(timestamp).toISOString(),
      requestCount: 1000 + baselineLoad * 20 + Math.random() * 500,
      responseTime: 200 + baselineLoad * 3 + randomVariation * 5,
      errorCount: 10 + Math.random() * 20,
      errorRate: 0.01 + Math.random() * 0.04,
      successRate: 0.96 - Math.random() * 0.04
    });
  }
  
  return metrics;
}

/**
 * Generate mock database metrics
 * @returns {Array} - Array of database metrics
 */
function generateMockDatabaseMetrics() {
  const metrics = [];
  const now = Date.now();
  
  // Generate 24 hours of hourly metrics
  for (let i = 0; i < 24; i++) {
    const timestamp = now - (23 - i) * 3600000;
    
    metrics.push({
      timestamp: new Date(timestamp).toISOString(),
      queryCount: 5000 + Math.random() * 2000,
      queryTime: 50 + Math.random() * 100,
      connectionCount: 20 + Math.random() * 10,
      cacheHitRate: 0.7 + Math.random() * 0.2,
      indexUsage: 0.8 + Math.random() * 0.15
    });
  }
  
  return metrics;
}

/**
 * Run the test
 */
async function runTest() {
  logger.info('=== Performance Optimizer Test ===');
  
  // Register data sources
  logger.info('--- Registering Data Sources ---');
  
  const systemDataSource = {
    id: 'system',
    name: 'System Metrics',
    description: 'CPU, memory, disk, and network metrics',
    type: 'time-series',
    fetchFunction: async () => generateMockSystemMetrics()
  };
  
  const apiDataSource = {
    id: 'api',
    name: 'API Metrics',
    description: 'API request/response metrics',
    type: 'time-series',
    fetchFunction: async () => generateMockApiMetrics()
  };
  
  const databaseDataSource = {
    id: 'database',
    name: 'Database Metrics',
    description: 'Database performance metrics',
    type: 'time-series',
    fetchFunction: async () => generateMockDatabaseMetrics()
  };
  
  const systemResult = performanceOptimizerService.registerDataSource(systemDataSource);
  logger.info(`Registered system data source: ${systemResult.success ? 'Success' : 'Failed'}`);
  
  const apiResult = performanceOptimizerService.registerDataSource(apiDataSource);
  logger.info(`Registered API data source: ${apiResult.success ? 'Success' : 'Failed'}`);
  
  const dbResult = performanceOptimizerService.registerDataSource(databaseDataSource);
  logger.info(`Registered database data source: ${dbResult.success ? 'Success' : 'Failed'}`);
  
  // List data sources
  const dataSources = performanceOptimizerService.listDataSources();
  logger.info(`Registered ${dataSources.length} data sources:`);
  dataSources.forEach(source => {
    logger.info(`- ${source.name} (${source.id}): ${source.description}`);
  });
  
  // Analyze performance
  logger.info('\n--- Analyzing Performance ---');
  const analysisResult = await performanceOptimizerService.analyzePerformance({ forceAnalysis: true });
  
  if (!analysisResult.success) {
    logger.error(`Analysis failed: ${analysisResult.error}`);
    return;
  }
  
  logger.info(`Analysis completed with ID: ${analysisResult.analysisId}`);
  logger.info(`Generated ${analysisResult.recommendations.length} recommendations`);
  
  // Display metrics
  logger.info('\n--- Performance Metrics ---');
  const metrics = analysisResult.metrics;
  
  logger.info('CPU Usage:');
  logger.info(`- Average: ${metrics.cpu.average.toFixed(1)}%`);
  logger.info(`- Peak (95th percentile): ${metrics.cpu.peak.toFixed(1)}%`);
  logger.info(`- Threshold: ${metrics.cpu.threshold}%`);
  
  logger.info('Memory Usage:');
  logger.info(`- Average: ${metrics.memory.average.toFixed(1)}%`);
  logger.info(`- Peak (95th percentile): ${metrics.memory.peak.toFixed(1)}%`);
  logger.info(`- Threshold: ${metrics.memory.threshold}%`);
  
  logger.info('Response Time:');
  logger.info(`- Average: ${metrics.responseTime.average.toFixed(1)}ms`);
  logger.info(`- 95th percentile: ${metrics.responseTime.p95.toFixed(1)}ms`);
  logger.info(`- Threshold: ${metrics.responseTime.threshold}ms`);
  
  logger.info('Error Rate:');
  logger.info(`- Average: ${(metrics.errorRate.average * 100).toFixed(2)}%`);
  logger.info(`- Peak: ${(metrics.errorRate.peak * 100).toFixed(2)}%`);
  logger.info(`- Threshold: ${(metrics.errorRate.threshold * 100).toFixed(2)}%`);
  
  // Display bottlenecks
  logger.info('\n--- Identified Bottlenecks ---');
  if (analysisResult.bottlenecks.length === 0) {
    logger.info('No bottlenecks identified.');
  } else {
    analysisResult.bottlenecks.forEach((bottleneck, index) => {
      logger.info(`${index + 1}. ${bottleneck.description} (${bottleneck.severity} severity)`);
      logger.info(`   Current: ${bottleneck.metric.toFixed(1)}, Threshold: ${bottleneck.threshold}`);
    });
  }
  
  // Display recommendations
  logger.info('\n--- Optimization Recommendations ---');
  analysisResult.recommendations.forEach((recommendation, index) => {
    logger.info(`${index + 1}. ${recommendation.title} (${recommendation.severity} severity)`);
    logger.info(`   ${recommendation.description}`);
    logger.info(`   Category: ${recommendation.category}`);
    
    logger.info('   Recommended Actions:');
    recommendation.actions.forEach(action => {
      logger.info(`   - ${action.title}: ${action.description}`);
    });
    
    logger.info('   Estimated Impact:');
    Object.entries(recommendation.estimatedImpact).forEach(([key, value]) => {
      logger.info(`   - ${key}: ${value}`);
    });
    
    logger.info('');
  });
  
  // Apply a recommendation
  if (analysisResult.recommendations.length > 0) {
    logger.info('\n--- Applying Recommendation ---');
    const recommendationToApply = analysisResult.recommendations[0];
    logger.info(`Applying recommendation: ${recommendationToApply.title}`);
    
    const applicationResult = await performanceOptimizerService.applyRecommendation(recommendationToApply.id);
    
    if (applicationResult.success) {
      logger.info(`Successfully applied recommendation with ID: ${applicationResult.applicationId}`);
      logger.info(`Result: ${applicationResult.result.message}`);
    } else {
      logger.error(`Failed to apply recommendation: ${applicationResult.error}`);
    }
  }
  
  // Get optimization history
  logger.info('\n--- Optimization History ---');
  const historyResult = performanceOptimizerService.getOptimizationHistory();
  
  if (historyResult.success) {
    logger.info(`Found ${historyResult.history.length} optimization history entries`);
    historyResult.history.forEach((item, index) => {
      logger.info(`${index + 1}. ${item.title} (${item.timestamp})`);
      logger.info(`   Status: ${item.status}, Category: ${item.category}`);
    });
  } else {
    logger.error(`Failed to get optimization history: ${historyResult.error}`);
  }
  
  logger.info('\n=== Test Complete ===');
  logger.info('The Performance Optimizer service is ready for use in the chatbot platform.');
  logger.info('Key features demonstrated:');
  logger.info('1. Registering and managing performance data sources');
  logger.info('2. Analyzing system performance metrics');
  logger.info('3. Identifying performance bottlenecks');
  logger.info('4. Generating actionable optimization recommendations');
  logger.info('5. Applying recommendations and tracking optimization history');
}

// Run the test
runTest().catch(error => {
  logger.error('Test failed with error:', error);
});
