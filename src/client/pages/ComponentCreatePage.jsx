import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * Component Create Page
 * 
 * Allows users to create new custom components
 */
const ComponentCreatePage = () => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    author: ''
  });
  const [componentTypes, setComponentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch component types on component mount
  useEffect(() => {
    const fetchComponentTypes = async () => {
      try {
        const response = await axios.get('/api/components/types');
        setComponentTypes(response.data);
      } catch (err) {
        console.error('Error fetching component types:', err);
        setError('Failed to load component types. Please try again later.');
      }
    };

    fetchComponentTypes();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.name || !formData.type || !formData.description || !formData.author) {
      setError('All fields are required');
      return;
    }
    
    // Validate component name format
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(formData.name)) {
      setError('Component name must start with a letter and contain only letters and numbers');
      return;
    }
    
    try {
      setLoading(true);
      await axios.post('/api/components', formData);
      navigate('/components');
    } catch (err) {
      console.error('Error creating component:', err);
      setError('Failed to create component. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <div className="component-create-page">
      <div className="component-create-page__header">
        <h1>Create Custom Component</h1>
      </div>

      <div className="component-create-page__content">
        <div className="component-form-container">
          <form className="component-form" onSubmit={handleSubmit}>
            {error && (
              <div className="component-form__error">
                <p>{error}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Component Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="MyCustomComponent"
                required
              />
              <small>Must start with a letter and contain only letters and numbers</small>
            </div>

            <div className="form-group">
              <label htmlFor="type">Component Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a type</option>
                {componentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your component..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="author">Author</label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                placeholder="Your name"
                required
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate('/components')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="create-button"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Component'}
              </button>
            </div>
          </form>
        </div>

        <div className="component-preview">
          <h2>What happens next?</h2>
          <ol className="steps-list">
            <li>
              <strong>Component Scaffolding:</strong> We'll create the basic structure for your component
            </li>
            <li>
              <strong>File Generation:</strong> The following files will be created:
              <ul>
                <li><code>index.js</code> - Component metadata and exports</li>
                <li><code>component.jsx</code> - React component implementation</li>
                <li><code>styles.css</code> - Component styles</li>
                <li><code>README.md</code> - Documentation</li>
                <li><code>package.json</code> - Dependencies</li>
              </ul>
            </li>
            <li>
              <strong>Customization:</strong> After creation, you can edit these files to implement your component's functionality
            </li>
            <li>
              <strong>Usage:</strong> Your component will be available for use in chatbots
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ComponentCreatePage;
