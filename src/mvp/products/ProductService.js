/**
 * Product Service - MVP Implementation
 * Manages product catalog and search functionality
 */

class ProductService {
  constructor() {
    this.products = this.initializeProducts();
  }

  // Initialize sample product catalog
  initializeProducts() {
    return [
      // Laptops
      {
        id: 'laptop-001',
        name: 'Dell XPS 13',
        category: 'Electronics',
        subcategory: 'Laptops',
        price: 999.99,
        originalPrice: 1199.99,
        description: 'Ultra-portable laptop with 13.3" display, Intel Core i7, 16GB RAM, 512GB SSD',
        image: '/images/dell-xps-13.jpg',
        inStock: true,
        rating: 4.5,
        reviews: 1247,
        features: ['Intel Core i7', '16GB RAM', '512GB SSD', '13.3" Display'],
        tags: ['laptop', 'ultrabook', 'work', 'portable']
      },
      {
        id: 'laptop-002',
        name: 'MacBook Air M2',
        category: 'Electronics',
        subcategory: 'Laptops',
        price: 1199.99,
        description: 'Apple MacBook Air with M2 chip, 13.6" display, 8GB RAM, 256GB SSD',
        image: '/images/macbook-air-m2.jpg',
        inStock: true,
        rating: 4.8,
        reviews: 892,
        features: ['Apple M2 Chip', '8GB RAM', '256GB SSD', '13.6" Liquid Retina Display'],
        tags: ['macbook', 'apple', 'laptop', 'creative']
      },
      {
        id: 'laptop-003',
        name: 'ASUS ROG Gaming Laptop',
        category: 'Electronics',
        subcategory: 'Laptops',
        price: 1499.99,
        originalPrice: 1799.99,
        description: 'Gaming laptop with RTX 4060, AMD Ryzen 7, 16GB RAM, 1TB SSD',
        image: '/images/asus-rog-gaming.jpg',
        inStock: true,
        rating: 4.6,
        reviews: 634,
        features: ['RTX 4060', 'AMD Ryzen 7', '16GB RAM', '1TB SSD', '15.6" 144Hz Display'],
        tags: ['gaming', 'laptop', 'rtx', 'high-performance']
      },

      // Smartphones
      {
        id: 'phone-001',
        name: 'iPhone 15 Pro',
        category: 'Electronics',
        subcategory: 'Smartphones',
        price: 999.99,
        description: 'Latest iPhone with A17 Pro chip, 48MP camera system, titanium design',
        image: '/images/iphone-15-pro.jpg',
        inStock: true,
        rating: 4.7,
        reviews: 2156,
        features: ['A17 Pro Chip', '48MP Camera', 'Titanium Design', '6.1" Display'],
        tags: ['iphone', 'apple', 'smartphone', 'premium']
      },
      {
        id: 'phone-002',
        name: 'Samsung Galaxy S24',
        category: 'Electronics',
        subcategory: 'Smartphones',
        price: 799.99,
        originalPrice: 899.99,
        description: 'Samsung flagship with AI features, 50MP camera, 8GB RAM',
        image: '/images/samsung-s24.jpg',
        inStock: true,
        rating: 4.5,
        reviews: 1543,
        features: ['AI Features', '50MP Camera', '8GB RAM', '6.2" Dynamic AMOLED'],
        tags: ['samsung', 'android', 'smartphone', 'ai']
      },
      {
        id: 'phone-003',
        name: 'Google Pixel 8',
        category: 'Electronics',
        subcategory: 'Smartphones',
        price: 699.99,
        description: 'Google Pixel with Tensor G3 chip, advanced AI photography',
        image: '/images/google-pixel-8.jpg',
        inStock: true,
        rating: 4.4,
        reviews: 876,
        features: ['Tensor G3', 'AI Photography', '8GB RAM', '6.2" Display'],
        tags: ['google', 'pixel', 'android', 'photography']
      },

      // Audio Devices
      {
        id: 'audio-001',
        name: 'Sony WH-1000XM5',
        category: 'Electronics',
        subcategory: 'Audio',
        price: 349.99,
        originalPrice: 399.99,
        description: 'Premium noise-canceling headphones with 30-hour battery',
        image: '/images/sony-wh1000xm5.jpg',
        inStock: true,
        rating: 4.6,
        reviews: 1892,
        features: ['Noise Canceling', '30-hour Battery', 'Hi-Res Audio', 'Touch Controls'],
        tags: ['headphones', 'sony', 'noise-canceling', 'wireless']
      },
      {
        id: 'audio-002',
        name: 'Apple AirPods Pro',
        category: 'Electronics',
        subcategory: 'Audio',
        price: 249.99,
        description: 'Apple AirPods Pro with active noise cancellation and spatial audio',
        image: '/images/airpods-pro.jpg',
        inStock: true,
        rating: 4.5,
        reviews: 3421,
        features: ['Active Noise Cancellation', 'Spatial Audio', 'MagSafe Charging', 'Sweat Resistant'],
        tags: ['airpods', 'apple', 'earbuds', 'wireless']
      },

      // Home & Garden
      {
        id: 'home-001',
        name: 'Smart Coffee Maker',
        category: 'Home & Garden',
        subcategory: 'Kitchen Appliances',
        price: 199.99,
        originalPrice: 249.99,
        description: 'WiFi-enabled coffee maker with app control and scheduling',
        image: '/images/smart-coffee-maker.jpg',
        inStock: true,
        rating: 4.3,
        reviews: 567,
        features: ['WiFi Enabled', 'App Control', 'Programmable', '12-Cup Capacity'],
        tags: ['coffee', 'smart-home', 'kitchen', 'appliance']
      }
    ];
  }

