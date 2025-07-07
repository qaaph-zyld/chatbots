/**
 * Analytics Dashboard
 * 
 * Provides visualization and interaction with chatbot analytics data
 */

// Initialize charts and data
let chatbotId = null;
let period = 'monthly';
let insightsData = null;
let analyticsData = null;
let comparisonData = null;
let charts = {};

// DOM elements
const dashboardEl = document.getElementById('analytics-dashboard');
const chatbotSelectEl = document.getElementById('chatbot-select');
const periodSelectEl = document.getElementById('period-select');
const dateRangeEl = document.getElementById('date-range');
const metricsContainerEl = document.getElementById('metrics-container');
const insightsContainerEl = document.getElementById('insights-container');
const recommendationsContainerEl = document.getElementById('recommendations-container');
const learningContainerEl = document.getElementById('learning-container');

/**
 * Initialize the analytics dashboard
 */
function initAnalyticsDashboard() {
  // Set up event listeners
  chatbotSelectEl.addEventListener('change', onChatbotChange);
  periodSelectEl.addEventListener('change', onPeriodChange);
  
  // Load chatbots for dropdown
  loadChatbots();
  
  // Set up charts
  setupCharts();
}

/**
 * Load chatbots for dropdown
 */
async function loadChatbots() {
  try {
    const response = await fetch('/api/chatbots');
    const data = await response.json();
    
    if (data.success && data.data) {
      // Clear dropdown
      chatbotSelectEl.innerHTML = '<option value="">Select a chatbot</option>';
      
      // Add chatbots to dropdown
      data.data.forEach(chatbot => {
        const option = document.createElement('option');
        option.value = chatbot.id;
        option.textContent = chatbot.name;
        chatbotSelectEl.appendChild(option);
      });
      
      // If there's at least one chatbot, select it
      if (data.data.length > 0) {
        chatbotSelectEl.value = data.data[0].id;
        chatbotId = data.data[0].id;
        loadAnalyticsData();
      }
    }
  } catch (error) {
    console.error('Error loading chatbots:', error);
    showNotification('error', 'Failed to load chatbots');
  }
}

/**
 * Handle chatbot change
 */
function onChatbotChange() {
  chatbotId = chatbotSelectEl.value;
  loadAnalyticsData();
}

/**
 * Handle period change
 */
function onPeriodChange() {
  period = periodSelectEl.value;
  loadAnalyticsData();
}

/**
 * Load analytics data for the selected chatbot and period
 */
async function loadAnalyticsData() {
  if (!chatbotId) return;
  
  try {
    showLoading(true);
    
    // Load analytics data
    const analyticsResponse = await fetch(`/api/chatbots/${chatbotId}/analytics?period=${period}`);
    analyticsData = await analyticsResponse.json();
    
    // Load insights
    const insightsResponse = await fetch(`/api/chatbots/${chatbotId}/insights?period=${period}`);
    insightsData = await insightsResponse.json();
    
    // Load comparison data (for previous period)
    const comparisonResponse = await fetch(`/api/chatbots/${chatbotId}/analytics/compare?period=${period}`);
    comparisonData = await comparisonResponse.json();
    
    // Load learning items
    const learningResponse = await fetch(`/api/chatbots/${chatbotId}/learning`);
    const learningData = await learningResponse.json();
    
    // Update UI with data
    updateMetricsUI();
    updateInsightsUI();
    updateRecommendationsUI();
    updateLearningUI(learningData);
    updateCharts();
    
    showLoading(false);
  } catch (error) {
    console.error('Error loading analytics data:', error);
    showNotification('error', 'Failed to load analytics data');
    showLoading(false);
  }
}

/**
 * Update metrics UI
 */
