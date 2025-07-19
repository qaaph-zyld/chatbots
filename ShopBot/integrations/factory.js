const ShopifyIntegration = require('./shopify');
const WooCommerceIntegration = require('./woocommerce');

class IntegrationFactory {
  static create(platform, config) {
    switch (platform.toLowerCase()) {
      case 'shopify':
        return new ShopifyIntegration(config);
      case 'woocommerce':
        return new WooCommerceIntegration(config);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  static getSupportedPlatforms() {
    return ['shopify', 'woocommerce'];
  }

  static validateConfig(platform, config) {
    const errors = [];

    switch (platform.toLowerCase()) {
      case 'shopify':
        if (!config.shop_domain) errors.push('shop_domain is required');
        if (!config.access_token) errors.push('access_token is required');
        break;
      
      case 'woocommerce':
        if (!config.site_url) errors.push('site_url is required');
        if (!config.consumer_key) errors.push('consumer_key is required');
        if (!config.consumer_secret) errors.push('consumer_secret is required');
        break;
      
      default:
        errors.push(`Unsupported platform: ${platform}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = IntegrationFactory;
