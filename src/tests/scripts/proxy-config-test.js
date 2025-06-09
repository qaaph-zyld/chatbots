/**
 * Proxy Configuration Test Script
 * 
 * Tests the centralized proxy configuration implementation
 */

const axios = require('axios');
require('@src/config');
require('@src/config\environment');
require('@src/config\proxy');
const HttpsProxyAgent = require('https-proxy-agent');

// Test utility function
function logTestResult(testName, result) {
  console.log(`${result ? '✅ PASSED' : '❌ FAILED'}: ${testName}`);
  return result;
}

// Run all tests
async function runTests() {
  console.log('=== Proxy Configuration Centralization Test ===\n');
  
  let allTestsPassed = true;
  
  // Test 1: Environment configuration
  try {
    const proxyHost = environment.PROXY_HOST;
    const proxyPort = environment.PROXY_PORT;
    const proxyProtocol = environment.PROXY_PROTOCOL;
    
    allTestsPassed &= logTestResult(
      'Environment Configuration Loading', 
      proxyHost === '104.129.196.38' && 
      proxyPort === 10563 && 
      proxyProtocol === 'http'
    );
  } catch (error) {
    allTestsPassed &= logTestResult('Environment Configuration Loading', false);
    console.error('  Error:', error.message);
  }
  
  // Test 2: Proxy URL generation
  try {
    const proxyUrl = proxy.getProxyUrl();
    allTestsPassed &= logTestResult(
      'Proxy URL Generation', 
      proxyUrl === 'http://104.129.196.38:10563'
    );
  } catch (error) {
    allTestsPassed &= logTestResult('Proxy URL Generation', false);
    console.error('  Error:', error.message);
  }
  
  // Test 3: Proxy config object generation
  try {
    const proxyConfig = proxy.getProxyConfig();
    allTestsPassed &= logTestResult(
      'Proxy Config Object Generation', 
      proxyConfig.host === '104.129.196.38' && 
      proxyConfig.port === 10563 && 
      proxyConfig.protocol === 'http'
    );
  } catch (error) {
    allTestsPassed &= logTestResult('Proxy Config Object Generation', false);
    console.error('  Error:', error.message);
  }
  
  // Test 4: HTTP client creation
  try {
    const httpClient = proxy.createHttpClient();
    allTestsPassed &= logTestResult(
      'HTTP Client Creation with Proxy', 
      httpClient.defaults.proxy.host === '104.129.196.38' && 
      httpClient.defaults.proxy.port === 10563
    );
  } catch (error) {
    allTestsPassed &= logTestResult('HTTP Client Creation with Proxy', false);
    console.error('  Error:', error.message);
  }
  
  // Test 5: Global axios configuration
  try {
    proxy.configureGlobalAxios();
    allTestsPassed &= logTestResult(
      'Global Axios Configuration', 
      axios.defaults.proxy.host === '104.129.196.38' && 
      axios.defaults.proxy.port === 10563
    );
  } catch (error) {
    allTestsPassed &= logTestResult('Global Axios Configuration', false);
    console.error('  Error:', error.message);
  }
  
  // Test 6: HTTPS proxy agent creation
  try {
    const httpsAgent = proxy.getHttpsProxyAgent();
    allTestsPassed &= logTestResult(
      'HTTPS Proxy Agent Creation', 
      httpsAgent instanceof HttpsProxyAgent
    );
  } catch (error) {
    allTestsPassed &= logTestResult('HTTPS Proxy Agent Creation', false);
    console.error('  Error:', error.message);
  }
  
  // Test 7: External API connectivity (optional)
  try {
    console.log('\nTesting external API connectivity...');
    console.log('This test will make a real HTTP request through the proxy.');
    console.log('If it fails, check your network connectivity or proxy settings.');
    
    const response = await axios.get('https://httpbin.org/ip', {
      proxy: proxy.getProxyConfig(),
      timeout: 5000
    });
    
    console.log('Response:', response.data);
    allTestsPassed &= logTestResult('External API Connectivity', true);
  } catch (error) {
    console.log('External API connectivity test failed (this may be expected in test environments)');
    console.error('  Error:', error.message);
    // Don't fail the entire test suite for this optional test
  }
  
  // Final result
  console.log('\n=== Test Summary ===');
  console.log(`${allTestsPassed ? '✅ All tests passed!' : '❌ Some tests failed!'}`);
  
  return allTestsPassed;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