function updateMetricsUI() {
  if (!analyticsData) return;
  
  // Clear metrics container
  metricsContainerEl.innerHTML = '';
  
  // Create metrics cards
  const metrics = [
    {
      title: 'Total Messages',
      value: analyticsData.metrics.messageCount,
      icon: 'message',
      trend: comparisonData ? calculateTrend(analyticsData.metrics.messageCount, comparisonData.metrics.messageCount.previous) : null
    },
    {
      title: 'Conversations',
      value: analyticsData.metrics.conversationCount,
      icon: 'forum',
      trend: comparisonData ? calculateTrend(analyticsData.metrics.conversationCount, comparisonData.metrics.conversationCount.previous) : null
    },
    {
      title: 'Unique Users',
      value: analyticsData.metrics.uniqueUserCount,
      icon: 'people',
      trend: comparisonData ? calculateTrend(analyticsData.metrics.uniqueUserCount, comparisonData.metrics.uniqueUserCount.previous) : null
    },
    {
      title: 'Avg. Response Time',
      value: `${(analyticsData.metrics.averageResponseTime / 1000).toFixed(2)}s`,
      icon: 'timer',
      trend: comparisonData ? calculateTrend(comparisonData.metrics.averageResponseTime.previous, analyticsData.metrics.averageResponseTime, true) : null
    },
    {
      title: 'Avg. Conversation Length',
      value: analyticsData.metrics.averageConversationLength.toFixed(1),
      icon: 'chat',
      trend: comparisonData ? calculateTrend(analyticsData.metrics.averageConversationLength, comparisonData.metrics.averageConversationLength.previous) : null
    },
    {
      title: 'Positive Sentiment',
      value: `${((analyticsData.sentimentAnalysis.positive / (analyticsData.sentimentAnalysis.positive + analyticsData.sentimentAnalysis.neutral + analyticsData.sentimentAnalysis.negative)) * 100).toFixed(1)}%`,
      icon: 'sentiment_satisfied',
      trend: comparisonData ? calculateTrend(
        analyticsData.sentimentAnalysis.positive / (analyticsData.sentimentAnalysis.positive + analyticsData.sentimentAnalysis.neutral + analyticsData.sentimentAnalysis.negative),
        comparisonData.sentiment.positiveRatio.previous
      ) : null
    }
  ];
  
  // Create metric cards
  metrics.forEach(metric => {
    const card = document.createElement('div');
    card.className = 'metric-card';
    
    const trendHtml = metric.trend ? `
      <div class="trend ${metric.trend.direction}">
        <i class="material-icons">${metric.trend.direction === 'up' ? 'arrow_upward' : 'arrow_downward'}</i>
        <span>${metric.trend.percentage}%</span>
      </div>
    ` : '';
    
    card.innerHTML = `
      <div class="metric-icon">
        <i class="material-icons">${metric.icon}</i>
      </div>
      <div class="metric-content">
        <h3>${metric.title}</h3>
        <div class="metric-value">
          <span>${metric.value}</span>
          ${trendHtml}
        </div>
      </div>
    `;
    
    metricsContainerEl.appendChild(card);
  });
}

/**
 * Update insights UI
 */
function updateInsightsUI() {
  if (!insightsData) return;
  
  // Clear insights container
  insightsContainerEl.innerHTML = '';
  
  // Combine all insights
  const allInsights = [
    ...(insightsData.performanceInsights || []),
    ...(insightsData.userInsights || []),
    ...(insightsData.contentInsights || [])
  ];
  
  // Create insight cards
  allInsights.forEach(insight => {
    const card = document.createElement('div');
    card.className = `insight-card ${insight.status}`;
    
    card.innerHTML = `
      <div class="insight-header">
        <h3>${insight.title}</h3>
        <span class="insight-value">${insight.value}${insight.unit ? ' ' + insight.unit : ''}</span>
      </div>
      <p>${insight.description}</p>
      ${insight.details ? `
        <div class="insight-details">
          <h4>Details</h4>
          <ul>
            ${Array.isArray(insight.details) ? insight.details.map(detail => `
              <li>${detail.intent || detail.type || detail.query || detail.value || JSON.stringify(detail)}</li>
            `).join('') : ''}
          </ul>
        </div>
      ` : ''}
    `;
    
    insightsContainerEl.appendChild(card);
  });
  
  // If no insights, show message
  if (allInsights.length === 0) {
    insightsContainerEl.innerHTML = '<p class="empty-message">No insights available for this period</p>';
  }
}

/**
 * Update recommendations UI
 */
function updateRecommendationsUI() {
  if (!insightsData || !insightsData.recommendations) return;
  
  // Clear recommendations container
  recommendationsContainerEl.innerHTML = '';
  
  // Create recommendation cards
  insightsData.recommendations.forEach(recommendation => {
    const card = document.createElement('div');
    card.className = `recommendation-card ${recommendation.priority}`;
    
    card.innerHTML = `
      <div class="recommendation-header">
        <span class="priority-badge ${recommendation.priority}">${recommendation.priority}</span>
        <h3>${recommendation.title}</h3>
      </div>
      <p>${recommendation.description}</p>
      <div class="recommendation-actions">
        <h4>Suggested Actions</h4>
        <ul>
          ${recommendation.actions.map(action => `<li>${action}</li>`).join('')}
        </ul>
      </div>
      ${recommendation.details ? `
        <div class="recommendation-details">
          <h4>Details</h4>
          <ul>
            ${Array.isArray(recommendation.details) ? recommendation.details.map(detail => `
              <li>${detail.query || detail.intent || detail.type || detail.value || JSON.stringify(detail)}</li>
            `).join('') : ''}
          </ul>
        </div>
      ` : ''}
    `;
    
    recommendationsContainerEl.appendChild(card);
  });
  
  // If no recommendations, show message
  if (insightsData.recommendations.length === 0) {
    recommendationsContainerEl.innerHTML = '<p class="empty-message">No recommendations available</p>';
  }
}

