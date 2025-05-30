/**
 * Training Service
 * 
 * Provides functionality for domain-specific training of chatbots
 */

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const { logger } = require('../utils');
const { localStorageService } = require('../storage');

/**
 * Training Service class
 */
class TrainingService {
  /**
   * Constructor
   * @param {Object} options - Training service options
   */
  constructor(options = {}) {
    this.options = {
      storageService: localStorageService,
      dataDir: process.env.TRAINING_DATA_DIR || path.join(process.cwd(), 'data', 'training'),
      defaultFramework: process.env.DEFAULT_TRAINING_FRAMEWORK || 'rasa',
      ...options
    };
    
    this.initialized = false;
    this.initPromise = null;
    
    // Available training frameworks
    this.frameworks = {
      rasa: {
        name: 'Rasa',
        description: 'Open source machine learning framework for automated text and voice-based conversations',
        dataFormat: 'yaml',
        supportedLanguages: ['en', 'de', 'fr', 'es', 'pt', 'it', 'nl', 'ru', 'zh', 'ja'],
        features: ['intent_classification', 'entity_extraction', 'dialogue_management']
      },
      deeppavlov: {
        name: 'DeepPavlov',
        description: 'Open-source conversational AI library built on TensorFlow',
        dataFormat: 'json',
        supportedLanguages: ['en', 'ru'],
        features: ['intent_classification', 'entity_extraction', 'question_answering']
      },
      botpress: {
        name: 'Botpress',
        description: 'Open-source conversational assistant creation platform',
        dataFormat: 'json',
        supportedLanguages: ['en', 'fr', 'es', 'de', 'pt', 'ar', 'ja', 'ru'],
        features: ['intent_classification', 'entity_extraction', 'dialogue_management', 'qna']
      }
    };
    
    logger.info('Training Service initialized');
  }
  
  /**
   * Initialize the training service
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise(async (resolve) => {
      try {
        // Initialize storage service
        await this.options.storageService.initialize();
        
        // Create data directory if it doesn't exist
        await fs.mkdir(this.options.dataDir, { recursive: true });
        
        // Create subdirectories for each framework
        for (const framework of Object.keys(this.frameworks)) {
          const frameworkDir = path.join(this.options.dataDir, framework);
          await fs.mkdir(frameworkDir, { recursive: true });
        }
        
        // Create sample training data
        await this._createSampleTrainingData();
        
        this.initialized = true;
        logger.info('Training Service initialized successfully');
        resolve(true);
      } catch (error) {
        logger.error('Error initializing Training Service:', error.message);
        resolve(false);
      }
    });
    
    return this.initPromise;
  }
  
  /**
   * Create sample training data
   * @private
   */
  async _createSampleTrainingData() {
    // Sample domains
    const domains = [
      {
        id: 'customer-support',
        name: 'Customer Support',
        description: 'Training data for customer support chatbots',
        language: 'en'
      },
      {
        id: 'e-commerce',
        name: 'E-Commerce',
        description: 'Training data for e-commerce chatbots',
        language: 'en'
      },
      {
        id: 'healthcare',
        name: 'Healthcare',
        description: 'Training data for healthcare chatbots',
        language: 'en'
      }
    ];
    
    // Create sample domains
    for (const domain of domains) {
      // Check if domain already exists
      const existingDomain = await this.options.storageService.retrieve('training_domains', domain.id);
      
      if (!existingDomain) {
        // Create domain
        await this.options.storageService.store('training_domains', domain.id, domain);
        logger.info(`Created sample training domain: ${domain.name}`);
        
        // Create sample training data files
        await this._createSampleDataFiles(domain.id);
      }
    }
  }
  
