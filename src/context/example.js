const path = require('path');
const ContextManager = require('./ContextManager');
const WorkspaceWatcher = require('./WorkspaceWatcher');
const PromptUtils = require('./promptUtils');

async function main() {
  const workspaceRoot = path.join(__dirname, '../..'); // Adjust based on your project structure
  const contextManager = new ContextManager(workspaceRoot);
  const watcher = new WorkspaceWatcher(workspaceRoot, contextManager);

  try {
    // Start watching for file changes
    await watcher.start();

    // Example: Initialize context
    await contextManager.initialize();
    
    // Example: Get relevant context for a user query
    const userQuery = "Show me how authentication is handled in the codebase";
    const relevantContext = contextManager.getRelevantContext(userQuery);
    
    // Example: Create a prompt with context
    const prompt = PromptUtils.createUserPrompt(userQuery, relevantContext);
    console.log('Generated prompt:', JSON.stringify(prompt, null, 2));
    
    // Keep the process running
    process.stdin.resume();
    console.log('Press Ctrl+C to stop watching...');
    
    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      await watcher.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
