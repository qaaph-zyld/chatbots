module.exports = {
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          '@src': './src',
          '@core': './src/core',
          '@api': './src/api',
          '@models': './src/core/models',
          '@services': './src/core/services',
          '@integrations': './src/integrations',
          '@tests': './src/tests',
          '@utils': './src/utils'
        }
      }
    ]
  ]
};
