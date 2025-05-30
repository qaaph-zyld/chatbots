# Custom CSS and Theming

## Overview

The Custom CSS and Theming system allows you to fully customize the appearance of your chatbots. This document provides a comprehensive guide to using these features to create visually appealing and branded chatbot experiences.

## Key Features

### 1. Theme Management

The theme management system allows you to:

- Create custom themes with predefined color schemes, typography, spacing, and more
- Apply themes to chatbots
- Share themes with other users
- Generate CSS from themes for use in external applications

### 2. Custom CSS

The custom CSS feature enables you to:

- Add custom CSS rules to override default styling
- Create advanced visual effects and animations
- Implement responsive designs for different screen sizes
- Customize specific components of the chatbot interface

### 3. Visual Customization

The visual customization options include:

- Color schemes (primary, secondary, accent, background, text, etc.)
- Typography (font families, sizes, weights, line heights)
- Spacing and layout (margins, padding, container sizes)
- Borders and border radius
- Shadows and elevation
- Animations and transitions

## Usage Guide

### Creating a Custom Theme

To create a custom theme:

```javascript
// Client-side example
const response = await axios.post(
  '/api/themes',
  {
    name: 'Corporate Blue',
    description: 'A professional theme with blue color scheme',
    isPublic: true,
    colors: {
      primary: '#003366',
      secondary: '#336699',
      accent: '#FF9900',
      background: '#FFFFFF',
      text: '#333333',
      error: '#CC0000',
      success: '#00CC66',
      warning: '#FFCC00',
      info: '#3399FF'
    },
    typography: {
      fontFamily: 'Roboto, sans-serif',
      headingFontFamily: 'Roboto, sans-serif',
      fontSize: '16px',
      headingSizes: {
        h1: '2.5rem',
        h2: '2rem',
        h3: '1.75rem',
        h4: '1.5rem',
        h5: '1.25rem',
        h6: '1rem'
      },
      fontWeights: {
        normal: 400,
        bold: 700,
        light: 300
      },
      lineHeight: '1.5'
    },
    spacing: {
      unit: '1rem',
      small: '0.5rem',
      medium: '1rem',
      large: '2rem',
      extraLarge: '4rem'
    },
    borders: {
      radius: '0.25rem',
      width: '1px',
      style: 'solid',
      color: '#DDDDDD'
    },
    shadows: {
      small: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      medium: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
      large: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)'
    },
    animations: {
      transition: 'all 0.3s ease',
      duration: '0.3s',
      timing: 'ease'
    },
    layout: {
      containerWidth: '1200px',
      chatWidth: '400px',
      chatHeight: '600px',
      chatPosition: 'right'
    },
    customCSS: `
      /* Custom styles for chat bubbles */
      .bot-message {
        border-top-left-radius: 0;
      }
      
      .user-message {
        border-top-right-radius: 0;
      }
    `
  }
);
```

### Applying a Theme to a Chatbot

To apply a theme to a chatbot:

```javascript
// Client-side example
const response = await axios.post(
  `/api/themes/chatbots/${chatbotId}/apply/${themeId}`
);
```

### Getting CSS from a Theme

To get the generated CSS for a theme:

```javascript
// Client-side example
const response = await axios.get(
  `/api/themes/${themeId}/css`,
  {
    responseType: 'text'
  }
);

// Use the CSS in your application
const css = response.data;
```

### Using Default Themes

To create the default themes:

```javascript
// Client-side example
const response = await axios.post(
  '/api/themes/defaults/create'
);
```

### Browsing Available Themes

To browse available themes:

```javascript
// Client-side example
const response = await axios.get(
  '/api/themes',
  {
    params: {
      isPublic: true,
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
  }
);
```

## Customization Options

### Colors

The color scheme defines the visual identity of your chatbot:

```json
{
  "colors": {
    "primary": "#003366",    // Main brand color
    "secondary": "#336699",  // Secondary brand color
    "accent": "#FF9900",     // Accent color for highlights
    "background": "#FFFFFF", // Background color
    "text": "#333333",       // Text color
    "error": "#CC0000",      // Error messages
    "success": "#00CC66",    // Success messages
    "warning": "#FFCC00",    // Warning messages
    "info": "#3399FF"        // Informational messages
  }
}
```

### Typography

Typography settings control the text appearance:

```json
{
  "typography": {
    "fontFamily": "Roboto, sans-serif",
    "headingFontFamily": "Roboto, sans-serif",
    "fontSize": "16px",
    "headingSizes": {
      "h1": "2.5rem",
      "h2": "2rem",
      "h3": "1.75rem",
      "h4": "1.5rem",
      "h5": "1.25rem",
      "h6": "1rem"
    },
    "fontWeights": {
      "normal": 400,
      "bold": 700,
      "light": 300
    },
    "lineHeight": "1.5"
  }
}
```

### Spacing

Spacing settings control the whitespace and layout:

```json
{
  "spacing": {
    "unit": "1rem",         // Base unit for spacing
    "small": "0.5rem",      // Small spacing (8px)
    "medium": "1rem",       // Medium spacing (16px)
    "large": "2rem",        // Large spacing (32px)
    "extraLarge": "4rem"    // Extra large spacing (64px)
  }
}
```

### Borders

Border settings control the appearance of borders:

```json
{
  "borders": {
    "radius": "0.25rem",    // Border radius for rounded corners
    "width": "1px",         // Border width
    "style": "solid",       // Border style (solid, dashed, dotted)
    "color": "#DDDDDD"      // Border color
  }
}
```