/**
 * Update learning UI
 * @param {Object} learningData - Learning data
 */
function updateLearningUI(learningData) {
  if (!learningData) return;
  
  // Clear learning container
  learningContainerEl.innerHTML = '';
  
  // Create learning header
  const header = document.createElement('div');
  header.className = 'learning-header';
  header.innerHTML = `
    <h2>Learning Items</h2>
    <div class="learning-actions">
      <button id="generate-learning-btn" class="btn btn-primary">Generate Learning</button>
      <button id="apply-learning-btn" class="btn btn-success">Apply Learning</button>
    </div>
  `;
  learningContainerEl.appendChild(header);
  
  // Add event listeners
  document.getElementById('generate-learning-btn').addEventListener('click', generateLearning);
  document.getElementById('apply-learning-btn').addEventListener('click', applyLearning);
  
  // Create learning table
  const table = document.createElement('table');
  table.className = 'learning-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Type</th>
        <th>Source</th>
        <th>Data</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody id="learning-table-body">
    </tbody>
  `;
  learningContainerEl.appendChild(table);
  
  const tableBody = document.getElementById('learning-table-body');
  
  // Add learning items to table
  learningData.forEach(item => {
    const row = document.createElement('tr');
    row.className = `learning-item ${item.status}`;
    row.dataset.id = item._id;
    
    let dataContent = '';
    if (item.type === 'query_response') {
      dataContent = `<strong>Q:</strong> ${item.data.query}<br><strong>A:</strong> ${item.data.response}`;
    } else if (item.type === 'intent_pattern') {
      dataContent = `<strong>Intent:</strong> ${item.data.intent}<br><strong>Pattern:</strong> ${item.data.pattern || item.data.query || ''}`;
    } else if (item.type === 'entity_pattern') {
      dataContent = `<strong>Entity:</strong> ${item.data.entity ? `${item.data.entity.type}:${item.data.entity.value}` : ''}<br><strong>Pattern:</strong> ${item.data.pattern || item.data.query || ''}`;
    } else if (item.type === 'fallback_response') {
      dataContent = `<strong>Query:</strong> ${item.data.query}`;
    }
    
    row.innerHTML = `
      <td>${formatLearningType(item.type)}</td>
      <td>${formatLearningSource(item.source)}</td>
      <td class="learning-data">${dataContent}</td>
      <td><span class="status-badge ${item.status}">${item.status}</span></td>
      <td class="learning-actions">
        ${item.status === 'pending' ? `
          <button class="btn btn-sm btn-success approve-btn" data-id="${item._id}">Approve</button>
          <button class="btn btn-sm btn-danger reject-btn" data-id="${item._id}">Reject</button>
        ` : ''}
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Add event listeners for approve/reject buttons
  document.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', () => updateLearningStatus(btn.dataset.id, 'approved'));
  });
  
  document.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', () => updateLearningStatus(btn.dataset.id, 'rejected'));
  });
  
  // If no learning items, show message
  if (learningData.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="empty-message">No learning items available</td></tr>`;
  }
}

/**
 * Generate learning from analytics
 */
async function generateLearning() {
  if (!chatbotId) return;
  
  try {
    showLoading(true);
    
    const response = await fetch(`/api/chatbots/${chatbotId}/learning/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data) {
      showNotification('success', `Generated ${data.length} learning items`);
      loadAnalyticsData(); // Reload data
    }
    
    showLoading(false);
  } catch (error) {
    console.error('Error generating learning:', error);
    showNotification('error', 'Failed to generate learning');
    showLoading(false);
  }
}

/**
 * Apply learning to chatbot
 */
