const axios = require('axios');

class WooCommerceIntegration {
  constructor(config) {
    this.siteUrl = config.site_url;
    this.consumerKey = config.consumer_key;
    this.consumerSecret = config.consumer_secret;
    this.baseUrl = `${this.siteUrl}/wp-json/wc/v3`;
    
    // Setup basic auth
    this.auth = {
      username: this.consumerKey,
      password: this.consumerSecret
    };
  }

  // Get headers for API requests
  getHeaders() {
    return {
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
        url = `${this.baseUrl}/orders?search=${orderIdentifier}`;
      } else {
        // Get by order ID
        url = `${this.baseUrl}/orders/${orderIdentifier}`;
      }

      const response = await axios.get(url, { 
        headers: this.getHeaders(),
        auth: this.auth
      });
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        return this.formatOrder(response.data[0]);
      } else if (response.data.id) {
        return this.formatOrder(response.data);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching order from WooCommerce:', error.message);
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  // Get customer by email
  async getCustomer(email) {
    try {
      const url = `${this.baseUrl}/customers?email=${email}`;
      const response = await axios.get(url, { 
        headers: this.getHeaders(),
        auth: this.auth
      });
      
      if (response.data && response.data.length > 0) {
        return this.formatCustomer(response.data[0]);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching customer from WooCommerce:', error.message);
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }
  }

  // Get product information
  async getProduct(productId) {
    try {
      const url = `${this.baseUrl}/products/${productId}`;
      const response = await axios.get(url, { 
        headers: this.getHeaders(),
        auth: this.auth
      });
      
      if (response.data.id) {
        return this.formatProduct(response.data);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching product from WooCommerce:', error.message);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  // Search products
  async searchProducts(query, limit = 10) {
    try {
      const url = `${this.baseUrl}/products?search=${encodeURIComponent(query)}&per_page=${limit}`;
      const response = await axios.get(url, { 
        headers: this.getHeaders(),
        auth: this.auth
      });
      
      if (response.data && Array.isArray(response.data)) {
        return response.data.map(product => this.formatProduct(product));
      }
      
      return [];
    } catch (error) {
      console.error('Error searching products in WooCommerce:', error.message);
      throw new Error(`Failed to search products: ${error.message}`);
    }
  }

  // Process refund
  async processRefund(orderId, amount, reason = 'Customer request') {
    try {
      const refundData = {
        amount: amount,
        reason: reason,
        refunded_by: 'system',
        meta_data: [
          {
            key: 'refund_source',
            value: 'chatbot'
          }
        ]
      };

      const url = `${this.baseUrl}/orders/${orderId}/refunds`;
      const response = await axios.post(url, refundData, { 
        headers: this.getHeaders(),
        auth: this.auth
      });
      
      return response.data;
    } catch (error) {
      console.error('Error processing refund in WooCommerce:', error.message);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  // Get order notes
  async getOrderNotes(orderId) {
    try {
      const url = `${this.baseUrl}/orders/${orderId}/notes`;
      const response = await axios.get(url, { 
        headers: this.getHeaders(),
        auth: this.auth
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching order notes from WooCommerce:', error.message);
      throw new Error(`Failed to fetch order notes: ${error.message}`);
    }
  }

  // Add order note
  async addOrderNote(orderId, note, customerNote = false) {
    try {
      const noteData = {
        note: note,
        customer_note: customerNote
      };

      const url = `${this.baseUrl}/orders/${orderId}/notes`;
      const response = await axios.post(url, noteData, { 
        headers: this.getHeaders(),
        auth: this.auth
      });
      
      return response.data;
    } catch (error) {
      console.error('Error adding order note in WooCommerce:', error.message);
      throw new Error(`Failed to add order note: ${error.message}`);
    }
  }

  // Format order data for consistent response
  formatOrder(order) {
    return {
      id: order.id,
      order_number: order.number,
      status: order.status,
      total_price: order.total,
      currency: order.currency,
      customer: {
        email: order.billing.email,
        name: `${order.billing.first_name || ''} ${order.billing.last_name || ''}`.trim()
      },
      created_at: order.date_created,
      updated_at: order.date_modified,
      line_items: order.line_items?.map(item => ({
        id: item.id,
        title: item.name,
        quantity: item.quantity,
        price: item.price
      })) || [],
      shipping_address: {
        first_name: order.shipping.first_name,
        last_name: order.shipping.last_name,
        address1: order.shipping.address_1,
        address2: order.shipping.address_2,
        city: order.shipping.city,
        province: order.shipping.state,
        zip: order.shipping.postcode,
        country: order.shipping.country
      },
      tracking_numbers: this.extractTrackingNumbers(order)
    };
  }

  // Format customer data
  formatCustomer(customer) {
    return {
      id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      username: customer.username,
      total_spent: customer.total_spent,
      orders_count: customer.orders_count,
      created_at: customer.date_created,
      billing_address: customer.billing,
      shipping_address: customer.shipping
    };
  }

  // Format product data
  formatProduct(product) {
    return {
      id: product.id,
      title: product.name,
      description: product.description,
      short_description: product.short_description,
      sku: product.sku,
      price: product.price,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      status: product.status,
      stock_status: product.stock_status,
      stock_quantity: product.stock_quantity,
      categories: product.categories?.map(cat => cat.name) || [],
      images: product.images?.map(img => img.src) || [],
      variations: product.variations || []
    };
  }

  // Extract tracking numbers from order meta data
  extractTrackingNumbers(order) {
    const trackingNumbers = [];
    
    // Check meta data for common tracking number fields
    if (order.meta_data) {
      order.meta_data.forEach(meta => {
        if (meta.key.includes('tracking') || meta.key.includes('shipment')) {
          trackingNumbers.push(meta.value);
        }
      });
    }
    
    return trackingNumbers.filter(Boolean);
  }

  // Test connection
  async testConnection() {
    try {
      const url = `${this.baseUrl}/system_status`;
      const response = await axios.get(url, { 
        headers: this.getHeaders(),
        auth: this.auth
      });
      
      return {
        success: true,
        system_status: response.data
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
