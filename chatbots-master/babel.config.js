module.exports = (api) => {
  const isTest = api.env('test');
  
  // Common presets for both test and non-test environments
  const presets = [
    ['@babel/preset-env', {
      targets: isTest ? { node: 'current' } : { node: '14' },
      modules: isTest ? 'commonjs' : false,
      useBuiltIns: 'usage',
      corejs: 3,
      exclude: ['transform-typeof-symbol'],
      loose: true,
      shippedProposals: true,
    }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ];
  
  // Common plugins for both environments
  const plugins = [
    ['@babel/plugin-transform-runtime', {
      regenerator: true,
      corejs: 3,
      useESModules: !isTest,
    }],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-transform-modules-commonjs',
    'babel-plugin-transform-dynamic-import',
    ['module-resolver', {
      root: ['./src'],
      alias: {
        '^@/(.*)$': './src/$1',
        '^@src/(.*)$': './src/$1',
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }],
  ];

  const config = {
    presets,
    plugins,
    ignore: isTest ? [] : [
      'node_modules',
      'dist',
    ],
    sourceMaps: isTest ? 'inline' : false,
  };

  if (isTest) {
    // Simplified exclude pattern to avoid regex size limits
    // Focus on the most critical packages that need to be excluded from transformation
    config.overrides = [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules\/(?!(chai|sinon|@testing-library|@babel|@jest|@playwright|@swc|whatwg-url|tr46|webidl-conversions|abab|cssstyle|domexception|nwsapi|parse5|acorn|yaml|yargs|y18n)\/)/,
        plugins: [
          ['@babel/plugin-transform-modules-commonjs', { 
            loose: true,
            allowTopLevelThis: true,
            strictMode: false
          }],
        ],
      },
    ];
  }

  return config;
};
