/**
 * Cart Service Tests
 */

const CartService = require('../../src/mvp/cart/CartService');
const fs = require('fs');

describe('Cart Service', () => {
  let cartService;
  const testDataDir = './test-cart-data';

  beforeEach(() => {
    // Clean up test data directory
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true });
    }
    cartService = new CartService();
    cartService.db.dataDir = testDataDir;
    cartService.db.ensureDataDirectory();
  });

  afterEach(async () => {
    // Clean up test data directory with retry logic
    if (fs.existsSync(testDataDir)) {
      try {
        // Wait a bit to ensure file handles are released
        await new Promise(resolve => setTimeout(resolve, 100));
        fs.rmSync(testDataDir, { recursive: true, force: true });
      } catch (error) {
        // If cleanup fails, try again after a longer wait
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          fs.rmSync(testDataDir, { recursive: true, force: true });
        } catch (retryError) {
          console.warn('Could not clean up test directory:', retryError.message);
        }
      }
    }
  });

  const sampleProduct = {
    id: 'laptop-001',
    name: 'Dell XPS 13',
    price: 999.99,
    image: '/images/dell-xps-13.jpg'
  };

  test('creates new cart for session', () => {
    const cart = cartService.getCart('test-session');
    
    expect(cart).toBeDefined();
    expect(cart.sessionId).toBe('test-session');
    expect(cart.items).toEqual([]);
    expect(cart.total).toBe(0);
    expect(cart.itemCount).toBe(0);
    expect(cart.status).toBe('active');
  });

  test('retrieves existing cart for session', () => {
    const cart1 = cartService.getCart('test-session');
    const cart2 = cartService.getCart('test-session');
    
    expect(cart1.id).toBe(cart2.id);
    expect(cart1.sessionId).toBe(cart2.sessionId);
  });

  test('adds item to cart', () => {
    const cart = cartService.addItem('test-session', sampleProduct, 2);
    
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe(sampleProduct.id);
    expect(cart.items[0].name).toBe(sampleProduct.name);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.items[0].subtotal).toBe(1999.98);
    expect(cart.itemCount).toBe(2);
  });

  test('updates quantity when adding existing item', () => {
    cartService.addItem('test-session', sampleProduct, 1);
    const cart = cartService.addItem('test-session', sampleProduct, 2);
    
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.items[0].subtotal).toBeCloseTo(2999.97, 2);
    expect(cart.itemCount).toBe(3);
  });

  test('removes item from cart', () => {
    cartService.addItem('test-session', sampleProduct, 1);
    const cart = cartService.removeItem('test-session', sampleProduct.id);
    
    expect(cart.items).toHaveLength(0);
    expect(cart.itemCount).toBe(0);
    expect(cart.subtotal).toBe(0);
  });

  test('updates item quantity', () => {
    cartService.addItem('test-session', sampleProduct, 2);
    const cart = cartService.updateQuantity('test-session', sampleProduct.id, 5);
    
    expect(cart.items[0].quantity).toBe(5);
    expect(cart.items[0].subtotal).toBeCloseTo(4999.95, 2);
    expect(cart.itemCount).toBe(5);
  });

  test('removes item when quantity set to zero', () => {
    cartService.addItem('test-session', sampleProduct, 2);
    const cart = cartService.updateQuantity('test-session', sampleProduct.id, 0);
    
    expect(cart.items).toHaveLength(0);
    expect(cart.itemCount).toBe(0);
  });

  test('clears cart', () => {
    cartService.addItem('test-session', sampleProduct, 2);
    const cart = cartService.clearCart('test-session');
    
    expect(cart.items).toHaveLength(0);
    expect(cart.itemCount).toBe(0);
    expect(cart.total).toBe(0);
  });

  test('calculates totals correctly', () => {
    const cart = cartService.addItem('test-session', sampleProduct, 1);
    
    expect(cart.subtotal).toBe(999.99);
    expect(cart.tax).toBe(80.00); // 8% of 999.99, rounded
    expect(cart.shipping).toBe(0); // Free shipping over $50
    expect(cart.total).toBe(1079.99);
  });

  test('calculates shipping for orders under $50', () => {
    const cheapProduct = { ...sampleProduct, price: 25.00 };
    const cart = cartService.addItem('test-session', cheapProduct, 1);
    
    expect(cart.subtotal).toBe(25.00);
    expect(cart.tax).toBe(2.00); // 8% of 25.00
    expect(cart.shipping).toBe(9.99);
    expect(cart.total).toBe(36.99);
  });

  test('generates cart summary for empty cart', () => {
    const summary = cartService.getCartSummary('test-session');
    
    expect(summary).toContain('Your cart is empty');
    expect(summary).toContain('Browse our products');
  });

  test('generates cart summary with items', () => {
    cartService.addItem('test-session', sampleProduct, 2);
    const summary = cartService.getCartSummary('test-session');
    
    expect(summary).toContain('Your Cart (2 items)');
    expect(summary).toContain('Dell XPS 13');
    expect(summary).toContain('Qty: 2');
    expect(summary).toContain('$1999.98');
    expect(summary).toContain('Total: $');
  });

  test('shows free shipping message in summary', () => {
    const cheapProduct = { ...sampleProduct, price: 30.00 };
    cartService.addItem('test-session', cheapProduct, 1);
    const summary = cartService.getCartSummary('test-session');
    
    expect(summary).toContain('Add $20.00 more for FREE shipping');
  });

  test('processes checkout successfully', () => {
    cartService.addItem('test-session', sampleProduct, 1);
    
    const result = cartService.processCheckout('test-session', {
      email: 'test@example.com'
    });
    
    expect(result.success).toBe(true);
    expect(result.order).toBeDefined();
    expect(result.order.orderNumber).toMatch(/^ORD-\d+-[A-Z0-9]+$/);
    expect(result.order.total).toBe(1079.99);
    expect(result.message).toContain('Order #');
    
    // Cart should be cleared after checkout
    const cart = cartService.getCart('test-session');
    expect(cart.items).toHaveLength(0);
  });

  test('fails checkout with empty cart', () => {
    const result = cartService.processCheckout('test-session');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Cart is empty');
  });

  test('generates unique order numbers', () => {
    const orderNumber1 = cartService.generateOrderNumber();
    const orderNumber2 = cartService.generateOrderNumber();
    
    expect(orderNumber1).toMatch(/^ORD-\d+-[A-Z0-9]+$/);
    expect(orderNumber2).toMatch(/^ORD-\d+-[A-Z0-9]+$/);
    expect(orderNumber1).not.toBe(orderNumber2);
  });

  test('retrieves order by order number', () => {
    cartService.addItem('test-session', sampleProduct, 1);
    const checkoutResult = cartService.processCheckout('test-session');
    
    const order = cartService.getOrder(checkoutResult.order.orderNumber);
    
    expect(order).toBeDefined();
    expect(order.orderNumber).toBe(checkoutResult.order.orderNumber);
    expect(order.total).toBe(1079.99);
  });

  test('gets order history for session', () => {
    cartService.addItem('test-session', sampleProduct, 1);
    cartService.processCheckout('test-session');
    
    cartService.addItem('test-session', sampleProduct, 2);
    cartService.processCheckout('test-session');
    
    const history = cartService.getOrderHistory('test-session');
    
    expect(history).toHaveLength(2);
    expect(history[0].sessionId).toBe('test-session');
    expect(history[1].sessionId).toBe('test-session');
  });

  test('gets cart statistics', () => {
    // Create some test data
    cartService.addItem('session1', sampleProduct, 1);
    cartService.addItem('session2', sampleProduct, 2);
    cartService.processCheckout('session1');
    
    const stats = cartService.getStats();
    
    expect(stats.totalCarts).toBeGreaterThanOrEqual(2);
    expect(stats.activeCarts).toBeGreaterThanOrEqual(1);
    expect(stats.totalOrders).toBe(1);
    expect(parseFloat(stats.totalRevenue)).toBeGreaterThan(0);
  });

  test('handles multiple products in cart', () => {
    const product2 = {
      id: 'phone-001',
      name: 'iPhone 15 Pro',
      price: 999.99,
      image: '/images/iphone-15-pro.jpg'
    };
    
    cartService.addItem('test-session', sampleProduct, 1);
    cartService.addItem('test-session', product2, 2);
    
    const cart = cartService.getCart('test-session');
    
    expect(cart.items).toHaveLength(2);
    expect(cart.itemCount).toBe(3);
    expect(cart.subtotal).toBe(2999.97); // 999.99 + (999.99 * 2)
  });
});
