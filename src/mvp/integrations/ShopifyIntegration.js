/**
 * Shopify Integration for ShopBot MVP
 * Handles product sync, order management, and webhook processing
 */

const https = require('https');
const crypto = require('crypto');

class ShopifyIntegration {
  constructor(config = {}) {
    this.shopDomain = config.shopDomain;
    this.accessToken = config.accessToken;
    this.webhookSecret = config.webhookSecret;
    this.apiVersion = config.apiVersion || '2023-10';
  }

  /**
   * Make authenticated request to Shopify API
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = `https://${this.shopDomain}.myshopify.com/admin/api/${this.apiVersion}/${endpoint}`;
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json',
          'User-Agent': 'ShopBot/1.0'
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(new Error(`Shopify API Error: ${res.statusCode} - ${parsedData.errors || responseData}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse Shopify response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      if (data && (method === 'POST' || method === 'PUT')) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Get all products from Shopify
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Products array
   */
  async getProducts(options = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.since_id) queryParams.append('since_id', options.since_id);
      if (options.published_status) queryParams.append('published_status', options.published_status);
      if (options.vendor) queryParams.append('vendor', options.vendor);
      if (options.product_type) queryParams.append('product_type', options.product_type);

      const endpoint = `products.json${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.makeRequest(endpoint);
      
      return this.transformProducts(response.products || []);
    } catch (error) {
      console.error('Error fetching Shopify products:', error);
      throw error;
    }
  }

  /**
   * Get single product by ID
   * @param {string} productId - Shopify product ID
   * @returns {Promise<Object>} Product object
   */
  async getProduct(productId) {
    try {
      const response = await this.makeRequest(`products/${productId}.json`);
      return this.transformProduct(response.product);
    } catch (error) {
      console.error(`Error fetching Shopify product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Search products
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Products array
   */
  async searchProducts(query, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', options.limit || 10);
      
      // Shopify doesn't have a direct search endpoint, so we'll filter by title
      const endpoint = `products.json?${queryParams.toString()}`;
      const response = await this.makeRequest(endpoint);
      
      const products = response.products || [];
      const filteredProducts = products.filter(product => 
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.body_html.toLowerCase().includes(query.toLowerCase()) ||
        product.tags.toLowerCase().includes(query.toLowerCase())
      );
      
      return this.transformProducts(filteredProducts);
    } catch (error) {
      console.error('Error searching Shopify products:', error);
      throw error;
    }
  }

  /**
   * Get orders
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Orders array
   */
  async getOrders(options = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.since_id) queryParams.append('since_id', options.since_id);
      if (options.status) queryParams.append('status', options.status);
      if (options.financial_status) queryParams.append('financial_status', options.financial_status);

      const endpoint = `orders.json${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.makeRequest(endpoint);
      
      return response.orders || [];
    } catch (error) {
      console.error('Error fetching Shopify orders:', error);
      throw error;
    }
  }

  /**
   * Create order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  async createOrder(orderData) {
    try {
      const response = await this.makeRequest('orders.json', 'POST', { order: orderData });
      return response.order;
    } catch (error) {
      console.error('Error creating Shopify order:', error);
      throw error;
    }
  }

  /**
   * Get customers
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Customers array
   */
  async getCustomers(options = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.since_id) queryParams.append('since_id', options.since_id);

      const endpoint = `customers.json${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.makeRequest(endpoint);
      
      return response.customers || [];
    } catch (error) {
      console.error('Error fetching Shopify customers:', error);
      throw error;
    }
  }

  /**
   * Create customer
   * @param {Object} customerData - Customer data
   * @returns {Promise<Object>} Created customer
   */
  async createCustomer(customerData) {
    try {
      const response = await this.makeRequest('customers.json', 'POST', { customer: customerData });
      return response.customer;
    } catch (error) {
      console.error('Error creating Shopify customer:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   * @param {string} body - Raw request body
   * @param {string} signature - Shopify signature header
   * @returns {boolean} Is signature valid
   */
  verifyWebhook(body, signature) {
    if (!this.webhookSecret) {
      console.warn('Webhook secret not configured');
      return false;
    }

    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    hmac.update(body, 'utf8');
    const calculatedSignature = hmac.digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(calculatedSignature, 'base64')
    );
  }

  /**
   * Handle webhook events
   * @param {string} topic - Webhook topic
   * @param {Object} data - Webhook data
   * @returns {Promise<void>}
   */
  async handleWebhook(topic, data) {
    try {
      switch (topic) {
        case 'products/create':
          await this.handleProductCreate(data);
          break;
        case 'products/update':
          await this.handleProductUpdate(data);
          break;
        case 'products/delete':
          await this.handleProductDelete(data);
          break;
        case 'orders/create':
          await this.handleOrderCreate(data);
          break;
        case 'orders/updated':
          await this.handleOrderUpdate(data);
          break;
        case 'orders/paid':
          await this.handleOrderPaid(data);
          break;
        case 'orders/cancelled':
          await this.handleOrderCancelled(data);
          break;
        case 'customers/create':
          await this.handleCustomerCreate(data);
          break;
        case 'customers/update':
          await this.handleCustomerUpdate(data);
          break;
        default:
          console.log(`Unhandled webhook topic: ${topic}`);
      }
    } catch (error) {
      console.error(`Error handling webhook ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Transform Shopify products to internal format
   * @param {Array} products - Shopify products
   * @returns {Array} Transformed products
   */
  transformProducts(products) {
    return products.map(product => this.transformProduct(product));
  }

  /**
   * Transform single Shopify product to internal format
   * @param {Object} product - Shopify product
   * @returns {Object} Transformed product
   */
  transformProduct(product) {
    const variant = product.variants && product.variants[0];
    const image = product.images && product.images[0];

    return {
      id: `shopify_${product.id}`,
      externalId: product.id.toString(),
      name: product.title,
      description: this.stripHtml(product.body_html || ''),
      price: variant ? parseFloat(variant.price) : 0,
      comparePrice: variant && variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
      sku: variant ? variant.sku : null,
      inventory: variant ? variant.inventory_quantity : 0,
      inStock: variant ? variant.inventory_quantity > 0 : false,
      image: image ? image.src : null,
      images: product.images ? product.images.map(img => img.src) : [],
      category: product.product_type || 'Uncategorized',
      tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : [],
      vendor: product.vendor,
      handle: product.handle,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      source: 'shopify'
    };
  }

  /**
   * Strip HTML tags from string
   * @param {string} html - HTML string
   * @returns {string} Plain text
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  // Webhook handlers
  async handleProductCreate(product) {
    console.log('Product created:', product.title);
    // TODO: Sync to local database
  }

  async handleProductUpdate(product) {
    console.log('Product updated:', product.title);
    // TODO: Update local database
  }

  async handleProductDelete(product) {
    console.log('Product deleted:', product.id);
    // TODO: Remove from local database
  }

  async handleOrderCreate(order) {
    console.log('Order created:', order.order_number);
    // TODO: Process new order
  }

  async handleOrderUpdate(order) {
    console.log('Order updated:', order.order_number);
    // TODO: Update order status
  }

  async handleOrderPaid(order) {
    console.log('Order paid:', order.order_number);
    // TODO: Process payment
  }

  async handleOrderCancelled(order) {
    console.log('Order cancelled:', order.order_number);
    // TODO: Handle cancellation
  }

  async handleCustomerCreate(customer) {
    console.log('Customer created:', customer.email);
    // TODO: Sync customer data
  }

  async handleCustomerUpdate(customer) {
    console.log('Customer updated:', customer.email);
    // TODO: Update customer data
  }

  /**
   * Test connection to Shopify
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      const response = await this.makeRequest('shop.json');
      return {
        success: true,
        shop: response.shop,
        message: `Connected to ${response.shop.name}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ShopifyIntegration;
