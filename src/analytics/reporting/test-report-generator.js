/**
 * Test script for Report Generator
 * 
 * This script demonstrates the usage of the Report Generator service
 * for creating, scheduling, and distributing custom reports.
 */

const { reportGeneratorService } = require('./report-generator.service');
const { reportBuilderService } = require('./report-builder.service');

// No need to mock the logger as we're using test-utils

/**
 * Example data sources for reports (same as in test-report-builder.js)
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
  console.log('=== Report Generator Test ===\n');

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

  // Create report generation jobs
  console.log('--- Creating Report Generation Jobs ---');
  
  // Create a one-time job
  console.log('Creating one-time report job...');
  const oneTimeJob = reportGeneratorService.createJob({
    name: 'Daily Conversation Report',
    description: 'One-time report of conversation analytics',
    templateId: conversationReportTemplate.template.id,
    parameters: {
      startDate: '2025-05-19', // Last 7 days
      endDate: '2025-05-26',
      botId: 'bot-1'
    },
    tags: ['one-time', 'conversations']
  });
  
  if (oneTimeJob.success) {
    console.log(`Created one-time job: ${oneTimeJob.job.name} (${oneTimeJob.job.id})`);
  }
  
  // Create a scheduled daily job
  console.log('Creating daily scheduled report job...');
  const dailyJob = reportGeneratorService.createJob({
    name: 'Daily User Engagement Report',
    description: 'Daily report of user engagement metrics',
    templateId: userEngagementReportTemplate.template.id,
    parameters: {},
    schedule: {
      type: 'daily',
      interval: 1,
      time: '08:00'
    },
    distribution: {
      method: 'email',
      recipients: ['team@example.com', 'manager@example.com'],
      subject: 'Daily User Engagement Report'
    },
    tags: ['scheduled', 'daily', 'engagement']
  });
  
  if (dailyJob.success) {
    console.log(`Created daily scheduled job: ${dailyJob.job.name} (${dailyJob.job.id})`);
    console.log(`Next run scheduled for: ${dailyJob.job.nextRunAt}`);
  }
  
  // Create a scheduled weekly job
  console.log('Creating weekly scheduled report job...');
  const weeklyJob = reportGeneratorService.createJob({
    name: 'Weekly System Performance Report',
    description: 'Weekly report of system performance metrics',
    templateId: systemPerformanceReportTemplate.template.id,
    parameters: {
      period: 'weekly'
    },
    schedule: {
      type: 'weekly',
      interval: 1,
      dayOfWeek: 1, // Monday
      time: '09:00'
    },
    distribution: {
      method: 'slack',
      channel: '#system-monitoring',
      message: 'Weekly system performance report is ready'
    },
    tags: ['scheduled', 'weekly', 'performance']
  });
  
  if (weeklyJob.success) {
    console.log(`Created weekly scheduled job: ${weeklyJob.job.name} (${weeklyJob.job.id})`);
    console.log(`Next run scheduled for: ${weeklyJob.job.nextRunAt}`);
  }
  
  console.log();

  // Run the one-time job
  console.log('--- Running One-Time Job ---');
  
  const runResult = reportGeneratorService.runJob(oneTimeJob.job.id);
  if (runResult.success) {
    console.log(`Job queued for execution: ${runResult.job.name}`);
  }
  
  // Simulate job processing (in a real scenario, this would happen asynchronously)
  console.log('Simulating job processing...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Get job details
  const jobDetails = reportGeneratorService.getJobDetails(oneTimeJob.job.id);
  if (jobDetails.success) {
    console.log(`Job status: ${jobDetails.job.status}`);
    console.log(`Job runs: ${jobDetails.job.runs.length}`);
    
    if (jobDetails.job.runs.length > 0) {
      const lastRun = jobDetails.job.runs[jobDetails.job.runs.length - 1];
      console.log(`Last run status: ${lastRun.status}`);
      console.log(`Run started at: ${lastRun.startTime}`);
      console.log(`Run completed at: ${lastRun.endTime || 'N/A'}`);
      
      if (lastRun.reportId) {
        console.log(`Generated report ID: ${lastRun.reportId}`);
      }
      
      if (lastRun.error) {
        console.log(`Run error: ${lastRun.error}`);
      }
    }
  }
  console.log();

  // List all jobs
  console.log('--- Listing Jobs ---');
  
  const jobs = reportGeneratorService.getJobs();
  if (jobs.success) {
    console.log(`Total jobs: ${jobs.jobs.length}`);
    
    for (const job of jobs.jobs) {
      console.log(`- ${job.name} (${job.id}): ${job.status}`);
      console.log(`  Template: ${job.templateId}`);
      console.log(`  Created: ${job.createdAt}`);
      
      if (job.schedule) {
        console.log(`  Schedule: ${job.schedule.type} (every ${job.schedule.interval || 1})`);
        console.log(`  Next run: ${job.nextRunAt || 'N/A'}`);
      }
      
      console.log(`  Run count: ${job.runCount}`);
      console.log();
    }
  }
  
  // Get generated reports
  console.log('--- Generated Reports ---');
  
  const reports = reportGeneratorService.getGeneratedReports();
  if (reports.success) {
    console.log(`Total reports: ${reports.reports.length}`);
    
    for (const report of reports.reports) {
      console.log(`- ${report.name} (${report.id})`);
      console.log(`  Job: ${report.jobId}`);
      console.log(`  Status: ${report.status}`);
      console.log(`  Created: ${report.createdAt}`);
      console.log(`  Download URL: ${report.downloadUrl}`);
      console.log();
    }
    
    // Download a report if available
    if (reports.reports.length > 0) {
      const reportId = reports.reports[0].id;
      console.log(`Downloading report ${reportId} as HTML...`);
      
      const downloadResult = await reportGeneratorService.downloadReport(reportId, 'html');
      if (downloadResult.success) {
        console.log(`Downloaded report: ${downloadResult.report.name}`);
        console.log(`Format: ${downloadResult.report.format}`);
        console.log(`Data length: ${downloadResult.report.data.length} characters`);
        
        // Display a preview of the HTML
        const previewLength = 200;
        console.log(`Preview: ${downloadResult.report.data.substring(0, previewLength)}...`);
      }
    }
  }
  console.log();

  // Update a job
  console.log('--- Updating Job ---');
  
  const updateResult = reportGeneratorService.updateJob(dailyJob.job.id, {
    name: 'Updated Daily User Engagement Report',
    description: 'Updated description for the daily report',
    schedule: {
      type: 'daily',
      interval: 1,
      time: '10:00' // Changed from 08:00 to 10:00
    }
  });
  
  if (updateResult.success) {
    console.log(`Updated job: ${updateResult.job.name}`);
    console.log(`New description: ${updateResult.job.description}`);
    console.log(`New schedule time: ${updateResult.job.schedule.time}`);
    console.log(`Next run at: ${updateResult.job.nextRunAt}`);
  }
  console.log();

  // Cancel a job
  console.log('--- Cancelling Job ---');
  
  const cancelResult = reportGeneratorService.cancelJob(weeklyJob.job.id);
  if (cancelResult.success) {
    console.log(`Cancelled job: ${cancelResult.job.name}`);
    console.log(`Job status: ${cancelResult.job.status}`);
  }
  console.log();

  // Clean up old reports
  console.log('--- Cleaning Up Old Reports ---');
  
  const cleanupResult = reportGeneratorService.cleanupOldReports();
  if (cleanupResult.success) {
    console.log(`Cleaned up ${cleanupResult.deletedCount} old reports`);
  }
  console.log();
  
  console.log('=== Test Complete ===');
  console.log('The Report Generator service is ready for use in the chatbot platform.');
  console.log();
  console.log('Key features demonstrated:');
  console.log('1. Creating one-time and scheduled report generation jobs');
  console.log('2. Configuring different schedule types (daily, weekly, monthly)');
  console.log('3. Setting up report distribution via email, Slack, etc.');
  console.log('4. Running jobs manually and monitoring their status');
  console.log('5. Managing report generation jobs (listing, updating, cancelling)');
  console.log('6. Downloading generated reports in different formats');
  console.log('7. Cleaning up old reports based on retention policy');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
});
