# Advanced Template System

## Overview

The Advanced Template System extends the basic template functionality with powerful features that enable more sophisticated customization of chatbots. This document provides a comprehensive guide to using these advanced features.

## Key Features

### 1. Template Inheritance

Template inheritance allows you to create a new template that inherits properties from a parent template. This enables:

- Creating specialized templates based on a common foundation
- Overriding specific aspects while maintaining the parent's structure
- Building template hierarchies for different use cases

### 2. Template Composition

Template composition enables you to combine multiple templates into a single composite template. This allows:

- Mixing and matching features from different templates
- Creating complex templates from simpler building blocks
- Applying different composition strategies for conflict resolution

### 3. Dynamic Variables

Dynamic variables make templates more flexible by allowing placeholders that can be replaced at runtime. Features include:

- Variable substitution in template configuration
- Conditional logic based on variable values
- Nested variable references
- Automatic variable schema generation

### 4. Template Versioning

Template versioning provides a way to track changes to templates over time. This includes:

- Creating new versions of existing templates
- Forking templates to create independent variants
- Tracking version history and changes
- Comparing different versions

### 5. Custom Styling

The advanced styling system allows for detailed visual customization of chatbot interfaces:

- Color schemes and typography
- Spacing and layout
- Animations and transitions
- Custom CSS support

## Usage Guide

### Template Inheritance

To create a template that inherits from a parent template:

```javascript
// Client-side example
const response = await axios.post(
  '/api/advanced-templates/inherit/parentTemplateId',
  {
    name: 'Customer Support Specialized',
    description: 'A specialized version of the Customer Support template',
    // Override specific configuration values
    configuration: {
      defaultResponses: {
        greeting: 'Welcome to our specialized support!'
      }
    }
  }
);
```

The new template will inherit all configuration from the parent, with the specified values overriding the parent's values.

### Template Composition

To create a composite template from multiple source templates:

```javascript
// Client-side example
const response = await axios.post(
  '/api/advanced-templates/composite',
  {
    sourceTemplateIds: ['template1Id', 'template2Id'],
    templateData: {
      name: 'Composite Template',
      description: 'A template composed from multiple sources'
    },
    compositionRules: {
      strategy: 'last-wins',
      arrayMergeStrategy: 'unique'
    }
  }
);
```

Composition rules determine how conflicts between source templates are resolved:

- `strategy`: How to resolve conflicts (`first-wins`, `last-wins`, or `custom`)
- `arrayMergeStrategy`: How to merge arrays (`concat`, `unique`, or `replace`)

### Dynamic Variables

To apply variables to a template:

```javascript
// Client-side example
const response = await axios.post(
  '/api/advanced-templates/templateId/variables',
  {
    variables: {
      companyName: 'Acme Corporation',
      supportEmail: 'support@acme.com',
      primaryColor: '#336699',
      features: ['chat', 'voice', 'email'],
      user: {
        name: 'John Doe',
        role: 'admin'
      }
    }
  }
);
```

Variables can be used in template configuration using the `{{variableName}}` syntax:

```json
{
  "configuration": {
    "defaultResponses": {
      "greeting": "Welcome to {{companyName}} support!",
      "contact": "You can reach us at {{supportEmail}}",
      "features": "We offer {{features.length}} support channels"
    },
    "styling": {
      "primaryColor": "{{primaryColor}}"
    },
    "conditionalMessage": "{{user.role === 'admin' ? 'Admin access granted' : 'Limited access'}}"
  }
}
```

To get the variables schema for a template:

```javascript
// Client-side example
const response = await axios.get(
  '/api/advanced-templates/templateId/variables/schema'
);
```

### Template Versioning

To create a new version of a template:

```javascript
// Client-side example
const response = await axios.post(
  '/api/advanced-templates/templateId/version',
  {
    configuration: {
      // Updated configuration
    },
    changeLog: 'Updated default responses and added new features'
  }
);
```

To fork a template (create an independent copy):

```javascript
// Client-side example
const response = await axios.post(
  '/api/advanced-templates/templateId/version',
  {
    name: 'My Custom Version',
    forkedVersion: true
  }
);
```

### Custom Styling

To set custom styling for a template:

