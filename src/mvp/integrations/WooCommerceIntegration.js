/**
 * WooCommerce Integration for ShopBot MVP
 * Handles product sync, order management, and webhook processing
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

class WooCommerceIntegration {
  constructor(config = {}) {
    this.siteUrl = config.siteUrl;
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
    this.version = config.version || 'wc/v3';
    this.isHttps = this.siteUrl && this.siteUrl.startsWith('https://');
  }

  /**
   * Make authenticated request to WooCommerce API
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = `${this.siteUrl}/wp-json/${this.version}/${endpoint}`;
      const urlObj = new URL(url);
      
      // Add authentication parameters
      urlObj.searchParams.append('consumer_key', this.consumerKey);
      urlObj.searchParams.append('consumer_secret', this.consumerSecret);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (this.isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ShopBot/1.0'
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const httpModule = this.isHttps ? https : http;
      const req = httpModule.request(options, (res) => {
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
              reject(new Error(`WooCommerce API Error: ${res.statusCode} - ${parsedData.message || responseData}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse WooCommerce response: ${error.message}`));
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
   * Get all products from WooCommerce
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Products array
   */
  async getProducts(options = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (options.per_page) queryParams.append('per_page', options.per_page);
      if (options.page) queryParams.append('page', options.page);
      if (options.search) queryParams.append('search', options.search);
      if (options.category) queryParams.append('category', options.category);
      if (options.tag) queryParams.append('tag', options.tag);
      if (options.status) queryParams.append('status', options.status);
      if (options.orderby) queryParams.append('orderby', options.orderby);
      if (options.order) queryParams.append('order', options.order);

      const endpoint = `products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const products = await this.makeRequest(endpoint);
      
      return this.transformProducts(Array.isArray(products) ? products : []);
    } catch (error) {
      console.error('Error fetching WooCommerce products:', error);
      throw error;
    }
  }

  /**
   * Get single product by ID
   * @param {string} productId - WooCommerce product ID
   * @returns {Promise<Object>} Product object
   */
  async getProduct(productId) {
    try {
      const product = await this.makeRequest(`products/${productId}`);
      return this.transformProduct(product);
    } catch (error) {
      console.error(`Error fetching WooCommerce product ${productId}:`, error);
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
      const searchOptions = {
        search: query,
        per_page: options.limit || 10,
        status: 'publish',
        ...options
      };
      
      return await this.getProducts(searchOptions);
    } catch (error) {
      console.error('Error searching WooCommerce products:', error);
      throw error;
    }
  }

  /**
   * Get product categories
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Categories array
   */
  async getCategories(options = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (options.per_page) queryParams.append('per_page', options.per_page);
      if (options.page) queryParams.append('page', options.page);
      if (options.search) queryParams.append('search', options.search);
      if (options.parent) queryParams.append('parent', options.parent);

      const endpoint = `products/categories${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const categories = await this.makeRequest(endpoint);
      
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error('Error fetching WooCommerce categories:', error);
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
      
      if (options.per_page) queryParams.append('per_page', options.per_page);
      if (options.page) queryParams.append('page', options.page);
      if (options.search) queryParams.append('search', options.search);
      if (options.status) queryParams.append('status', options.status);
      if (options.customer) queryParams.append('customer', options.customer);
      if (options.after) queryParams.append('after', options.after);
      if (options.before) queryParams.append('before', options.before);

      const endpoint = `orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const orders = await this.makeRequest(endpoint);
      
      return Array.isArray(orders) ? orders : [];
    } catch (error) {
      console.error('Error fetching WooCommerce orders:', error);
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
      const order = await this.makeRequest('orders', 'POST', orderData);
      return order;
    } catch (error) {
      console.error('Error creating WooCommerce order:', error);
      throw error;
    }
  }

  /**
   * Update order
   * @param {string} orderId - Order ID
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Updated order
   */
  async updateOrder(orderId, orderData) {
    try {
      const order = await this.makeRequest(`orders/${orderId}`, 'PUT', orderData);
      return order;
    } catch (error) {
      console.error(`Error updating WooCommerce order ${orderId}:`, error);
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
      
      if (options.per_page) queryParams.append('per_page', options.per_page);
      if (options.page) queryParams.append('page', options.page);
      if (options.search) queryParams.append('search', options.search);
      if (options.email) queryParams.append('email', options.email);
      if (options.role) queryParams.append('role', options.role);

      const endpoint = `customers${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const customers = await this.makeRequest(endpoint);
      
      return Array.isArray(customers) ? customers : [];
    } catch (error) {
      console.error('Error fetching WooCommerce customers:', error);
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
      const customer = await this.makeRequest('customers', 'POST', customerData);
      return customer;
    } catch (error) {
      console.error('Error creating WooCommerce customer:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   * @param {string} body - Raw request body
   * @param {string} signature - WooCommerce signature header
   * @returns {boolean} Is signature valid
   */
  verifyWebhook(body, signature) {
    if (!this.consumerSecret) {
      console.warn('Consumer secret not configured for webhook verification');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.consumerSecret)
      .update(body, 'utf8')
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
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
        case 'product.created':
          await this.handleProductCreate(data);
          break;
        case 'product.updated':
          await this.handleProductUpdate(data);
          break;
        case 'product.deleted':
          await this.handleProductDelete(data);
          break;
        case 'order.created':
          await this.handleOrderCreate(data);
          break;
        case 'order.updated':
          await this.handleOrderUpdate(data);
          break;
        case 'customer.created':
          await this.handleCustomerCreate(data);
          break;
        case 'customer.updated':
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
   * Transform WooCommerce products to internal format
   * @param {Array} products - WooCommerce products
   * @returns {Array} Transformed products
   */
  transformProducts(products) {
    return products.map(product => this.transformProduct(product));
  }

  /**
   * Transform single WooCommerce product to internal format
   * @param {Object} product - WooCommerce product
   * @returns {Object} Transformed product
   */
  transformProduct(product) {
    const image = product.images && product.images[0];
    const regularPrice = parseFloat(product.regular_price) || 0;
    const salePrice = parseFloat(product.sale_price) || regularPrice;

    return {
      id: `woocommerce_${product.id}`,
      externalId: product.id.toString(),
      name: product.name,
      description: this.stripHtml(product.description || product.short_description || ''),
      price: salePrice,
      regularPrice: regularPrice,
      salePrice: product.on_sale ? salePrice : null,
      sku: product.sku,
      inventory: product.stock_quantity,
      inStock: product.stock_status === 'instock',
      image: image ? image.src : null,
      images: product.images ? product.images.map(img => img.src) : [],
      category: product.categories && product.categories[0] ? product.categories[0].name : 'Uncategorized',
      categories: product.categories ? product.categories.map(cat => cat.name) : [],
      tags: product.tags ? product.tags.map(tag => tag.name) : [],
      weight: product.weight,
      dimensions: product.dimensions,
      permalink: product.permalink,
      status: product.status,
      featured: product.featured,
      onSale: product.on_sale,
      createdAt: product.date_created,
      updatedAt: product.date_modified,
      source: 'woocommerce'
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
    console.log('Product created:', product.name);
    // TODO: Sync to local database
  }

  async handleProductUpdate(product) {
    console.log('Product updated:', product.name);
    // TODO: Update local database
  }

  async handleProductDelete(product) {
    console.log('Product deleted:', product.id);
    // TODO: Remove from local database
  }

  async handleOrderCreate(order) {
    console.log('Order created:', order.number);
    // TODO: Process new order
  }

  async handleOrderUpdate(order) {
    console.log('Order updated:', order.number);
    // TODO: Update order status
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
   * Test connection to WooCommerce
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      const response = await this.makeRequest('system_status');
      return {
        success: true,
        system: response,
        message: `Connected to WooCommerce site`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = WooCommerceIntegration;
