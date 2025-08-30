#!/usr/bin/env node
// Use the complete test orchestrator as the master orchestrator

const CompleteTestOrchestrator = require('./complete_test_orchestrator');

const orchestrator = new CompleteTestOrchestrator();
orchestrator.executeTransformation().then(() => {
    console.log('✅ Single iteration test orchestrator completed successfully');
    process.exit(0);
}).catch((error) => {
    console.error('❌ Single iteration test orchestrator failed:', error);
    process.exit(1);
});
