# ShopBot User Guide

## Getting Started

Welcome to ShopBot - the AI-powered customer support automation platform for e-commerce stores. This guide will help you set up and configure ShopBot for your Shopify or WooCommerce store.

## Quick Setup

### 1. Account Registration
1. Visit [ShopBot Dashboard](https://dashboard.shopbot.com)
2. Sign up with your email address
3. Verify your email account
4. Complete your store profile

### 2. Store Integration

#### For Shopify Stores
1. **Install the ShopBot App**
   - Go to the Shopify App Store
   - Search for "ShopBot Customer Support"
   - Click "Add app" and authorize permissions

2. **Configure API Access**
   - The app will automatically configure API access
   - Review and approve the requested permissions:
     - Read orders, customers, and products
     - Write order notes and customer data
     - Access to webhooks for real-time updates

3. **Customize Settings**
   - Set business hours
   - Configure escalation rules
   - Choose response templates

#### For WooCommerce Stores
1. **Install the Plugin**
   - Download the ShopBot plugin from WordPress repository
   - Upload and activate in your WordPress admin
   - Or install directly from Plugins → Add New

2. **Generate API Keys**
   - Go to WooCommerce → Settings → Advanced → REST API
   - Create new API keys with Read/Write permissions
   - Copy the Consumer Key and Consumer Secret

3. **Configure ShopBot**
   - Enter your site URL
   - Paste the API credentials
   - Test the connection

### 3. Chat Widget Setup

#### Embedding the Chat Widget
Add this code to your store's theme before the closing `</body>` tag:

```html
<script>
  window.ShopBotConfig = {
    storeId: 'your_store_id',
    position: 'bottom-right',
    theme: 'auto',
    language: 'en'
  };
</script>
<script src="https://cdn.shopbot.com/widget.js" async></script>
```

#### Widget Customization
```javascript
window.ShopBotConfig = {
  storeId: 'your_store_id',
  position: 'bottom-right', // 'bottom-left', 'bottom-right'
  theme: 'light', // 'light', 'dark', 'auto'
  language: 'en', // 'en', 'es', 'fr', 'de'
  primaryColor: '#007cba',
  greeting: 'Hi! How can I help you today?',
  placeholder: 'Type your message...',
  showOnPages: ['product', 'cart', 'checkout'], // Optional: specific pages
  hideOnPages: ['thank-you'], // Optional: pages to hide widget
  businessHours: {
    enabled: true,
    timezone: 'America/New_York',
    schedule: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: { start: '10:00', end: '16:00' },
      sunday: { closed: true }
    }
  }
};
```

## Features Overview

### Automated Customer Support
- **Order Status Inquiries**: Automatic order lookup and status updates
- **Shipping Information**: Tracking number provision and delivery estimates
- **Return & Refund Processing**: Automated eligibility checks and process initiation
- **Product Information**: Inventory status, specifications, and recommendations

### Smart Escalation
- **Keyword Triggers**: Automatic escalation for words like "manager", "complaint"
- **Complexity Detection**: AI identifies when human intervention is needed
- **Business Hours**: Automatic escalation outside business hours
- **Customer Request**: Manual escalation option for customers

### Analytics & Insights
- **Conversation Metrics**: Volume, resolution rate, response times
- **Customer Satisfaction**: Ratings and feedback collection
- **Performance Tracking**: Bot effectiveness and improvement areas
- **Revenue Impact**: Conversion tracking and sales attribution

## Configuration Guide

### Business Hours Setup
1. Go to Settings → Business Hours
2. Set your timezone
3. Configure daily schedules
4. Set holiday schedules
5. Define after-hours behavior

### Response Templates
Create custom responses for common scenarios:

```
Order Status Template:
"Hi {customer_name}! Your order #{order_number} is currently {status}. 
{shipping_info} 
Is there anything else I can help you with?"
```

### Escalation Rules
Configure when conversations should be escalated:
- **Keywords**: "manager", "supervisor", "complaint", "urgent"
- **Wait Time**: After 5 minutes of inactivity
- **Complexity**: When confidence score drops below 70%
- **Customer Request**: When customer asks to speak to a human

### Integration Settings

#### Webhook Configuration
Set up webhooks to receive real-time updates:
- Order status changes
- Customer updates
- Inventory changes
- New product additions

#### Custom Fields
Map your store's custom fields to ShopBot:
- Customer attributes
- Order metadata
- Product specifications
- Custom taxonomies

## Common Use Cases

### Order Tracking
**Customer**: "Where is my order #1001?"
**ShopBot**: 
1. Looks up order in your store
2. Retrieves current status and tracking info
3. Provides estimated delivery date
4. Offers to send tracking updates

### Return Requests
**Customer**: "I want to return my recent purchase"
**ShopBot**:
1. Identifies recent orders for customer
2. Checks return policy eligibility
3. Generates return authorization
4. Provides return shipping label

### Product Inquiries
**Customer**: "Do you have this product in blue?"
**ShopBot**:
1. Searches product catalog
2. Checks variant availability
3. Shows current inventory
4. Suggests alternatives if out of stock

### Complaint Handling
**Customer**: "I'm not happy with my order"
**ShopBot**:
1. Recognizes complaint keywords
2. Gathers order details
3. Escalates to human agent
4. Provides case reference number

## Best Practices

### Response Quality
- Keep responses conversational and friendly
- Use customer's name when available
- Provide specific, actionable information
- Always offer additional help

### Escalation Strategy
- Set clear escalation triggers
- Train staff on handoff procedures
- Maintain conversation context
- Follow up on escalated cases

### Performance Optimization
- Monitor response times
- Review conversation logs
- Update templates based on feedback
- Train AI with new scenarios

## Troubleshooting

### Common Issues

#### Widget Not Appearing
1. Check if script is properly embedded
2. Verify store ID is correct
3. Check for JavaScript errors in console
4. Ensure domain is whitelisted

#### Orders Not Found
1. Verify API credentials are correct
2. Check API permissions include order access
3. Confirm order number format matches
4. Test API connection in settings

#### Escalations Not Working
1. Check escalation rules configuration
2. Verify agent availability settings
3. Test webhook endpoints
4. Review escalation logs

### Getting Help
- **Documentation**: [docs.shopbot.com](https://docs.shopbot.com)
- **Support Email**: support@shopbot.com
- **Live Chat**: Available in dashboard
- **Community Forum**: [community.shopbot.com](https://community.shopbot.com)

## Advanced Configuration

### Custom Intents
Train ShopBot to recognize store-specific intents:

```javascript
// Custom intent configuration
{
  "intent": "warranty_inquiry",
  "training_phrases": [
    "warranty information",
    "how long is warranty",
    "warranty claim",
    "product guarantee"
  ],
  "response_template": "Our products come with a {warranty_period} warranty. You can file a claim by..."
}
```

### API Integration
For advanced users, integrate directly with our API:

```javascript
// Example: Create custom conversation
const response = await fetch('https://api.shopbot.com/v1/conversations', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    store_id: 'your_store_id',
    customer_id: 'customer_123',
    message: 'Hello, I need help with my order'
  })
});
```

### Multi-language Support
Configure multiple languages for international stores:

```javascript
window.ShopBotConfig = {
  storeId: 'your_store_id',
  languages: {
    en: {
      greeting: 'Hello! How can I help you?',
      placeholder: 'Type your message...'
    },
    es: {
      greeting: '¡Hola! ¿Cómo puedo ayudarte?',
      placeholder: 'Escribe tu mensaje...'
    },
    fr: {
      greeting: 'Bonjour! Comment puis-je vous aider?',
      placeholder: 'Tapez votre message...'
    }
  }
};
```

## Success Metrics

Track these KPIs to measure ShopBot's impact:

### Customer Service Metrics
- **Resolution Rate**: % of conversations resolved without escalation
- **Response Time**: Average time to first response
- **Customer Satisfaction**: Average rating from post-chat surveys
- **Escalation Rate**: % of conversations escalated to humans

### Business Impact
- **Cost Savings**: Reduction in support ticket volume
- **Revenue Impact**: Sales attributed to chat interactions
- **Conversion Rate**: % of chat visitors who make a purchase
- **Customer Retention**: Repeat purchase rate for chat users

### Operational Efficiency
- **Agent Productivity**: Increase in cases handled per agent
- **Peak Hour Coverage**: Support availability during high-traffic times
- **Multilingual Support**: Coverage across different languages
- **24/7 Availability**: Round-the-clock customer support

## Next Steps

1. **Complete Initial Setup**: Follow the quick setup guide
2. **Customize Responses**: Create store-specific templates
3. **Train Your Team**: Ensure staff understand escalation procedures
4. **Monitor Performance**: Review analytics weekly
5. **Iterate and Improve**: Update configurations based on feedback

For additional help or advanced configuration needs, contact our support team at support@shopbot.com.