  /**
   * Create sample training data files
   * @param {string} domainId - Domain ID
   * @private
   */
  async _createSampleDataFiles(domainId) {
    // Sample Rasa data
    if (domainId === 'customer-support') {
      const rasaDir = path.join(this.options.dataDir, 'rasa', domainId);
      await fs.mkdir(rasaDir, { recursive: true });
      
      const rasaNluData = `
version: "3.1"
nlu:
- intent: greeting
  examples: |
    - hello
    - hi
    - hey
    - good morning
    - good afternoon
    - good evening

- intent: goodbye
  examples: |
    - goodbye
    - bye
    - see you later
    - have a nice day
    - talk to you later

- intent: order_status
  examples: |
    - where is my order
    - what's the status of my order
    - when will my order arrive
    - track my order
    - order status
    - check order status
    - is my order shipped
    - has my order been delivered

- intent: return_policy
  examples: |
    - what is your return policy
    - how can I return an item
    - I want to return my purchase
    - return policy
    - how do returns work
    - can I get a refund
    - refund policy

- intent: speak_to_human
  examples: |
    - I want to speak to a human
    - connect me with an agent
    - talk to a representative
    - speak to customer service
    - real person
    - human support
`;
      
      const rasaDomainData = `
version: "3.1"

intents:
  - greeting
  - goodbye
  - order_status
  - return_policy
  - speak_to_human

responses:
  utter_greeting:
    - text: "Hello! I'm your customer support assistant. How can I help you today?"
    - text: "Hi there! How can I assist you today?"
    - text: "Welcome! How may I help you?"

  utter_goodbye:
    - text: "Goodbye! Have a nice day."
    - text: "Thank you for contacting us. Have a great day!"
    - text: "Bye! Feel free to reach out if you need anything else."

  utter_order_status:
    - text: "I'd be happy to help you check your order status. Could you please provide your order number?"

  utter_return_policy:
    - text: "Our return policy allows returns within 30 days of purchase. Would you like more details about the return process?"

  utter_speak_to_human:
    - text: "I understand you'd like to speak with a human agent. I'll connect you with one of our support representatives shortly."

session_config:
  session_expiration_time: 60
  carry_over_slots_to_new_session: true
`;
      
      await fs.writeFile(path.join(rasaDir, 'nlu.yml'), rasaNluData);
      await fs.writeFile(path.join(rasaDir, 'domain.yml'), rasaDomainData);
      
      // Create training dataset record
      const rasaDataset = {
        id: `${domainId}-rasa`,
        domain_id: domainId,
        framework: 'rasa',
        name: 'Customer Support Rasa Dataset',
        description: 'Sample training data for customer support chatbots using Rasa',
        files: ['nlu.yml', 'domain.yml'],
        created_at: Date.now(),
        updated_at: Date.now()
      };
      
      await this.options.storageService.store('training_datasets', rasaDataset.id, rasaDataset);
    }
    
    // Sample DeepPavlov data
    if (domainId === 'e-commerce') {
      const deeppavlovDir = path.join(this.options.dataDir, 'deeppavlov', domainId);
      await fs.mkdir(deeppavlovDir, { recursive: true });
      
      const deeppavlovData = {
        dataset: {
          intents: {
            product_search: [
              "I'm looking for a product",
              "Do you have any shoes",
              "Show me some laptops",
              "I want to buy a phone",
              "Search for headphones",
              "Find me a dress",
              "Looking for electronics"
            ],
            price_inquiry: [
              "How much does it cost",
              "What's the price of this item",
              "How much is it",
              "Price check",
              "Tell me the price",
              "Is it expensive"
            ],
            shipping_info: [
              "When will it be delivered",
              "How long does shipping take",
              "Shipping options",
              "Do you ship internationally",
              "Shipping cost",
              "Free shipping"
            ],
            payment_methods: [
              "What payment methods do you accept",
              "Can I pay with PayPal",
              "Do you accept credit cards",
              "Payment options",
              "Can I pay on delivery"
            ],
            product_comparison: [
              "What's the difference between these products",
              "Compare these items",
              "Which one is better",
              "Pros and cons",
              "Features comparison"
            ]
          },
          entities: {
            product_category: [
              "electronics",
              "clothing",
              "shoes",
              "accessories",
              "home goods",
              "beauty",
              "sports"
            ],
            price_range: [
              "cheap",
              "affordable",
              "expensive",
              "premium",
              "budget",
              "high-end"
            ],
            brand: [
              "Nike",
              "Apple",
              "Samsung",
              "Adidas",
              "Sony",
              "Zara",
              "IKEA"
            ]
          }
        }
      };
      
      await fs.writeFile(
        path.join(deeppavlovDir, 'dataset.json'),
        JSON.stringify(deeppavlovData, null, 2)
      );
      
      // Create training dataset record
      const deeppavlovDataset = {
        id: `${domainId}-deeppavlov`,
        domain_id: domainId,
        framework: 'deeppavlov',
        name: 'E-Commerce DeepPavlov Dataset',
        description: 'Sample training data for e-commerce chatbots using DeepPavlov',
        files: ['dataset.json'],
        created_at: Date.now(),
        updated_at: Date.now()
      };
      
      await this.options.storageService.store('training_datasets', deeppavlovDataset.id, deeppavlovDataset);
    }
    
    // Sample Botpress data
    if (domainId === 'healthcare') {
      const botpressDir = path.join(this.options.dataDir, 'botpress', domainId);
      await fs.mkdir(botpressDir, { recursive: true });
      
      const botpressData = {
        intents: [
          {
            name: "appointment_scheduling",
            utterances: [
              "I need to schedule an appointment",
              "Book an appointment",
              "I want to see a doctor",
              "Schedule a consultation",
              "Make an appointment",
              "Book a visit",
              "Schedule a checkup"
            ]
          },
          {
            name: "medical_symptoms",
            utterances: [
              "I have a headache",
              "My stomach hurts",
              "I'm feeling dizzy",
              "I have a fever",
              "My throat is sore",
              "I'm having chest pain",
              "I have a cough"
            ]
          },
          {
            name: "medication_inquiry",
            utterances: [
              "Information about medication",
              "What are the side effects of this medicine",
              "How should I take this medication",
              "Drug interactions",
              "Prescription refill",
              "Is this medication safe"
            ]
          },
          {
            name: "insurance_coverage",
            utterances: [
              "Does my insurance cover this",
              "Insurance information",
              "Coverage details",
              "Is this procedure covered",
              "Insurance claim",
              "Out-of-pocket costs"
            ]
          }
        ],
        entities: [
          {
            name: "specialist_type",
            values: [
              {
                name: "cardiologist",
                synonyms: ["heart doctor", "heart specialist"]
              },
              {
                name: "dermatologist",
                synonyms: ["skin doctor", "skin specialist"]
              },
              {
                name: "neurologist",
                synonyms: ["brain doctor", "nerve specialist"]
              },
              {
                name: "pediatrician",
                synonyms: ["children's doctor", "child specialist"]
              },
              {
                name: "orthopedist",
                synonyms: ["bone doctor", "joint specialist"]
              }
            ]
          },
          {
            name: "symptom_severity",
            values: [
              {
                name: "mild",
                synonyms: ["slight", "minor", "not serious"]
              },
              {
                name: "moderate",
                synonyms: ["medium", "average"]
              },
              {
                name: "severe",
                synonyms: ["serious", "intense", "extreme"]
              }
            ]
          }
        ],
        qna: [
          {
            question: "What are your office hours?",
            answer: "Our office is open Monday to Friday from 8:00 AM to 6:00 PM, and Saturday from 9:00 AM to 1:00 PM. We are closed on Sundays and holidays."
          },
          {
            question: "Do I need a referral to see a specialist?",
            answer: "It depends on your insurance plan. Some plans require a referral from your primary care physician, while others allow direct access to specialists. We recommend checking with your insurance provider."
          },
          {
            question: "How do I prepare for a blood test?",
            answer: "For most blood tests, you'll need to fast for 8-12 hours beforehand. Drink plenty of water and avoid alcohol the day before. Bring your insurance card and any paperwork from your doctor."
          }
        ]
      };
      
      await fs.writeFile(
        path.join(botpressDir, 'training_data.json'),
        JSON.stringify(botpressData, null, 2)
      );
      
      // Create training dataset record
      const botpressDataset = {
        id: `${domainId}-botpress`,
        domain_id: domainId,
        framework: 'botpress',
        name: 'Healthcare Botpress Dataset',
        description: 'Sample training data for healthcare chatbots using Botpress',
        files: ['training_data.json'],
        created_at: Date.now(),
        updated_at: Date.now()
      };
      
      await this.options.storageService.store('training_datasets', botpressDataset.id, botpressDataset);
    }
  }
  
