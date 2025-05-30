/**
 * Test script for Prometheus and Grafana integration
 * 
 * This script demonstrates the usage of the Prometheus exporter service
 * and metrics server for integration with Prometheus and Grafana.
 */

const { prometheusExporterService, metricsServer, resourceMonitorService } = require('./index');

/**
 * Run the test
 */
async function runTest() {
  console.log('=== Prometheus Integration Test ===\n');

  // Register some custom metrics
  console.log('--- Registering Custom Metrics ---');
  
  // Register a counter metric
  prometheusExporterService.registerMetric({
    name: 'api_requests_total',
    help: 'Total number of API requests',
    type: 'counter',
    labels: ['method', 'endpoint', 'status']
  });
  
  // Register a gauge metric
  prometheusExporterService.registerMetric({
    name: 'active_users',
    help: 'Number of currently active users',
    type: 'gauge',
    labels: ['bot_id']
  });
  
  console.log('Custom metrics registered');
  console.log();

  // Set some metric values
  console.log('--- Setting Metric Values ---');
  
  // Increment counter metrics
  prometheusExporterService.incrementMetric('api_requests_total', 1, {
    method: 'GET',
    endpoint: '/api/conversations',
    status: '200'
  });
  
  prometheusExporterService.incrementMetric('api_requests_total', 1, {
    method: 'POST',
    endpoint: '/api/messages',
    status: '201'
  });
  
  prometheusExporterService.incrementMetric('api_requests_total', 1, {
    method: 'GET',
    endpoint: '/api/users',
    status: '200'
  });
  
  // Set gauge metrics
  prometheusExporterService.setMetric('active_users', 42, {
    bot_id: 'bot-123'
  });
  
  prometheusExporterService.setMetric('active_users', 27, {
    bot_id: 'bot-456'
  });
  
  console.log('Metric values set');
  console.log();

  // Generate metrics
  console.log('--- Generating Prometheus Metrics ---');
  const metrics = await prometheusExporterService.generateMetrics();
  
  // Display a sample of the metrics
  const metricLines = metrics.split('\n');
  const sampleLines = metricLines.slice(0, 20); // Show first 20 lines
  
  console.log('Sample of Prometheus metrics:');
  console.log(sampleLines.join('\n'));
  console.log(`... (${metricLines.length - 20} more lines)`);
  console.log();

  // Start metrics server
  console.log('--- Starting Metrics Server ---');
  await metricsServer.start();
  console.log(`Metrics server started on http://localhost:${process.env.METRICS_SERVER_PORT || '9090'}${process.env.METRICS_PATH || '/metrics'}`);
  console.log('Press Ctrl+C to stop the server');
  console.log();

  // Generate Grafana dashboard
  console.log('--- Generating Grafana Dashboard ---');
  const dashboard = prometheusExporterService.createGrafanaDashboard();
  
  console.log('Grafana dashboard generated with panels:');
  dashboard.panels.forEach(panel => {
    console.log(`- ${panel.title} (${panel.type})`);
  });
  console.log();

  // Simulate some load to generate interesting metrics
  console.log('--- Simulating Load ---');
  console.log('Generating CPU and memory load...');
  
  // Create a CPU-intensive task
  const startTime = Date.now();
  while (Date.now() - startTime < 2000) {
    // Busy loop to increase CPU usage
    Math.random() * Math.random();
  }
  
  // Allocate some memory
  const memoryChunks = [];
  for (let i = 0; i < 10; i++) {
    memoryChunks.push(Buffer.alloc(1024 * 1024)); // Allocate 1MB chunks
  }
  
  console.log('Load generated');
  console.log();

  console.log('=== Test Running ===');
  console.log('The metrics server is now running.');
  console.log('You can access the metrics at:');
  console.log(`http://localhost:${process.env.METRICS_SERVER_PORT || '9090'}${process.env.METRICS_PATH || '/metrics'}`);
  console.log();
  console.log('To use with Prometheus:');
  console.log('1. Add this endpoint to your prometheus.yml scrape_configs:');
  console.log('   - job_name: chatbot');
  console.log('     static_configs:');
  console.log(`       - targets: ['localhost:${process.env.METRICS_SERVER_PORT || '9090'}']`);
  console.log();
  console.log('To use with Grafana:');
  console.log('1. Add Prometheus as a data source in Grafana');
  console.log('2. Import the dashboard from:');
  console.log(`   http://localhost:${process.env.METRICS_SERVER_PORT || '9090'}/grafana-dashboard`);
  console.log();
  console.log('Press Ctrl+C to stop the server');

  // Keep the server running until the user terminates the process
  process.on('SIGINT', async () => {
    console.log('Stopping metrics server...');
    await metricsServer.stop();
    console.log('Metrics server stopped');
    process.exit(0);
  });
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
});