### Shadows

Shadow settings control the depth and elevation:

```json
{
  "shadows": {
    "small": "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
    "medium": "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)",
    "large": "0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)"
  }
}
```

### Animations

Animation settings control the motion and transitions:

```json
{
  "animations": {
    "transition": "all 0.3s ease",  // Default transition
    "duration": "0.3s",             // Animation duration
    "timing": "ease"                // Timing function
  }
}
```

### Layout

Layout settings control the overall dimensions:

```json
{
  "layout": {
    "containerWidth": "1200px",  // Max width of the container
    "chatWidth": "400px",        // Width of the chat window
    "chatHeight": "600px",       // Height of the chat window
    "chatPosition": "right"      // Position of the chat window (left, right, center)
  }
}
```

### Custom CSS

The custom CSS field allows you to add any additional CSS rules:

```json
{
  "customCSS": "
    /* Custom styles for chat bubbles */
    .bot-message {
      border-top-left-radius: 0;
    }
    
    .user-message {
      border-top-right-radius: 0;
    }
    
    /* Custom scrollbar */
    .chatbot-messages::-webkit-scrollbar {
      width: 8px;
    }
    
    .chatbot-messages::-webkit-scrollbar-thumb {
      background-color: var(--primary-color);
      border-radius: 4px;
    }
  "
}
```

## CSS Variables

The theme system generates CSS variables that you can use in your custom CSS:

```css
:root {
  /* Colors */
  --primary-color: #003366;
  --secondary-color: #336699;
  --accent-color: #FF9900;
  --background-color: #FFFFFF;
  --text-color: #333333;
  --error-color: #CC0000;
  --success-color: #00CC66;
  --warning-color: #FFCC00;
  --info-color: #3399FF;
  
  /* Typography */
  --font-family: Roboto, sans-serif;
  --heading-font-family: Roboto, sans-serif;
  --font-size: 16px;
  --h1-size: 2.5rem;
  --h2-size: 2rem;
  --h3-size: 1.75rem;
  --h4-size: 1.5rem;
  --h5-size: 1.25rem;
  --h6-size: 1rem;
  --font-weight-normal: 400;
  --font-weight-bold: 700;
  --font-weight-light: 300;
  --line-height: 1.5;
  
  /* Spacing */
  --spacing-unit: 1rem;
  --spacing-small: 0.5rem;
  --spacing-medium: 1rem;
  --spacing-large: 2rem;
  --spacing-xl: 4rem;
  
  /* Borders */
  --border-radius: 0.25rem;
  --border-width: 1px;
  --border-style: solid;
  --border-color: #DDDDDD;
  
  /* Shadows */
  --shadow-small: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  --shadow-medium: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
  --shadow-large: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
  
  /* Animations */
  --transition: all 0.3s ease;
  --duration: 0.3s;
  --timing: ease;
  
  /* Layout */
  --container-width: 1200px;
  --chat-width: 400px;
  --chat-height: 600px;
}
```

## API Reference

### Theme Management

**Endpoint:** `POST /api/themes`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "isPublic": "boolean",
  "colors": "object",
  "typography": "object",
  "spacing": "object",
  "borders": "object",
  "shadows": "object",
  "animations": "object",
  "layout": "object",
  "customCSS": "string",
  "previewImage": "string"
}
```

**Endpoint:** `GET /api/themes/{themeId}`

**Endpoint:** `PUT /api/themes/{themeId}`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "isPublic": "boolean",
  "colors": "object",
  "typography": "object",
  "spacing": "object",
  "borders": "object",
  "shadows": "object",
  "animations": "object",
  "layout": "object",
  "customCSS": "string",
  "previewImage": "string"
}
```

**Endpoint:** `DELETE /api/themes/{themeId}`

**Authentication:** Required

**Endpoint:** `GET /api/themes`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `sortBy`: Field to sort by
- `sortOrder`: Sort order (`asc` or `desc`)
- `creator`: Creator ID
- `isPublic`: Filter by public status
- `isDefault`: Filter by default status
- `search`: Search term

**Endpoint:** `POST /api/themes/chatbots/{chatbotId}/apply/{themeId}`

**Authentication:** Required

**Endpoint:** `GET /api/themes/{themeId}/css`

**Endpoint:** `POST /api/themes/defaults/create`

**Authentication:** Required

## Best Practices

1. **Use a Consistent Color Scheme**: Choose a color scheme that aligns with your brand and maintain consistency across all elements.

2. **Prioritize Readability**: Ensure that text is readable by maintaining sufficient contrast between text and background colors.

3. **Use Typography Effectively**: Choose appropriate font sizes and weights to create a clear visual hierarchy.

4. **Be Responsive**: Design your chatbot to look good on all devices by using responsive design principles.

5. **Test on Multiple Devices**: Test your theme on different devices and browsers to ensure compatibility.

6. **Limit Custom CSS**: Use the built-in theme options when possible and only use custom CSS for specific customizations.

7. **Optimize for Performance**: Keep your custom CSS minimal and efficient to ensure good performance.

8. **Use CSS Variables**: Leverage the CSS variables generated by the theme system for consistency.

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

The Custom CSS and Theming system provides powerful tools for creating visually appealing and branded chatbot experiences. By leveraging the theme management system and custom CSS capabilities, you can create unique and engaging chatbot interfaces that align with your brand identity.
