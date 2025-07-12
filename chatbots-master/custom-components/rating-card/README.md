# Rating Card Component

A customizable card component with rating functionality for collecting user feedback.

## Features

- Customizable star rating system
- Configurable maximum rating value
- Three visual themes: light, dark, and colorful
- Callback support for rating changes
- Responsive design

## Usage

```jsx
<RatingCard
  title="How was your experience?"
  description="Please rate our service"
  maxRating={5}
  onRatingChange={(rating) => console.log(`User rated: ${rating}`)}
/>
```

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| title | string | Yes | - | The title of the rating card |
| description | string | No | "Please rate your experience with our service" | Description text displayed below the title |
| maxRating | number | No | 5 | Maximum rating value (number of stars) |
| onRatingChange | function | No | - | Callback function called when user selects a rating |

## Themes

The component supports three themes that can be configured in the component settings:

- **light**: Default theme with white background and yellow stars
- **dark**: Dark theme with dark background and yellow stars
- **colorful**: Colorful theme with gray header and orange stars

## Customization

You can customize this component by editing the following files:

- `index.js`: Component metadata and implementation
- `styles.css`: Visual styling for the component

## Author

Chatbot Platform Team
