const axios = require('axios');

class ShopifyIntegration {
  constructor(config) {
    this.shopDomain = config.shop_domain;
    this.apiKey = config.api_key;
    this.apiSecret = config.api_secret;
    this.accessToken = config.access_token;
    this.baseUrl = `https://${this.shopDomain}/admin/api/2023-10`;
  }

  // Get headers for API requests
  getHeaders() {
    return {
      'X-Shopify-Access-Token': this.accessToken,
      'Content-Type': 'application/json'
    };
  }

  // Get order by order number or ID
  async getOrder(orderIdentifier) {
    try {
      let url;
      
      // Check if it's an order number (string) or ID (number)
      if (isNaN(orderIdentifier)) {
        // Search by order number
        url = `${this.baseUrl}/orders.json?name=${orderIdentifier}`;
      } else {
        // Get by order ID
        url = `${this.baseUrl}/orders/${orderIdentifier}.json`;
      }

      const response = await axios.get(url, { headers: this.getHeaders() });
      
      if (response.data.orders && response.data.orders.length > 0) {
        return this.formatOrder(response.data.orders[0]);
      } else if (response.data.order) {
        return this.formatOrder(response.data.order);
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  // Get customer by email
  async getCustomer(email) {
    try {
      const url = `${this.baseUrl}/customers/search.json?query=email:${email}`;
      const response = await axios.get(url, { headers: this.getHeaders() });
      
      if (response.data.customers && response.data.customers.length > 0) {
        return this.formatCustomer(response.data.customers[0]);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching customer from Shopify:', error.message);
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }
  }

  // Get product information
  async getProduct(productId) {
    try {
      const url = `${this.baseUrl}/products/${productId}.json`;
      const response = await axios.get(url, { headers: this.getHeaders() });
      
      if (response.data.product) {
        return this.formatProduct(response.data.product);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching product from Shopify:', error.message);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  // Search products
  async searchProducts(query, limit = 10) {
    try {
      const url = `${this.baseUrl}/products.json?title=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await axios.get(url, { headers: this.getHeaders() });
      
      if (response.data.products) {
        return response.data.products.map(product => this.formatProduct(product));
      }
      
      return [];
    } catch (error) {
      console.error('Error searching products in Shopify:', error.message);
      throw new Error(`Failed to search products: ${error.message}`);
    }
  }

  // Process refund
  async processRefund(orderId, amount, reason = 'Customer request') {
    try {
      const refundData = {
        refund: {
          currency: 'USD',
          notify: true,
          note: reason,
          refund_line_items: [],
          transactions: [{
            parent_id: orderId,
            amount: amount,
            kind: 'refund',
            gateway: 'manual'
          }]
        }
      };

      const url = `${this.baseUrl}/orders/${orderId}/refunds.json`;
      const response = await axios.post(url, refundData, { headers: this.getHeaders() });
      
      return response.data.refund;
    } catch (error) {
      console.error('Error processing refund in Shopify:', error.message);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  // Format order data for consistent response
  formatOrder(order) {
    return {
      id: order.id,
      order_number: order.name,
      status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      total_price: order.total_price,
      currency: order.currency,
      customer: {
        email: order.email,
        name: `${order.billing_address?.first_name || ''} ${order.billing_address?.last_name || ''}`.trim()
      },
      created_at: order.created_at,
      updated_at: order.updated_at,
      line_items: order.line_items?.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price
      })) || [],
      shipping_address: order.shipping_address,
      tracking_numbers: order.fulfillments?.map(f => f.tracking_number).filter(Boolean) || []
    };
  }

  // Format customer data
  formatCustomer(customer) {
    return {
      id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      total_spent: customer.total_spent,
      orders_count: customer.orders_count,
      created_at: customer.created_at,
      addresses: customer.addresses || []
    };
  }

  // Format product data
  formatProduct(product) {
    return {
      id: product.id,
      title: product.title,
      description: product.body_html,
      vendor: product.vendor,
      product_type: product.product_type,
      handle: product.handle,
      status: product.status,
      variants: product.variants?.map(variant => ({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        inventory_quantity: variant.inventory_quantity,
        available: variant.inventory_quantity > 0
      })) || [],
      images: product.images?.map(img => img.src) || []
    };
  }

  // Test connection
  async testConnection() {
    try {
      const url = `${this.baseUrl}/shop.json`;
      const response = await axios.get(url, { headers: this.getHeaders() });
      return {
        success: true,
        shop: response.data.shop
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
