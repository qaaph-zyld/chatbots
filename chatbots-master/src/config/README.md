# Configuration Service

This module centralizes configuration management for the Chatbot Platform, ensuring consistent access to environment variables and configuration settings across all services.

## Key Features

- **Environment Variable Management**: Centralized access to environment variables with default values
- **Proxy Configuration**: Unified proxy settings for all HTTP requests
- **Environment Detection**: Helper methods to detect current environment (development, test, production)
- **Type Safety**: Proper parsing of numeric and boolean environment variables

## Usage

### Basic Configuration Access

```javascript
const { environment } = require('./config');

// Access configuration values
const port = environment.PORT;
const mongoUri = environment.MONGODB_URI;

// Check environment
if (environment.isProduction()) {
  // Production-specific logic
}
```

### Proxy Configuration

```javascript
const { proxy } = require('./config');

// Get proxy URL (http://host:port)
const proxyUrl = proxy.getProxyUrl();

// Get proxy configuration object for axios
const proxyConfig = proxy.getProxyConfig();

// Create an HTTP client with proxy configuration
const httpClient = proxy.createHttpClient({
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

// Configure global axios defaults with proxy
proxy.configureGlobalAxios();

// Get HTTPS proxy agent for Node.js https module
const httpsAgent = proxy.getHttpsProxyAgent();
```

## Environment Variables

The configuration service uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment (development, test, production) | development |
| PORT | Server port | 3000 |
| MONGODB_URI | MongoDB connection URI | mongodb://localhost:27017/chatbots |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| PROXY_PROTOCOL | Proxy protocol | http |
| PROXY_HOST | Proxy host | 104.129.196.38 |
| PROXY_PORT | Proxy port | 10563 |

## Best Practices

1. **Always use the configuration service** instead of accessing `process.env` directly
2. **Add new environment variables** to both `environment.js` and `.env.template`
3. **Use type-safe getters** to ensure proper data types
4. **Create HTTP clients** using the proxy factory method for consistent proxy configuration
5. **Document new configuration options** in this README

## Implementation Details

The configuration service consists of:

- **environment.js**: Centralizes environment variable access with defaults
- **proxy.js**: Provides proxy configuration utilities
- **index.js**: Exports all configuration modules

The service automatically loads environment variables from `.env` files using `dotenv`.
