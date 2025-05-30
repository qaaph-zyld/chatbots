# Template System for Common Use Cases

This directory contains the template system implementation for the Open-Source Chatbots Platform. The template system provides pre-defined configurations for common chatbot use cases, allowing users to quickly create and customize chatbots without starting from scratch.

## Features

- **Pre-defined Templates**: Ready-to-use templates for common chatbot use cases (customer support, sales, FAQ, education, personal assistant)
- **Customization Options**: Ability to override any aspect of a template when applying it to a bot
- **Template Management**: API for creating, updating, retrieving, and deleting templates
- **Bot Creation**: Create new bots from templates or apply templates to existing bots
- **Category Organization**: Templates organized by categories for easy discovery
- **Persistence**: Templates stored in the local storage system

## Components

- **Template Service**: Core service for managing templates and applying them to bots
- **Template Controller**: API controller for handling template-related HTTP requests
- **Template Routes**: API routes for template management

## Default Templates

The system comes with several pre-defined templates:

1. **Customer Support**: Template for customer support chatbots with responses for handling product inquiries, order status, returns, and complaints
2. **Sales Assistant**: Template for sales and lead generation chatbots with responses for product inquiries, pricing, features, and purchase assistance
3. **FAQ Bot**: Template for frequently asked questions chatbots with integration to knowledge bases
4. **Educational Assistant**: Template for educational and tutoring chatbots with concept explanations, practice problems, and study tips
5. **Personal Assistant**: Template for personal assistant chatbots with reminders, scheduling, weather, and note-taking capabilities

## Template Structure

Each template has the following structure:

```javascript
{
  id: 'template-id',
  name: 'Template Name',
  description: 'Template description',
  category: 'business', // business, education, personal, information, etc.
  icon: 'icon-name', // Font Awesome icon name
  config: {
    personality: {
      traits: {
        helpfulness: 0.9,
        formality: 0.7,
        // Other personality traits
      },
      tone: 'professional', // professional, conversational, enthusiastic, etc.
      language: 'concise' // concise, detailed, persuasive, etc.
    },
    intents: [
      'greeting',
      'farewell',
      // Other intents
    ],
    responses: {
      greeting: 'Hello! I\'m {{bot_name}}, your assistant. How can I help you today?',
      farewell: 'Thank you for chatting with me. Have a great day!',
      // Other responses
    },
    plugins: [
      'plugin-id-1',
      'plugin-id-2',
      // Other plugins
    ],
    settings: {
      // Template-specific settings
    }
  }
}
```

## API Endpoints

The template system exposes the following API endpoints:

- `GET /api/templates`: Get all templates with optional filtering and pagination
- `GET /api/templates/:id`: Get a specific template by ID
- `POST /api/templates`: Create a new template (requires authentication)
- `PUT /api/templates/:id`: Update an existing template (requires authentication)
- `DELETE /api/templates/:id`: Delete a template (requires authentication)
- `POST /api/templates/:templateId/apply/:botId`: Apply a template to an existing bot (requires authentication)
- `POST /api/templates/:templateId/create-bot`: Create a new bot from a template (requires authentication)

## Usage Examples

### Creating a Bot from a Template

```javascript
const { templateService } = require('./templates');

async function createCustomerSupportBot() {
  const bot = await templateService.createBotFromTemplate(
    'customer-support',
    {
      name: 'My Support Bot',
      description: 'A customer support bot for my company'
    },
    {
      // Customizations
      responses: {
        greeting: 'Hello! I\'m the support assistant for ACME Corp. How can I help you today?'
      },
      settings: {
        handoff_threshold: 5 // Override the default handoff threshold
      }
    }
  );
  
  console.log('Bot created:', bot);
}
```

### Applying a Template to an Existing Bot

```javascript
const { templateService } = require('./templates');

async function applyTemplateToBot(botId) {
  const updatedBot = await templateService.applyTemplate(
    'faq-bot',
    botId,
    {
      // Customizations
      plugins: ['knowledge-base', 'semantic-search', 'feedback-collector', 'custom-plugin']
    }
  );
  
  console.log('Template applied to bot:', updatedBot);
}
```

## Integration with Other Components

The template system integrates with the following components:

- **Storage Service**: Templates are stored and retrieved using the local storage service
- **Personality System**: Templates include personality configurations that are applied to bots
- **Plugin Architecture**: Templates specify which plugins should be enabled for the bot
- **Bot Service**: Templates are applied to bots through the bot service

## Extending

To add a new template:

1. Define the template structure with appropriate personality, intents, responses, plugins, and settings
2. Use the template service to create the template
3. The template will be automatically available through the API

## License

This component is licensed under the MIT License, the same as the main project.
