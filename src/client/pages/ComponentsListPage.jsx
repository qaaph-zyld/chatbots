import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * Components List Page
 * 
 * Displays a list of all custom components and allows creating new ones
 */
const ComponentsListPage = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch components on component mount
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/components');
        setComponents(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching components:', err);
        setError('Failed to load components. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchComponents();
  }, []);

  // Handle component deletion
  const handleDeleteComponent = async (name, version) => {
    if (window.confirm(`Are you sure you want to delete ${name}@${version}?`)) {
      try {
        await axios.delete(`/api/components/${name}/${version}`);
        // Remove the deleted component from the state
        setComponents(components.filter(
          component => !(component.name === name && component.version === version)
        ));
      } catch (err) {
        console.error('Error deleting component:', err);
        setError('Failed to delete component. Please try again later.');
      }
    }
  };

  return (
    <div className="components-list-page">
      <div className="components-list-page__header">
        <h1>Custom Components</h1>
        <button
          className="create-button"
          onClick={() => navigate('/components/create')}
        >
          Create Component
        </button>
      </div>

      {loading ? (
        <div className="components-list-page__loading">
          <p>Loading components...</p>
        </div>
      ) : error ? (
        <div className="components-list-page__error">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {components.length === 0 ? (
            <div className="components-list-page__empty">
              <p>No custom components found. Create your first component to get started.</p>
            </div>
          ) : (
            <div className="components-list-page__grid">
              {components.map((component) => (
                <div key={`${component.name}@${component.version}`} className="component-card">
                  <div className="component-card__header">
                    <h2>{component.displayName || component.name}</h2>
                    <span className="component-type">{component.type}</span>
                  </div>
                  <div className="component-card__content">
                    <p className="component-description">{component.description}</p>
                    <div className="component-meta">
                      <span className="component-version">v{component.version}</span>
                      <span className="component-author">by {component.author}</span>
                    </div>
                  </div>
                  <div className="component-card__actions">
                    <Link
                      to={`/components/${component.name}/${component.version}`}
                      className="view-button"
                    >
                      View
                    </Link>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteComponent(component.name, component.version)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ComponentsListPage;
