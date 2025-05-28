/**
 * Response Rating Component
 * 
 * Provides a simple interface for users to rate chatbot responses
 */

class ResponseRatingComponent {
  /**
   * Constructor
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      chatbotId: null,
      conversationId: null,
      container: null,
      onRating: null,
      ...options
    };
    
    this.ratingSubmitted = false;
    this.lastQuery = null;
    this.lastResponse = null;
    
    this.render();
  }
  
  /**
   * Render the rating component
   * @private
   */
  render() {
    if (!this.options.container) return;
    
    const container = document.querySelector(this.options.container);
    if (!container) return;
    
    // Create rating component
    this.element = document.createElement('div');
    this.element.className = 'response-rating';
    this.element.innerHTML = `
      <div class="rating-question">Was this response helpful?</div>
      <div class="rating-buttons">
        <button class="rating-btn positive" data-rating="positive">
          <i class="material-icons">thumb_up</i>
        </button>
        <button class="rating-btn neutral" data-rating="neutral">
          <i class="material-icons">thumbs_up_down</i>
        </button>
        <button class="rating-btn negative" data-rating="negative">
          <i class="material-icons">thumb_down</i>
        </button>
      </div>
      <div class="rating-feedback">
        <textarea placeholder="Tell us more about your experience (optional)" class="feedback-input"></textarea>
        <button class="feedback-submit">Submit</button>
      </div>
      <div class="rating-thanks">Thank you for your feedback!</div>
    `;
    
    // Add event listeners
    const ratingButtons = this.element.querySelectorAll('.rating-btn');
    ratingButtons.forEach(button => {
      button.addEventListener('click', () => this.handleRating(button.dataset.rating));
    });
    
    const feedbackSubmit = this.element.querySelector('.feedback-submit');
    feedbackSubmit.addEventListener('click', () => this.submitFeedback());
    
    // Hide feedback and thanks initially
    this.element.querySelector('.rating-feedback').style.display = 'none';
    this.element.querySelector('.rating-thanks').style.display = 'none';
    
    // Add to container
    container.appendChild(this.element);
  }
  
  /**
   * Handle rating button click
   * @param {string} rating - Rating value (positive, neutral, negative)
   * @private
   */
  handleRating(rating) {
    if (this.ratingSubmitted) return;
    
    // Highlight selected button
    const buttons = this.element.querySelectorAll('.rating-btn');
    buttons.forEach(button => {
      button.classList.remove('selected');
      if (button.dataset.rating === rating) {
        button.classList.add('selected');
      }
    });
    
    // Store rating
    this.rating = rating;
    
    // Show feedback input for negative ratings
    if (rating === 'negative') {
      this.element.querySelector('.rating-feedback').style.display = 'block';
    } else {
      // Submit rating immediately for positive/neutral
      this.submitRating();
    }
  }
  
  /**
   * Submit feedback
   * @private
   */
  submitFeedback() {
    const feedbackInput = this.element.querySelector('.feedback-input');
    const comment = feedbackInput.value.trim();
    
    this.submitRating(comment);
  }
  
  /**
   * Submit rating to the server
   * @param {string} comment - Optional comment
   * @private
   */
  async submitRating(comment = '') {
    if (!this.options.chatbotId || !this.options.conversationId || !this.rating || this.ratingSubmitted) {
      return;
    }
    
    try {
      const response = await fetch(`/api/chatbots/${this.options.chatbotId}/response-rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: this.options.conversationId,
          rating: this.rating,
          query: this.lastQuery,
          response: this.lastResponse,
          comment
        })
      });
      
      if (response.ok) {
        // Mark as submitted
        this.ratingSubmitted = true;
        
        // Hide rating buttons and feedback
        this.element.querySelector('.rating-buttons').style.display = 'none';
        this.element.querySelector('.rating-feedback').style.display = 'none';
        
        // Show thanks message
        this.element.querySelector('.rating-thanks').style.display = 'block';
        
        // Call onRating callback if provided
        if (typeof this.options.onRating === 'function') {
          this.options.onRating(this.rating, comment);
        }
      } else {
        console.error('Failed to submit rating:', await response.json());
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  }
  
  /**
   * Reset the rating component for a new response
   */
  reset() {
    this.ratingSubmitted = false;
    this.rating = null;
    
    // Reset UI
    const buttons = this.element.querySelectorAll('.rating-btn');
    buttons.forEach(button => button.classList.remove('selected'));
    
    this.element.querySelector('.rating-buttons').style.display = 'flex';
    this.element.querySelector('.rating-feedback').style.display = 'none';
    this.element.querySelector('.rating-thanks').style.display = 'none';
    
    const feedbackInput = this.element.querySelector('.feedback-input');
    if (feedbackInput) {
      feedbackInput.value = '';
    }
  }
  
  /**
   * Update component with new conversation data
   * @param {Object} data - Conversation data
   */
  update(data) {
    if (data.chatbotId) {
      this.options.chatbotId = data.chatbotId;
    }
    
    if (data.conversationId) {
      this.options.conversationId = data.conversationId;
    }
    
    if (data.query) {
      this.lastQuery = data.query;
    }
    
    if (data.response) {
      this.lastResponse = data.response;
    }
    
    // Reset for new response
    this.reset();
  }
  
  /**
   * Show the rating component
   */
  show() {
    if (this.element) {
      this.element.style.display = 'block';
    }
  }
  
  /**
   * Hide the rating component
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponseRatingComponent;
}
