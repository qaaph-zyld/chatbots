/**
 * Test script for Predictive Analytics
 * 
 * This script demonstrates the usage of the Predictive Analytics service
 * for creating prediction models, generating predictions, and analyzing user behavior.
 */

require('@src/analytics\predictive\predictive-analytics.service');

/**
 * Example data sources for predictions
 */

// User engagement data source
const userEngagementDataSource = {
  id: 'user-engagement',
  name: 'User Engagement Metrics',
  description: 'Metrics about user engagement with the chatbot',
  timeField: 'timestamp',
  schema: {
    userId: 'string',
    timestamp: 'datetime',
    sessionDuration: 'number',
    messageCount: 'number',
    completionRate: 'number',
    satisfactionScore: 'number'
  },
  fetchFunction: async (options = {}) => {
    // Simulate fetching user engagement data
    console.log(`[DEBUG] Fetching user engagement data with options:`, options);
    
    // Generate sample data
    const data = [];
    const now = new Date();
    const daysToGenerate = 90; // 3 months of data
    
    for (let i = 0; i < daysToGenerate; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate 5 data points per day
      for (let j = 0; j < 5; j++) {
        const timestamp = new Date(date);
        timestamp.setHours(9 + j * 3); // 9am, 12pm, 3pm, 6pm, 9pm
        
        // Add some weekly seasonality
        const dayOfWeek = timestamp.getDay();
        const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1.0;
        
        // Add some trend (gradually increasing engagement)
        const trendFactor = 1 + (daysToGenerate - i) / daysToGenerate * 0.2; // 0-20% increase over time
        
        data.push({
          userId: `user-${Math.floor(Math.random() * 100) + 1}`,
          timestamp: timestamp.toISOString(),
          sessionDuration: Math.floor((Math.random() * 15 + 5) * weekendFactor * trendFactor), // 5-20 minutes
          messageCount: Math.floor((Math.random() * 20 + 5) * weekendFactor * trendFactor), // 5-25 messages
          completionRate: Math.min(1.0, (Math.random() * 0.3 + 0.7) * weekendFactor * trendFactor), // 0.7-1.0
          satisfactionScore: Math.min(5, Math.floor((Math.random() * 2 + 3) * weekendFactor * trendFactor)) // 3-5 stars
        });
      }
    }
    
    // Sort by timestamp
    data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    return data;
  }
};

// System performance data source
const systemPerformanceDataSource = {
  id: 'system-performance',
  name: 'System Performance Metrics',
  description: 'Metrics about system performance and resource usage',
  timeField: 'timestamp',
  schema: {
    timestamp: 'datetime',
    cpuUsage: 'number',
    memoryUsage: 'number',
    responseTime: 'number',
    errorRate: 'number',
    requestCount: 'number'
  },
  fetchFunction: async (options = {}) => {
    // Simulate fetching system performance data
    console.log(`[DEBUG] Fetching system performance data with options:`, options);
    
    // Generate sample data
    const data = [];
    const now = new Date();
    const hoursToGenerate = 24 * 30; // 30 days of hourly data
    
    for (let i = 0; i < hoursToGenerate; i++) {
      const timestamp = new Date(now);
      timestamp.setHours(timestamp.getHours() - i);
      
      // Add some daily seasonality
      const hourOfDay = timestamp.getHours();
      const peakHourFactor = (hourOfDay >= 9 && hourOfDay <= 17) ? 1.3 : 1.0; // Higher load during business hours
      
      // Add some weekly seasonality
      const dayOfWeek = timestamp.getDay();
      const weekdayFactor = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 1.2 : 0.8; // Higher load on weekdays
      
      // Add some random spikes for anomalies (about 5% of the time)
      const anomalyFactor = Math.random() > 0.95 ? Math.random() * 2 + 2 : 1.0; // 2-4x normal values
      
      const requestCount = Math.floor((Math.random() * 100 + 50) * peakHourFactor * weekdayFactor);
      
      data.push({
        timestamp: timestamp.toISOString(),
        cpuUsage: Math.min(100, (Math.random() * 30 + 20) * peakHourFactor * weekdayFactor * anomalyFactor), // 20-50%
        memoryUsage: Math.min(100, (Math.random() * 40 + 30) * peakHourFactor * weekdayFactor), // 30-70%
        responseTime: Math.max(10, (Math.random() * 100 + 50) * peakHourFactor * weekdayFactor * anomalyFactor), // 50-150ms
        errorRate: Math.min(1.0, (Math.random() * 0.05) * anomalyFactor), // 0-5%
        requestCount: requestCount
      });
    }
    
    // Sort by timestamp
    data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    return data;
  }
};

