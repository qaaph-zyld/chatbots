/**
 * Script to run performance optimization and generate a report
 * 
 * This script analyzes the application's performance, identifies bottlenecks,
 * and generates a comprehensive performance report with optimization recommendations.
 * 
 * Usage: node src/scripts/run-performance-optimization.js [--apply-optimizations] [--monitor-time=<seconds>]
 */

const fs = require('fs');
const path = require('path');
const performanceOptimizer = require('../utils/performance-optimizer');
const logger = require('../utils/logger');

// Parse command line arguments
const args = process.argv.slice(2);
const applyOptimizations = args.includes('--apply-optimizations');
const monitorTimeArg = args.find(arg => arg.startsWith('--monitor-time='));
const monitorTime = monitorTimeArg 
  ? parseInt(monitorTimeArg.split('=')[1]) * 1000 
  : 60000; // Default 60 seconds

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, '../../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Generate timestamp for report filename
const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
const reportPath = path.join(reportsDir, `performance-report-${timestamp}.json`);

/**
 * Run the performance optimization process
 */
async function runPerformanceOptimization() {
  try {
    logger.info('Starting performance optimization analysis');
    
    // Initialize the performance optimizer
    await performanceOptimizer.initialize();
    
    // If monitoring time is specified, monitor for that duration
    if (monitorTime > 0) {
      logger.info(`Monitoring performance for ${monitorTime / 1000} seconds...`);
      performanceOptimizer.startMonitoring(5000); // Check every 5 seconds during monitoring period
      
      await new Promise(resolve => setTimeout(resolve, monitorTime));
      performanceOptimizer.stopMonitoring();
    }
    
    // Apply automatic optimizations if requested
    let optimizationResults = [];
    if (applyOptimizations) {
      logger.info('Applying automatic optimizations');
      optimizationResults = await performanceOptimizer.applyAutomaticOptimizations();
    }
    
    // Generate performance report
    const report = await performanceOptimizer.generatePerformanceReport();
    
    // Add optimization results to report if optimizations were applied
    if (applyOptimizations) {
      report.appliedOptimizations = optimizationResults;
    }
    
    // Save report to file
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Log summary
    logger.info(`Performance report generated: ${reportPath}`);
    logger.info('Performance Summary:', {
      cpuUsage: `${report.metrics.cpu.usage.toFixed(2)}%`,
      memoryUsage: `${report.metrics.memory.usagePercentage.toFixed(2)}%`,
      optimizationRecommendations: report.optimizations.length,
      overallStatus: report.summary.overallStatus
    });
    
    // Print recommendations
    if (report.optimizations.length > 0) {
      logger.info('Optimization Recommendations:');
      report.optimizations.forEach((opt, index) => {
        logger.info(`${index + 1}. [${opt.component}] ${opt.issue} - ${opt.recommendation}`);
      });
    } else {
      logger.info('No performance optimizations needed at this time.');
    }
    
    return report;
  } catch (error) {
    logger.error('Error running performance optimization', error);
    throw error;
  }
}

// Run the performance optimization
runPerformanceOptimization()
  .then(() => {
    logger.info('Performance optimization completed successfully');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Performance optimization failed', error);
    process.exit(1);
  });
