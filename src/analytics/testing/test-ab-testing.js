/**
 * Test script for A/B Testing
 * 
 * This script demonstrates the usage of the A/B Testing service
 * for optimizing chatbot configurations and responses.
 */

const { abTestingService } = require('./ab-testing.service');

/**
 * Run the test
 */
async function runTest() {
  console.log('=== A/B Testing Framework Test ===\n');

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
    ],
    targetUserGroups: ['new_users', 'returning_users'],
    trafficAllocation: 100, // 100% of traffic included in test
  });

  console.log('Test created:', testResult.success);
  if (testResult.success) {
    console.log(`Test ID: ${testResult.test.id}`);
    console.log(`Test Name: ${testResult.test.name}`);
    console.log(`Variants: ${testResult.test.variants.length}`);
    console.log(`Status: ${testResult.test.status}`);
    console.log(`Start Date: ${testResult.test.startDate}`);
    console.log(`End Date: ${testResult.test.endDate}`);
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
      userId,
      userAttributes: {
        group: Math.random() > 0.5 ? 'new_users' : 'returning_users'
      }
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
      
      // Track some additional events
      if (Math.random() < 0.8) {
        abTestingService.trackEvent({
          testId: testResult.test.id,
          userId,
          event: 'message_sent',
          value: Math.floor(Math.random() * 5) + 1 // 1-5 messages
        });
      }
      
      if (Math.random() < 0.3) {
        abTestingService.trackEvent({
          testId: testResult.test.id,
          userId,
          event: 'feature_used',
          value: 1,
          metadata: {
            feature: ['search', 'help', 'feedback'][Math.floor(Math.random() * 3)]
          }
        });
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
      
      console.log(`- Confidence Interval: ${result.confidence.lowerBound.toFixed(2)}% - ${result.confidence.upperBound.toFixed(2)}%`);
    }
    
    if (resultsResult.winner) {
      console.log(`\nWinner: ${resultsResult.winner.variantName}`);
    } else {
      console.log('\nNo clear winner yet');
    }
  }
  console.log();
  
  // Stop the test
  console.log('--- Stopping A/B Test ---');
  const stopResult = abTestingService.stopTest(testResult.test.id);
  console.log('Test stopped:', stopResult.success);
  if (stopResult.success) {
    console.log(`Status: ${stopResult.test.status}`);
  }
  console.log();
  
  // Demonstrate creating a more complex test
  console.log('--- Creating Complex A/B Test ---');
  const complexTestResult = abTestingService.createTest({
    name: 'Response Style Optimization',
    description: 'Testing different response styles and formats',
    variants: [
      {
        name: 'Text Only',
        description: 'Plain text responses only',
        configuration: {
          responseType: 'text',
          includeEmojis: false,
          maxLength: 200
        },
        isControl: true,
        weight: 1
      },
      {
        name: 'Rich Text',
        description: 'Rich text with formatting',
        configuration: {
          responseType: 'rich',
          includeEmojis: true,
          maxLength: 300
        },
        weight: 1
      },
      {
        name: 'Concise',
        description: 'Short and concise responses',
        configuration: {
          responseType: 'text',
          includeEmojis: false,
          maxLength: 100
        },
        weight: 1
      },
      {
        name: 'Visual',
        description: 'Responses with visual elements',
        configuration: {
          responseType: 'visual',
          includeEmojis: true,
          maxLength: 250
        },
        weight: 2 // Double the traffic for this variant
      }
    ],
    trafficAllocation: 50, // Only 50% of traffic included in test
  });
  
  console.log('Complex test created:', complexTestResult.success);
  if (complexTestResult.success) {
    console.log(`Test ID: ${complexTestResult.test.id}`);
    console.log(`Test Name: ${complexTestResult.test.name}`);
    console.log(`Variants: ${complexTestResult.test.variants.length}`);
    console.log(`Traffic Allocation: ${complexTestResult.test.trafficAllocation}%`);
  }
  console.log();
  
  console.log('=== Test Complete ===');
  console.log('The A/B Testing framework is ready for use in the chatbot platform.');
  console.log();
  console.log('Key features demonstrated:');
  console.log('1. Creating and managing A/B tests');
  console.log('2. Assigning users to test variants');
  console.log('3. Tracking conversions and events');
  console.log('4. Analyzing test results with statistical significance');
  console.log('5. Determining winning variants');
  console.log('6. Supporting complex test configurations');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
});
