/**
 * Test script for Report Builder
 * 
 * This script demonstrates the usage of the Report Builder service
 * for creating customized analytics reports from various data sources.
 */

const { reportBuilderService } = require('./report-builder.service');

// No need to mock the logger as we're using test-utils

/**
 * Example data sources for reports
 */

// Conversation data source
const conversationDataSource = {
  id: 'conversations',
  name: 'Conversation Data',
  description: 'Data about user conversations with the chatbot',
  schema: {
    id: 'string',
    userId: 'string',
    botId: 'string',
    startTime: 'datetime',
    endTime: 'datetime',
    duration: 'number',
    messageCount: 'number',
    userMessageCount: 'number',
    botMessageCount: 'number',
    intent: 'string',
    sentiment: 'string',
    completed: 'boolean'
  },
  defaultFilters: {
    startDate: '2025-01-01',
    endDate: '2025-05-26'
  },
  fetchFunction: async (filters) => {
    // Simulate fetching conversation data
    console.log(`[DEBUG] Fetching conversation data with filters:`, filters);
    
    // Generate sample data
    const conversations = [];
    const startDate = new Date(filters.startDate || '2025-01-01');
    const endDate = new Date(filters.endDate || '2025-05-26');
    const dayRange = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < 50; i++) {
      const randomDay = Math.floor(Math.random() * dayRange);
      const conversationDate = new Date(startDate);
      conversationDate.setDate(conversationDate.getDate() + randomDay);
      
      const startTime = new Date(conversationDate);
      startTime.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
      
      const duration = Math.floor(Math.random() * 20) + 1; // 1-20 minutes
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);
      
      const messageCount = Math.floor(Math.random() * 30) + 2; // 2-30 messages
      const userMessageCount = Math.floor(messageCount / 2);
      const botMessageCount = messageCount - userMessageCount;
      
      const intents = ['inquiry', 'support', 'feedback', 'purchase', 'complaint'];
      const sentiments = ['positive', 'neutral', 'negative'];
      
      conversations.push({
        id: `conv-${i + 1}`,
        userId: `user-${Math.floor(Math.random() * 20) + 1}`,
        botId: `bot-${Math.floor(Math.random() * 3) + 1}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        messageCount,
        userMessageCount,
        botMessageCount,
        intent: intents[Math.floor(Math.random() * intents.length)],
        sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
        completed: Math.random() > 0.2 // 80% completion rate
      });
    }
    
    // Apply specific filters if provided
    let filteredConversations = [...conversations];
    
    if (filters.userId) {
      filteredConversations = filteredConversations.filter(c => c.userId === filters.userId);
    }
    
    if (filters.botId) {
      filteredConversations = filteredConversations.filter(c => c.botId === filters.botId);
    }
    
    if (filters.intent) {
      filteredConversations = filteredConversations.filter(c => c.intent === filters.intent);
    }
    
    if (filters.minDuration) {
      filteredConversations = filteredConversations.filter(c => c.duration >= filters.minDuration);
    }
    
    return filteredConversations;
  }
};

// User engagement data source
const userEngagementDataSource = {
  id: 'user-engagement',
  name: 'User Engagement Metrics',
  description: 'Metrics about user engagement with the chatbot',
  schema: {
    userId: 'string',
    sessionCount: 'number',
    totalDuration: 'number',
    averageDuration: 'number',
    messageCount: 'number',
    lastActive: 'datetime',
    satisfactionScore: 'number',
    retentionRate: 'number'
  },
  defaultFilters: {},
  fetchFunction: async (filters) => {
    // Simulate fetching user engagement data
    console.log(`[DEBUG] Fetching user engagement data with filters:`, filters);
    
    // Generate sample data
    const userEngagement = [];
    
    for (let i = 0; i < 20; i++) {
      const userId = `user-${i + 1}`;
      const sessionCount = Math.floor(Math.random() * 50) + 1;
      const totalDuration = sessionCount * (Math.floor(Math.random() * 15) + 5);
      
      userEngagement.push({
        userId,
        sessionCount,
        totalDuration,
        averageDuration: totalDuration / sessionCount,
        messageCount: sessionCount * (Math.floor(Math.random() * 10) + 2),
        lastActive: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        satisfactionScore: Math.floor(Math.random() * 5) + 1, // 1-5 rating
        retentionRate: Math.random() * 100 // 0-100%
      });
    }
    
    return userEngagement;
  }
};

// System performance data source
const systemPerformanceDataSource = {
  id: 'system-performance',
  name: 'System Performance Metrics',
  description: 'Metrics about system performance and resource usage',
  schema: {
    timestamp: 'datetime',
    cpuUsage: 'number',
    memoryUsage: 'number',
    responseTime: 'number',
    requestCount: 'number',
    errorCount: 'number',
    successRate: 'number'
  },
  defaultFilters: {
    period: 'daily'
  },
  fetchFunction: async (filters) => {
    // Simulate fetching system performance data
    console.log(`[DEBUG] Fetching system performance data with filters:`, filters);
    
    // Generate sample data
    const systemPerformance = [];
    const periods = {
      hourly: 24,
      daily: 30,
      weekly: 12,
      monthly: 6
    };
    
    const periodCount = periods[filters.period] || 30;
    const now = new Date();
    
    for (let i = 0; i < periodCount; i++) {
      const timestamp = new Date(now);
      
      switch (filters.period) {
        case 'hourly':
          timestamp.setHours(now.getHours() - i);
          break;
        case 'daily':
          timestamp.setDate(now.getDate() - i);
          break;
        case 'weekly':
          timestamp.setDate(now.getDate() - (i * 7));
          break;
        case 'monthly':
          timestamp.setMonth(now.getMonth() - i);
          break;
      }
      
      const requestCount = Math.floor(Math.random() * 1000) + 100;
      const errorCount = Math.floor(requestCount * (Math.random() * 0.1)); // 0-10% error rate
      
      systemPerformance.push({
        timestamp: timestamp.toISOString(),
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        responseTime: Math.random() * 500, // 0-500ms
        requestCount,
        errorCount,
        successRate: ((requestCount - errorCount) / requestCount) * 100
      });
    }
    
    return systemPerformance;
  }
};

/**
 * Run the test
 */
async function runTest() {
  console.log('=== Report Builder Test ===\n');

  // Register data sources
  console.log('--- Registering Data Sources ---');
  
  const conversationSource = reportBuilderService.registerDataSource(conversationDataSource);
  const userEngagementSource = reportBuilderService.registerDataSource(userEngagementDataSource);
  const systemPerformanceSource = reportBuilderService.registerDataSource(systemPerformanceDataSource);
  
  console.log(`Registered ${[
    conversationSource, 
    userEngagementSource, 
    systemPerformanceSource
  ].filter(s => s.success).length} data sources`);
  console.log();

  // Create report templates
  console.log('--- Creating Report Templates ---');
  
  // Conversation analytics report template
  const conversationReportTemplate = reportBuilderService.createTemplate({
    name: 'Conversation Analytics Report',
    description: 'Comprehensive report on conversation metrics and patterns',
    sections: [
      {
        title: 'Conversation Overview',
        description: 'Summary of conversation metrics',
        dataSourceId: 'conversations',
        transformations: [
          {
            type: 'group',
            field: 'intent',
            aggregations: [
              { name: 'count', type: 'count' },
              { name: 'avgDuration', type: 'avg', field: 'duration' },
              { name: 'avgMessageCount', type: 'avg', field: 'messageCount' }
            ]
          },
          {
            type: 'sort',
            field: 'count',
            direction: 'desc'
          }
        ]
      },
      {
        title: 'Conversation Details',
        description: 'Detailed list of conversations',
        dataSourceId: 'conversations',
        transformations: [
          {
            type: 'sort',
            field: 'startTime',
            direction: 'desc'
          },
          {
            type: 'limit',
            count: 10
          }
        ]
      }
    ],
    parameters: [
      {
        name: 'startDate',
        type: 'date',
        required: true,
        description: 'Start date for the report'
      },
      {
        name: 'endDate',
        type: 'date',
        required: true,
        description: 'End date for the report'
      },
      {
        name: 'botId',
        type: 'string',
        required: false,
        description: 'Filter by specific bot ID'
      }
    ],
    defaultParameters: {
      startDate: '2025-04-01',
      endDate: '2025-05-26'
    },
    tags: ['conversations', 'analytics', 'metrics']
  });
  
  // User engagement report template
  const userEngagementReportTemplate = reportBuilderService.createTemplate({
    name: 'User Engagement Report',
    description: 'Analysis of user engagement metrics',
    sections: [
      {
        title: 'User Engagement Summary',
        description: 'Summary of user engagement metrics',
        dataSourceId: 'user-engagement',
        transformations: [
          {
            type: 'sort',
            field: 'sessionCount',
            direction: 'desc'
          },
          {
            type: 'limit',
            count: 5
          }
        ]
      },
      {
        title: 'User Satisfaction',
        description: 'User satisfaction scores',
        dataSourceId: 'user-engagement',
        transformations: [
          {
            type: 'sort',
            field: 'satisfactionScore',
            direction: 'desc'
          }
        ]
      }
    ],
    parameters: [],
    tags: ['users', 'engagement', 'satisfaction']
  });
  
  // System performance report template
  const systemPerformanceReportTemplate = reportBuilderService.createTemplate({
    name: 'System Performance Report',
    description: 'Analysis of system performance metrics',
    sections: [
      {
        title: 'Performance Overview',
        description: 'Overview of system performance',
        dataSourceId: 'system-performance'
      }
    ],
    parameters: [
      {
        name: 'period',
        type: 'string',
        required: true,
        description: 'Time period for the report (hourly, daily, weekly, monthly)'
      }
    ],
    defaultParameters: {
      period: 'daily'
    },
    tags: ['system', 'performance', 'monitoring']
  });
  
  console.log(`Created ${[
    conversationReportTemplate, 
    userEngagementReportTemplate, 
    systemPerformanceReportTemplate
  ].filter(t => t.success).length} report templates`);
  console.log();

  // Generate reports
  console.log('--- Generating Reports ---');
  
  // Generate conversation report
  console.log('Generating conversation report...');
  const conversationReport = await reportBuilderService.generateReport(
    conversationReportTemplate.template.id,
    {
      startDate: '2025-04-01',
      endDate: '2025-05-26',
      botId: 'bot-1'
    }
  );
  
  if (conversationReport.success) {
    console.log('Conversation report generated successfully');
    console.log(`- Report ID: ${conversationReport.report.id}`);
    console.log(`- Sections: ${conversationReport.report.sections.length}`);
    
    // Display section metadata
    for (const section of conversationReport.report.sections) {
      console.log(`  - ${section.title}: ${section.metadata ? section.metadata.count + ' items' : 'Error: ' + section.error}`);
    }
  }
  console.log();
  
  // Generate user engagement report
  console.log('Generating user engagement report...');
  const userEngagementReport = await reportBuilderService.generateReport(
    userEngagementReportTemplate.template.id
  );
  
  if (userEngagementReport.success) {
    console.log('User engagement report generated successfully');
    console.log(`- Report ID: ${userEngagementReport.report.id}`);
    console.log(`- Sections: ${userEngagementReport.report.sections.length}`);
  }
  console.log();
  
  // Generate system performance report
  console.log('Generating system performance report...');
  const systemPerformanceReport = await reportBuilderService.generateReport(
    systemPerformanceReportTemplate.template.id,
    {
      period: 'weekly'
    }
  );
  
  if (systemPerformanceReport.success) {
    console.log('System performance report generated successfully');
    console.log(`- Report ID: ${systemPerformanceReport.report.id}`);
    console.log(`- Sections: ${systemPerformanceReport.report.sections.length}`);
  }
  console.log();

  // Export reports
  console.log('--- Exporting Reports ---');
  
  // Export conversation report as HTML
  console.log('Exporting conversation report as HTML...');
  const htmlExport = await reportBuilderService.exportReport(
    conversationReport.report.id,
    'html'
  );
  
  if (htmlExport.success) {
    console.log('Report exported successfully as HTML');
    console.log(`- HTML length: ${htmlExport.data.length} characters`);
    
    // Display a preview of the HTML
    const previewLength = 200;
    console.log(`- Preview: ${htmlExport.data.substring(0, previewLength)}...`);
  }
  console.log();
  
  // Export user engagement report as CSV
  console.log('Exporting user engagement report as CSV...');
  const csvExport = await reportBuilderService.exportReport(
    userEngagementReport.report.id,
    'csv'
  );
  
  if (csvExport.success) {
    console.log('Report exported successfully as CSV');
    console.log(`- CSV length: ${csvExport.data.length} characters`);
    
    // Display a preview of the CSV
    const lines = csvExport.data.split('\n');
    const previewLines = lines.slice(0, 5);
    console.log('- Preview:');
    for (const line of previewLines) {
      console.log(`  ${line}`);
    }
    if (lines.length > 5) {
      console.log(`  ... (${lines.length - 5} more lines)`);
    }
  }
  console.log();
  
  // Export system performance report as JSON
  console.log('Exporting system performance report as JSON...');
  const jsonExport = await reportBuilderService.exportReport(
    systemPerformanceReport.report.id,
    'json'
  );
  
  if (jsonExport.success) {
    console.log('Report exported successfully as JSON');
    console.log(`- JSON length: ${jsonExport.data.length} characters`);
  }
  console.log();
  
  // List available data sources, templates, and reports
  console.log('--- Listing Available Resources ---');
  
  const dataSources = reportBuilderService.getDataSources();
  console.log(`Available data sources: ${dataSources.length}`);
  for (const source of dataSources) {
    console.log(`- ${source.name} (${source.id}): ${source.description}`);
  }
  console.log();
  
  const templates = reportBuilderService.getTemplates();
  console.log(`Available templates: ${templates.length}`);
  for (const template of templates) {
    console.log(`- ${template.name}: ${template.description}`);
  }
  console.log();
  
  const reports = reportBuilderService.getReports();
  console.log(`Generated reports: ${reports.length}`);
  for (const report of reports) {
    console.log(`- ${report.name} (${report.id}): ${report.status}`);
  }
  console.log();
  
  console.log('=== Test Complete ===');
  console.log('The Report Builder service is ready for use in the chatbot platform.');
  console.log();
  console.log('Key features demonstrated:');
  console.log('1. Registering data sources for reports');
  console.log('2. Creating report templates with sections and parameters');
  console.log('3. Generating reports from templates with custom parameters');
  console.log('4. Applying transformations to report data (filtering, sorting, grouping)');
  console.log('5. Exporting reports in various formats (JSON, CSV, HTML)');
  console.log('6. Managing report resources (listing, retrieving)');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
});
