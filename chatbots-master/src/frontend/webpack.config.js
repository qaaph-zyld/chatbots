/**
 * Webpack Configuration for Production Optimization
 * 
 * This configuration implements performance optimizations for the frontend bundle,
 * including code splitting, tree shaking, and asset optimization.
 */

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

// Determine if this is a production build
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  // Set the mode based on environment
  mode: isProduction ? 'production' : 'development',
  
  // Entry point for the application
  entry: {
    main: './src/index.js',
  },
  
  // Output configuration
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
    chunkFilename: isProduction ? 'js/[name].[contenthash:8].chunk.js' : 'js/[name].chunk.js',
    publicPath: '/',
    // Clean the output directory before emit
    clean: true,
  },
  
  // Enable source maps for debugging in development
  devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
  
  // Optimization configuration
  optimization: {
    minimize: isProduction,
    minimizer: [
      // JavaScript minification
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
        parallel: true,
      }),
      // CSS minification
      new CssMinimizerPlugin(),
    ],
    // Code splitting configuration
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      minRemainingSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
          name: 'vendors',
        },
        // Split React and related packages into a separate chunk
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        // Split UI libraries into a separate chunk
        ui: {
          test: /[\\/]node_modules[\\/](antd|@material-ui|@mui)[\\/]/,
          name: 'ui-libs',
          chunks: 'all',
          priority: 15,
        },
        // Split utilities into a separate chunk
        utils: {
          test: /[\\/]node_modules[\\/](lodash|moment|axios|uuid)[\\/]/,
          name: 'utils',
          chunks: 'all',
          priority: 10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
    // Keep the runtime chunk separated to enable long term caching
    runtimeChunk: {
      name: (entrypoint) => `runtime-${entrypoint.name}`,
    },
  },
  
  // Module resolution and loaders
  module: {
    rules: [
      // JavaScript/JSX processing
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { useBuiltIns: 'usage', corejs: 3 }],
              '@babel/preset-react',
            ],
            plugins: [
              '@babel/plugin-transform-runtime',
              '@babel/plugin-proposal-class-properties',
              isProduction && 'transform-react-remove-prop-types',
            ].filter(Boolean),
            // Enable caching for faster rebuilds
            cacheDirectory: true,
          },
        },
      },
      // CSS processing
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: !isProduction,
            },
          },
          'postcss-loader',
        ],
      },
      // SASS/SCSS processing
      {
        test: /\.(sass|scss)$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              sourceMap: !isProduction,
            },
          },
          'postcss-loader',
          'sass-loader',
        ],
      },
      // Image optimization
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8kb
          },
        },
        generator: {
          filename: 'images/[name].[hash:8][ext]',
        },
      },
      // Fonts handling
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash:8][ext]',
        },
      },
    ],
  },
  
  // Resolve configuration
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components'),
      'containers': path.resolve(__dirname, 'src/containers'),
      'utils': path.resolve(__dirname, 'src/utils'),
      'assets': path.resolve(__dirname, 'src/assets'),
      'hooks': path.resolve(__dirname, 'src/hooks'),
      'services': path.resolve(__dirname, 'src/services'),
    },
    // Prevent multiple versions of React
    fallback: {
      'react': path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },
  
  // Plugins configuration
  plugins: [
    // Clean the build directory
    new CleanWebpackPlugin(),
    
    // Generate HTML file with injected bundles
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      inject: true,
      minify: isProduction ? {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      } : false,
    }),
    
    // Extract CSS into separate files
    isProduction && new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[name].[contenthash:8].chunk.css',
    }),
    
    // Define environment variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.API_URL': JSON.stringify(process.env.API_URL || '/api/v1'),
    }),
    
    // Compression for production builds
    isProduction && new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240, // Only compress files > 10kb
      minRatio: 0.8,
    }),
    
    // Bundle analysis (only when ANALYZE=true)
    process.env.ANALYZE === 'true' && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
    }),
  ].filter(Boolean),
  
  // Development server configuration
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    compress: true,
    port: 3000,
    hot: true,
    historyApiFallback: true,
    open: true,
  },
  
  // Performance hints
  performance: {
    hints: isProduction ? 'warning' : false,
    maxEntrypointSize: 512000, // 500kb
    maxAssetSize: 512000, // 500kb
  },
};
