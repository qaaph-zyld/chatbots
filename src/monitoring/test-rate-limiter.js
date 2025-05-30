/**
 * Test script for rate limiting
 * 
 * This script demonstrates the usage of the rate limiter service
 * for protecting resources and ensuring fair usage.
 */

const { rateLimiterService } = require('./index');

/**
 * Run the test
 */
async function runTest() {
  console.log('=== Rate Limiter Test ===\n');

  // Set up exceeded event listener
  rateLimiterService.on('exceeded', (event) => {
    console.log(`RATE LIMIT EXCEEDED: ${event.identifier} (${event.action}) at ${new Date(event.timestamp).toLocaleTimeString()}`);
  });

  // Test basic rate limiting
  console.log('--- Basic Rate Limiting ---');
  const userId = 'test-user-123';
  
  // Set a custom limit for testing
  rateLimiterService.setCustomLimit(userId, {
    limit: 5,
    window: 60000 // 1 minute
  });
  
  console.log(`Custom limit set for ${userId}: 5 requests per minute`);
  
  // Check initial status
  const initialStatus = rateLimiterService.getStatus(userId);
  console.log('Initial status:', {
    allowed: initialStatus.allowed,
    remaining: initialStatus.remaining,
    limit: initialStatus.limit,
    resetAt: new Date(initialStatus.reset).toLocaleTimeString()
  });
  console.log();

  // Test consuming tokens
  console.log('--- Consuming Rate Limit Tokens ---');
  
  // Consume tokens one by one
  for (let i = 1; i <= 6; i++) {
    const result = rateLimiterService.consume(userId, {
      action: 'api-call',
      cost: 1
    });
    
    console.log(`Request ${i}: ${result.allowed ? 'Allowed' : 'Blocked'} (${result.remaining}/${result.limit} remaining)`);
  }
  console.log();

  // Test different costs
  console.log('--- Testing Different Costs ---');
  
  // Reset the rate limit
  rateLimiterService.reset(userId);
  console.log(`Rate limit reset for ${userId}`);
  
  // Consume with different costs
  const result1 = rateLimiterService.consume(userId, {
    action: 'simple-query',
    cost: 1
  });
  
  console.log(`Simple query: ${result1.allowed ? 'Allowed' : 'Blocked'} (${result1.remaining}/${result1.limit} remaining)`);
  
  const result2 = rateLimiterService.consume(userId, {
    action: 'complex-query',
    cost: 3
  });
  
  console.log(`Complex query: ${result2.allowed ? 'Allowed' : 'Blocked'} (${result2.remaining}/${result2.limit} remaining)`);
  
  const result3 = rateLimiterService.consume(userId, {
    action: 'very-complex-query',
    cost: 2
  });
  
  console.log(`Very complex query: ${result3.allowed ? 'Allowed' : 'Blocked'} (${result3.remaining}/${result3.limit} remaining)`);
  console.log();

  // Test multiple users
  console.log('--- Testing Multiple Users ---');
  
  // Create a few users with different limits
  const users = [
    { id: 'free-user', limit: 10, window: 3600000 },
    { id: 'premium-user', limit: 100, window: 3600000 },
    { id: 'admin-user', limit: 1000, window: 3600000 }
  ];
  
  // Set custom limits
  users.forEach(user => {
    rateLimiterService.setCustomLimit(user.id, {
      limit: user.limit,
      window: user.window
    });
  });
  
  // Consume some tokens for each user
  users.forEach(user => {
    // Consume random number of tokens
    const tokensToConsume = Math.floor(Math.random() * (user.limit * 0.3));
    
    for (let i = 0; i < tokensToConsume; i++) {
      rateLimiterService.consume(user.id, {
        action: 'api-call'
      });
    }
    
    // Get status
    const status = rateLimiterService.getStatus(user.id);
    
    console.log(`${user.id}: ${status.remaining}/${status.limit} remaining (${Math.round((status.remaining / status.limit) * 100)}% available)`);
  });
  console.log();

  // Get all limiters
  console.log('--- All Active Rate Limiters ---');
  const allLimiters = rateLimiterService.getAllLimiters();
  
  allLimiters.forEach(limiter => {
    console.log(`${limiter.identifier}: ${limiter.remaining}/${limiter.limit} remaining, resets at ${new Date(limiter.reset).toLocaleTimeString()}`);
  });
  console.log();

  // Test rate limit reset
  console.log('--- Testing Rate Limit Reset ---');
  
  // Reset a specific user
  const resetResult = rateLimiterService.reset('free-user');
  console.log(`Reset 'free-user': ${resetResult ? 'Success' : 'Failed'}`);
  
  // Check status after reset
  const statusAfterReset = rateLimiterService.getStatus('free-user');
  console.log('Status after reset:', {
    allowed: statusAfterReset.allowed,
    remaining: statusAfterReset.remaining,
    limit: statusAfterReset.limit
  });
  console.log();

  // Test removing custom limit
  console.log('--- Removing Custom Limit ---');
  
  // Remove custom limit
  const removeResult = rateLimiterService.removeCustomLimit('premium-user');
  console.log(`Remove custom limit for 'premium-user': ${removeResult ? 'Success' : 'Failed'}`);
  
  // Check status after removal
  const statusAfterRemoval = rateLimiterService.getStatus('premium-user');
  console.log('Status after removal:', {
    allowed: statusAfterRemoval.allowed,
    remaining: statusAfterRemoval.remaining,
    limit: statusAfterRemoval.limit
  });
  console.log();

  console.log('=== Test Completed ===');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
});
