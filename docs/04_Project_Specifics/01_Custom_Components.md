# Custom Components

This document provides documentation for custom UI components specific to the Chatbots project.

## Overview

The Chatbots platform includes several custom UI components that extend the standard component library to provide specialized functionality for chatbot interfaces. These components are designed to be reusable, accessible, and consistent with the overall design system.

## Component Directory

Custom components are located in the `/custom-components` directory at the project root. Each component has its own subdirectory containing the component code, tests, and documentation.

## Rating Card Component

The Rating Card component (`/custom-components/rating-card`) provides a user interface for collecting feedback on chatbot interactions.

### Usage

```jsx
import RatingCard from '../../custom-components/rating-card';

function ChatInterface() {
  const handleRatingSubmit = (rating, feedback) => {
    // Handle the rating submission
    console.log(`Rating: ${rating}, Feedback: ${feedback}`);
  };

  return (
    <div className="chat-container">
      {/* Chat messages */}
      <RatingCard 
        onSubmit={handleRatingSubmit}
        title="How was your experience?"
        subtitle="Your feedback helps us improve"
      />
    </div>
  );
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| onSubmit | function | Yes | Callback function called when the user submits a rating. Receives `(rating, feedback)` as arguments. |
| title | string | No | The title displayed at the top of the rating card. Default: "Rate your experience" |
| subtitle | string | No | The subtitle displayed below the title. Default: "Please rate your experience with our chatbot" |
| maxRating | number | No | The maximum rating value. Default: 5 |
| initialRating | number | No | The initial rating value. Default: 0 (no rating) |
| feedbackPlaceholder | string | No | Placeholder text for the feedback text area. Default: "Tell us more about your experience (optional)" |
| submitButtonText | string | No | Text for the submit button. Default: "Submit Feedback" |
| theme | object | No | Custom theme object for styling the component. |

### Styling

The Rating Card component can be styled using the theme prop or by overriding the CSS classes. The component uses CSS modules to prevent style conflicts.

```jsx
// Custom theme example
const customTheme = {
  cardBackground: '#f8f9fa',
  titleColor: '#343a40',
  starActiveColor: '#ffc107',
  starInactiveColor: '#e9ecef',
  buttonBackground: '#007bff',
  buttonText: '#ffffff',
};

<RatingCard 
  onSubmit={handleRatingSubmit}
  theme={customTheme}
/>
```

### Accessibility

The Rating Card component is designed to be accessible:

- All interactive elements are keyboard navigable
- ARIA attributes are used to improve screen reader compatibility
- Color contrast ratios meet WCAG AA standards
- Focus states are clearly visible

### Testing

The Rating Card component has unit tests located in `/custom-components/rating-card/__tests__`. These tests verify:

- Component rendering
- User interactions (clicking stars, submitting feedback)
- Accessibility compliance
- Prop validation

## Future Custom Components

As the Chatbots platform evolves, additional custom components may be added to address specific UI requirements. When adding new custom components, follow these guidelines:

1. Create a new directory in `/custom-components` with the component name
2. Include component code, tests, and documentation
3. Follow the established patterns for props, styling, and accessibility
4. Update this documentation to include the new component

## Integration with Standard Components

Custom components should integrate seamlessly with the standard component library. When designing new custom components, consider:

- Consistency with the overall design system
- Reusability across different parts of the application
- Compatibility with existing components
- Performance impact

## Related Documentation

- [Component Structure](../03_Development_Methodologies/04_Component_Structure.md) - Overall component architecture
- [Code Standards](../03_Development_Methodologies/01_Code_Standards.md) - Coding standards for component development
- [Architecture Patterns](../03_Development_Methodologies/02_Architecture_Patterns.md) - Architectural patterns used in the application
