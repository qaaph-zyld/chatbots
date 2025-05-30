/**
 * Component Renderer
 * 
 * Utility for rendering custom components in the chatbot platform
 */

import React from 'react';
import { useComponent } from '../hooks/useComponent';

/**
 * Component Renderer
 * 
 * @param {Object} props - Component props
 * @param {string} props.componentName - Name of the component to render
 * @param {string} props.componentVersion - Version of the component (optional)
 * @param {Object} props.componentProps - Props to pass to the component
 * @returns {React.Component} - Rendered component
 */
const ComponentRenderer = ({ componentName, componentVersion, componentProps = {} }) => {
  // Use the useComponent hook to get the component
  const Component = useComponent(componentName, componentVersion);

  // Render the component with the provided props
  return <Component {...componentProps} />;
};

/**
 * Dynamic Component Renderer
 * 
 * Renders a component based on a component definition object
 * 
 * @param {Object} props - Component props
 * @param {Object} props.componentDef - Component definition
 * @param {string} props.componentDef.type - Type of component (custom or built-in)
 * @param {string} props.componentDef.component - Component name
 * @param {string} props.componentDef.version - Component version (optional)
 * @param {Object} props.componentDef.props - Component props
 * @returns {React.Component} - Rendered component
 */
export const DynamicComponentRenderer = ({ componentDef }) => {
  if (!componentDef) {
    return null;
  }

  const { type, component, version, props = {} } = componentDef;

  // If the component is a custom component, use the ComponentRenderer
  if (type === 'custom') {
    return (
      <ComponentRenderer
        componentName={component}
        componentVersion={version}
        componentProps={props}
      />
    );
  }

  // For built-in components, we would have a mapping here
  // This is a simplified example
  const BuiltInComponents = {
    message: ({ text }) => <div className="built-in-message">{text}</div>,
    button: ({ label, onClick }) => (
      <button className="built-in-button" onClick={onClick}>
        {label}
      </button>
    ),
    // Add more built-in components as needed
  };

  // Get the built-in component
  const BuiltInComponent = BuiltInComponents[component];

  // If the component doesn't exist, return null
  if (!BuiltInComponent) {
    console.warn(`Unknown component: ${component}`);
    return null;
  }

  // Render the built-in component with the provided props
  return <BuiltInComponent {...props} />;
};

export default ComponentRenderer;
