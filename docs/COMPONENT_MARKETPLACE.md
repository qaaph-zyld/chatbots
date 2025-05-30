# Component Marketplace

The Component Marketplace is a platform for sharing and discovering custom components for the chatbot platform. This guide explains how to use the marketplace to find, install, and publish components.

## Table of Contents

1. [Introduction](#introduction)
2. [Browsing the Marketplace](#browsing-the-marketplace)
3. [Installing Components](#installing-components)
4. [Using Installed Components](#using-installed-components)
5. [Rating and Reviewing Components](#rating-and-reviewing-components)
6. [Publishing Components](#publishing-components)
7. [Best Practices](#best-practices)
8. [API Reference](#api-reference)

## Introduction

The Component Marketplace allows developers to:

- Discover components created by the community
- Install components for use in their chatbots
- Rate and review components
- Publish their own components for others to use

Components in the marketplace are categorized by type and tagged with relevant keywords to make them easy to find.

## Browsing the Marketplace

To browse the marketplace, navigate to `/marketplace` in the web interface. The marketplace provides several ways to find components:

### Search

Use the search bar to find components by name, description, or author.

### Filters

Filter components by:

- **Type**: Filter by component type (message, input, button, etc.)
- **Tags**: Filter by component tags
- **Sort**: Sort by downloads, rating, name, or creation date

### Pagination

The marketplace displays components in pages. Use the pagination controls at the bottom of the page to navigate between pages.

## Installing Components

To install a component from the marketplace:

1. Find the component you want to install
2. Click the "View Details" button to see more information about the component
3. Click the "Install Component" button to install the component
4. The component will be downloaded and installed automatically
5. Once installed, the component will be available for use in your chatbots

## Using Installed Components

After installing a component from the marketplace, you can use it in your chatbots:

### In Chatbot Conversations

```javascript
const response = {
  type: 'custom',
  component: 'InstalledComponentName',
  props: {
    // Component props
  }
};
```

### In Workflows

Add the component to a workflow node:

```javascript
const node = {
  id: 'node1',
  type: 'custom',
  component: 'InstalledComponentName',
  props: {
    // Component props
  }
};
```

### In React Applications

Import the component using the `useComponent` hook:

```jsx
import { useComponent } from '../hooks/useComponent';

const MyComponent = () => {
  const InstalledComponent = useComponent('InstalledComponentName');
  
  return (
    <div>
      <h1>My Component</h1>
      <InstalledComponent {...props} />
    </div>
  );
};
```

## Rating and Reviewing Components

You can rate and review components to help others find high-quality components:

1. Navigate to the component's detail page
2. Click the "Ratings & Reviews" tab
3. Select a rating from 1 to 5 stars
4. Optionally, write a review
5. Click "Submit Review"

Your rating and review will be visible to other users and will contribute to the component's overall rating.

## Publishing Components

To publish a component to the marketplace:

### Prerequisites

Before publishing a component, make sure:

1. Your component follows the [Component Interface](./CUSTOM_COMPONENTS.md#component-interface)
2. Your component has comprehensive documentation
3. Your component has been tested thoroughly
4. You have an account on the marketplace

### Publishing Process

1. Create and test your component locally
2. Navigate to your component's detail page
3. Click the "Publish to Marketplace" button
4. Fill in the required information:
   - Component name
   - Description
   - Tags
   - Screenshots (optional)
   - Additional documentation (optional)
5. Click "Publish"

Your component will be reviewed by the marketplace team before being made available to other users.

### Updating Published Components

To update a component you've published:

1. Make changes to your component locally
2. Navigate to your component's detail page in the marketplace
3. Click the "Update Component" button
4. Upload the new version
5. Add release notes describing the changes
6. Click "Update"

## Best Practices

### Finding Quality Components

When looking for components to install, consider:

- **Rating**: Higher-rated components are generally more reliable
- **Downloads**: Popular components have been tested by more users
- **Reviews**: Read reviews to understand the component's strengths and weaknesses
- **Last Updated**: Recently updated components are more likely to work with the latest version of the platform
- **Documentation**: Well-documented components are easier to use

### Publishing Quality Components

When publishing components:

- **Documentation**: Provide clear documentation with examples
- **Props**: Document all props with types, default values, and descriptions
- **Screenshots**: Include screenshots showing the component in action
- **Tags**: Use relevant tags to make your component discoverable
- **Testing**: Test your component thoroughly before publishing
- **Versioning**: Use semantic versioning for updates

## API Reference

### Marketplace API

#### Get All Components

```
GET /api/marketplace
```

Returns a paginated list of components.

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 20)
- `sort`: Sort field (default: 'downloads')
- `order`: Sort order (default: 'desc')
- `search`: Search query
- `tags`: Comma-separated list of tags
- `type`: Component type

#### Get Component by ID

```
GET /api/marketplace/:id
```

Returns the component with the specified ID.

#### Install Component

```
POST /api/marketplace/:id/install
```

Installs the component with the specified ID.

#### Rate Component

```
POST /api/marketplace/:id/rate
```

Rates the component with the specified ID.

Request body:
```json
{
  "rating": 5,
  "review": "This is a great component!"
}
```

#### Get Component Ratings

```
GET /api/marketplace/:id/ratings
```

Returns a paginated list of ratings for the component with the specified ID.

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 20)

#### Publish Component

```
POST /api/marketplace/publish/:componentName
```

Publishes the component with the specified name to the marketplace.

Request body:
```json
{
  "description": "A detailed description of the component",
  "tags": ["tag1", "tag2"],
  "screenshots": [
    {
      "url": "https://example.com/screenshot1.png",
      "caption": "Screenshot 1"
    }
  ]
}
```
