/**
 * Script to set up the User Acceptance Testing (UAT) environment
 * 
 * This script prepares a UAT environment with test data, configurations,
 * and necessary infrastructure for conducting user acceptance testing.
 * 
 * Usage: node src/scripts/setup-uat-environment.js [--reset] [--sample-data]
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const mongoose = require('mongoose');
require('@src/utils\logger');
require('@src/config');

// Models
require('@src/models\user.model');
require('@src/models\chatbot.model');
require('@src/models\knowledge-base.model');
require('@src/models\personality.model');
require('@src/models\plugin.model');
require('@src/models\training-dataset.model');

// Parse command line arguments
const args = process.argv.slice(2);
const resetEnvironment = args.includes('--reset');
const includeSampleData = args.includes('--sample-data');

// Configuration for UAT environment
const uatConfig = {
  databaseUri: process.env.UAT_MONGODB_URI || 'mongodb://localhost:27017/chatbot-platform-uat',
  port: process.env.UAT_PORT || 3001,
  jwtSecret: process.env.UAT_JWT_SECRET || 'uat-secret-key',
  adminUser: {
    username: 'admin',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin'
  },
  testUsers: [
    {
      username: 'creator',
      email: 'creator@example.com',
      password: 'Creator123!',
      role: 'creator'
    },
    {
      username: 'user',
      email: 'user@example.com',
      password: 'User123!',
      role: 'user'
    }
  ]
};

/**
 * Main function to set up the UAT environment
 */
