/**
 * Customer Portal Frontend
 * 
 * Customer subscription and billing management interface
 */

class CustomerPortal {
  constructor() {
    this.apiClient = new ApiClient();
    this.currentSubscription = null;
    this.currentUsage = null;
    this.init();
  }

  async init() {
    await this.loadSubscription();
    await this.loadUsage();
    this.setupEventListeners();
    this.render();
  }

  async loadSubscription() {
    try {
      const response = await this.apiClient.get('/api/billing/subscriptions');
      this.currentSubscription = response.data;
    } catch (error) {
      console.error('Failed to load subscription:', error);
      this.showError('Failed to load subscription information');
    }
  }

  async loadUsage() {
    try {
      const response = await this.apiClient.get('/api/billing/usage');
      this.currentUsage = response.data;
    } catch (error) {
      console.error('Failed to load usage:', error);
      this.showError('Failed to load usage information');
    }
  }

  setupEventListeners() {
    // Plan upgrade/downgrade buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="upgrade-plan"]')) {
        const planId = e.target.dataset.planId;
        this.upgradePlan(planId);
      }
      
      if (e.target.matches('[data-action="cancel-subscription"]')) {
        this.showCancelDialog();
      }
      
      if (e.target.matches('[data-action="download-invoice"]')) {
        const invoiceId = e.target.dataset.invoiceId;
        this.downloadInvoice(invoiceId);
      }
      
