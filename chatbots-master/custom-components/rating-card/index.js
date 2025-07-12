/**
 * RatingCard Component
 * 
 * A customizable card component with rating functionality
 * 
 * @author Chatbot Platform Team
 */

const React = require('react');
const ComponentInterface = require('../../src/components/custom/ComponentInterface');

// Define component metadata
const metadata = {
  name: 'RatingCard',
  displayName: 'Rating Card',
  type: 'card',
  version: '1.0.0',
  description: 'A customizable card component with rating functionality',
  author: 'Chatbot Platform Team',
  props: {
    title: {
      type: 'string',
      required: true,
      description: 'The title of the card'
    },
    description: {
      type: 'string',
      required: false,
      description: 'The description text for the card'
    },
    maxRating: {
      type: 'number',
      required: false,
      default: 5,
      description: 'The maximum rating value'
    },
    onRatingChange: {
      type: 'function',
      required: false,
      description: 'Callback function when rating changes'
    }
  },
  tags: ['custom', 'card', 'rating', 'feedback'],
  icon: 'star',
  settings: {
    theme: {
      type: 'select',
      options: ['light', 'dark', 'colorful'],
      default: 'light',
      description: 'The visual theme of the rating card'
    }
  }
};

/**
 * RatingCard Component Implementation
 * 
 * @param {Object} props - Component props
 * @returns {React.Component} - React component
 */
const RatingCard = (props) => {
  const { title, description, maxRating = 5, onRatingChange } = props;
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleRatingClick = (value) => {
    setRating(value);
    if (onRatingChange) {
      onRatingChange(value);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
      stars.push(
        <span
          key={i}
          className={`rating-star ${i <= (hoverRating || rating) ? 'active' : ''}`}
          onClick={() => handleRatingClick(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="rating-card-component">
      <div className="rating-card-header">
        <h3 className="rating-card-title">{title}</h3>
      </div>
      <div className="rating-card-content">
        {description && <p className="rating-card-description">{description}</p>}
        <div className="rating-stars">{renderStars()}</div>
        {rating > 0 && (
          <div className="rating-value">
            You rated this {rating} out of {maxRating}
          </div>
        )}
      </div>
    </div>
  );
};

// Export the component
module.exports = {
  ...metadata,
  component: RatingCard,
  validateProps: (props) => {
    // Validate that title is provided
    if (!props.title) {
      return false;
    }
    
    // Validate maxRating is a positive number
    if (props.maxRating && (typeof props.maxRating !== 'number' || props.maxRating <= 0)) {
      return false;
    }
    
    return true;
  },
  getDefaultProps: () => {
    return {
      title: 'Rate Your Experience',
      description: 'Please rate your experience with our service',
      maxRating: 5
    };
  }
};