async function setupUatEnvironment() {
  try {
    logger.info('Starting UAT environment setup');
    
    // Connect to the UAT database
    await connectToDatabase();
    
    // Reset the environment if requested
    if (resetEnvironment) {
      await resetDatabase();
    }
    
    // Create UAT configuration file
    await createUatConfig();
    
    // Create test users
    await createTestUsers();
    
    // Create sample data if requested
    if (includeSampleData) {
      await createSampleData();
    }
    
    // Set up UAT server instance
    await setupUatServer();
    
    logger.info('UAT environment setup completed successfully');
    logger.info('UAT server is running at http://localhost:' + uatConfig.port);
    logger.info('Admin credentials: ' + uatConfig.adminUser.email + ' / ' + uatConfig.adminUser.password);
    
    return {
      success: true,
      message: 'UAT environment setup completed successfully',
      serverUrl: 'http://localhost:' + uatConfig.port,
      adminCredentials: {
        email: uatConfig.adminUser.email,
        password: uatConfig.adminUser.password
      }
    };
  } catch (error) {
    logger.error('Error setting up UAT environment', error);
    throw error;
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

/**
 * Connect to the UAT database
 */
async function connectToDatabase() {
  try {
    logger.info('Connecting to UAT database: ' + uatConfig.databaseUri);
    
    await mongoose.connect(uatConfig.databaseUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info('Connected to UAT database');
  } catch (error) {
    logger.error('Error connecting to UAT database', error);
    throw error;
  }
}

/**
 * Reset the UAT database
 */
async function resetDatabase() {
  try {
    logger.info('Resetting UAT database');
    
    // Drop the database
    await mongoose.connection.dropDatabase();
    
    logger.info('UAT database reset completed');
  } catch (error) {
    logger.error('Error resetting UAT database', error);
    throw error;
  }
}

/**
 * Create UAT configuration file
 */
async function createUatConfig() {
  try {
    logger.info('Creating UAT configuration file');
    
    const configFilePath = path.join(__dirname, '../../config/uat.env');
    const configContent = `
PORT=${uatConfig.port}
MONGODB_URI=${uatConfig.databaseUri}
JWT_SECRET=${uatConfig.jwtSecret}
NODE_ENV=uat
LOG_LEVEL=debug
ENABLE_SWAGGER=true
`;
    
    fs.writeFileSync(configFilePath, configContent);
    
    logger.info('UAT configuration file created: ' + configFilePath);
  } catch (error) {
    logger.error('Error creating UAT configuration file', error);
    throw error;
  }
}

/**
 * Create test users for UAT
 */
async function createTestUsers() {
  try {
    logger.info('Creating test users for UAT');
    
    // Create admin user
    const adminExists = await User.findOne({ email: uatConfig.adminUser.email });
    if (!adminExists) {
      const admin = new User(uatConfig.adminUser);
      await admin.save();
      logger.info('Admin user created: ' + uatConfig.adminUser.email);
    } else {
      logger.info('Admin user already exists: ' + uatConfig.adminUser.email);
    }
    
    // Create test users
    for (const userData of uatConfig.testUsers) {
      const userExists = await User.findOne({ email: userData.email });
      if (!userExists) {
        const user = new User(userData);
        await user.save();
        logger.info('Test user created: ' + userData.email);
      } else {
        logger.info('Test user already exists: ' + userData.email);
      }
    }
    
    logger.info('Test users created successfully');
  } catch (error) {
    logger.error('Error creating test users', error);
    throw error;
  }
}

/**
 * Create sample data for UAT
 */
async function createSampleData() {
  try {
    logger.info('Creating sample data for UAT');
    
    // Get user IDs
    const admin = await User.findOne({ email: uatConfig.adminUser.email });
    const creator = await User.findOne({ email: uatConfig.testUsers[0].email });
    
    if (!admin || !creator) {
      throw new Error('Required users not found');
    }
    
    // Create sample personalities
    const personalities = [
      {
        name: 'Professional',
        description: 'A formal, professional personality for business chatbots',
        traits: {
          formality: 0.9,
          humor: 0.2,
          empathy: 0.6,
          creativity: 0.4
        },
        tone: 'professional',
        owner: admin._id
      },
      {
        name: 'Friendly',
        description: 'A warm, friendly personality for customer service',
        traits: {
          formality: 0.4,
          humor: 0.7,
          empathy: 0.9,
          creativity: 0.6
        },
        tone: 'friendly',
        owner: creator._id
      },
      {
        name: 'Technical',
        description: 'A detailed, technical personality for support chatbots',
        traits: {
          formality: 0.7,
          humor: 0.3,
          empathy: 0.5,
          creativity: 0.3
        },
        tone: 'technical',
        owner: creator._id
      }
    ];
    
    for (const personalityData of personalities) {
      const personalityExists = await Personality.findOne({ name: personalityData.name, owner: personalityData.owner });
      if (!personalityExists) {
        const personality = new Personality(personalityData);
        await personality.save();
        logger.info('Sample personality created: ' + personalityData.name);
      } else {
        logger.info('Sample personality already exists: ' + personalityData.name);
      }
    }
    
    // Create sample chatbots
    const professionalPersonality = await Personality.findOne({ name: 'Professional' });
    const friendlyPersonality = await Personality.findOne({ name: 'Friendly' });
    
    const chatbots = [
      {
        name: 'Customer Support Bot',
        description: 'A chatbot for handling customer support inquiries',
        owner: admin._id,
        status: 'active',
        settings: {
          language: 'en',
          defaultPersonality: friendlyPersonality._id,
          maxContextLength: 10
        }
      },
      {
        name: 'Sales Assistant',
        description: 'A chatbot for assisting with sales inquiries',
        owner: creator._id,
        status: 'active',
        settings: {
          language: 'en',
          defaultPersonality: professionalPersonality._id,
          maxContextLength: 15
        }
      }
    ];
    
    for (const chatbotData of chatbots) {
      const chatbotExists = await Chatbot.findOne({ name: chatbotData.name, owner: chatbotData.owner });
      if (!chatbotExists) {
        const chatbot = new Chatbot(chatbotData);
        await chatbot.save();
        logger.info('Sample chatbot created: ' + chatbotData.name);
      } else {
        logger.info('Sample chatbot already exists: ' + chatbotData.name);
      }
    }
    
    // Create sample knowledge bases
    const customerSupportBot = await Chatbot.findOne({ name: 'Customer Support Bot' });
    const salesAssistantBot = await Chatbot.findOne({ name: 'Sales Assistant' });
    
    const knowledgeBases = [
      {
        name: 'Product FAQs',
        description: 'Frequently asked questions about our products',
        chatbotId: customerSupportBot._id,
        type: 'faq',
        owner: admin._id
      },
      {
        name: 'Sales Information',
        description: 'Information about pricing, promotions, and sales processes',
        chatbotId: salesAssistantBot._id,
        type: 'document',
        owner: creator._id
      }
    ];
    
    for (const kbData of knowledgeBases) {
      const kbExists = await KnowledgeBase.findOne({ name: kbData.name, chatbotId: kbData.chatbotId });
      if (!kbExists) {
        const kb = new KnowledgeBase(kbData);
        await kb.save();
        logger.info('Sample knowledge base created: ' + kbData.name);
      } else {
        logger.info('Sample knowledge base already exists: ' + kbData.name);
      }
    }
    
    // Create sample plugins
    const plugins = [
      {
        name: 'Sentiment Analysis',
        description: 'Analyzes sentiment in user messages',
        version: '1.0.0',
        status: 'active',
        config: {
          threshold: 0.5,
          languages: ['en']
        },
        owner: admin._id
      },
      {
        name: 'Weather Integration',
        description: 'Provides weather information based on location',
        version: '1.0.0',
        status: 'active',
        config: {
          apiKey: 'sample-api-key',
          units: 'metric'
        },
        owner: creator._id
      }
    ];
    
    for (const pluginData of plugins) {
      const pluginExists = await Plugin.findOne({ name: pluginData.name, owner: pluginData.owner });
      if (!pluginExists) {
        const plugin = new Plugin(pluginData);
        await plugin.save();
        logger.info('Sample plugin created: ' + pluginData.name);
      } else {
        logger.info('Sample plugin already exists: ' + pluginData.name);
      }
    }
    
    // Create sample training datasets
    const trainingDatasets = [
      {
        name: 'Customer Support Training',
        description: 'Training data for customer support scenarios',
        chatbotId: customerSupportBot._id,
        type: 'conversation',
        status: 'trained',
        owner: admin._id
      },
      {
        name: 'Sales Inquiries',
        description: 'Training data for handling sales inquiries',
        chatbotId: salesAssistantBot._id,
        type: 'qa',
        status: 'ready',
        owner: creator._id
      }
    ];
    
    for (const datasetData of trainingDatasets) {
      const datasetExists = await TrainingDataset.findOne({ name: datasetData.name, chatbotId: datasetData.chatbotId });
      if (!datasetExists) {
        const dataset = new TrainingDataset(datasetData);
        await dataset.save();
        logger.info('Sample training dataset created: ' + datasetData.name);
      } else {
        logger.info('Sample training dataset already exists: ' + datasetData.name);
      }
    }
    
    logger.info('Sample data created successfully');
  } catch (error) {
    logger.error('Error creating sample data', error);
    throw error;
  }
}

/**
 * Set up UAT server instance
 */
async function setupUatServer() {
  try {
    logger.info('Setting up UAT server instance');
    
    // Create UAT server script
    const serverScriptPath = path.join(__dirname, '../../src/scripts/start-uat-server.js');
    const serverScriptContent = `/**
 * Script to start the UAT server
 */

require('dotenv').config({ path: './config/uat.env' });
require('@src/app');
require('@src/utils\logger');

const port = process.env.PORT || 3001;

// Start the server
const server = app.listen(port, () => {
  logger.info(\`UAT server running on port \${port}\`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing UAT server');
  server.close(() => {
    logger.info('UAT server closed');
    process.exit(0);
  });
});
`;
    
    fs.writeFileSync(serverScriptPath, serverScriptContent);
    logger.info('UAT server script created: ' + serverScriptPath);
    
    // Add script to package.json
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = require(packageJsonPath);
    
    if (!packageJson.scripts['start:uat']) {
      packageJson.scripts['start:uat'] = 'node src/scripts/start-uat-server.js';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      logger.info('Added start:uat script to package.json');
    }
    
    logger.info('UAT server setup completed');
  } catch (error) {
    logger.error('Error setting up UAT server', error);
    throw error;
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupUatEnvironment()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = setupUatEnvironment;
}