  // Get all products (simple method)
  getAllProducts() {
    return this.products;
  }

  // Get all products with optional filtering
  getProducts(req, res) {
    const url = require('url');
    const query = url.parse(req.url, true).query;
    
    let filteredProducts = [...this.products];

    // Filter by category
    if (query.category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category.toLowerCase() === query.category.toLowerCase()
      );
    }

    // Filter by subcategory
    if (query.subcategory) {
      filteredProducts = filteredProducts.filter(p => 
        p.subcategory.toLowerCase() === query.subcategory.toLowerCase()
      );
    }

    // Search by name or tags
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by price range
    if (query.minPrice) {
      filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(query.minPrice));
    }
    if (query.maxPrice) {
      filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(query.maxPrice));
    }

    // Sort products
    if (query.sort) {
      switch (query.sort) {
        case 'price-low':
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          filteredProducts.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filteredProducts.sort((a, b) => b.rating - a.rating);
          break;
        case 'reviews':
          filteredProducts.sort((a, b) => b.reviews - a.reviews);
          break;
        default:
          // Default sort by name
          filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    // Pagination
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          page,
          limit,
          total: filteredProducts.length,
          pages: Math.ceil(filteredProducts.length / limit)
        },
        filters: {
          category: query.category || null,
          subcategory: query.subcategory || null,
          search: query.search || null,
          minPrice: query.minPrice || null,
          maxPrice: query.maxPrice || null,
          sort: query.sort || null
        }
      }
    }));
  }

  // Get single product by ID
  getProduct(req, res, productId) {
    const product = this.products.find(p => p.id === productId);
    
    if (!product) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Product not found'
      }));
      return;
    }

    // Get related products (same category, different product)
    const relatedProducts = this.products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        product,
        relatedProducts
      }
    }));
  }

  // Search products (for chat integration)
  searchProducts(query, limit = 5) {
    const searchTerm = query.toLowerCase();
    return this.products
      .filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
      .slice(0, limit);
  }

  // Get products by category (for chat integration)
  getProductsByCategory(category, limit = 5) {
    return this.products
      .filter(p => p.category.toLowerCase() === category.toLowerCase())
      .slice(0, limit);
  }

  // Get featured/popular products
  getFeaturedProducts(limit = 6) {
    return this.products
      .sort((a, b) => b.rating * b.reviews - a.rating * a.reviews)
      .slice(0, limit);
  }

  // Get products on sale
  getSaleProducts() {
    return this.products.filter(p => p.originalPrice && p.originalPrice > p.price);
  }

  // Get product by ID
  getProductById(productId) {
    return this.products.find(p => p.id === productId);
  }

  // Get categories
  getCategories() {
    const categories = [...new Set(this.products.map(p => p.category))];
    return categories.map(category => ({
      name: category,
      count: this.products.filter(p => p.category === category).length,
      subcategories: [...new Set(
        this.products
          .filter(p => p.category === category)
          .map(p => p.subcategory)
      )]
    }));
  }
}

module.exports = ProductService;
