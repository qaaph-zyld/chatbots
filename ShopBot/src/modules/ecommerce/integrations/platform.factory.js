// Platform factory implementation
class PlatformFactory {
  static createConnector(platform, credentials) {
    switch (platform) {
      case 'shopify':
        return new ShopifyConnector(credentials);
      case 'woocommerce':
        return new WooCommerceConnector(credentials);
      default:
        throw new Error('Unsupported platform');
    }
  }
}
