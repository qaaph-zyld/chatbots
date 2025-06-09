/**
 * Test script for resource monitoring
 * 
 * This script demonstrates the usage of the resource monitor service
 * for tracking system resource usage and generating alerts.
 */

require('@src/monitoring\index');

/**
 * Run the test
 */
async function runTest() {
  console.log('=== Resource Monitor Test ===\n');

  // Set up alert listener
  resourceMonitorService.on('alert', (alert) => {
    console.log(`ALERT [${alert.type.toUpperCase()}]: ${alert.message}`);
  });

  // Test system info
  console.log('--- System Information ---');
  const systemInfo = resourceMonitorService.getSystemInfo();
  console.log('Platform:', systemInfo.platform);
  console.log('Architecture:', systemInfo.arch);
  console.log('CPU Model:', systemInfo.cpuModel);
  console.log('CPU Cores:', systemInfo.cpuCount);
  console.log('Total Memory:', formatBytes(systemInfo.totalMemory));
  console.log('Uptime:', formatUptime(systemInfo.uptime));
  console.log();

  // Start monitoring
  console.log('--- Starting Resource Monitoring ---');
  await resourceMonitorService.start();
  console.log('Resource monitoring started');
  console.log();

  // Collect initial metrics
  console.log('--- Current Resource Metrics ---');
  const metrics = await resourceMonitorService.getCurrentMetrics();
  console.log('CPU Usage:', metrics.cpu.usage + '%');
  console.log('Memory Usage:', metrics.memory.usage + '%', `(${formatBytes(metrics.memory.used)} / ${formatBytes(metrics.memory.total)})`);
  console.log('Disk Usage:', metrics.disk.usage + '%');
  console.log();

  // Simulate CPU load
  console.log('--- Simulating CPU Load ---');
  console.log('Running CPU-intensive task...');
  
  // Create a CPU-intensive task
  const startTime = Date.now();
  while (Date.now() - startTime < 2000) {
    // Busy loop to increase CPU usage
    Math.random() * Math.random();
  }
  
  // Collect metrics after load
  const metricsAfterLoad = await resourceMonitorService.getCurrentMetrics();
  console.log('CPU Usage after load:', metricsAfterLoad.cpu.usage + '%');
  console.log();

  // Wait for more data points
  console.log('--- Collecting Additional Data Points ---');
  console.log('Waiting for 5 seconds...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Get historical metrics
  console.log('--- Historical Resource Metrics ---');
  const historicalMetrics = resourceMonitorService.getHistoricalMetrics();
  console.log('CPU Data Points:', historicalMetrics.cpu.length);
  console.log('Memory Data Points:', historicalMetrics.memory.length);
  console.log('Disk Data Points:', historicalMetrics.disk.length);
  
  if (historicalMetrics.cpu.length > 0) {
    const latestCpu = historicalMetrics.cpu[historicalMetrics.cpu.length - 1];
    console.log('Latest CPU Usage:', latestCpu.usage + '%', 'at', new Date(latestCpu.timestamp).toLocaleTimeString());
  }
  
  if (historicalMetrics.memory.length > 0) {
    const latestMemory = historicalMetrics.memory[historicalMetrics.memory.length - 1];
    console.log('Latest Memory Usage:', latestMemory.usage + '%', 'at', new Date(latestMemory.timestamp).toLocaleTimeString());
  }
  console.log();

  // Stop monitoring
  console.log('--- Stopping Resource Monitoring ---');
  resourceMonitorService.stop();
  console.log('Resource monitoring stopped');
  console.log();

  console.log('=== Test Completed ===');
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} - Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format uptime to human-readable string
 * @param {number} seconds - Uptime in seconds
 * @returns {string} - Formatted string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
  
  return parts.join(', ');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
});