// Conversation metrics data source
const conversationMetricsDataSource = {
  id: 'conversation-metrics',
  name: 'Conversation Metrics',
  description: 'Metrics about conversations with the chatbot',
  timeField: 'date',
  schema: {
    date: 'datetime',
    conversationCount: 'number',
    averageDuration: 'number',
    completionRate: 'number',
    topIntent: 'string',
    sentimentScore: 'number'
  },
  fetchFunction: async (options = {}) => {
    // Simulate fetching conversation metrics data
    console.log(`[DEBUG] Fetching conversation metrics data with options:`, options);
    
    // Generate sample data
    const data = [];
    const now = new Date();
    const daysToGenerate = 180; // 6 months of data
    
    const intents = ['support', 'inquiry', 'feedback', 'purchase', 'complaint'];
    
    for (let i = 0; i < daysToGenerate; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some weekly seasonality
      const dayOfWeek = date.getDay();
      const weekdayFactor = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 1.2 : 0.8; // Higher volume on weekdays
      
      // Add some monthly seasonality (higher at beginning of month)
      const dayOfMonth = date.getDate();
      const monthlyFactor = dayOfMonth <= 5 ? 1.3 : 1.0;
      
      // Add some trend (gradually increasing usage)
      const trendFactor = 1 + (daysToGenerate - i) / daysToGenerate * 0.5; // 0-50% increase over time
      
      const conversationCount = Math.floor((Math.random() * 50 + 100) * weekdayFactor * monthlyFactor * trendFactor);
      
      // Determine top intent (weighted random selection)
      const intentWeights = [0.4, 0.3, 0.15, 0.1, 0.05]; // support is most common
      let randomValue = Math.random();
      let cumulativeWeight = 0;
      let topIntentIndex = 0;
      
      for (let j = 0; j < intentWeights.length; j++) {
        cumulativeWeight += intentWeights[j];
        if (randomValue <= cumulativeWeight) {
          topIntentIndex = j;
          break;
        }
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        conversationCount: conversationCount,
        averageDuration: Math.floor(Math.random() * 10 + 5) * 60, // 5-15 minutes in seconds
        completionRate: Math.random() * 0.2 + 0.8, // 80-100%
        topIntent: intents[topIntentIndex],
        sentimentScore: Math.random() * 0.6 + 0.4 // 0.4-1.0 (higher is more positive)
      });
    }
    
    // Sort by date
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return data;
  }
};

/**
 * Run the test
 */
