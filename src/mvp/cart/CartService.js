/**
 * Shopping Cart Service - MVP Implementation
 * Handles cart operations and session management
 */

const SimpleDB = require('../database/SimpleDB');

class CartService {
  constructor() {
    this.db = new SimpleDB('./data');
    this.carts = new Map(); // In-memory cache for active carts
  }

  // Get or create cart for session
  getCart(sessionId) {
    // Check memory cache first
    if (this.carts.has(sessionId)) {
      return this.carts.get(sessionId);
    }

    // Check database
    let cart = this.db.findOne('carts', { sessionId });
    
    if (!cart) {
      // Create new cart
      cart = {
        sessionId,
        items: [],
        total: 0,
        itemCount: 0,
        currency: 'USD',
        status: 'active'
      };
      cart = this.db.insert('carts', cart);
    }

    // Cache in memory
    this.carts.set(sessionId, cart);
    return cart;
  }

  // Add item to cart
  addItem(sessionId, product, quantity = 1) {
    const cart = this.getCart(sessionId);
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].subtotal = cart.items[existingItemIndex].quantity * cart.items[existingItemIndex].price;
    } else {
      // Add new item
      const cartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        subtotal: product.price * quantity,
        image: product.image,
        addedAt: new Date()
      };
      cart.items.push(cartItem);
    }

    // Recalculate totals
    this.calculateTotals(cart);
    
    // Save to database
    this.saveCart(cart);
    
    return cart;
  }

  // Remove item from cart
  removeItem(sessionId, productId) {
    const cart = this.getCart(sessionId);
    
    cart.items = cart.items.filter(item => item.productId !== productId);
    
    // Recalculate totals
    this.calculateTotals(cart);
    
    // Save to database
    this.saveCart(cart);
    
    return cart;
  }

  // Update item quantity
  updateQuantity(sessionId, productId, quantity) {
    const cart = this.getCart(sessionId);
    
    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        cart.items.splice(itemIndex, 1);
      } else {
        // Update quantity
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].subtotal = cart.items[itemIndex].price * quantity;
      }
      
      // Recalculate totals
      this.calculateTotals(cart);
      
      // Save to database
      this.saveCart(cart);
    }
    
    return cart;
  }

  // Clear cart
  clearCart(sessionId) {
    const cart = this.getCart(sessionId);
    
    cart.items = [];
    cart.total = 0;
    cart.itemCount = 0;
    
    // Save to database
    this.saveCart(cart);
    
    return cart;
  }

  // Calculate cart totals
  calculateTotals(cart) {
    cart.itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.subtotal = Math.round(cart.items.reduce((total, item) => total + item.subtotal, 0) * 100) / 100;
    
    // Calculate tax (8% for demo)
    cart.tax = Math.round(cart.subtotal * 0.08 * 100) / 100;
    
    // Calculate shipping
    cart.shipping = cart.subtotal >= 50 ? 0 : 9.99; // Free shipping over $50
    
    // Calculate total
    cart.total = Math.round((cart.subtotal + cart.tax + cart.shipping) * 100) / 100;
    
    cart.updatedAt = new Date();
  }

  // Save cart to database
  saveCart(cart) {
    this.db.updateById('carts', cart.id, cart);
    this.carts.set(cart.sessionId, cart); // Update cache
  }

  // Get cart summary for chat responses
  getCartSummary(sessionId) {
    const cart = this.getCart(sessionId);
    
    if (cart.items.length === 0) {
      return "🛒 Your cart is empty. Browse our products and add items to get started!";
    }

    let summary = `🛒 **Your Cart (${cart.itemCount} items)**\n\n`;
    
    cart.items.forEach(item => {
      summary += `• **${item.name}** - Qty: ${item.quantity} - $${item.subtotal.toFixed(2)}\n`;
    });
    
    summary += `\n💰 **Cart Total**\n`;
    summary += `• Subtotal: $${cart.subtotal.toFixed(2)}\n`;
    summary += `• Tax: $${cart.tax.toFixed(2)}\n`;
    summary += `• Shipping: ${cart.shipping === 0 ? 'FREE' : '$' + cart.shipping.toFixed(2)}\n`;
    summary += `• **Total: $${cart.total.toFixed(2)}**\n\n`;
    
    if (cart.shipping > 0) {
      const remaining = 50 - cart.subtotal;
      summary += `💡 Add $${remaining.toFixed(2)} more for FREE shipping!`;
    }
    
    return summary;
  }

  // Process checkout (simplified for MVP)
  processCheckout(sessionId, customerInfo = {}) {
    const cart = this.getCart(sessionId);
    
    if (cart.items.length === 0) {
      return {
        success: false,
        error: 'Cart is empty'
      };
    }

    // Create order
    const order = {
      sessionId,
      customerId: customerInfo.id || null,
      customerEmail: customerInfo.email || 'guest@example.com',
      items: [...cart.items],
      subtotal: cart.subtotal,
      tax: cart.tax,
      shipping: cart.shipping,
      total: cart.total,
      status: 'pending',
      orderNumber: this.generateOrderNumber(),
      placedAt: new Date()
    };

    // Save order
    const savedOrder = this.db.insert('orders', order);

    if (savedOrder) {
      // Clear cart after successful order
      this.clearCart(sessionId);
      
      return {
        success: true,
        order: savedOrder,
        message: `Order #${savedOrder.orderNumber} placed successfully! Total: $${savedOrder.total.toFixed(2)}`
      };
    }

    return {
      success: false,
      error: 'Failed to process order'
    };
  }

  // Generate order number
  generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  // Get order by order number
  getOrder(orderNumber) {
    return this.db.findOne('orders', { orderNumber });
  }

  // Get orders for session
  getOrderHistory(sessionId) {
    return this.db.find('orders', { sessionId });
  }

  // Clean up old carts (call periodically)
  cleanupOldCarts() {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    // Remove from database
    const oldCarts = this.db.find('carts', {});
    let cleanedCount = 0;
    
    oldCarts.forEach(cart => {
      const updatedAt = new Date(cart.updatedAt);
      if (updatedAt < cutoffDate) {
        this.db.deleteById('carts', cart.id);
        this.carts.delete(cart.sessionId);
        cleanedCount++;
      }
    });
    
    console.log(`Cleaned up ${cleanedCount} old carts`);
    return cleanedCount;
  }

  // Get cart statistics
  getStats() {
    const allCarts = this.db.find('carts', {});
    const allOrders = this.db.find('orders', {});
    
    const activeCarts = allCarts.filter(cart => cart.items.length > 0);
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
    
    return {
      totalCarts: allCarts.length,
      activeCarts: activeCarts.length,
      totalOrders: allOrders.length,
      totalRevenue: totalRevenue.toFixed(2),
      averageOrderValue: allOrders.length > 0 ? (totalRevenue / allOrders.length).toFixed(2) : 0
    };
  }
}

module.exports = CartService;
