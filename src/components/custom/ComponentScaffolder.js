/**
 * Component Scaffolder
 * 
 * Provides tools for scaffolding new custom components
 */

const fs = require('fs');
const path = require('path');
const componentRegistry = require('./ComponentRegistry');

class ComponentScaffolder {
  /**
   * Create a new component
   * 
   * @param {Object} options - Component options
   * @param {string} options.name - Component name
   * @param {string} options.type - Component type
   * @param {string} options.description - Component description
   * @param {string} options.author - Component author
   * @param {string} outputDir - Directory to output the component to
   * @returns {Promise<string>} - Path to the created component
   */
  async createComponent(options, outputDir) {
    try {
      // Validate options
      this.validateOptions(options);
      
      // Create component directory
      const componentDir = path.join(outputDir, this.kebabCase(options.name));
      if (!fs.existsSync(componentDir)) {
        fs.mkdirSync(componentDir, { recursive: true });
      }
      
      // Create component files
      await this.createComponentFiles(options, componentDir);
      
      return componentDir;
    } catch (error) {
      console.error('Error creating component:', error);
      throw error;
    }
  }
  
  /**
   * Validate component options
   * 
   * @param {Object} options - Component options
   */
  validateOptions(options) {
    // Check required options
    const requiredOptions = ['name', 'type', 'description', 'author'];
    for (const option of requiredOptions) {
      if (!options[option]) {
        throw new Error(`Missing required option: ${option}`);
      }
    }
    
    // Check if the component type is valid
    const validTypes = componentRegistry.getComponentTypes();
    if (!validTypes.includes(options.type)) {
      throw new Error(`Invalid component type: ${options.type}. Valid types: ${validTypes.join(', ')}`);
    }
    
    // Check if the component name is valid
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(options.name)) {
      throw new Error('Component name must start with a letter and contain only letters and numbers');
    }
  }
  
  /**
   * Create component files
   * 
   * @param {Object} options - Component options
   * @param {string} componentDir - Directory to output the component to
   */
  async createComponentFiles(options, componentDir) {
    // Create index.js
    const indexContent = this.generateIndexFile(options);
    fs.writeFileSync(path.join(componentDir, 'index.js'), indexContent);
    
    // Create component.jsx
    const componentContent = this.generateComponentFile(options);
    fs.writeFileSync(path.join(componentDir, 'component.jsx'), componentContent);
    
    // Create README.md
    const readmeContent = this.generateReadmeFile(options);
    fs.writeFileSync(path.join(componentDir, 'README.md'), readmeContent);
    
    // Create package.json
    const packageContent = this.generatePackageFile(options);
    fs.writeFileSync(path.join(componentDir, 'package.json'), packageContent);
    
    // Create styles.css
    const stylesContent = this.generateStylesFile(options);
    fs.writeFileSync(path.join(componentDir, 'styles.css'), stylesContent);
  }
  
  /**
   * Generate index.js file
   * 
   * @param {Object} options - Component options
   * @returns {string} - File content
   */
  generateIndexFile(options) {
    return `/**
 * ${options.name} Component
 * 
 * ${options.description}
 * 
 * @author ${options.author}
 */

const React = require('react');
const ComponentInterface = require('../../ComponentInterface');
const Component = require('./component.jsx');

// Define component metadata
const metadata = {
  name: '${options.name}',
  displayName: '${this.toTitleCase(options.name)}',
  type: '${options.type}',
  version: '1.0.0',
  description: '${options.description}',
  author: '${options.author}',
  props: {
    // Define component props schema here
    // Example:
    // title: {
    //   type: 'string',
    //   required: true,
    //   description: 'The title of the component'
    // }
  },
  tags: ['custom', '${options.type}'],
  icon: 'default-icon', // Replace with actual icon
  settings: {
    // Define component settings here
  }
};

// Export the component
module.exports = {
  ...metadata,
  component: Component,
  validateProps: (props) => {
    // Implement prop validation logic here
    return true;
  },
  getDefaultProps: () => {
    // Return default props for the component
    return {
      // Define default props here
    };
  },
  renderPreview: (props) => {
    // Render preview in the editor
    return Component(props);
  }
};`;
  }
  
  /**
   * Generate component.jsx file
   * 
   * @param {Object} options - Component options
   * @returns {string} - File content
   */
  generateComponentFile(options) {
    return `/**
 * ${options.name} Component Implementation
 */

const React = require('react');
require('./styles.css');

/**
 * ${this.toTitleCase(options.name)} Component
 * 
 * @param {Object} props - Component props
 * @returns {React.Component} - React component
 */
const ${options.name} = (props) => {
  // Implement your component here
  return (
    <div className="${this.kebabCase(options.name)}-component">
      <h3>{props.title || '${this.toTitleCase(options.name)}'}</h3>
      <div className="${this.kebabCase(options.name)}-content">
        {props.children || 'Custom ${options.type} component'}
      </div>
    </div>
  );
};

module.exports = ${options.name};`;
  }
  
  /**
   * Generate README.md file
   * 
   * @param {Object} options - Component options
   * @returns {string} - File content
   */
  generateReadmeFile(options) {
    return `# ${this.toTitleCase(options.name)} Component

${options.description}

## Usage

\`\`\`jsx
<${options.name} title="My Title">
  Content goes here
</${options.name}>
\`\`\`

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| title | string | No | '${this.toTitleCase(options.name)}' | The title of the component |
| children | node | No | 'Custom ${options.type} component' | The content of the component |

## Customization

You can customize this component by editing the following files:

- \`component.jsx\`: The React component implementation
- \`styles.css\`: The component styles
- \`index.js\`: The component metadata and exports

## Author

${options.author}
`;
  }
  
  /**
   * Generate package.json file
   * 
   * @param {Object} options - Component options
   * @returns {string} - File content
   */
  generatePackageFile(options) {
    return JSON.stringify({
      name: this.kebabCase(options.name),
      version: '1.0.0',
      description: options.description,
      main: 'index.js',
      author: options.author,
      license: 'MIT',
      dependencies: {},
      peerDependencies: {
        react: '^17.0.0'
      }
    }, null, 2);
  }
  
  /**
   * Generate styles.css file
   * 
   * @param {Object} options - Component options
   * @returns {string} - File content
   */
  generateStylesFile(options) {
    return `.${this.kebabCase(options.name)}-component {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 16px;
  margin: 8px 0;
  background-color: #ffffff;
}

.${this.kebabCase(options.name)}-component h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333333;
}

.${this.kebabCase(options.name)}-content {
  font-size: 14px;
  color: #666666;
}
`;
  }
  
  /**
   * Convert a string to kebab-case
   * 
   * @param {string} str - String to convert
   * @returns {string} - Kebab-case string
   */
  kebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }
  
  /**
   * Convert a string to Title Case
   * 
   * @param {string} str - String to convert
   * @returns {string} - Title case string
   */
  toTitleCase(str) {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (firstChar) => firstChar.toUpperCase())
      .trim();
  }
}

module.exports = new ComponentScaffolder();