async function runTest() {
  console.log('=== Predictive Analytics Test ===\n');

  // Register data sources
  console.log('--- Registering Data Sources ---');
  
  const userEngagementSource = predictiveAnalyticsService.registerDataSource(userEngagementDataSource);
  const systemPerformanceSource = predictiveAnalyticsService.registerDataSource(systemPerformanceDataSource);
  const conversationMetricsSource = predictiveAnalyticsService.registerDataSource(conversationMetricsDataSource);
  
  console.log(`Registered ${[
    userEngagementSource, 
    systemPerformanceSource, 
    conversationMetricsSource
  ].filter(s => s.success).length} data sources`);
  console.log();

  // Create prediction models
  console.log('--- Creating Prediction Models ---');
  
  // User engagement prediction model
  console.log('Creating user engagement prediction model...');
  const userEngagementModel = predictiveAnalyticsService.createModel({
    name: 'User Engagement Predictor',
    description: 'Predicts future user engagement metrics',
    dataSourceId: 'user-engagement',
    targetField: 'sessionDuration',
    features: ['messageCount', 'completionRate', 'satisfactionScore'],
    modelType: 'timeSeries',
    algorithm: 'linearRegression',
    tags: ['engagement', 'user-behavior']
  });
  
  if (userEngagementModel.success) {
    console.log(`Created model: ${userEngagementModel.model.name} (${userEngagementModel.model.id})`);
  }
  
  // System performance prediction model
  console.log('Creating system performance prediction model...');
  const systemPerformanceModel = predictiveAnalyticsService.createModel({
    name: 'System Performance Predictor',
    description: 'Predicts future system performance metrics',
    dataSourceId: 'system-performance',
    targetField: 'cpuUsage',
    features: ['requestCount', 'memoryUsage', 'responseTime'],
    modelType: 'timeSeries',
    algorithm: 'randomForest',
    tags: ['performance', 'monitoring']
  });
  
  if (systemPerformanceModel.success) {
    console.log(`Created model: ${systemPerformanceModel.model.name} (${systemPerformanceModel.model.id})`);
  }
  
  // Conversation volume prediction model
  console.log('Creating conversation volume prediction model...');
  const conversationVolumeModel = predictiveAnalyticsService.createModel({
    name: 'Conversation Volume Predictor',
    description: 'Predicts future conversation volumes',
    dataSourceId: 'conversation-metrics',
    targetField: 'conversationCount',
    modelType: 'timeSeries',
    algorithm: 'neuralNetwork',
    tags: ['conversations', 'volume']
  });
  
  if (conversationVolumeModel.success) {
    console.log(`Created model: ${conversationVolumeModel.model.name} (${conversationVolumeModel.model.id})`);
  }
  console.log();

  // Train models
  console.log('--- Training Prediction Models ---');
  
  console.log('Training user engagement model...');
  const userEngagementTraining = await predictiveAnalyticsService.trainModel(userEngagementModel.model.id);
  if (userEngagementTraining.success) {
    console.log(`Trained model: ${userEngagementTraining.model.name}`);
    console.log(`Metrics: ${JSON.stringify(userEngagementTraining.metrics)}`);
    console.log(`Data points: ${userEngagementTraining.dataPoints}`);
  }
  console.log();
  
  console.log('Training system performance model...');
  const systemPerformanceTraining = await predictiveAnalyticsService.trainModel(systemPerformanceModel.model.id);
  if (systemPerformanceTraining.success) {
    console.log(`Trained model: ${systemPerformanceTraining.model.name}`);
    console.log(`Metrics: ${JSON.stringify(systemPerformanceTraining.metrics)}`);
    console.log(`Data points: ${systemPerformanceTraining.dataPoints}`);
  }
  console.log();
  
  console.log('Training conversation volume model...');
  const conversationVolumeTraining = await predictiveAnalyticsService.trainModel(conversationVolumeModel.model.id);
  if (conversationVolumeTraining.success) {
    console.log(`Trained model: ${conversationVolumeTraining.model.name}`);
    console.log(`Metrics: ${JSON.stringify(conversationVolumeTraining.metrics)}`);
    console.log(`Data points: ${conversationVolumeTraining.dataPoints}`);
  }
  console.log();

  // Generate predictions
  console.log('--- Generating Predictions ---');
  
  console.log('Generating user engagement predictions...');
  const userEngagementPredictions = await predictiveAnalyticsService.generatePredictions(
    userEngagementModel.model.id,
    { horizon: 14 } // 14 days
  );
  
  if (userEngagementPredictions.success) {
    console.log(`Generated predictions: ${userEngagementPredictions.prediction.id}`);
    console.log(`Prediction count: ${userEngagementPredictions.prediction.predictions.length}`);
    console.log('Sample predictions:');
    
    // Display first 3 predictions
    for (let i = 0; i < 3 && i < userEngagementPredictions.prediction.predictions.length; i++) {
      const pred = userEngagementPredictions.prediction.predictions[i];
      console.log(`- ${pred.timestamp}: ${pred.sessionDuration.toFixed(2)} minutes (confidence: ${pred.confidence.toFixed(2)})`);
    }
  }
  console.log();
  
  console.log('Generating system performance predictions...');
  const systemPerformancePredictions = await predictiveAnalyticsService.generatePredictions(
    systemPerformanceModel.model.id,
    { horizon: 24 } // 24 hours
  );
  
  if (systemPerformancePredictions.success) {
    console.log(`Generated predictions: ${systemPerformancePredictions.prediction.id}`);
    console.log(`Prediction count: ${systemPerformancePredictions.prediction.predictions.length}`);
    console.log('Sample predictions:');
    
    // Display first 3 predictions
    for (let i = 0; i < 3 && i < systemPerformancePredictions.prediction.predictions.length; i++) {
      const pred = systemPerformancePredictions.prediction.predictions[i];
      console.log(`- ${pred.timestamp}: ${pred.cpuUsage.toFixed(2)}% CPU usage (confidence: ${pred.confidence.toFixed(2)})`);
    }
  }
  console.log();
  
  console.log('Generating conversation volume predictions...');
  const conversationVolumePredictions = await predictiveAnalyticsService.generatePredictions(
    conversationVolumeModel.model.id,
    { horizon: 30 } // 30 days
  );
  
  if (conversationVolumePredictions.success) {
    console.log(`Generated predictions: ${conversationVolumePredictions.prediction.id}`);
    console.log(`Prediction count: ${conversationVolumePredictions.prediction.predictions.length}`);
    console.log('Sample predictions:');
    
    // Display first 3 predictions
    for (let i = 0; i < 3 && i < conversationVolumePredictions.prediction.predictions.length; i++) {
      const pred = conversationVolumePredictions.prediction.predictions[i];
      console.log(`- ${pred.timestamp}: ${Math.round(pred.conversationCount)} conversations (confidence: ${pred.confidence.toFixed(2)})`);
    }
  }
  console.log();

  // List models and predictions
  console.log('--- Listing Models and Predictions ---');
  
  const models = predictiveAnalyticsService.getModels();
  if (models.success) {
    console.log(`Available models: ${models.models.length}`);
    for (const model of models.models) {
      console.log(`- ${model.name} (${model.id}): ${model.status}`);
      console.log(`  Algorithm: ${model.algorithm}, Target: ${model.targetField}`);
      console.log(`  Last trained: ${model.lastTrainedAt || 'Never'}`);
      console.log();
    }
  }
  
  const predictions = predictiveAnalyticsService.getPredictions();
  if (predictions.success) {
    console.log(`Available predictions: ${predictions.predictions.length}`);
    for (const prediction of predictions.predictions) {
      console.log(`- ${prediction.modelName} (${prediction.id})`);
      console.log(`  Created: ${prediction.createdAt}`);
      console.log(`  Predictions: ${prediction.count}`);
      console.log();
    }
  }

  // Generate user behavior insights
  console.log('--- Generating User Behavior Insights ---');
  
  const userId = 'user-42';
  console.log(`Generating insights for user: ${userId}`);
  
  const userInsights = await predictiveAnalyticsService.generateUserBehaviorInsights(userId);
  if (userInsights.success) {
    console.log('User behavior insights:');
    console.log(`- Session patterns: ${userInsights.insights.sessionPatterns.averageSessionDuration} minutes average duration`);
    console.log(`- Preferred days: ${userInsights.insights.sessionPatterns.preferredDays.join(', ')}`);
    console.log(`- Engagement: ${(userInsights.insights.engagementMetrics.responseRate * 100).toFixed(1)}% response rate`);
    console.log(`- Content preferences: ${userInsights.insights.contentPreferences.preferredTopics.join(', ')}`);
    console.log(`- Churn risk: ${userInsights.insights.predictedBehavior.churnRisk}`);
    console.log(`- Next session: ${new Date(userInsights.insights.predictedBehavior.nextSessionPrediction).toLocaleString()}`);
    console.log(`- Recommended actions: ${userInsights.insights.recommendedActions.length}`);
    for (const action of userInsights.insights.recommendedActions) {
      console.log(`  * ${action.type}: ${action.action} (${action.priority} priority)`);
    }
  }
  console.log();

  // Detect anomalies
  console.log('--- Detecting Anomalies ---');
  
  console.log('Detecting CPU usage anomalies...');
  const anomalyDetection = await predictiveAnalyticsService.detectAnomalies({
    dataSourceId: 'system-performance',
    metric: 'cpuUsage',
    sensitivity: 2.5
  });
  
  if (anomalyDetection.success) {
    console.log(`Detected ${anomalyDetection.anomalies.length} anomalies out of ${anomalyDetection.summary.dataPoints} data points`);
    console.log(`Anomaly rate: ${anomalyDetection.summary.anomalyRate.toFixed(4) * 100}%`);
    
    if (anomalyDetection.anomalies.length > 0) {
      console.log('Sample anomalies:');
      
      // Display first 3 anomalies
      for (let i = 0; i < 3 && i < anomalyDetection.anomalies.length; i++) {
        const anomaly = anomalyDetection.anomalies[i];
        console.log(`- ${anomaly.timestamp}: ${anomaly.value.toFixed(2)}% CPU usage (expected: ${anomaly.expected.toFixed(2)}%, severity: ${anomaly.severity})`);
      }
    }
  }
  console.log();
  
  console.log('=== Test Complete ===');
  console.log('The Predictive Analytics service is ready for use in the chatbot platform.');
  console.log();
  console.log('Key features demonstrated:');
  console.log('1. Creating prediction models for different metrics');
  console.log('2. Training models with historical data');
  console.log('3. Generating predictions for future time periods');
  console.log('4. Analyzing user behavior patterns and preferences');
  console.log('5. Detecting anomalies in time series data');
  console.log('6. Managing prediction models and results');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
});
