/**
 * Component Interface
 * 
 * Defines the interface for custom components
 */

/**
 * @typedef {Object} ComponentMetadata
 * @property {string} name - Unique name of the component
 * @property {string} displayName - Human-readable name for the component
 * @property {string} type - Type of the component (message, input, button, etc.)
 * @property {string} version - Version of the component (semver)
 * @property {string} description - Description of the component
 * @property {string} author - Author of the component
 * @property {Object} props - Component props schema
 * @property {Array<string>} tags - Tags for the component
 * @property {string} icon - Icon for the component
 * @property {Object} settings - Component settings
 */

/**
 * Base Component Interface
 * 
 * All custom components should implement this interface
 */
class ComponentInterface {
  /**
   * Get component metadata
   * 
   * @returns {ComponentMetadata} Component metadata
   */
  static getMetadata() {
    throw new Error('getMetadata() must be implemented by the component');
  }

  /**
   * Validate component props
   * 
   * @param {Object} props - Component props to validate
   * @returns {boolean} Whether the props are valid
   */
  static validateProps(props) {
    // Default implementation that always returns true
    return true;
  }

  /**
   * Get default props for the component
   * 
   * @returns {Object} Default props
   */
  static getDefaultProps() {
    return {};
  }

  /**
   * Render the component preview in the editor
   * 
   * @param {Object} props - Component props
   * @returns {React.Component} Component preview
   */
  static renderPreview(props) {
    // By default, use the same renderer as the actual component
    return this.component(props);
  }

  /**
   * The actual React component
   * 
   * @param {Object} props - Component props
   * @returns {React.Component} React component
   */
  static component(props) {
    throw new Error('component() must be implemented by the component');
  }
}

module.exports = ComponentInterface;
