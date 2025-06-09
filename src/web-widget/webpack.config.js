const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'chatbot-widget.js',
      library: 'ChatbotWidget',
      libraryTarget: 'umd',
      libraryExport: 'default',
      umdNamedDefine: true,
      globalObject: 'this'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.s?css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.(png|svg|jpg|gif)$/,
          type: 'asset/inline'
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'chatbot-widget.css'
      }),
      new HtmlWebpackPlugin({
        template: './src/demo.html',
        filename: 'demo.html',
        inject: 'head'
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
      })
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false
            },
            compress: {
              drop_console: isProduction
            }
          },
          extractComments: false
        })
      ]
    },
    devtool: isProduction ? false : 'source-map',
    performance: {
      hints: false
    },
    // Configure proxy for development
    devServer: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          // If using a proxy, configure it here
          ...(process.env.HTTP_PROXY ? {
            agent: require('http-proxy-agent')(process.env.HTTP_PROXY)
          } : {})
        }
      },
      // Set the proxy for all requests if HTTP_PROXY is defined
      onBeforeSetupMiddleware: function(devServer) {
        if (process.env.HTTP_PROXY) {
          console.log(`Using proxy: ${process.env.HTTP_PROXY}`);
          // Set the proxy for axios and other HTTP clients
          process.env.NODE_ENV !== 'test' && console.log('Proxy configured for development server');
        }
      }
    }
  };
};
