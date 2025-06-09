import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Component Details Page
 * 
 * Displays details of a specific custom component
 */
const ComponentDetailsPage = () => {
  const { name, version } = useParams();
  const [component, setComponent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeFile, setActiveFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState({});
  const navigate = useNavigate();

  // Fetch component details on component mount
  useEffect(() => {
    const fetchComponent = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/components/${name}/${version || ''}`);
        setComponent(response.data);
        
        // Fetch component files
        await fetchComponentFiles(response.data.name);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching component:', err);
        setError('Failed to load component. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchComponent();
  }, [name, version]);

  // Fetch component files
  const fetchComponentFiles = async (componentName) => {
    try {
      // This is a simplified approach - in a real implementation, 
      // you would have an API endpoint to fetch the actual files
      const mockFiles = {
        'index.js': `/**
 * ${componentName} Component
 */

const React = require('react');
require('@src/ComponentInterface');
require('@src/client\pages\component.jsx');

// Define component metadata
const metadata = {
  name: '${componentName}',
  displayName: '${componentName.replace(/([A-Z])/g, ' $1').trim()}',
  type: '${component?.type || 'message'}',
  version: '${component?.version || '1.0.0'}',
  description: '${component?.description || 'A custom component'}',
  author: '${component?.author || 'Anonymous'}',
  // ...other metadata
};

module.exports = {
  ...metadata,
  component: Component,
  // ...other exports
};`,
        'component.jsx': `/**
 * ${componentName} Component Implementation
 */

const React = require('react');
require('./styles.css');

/**
 * ${componentName.replace(/([A-Z])/g, ' $1').trim()} Component
 * 
 * @param {Object} props - Component props
 * @returns {React.Component} - React component
 */
const ${componentName} = (props) => {
  return (
    <div className="${componentName.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1)}-component">
      <h3>{props.title || '${componentName.replace(/([A-Z])/g, ' $1').trim()}'}</h3>
      <div className="${componentName.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1)}-content">
        {props.children || 'Custom ${component?.type || 'message'} component'}
      </div>
    </div>
  );
};

module.exports = ${componentName};`,
        'styles.css': `.${componentName.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1)}-component {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 16px;
  margin: 8px 0;
  background-color: #ffffff;
}

.${componentName.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1)}-component h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333333;
}

.${componentName.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1)}-content {
  font-size: 14px;
  color: #666666;
}`
      };
      
      setFiles(mockFiles);
    } catch (err) {
      console.error('Error fetching component files:', err);
    }
  };

  // Handle component deletion
  const handleDeleteComponent = async () => {
    if (window.confirm(`Are you sure you want to delete ${component.name}@${component.version}?`)) {
      try {
        await axios.delete(`/api/components/${component.name}/${component.version}`);
        navigate('/components');
      } catch (err) {
        console.error('Error deleting component:', err);
        setError('Failed to delete component. Please try again later.');
      }
    }
  };

  // Render file content with syntax highlighting
  const renderFileContent = (filename, content) => {
    const language = filename.endsWith('.js') || filename.endsWith('.jsx') 
      ? 'javascript' 
      : filename.endsWith('.css') 
        ? 'css' 
        : 'text';
    
    return (
      <SyntaxHighlighter 
        language={language} 
        style={tomorrow}
        showLineNumbers
        wrapLines
      >
        {content}
      </SyntaxHighlighter>
    );
  };

  return (
    <div className="component-details-page">
      <div className="component-details-page__header">
        <div className="header-info">
          <h1>
            {loading ? 'Loading...' : component ? component.displayName || component.name : 'Component Not Found'}
            {component && <span className="component-version">v{component.version}</span>}
          </h1>
          {component && <p className="component-type">{component.type}</p>}
        </div>
        <div className="header-actions">
          <Link to="/components" className="back-button">
            Back to Components
          </Link>
          {component && (
            <button 
              className="delete-button"
              onClick={handleDeleteComponent}
            >
              Delete Component
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="component-details-page__loading">
          <p>Loading component details...</p>
        </div>
      ) : error ? (
        <div className="component-details-page__error">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      ) : component ? (
        <div className="component-details-page__content">
          <div className="component-tabs">
            <button
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-button ${activeTab === 'files' ? 'active' : ''}`}
              onClick={() => setActiveTab('files')}
            >
              Files
            </button>
            <button
              className={`tab-button ${activeTab === 'usage' ? 'active' : ''}`}
              onClick={() => setActiveTab('usage')}
            >
              Usage
            </button>
          </div>

          <div className="component-tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="component-info">
                  <h2>Component Information</h2>
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
              </div>
            )}

            {activeTab === 'files' && (
              <div className="files-tab">
                <div className="files-list">
                  <h2>Component Files</h2>
                  <div className="file-tabs">
                    {Object.keys(files).map((filename) => (
                      <button
                        key={filename}
                        className={`file-tab ${activeFile === filename ? 'active' : ''}`}
                        onClick={() => setActiveFile(filename)}
                      >
                        {filename}
                      </button>
                    ))}
                  </div>
                  <div className="file-content">
                    {activeFile ? (
                      renderFileContent(activeFile, files[activeFile])
                    ) : (
                      <p className="select-file-message">Select a file to view its content</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="usage-tab">
                <h2>Component Usage</h2>
                <div className="usage-example">
                  <h3>Example</h3>
                  <SyntaxHighlighter language="jsx" style={tomorrow}>
                    {`// Import the component
import ${component.name} from './components/${component.name.toLowerCase()}';

// Use the component in your React code
const MyComponent = () => {
  return (
    <${component.name}
      title="My Custom Title"
      // Add other props as needed
    >
      This is the content of the component
    </${component.name}>
  );
};`}
                  </SyntaxHighlighter>
                </div>

                <div className="props-documentation">
                  <h3>Props</h3>
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
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="component-details-page__not-found">
          <h2>Component Not Found</h2>
          <p>The requested component could not be found.</p>
          <Link to="/components" className="back-link">
            Back to Components
          </Link>
        </div>
      )}
    </div>
  );
};

export default ComponentDetailsPage;