  /**
   * Get all training domains
   * @param {Object} query - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of training domains
   */
  async getAllDomains(query = {}, options = {}) {
    await this.initialize();
    
    return this.options.storageService.query('training_domains', query, options);
  }
  
  /**
   * Get domain by ID
   * @param {string} id - Domain ID
   * @returns {Promise<Object|null>} - Domain or null if not found
   */
  async getDomainById(id) {
    await this.initialize();
    
    return this.options.storageService.retrieve('training_domains', id);
  }
  
  /**
   * Create a new training domain
   * @param {Object} domain - Domain data
   * @returns {Promise<Object>} - Created domain
   */
  async createDomain(domain) {
    await this.initialize();
    
    const domainId = domain.id || uuidv4();
    
    // Validate domain
    this._validateDomain(domain);
    
    // Store domain
    return this.options.storageService.store('training_domains', domainId, {
      ...domain,
      id: domainId,
      created_at: Date.now(),
      updated_at: Date.now()
    });
  }
  
  /**
   * Update an existing training domain
   * @param {string} id - Domain ID
   * @param {Object} domain - Domain data
   * @returns {Promise<Object|null>} - Updated domain or null if not found
   */
  async updateDomain(id, domain) {
    await this.initialize();
    
    // Check if domain exists
    const existingDomain = await this.options.storageService.retrieve('training_domains', id);
    
    if (!existingDomain) {
      logger.warn(`Domain not found: ${id}`);
      return null;
    }
    
    // Validate domain
    this._validateDomain(domain);
    
    // Update domain
    return this.options.storageService.store('training_domains', id, {
      ...existingDomain,
      ...domain,
      id, // Ensure ID remains the same
      updated_at: Date.now()
    });
  }
  