```javascript
// Client-side example
const response = await axios.put(
  '/api/advanced-templates/templateId/styling',
  {
    colors: {
      primary: '#336699',
      secondary: '#66AACC',
      accent: '#FF9900',
      background: '#FFFFFF',
      text: '#333333'
    },
    fonts: {
      primary: 'Roboto, sans-serif',
      secondary: 'Open Sans, sans-serif',
      sizes: {
        small: '0.875rem',
        medium: '1rem',
        large: '1.25rem'
      }
    },
    spacing: {
      small: '0.5rem',
      medium: '1rem',
      large: '2rem'
    },
    borderRadius: '0.25rem',
    shadows: {
      small: '0 1px 3px rgba(0,0,0,0.12)',
      medium: '0 4px 6px rgba(0,0,0,0.12)',
      large: '0 10px 20px rgba(0,0,0,0.12)'
    },
    animations: {
      transition: 'all 0.3s ease',
      duration: '0.3s'
    },
    customCSS: '.chatbot-container { max-width: 400px; }'
  }
);
```

### Advanced Template Filtering

To get templates with advanced filtering:

```javascript
// Client-side example
const response = await axios.get(
  '/api/advanced-templates',
  {
    params: {
      categories: 'customer-support,sales',
      tags: 'multilingual,voice',
      isPublic: true,
      hasVariables: true,
      isComposite: true,
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
  }
);
```

## API Reference

### Template Inheritance

**Endpoint:** `POST /api/advanced-templates/inherit/:parentTemplateId`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "category": "string",
  "tags": ["string"],
  "configuration": "object",
  "previewImage": "string",
  "isPublic": "boolean",
  "status": "string",
  "metadata": "object"
}
```

### Template Composition

**Endpoint:** `POST /api/advanced-templates/composite`

**Authentication:** Required

**Request Body:**
```json
{
  "sourceTemplateIds": ["string"],
  "templateData": {
    "name": "string",
    "description": "string",
    "category": "string",
    "tags": ["string"],
    "previewImage": "string",
    "isPublic": "boolean",
    "status": "string",
    "metadata": "object"
  },
  "compositionRules": {
    "strategy": "string",
    "arrayMergeStrategy": "string",
    "customResolvers": "object"
  }
}
```

### Template Versioning

**Endpoint:** `POST /api/advanced-templates/:templateId/version`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "category": "string",
  "tags": ["string"],
  "configuration": "object",
  "previewImage": "string",
  "isPublic": "boolean",
  "status": "string",
  "forkedVersion": "boolean",
  "changeLog": "string",
  "metadata": "object"
}
```

### Dynamic Variables

**Endpoint:** `POST /api/advanced-templates/:templateId/variables`

**Request Body:**
```json
{
  "variables": "object"
}
```

**Endpoint:** `GET /api/advanced-templates/:templateId/variables/schema`

### Custom Styling

**Endpoint:** `PUT /api/advanced-templates/:templateId/styling`

**Authentication:** Required

**Request Body:**
```json
{
  "colors": "object",
  "fonts": "object",
  "spacing": "object",
  "borderRadius": "string",
  "shadows": "object",
  "animations": "object",
  "customCSS": "string",
  "layout": "object"
}
```

### Advanced Template Filtering

**Endpoint:** `GET /api/advanced-templates`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `sortBy`: Field to sort by
- `sortOrder`: Sort order (`asc` or `desc`)
- `categories`: Comma-separated list of categories
- `tags`: Comma-separated list of tags
- `creator`: Creator ID
- `isPublic`: Filter by public status
- `featured`: Filter by featured status
- `official`: Filter by official status
- `status`: Filter by status
- `search`: Search term
- `hasVariables`: Filter templates with variables
- `hasStyling`: Filter templates with styling
- `isComposite`: Filter composite templates
- `isInherited`: Filter inherited templates
- `minVersion`: Minimum version number

## Best Practices

1. **Use Inheritance for Specialization**: Create base templates for common use cases and use inheritance to create specialized variants.

2. **Use Composition for Combining Features**: When you need features from multiple templates, use composition rather than duplicating code.

3. **Define Variable Schemas**: Explicitly define variable schemas to provide clear documentation of available variables.

4. **Version Templates for Major Changes**: Create new versions for significant changes to maintain compatibility with existing chatbots.

5. **Use Consistent Styling**: Maintain consistent styling across related templates for a cohesive user experience.

6. **Document Template Relationships**: Keep track of template inheritance and composition relationships to understand dependencies.

7. **Test Templates with Different Variables**: Ensure templates work correctly with different variable values and edge cases.

## Proxy Configuration

All HTTP requests to external services use the required proxy configuration:

```javascript
const axiosConfig = {
  proxy: {
    host: '104.129.196.38',
    port: 10563
  }
};
```

## Conclusion

The Advanced Template System provides powerful tools for creating sophisticated, flexible, and reusable chatbot templates. By leveraging inheritance, composition, dynamic variables, versioning, and custom styling, you can create highly customized chatbots while maintaining a modular and maintainable codebase.
