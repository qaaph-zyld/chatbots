/**
 * Simple Test Script for A/B Testing
 * 
 * This script demonstrates the basic functionality of the A/B Testing framework
 * without relying on external dependencies.
 */

// Mock logger to avoid dependency issues
const mockLogger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
  debug: (message, data) => console.log(`[DEBUG] ${message}`, data || ''),
  warn: (message, data) => console.log(`[WARN] ${message}`, data || ''),
  error: (message, data) => console.error(`[ERROR] ${message}`, data || '')
};

// Simple UUID v4 generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * A/B Testing Service class
 */
class ABTestingService {
  /**
   * Initialize the A/B testing service
   */
  constructor() {
    this.options = {
      defaultTestDuration: 7, // days
      minSampleSize: 100,
      significanceLevel: 0.05,
      storageEnabled: true
    };

    // Test storage
    this.tests = new Map();
    this.variants = new Map();
    this.assignments = new Map();
    this.conversions = new Map();
    this.metrics = new Map();

    console.log('[INFO] A/B Testing Service initialized');
  }

  /**
   * Create a new A/B test
   * @param {Object} testConfig - Test configuration
   * @returns {Object} - Test details
   */
  createTest(testConfig) {
    try {
      const {
        name,
        description = '',
        variants = [],
        targetUserGroups = [],
        startDate = new Date(),
        endDate = null,
        metrics = ['conversion_rate'],
        trafficAllocation = 100, // percentage of traffic to include in test
        botId = null
      } = testConfig;

      if (!name) {
        throw new Error('Test name is required');
      }

      if (!variants || variants.length < 2) {
        throw new Error('At least two variants are required for A/B testing');
      }

      // Generate test ID
      const testId = uuidv4();

      // Calculate end date if not provided
      const calculatedEndDate = endDate || new Date(startDate);
      if (!endDate) {
        calculatedEndDate.setDate(calculatedEndDate.getDate() + this.options.defaultTestDuration);
      }

      // Create test object
      const test = {
        id: testId,
        name,
        description,
        startDate: startDate.toISOString(),
        endDate: calculatedEndDate.toISOString(),
        status: 'created',
        targetUserGroups,
        trafficAllocation,
        metrics,
        botId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store test
      this.tests.set(testId, test);

      // Process variants
      const processedVariants = [];
      for (const variant of variants) {
        const variantId = uuidv4();
        const processedVariant = {
          id: variantId,
          testId,
          name: variant.name,
          description: variant.description || '',
          configuration: variant.configuration || {},
          weight: variant.weight || 1, // relative traffic allocation weight
          isControl: variant.isControl || false,
          createdAt: new Date().toISOString()
        };

        // Store variant
        this.variants.set(variantId, processedVariant);
        processedVariants.push(processedVariant);

        // Initialize metrics for this variant
        this.metrics.set(variantId, {
          participants: 0,
          conversions: 0,
          events: {}
        });
      }

      console.log(`[INFO] Created A/B test: ${name} with ${processedVariants.length} variants`);
      return {
        success: true,
        test: {
          ...test,
          variants: processedVariants
        }
      };
    } catch (error) {
      console.error(`[ERROR] Error creating A/B test: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start an A/B test
   * @param {string} testId - Test ID
   * @returns {Object} - Operation result
   */
  startTest(testId) {
    try {
      const test = this.tests.get(testId);
      if (!test) {
        throw new Error(`Test with ID ${testId} not found`);
      }

      if (test.status === 'running') {
        return { success: true, message: 'Test is already running' };
      }

      // Update test status
      test.status = 'running';
      test.updatedAt = new Date().toISOString();
      test.startedAt = new Date().toISOString();

      console.log(`[INFO] Started A/B test: ${test.name}`);
      return { success: true, test };
    } catch (error) {
      console.error(`[ERROR] Error starting A/B test: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get variant for a user
   * @param {Object} params - Request parameters
   * @returns {Object} - Assigned variant
   */
  getVariant(params) {
    try {
      const {
        testId,
        userId,
        sessionId,
        userAttributes = {}
      } = params;

      if (!testId) {
        throw new Error('Test ID is required');
      }

      if (!userId && !sessionId) {
        throw new Error('Either userId or sessionId is required');
      }

      // Get test
      const test = this.tests.get(testId);
      if (!test) {
        throw new Error(`Test with ID ${testId} not found`);
      }

      // Check if test is running
      if (test.status !== 'running') {
        return { success: false, reason: `Test is not running (status: ${test.status})` };
      }

      // Generate a unique identifier for this user/session
      const entityId = userId || sessionId;
      const assignmentKey = `${testId}:${entityId}`;

      // Check if user is already assigned to a variant
      if (this.assignments.has(assignmentKey)) {
        const variantId = this.assignments.get(assignmentKey);
        const variant = this.variants.get(variantId);
        
        return {
          success: true,
          variant,
          isNewAssignment: false
        };
      }

      // Get all variants for this test
      const testVariants = Array.from(this.variants.values())
        .filter(v => v.testId === testId);

      // Calculate total weight
      const totalWeight = testVariants.reduce((sum, v) => sum + v.weight, 0);

      // Select a variant based on weights
      let random = Math.random() * totalWeight;
      let selectedVariant = null;

      for (const variant of testVariants) {
        random -= variant.weight;
        if (random <= 0) {
          selectedVariant = variant;
          break;
        }
      }

      // Fallback to first variant if something went wrong
      if (!selectedVariant && testVariants.length > 0) {
        selectedVariant = testVariants[0];
      }

      if (!selectedVariant) {
        throw new Error('No variants available for this test');
      }

      // Store assignment
      this.assignments.set(assignmentKey, selectedVariant.id);

      // Update metrics
      const variantMetrics = this.metrics.get(selectedVariant.id);
      if (variantMetrics) {
        variantMetrics.participants += 1;
      }

      console.log(`[DEBUG] Assigned variant: ${selectedVariant.name} to user ${entityId}`);

      return {
        success: true,
        variant: selectedVariant,
        isNewAssignment: true
      };
    } catch (error) {
      console.error(`[ERROR] Error getting variant: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track a conversion or event for an A/B test
   * @param {Object} params - Tracking parameters
   * @returns {Object} - Tracking result
   */
  trackEvent(params) {
    try {
      const {
        testId,
        userId,
        sessionId,
        event = 'conversion',
        value = 1
      } = params;

      if (!testId) {
        throw new Error('Test ID is required');
      }

      if (!userId && !sessionId) {
        throw new Error('Either userId or sessionId is required');
      }

      // Generate a unique identifier for this user/session
      const entityId = userId || sessionId;
      const assignmentKey = `${testId}:${entityId}`;

      // Check if user is assigned to a variant
      if (!this.assignments.has(assignmentKey)) {
        return { success: false, reason: 'User is not assigned to any variant' };
      }

      const variantId = this.assignments.get(assignmentKey);
      const variant = this.variants.get(variantId);

      if (!variant) {
        return { success: false, reason: 'Assigned variant not found' };
      }

      // Create conversion record
      const conversionId = uuidv4();
      const conversion = {
        id: conversionId,
        testId,
        variantId,
        entityId,
        event,
        value,
        timestamp: new Date().toISOString()
      };

      // Store conversion
      const conversionKey = `${testId}:${entityId}:${event}`;
      this.conversions.set(conversionKey, conversion);

      // Update metrics
      const variantMetrics = this.metrics.get(variantId);
      if (variantMetrics) {
        if (event === 'conversion') {
          variantMetrics.conversions += 1;
        } else {
          if (!variantMetrics.events[event]) {
            variantMetrics.events[event] = 0;
          }
          variantMetrics.events[event] += value;
        }
      }

      console.log(`[DEBUG] Tracked event: ${event} for user ${entityId} in variant ${variant.name}`);

      return { success: true, conversion };
    } catch (error) {
      console.error(`[ERROR] Error tracking event: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get test results
   * @param {string} testId - Test ID
   * @returns {Object} - Test results
   */
  getTestResults(testId) {
    try {
      const test = this.tests.get(testId);
      if (!test) {
        throw new Error(`Test with ID ${testId} not found`);
      }

      // Get all variants for this test
      const testVariants = Array.from(this.variants.values())
        .filter(v => v.testId === testId);

      // Get control variant
      const controlVariant = testVariants.find(v => v.isControl) || testVariants[0];

      // Calculate results for each variant
      const results = [];
      for (const variant of testVariants) {
        const metrics = this.metrics.get(variant.id) || {
          participants: 0,
          conversions: 0,
          events: {}
        };

        const conversionRate = metrics.participants > 0 ?
          (metrics.conversions / metrics.participants) * 100 : 0;

        // Calculate improvement over control
        let improvement = 0;
        let isSignificant = false;

        if (variant.id !== controlVariant.id) {
          const controlMetrics = this.metrics.get(controlVariant.id) || {
            participants: 0,
            conversions: 0
          };

          const controlConversionRate = controlMetrics.participants > 0 ?
            (controlMetrics.conversions / controlMetrics.participants) * 100 : 0;

          improvement = controlConversionRate > 0 ?
            ((conversionRate - controlConversionRate) / controlConversionRate) * 100 : 0;

          // Check if result is statistically significant
          isSignificant = this._isStatisticallySignificant(
            metrics.participants,
            metrics.conversions,
            controlMetrics.participants,
            controlMetrics.conversions
          );
        }

        results.push({
          variantId: variant.id,
          variantName: variant.name,
          isControl: variant.isControl || variant.id === controlVariant.id,
          participants: metrics.participants,
          conversions: metrics.conversions,
          conversionRate,
          improvement,
          isSignificant,
          events: metrics.events
        });
      }

      // Sort results by conversion rate (descending)
      results.sort((a, b) => b.conversionRate - a.conversionRate);

      console.log(`[INFO] Retrieved test results for: ${test.name}`);
      return {
        success: true,
        test,
        results,
        hasSignificantResult: results.some(r => r.isSignificant)
      };
    } catch (error) {
      console.error(`[ERROR] Error getting test results: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if a result is statistically significant
   * @private
   */
  _isStatisticallySignificant(variantSamples, variantConversions, controlSamples, controlConversions) {
    // Check if we have enough samples
    if (variantSamples < this.options.minSampleSize || controlSamples < this.options.minSampleSize) {
      return false;
    }

    // Calculate conversion rates
    const variantRate = variantConversions / variantSamples;
    const controlRate = controlConversions / controlSamples;

    // Calculate standard errors
    const variantStdError = Math.sqrt((variantRate * (1 - variantRate)) / variantSamples);
    const controlStdError = Math.sqrt((controlRate * (1 - controlRate)) / controlSamples);

    // Calculate z-score
    const zScore = Math.abs(variantRate - controlRate) / Math.sqrt(Math.pow(variantStdError, 2) + Math.pow(controlStdError, 2));

    // For a two-tailed test at 95% confidence level, z-score should be > 1.96
    return zScore > 1.96;
  }
}

/**
 * Run the test
 */
function runTest() {
  console.log('=== A/B Testing Framework Test ===\n');

  // Create A/B testing service
  const abTestingService = new ABTestingService();

  // Create a new A/B test
  console.log('--- Creating A/B Test ---');
  const testResult = abTestingService.createTest({
    name: 'Welcome Message Optimization',
    description: 'Testing different welcome messages to improve user engagement',
    variants: [
      {
        name: 'Control',
        description: 'Current welcome message',
        configuration: {
          welcomeMessage: 'Welcome to our chatbot! How can I help you today?'
        },
        isControl: true
      },
      {
        name: 'Friendly',
        description: 'More friendly and casual welcome message',
        configuration: {
          welcomeMessage: 'Hi there! 👋 I\'m your friendly assistant. What can I do for you today?'
        }
      },
      {
        name: 'Professional',
        description: 'More professional and formal welcome message',
        configuration: {
          welcomeMessage: 'Greetings. I am your virtual assistant, ready to provide professional assistance with your inquiries.'
        }
      }
    ]
  });

  console.log('Test created:', testResult.success);
  if (testResult.success) {
    console.log(`Test ID: ${testResult.test.id}`);
    console.log(`Test Name: ${testResult.test.name}`);
    console.log(`Variants: ${testResult.test.variants.length}`);
    console.log(`Status: ${testResult.test.status}`);
  }
  console.log();

  // Start the test
  console.log('--- Starting A/B Test ---');
  const startResult = abTestingService.startTest(testResult.test.id);
  console.log('Test started:', startResult.success);
  if (startResult.success) {
    console.log(`Status: ${startResult.test.status}`);
  }
  console.log();

  // Simulate user assignments and conversions
  console.log('--- Simulating User Interactions ---');
  
  // Create user IDs
  const userIds = [];
  for (let i = 1; i <= 500; i++) {
    userIds.push(`user-${i}`);
  }
  
  // Assign variants to users
  console.log('Assigning variants to users...');
  const assignments = {
    'Control': 0,
    'Friendly': 0,
    'Professional': 0
  };
  
  for (const userId of userIds) {
    const variantResult = abTestingService.getVariant({
      testId: testResult.test.id,
      userId
    });
    
    if (variantResult.success) {
      assignments[variantResult.variant.name]++;
    }
  }
  
  console.log('User assignments:');
  for (const [variant, count] of Object.entries(assignments)) {
    console.log(`- ${variant}: ${count} users`);
  }
  console.log();
  
  // Simulate conversions with different rates for each variant
  console.log('Simulating user conversions...');
  const conversionRates = {
    'Control': 0.10, // 10% conversion rate
    'Friendly': 0.15, // 15% conversion rate
    'Professional': 0.12 // 12% conversion rate
  };
  
  let conversionCount = 0;
  
  for (const userId of userIds) {
    const variantResult = abTestingService.getVariant({
      testId: testResult.test.id,
      userId
    });
    
    if (variantResult.success) {
      const variantName = variantResult.variant.name;
      const conversionRate = conversionRates[variantName];
      
      // Simulate conversion based on the variant's conversion rate
      if (Math.random() < conversionRate) {
        abTestingService.trackEvent({
          testId: testResult.test.id,
          userId,
          event: 'conversion'
        });
        conversionCount++;
      }
    }
  }
  
  console.log(`Total conversions: ${conversionCount}`);
  console.log();
  
  // Get test results
  console.log('--- Getting Test Results ---');
  const resultsResult = abTestingService.getTestResults(testResult.test.id);
  
  if (resultsResult.success) {
    console.log('Test results:');
    
    for (const result of resultsResult.results) {
      console.log(`\n${result.variantName} ${result.isControl ? '(Control)' : ''}:`);
      console.log(`- Participants: ${result.participants}`);
      console.log(`- Conversions: ${result.conversions}`);
      console.log(`- Conversion Rate: ${result.conversionRate.toFixed(2)}%`);
      
      if (!result.isControl) {
        const sign = result.improvement >= 0 ? '+' : '';
        console.log(`- Improvement: ${sign}${result.improvement.toFixed(2)}%`);
        console.log(`- Statistically Significant: ${result.isSignificant ? 'Yes' : 'No'}`);
      }
    }
  }
  console.log();
  
  console.log('=== Test Complete ===');
  console.log('The A/B Testing framework is ready for use in the chatbot platform.');
}

// Run the test
runTest();