  /**
   * Delete a training domain
   * @param {string} id - Domain ID
   * @returns {Promise<boolean>} - Whether deletion was successful
   */
  async deleteDomain(id) {
    await this.initialize();
    
    // Get all datasets for this domain
    const datasets = await this.options.storageService.query('training_datasets', { domain_id: id });
    
    // Delete all datasets for this domain
    for (const dataset of datasets) {
      await this.deleteDataset(dataset.id);
    }
    
    // Delete domain
    return this.options.storageService.delete('training_domains', id);
  }
  
  /**
   * Get all training datasets
   * @param {Object} query - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of training datasets
   */
  async getAllDatasets(query = {}, options = {}) {
    await this.initialize();
    
    return this.options.storageService.query('training_datasets', query, options);
  }
  
  /**
   * Get dataset by ID
   * @param {string} id - Dataset ID
   * @returns {Promise<Object|null>} - Dataset or null if not found
   */
  async getDatasetById(id) {
    await this.initialize();
    
    return this.options.storageService.retrieve('training_datasets', id);
  }
  
  /**
   * Create a new training dataset
   * @param {Object} dataset - Dataset data
   * @param {Buffer|null} fileData - Dataset file data (optional)
   * @param {string|null} fileName - Dataset file name (optional)
   * @returns {Promise<Object>} - Created dataset
   */
  async createDataset(dataset, fileData = null, fileName = null) {
    await this.initialize();
    
    const datasetId = dataset.id || uuidv4();
    
    // Validate dataset
    this._validateDataset(dataset);
    
    // Check if domain exists
    const domain = await this.options.storageService.retrieve('training_domains', dataset.domain_id);
    
    if (!domain) {
      throw new Error(`Domain not found: ${dataset.domain_id}`);
    }
    
    // Create dataset directory
    const datasetDir = path.join(
      this.options.dataDir,
      dataset.framework,
      dataset.domain_id
    );
    
    await fs.mkdir(datasetDir, { recursive: true });
    
    // If file data is provided, save it
    if (fileData && fileName) {
      await fs.writeFile(path.join(datasetDir, fileName), fileData);
      
      // Add file to dataset files
      dataset.files = dataset.files || [];
      if (!dataset.files.includes(fileName)) {
        dataset.files.push(fileName);
      }
    }
    
    // Store dataset
    return this.options.storageService.store('training_datasets', datasetId, {
      ...dataset,
      id: datasetId,
      created_at: Date.now(),
      updated_at: Date.now()
    });
  }
  
