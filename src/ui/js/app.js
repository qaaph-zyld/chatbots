/**
 * Chatbot Customization Platform
 * Main Application JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the application
  initApp();
  
  // Load initial data
  loadDashboardData();
});

/**
 * Initialize the application
 */
function initApp() {
  // Set up navigation
  setupNavigation();
  
  // Set up event listeners
  setupEventListeners();
}

/**
 * Set up navigation between pages
 */
function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get the page to show
      const pageId = this.getAttribute('data-page');
      
      // Update active nav link
      navLinks.forEach(navLink => navLink.classList.remove('active'));
      this.classList.add('active');
      
      // Update page title
      document.getElementById('page-title').textContent = this.textContent.trim();
      
      // Show the selected page
      showPage(pageId);
    });
  });
}

/**
 * Show a specific page and hide others
 * @param {string} pageId - The ID of the page to show
 */
function showPage(pageId) {
  // Hide all pages
  const pages = document.querySelectorAll('.page-content');
  pages.forEach(page => page.classList.remove('active'));
  
  // Show the selected page
  const selectedPage = document.getElementById(`${pageId}-page`);
  if (selectedPage) {
    selectedPage.classList.add('active');
    
    // Load page content if it's empty
    if (selectedPage.children.length === 0 || selectedPage.dataset.loaded !== 'true') {
      loadPageContent(pageId);
    }
  }
}

/**
 * Load content for a specific page
 * @param {string} pageId - The ID of the page to load content for
 */
function loadPageContent(pageId) {
  const pageElement = document.getElementById(`${pageId}-page`);
  
  switch (pageId) {
    case 'chatbots':
      loadChatbotsPage(pageElement);
      break;
    case 'personalities':
      loadPersonalitiesPage(pageElement);
      break;
    case 'knowledge-bases':
      loadKnowledgeBasesPage(pageElement);
      break;
    case 'plugins':
      loadPluginsPage(pageElement);
      break;
    case 'training':
      loadTrainingPage(pageElement);
      break;
    case 'templates':
      loadTemplatesPage(pageElement);
      break;
    case 'settings':
      loadSettingsPage(pageElement);
      break;
    default:
      // Dashboard is loaded separately
      break;
  }
  
  // Mark page as loaded
  pageElement.dataset.loaded = 'true';
}

/**
 * Set up event listeners for various UI components
 */
function setupEventListeners() {
  // Quick action buttons
  const quickActionButtons = document.querySelectorAll('.card-body .btn');
  quickActionButtons.forEach(button => {
    button.addEventListener('click', function() {
      const action = this.textContent.trim();
      handleQuickAction(action);
    });
  });
}

/**
 * Handle quick action button clicks
 * @param {string} action - The action to perform
 */
function handleQuickAction(action) {
  switch (action) {
    case 'Create New Chatbot':
      showPage('chatbots');
      openCreateChatbotModal();
      break;
    case 'Add Knowledge Base':
      showPage('knowledge-bases');
      openCreateKnowledgeBaseModal();
      break;
    case 'Create Personality':
      showPage('personalities');
      openCreatePersonalityModal();
      break;
    case 'Install Plugin':
      showPage('plugins');
      openInstallPluginModal();
      break;
    case 'Start Training':
      showPage('training');
      openStartTrainingModal();
      break;
    default:
      console.log('Unknown action:', action);
      break;
  }
}

/**
 * Load dashboard data
 */
function loadDashboardData() {
  // In a real application, this would fetch data from the API
  // For now, we'll use placeholder data
  console.log('Loading dashboard data...');
}

