/**
 * useComponent Hook
 * 
 * A React hook for using custom components in React applications
 */

import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * useComponent Hook
 * 
 * @param {string} name - Component name
 * @param {string} version - Component version (optional, defaults to latest)
 * @returns {React.Component|null} - The component or null if not found
 */
export const useComponent = (name, version) => {
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComponent = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/components/${name}/${version || ''}`);
        
        if (response.data && response.data.component) {
          // The component is a function, so we can use it directly
          setComponent(response.data.component);
          setError(null);
        } else {
          setError('Component not found or invalid');
        }
      } catch (err) {
        console.error(`Error fetching component ${name}:`, err);
        setError(`Failed to load component: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (name) {
      fetchComponent();
    }
  }, [name, version]);

  // Return a wrapper component that handles loading and error states
  const ComponentWrapper = (props) => {
    if (loading) {
      return <div className="component-loading">Loading component...</div>;
    }

    if (error) {
      return <div className="component-error">Error: {error}</div>;
    }

    if (!component) {
      return <div className="component-not-found">Component not found</div>;
    }

    // Render the actual component with the provided props
    return component(props);
  };

  return ComponentWrapper;
};

/**
 * useComponentsByType Hook
 * 
 * @param {string} type - Component type
 * @returns {Object} - Object containing components, loading state, and error
 */
export const useComponentsByType = (type) => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/components/type/${type}`);
        setComponents(response.data);
        setError(null);
      } catch (err) {
        console.error(`Error fetching components of type ${type}:`, err);
        setError(`Failed to load components: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (type) {
      fetchComponents();
    }
  }, [type]);

  return { components, loading, error };
};

/**
 * useAllComponents Hook
 * 
 * @returns {Object} - Object containing all components, loading state, and error
 */
export const useAllComponents = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/components');
        setComponents(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching all components:', err);
        setError(`Failed to load components: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchComponents();
  }, []);

  return { components, loading, error };
};

export default useComponent;
