/**
 * Performance Benchmark Service
 * 
 * This service provides tools for measuring and optimizing the performance
 * of chatbot components, including response times, throughput, and resource usage.
 */

const { logger } = require('../../utils');
const { resourceMonitorService } = require('../../monitoring/resource-monitor.service');

/**
 * Performance Benchmark Service class
 */
class PerformanceBenchmarkService {
  /**
   * Initialize the performance benchmark service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      defaultIterations: parseInt(process.env.BENCHMARK_DEFAULT_ITERATIONS || '100'),
      defaultWarmupIterations: parseInt(process.env.BENCHMARK_WARMUP_ITERATIONS || '10'),
      defaultConcurrency: parseInt(process.env.BENCHMARK_DEFAULT_CONCURRENCY || '1'),
      collectResourceMetrics: process.env.BENCHMARK_COLLECT_RESOURCES === 'true' || true,
      ...options
    };

    // Benchmark results storage
    this.benchmarks = new Map();
    this.results = new Map();
    this.baselineResults = new Map();

    logger.info('Performance Benchmark Service initialized with options:', {
      defaultIterations: this.options.defaultIterations,
      defaultWarmupIterations: this.options.defaultWarmupIterations,
      defaultConcurrency: this.options.defaultConcurrency,
      collectResourceMetrics: this.options.collectResourceMetrics
    });
  }

  /**
   * Create a benchmark definition
   * @param {Object} benchmarkConfig - Benchmark configuration
   * @returns {Object} - Benchmark details
   */
  createBenchmark(benchmarkConfig) {
    try {
      const {
        name,
        description = '',
        targetFunction,
        params = [],
        iterations = this.options.defaultIterations,
        warmupIterations = this.options.defaultWarmupIterations,
        concurrency = this.options.defaultConcurrency,
        tags = []
      } = benchmarkConfig;

      if (!name) {
        throw new Error('Benchmark name is required');
      }

      if (!targetFunction || typeof targetFunction !== 'function') {
        throw new Error('Target function is required and must be a function');
      }

      // Generate benchmark ID
      const benchmarkId = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

      // Create benchmark object
      const benchmark = {
        id: benchmarkId,
        name,
        description,
        targetFunction,
        params,
        iterations,
        warmupIterations,
        concurrency,
        tags,
        createdAt: new Date().toISOString()
      };

      // Store benchmark
      this.benchmarks.set(benchmarkId, benchmark);

      logger.info('Created benchmark:', { benchmarkId, name, iterations, concurrency });
      return {
        success: true,
        benchmark: {
          id: benchmark.id,
          name: benchmark.name,
          description: benchmark.description,
          iterations: benchmark.iterations,
          warmupIterations: benchmark.warmupIterations,
          concurrency: benchmark.concurrency,
          tags: benchmark.tags,
          createdAt: benchmark.createdAt
        }
      };
    } catch (error) {
      logger.error('Error creating benchmark:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run a benchmark
   * @param {string} benchmarkId - Benchmark ID
   * @returns {Promise<Object>} - Benchmark results
   */
  async runBenchmark(benchmarkId) {
    try {
      const benchmark = this.benchmarks.get(benchmarkId);
      if (!benchmark) {
        throw new Error(`Benchmark with ID ${benchmarkId} not found`);
      }

      logger.info(`Starting benchmark: ${benchmark.name}`, {
        benchmarkId,
        iterations: benchmark.iterations,
        warmupIterations: benchmark.warmupIterations,
        concurrency: benchmark.concurrency
      });

      // Initialize results
      const results = {
        benchmarkId,
        name: benchmark.name,
        startTime: new Date().toISOString(),
        endTime: null,
        iterations: benchmark.iterations,
        warmupIterations: benchmark.warmupIterations,
        concurrency: benchmark.concurrency,
        metrics: {
          totalDuration: 0,
          meanDuration: 0,
          medianDuration: 0,
          minDuration: Infinity,
          maxDuration: 0,
          p95Duration: 0,
          p99Duration: 0,
          throughput: 0,
          successRate: 0,
          errorRate: 0
        },
        resourceMetrics: {},
        iterationResults: [],
        errors: []
      };

      // Collect initial resource metrics if enabled
      let initialResourceMetrics = null;
      if (this.options.collectResourceMetrics) {
        initialResourceMetrics = await resourceMonitorService.getCurrentMetrics();
      }

      // Perform warmup iterations
      if (benchmark.warmupIterations > 0) {
        logger.debug(`Performing ${benchmark.warmupIterations} warmup iterations`);
        
        for (let i = 0; i < benchmark.warmupIterations; i++) {
          try {
            await benchmark.targetFunction(...benchmark.params);
          } catch (error) {
            // Ignore errors during warmup
          }
        }
      }

      // Run benchmark iterations
      const durations = [];
      let successCount = 0;
      let errorCount = 0;

      const startTime = Date.now();

      // Run iterations based on concurrency
      if (benchmark.concurrency <= 1) {
        // Sequential execution
        for (let i = 0; i < benchmark.iterations; i++) {
          const iterationResult = await this._runIteration(benchmark, i);
          results.iterationResults.push(iterationResult);
          
          durations.push(iterationResult.duration);
          
          if (iterationResult.success) {
            successCount++;
          } else {
            errorCount++;
            results.errors.push({
              iteration: i,
              error: iterationResult.error
            });
          }
        }
      } else {
        // Concurrent execution
        const batchSize = benchmark.concurrency;
        const batches = Math.ceil(benchmark.iterations / batchSize);
        
        for (let batch = 0; batch < batches; batch++) {
          const batchPromises = [];
          const batchStart = batch * batchSize;
          const batchEnd = Math.min(batchStart + batchSize, benchmark.iterations);
          
          for (let i = batchStart; i < batchEnd; i++) {
            batchPromises.push(this._runIteration(benchmark, i));
          }
          
          const batchResults = await Promise.all(batchPromises);
          
          for (const iterationResult of batchResults) {
            results.iterationResults.push(iterationResult);
            
            durations.push(iterationResult.duration);
            
            if (iterationResult.success) {
              successCount++;
            } else {
              errorCount++;
              results.errors.push({
                iteration: iterationResult.iteration,
                error: iterationResult.error
              });
            }
          }
        }
      }

      const endTime = Date.now();
      results.endTime = new Date().toISOString();

      // Collect final resource metrics if enabled
      if (this.options.collectResourceMetrics && initialResourceMetrics) {
        const finalResourceMetrics = await resourceMonitorService.getCurrentMetrics();
        
        results.resourceMetrics = {
          cpu: {
            usage: finalResourceMetrics.cpu.usage - initialResourceMetrics.cpu.usage,
            system: finalResourceMetrics.cpu.system - initialResourceMetrics.cpu.system,
            user: finalResourceMetrics.cpu.user - initialResourceMetrics.cpu.user
          },
          memory: {
            used: finalResourceMetrics.memory.used - initialResourceMetrics.memory.used,
            rss: finalResourceMetrics.memory.rss - initialResourceMetrics.memory.rss,
            heapUsed: finalResourceMetrics.memory.heapUsed - initialResourceMetrics.memory.heapUsed
          }
        };
      }

      // Calculate metrics
      durations.sort((a, b) => a - b);
      
      const totalDuration = endTime - startTime;
      const meanDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const medianDuration = durations[Math.floor(durations.length / 2)];
      const minDuration = durations[0];
      const maxDuration = durations[durations.length - 1];
      const p95Index = Math.floor(durations.length * 0.95);
      const p99Index = Math.floor(durations.length * 0.99);
      const p95Duration = durations[p95Index];
      const p99Duration = durations[p99Index];
      const throughput = (benchmark.iterations / totalDuration) * 1000; // ops/sec
      const successRate = (successCount / benchmark.iterations) * 100;
      const errorRate = (errorCount / benchmark.iterations) * 100;

      // Update results
      results.metrics = {
        totalDuration,
        meanDuration,
        medianDuration,
        minDuration,
        maxDuration,
        p95Duration,
        p99Duration,
        throughput,
        successRate,
        errorRate
      };

      // Store results
      this.results.set(benchmarkId, results);

      logger.info(`Benchmark completed: ${benchmark.name}`, {
        benchmarkId,
        totalDuration,
        meanDuration,
        throughput,
        successRate
      });

      return {
        success: true,
        results
      };
    } catch (error) {
      logger.error('Error running benchmark:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run a single benchmark iteration
   * @param {Object} benchmark - Benchmark configuration
   * @param {number} iteration - Iteration number
   * @returns {Promise<Object>} - Iteration result
   * @private
   */
  async _runIteration(benchmark, iteration) {
    const iterationResult = {
      iteration,
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      success: false,
      error: null,
      result: null
    };

    try {
      const result = await benchmark.targetFunction(...benchmark.params);
      
      iterationResult.endTime = Date.now();
      iterationResult.duration = iterationResult.endTime - iterationResult.startTime;
      iterationResult.success = true;
      iterationResult.result = result;
      
      return iterationResult;
    } catch (error) {
      iterationResult.endTime = Date.now();
      iterationResult.duration = iterationResult.endTime - iterationResult.startTime;
      iterationResult.success = false;
      iterationResult.error = error.message;
      
      return iterationResult;
    }
  }

  /**
   * Set a baseline for comparison
   * @param {string} benchmarkId - Benchmark ID
   * @returns {Object} - Operation result
   */
  setBaseline(benchmarkId) {
    try {
      const results = this.results.get(benchmarkId);
      if (!results) {
        throw new Error(`Results for benchmark with ID ${benchmarkId} not found`);
      }

      // Store as baseline
      this.baselineResults.set(benchmarkId, { ...results });

      logger.info(`Set baseline for benchmark: ${results.name}`, { benchmarkId });
      return { success: true };
    } catch (error) {
      logger.error('Error setting baseline:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Compare benchmark results with baseline
   * @param {string} benchmarkId - Benchmark ID
   * @returns {Object} - Comparison results
   */
  compareWithBaseline(benchmarkId) {
    try {
      const results = this.results.get(benchmarkId);
      if (!results) {
        throw new Error(`Results for benchmark with ID ${benchmarkId} not found`);
      }

      const baseline = this.baselineResults.get(benchmarkId);
      if (!baseline) {
        throw new Error(`Baseline for benchmark with ID ${benchmarkId} not found`);
      }

      // Calculate comparison metrics
      const comparison = {
        benchmarkId,
        name: results.name,
        baselineTimestamp: baseline.startTime,
        currentTimestamp: results.startTime,
        metrics: {
          meanDuration: {
            baseline: baseline.metrics.meanDuration,
            current: results.metrics.meanDuration,
            change: this._calculatePercentageChange(
              baseline.metrics.meanDuration,
              results.metrics.meanDuration
            ),
            improved: results.metrics.meanDuration < baseline.metrics.meanDuration
          },
          throughput: {
            baseline: baseline.metrics.throughput,
            current: results.metrics.throughput,
            change: this._calculatePercentageChange(
              baseline.metrics.throughput,
              results.metrics.throughput
            ),
            improved: results.metrics.throughput > baseline.metrics.throughput
          },
          p95Duration: {
            baseline: baseline.metrics.p95Duration,
            current: results.metrics.p95Duration,
            change: this._calculatePercentageChange(
              baseline.metrics.p95Duration,
              results.metrics.p95Duration
            ),
            improved: results.metrics.p95Duration < baseline.metrics.p95Duration
          },
          successRate: {
            baseline: baseline.metrics.successRate,
            current: results.metrics.successRate,
            change: this._calculatePercentageChange(
              baseline.metrics.successRate,
              results.metrics.successRate
            ),
            improved: results.metrics.successRate > baseline.metrics.successRate
          }
        }
      };

      // Add resource metrics comparison if available
      if (results.resourceMetrics && baseline.resourceMetrics) {
        comparison.resourceMetrics = {
          cpu: {
            usage: {
              baseline: baseline.resourceMetrics.cpu.usage,
              current: results.resourceMetrics.cpu.usage,
              change: this._calculatePercentageChange(
                baseline.resourceMetrics.cpu.usage,
                results.resourceMetrics.cpu.usage
              ),
              improved: results.resourceMetrics.cpu.usage < baseline.resourceMetrics.cpu.usage
            }
          },
          memory: {
            used: {
              baseline: baseline.resourceMetrics.memory.used,
              current: results.resourceMetrics.memory.used,
              change: this._calculatePercentageChange(
                baseline.resourceMetrics.memory.used,
                results.resourceMetrics.memory.used
              ),
              improved: results.resourceMetrics.memory.used < baseline.resourceMetrics.memory.used
            }
          }
        };
      }

      logger.info(`Compared benchmark with baseline: ${results.name}`, { benchmarkId });
      return { success: true, comparison };
    } catch (error) {
      logger.error('Error comparing with baseline:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get benchmark results
   * @param {string} benchmarkId - Benchmark ID
   * @returns {Object} - Benchmark results
   */
  getBenchmarkResults(benchmarkId) {
    try {
      const results = this.results.get(benchmarkId);
      if (!results) {
        throw new Error(`Results for benchmark with ID ${benchmarkId} not found`);
      }

      return { success: true, results };
    } catch (error) {
      logger.error('Error getting benchmark results:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate percentage change between two values
   * @param {number} baseline - Baseline value
   * @param {number} current - Current value
   * @returns {number} - Percentage change
   * @private
   */
  _calculatePercentageChange(baseline, current) {
    if (baseline === 0) {
      return current === 0 ? 0 : 100;
    }
    return ((current - baseline) / baseline) * 100;
  }
}

// Create and export service instance
const performanceBenchmarkService = new PerformanceBenchmarkService();

module.exports = {
  PerformanceBenchmarkService,
  performanceBenchmarkService
};
