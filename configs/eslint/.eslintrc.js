/**
 * ESLint Configuration (Extended)
 */

module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    // Possible Errors
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-duplicate-case': 'error',
    'no-empty': 'warn',
    'no-extra-semi': 'error',
    'no-func-assign': 'error',
    'no-irregular-whitespace': 'error',
    'no-unreachable': 'error',
    
    // Best Practices
    'curly': ['error', 'multi-line'],
    'default-case': 'warn',
    'eqeqeq': ['error', 'always'],
    'no-empty-function': 'warn',
    'no-eval': 'error',
    'no-multi-spaces': 'error',
    
    // Variables
    'no-unused-vars': ['warn', { 
      'argsIgnorePattern': '^_', 
      'varsIgnorePattern': '^_' 
    }],
    'no-use-before-define': ['error', { 'functions': false }],
    
    // Stylistic Issues
    'array-bracket-spacing': ['error', 'never'],
    'block-spacing': 'error',
    'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
    'comma-dangle': ['error', 'never'],
    'comma-spacing': ['error', { 'before': false, 'after': true }],
    'comma-style': ['error', 'last'],
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],
    'keyword-spacing': ['error', { 'before': true, 'after': true }],
    'max-len': ['warn', { 'code': 100, 'ignoreComments': true, 'ignoreUrls': true }],
    'no-mixed-spaces-and-tabs': 'error',
    'no-multiple-empty-lines': ['error', { 'max': 2, 'maxEOF': 1 }],
    'no-trailing-spaces': 'error',
    'object-curly-spacing': ['error', 'always'],
    'quotes': ['error', 'single', { 'avoidEscape': true, 'allowTemplateLiterals': true }],
    'semi': ['error', 'always'],
    'semi-spacing': ['error', { 'before': false, 'after': true }],
    'space-before-blocks': 'error',
    'space-before-function-paren': ['error', { 'anonymous': 'always', 'named': 'never', 'asyncArrow': 'always' }],
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error',
    
    // ES6
    'arrow-parens': ['error', 'always'],
    'arrow-spacing': ['error', { 'before': true, 'after': true }],
    'no-duplicate-imports': 'error',
    'no-var': 'error',
    'prefer-const': 'warn',
    'prefer-template': 'warn'
  },
  overrides: [
    {
      files: [
        '**/*.test.js',
        '**/*.spec.js',
        '**/tests/**/*.js'
      ],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off',
        'max-len': 'off'
      }
    }
  ]
};
