/**
 * Example usage of the Chatbots Platform API Client
 */

const ChatbotsClient = require('./index');

// Create a client instance with the default proxy configuration
const client = new ChatbotsClient({
  apiKey: 'YOUR_API_KEY',
  // Using the default proxy configuration (104.129.196.38:10563)
  useProxy: true
});

// Example usage of the client
async function main() {
  try {
    console.log('Fetching available chatbots...');
    const chatbots = await client.getChatbots();
    
    if (chatbots.data.length === 0) {
      console.log('No chatbots available. Please create a chatbot first.');
      return;
    }
    
    // Use the first chatbot for this example
    const chatbotId = chatbots.data[0].id;
    console.log(`Using chatbot: ${chatbots.data[0].name} (${chatbotId})`);
    
    // Create a conversation
    console.log('Creating a new conversation...');
    const conversation = await client.createConversation(
      chatbotId,
      { source: 'node-client-example' }
    );
    
    const conversationId = conversation.data.id;
    console.log(`Conversation created: ${conversationId}`);
    
    // Send a message
    console.log('Sending a message...');
    const messageResponse = await client.sendMessage(
      conversationId,
      'Hello, I have a question about your services.'
    );
    
    console.log('\nUser message:');
    console.log(`Content: ${messageResponse.data.userMessage.content}`);
    console.log(`Timestamp: ${messageResponse.data.userMessage.createdAt}`);
    
    console.log('\nBot response:');
    console.log(`Content: ${messageResponse.data.botMessage.content}`);
    console.log(`Timestamp: ${messageResponse.data.botMessage.createdAt}`);
    
    // Get conversation history
    console.log('\nFetching conversation history...');
    const messages = await client.getMessages(conversationId);
    
    console.log(`Found ${messages.count} messages in the conversation:`);
    messages.data.forEach((message, index) => {
      console.log(`[${index + 1}] ${message.sender}: ${message.content}`);
    });
    
    // Search knowledge base
    console.log('\nSearching knowledge base...');
    const searchResults = await client.searchKnowledge(
      chatbotId,
      'services'
    );
    
    console.log(`Found ${searchResults.count} knowledge items:`);
    searchResults.data.forEach((item, index) => {
      console.log(`[${index + 1}] ${item.title} (Relevance: ${item.relevanceScore})`);
      console.log(`    ${item.content.substring(0, 100)}...`);
    });
    
    // Use the convenience method to create a conversation and send a message
    console.log('\nUsing the chat convenience method...');
    const chatResponse = await client.chat(
      chatbotId,
      'What are your business hours?',
      { source: 'node-client-example' }
    );
    
    console.log(`Conversation ID: ${chatResponse.conversationId}`);
    console.log(`Bot response: ${chatResponse.data.botMessage.content}`);
    
  } catch (error) {
    console.error('Error:', error.error ? error.error.message : error.message);
    if (error.error && error.error.details) {
      console.error('Details:', error.error.details);
    }
  }
}

// Run the example
main().catch(console.error);
