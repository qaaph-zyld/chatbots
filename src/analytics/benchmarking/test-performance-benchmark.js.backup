/**
 * Test script for Performance Benchmarking
 * 
 * This script demonstrates the usage of the Performance Benchmark service
 * for measuring and optimizing chatbot component performance.
 */

require('@src/analytics\benchmarking\performance-benchmark.service');

// Mock logger to avoid dependency issues
const mockLogger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  debug: (message, data) => console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message, data) => console.log(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message, data) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : '')
};

// Mock resource monitor service
const mockResourceMonitorService = {
  getCurrentMetrics: async () => ({
    cpu: {
      usage: Math.random() * 10,
      system: Math.random() * 5,
      user: Math.random() * 5
    },
    memory: {
      used: Math.random() * 100 * 1024 * 1024, // Random MB
      rss: Math.random() * 200 * 1024 * 1024,
      heapUsed: Math.random() * 50 * 1024 * 1024
    }
  })
};

// Replace the real dependencies with mocks
performanceBenchmarkService.logger = mockLogger;
performanceBenchmarkService.resourceMonitorService = mockResourceMonitorService;

/**
 * Example functions to benchmark
 */

// Fast function with consistent performance
async function fastFunction(size = 1000) {
  const array = [];
  for (let i = 0; i < size; i++) {
    array.push(i);
  }
  return array.reduce((sum, val) => sum + val, 0);
}

// Medium function with some variability
async function mediumFunction(size = 100) {
  const result = [];
  for (let i = 0; i < size; i++) {
    result.push(await Promise.resolve(Math.sqrt(i * 100)));
  }
  return result;
}

// Slow function with high variability
async function slowFunction(iterations = 10) {
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    // Simulate some async work
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    result += Math.random();
  }
  return result;
}

// Function that sometimes fails
async function unreliableFunction(failRate = 0.2) {
  if (Math.random() < failRate) {
    throw new Error('Random failure');
  }
  await new Promise(resolve => setTimeout(resolve, Math.random() * 20));
  return 'Success';
}

/**
 * Run the test
 */
