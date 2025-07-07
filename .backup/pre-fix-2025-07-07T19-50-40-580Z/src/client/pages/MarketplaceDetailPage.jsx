import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Marketplace Detail Page
 * 
 * Displays details of a specific component from the marketplace
 */
const MarketplaceDetailPage = () => {
  const { id } = useParams();
  const [component, setComponent] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRating, setUserRating] = useState({
    rating: 0,
    review: ''
  });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [installing, setInstalling] = useState(false);
  const navigate = useNavigate();

  // Fetch component details on component mount
  useEffect(() => {
    const fetchComponent = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/marketplace/${id}`);
        setComponent(response.data);
        
        // Fetch component ratings
        const ratingsResponse = await axios.get(`/api/marketplace/${id}/ratings`);
        setRatings(ratingsResponse.data.items || []);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching marketplace component:', err);
        setError('Failed to load component. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchComponent();
    }
  }, [id]);

  // Handle rating change
  const handleRatingChange = (rating) => {
    setUserRating({
      ...userRating,
      rating
    });
  };

  // Handle review change
  const handleReviewChange = (e) => {
    setUserRating({
      ...userRating,
      review: e.target.value
    });
  };

  // Handle rating submission
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    
    if (userRating.rating === 0) {
      alert('Please select a rating');
      return;
    }
    
    try {
      setSubmittingRating(true);
      await axios.post(`/api/marketplace/${id}/rate`, userRating);
      
      // Refresh ratings
      const ratingsResponse = await axios.get(`/api/marketplace/${id}/ratings`);
      setRatings(ratingsResponse.data.items || []);
      
      // Reset user rating
      setUserRating({
        rating: 0,
        review: ''
      });
      
      alert('Rating submitted successfully!');
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('Failed to submit rating. Please try again later.');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Handle component installation
  const handleInstallComponent = async () => {
    try {
      setInstalling(true);
      await axios.post(`/api/marketplace/${id}/install`);
      alert('Component installed successfully!');
      navigate('/components');
    } catch (err) {
      console.error('Error installing component:', err);
      alert('Failed to install component. Please try again later.');
    } finally {
      setInstalling(false);
    }
  };

  // Render rating stars
  const renderRatingStars = (value, interactive = false) => {
    return (
      <div className="rating-stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`rating-star ${i < value ? 'active' : ''}`}
            onClick={interactive ? () => handleRatingChange(i + 1) : undefined}
            style={interactive ? { cursor: 'pointer' } : {}}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="marketplace-detail-page">
      <div className="marketplace-detail-page__header">
        <div className="header-info">
          <h1>
            {loading ? 'Loading...' : component ? component.displayName || component.name : 'Component Not Found'}
            {component && <span className="component-version">v{component.version}</span>}
          </h1>
          {component && <p className="component-type">{component.type}</p>}
        </div>
        <div className="header-actions">
          <Link to="/marketplace" className="back-button">
            Back to Marketplace
          </Link>
          {component && (
            <button 
              className="install-button"
              onClick={handleInstallComponent}
              disabled={installing}
            >
              {installing ? 'Installing...' : 'Install Component'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="marketplace-detail-page__loading">
          <p>Loading component details...</p>
        </div>
      ) : error ? (
        <div className="marketplace-detail-page__error">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      ) : component ? (
        <div className="marketplace-detail-page__content">
          <div className="component-tabs">
            <button
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-button ${activeTab === 'code' ? 'active' : ''}`}
              onClick={() => setActiveTab('code')}
            >
              Code Samples
            </button>
            <button
              className={`tab-button ${activeTab === 'ratings' ? 'active' : ''}`}
              onClick={() => setActiveTab('ratings')}
            >
              Ratings & Reviews
            </button>
          </div>

          <div className="component-tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="component-info">
                  <div className="component-header">
                    <h2>Component Information</h2>
                    <div className="component-stats">
                      <div className="component-rating">
                        {renderRatingStars(component.rating)}
                        <span className="rating-value">
                          {component.rating.toFixed(1)} ({component.ratingCount} reviews)
                        </span>
                      </div>
                      <div className="component-downloads">
                        <span className="downloads-icon">↓</span>
                        <span className="downloads-value">{component.downloads} downloads</span>
                      </div>
                    </div>
                  </div>

                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Name:</span>
                      <span className="info-value">{component.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Display Name:</span>
                      <span className="info-value">{component.displayName || component.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Type:</span>
                      <span className="info-value">{component.type}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Version:</span>
                      <span className="info-value">{component.version}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Author:</span>
                      <span className="info-value">{component.author}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Published:</span>
                      <span className="info-value">{formatDate(component.createdAt)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Last Updated:</span>
                      <span className="info-value">{formatDate(component.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="component-description">
                  <h2>Description</h2>
                  <p>{component.description}</p>
                </div>

                {component.tags && component.tags.length > 0 && (
                  <div className="component-tags">
                    <h2>Tags</h2>
                    <div className="tags-list">
                      {component.tags.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {component.screenshots && component.screenshots.length > 0 && (
                  <div className="component-screenshots">
                    <h2>Screenshots</h2>
                    <div className="screenshots-grid">
                      {component.screenshots.map((screenshot, index) => (
                        <div key={index} className="screenshot">
                          <img src={screenshot.url} alt={screenshot.caption || `Screenshot ${index + 1}`} />
                          {screenshot.caption && <p className="screenshot-caption">{screenshot.caption}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'code' && (
              <div className="code-tab">
                <h2>Usage Example</h2>
                <SyntaxHighlighter language="jsx" style={tomorrow}>
                  {`// Import the component
import ${component.name} from './components/${component.name.toLowerCase()}';

// Use the component in your React code
const MyComponent = () => {
  return (
    <${component.name}
      ${Object.entries(component.props || {})
        .filter(([_, prop]) => prop.required)
        .map(([name, prop]) => `${name}="${prop.default || 'value'}"`)
        .join('\n      ')}
    >
      ${component.type === 'container' ? 'Your content here' : ''}
    </${component.name}>
  );
};`}
                </SyntaxHighlighter>

                <h2>Props</h2>
                {component.props && Object.keys(component.props).length > 0 ? (
                  <table className="props-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Required</th>
                        <th>Default</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(component.props).map(([propName, propData]) => (
                        <tr key={propName}>
                          <td>{propName}</td>
                          <td>{propData.type}</td>
                          <td>{propData.required ? 'Yes' : 'No'}</td>
                          <td>{propData.default || '-'}</td>
                          <td>{propData.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No props documented for this component.</p>
                )}
              </div>
            )}

            {activeTab === 'ratings' && (
              <div className="ratings-tab">
                <h2>Ratings & Reviews</h2>
                
                <div className="rating-summary">
                  <div className="rating-average">
                    <h3>Average Rating</h3>
                    <div className="rating-value">{component.rating.toFixed(1)}</div>
                    {renderRatingStars(component.rating)}
                    <div className="rating-count">{component.ratingCount} reviews</div>
                  </div>
                  
                  <div className="rating-distribution">
                    <h3>Rating Distribution</h3>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = component.ratingDistribution?.[star] || 0;
                      const percentage = component.ratingCount > 0 
                        ? Math.round((count / component.ratingCount) * 100) 
                        : 0;
                      
                      return (
                        <div key={star} className="rating-bar">
                          <div className="rating-label">{star} stars</div>
                          <div className="rating-bar-container">
                            <div 
                              className="rating-bar-fill" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="rating-percentage">{percentage}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="add-rating">
                  <h3>Add Your Review</h3>
                  <form onSubmit={handleSubmitRating}>
                    <div className="rating-input">
                      <label>Your Rating:</label>
                      {renderRatingStars(userRating.rating, true)}
                    </div>
                    <div className="review-input">
                      <label htmlFor="review">Your Review:</label>
                      <textarea
                        id="review"
                        value={userRating.review}
                        onChange={handleReviewChange}
                        placeholder="Write your review here..."
                        rows={4}
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      className="submit-rating-button"
                      disabled={submittingRating || userRating.rating === 0}
                    >
                      {submittingRating ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
                
                <div className="ratings-list">
                  <h3>User Reviews</h3>
                  {ratings.length === 0 ? (
                    <p className="no-ratings">No reviews yet. Be the first to review this component!</p>
                  ) : (
                    ratings.map((rating) => (
                      <div key={rating.id} className="rating-item">
                        <div className="rating-header">
                          <div className="rating-user">{rating.user.name}</div>
                          <div className="rating-date">{formatDate(rating.createdAt)}</div>
                        </div>
                        <div className="rating-stars-container">
                          {renderRatingStars(rating.rating)}
                        </div>
                        {rating.review && (
                          <div className="rating-review">{rating.review}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="marketplace-detail-page__not-found">
          <h2>Component Not Found</h2>
          <p>The requested component could not be found.</p>
          <Link to="/marketplace" className="back-link">
            Back to Marketplace
          </Link>
        </div>
      )}
    </div>
  );
};

export default MarketplaceDetailPage;
