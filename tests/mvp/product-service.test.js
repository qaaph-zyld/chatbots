/**
 * Product Service Tests
 */

const ProductService = require('../../src/mvp/products/ProductService');

describe('Product Service', () => {
  let productService;

  beforeEach(() => {
    productService = new ProductService();
  });

  test('initializes with sample products', () => {
    expect(productService.products).toBeDefined();
    expect(productService.products.length).toBeGreaterThan(0);
    
    // Check for expected product categories
    const categories = [...new Set(productService.products.map(p => p.category))];
    expect(categories).toContain('Electronics');
    expect(categories).toContain('Home & Garden');
  });

  test('searches products by name', () => {
    const results = productService.searchProducts('dell');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('Dell');
  });

  test('searches products by tags', () => {
    const results = productService.searchProducts('gaming');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(p => p.tags.includes('gaming'))).toBe(true);
  });

  test('gets products by category', () => {
    const electronics = productService.getProductsByCategory('Electronics');
    
    expect(electronics.length).toBeGreaterThan(0);
    expect(electronics.every(p => p.category === 'Electronics')).toBe(true);
  });

  test('gets featured products sorted by popularity', () => {
    const featured = productService.getFeaturedProducts(3);
    
    expect(featured.length).toBeLessThanOrEqual(3);
    expect(featured.length).toBeGreaterThan(0);
    
    // Should be sorted by rating * reviews (popularity)
    for (let i = 1; i < featured.length; i++) {
      const current = featured[i].rating * featured[i].reviews;
      const previous = featured[i-1].rating * featured[i-1].reviews;
      expect(current).toBeLessThanOrEqual(previous);
    }
  });

  test('gets products on sale', () => {
    const saleProducts = productService.getSaleProducts();
    
    expect(saleProducts.length).toBeGreaterThan(0);
    expect(saleProducts.every(p => p.originalPrice && p.originalPrice > p.price)).toBe(true);
  });

  test('gets categories with counts and subcategories', () => {
    const categories = productService.getCategories();
    
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]).toHaveProperty('name');
    expect(categories[0]).toHaveProperty('count');
    expect(categories[0]).toHaveProperty('subcategories');
    expect(Array.isArray(categories[0].subcategories)).toBe(true);
  });

  test('handles getProducts request with no filters', () => {
    const mockReq = { url: '/api/products' };
    const mockRes = {
      writeHead: jest.fn(),
      end: jest.fn()
    };

    productService.getProducts(mockReq, mockRes);

    expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
    expect(mockRes.end).toHaveBeenCalled();
    
    const responseData = JSON.parse(mockRes.end.mock.calls[0][0]);
    expect(responseData.success).toBe(true);
    expect(Array.isArray(responseData.data.products)).toBe(true);
    expect(responseData.data.pagination).toBeDefined();
  });

  test('handles getProducts request with category filter', () => {
    const mockReq = { url: '/api/products?category=Electronics' };
    const mockRes = {
      writeHead: jest.fn(),
      end: jest.fn()
    };

    productService.getProducts(mockReq, mockRes);

    const responseData = JSON.parse(mockRes.end.mock.calls[0][0]);
    expect(responseData.success).toBe(true);
    expect(responseData.data.products.every(p => p.category === 'Electronics')).toBe(true);
    expect(responseData.data.filters.category).toBe('Electronics');
  });

  test('handles getProducts request with search filter', () => {
    const mockReq = { url: '/api/products?search=laptop' };
    const mockRes = {
      writeHead: jest.fn(),
      end: jest.fn()
    };

    productService.getProducts(mockReq, mockRes);

    const responseData = JSON.parse(mockRes.end.mock.calls[0][0]);
    expect(responseData.success).toBe(true);
    expect(responseData.data.products.length).toBeGreaterThan(0);
    expect(responseData.data.filters.search).toBe('laptop');
  });

  test('handles getProducts request with price range filter', () => {
    const mockReq = { url: '/api/products?minPrice=500&maxPrice=1000' };
    const mockRes = {
      writeHead: jest.fn(),
      end: jest.fn()
    };

    productService.getProducts(mockReq, mockRes);

    const responseData = JSON.parse(mockRes.end.mock.calls[0][0]);
    expect(responseData.success).toBe(true);
    expect(responseData.data.products.every(p => p.price >= 500 && p.price <= 1000)).toBe(true);
  });

  test('handles getProducts request with sorting', () => {
    const mockReq = { url: '/api/products?sort=price-low' };
    const mockRes = {
      writeHead: jest.fn(),
      end: jest.fn()
    };

    productService.getProducts(mockReq, mockRes);

    const responseData = JSON.parse(mockRes.end.mock.calls[0][0]);
    expect(responseData.success).toBe(true);
    
    const products = responseData.data.products;
    for (let i = 1; i < products.length; i++) {
      expect(products[i].price).toBeGreaterThanOrEqual(products[i-1].price);
    }
  });

  test('handles getProducts request with pagination', () => {
    const mockReq = { url: '/api/products?page=1&limit=3' };
    const mockRes = {
      writeHead: jest.fn(),
      end: jest.fn()
    };

    productService.getProducts(mockReq, mockRes);

    const responseData = JSON.parse(mockRes.end.mock.calls[0][0]);
    expect(responseData.success).toBe(true);
    expect(responseData.data.products.length).toBeLessThanOrEqual(3);
    expect(responseData.data.pagination.page).toBe(1);
    expect(responseData.data.pagination.limit).toBe(3);
  });

  test('handles getProduct request for existing product', () => {
    const mockReq = {};
    const mockRes = {
      writeHead: jest.fn(),
      end: jest.fn()
    };

    productService.getProduct(mockReq, mockRes, 'laptop-001');

    expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
    
    const responseData = JSON.parse(mockRes.end.mock.calls[0][0]);
    expect(responseData.success).toBe(true);
    expect(responseData.data.product.id).toBe('laptop-001');
    expect(Array.isArray(responseData.data.relatedProducts)).toBe(true);
  });

  test('handles getProduct request for non-existent product', () => {
    const mockReq = {};
    const mockRes = {
      writeHead: jest.fn(),
      end: jest.fn()
    };

    productService.getProduct(mockReq, mockRes, 'non-existent');

    expect(mockRes.writeHead).toHaveBeenCalledWith(404, { 'Content-Type': 'application/json' });
    
    const responseData = JSON.parse(mockRes.end.mock.calls[0][0]);
    expect(responseData.success).toBe(false);
    expect(responseData.error).toBe('Product not found');
  });

  test('product data structure is valid', () => {
    const product = productService.products[0];
    
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('category');
    expect(product).toHaveProperty('subcategory');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('description');
    expect(product).toHaveProperty('inStock');
    expect(product).toHaveProperty('rating');
    expect(product).toHaveProperty('reviews');
    expect(product).toHaveProperty('features');
    expect(product).toHaveProperty('tags');
    
    expect(typeof product.price).toBe('number');
    expect(typeof product.rating).toBe('number');
    expect(typeof product.reviews).toBe('number');
    expect(Array.isArray(product.features)).toBe(true);
    expect(Array.isArray(product.tags)).toBe(true);
  });
});
