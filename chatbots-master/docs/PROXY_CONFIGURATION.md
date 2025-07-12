# Proxy Configuration Guide

This guide provides instructions for configuring the Chatbots Platform to work with corporate proxies, which is a common requirement in enterprise environments.

## Web Widget Proxy Configuration

The Chatbots Platform Web Widget supports proxy configuration for environments that require a proxy for external connections. Here's how to configure the widget to use a proxy:

### Script Tag Configuration

When embedding the widget using a script tag, you can specify the proxy URL using the `data-proxy-url` attribute:

```html
<script src="https://cdn.chatbots-platform.example.com/widget.js" 
  data-chatbot-widget="true"
  data-auto-init="true"
  data-api-key="YOUR_API_KEY"
  data-chatbot-id="YOUR_CHATBOT_ID"
  data-proxy-url="104.129.196.38:10563">
</script>
```

### JavaScript Configuration

When initializing the widget programmatically, you can specify the proxy URL in the configuration object:

```javascript
const widget = new ChatbotWidget({
  apiKey: 'YOUR_API_KEY',
  chatbotId: 'YOUR_CHATBOT_ID',
  proxyUrl: '104.129.196.38:10563'
});

widget.init();
```

### Building the Widget with Proxy Support

When building the widget from source, you can specify the proxy URL in the build process:

```bash
# Set the proxy environment variable
export HTTP_PROXY=104.129.196.38:10563

# Build the widget
npm run build
```

Or use the pre-configured build scripts in package.json:

```bash
npm run build:prod
```

These scripts already include the proxy configuration for the build process.

## Configuring NPM to Use a Proxy

When deploying the Chatbots Platform in an environment that requires a proxy for external connections, you'll need to configure NPM to use your corporate proxy:

### Command Line Configuration

```bash
# Configure HTTP proxy
npm config set proxy http://104.129.196.38:10563

# Configure HTTPS proxy
npm config set https-proxy http://104.129.196.38:10563
```

### .npmrc Configuration

Alternatively, you can create or edit the `.npmrc` file in your project root:

```
proxy=http://104.129.196.38:10563
https-proxy=http://104.129.196.38:10563
```

## Docker Build with Proxy

When building Docker images behind a corporate proxy, you need to pass the proxy settings to the Docker build process:

```bash
docker build \
  --build-arg HTTP_PROXY=http://104.129.196.38:10563 \
  --build-arg HTTPS_PROXY=http://104.129.196.38:10563 \
  -t chatbots-platform .
```

## Dockerfile Proxy Configuration

Update your Dockerfile to include proxy settings for any commands that need internet access:

```dockerfile
# Set proxy environment variables
ENV HTTP_PROXY=http://104.129.196.38:10563
ENV HTTPS_PROXY=http://104.129.196.38:10563
ENV NO_PROXY=localhost,127.0.0.1

# Run npm install with proxy settings
RUN npm config set proxy http://104.129.196.38:10563 && \
    npm config set https-proxy http://104.129.196.38:10563 && \
    npm ci --production

# Unset proxy environment variables if needed for application runtime
ENV HTTP_PROXY=
ENV HTTPS_PROXY=
ENV NO_PROXY=
```

## Kubernetes Deployment with Proxy

When deploying to Kubernetes in an environment with a proxy, you need to configure the proxy settings in your deployment:

### Environment Variables in Deployment

Add the following to your Kubernetes deployment manifest or Helm values:

```yaml
# In deployment.yaml
containers:
- name: chatbots-platform
  env:
  - name: HTTP_PROXY
    value: "http://104.129.196.38:10563"
  - name: HTTPS_PROXY
    value: "http://104.129.196.38:10563"
  - name: NO_PROXY
    value: "localhost,127.0.0.1,kubernetes.default.svc,.cluster.local"
```

### Helm Values Configuration

If using our Helm chart, you can set proxy values in your custom values file:

```yaml
# In values.yaml
config:
  proxy:
    httpProxy: "http://104.129.196.38:10563"
    httpsProxy: "http://104.129.196.38:10563"
    noProxy: "localhost,127.0.0.1,kubernetes.default.svc,.cluster.local"
```

## GitHub Actions with Proxy

To configure GitHub Actions workflows to use a proxy:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      HTTP_PROXY: http://104.129.196.38:10563
      HTTPS_PROXY: http://104.129.196.38:10563
      NO_PROXY: localhost,127.0.0.1
    steps:
      - uses: actions/checkout@v3
      # Other steps...
```

## Troubleshooting Proxy Issues

If you encounter issues with proxy configuration:

1. **Verify proxy connectivity**:
   ```bash
   curl -v --proxy http://104.129.196.38:10563 https://registry.npmjs.org/
   ```

2. **Check proxy environment variables**:
   ```bash
   echo $HTTP_PROXY
   echo $HTTPS_PROXY
   ```

3. **Inspect npm proxy configuration**:
   ```bash
   npm config get proxy
   npm config get https-proxy
   ```

4. **Common issues**:
   - SSL certificate validation errors
   - Proxy authentication requirements
   - Incorrect proxy URL format
   - Firewall blocking proxy connections

## Proxy Authentication

If your proxy requires authentication:

```bash
# Format: protocol://username:password@host:port
npm config set proxy http://username:password@104.129.196.38:10563
npm config set https-proxy http://username:password@104.129.196.38:10563
```

For security reasons, consider using environment variables for proxy credentials rather than hardcoding them in configuration files.

## Additional Resources

- [NPM proxy configuration documentation](https://docs.npmjs.com/cli/v8/using-npm/config#proxy)
- [Docker proxy settings documentation](https://docs.docker.com/network/proxy/)
- [Kubernetes proxy configuration best practices](https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)
