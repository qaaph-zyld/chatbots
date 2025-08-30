/**
 * Traffic Switching Script for Blue-Green Deployment
 * 
 * This script switches traffic from the active deployment (blue or green)
 * to the newly deployed version after successful verification tests.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const NAMESPACE = process.env.NAMESPACE || 'chatbot-platform-prod';
const DEPLOYMENT_NAME = process.env.DEPLOYMENT_NAME || 'chatbot-platform';
const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID || Date.now().toString();
const LOGS_DIR = process.env.LOGS_DIR || path.join(__dirname, '../../logs/deployment');
const CONFIG_DIR = process.env.CONFIG_DIR || path.join(__dirname, '../../config/deployment');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Logger
const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`);
    fs.appendFileSync(
      path.join(LOGS_DIR, `switch-traffic-${DEPLOYMENT_ID}.log`),
      `[${timestamp}] [INFO] ${message}\n`
    );
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, error);
    fs.appendFileSync(
      path.join(LOGS_DIR, `switch-traffic-${DEPLOYMENT_ID}.log`),
      `[${timestamp}] [ERROR] ${message}\n${error ? error.stack || error.toString() : ''}\n`
    );
  }
};

/**
 * Get current active deployment color (blue or green)
 */
function getActiveColor() {
  try {
    const configFile = path.join(CONFIG_DIR, 'active-deployment.json');
    
    if (fs.existsSync(configFile)) {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      return config.activeColor;
    }
    
    // Default to blue if no config exists
    return 'blue';
  } catch (error) {
    logger.error('Failed to get active color', error);
    // Default to blue in case of error
    return 'blue';
  }
}

/**
 * Save active deployment color
 */
function saveActiveColor(color) {
  try {
    const configFile = path.join(CONFIG_DIR, 'active-deployment.json');
    
    fs.writeFileSync(configFile, JSON.stringify({
      activeColor: color,
      lastUpdated: new Date().toISOString(),
      deploymentId: DEPLOYMENT_ID
    }, null, 2));
    
    logger.info(`Saved active color: ${color}`);
  } catch (error) {
    logger.error('Failed to save active color', error);
    throw error;
  }
}

/**
 * Switch traffic to the new deployment
 */
async function switchTraffic() {
  try {
    logger.info('Starting traffic switch...');
    
    // Get current active color
    const activeColor = getActiveColor();
    logger.info(`Current active color: ${activeColor}`);
    
    // Determine new color
    const newColor = activeColor === 'blue' ? 'green' : 'blue';
    logger.info(`Switching to ${newColor} deployment`);
    
    // Update service selector to point to the new color
    execSync(`kubectl patch service ${DEPLOYMENT_NAME} -n ${NAMESPACE} -p '{"spec":{"selector":{"color":"${newColor}"}}}' --record`);
    
    logger.info(`Traffic switched to ${newColor} deployment`);
    
    // Save new active color
    saveActiveColor(newColor);
    
    // Verify the service is pointing to the new deployment
    const serviceOutput = execSync(`kubectl get service ${DEPLOYMENT_NAME} -n ${NAMESPACE} -o json`);
    const service = JSON.parse(serviceOutput);
    
    if (service.spec.selector.color === newColor) {
      logger.info('Service selector updated successfully');
    } else {
      throw new Error(`Service selector not updated correctly. Expected ${newColor}, got ${service.spec.selector.color}`);
    }
    
    // Get endpoints to verify traffic routing
    const endpointsOutput = execSync(`kubectl get endpoints ${DEPLOYMENT_NAME} -n ${NAMESPACE} -o json`);
    const endpoints = JSON.parse(endpointsOutput);
    
    if (endpoints.subsets && endpoints.subsets.length > 0) {
      const addresses = endpoints.subsets[0].addresses || [];
      logger.info(`Endpoints: ${addresses.length} addresses found`);
      
      // Log the first few addresses for verification
      addresses.slice(0, 3).forEach((address, index) => {
        logger.info(`Endpoint ${index + 1}: ${address.ip} (${address.targetRef ? address.targetRef.name : 'unknown'})`);
      });
    } else {
      logger.error('No endpoints found for the service');
    }
    
    return {
      success: true,
      previousColor: activeColor,
      newColor,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to switch traffic', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Clean up old deployment
 */
async function cleanupOldDeployment() {
  try {
    // Get current active color
    const activeColor = getActiveColor();
    logger.info(`Current active color: ${activeColor}`);
    
    // Determine old color
    const oldColor = activeColor === 'blue' ? 'green' : 'blue';
    logger.info(`Cleaning up ${oldColor} deployment`);
    
    // Scale down the old deployment
    execSync(`kubectl scale deployment ${DEPLOYMENT_NAME}-${oldColor} -n ${NAMESPACE} --replicas=1`);
    
    logger.info(`Scaled down ${oldColor} deployment to 1 replica`);
    
    return {
      success: true,
      cleanedColor: oldColor,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to clean up old deployment', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Main function
 */
async function main() {
  logger.info(`Starting traffic switch for deployment ${DEPLOYMENT_NAME} in namespace ${NAMESPACE}`);
  
  try {
    // Switch traffic
    const switchResult = await switchTraffic();
    
    if (switchResult.success) {
      logger.info(`Traffic successfully switched from ${switchResult.previousColor} to ${switchResult.newColor}`);
      
      // Wait for a minute to ensure everything is stable
      logger.info('Waiting for 60 seconds to ensure stability...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      // Clean up old deployment
      const cleanupResult = await cleanupOldDeployment();
      
      if (cleanupResult.success) {
        logger.info(`Old deployment (${cleanupResult.cleanedColor}) cleaned up successfully`);
      } else {
        logger.error(`Failed to clean up old deployment: ${cleanupResult.error}`);
      }
      
      // Write summary to file
      const summary = {
        deploymentId: DEPLOYMENT_ID,
        namespace: NAMESPACE,
        deploymentName: DEPLOYMENT_NAME,
        switchResult,
        cleanupResult,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(
        path.join(LOGS_DIR, `switch-summary-${DEPLOYMENT_ID}.json`),
        JSON.stringify(summary, null, 2)
      );
      
      logger.info('Traffic switch completed successfully');
      process.exit(0);
    } else {
      logger.error(`Failed to switch traffic: ${switchResult.error}`);
      process.exit(1);
    }
  } catch (error) {
    logger.error('Traffic switch failed', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    logger.error('Unhandled error', error);
    process.exit(1);
  });
}

// Export functions for testing
module.exports = {
  getActiveColor,
  saveActiveColor,
  switchTraffic,
  cleanupOldDeployment
};
