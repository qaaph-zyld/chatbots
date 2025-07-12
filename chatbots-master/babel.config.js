module.exports = (api) => {
  const isTest = api.env('test');
  return {
    presets: [
      ['@babel/preset-env', {
        targets: isTest ? { node: 'current' } : { node: '14' },
        modules: isTest ? 'commonjs' : false,
        useBuiltIns: 'usage',
        corejs: 3,
      }],
      ['@babel/preset-react', { runtime: 'automatic' }],
      '@babel/preset-typescript',
    ],
    plugins: [
      ['@babel/plugin-transform-runtime', {
        regenerator: true,
        corejs: 3,
      }],
      'babel-plugin-module-resolver',
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
    ],
    ignore: [
      'node_modules',
      'dist',
    ],
  };
};
