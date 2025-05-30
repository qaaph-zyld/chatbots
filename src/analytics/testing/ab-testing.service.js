/**
 * A/B Testing Service
 * 
 * This service provides A/B testing capabilities for chatbot configurations,
 * prompts, responses, and UI elements to optimize user engagement and performance.
 */

// Generate a UUID v4
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
const { logger } = require('../../utils');

/**
 * A/B Testing Service class
 */
class ABTestingService {
  /**
   * Initialize the A/B testing service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      defaultTestDuration: parseInt(process.env.AB_TEST_DEFAULT_DURATION || '7'), // days
      minSampleSize: parseInt(process.env.AB_TEST_MIN_SAMPLE_SIZE || '100'),
      significanceLevel: parseFloat(process.env.AB_TEST_SIGNIFICANCE_LEVEL || '0.05'),
      storageEnabled: process.env.AB_TESTING_ENABLED === 'true' || true,
      ...options
    };

    // Test storage
    this.tests = new Map();
    this.variants = new Map();
    this.assignments = new Map();
    this.conversions = new Map();
    this.metrics = new Map();

    logger.info('A/B Testing Service initialized with options:', {
      defaultTestDuration: this.options.defaultTestDuration,
      minSampleSize: this.options.minSampleSize,
      significanceLevel: this.options.significanceLevel,
      storageEnabled: this.options.storageEnabled
    });
  }

  /**
   * Create a new A/B test
   * @param {Object} testConfig - Test configuration
   * @returns {Object} - Test details
   */
  createTest(testConfig) {
    try {
      if (!this.options.storageEnabled) {
        return { success: false, reason: 'A/B testing is disabled' };
      }

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

      logger.info('Created A/B test:', { testId, name, variants: processedVariants.length });
      return {
        success: true,
        test: {
          ...test,
          variants: processedVariants
        }
      };
    } catch (error) {
      logger.error('Error creating A/B test:', error.message);
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
      if (!this.options.storageEnabled) {
        return { success: false, reason: 'A/B testing is disabled' };
      }

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

      logger.info('Started A/B test:', { testId, name: test.name });
      return { success: true, test };
    } catch (error) {
      logger.error('Error starting A/B test:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop an A/B test
   * @param {string} testId - Test ID
   * @returns {Object} - Operation result
   */
  stopTest(testId) {
    try {
      if (!this.options.storageEnabled) {
        return { success: false, reason: 'A/B testing is disabled' };
      }

      const test = this.tests.get(testId);
      if (!test) {
        throw new Error(`Test with ID ${testId} not found`);
      }

      if (test.status !== 'running') {
        return { success: true, message: `Test is not running (current status: ${test.status})` };
      }

      // Update test status
      test.status = 'stopped';
      test.updatedAt = new Date().toISOString();
      test.stoppedAt = new Date().toISOString();

      logger.info('Stopped A/B test:', { testId, name: test.name });
      return { success: true, test };
    } catch (error) {
      logger.error('Error stopping A/B test:', error.message);
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
      if (!this.options.storageEnabled) {
        return { success: false, reason: 'A/B testing is disabled' };
      }

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

      // Check if test has expired
      const now = new Date();
      const endDate = new Date(test.endDate);
      if (now > endDate) {
        // Auto-stop test if it has expired
        this.stopTest(testId);
        return { success: false, reason: 'Test has expired' };
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

      // Check if user is in target group
      if (test.targetUserGroups.length > 0) {
        const userGroup = userAttributes.group;
        if (userGroup && !test.targetUserGroups.includes(userGroup)) {
          return { success: false, reason: 'User is not in target group' };
        }
      }

      // Apply traffic allocation
      if (test.trafficAllocation < 100) {
        // Generate a random number between 0 and 100
        const random = Math.random() * 100;
        if (random >= test.trafficAllocation) {
          return { success: false, reason: 'User excluded by traffic allocation' };
        }
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

      logger.debug('Assigned variant:', {
        testId,
        entityId,
        variantId: selectedVariant.id,
        variantName: selectedVariant.name
      });

      return {
        success: true,
        variant: selectedVariant,
        isNewAssignment: true
      };
    } catch (error) {
      logger.error('Error getting variant:', error.message);
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
      if (!this.options.storageEnabled) {
        return { success: false, reason: 'A/B testing is disabled' };
      }

      const {
        testId,
        userId,
        sessionId,
        event = 'conversion',
        value = 1,
        metadata = {}
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
        metadata,
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

      logger.debug('Tracked event:', {
        testId,
        entityId,
        variantId,
        event,
        value
      });

      return { success: true, conversion };
    } catch (error) {
      logger.error('Error tracking event:', error.message);
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
      if (!this.options.storageEnabled) {
        return { success: false, reason: 'A/B testing is disabled' };
      }

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
          events: metrics.events,
          confidence: this._calculateConfidence(
            metrics.participants,
            metrics.conversions
          )
        });
      }

      // Sort results by conversion rate (descending)
      results.sort((a, b) => b.conversionRate - a.conversionRate);

      // Determine winner if test is completed
      let winner = null;
      if (test.status === 'stopped' || test.status === 'completed') {
        const significantResults = results.filter(r => r.isSignificant);
        
        if (significantResults.length > 0) {
          // Find the variant with the highest conversion rate among significant results
          winner = significantResults.reduce((best, current) => {
            return current.conversionRate > best.conversionRate ? current : best;
          }, significantResults[0]);
        }
      }

      logger.info('Retrieved test results:', { testId, variants: results.length });
      return {
        success: true,
        test,
        results,
        winner,
        hasSignificantResult: results.some(r => r.isSignificant)
      };
    } catch (error) {
      logger.error('Error getting test results:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if a result is statistically significant
   * @param {number} variantSamples - Number of samples in variant
   * @param {number} variantConversions - Number of conversions in variant
   * @param {number} controlSamples - Number of samples in control
   * @param {number} controlConversions - Number of conversions in control
   * @returns {boolean} - Whether the result is statistically significant
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

    // Calculate p-value (simplified approach)
    // For a two-tailed test at 95% confidence level, z-score should be > 1.96
    return zScore > 1.96;
  }

  /**
   * Calculate confidence interval
   * @param {number} samples - Number of samples
   * @param {number} conversions - Number of conversions
   * @returns {Object} - Confidence interval
   * @private
   */
  _calculateConfidence(samples, conversions) {
    if (samples === 0) {
      return {
        mean: 0,
        lowerBound: 0,
        upperBound: 0,
        marginOfError: 0
      };
    }

    const rate = conversions / samples;
    const z = 1.96; // 95% confidence level
    const standardError = Math.sqrt((rate * (1 - rate)) / samples);
    const marginOfError = z * standardError;

    return {
      mean: rate * 100,
      lowerBound: Math.max(0, (rate - marginOfError) * 100),
      upperBound: Math.min(100, (rate + marginOfError) * 100),
      marginOfError: marginOfError * 100
    };
  }
}

// Create and export service instance
const abTestingService = new ABTestingService();

module.exports = {
  ABTestingService,
  abTestingService
};