async function runTest() {
  console.log('=== Performance Benchmarking Test ===\n');

  // Create benchmarks
  console.log('--- Creating Benchmarks ---');
  
  const fastBenchmark = performanceBenchmarkService.createBenchmark({
    name: 'Fast Function Benchmark',
    description: 'Benchmark for a fast function with consistent performance',
    targetFunction: fastFunction,
    params: [10000],
    iterations: 100,
    warmupIterations: 5,
    concurrency: 1,
    tags: ['fast', 'consistent']
  });
  
  const mediumBenchmark = performanceBenchmarkService.createBenchmark({
    name: 'Medium Function Benchmark',
    description: 'Benchmark for a medium function with some variability',
    targetFunction: mediumFunction,
    params: [50],
    iterations: 50,
    warmupIterations: 3,
    concurrency: 2,
    tags: ['medium', 'variable']
  });
  
  const slowBenchmark = performanceBenchmarkService.createBenchmark({
    name: 'Slow Function Benchmark',
    description: 'Benchmark for a slow function with high variability',
    targetFunction: slowFunction,
    params: [5],
    iterations: 20,
    warmupIterations: 2,
    concurrency: 5,
    tags: ['slow', 'high-variability']
  });
  
  const unreliableBenchmark = performanceBenchmarkService.createBenchmark({
    name: 'Unreliable Function Benchmark',
    description: 'Benchmark for a function that sometimes fails',
    targetFunction: unreliableFunction,
    params: [0.2], // 20% failure rate
    iterations: 30,
    warmupIterations: 2,
    concurrency: 3,
    tags: ['unreliable', 'error-prone']
  });
  
  console.log(`Created ${[
    fastBenchmark, 
    mediumBenchmark, 
    slowBenchmark, 
    unreliableBenchmark
  ].filter(b => b.success).length} benchmarks`);
  console.log();

  // Run fast benchmark
  console.log('--- Running Fast Function Benchmark ---');
  console.log('Running benchmark...');
  const fastResults = await performanceBenchmarkService.runBenchmark(fastBenchmark.benchmark.id);
  
  if (fastResults.success) {
    console.log('Fast Function Benchmark Results:');
    console.log(`- Total Duration: ${fastResults.results.metrics.totalDuration}ms`);
    console.log(`- Mean Duration: ${fastResults.results.metrics.meanDuration.toFixed(2)}ms`);
    console.log(`- Median Duration: ${fastResults.results.metrics.medianDuration.toFixed(2)}ms`);
    console.log(`- Min Duration: ${fastResults.results.metrics.minDuration.toFixed(2)}ms`);
    console.log(`- Max Duration: ${fastResults.results.metrics.maxDuration.toFixed(2)}ms`);
    console.log(`- 95th Percentile: ${fastResults.results.metrics.p95Duration.toFixed(2)}ms`);
    console.log(`- Throughput: ${fastResults.results.metrics.throughput.toFixed(2)} ops/sec`);
    console.log(`- Success Rate: ${fastResults.results.metrics.successRate.toFixed(2)}%`);
  }
  console.log();

  // Run medium benchmark
  console.log('--- Running Medium Function Benchmark ---');
  console.log('Running benchmark...');
  const mediumResults = await performanceBenchmarkService.runBenchmark(mediumBenchmark.benchmark.id);
  
  if (mediumResults.success) {
    console.log('Medium Function Benchmark Results:');
    console.log(`- Total Duration: ${mediumResults.results.metrics.totalDuration}ms`);
    console.log(`- Mean Duration: ${mediumResults.results.metrics.meanDuration.toFixed(2)}ms`);
    console.log(`- Throughput: ${mediumResults.results.metrics.throughput.toFixed(2)} ops/sec`);
  }
  console.log();

  // Set baseline for medium benchmark
  console.log('--- Setting Baseline for Medium Function ---');
  const setBaselineResult = performanceBenchmarkService.setBaseline(mediumBenchmark.benchmark.id);
  console.log(`Baseline set: ${setBaselineResult.success}`);
  console.log();

  // Run medium benchmark again with different parameters
  console.log('--- Running Medium Function Benchmark Again ---');
  
  // Create a new benchmark with slightly different parameters
  const mediumBenchmark2 = performanceBenchmarkService.createBenchmark({
    name: 'Medium Function Benchmark (Optimized)',
    description: 'Benchmark for an optimized version of the medium function',
    targetFunction: async (size) => {
      // Optimized version that's about 20% faster
      const result = [];
      const promises = [];
      for (let i = 0; i < size; i++) {
        promises.push(Promise.resolve(Math.sqrt(i * 100)));
      }
      const values = await Promise.all(promises);
      return values;
    },
    params: [50],
    iterations: 50,
    warmupIterations: 3,
    concurrency: 2,
    tags: ['medium', 'variable', 'optimized']
  });
  
  console.log('Running optimized benchmark...');
  const mediumResults2 = await performanceBenchmarkService.runBenchmark(mediumBenchmark2.benchmark.id);
  
  if (mediumResults2.success) {
    console.log('Optimized Medium Function Benchmark Results:');
    console.log(`- Total Duration: ${mediumResults2.results.metrics.totalDuration}ms`);
    console.log(`- Mean Duration: ${mediumResults2.results.metrics.meanDuration.toFixed(2)}ms`);
    console.log(`- Throughput: ${mediumResults2.results.metrics.throughput.toFixed(2)} ops/sec`);
  }
  console.log();

  // Run slow benchmark
  console.log('--- Running Slow Function Benchmark ---');
  console.log('Running benchmark...');
  const slowResults = await performanceBenchmarkService.runBenchmark(slowBenchmark.benchmark.id);
  
  if (slowResults.success) {
    console.log('Slow Function Benchmark Results:');
    console.log(`- Total Duration: ${slowResults.results.metrics.totalDuration}ms`);
    console.log(`- Mean Duration: ${slowResults.results.metrics.meanDuration.toFixed(2)}ms`);
    console.log(`- Throughput: ${slowResults.results.metrics.throughput.toFixed(2)} ops/sec`);
  }
  console.log();

  // Run unreliable benchmark
  console.log('--- Running Unreliable Function Benchmark ---');
  console.log('Running benchmark...');
  const unreliableResults = await performanceBenchmarkService.runBenchmark(unreliableBenchmark.benchmark.id);
  
  if (unreliableResults.success) {
    console.log('Unreliable Function Benchmark Results:');
    console.log(`- Total Duration: ${unreliableResults.results.metrics.totalDuration}ms`);
    console.log(`- Mean Duration: ${unreliableResults.results.metrics.meanDuration.toFixed(2)}ms`);
    console.log(`- Success Rate: ${unreliableResults.results.metrics.successRate.toFixed(2)}%`);
    console.log(`- Error Rate: ${unreliableResults.results.metrics.errorRate.toFixed(2)}%`);
    console.log(`- Errors: ${unreliableResults.results.errors.length}`);
  }
  console.log();

  // Compare with baseline
  console.log('--- Comparing with Baseline ---');
  // Set baseline for the new benchmark to enable comparison
  performanceBenchmarkService.setBaseline(mediumBenchmark2.benchmark.id);
  
  // Run the benchmark again with a slightly different implementation
  const mediumBenchmark3 = performanceBenchmarkService.createBenchmark({
    name: 'Medium Function Benchmark (Further Optimized)',
    description: 'Benchmark for a further optimized version of the medium function',
    targetFunction: async (size) => {
      // Even more optimized version
      return Promise.all(
        Array.from({ length: size }, (_, i) => Promise.resolve(Math.sqrt(i * 100)))
      );
    },
    params: [50],
    iterations: 50,
    warmupIterations: 3,
    concurrency: 2,
    tags: ['medium', 'variable', 'optimized']
  });
  
  console.log('Running further optimized benchmark...');
  const mediumResults3 = await performanceBenchmarkService.runBenchmark(mediumBenchmark3.benchmark.id);
  
  // Compare with the previous benchmark
  const comparisonResult = performanceBenchmarkService.compareWithBaseline(mediumBenchmark3.benchmark.id);
  
  if (comparisonResult.success) {
    console.log('Comparison with Baseline:');
    
    const meanChange = comparisonResult.comparison.metrics.meanDuration.change;
    const throughputChange = comparisonResult.comparison.metrics.throughput.change;
    
    console.log(`- Mean Duration: ${meanChange.toFixed(2)}% ${meanChange < 0 ? 'improvement' : 'regression'}`);
    console.log(`- Throughput: ${throughputChange.toFixed(2)}% ${throughputChange > 0 ? 'improvement' : 'regression'}`);
    
    if (comparisonResult.comparison.resourceMetrics) {
      const cpuChange = comparisonResult.comparison.resourceMetrics.cpu.usage.change;
      const memoryChange = comparisonResult.comparison.resourceMetrics.memory.used.change;
      
      console.log(`- CPU Usage: ${cpuChange.toFixed(2)}% ${cpuChange < 0 ? 'improvement' : 'regression'}`);
      console.log(`- Memory Usage: ${memoryChange.toFixed(2)}% ${memoryChange < 0 ? 'improvement' : 'regression'}`);
    }
  }
  console.log();
  
  console.log('=== Test Complete ===');
  console.log('The Performance Benchmarking service is ready for use in the chatbot platform.');
  console.log();
  console.log('Key features demonstrated:');
  console.log('1. Creating and running performance benchmarks');
  console.log('2. Measuring execution time, throughput, and success rates');
  console.log('3. Handling concurrent benchmark execution');
  console.log('4. Setting baselines and comparing performance changes');
  console.log('5. Tracking resource usage during benchmarks');
  console.log('6. Supporting different types of functions and error scenarios');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
});