  /**
   * Update an existing training dataset
   * @param {string} id - Dataset ID
   * @param {Object} dataset - Dataset data
   * @param {Buffer|null} fileData - Dataset file data (optional)
   * @param {string|null} fileName - Dataset file name (optional)
   * @returns {Promise<Object|null>} - Updated dataset or null if not found
   */
  async updateDataset(id, dataset, fileData = null, fileName = null) {
    await this.initialize();
    
    // Check if dataset exists
    const existingDataset = await this.options.storageService.retrieve('training_datasets', id);
    
    if (!existingDataset) {
      logger.warn(`Dataset not found: ${id}`);
      return null;
    }
    
    // Validate dataset
    this._validateDataset(dataset);
    
    // If file data is provided, save it
    if (fileData && fileName) {
      const datasetDir = path.join(
        this.options.dataDir,
        existingDataset.framework,
        existingDataset.domain_id
      );
      
      await fs.writeFile(path.join(datasetDir, fileName), fileData);
      
      // Add file to dataset files
      dataset.files = dataset.files || [...(existingDataset.files || [])];
      if (!dataset.files.includes(fileName)) {
        dataset.files.push(fileName);
      }
    }
    
    // Update dataset
    return this.options.storageService.store('training_datasets', id, {
      ...existingDataset,
      ...dataset,
      id, // Ensure ID remains the same
      updated_at: Date.now()
    });
  }
  
  /**
   * Delete a training dataset
   * @param {string} id - Dataset ID
   * @returns {Promise<boolean>} - Whether deletion was successful
   */
  async deleteDataset(id) {
    await this.initialize();
    
    // Get dataset
    const dataset = await this.options.storageService.retrieve('training_datasets', id);
    
    if (!dataset) {
      logger.warn(`Dataset not found: ${id}`);
      return false;
    }
    
    // Delete dataset files
    if (dataset.files && dataset.files.length > 0) {
      const datasetDir = path.join(
        this.options.dataDir,
        dataset.framework,
        dataset.domain_id
      );
      
      for (const file of dataset.files) {
        try {
          await fs.unlink(path.join(datasetDir, file));
        } catch (error) {
          logger.warn(`Error deleting dataset file: ${file}`, error.message);
        }
      }
    }
    
    // Delete dataset
    return this.options.storageService.delete('training_datasets', id);
  }
  