      if (e.target.matches('[data-action="update-payment"]')) {
        this.showPaymentMethodDialog();
      }
    });

    // Tab navigation
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-tab]')) {
        const tabId = e.target.dataset.tab;
        this.showTab(tabId);
      }
    });
  }

  render() {
    const container = document.getElementById('customer-portal');
    if (!container) return;

    container.innerHTML = `
      <div class="portal-header">
        <h1>Account & Billing</h1>
        <div class="subscription-status ${this.getStatusClass()}">
          ${this.getStatusText()}
        </div>
      </div>

      <div class="portal-tabs">
        <button class="tab-button active" data-tab="overview">Overview</button>
        <button class="tab-button" data-tab="usage">Usage</button>
        <button class="tab-button" data-tab="billing">Billing History</button>
        <button class="tab-button" data-tab="settings">Settings</button>
      </div>

      <div class="portal-content">
        <div id="tab-overview" class="tab-content active">
          ${this.renderOverviewTab()}
        </div>
        <div id="tab-usage" class="tab-content">
          ${this.renderUsageTab()}
        </div>
        <div id="tab-billing" class="tab-content">
          ${this.renderBillingTab()}
        </div>
        <div id="tab-settings" class="tab-content">
          ${this.renderSettingsTab()}
        </div>
      </div>
    `;
  }

  renderOverviewTab() {
    if (!this.currentSubscription) {
      return '<div class="loading">Loading subscription information...</div>';
    }

    const subscription = this.currentSubscription;
    const planName = this.getPlanDisplayName(subscription.planId);
    
    return `
      <div class="overview-grid">
        <div class="card current-plan">
          <h3>Current Plan</h3>
          <div class="plan-info">
            <div class="plan-name">${planName}</div>
            <div class="plan-price">${this.formatPrice(subscription.planId)}</div>
            <div class="plan-status">Status: ${subscription.status}</div>
            ${subscription.cancelAtPeriodEnd ? 
              '<div class="cancel-notice">Cancels at period end</div>' : ''
            }
          </div>
          <div class="plan-actions">
            ${this.renderPlanActions()}
          </div>
        </div>

        <div class="card usage-summary">
          <h3>Usage Summary</h3>
          ${this.renderUsageSummary()}
        </div>

        <div class="card next-billing">
          <h3>Next Billing</h3>
          <div class="billing-info">
            <div class="billing-date">
              ${this.formatDate(subscription.currentPeriodEnd)}
            </div>
            <div class="billing-amount">
              ${this.calculateNextBilling()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderUsageTab() {
    if (!this.currentUsage) {
      return '<div class="loading">Loading usage information...</div>';
    }

    const usage = this.currentUsage.usage;
    
    return `
      <div class="usage-container">
        <div class="usage-period">
          <h3>Usage for ${this.formatMonth(this.currentUsage.period)}</h3>
        </div>
        
        <div class="usage-grid">
          ${Object.entries(usage).map(([resource, data]) => `
            <div class="usage-card">
              <h4>${this.getResourceDisplayName(resource)}</h4>
              <div class="usage-bar">
                <div class="usage-progress" style="width: ${Math.min(data.percentage, 100)}%"></div>
              </div>
              <div class="usage-text">
                ${data.current.toLocaleString()} ${data.unlimited ? '' : `/ ${data.limit.toLocaleString()}`}
                ${data.unlimited ? '(Unlimited)' : `(${data.percentage}%)`}
              </div>
              ${data.percentage > 80 && !data.unlimited ? 
                '<div class="usage-warning">Approaching limit</div>' : ''
              }
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderBillingTab() {
    return `
      <div class="billing-container">
        <div class="billing-header">
          <h3>Billing History</h3>
          <button class="btn btn-secondary" data-action="update-payment">
            Update Payment Method
          </button>
        </div>
        
        <div id="billing-history" class="billing-history">
          <div class="loading">Loading billing history...</div>
        </div>
      </div>
    `;
  }

  renderSettingsTab() {
    return `
      <div class="settings-container">
        <div class="settings-section">
          <h3>Subscription Settings</h3>
          
          <div class="setting-item">
            <label>Email Notifications</label>
            <div class="setting-controls">
              <label class="checkbox">
                <input type="checkbox" checked> Billing reminders
              </label>
              <label class="checkbox">
                <input type="checkbox" checked> Usage alerts
              </label>
              <label class="checkbox">
                <input type="checkbox"> Product updates
              </label>
            </div>
          </div>

          <div class="setting-item">
            <label>Billing Preferences</label>
            <div class="setting-controls">
              <select class="form-control">
                <option>Monthly billing</option>
                <option>Annual billing (20% discount)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="settings-section danger-zone">
          <h3>Danger Zone</h3>
          <div class="setting-item">
            <label>Cancel Subscription</label>
            <p class="setting-description">
              Cancel your subscription. You'll continue to have access until the end of your billing period.
            </p>
            <button class="btn btn-danger" data-action="cancel-subscription">
              Cancel Subscription
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderPlanActions() {
    const currentPlan = this.currentSubscription.planId;
    const plans = ['starter', 'professional', 'enterprise'];
    
    return plans
      .filter(plan => plan !== currentPlan)
      .map(plan => `
        <button class="btn btn-primary" data-action="upgrade-plan" data-plan-id="${plan}">
          ${plan === 'enterprise' ? 'Contact Sales' : `Upgrade to ${this.getPlanDisplayName(plan)}`}
        </button>
      `).join('');
  }

  renderUsageSummary() {
    if (!this.currentUsage) {
      return '<div class="loading">Loading...</div>';
    }

    const usage = this.currentUsage.usage;
    const highUsage = Object.entries(usage)
      .filter(([_, data]) => data.percentage > 80 && !data.unlimited)
      .slice(0, 3);

    if (highUsage.length === 0) {
      return '<div class="usage-ok">All usage within limits</div>';
    }

    return `
      <div class="usage-alerts">
        ${highUsage.map(([resource, data]) => `
          <div class="usage-alert">
            <strong>${this.getResourceDisplayName(resource)}</strong>: ${data.percentage}% used
          </div>
        `).join('')}
      </div>
    `;
  }

  async upgradePlan(planId) {
    if (planId === 'enterprise') {
      window.open('mailto:sales@chatbot-platform.com?subject=Enterprise Plan Inquiry');
      return;
    }

    try {
      this.showLoading('Upgrading plan...');
      
      const response = await this.apiClient.put('/api/billing/subscriptions', {
        planId: planId
      });

      this.currentSubscription = response.data;
      this.render();
      this.showSuccess('Plan upgraded successfully!');
    } catch (error) {
      console.error('Plan upgrade failed:', error);
      this.showError('Failed to upgrade plan. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  showCancelDialog() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Cancel Subscription</h3>
        <p>Are you sure you want to cancel your subscription? You'll continue to have access until ${this.formatDate(this.currentSubscription.currentPeriodEnd)}.</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Keep Subscription</button>
          <button class="btn btn-danger" onclick="customerPortal.confirmCancel()">Cancel Subscription</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async confirmCancel() {
    try {
      this.showLoading('Cancelling subscription...');
      
      await this.apiClient.delete('/api/billing/subscriptions');
      
      await this.loadSubscription();
      this.render();
      this.showSuccess('Subscription cancelled successfully.');
      
      // Close modal
      document.querySelector('.modal')?.remove();
    } catch (error) {
      console.error('Cancellation failed:', error);
      this.showError('Failed to cancel subscription. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  showTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabId}`);
    });

    // Load tab-specific data
    if (tabId === 'billing') {
      this.loadBillingHistory();
    }
  }

  async loadBillingHistory() {
    try {
      const response = await this.apiClient.get('/api/billing/history');
      const historyContainer = document.getElementById('billing-history');
      
      if (response.data.invoices.length === 0) {
        historyContainer.innerHTML = '<div class="no-data">No billing history available</div>';
        return;
      }

      historyContainer.innerHTML = `
        <div class="invoice-list">
          ${response.data.invoices.map(invoice => `
            <div class="invoice-item">
              <div class="invoice-info">
                <div class="invoice-date">${this.formatDate(invoice.date)}</div>
                <div class="invoice-description">${invoice.description}</div>
              </div>
              <div class="invoice-amount">$${(invoice.amount / 100).toFixed(2)}</div>
              <div class="invoice-status ${invoice.status}">${invoice.status}</div>
              <div class="invoice-actions">
                <a href="${invoice.downloadUrl}" target="_blank" class="btn btn-sm">Download</a>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      console.error('Failed to load billing history:', error);
      document.getElementById('billing-history').innerHTML = 
        '<div class="error">Failed to load billing history</div>';
    }
  }

  // Utility methods
  getPlanDisplayName(planId) {
    const names = {
      starter: 'Starter',
      professional: 'Professional', 
      enterprise: 'Enterprise'
    };
    return names[planId] || planId;
  }

  getResourceDisplayName(resource) {
    const names = {
      conversations: 'Conversations',
      chatbots: 'Chatbots',
      apiCalls: 'API Calls',
      knowledgeEntries: 'Knowledge Entries',
      storage: 'Storage (GB)'
    };
    return names[resource] || resource;
  }

  formatPrice(planId) {
    const prices = {
      starter: '$29/month',
      professional: '$99/month',
      enterprise: 'Custom pricing'
    };
    return prices[planId] || 'Custom pricing';
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatMonth(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  }

  getStatusClass() {
    const status = this.currentSubscription?.status || 'unknown';
    return `status-${status}`;
  }

  getStatusText() {
    const status = this.currentSubscription?.status || 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  calculateNextBilling() {
    // This would calculate based on usage and overages
    return this.formatPrice(this.currentSubscription?.planId);
  }

  showLoading(message) {
    // Implementation for loading indicator
  }

  hideLoading() {
    // Implementation for hiding loading indicator
  }

  showSuccess(message) {
    // Implementation for success notification
  }

  showError(message) {
    // Implementation for error notification
  }
}

// API Client helper class
class ApiClient {
  constructor() {
    this.baseURL = '/api';
  }

  async request(method, url, data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(this.baseURL + url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async get(url) {
    return this.request('GET', url);
  }

  async post(url, data) {
    return this.request('POST', url, data);
  }

  async put(url, data) {
    return this.request('PUT', url, data);
  }

  async delete(url) {
    return this.request('DELETE', url);
  }

  getAuthToken() {
    return localStorage.getItem('authToken') || '';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('customer-portal')) {
    window.customerPortal = new CustomerPortal();
  }
});
