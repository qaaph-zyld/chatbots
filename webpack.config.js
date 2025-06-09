/**
 * Webpack Configuration
 * 
 * This file loads the appropriate webpack configuration based on the environment.
 */

module.exports = (env) => {
  const environment = env.NODE_ENV || 'development';
  
  try {
    // Load environment-specific configuration
    return require(`./configs/webpack/webpack.${environment}.js`);
  } catch (error) {
    console.warn(`No specific webpack config found for ${environment}, using default`);
    return require('./configs/webpack/webpack.development.js');
  }
};