  /**
   * Get dataset file content
   * @param {string} datasetId - Dataset ID
   * @param {string} fileName - File name
   * @returns {Promise<Buffer|null>} - File content or null if not found
   */
  async getDatasetFile(datasetId, fileName) {
    await this.initialize();
    
    // Get dataset
    const dataset = await this.options.storageService.retrieve('training_datasets', datasetId);
    
    if (!dataset) {
      logger.warn(`Dataset not found: ${datasetId}`);
      return null;
    }
    
    // Check if file exists in dataset
    if (!dataset.files || !dataset.files.includes(fileName)) {
      logger.warn(`File not found in dataset: ${fileName}`);
      return null;
    }
    
    // Get file content
    const filePath = path.join(
      this.options.dataDir,
      dataset.framework,
      dataset.domain_id,
      fileName
    );
    
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      logger.error(`Error reading dataset file: ${filePath}`, error.message);
      return null;
    }
  }
  
  /**
   * Train a bot using a specific dataset
   * @param {string} botId - Bot ID
   * @param {string} datasetId - Dataset ID
   * @returns {Promise<Object>} - Training result
   */
  async trainBot(botId, datasetId) {
    await this.initialize();
    
    // Get bot
    const bot = await this.options.storageService.retrieve('bots', botId);
    
    if (!bot) {
      throw new Error(`Bot not found: ${botId}`);
    }
    
    // Get dataset
    const dataset = await this.options.storageService.retrieve('training_datasets', datasetId);
    
    if (!dataset) {
      throw new Error(`Dataset not found: ${datasetId}`);
    }
    
    // Get domain
    const domain = await this.options.storageService.retrieve('training_domains', dataset.domain_id);
    
    if (!domain) {
      throw new Error(`Domain not found: ${dataset.domain_id}`);
    }
    
    // Create training job
    const trainingJob = {
      id: uuidv4(),
      bot_id: botId,
      dataset_id: datasetId,
      domain_id: dataset.domain_id,
      framework: dataset.framework,
      status: 'pending',
      created_at: Date.now(),
      updated_at: Date.now()
    };
    
    await this.options.storageService.store('training_jobs', trainingJob.id, trainingJob);
    
    // In a real implementation, we would start the training process here
    // For now, we'll simulate a successful training
    
    // Update training job status
    trainingJob.status = 'completed';
    trainingJob.completed_at = Date.now();
    trainingJob.updated_at = Date.now();
    
    await this.options.storageService.store('training_jobs', trainingJob.id, trainingJob);
    
    // Update bot with training information
    const updatedBot = {
      ...bot,
      training: {
        last_trained_at: Date.now(),
        dataset_id: datasetId,
        domain_id: dataset.domain_id,
        framework: dataset.framework
      },
      updated_at: Date.now()
    };
    
    await this.options.storageService.store('bots', botId, updatedBot);
    
    return {
      success: true,
      training_job: trainingJob,
      bot: updatedBot
    };
  }
  
  /**
   * Get all training jobs
   * @param {Object} query - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of training jobs
   */
  async getAllTrainingJobs(query = {}, options = {}) {
    await this.initialize();
    
    return this.options.storageService.query('training_jobs', query, options);
  }
  
  /**
   * Get training job by ID
   * @param {string} id - Training job ID
   * @returns {Promise<Object|null>} - Training job or null if not found
   */
  async getTrainingJobById(id) {
    await this.initialize();
    
    return this.options.storageService.retrieve('training_jobs', id);
  }
  
  /**
   * Get available training frameworks
   * @returns {Object} - Available frameworks
   */
  getFrameworks() {
    return this.frameworks;
  }
  
  /**
   * Validate a domain
   * @param {Object} domain - Domain to validate
   * @throws {Error} - If domain is invalid
   * @private
   */
  _validateDomain(domain) {
    if (!domain.name) {
      throw new Error('Domain name is required');
    }
    
    if (!domain.language) {
      throw new Error('Domain language is required');
    }
  }
  
  /**
   * Validate a dataset
   * @param {Object} dataset - Dataset to validate
   * @throws {Error} - If dataset is invalid
   * @private
   */
  _validateDataset(dataset) {
    if (!dataset.name) {
      throw new Error('Dataset name is required');
    }
    
    if (!dataset.domain_id) {
      throw new Error('Dataset domain ID is required');
    }
    
    if (!dataset.framework) {
      throw new Error('Dataset framework is required');
    }
    
    // Check if framework is supported
    if (!this.frameworks[dataset.framework]) {
      throw new Error(`Unsupported framework: ${dataset.framework}`);
    }
  }
}

// Create singleton instance
const trainingService = new TrainingService();

module.exports = trainingService;