// Page-specific loading functions
function loadChatbotsPage(pageElement) {
  pageElement.innerHTML = `
    <div class="d-flex justify-content-between mb-4">
      <h3>Manage Chatbots</h3>
      <button class="btn btn-primary" id="create-chatbot-btn">
        <i class="bi bi-plus-circle me-2"></i>Create New Chatbot
      </button>
    </div>
    
    <div class="row" id="chatbots-container">
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card chatbot-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <h5 class="card-title">Support Bot</h5>
              <span class="badge bg-success">Active</span>
            </div>
            <p class="card-text">A customer support chatbot trained to handle common inquiries.</p>
            <p class="card-text"><small class="text-muted">Engine: Botpress</small></p>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Edit</button>
              <button class="btn btn-sm btn-outline-secondary">Test</button>
              <button class="btn btn-sm btn-outline-danger">Delete</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card chatbot-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <h5 class="card-title">Sales Bot</h5>
              <span class="badge bg-success">Active</span>
            </div>
            <p class="card-text">A sales assistant chatbot designed to help with product recommendations.</p>
            <p class="card-text"><small class="text-muted">Engine: Hugging Face</small></p>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Edit</button>
              <button class="btn btn-sm btn-outline-secondary">Test</button>
              <button class="btn btn-sm btn-outline-danger">Delete</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card chatbot-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <h5 class="card-title">Marketing Bot</h5>
              <span class="badge bg-success">Active</span>
            </div>
            <p class="card-text">A marketing assistant chatbot for campaign planning and content ideas.</p>
            <p class="card-text"><small class="text-muted">Engine: Botpress</small></p>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Edit</button>
              <button class="btn btn-sm btn-outline-secondary">Test</button>
              <button class="btn btn-sm btn-outline-danger">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add event listener for create chatbot button
  const createChatbotBtn = pageElement.querySelector('#create-chatbot-btn');
  if (createChatbotBtn) {
    createChatbotBtn.addEventListener('click', openCreateChatbotModal);
  }
}

function loadPersonalitiesPage(pageElement) {
  pageElement.innerHTML = `
    <div class="d-flex justify-content-between mb-4">
      <h3>Manage Personalities</h3>
      <button class="btn btn-primary" id="create-personality-btn">
        <i class="bi bi-plus-circle me-2"></i>Create New Personality
      </button>
    </div>
    
    <div class="row" id="personalities-container">
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card personality-card h-100">
          <div class="card-body">
            <h5 class="card-title">Professional Assistant</h5>
            <p class="card-text">A formal, professional personality for business contexts.</p>
            <div class="mt-3">
              <span class="badge bg-primary me-1">Formal</span>
              <span class="badge bg-primary me-1">Professional</span>
              <span class="badge bg-primary me-1">Helpful</span>
            </div>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Edit</button>
              <button class="btn btn-sm btn-outline-secondary">Preview</button>
              <button class="btn btn-sm btn-outline-danger">Delete</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card personality-card h-100">
          <div class="card-body">
            <h5 class="card-title">Friendly Guide</h5>
            <p class="card-text">A warm, approachable personality for customer support.</p>
            <div class="mt-3">
              <span class="badge bg-primary me-1">Friendly</span>
              <span class="badge bg-primary me-1">Casual</span>
              <span class="badge bg-primary me-1">Supportive</span>
            </div>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Edit</button>
              <button class="btn btn-sm btn-outline-secondary">Preview</button>
              <button class="btn btn-sm btn-outline-danger">Delete</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card personality-card h-100">
          <div class="card-body">
            <h5 class="card-title">Sales Expert</h5>
            <p class="card-text">A persuasive, knowledgeable personality for sales contexts.</p>
            <div class="mt-3">
              <span class="badge bg-primary me-1">Persuasive</span>
              <span class="badge bg-primary me-1">Knowledgeable</span>
              <span class="badge bg-primary me-1">Confident</span>
            </div>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Edit</button>
              <button class="btn btn-sm btn-outline-secondary">Preview</button>
              <button class="btn btn-sm btn-outline-danger">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function loadKnowledgeBasesPage(pageElement) {
  pageElement.innerHTML = `
    <div class="d-flex justify-content-between mb-4">
      <h3>Manage Knowledge Bases</h3>
      <button class="btn btn-primary" id="create-knowledge-base-btn">
        <i class="bi bi-plus-circle me-2"></i>Create New Knowledge Base
      </button>
    </div>
    
    <div class="row" id="knowledge-bases-container">
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card knowledge-card h-100">
          <div class="card-body">
            <h5 class="card-title">Product Information</h5>
            <p class="card-text">Contains detailed information about our products and services.</p>
            <p class="card-text"><small class="text-muted">15 knowledge items</small></p>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Edit</button>
              <button class="btn btn-sm btn-outline-secondary">View Items</button>
              <button class="btn btn-sm btn-outline-danger">Delete</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card knowledge-card h-100">
          <div class="card-body">
            <h5 class="card-title">FAQ</h5>
            <p class="card-text">Frequently asked questions and their answers.</p>
            <p class="card-text"><small class="text-muted">20 knowledge items</small></p>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Edit</button>
              <button class="btn btn-sm btn-outline-secondary">View Items</button>
              <button class="btn btn-sm btn-outline-danger">Delete</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card knowledge-card h-100">
          <div class="card-body">
            <h5 class="card-title">Company Policies</h5>
            <p class="card-text">Information about company policies and procedures.</p>
            <p class="card-text"><small class="text-muted">7 knowledge items</small></p>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Edit</button>
              <button class="btn btn-sm btn-outline-secondary">View Items</button>
              <button class="btn btn-sm btn-outline-danger">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function loadPluginsPage(pageElement) {
  pageElement.innerHTML = `
    <div class="d-flex justify-content-between mb-4">
      <h3>Manage Plugins</h3>
      <button class="btn btn-primary" id="install-plugin-btn">
        <i class="bi bi-plus-circle me-2"></i>Install New Plugin
      </button>
    </div>
    
    <div class="row" id="plugins-container">
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card plugin-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <h5 class="card-title">Sentiment Analysis</h5>
              <span class="badge bg-success">Active</span>
            </div>
            <p class="card-text">Analyzes sentiment in user messages to adjust responses accordingly.</p>
            <p class="card-text"><small class="text-muted">Version: 1.0.0</small></p>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Configure</button>
              <button class="btn btn-sm btn-outline-secondary">Disable</button>
              <button class="btn btn-sm btn-outline-danger">Uninstall</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card plugin-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <h5 class="card-title">Language Translation</h5>
              <span class="badge bg-success">Active</span>
            </div>
            <p class="card-text">Translates messages between different languages.</p>
            <p class="card-text"><small class="text-muted">Version: 1.2.1</small></p>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Configure</button>
              <button class="btn btn-sm btn-outline-secondary">Disable</button>
              <button class="btn btn-sm btn-outline-danger">Uninstall</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card plugin-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <h5 class="card-title">Entity Recognition</h5>
              <span class="badge bg-success">Active</span>
            </div>
            <p class="card-text">Identifies and extracts entities from user messages.</p>
            <p class="card-text"><small class="text-muted">Version: 0.9.5</small></p>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Configure</button>
              <button class="btn btn-sm btn-outline-secondary">Disable</button>
              <button class="btn btn-sm btn-outline-danger">Uninstall</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function loadTrainingPage(pageElement) {
  pageElement.innerHTML = `
    <div class="d-flex justify-content-between mb-4">
      <h3>Training Management</h3>
      <button class="btn btn-primary" id="create-training-dataset-btn">
        <i class="bi bi-plus-circle me-2"></i>Create Training Dataset
      </button>
    </div>
    
    <div class="row" id="training-datasets-container">
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card training-card h-100">
          <div class="card-body">
            <h5 class="card-title">Customer Support Training</h5>
            <p class="card-text">Training data for customer support scenarios.</p>
            <p class="card-text"><small class="text-muted">Domain: customer_support</small></p>
            <p class="card-text"><small class="text-muted">10 examples</small></p>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Edit</button>
              <button class="btn btn-sm btn-outline-success">Train</button>
              <button class="btn btn-sm btn-outline-danger">Delete</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card training-card h-100">
          <div class="card-body">
            <h5 class="card-title">Sales Conversations</h5>
            <p class="card-text">Training data for sales and product recommendation scenarios.</p>
            <p class="card-text"><small class="text-muted">Domain: sales</small></p>
            <p class="card-text"><small class="text-muted">15 examples</small></p>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Edit</button>
              <button class="btn btn-sm btn-outline-success">Train</button>
              <button class="btn btn-sm btn-outline-danger">Delete</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card training-card h-100">
          <div class="card-body">
            <h5 class="card-title">Technical Support</h5>
            <p class="card-text">Training data for technical troubleshooting scenarios.</p>
            <p class="card-text"><small class="text-muted">Domain: technical_support</small></p>
            <p class="card-text"><small class="text-muted">8 examples</small></p>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Edit</button>
              <button class="btn btn-sm btn-outline-success">Train</button>
              <button class="btn btn-sm btn-outline-danger">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function loadTemplatesPage(pageElement) {
  pageElement.innerHTML = `
    <div class="d-flex justify-content-between mb-4">
      <h3>Template Library</h3>
      <button class="btn btn-primary" id="create-template-btn">
        <i class="bi bi-plus-circle me-2"></i>Create New Template
      </button>
    </div>
    
    <div class="row" id="templates-container">
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">Customer Support Bot</h5>
            <p class="card-text">A pre-configured chatbot for customer support scenarios.</p>
            <div class="mt-3">
              <span class="badge bg-primary me-1">Support</span>
              <span class="badge bg-primary me-1">FAQ</span>
            </div>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Use Template</button>
              <button class="btn btn-sm btn-outline-secondary">Preview</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">Sales Assistant</h5>
            <p class="card-text">A pre-configured chatbot for sales and product recommendations.</p>
            <div class="mt-3">
              <span class="badge bg-primary me-1">Sales</span>
              <span class="badge bg-primary me-1">Products</span>
            </div>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Use Template</button>
              <button class="btn btn-sm btn-outline-secondary">Preview</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">Technical Support</h5>
            <p class="card-text">A pre-configured chatbot for technical troubleshooting.</p>
            <div class="mt-3">
              <span class="badge bg-primary me-1">Technical</span>
              <span class="badge bg-primary me-1">Troubleshooting</span>
            </div>
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-outline-primary">Use Template</button>
              <button class="btn btn-sm btn-outline-secondary">Preview</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function loadSettingsPage(pageElement) {
  pageElement.innerHTML = `
    <h3 class="mb-4">Settings</h3>
    
    <div class="card mb-4">
      <div class="card-header">
        General Settings
      </div>
      <div class="card-body">
        <form>
          <div class="mb-3">
            <label for="platform-name" class="form-label">Platform Name</label>
            <input type="text" class="form-control" id="platform-name" value="Chatbot Platform">
          </div>
          <div class="mb-3">
            <label for="default-language" class="form-label">Default Language</label>
            <select class="form-select" id="default-language">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          <div class="mb-3 form-check">
            <input type="checkbox" class="form-check-input" id="enable-analytics" checked>
            <label class="form-check-label" for="enable-analytics">Enable Analytics</label>
          </div>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
    
    <div class="card mb-4">
      <div class="card-header">
        API Settings
      </div>
      <div class="card-body">
        <form>
          <div class="mb-3">
            <label for="api-key" class="form-label">API Key</label>
            <div class="input-group">
              <input type="password" class="form-control" id="api-key" value="sk_test_12345678901234567890">
              <button class="btn btn-outline-secondary" type="button">Show</button>
              <button class="btn btn-outline-secondary" type="button">Regenerate</button>
            </div>
          </div>
          <div class="mb-3">
            <label for="webhook-url" class="form-label">Webhook URL</label>
            <input type="text" class="form-control" id="webhook-url" value="https://example.com/webhook">
          </div>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        Engine Settings
      </div>
      <div class="card-body">
        <form>
          <div class="mb-3">
            <label for="default-engine" class="form-label">Default Engine</label>
            <select class="form-select" id="default-engine">
              <option value="botpress">Botpress</option>
              <option value="huggingface">Hugging Face</option>
            </select>
          </div>
          <div class="mb-3">
            <label for="botpress-api-key" class="form-label">Botpress API Key</label>
            <input type="password" class="form-control" id="botpress-api-key" value="bp_pat_12345678901234567890">
          </div>
          <div class="mb-3">
            <label for="huggingface-api-key" class="form-label">Hugging Face API Key</label>
            <input type="password" class="form-control" id="huggingface-api-key" value="hf_12345678901234567890">
          </div>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  `;
}

// Modal functions
function openCreateChatbotModal() {
  console.log('Opening create chatbot modal...');
  // In a real application, this would open a modal for creating a new chatbot
}

function openCreateKnowledgeBaseModal() {
  console.log('Opening create knowledge base modal...');
  // In a real application, this would open a modal for creating a new knowledge base
}

function openCreatePersonalityModal() {
  console.log('Opening create personality modal...');
  // In a real application, this would open a modal for creating a new personality
}

function openInstallPluginModal() {
  console.log('Opening install plugin modal...');
  // In a real application, this would open a modal for installing a new plugin
}

function openStartTrainingModal() {
  console.log('Opening start training modal...');
  // In a real application, this would open a modal for starting a training session
}
