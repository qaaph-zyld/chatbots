/**
 * Chatbots Platform Web Widget
 * A lightweight, customizable widget for embedding chatbots on websites
 */
import '@src/web-widget\src\styles\main.scss';
import '@src/web-widget\src\ChatbotWidget';

// Export the ChatbotWidget class as the default export
export default ChatbotWidget;

// Auto-initialize if the script is loaded with data-auto-init attribute
document.addEventListener('DOMContentLoaded', () => {
  const scriptTags = document.querySelectorAll('script[data-chatbot-widget]');
  
  scriptTags.forEach(script => {
    if (script.getAttribute('data-auto-init') === 'true') {
      // Extract configuration from data attributes
      const config = {
        apiKey: script.getAttribute('data-api-key'),
        chatbotId: script.getAttribute('data-chatbot-id'),
        position: script.getAttribute('data-position') || 'right',
        theme: script.getAttribute('data-theme') || 'light',
        welcomeMessage: script.getAttribute('data-welcome-message'),
        title: script.getAttribute('data-title') || 'Chatbot Assistant',
        subtitle: script.getAttribute('data-subtitle') || 'How can I help you today?',
        primaryColor: script.getAttribute('data-primary-color'),
        secondaryColor: script.getAttribute('data-secondary-color'),
        textColor: script.getAttribute('data-text-color'),
        apiUrl: script.getAttribute('data-api-url') || 'https://api.chatbots-platform.example.com',
        proxyUrl: script.getAttribute('data-proxy-url') || null,
        userId: script.getAttribute('data-user-id') || null,
        userEmail: script.getAttribute('data-user-email') || null,
        userName: script.getAttribute('data-user-name') || null
      };
      
      // Initialize the widget
      const widget = new ChatbotWidget(config);
      widget.init();
      
      // Make the widget instance accessible globally
      window.chatbotWidget = widget;
    }
  });
});