async function applyLearning() {
  if (!chatbotId) return;
  
  try {
    showLoading(true);
    
    const response = await fetch(`/api/chatbots/${chatbotId}/learning/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data && data.data) {
      showNotification('success', `Applied ${data.data.applied} learning items`);
      loadAnalyticsData(); // Reload data
    }
    
    showLoading(false);
  } catch (error) {
    console.error('Error applying learning:', error);
    showNotification('error', 'Failed to apply learning');
    showLoading(false);
  }
}

/**
 * Update learning item status
 * @param {string} id - Learning item ID
 * @param {string} status - New status (approved, rejected)
 */
async function updateLearningStatus(id, status) {
  try {
    showLoading(true);
    
    const response = await fetch(`/api/learning/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    const data = await response.json();
    
    if (data) {
      showNotification('success', `Learning item ${status}`);
      loadAnalyticsData(); // Reload data
    }
    
    showLoading(false);
  } catch (error) {
    console.error('Error updating learning status:', error);
    showNotification('error', 'Failed to update learning status');
    showLoading(false);
  }
}

/**
 * Set up charts
 */
function setupCharts() {
  // Message volume chart
  charts.messageVolume = new Chart(
    document.getElementById('message-volume-chart'),
    {
      type: 'bar',
      data: {
        labels: ['User Messages', 'Bot Messages'],
        datasets: [{
          label: 'Message Count',
          data: [0, 0],
          backgroundColor: ['#4285F4', '#34A853']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    }
  );
  
  // Sentiment chart
  charts.sentiment = new Chart(
    document.getElementById('sentiment-chart'),
    {
      type: 'doughnut',
      data: {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: ['#34A853', '#FBBC05', '#EA4335']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    }
  );
  
  // Input types chart
  charts.inputTypes = new Chart(
    document.getElementById('input-types-chart'),
    {
      type: 'pie',
      data: {
        labels: ['Text', 'Image', 'Audio', 'Location', 'Other'],
        datasets: [{
          data: [0, 0, 0, 0, 0],
          backgroundColor: ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#9E9E9E']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    }
  );
  
  // Output types chart
  charts.outputTypes = new Chart(
    document.getElementById('output-types-chart'),
    {
      type: 'pie',
      data: {
        labels: ['Text', 'Image', 'Audio', 'Card', 'Carousel', 'Quick Reply', 'Other'],
        datasets: [{
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#9C27B0', '#FF9800', '#9E9E9E']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    }
  );
}

/**
 * Update charts with analytics data
 */
function updateCharts() {
  if (!analyticsData) return;
  
  // Update message volume chart
  charts.messageVolume.data.datasets[0].data = [
    analyticsData.metrics.userMessageCount,
    analyticsData.metrics.botMessageCount
  ];
  charts.messageVolume.update();
  
  // Update sentiment chart
  charts.sentiment.data.datasets[0].data = [
    analyticsData.sentimentAnalysis.positive,
    analyticsData.sentimentAnalysis.neutral,
    analyticsData.sentimentAnalysis.negative
  ];
  charts.sentiment.update();
  
  // Update input types chart
  charts.inputTypes.data.datasets[0].data = [
    analyticsData.inputTypes.text,
    analyticsData.inputTypes.image,
    analyticsData.inputTypes.audio,
    analyticsData.inputTypes.location,
    analyticsData.inputTypes.other
  ];
  charts.inputTypes.update();
  
  // Update output types chart
  charts.outputTypes.data.datasets[0].data = [
    analyticsData.outputTypes.text,
    analyticsData.outputTypes.image,
    analyticsData.outputTypes.audio,
    analyticsData.outputTypes.card,
    analyticsData.outputTypes.carousel,
    analyticsData.outputTypes.quickReply,
    analyticsData.outputTypes.other
  ];
  charts.outputTypes.update();
}

/**
 * Calculate trend between current and previous values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @param {boolean} inverse - If true, lower is better (e.g., response time)
 * @returns {Object} - Trend object with direction and percentage
 */
function calculateTrend(current, previous, inverse = false) {
  if (!previous || previous === 0) return null;
  
  const difference = current - previous;
  const percentage = Math.abs((difference / previous) * 100).toFixed(1);
  
  let direction = 'stable';
  if (difference > 0) {
    direction = inverse ? 'down' : 'up';
  } else if (difference < 0) {
    direction = inverse ? 'up' : 'down';
  }
  
  return {
    direction,
    percentage
  };
}

/**
 * Format learning type for display
 * @param {string} type - Learning type
 * @returns {string} - Formatted type
 */
function formatLearningType(type) {
  switch (type) {
    case 'query_response':
      return 'Query-Response';
    case 'intent_pattern':
      return 'Intent Pattern';
    case 'entity_pattern':
      return 'Entity Pattern';
    case 'fallback_response':
      return 'Fallback Response';
    default:
      return type;
  }
}

/**
 * Format learning source for display
 * @param {string} source - Learning source
 * @returns {string} - Formatted source
 */
function formatLearningSource(source) {
  switch (source) {
    case 'user_feedback':
      return 'User Feedback';
    case 'analytics':
      return 'Analytics';
    case 'manual':
      return 'Manual';
    default:
      return source;
  }
}

/**
 * Show loading indicator
 * @param {boolean} show - Whether to show or hide the loading indicator
 */
function showLoading(show) {
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.style.display = show ? 'flex' : 'none';
  }
}

/**
 * Show notification
 * @param {string} type - Notification type (success, error, info)
 * @param {string} message - Notification message
 */
function showNotification(type, message) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="material-icons">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}</i>
      <span>${message}</span>
    </div>
    <button class="close-btn">
      <i class="material-icons">close</i>
    </button>
  `;
  
  // Add to notifications container
  const notificationsContainer = document.getElementById('notifications-container');
  notificationsContainer.appendChild(notification);
  
  // Add close button event listener
  notification.querySelector('.close-btn').addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initAnalyticsDashboard);
