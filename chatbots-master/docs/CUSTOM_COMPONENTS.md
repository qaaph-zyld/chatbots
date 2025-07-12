# Custom Component Development

This guide explains how to create, manage, and use custom components in the chatbot platform.

## Table of Contents

1. [Introduction](#introduction)
2. [Component Architecture](#component-architecture)
3. [Creating a Custom Component](#creating-a-custom-component)
4. [Component Structure](#component-structure)
5. [Component Registry](#component-registry)
6. [Using Custom Components](#using-custom-components)
7. [Best Practices](#best-practices)
8. [API Reference](#api-reference)

## Introduction

The custom component system allows developers to extend the chatbot platform with specialized UI components tailored to specific needs. These components can be used in chatbot conversations, workflows, and user interfaces.

Custom components are built using React and follow a standardized structure that ensures they integrate seamlessly with the platform.

## Component Architecture

The custom component system consists of the following key parts:

1. **Component Registry**: Manages the registration, discovery, and loading of custom components
2. **Component Interface**: Defines the standard interface that all custom components must implement
3. **Component Scaffolder**: Provides tools for creating new custom components with the correct structure
4. **Component Service**: Handles the business logic for managing custom components
5. **API Endpoints**: Allows interaction with custom components via REST API

## Creating a Custom Component

There are two ways to create a custom component:

### Using the Web Interface

1. Navigate to `/components` in the web interface
2. Click "Create Component"
3. Fill in the required information:
   - **Name**: Unique name for the component (PascalCase)
   - **Type**: The type of component (message, input, button, etc.)
   - **Description**: Brief description of the component
   - **Author**: Your name or organization
4. Click "Create Component"

### Using the API

Send a POST request to `/api/components` with the following JSON body:

```json
{
  "name": "MyCustomComponent",
  "type": "message",
  "description": "A custom message component",
  "author": "Your Name"
}
```

## Component Structure

A custom component consists of the following files:

- **index.js**: Main component file that exports the component metadata and implementation
- **component.jsx**: React component implementation
- **styles.css**: Component styles
- **README.md**: Documentation for the component
- **package.json**: Component dependencies

### index.js

The `index.js` file exports the component metadata and implementation:

```javascript
module.exports = {
  name: 'MyComponent',
  displayName: 'My Component',
  type: 'message',
  version: '1.0.0',
  description: 'A custom message component',
  author: 'Your Name',
  props: {
    // Component props schema
  },
  tags: ['custom', 'message'],
  icon: 'message',
  settings: {
    // Component settings
  },
  component: MyComponent,
  validateProps: (props) => {
    // Validate props
    return true;
  },
  getDefaultProps: () => {
    // Return default props
    return {};
  }
};
```

### component.jsx

The `component.jsx` file contains the React component implementation:

```jsx
const React = require('react');
require('./styles.css');

const MyComponent = (props) => {
  // Implement your component here
  return (
    <div className="my-component">
      <h3>{props.title}</h3>
      <div className="my-component-content">
        {props.children}
      </div>
    </div>
  );
};

module.exports = MyComponent;
```

### styles.css

The `styles.css` file contains the component styles:

```css
.my-component {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 16px;
  margin: 8px 0;
  background-color: #ffffff;
}

.my-component h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333333;
}

.my-component-content {
  font-size: 14px;
  color: #666666;
}
```

## Component Registry

The component registry manages the registration, discovery, and loading of custom components. It provides the following functionality:

- Loading components from the file system
- Validating component structure
- Registering components with the platform
- Retrieving components by name, type, or version

## Using Custom Components

Custom components can be used in the following ways:

### In Chatbot Conversations

Custom components can be used in chatbot conversations by referencing them in the conversation flow:

```javascript
const response = {
  type: 'custom',
  component: 'MyComponent',
  props: {
    title: 'My Custom Component',
    // Other props
  }
};
```

### In Workflows

Custom components can be used in workflows by adding them to workflow nodes:

```javascript
const node = {
  id: 'node1',
  type: 'custom',
  component: 'MyComponent',
  props: {
    title: 'My Custom Component',
    // Other props
  }
};
```

### In User Interfaces

Custom components can be used in user interfaces by importing them from the component registry:

```jsx
import { useComponent } from '../hooks/useComponent';

const MyPage = () => {
  const MyComponent = useComponent('MyComponent');
  
  return (
    <div>
      <h1>My Page</h1>
      <MyComponent title="My Custom Component" />
    </div>
  );
};
```

## Best Practices

### Component Naming

- Use PascalCase for component names (e.g., `RatingCard`, `UserProfile`)
- Use descriptive names that reflect the component's purpose
- Avoid generic names that might conflict with built-in components

### Component Structure

- Keep components focused on a single responsibility
- Use props for configuration rather than hardcoding values
- Document all props with descriptions and types
- Provide sensible default props
- Validate props to ensure they meet the component's requirements

### Component Styling

- Use BEM-style class names to avoid conflicts with other components
- Use CSS variables for theming when appropriate
- Ensure components are responsive and work on all screen sizes
- Test components in different themes (light, dark, etc.)

### Component Performance

- Optimize component rendering to avoid unnecessary re-renders
- Use memoization for expensive calculations
- Avoid excessive DOM manipulation
- Test components with large datasets to ensure they perform well

## API Reference

### Component Service API

#### Get All Components

```
GET /api/components
```

Returns an array of all registered components.

#### Get Components by Type

```
GET /api/components/type/:type
```

Returns an array of components of the specified type.

#### Get Component by Name and Version

```
GET /api/components/:name/:version?
```

Returns the component with the specified name and version. If version is omitted, returns the latest version.

#### Create Component

```
POST /api/components
```

Creates a new component with the specified options.

Request body:

```json
{
  "name": "MyComponent",
  "type": "message",
  "description": "A custom message component",
  "author": "Your Name"
}
```

#### Delete Component

```
DELETE /api/components/:name/:version
```

Deletes the component with the specified name and version.

#### Get Component Types

```
GET /api/components/types
```

Returns an array of all available component types.

#### Add Component Type

```
POST /api/components/types
```

Adds a new component type.

Request body:

```json
{
  "type": "custom-type"
}
```
