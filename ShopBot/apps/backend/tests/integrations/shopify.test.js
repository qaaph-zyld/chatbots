const ShopifyIntegration = require('../../integrations/shopify');
const axios = require('axios');

// Mock axios for testing
jest.mock('axios');
const mockedAxios = axios;

describe('Shopify Integration Tests', () => {
  let shopifyIntegration;
  const mockConfig = {
    shop_domain: 'test-shop.myshopify.com',
    api_key: 'test_api_key',
    api_secret: 'test_api_secret',
    access_token: 'test_access_token'
  };

  beforeEach(() => {
    shopifyIntegration = new ShopifyIntegration(mockConfig);
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with correct configuration', () => {
      expect(shopifyIntegration.shopDomain).toBe(mockConfig.shop_domain);
      expect(shopifyIntegration.accessToken).toBe(mockConfig.access_token);
      expect(shopifyIntegration.baseUrl).toBe('https://test-shop.myshopify.com/admin/api/2023-10');
    });
  });

  describe('getOrder', () => {
    test('should fetch order by ID', async () => {
      const mockOrder = {
        id: 123,
        name: '#1001',
        financial_status: 'paid',
        fulfillment_status: 'fulfilled',
        total_price: '99.99',
        currency: 'USD',
        email: 'customer@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        line_items: [
          {
            id: 1,
            title: 'Test Product',
            quantity: 1,
            price: '99.99'
          }
        ],
        billing_address: {
          first_name: 'John',
          last_name: 'Doe'
        }
      };

      mockedAxios.get.mockResolvedValue({ data: { order: mockOrder } });

      const result = await shopifyIntegration.getOrder(123);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test-shop.myshopify.com/admin/api/2023-10/orders/123.json',
        { headers: { 'X-Shopify-Access-Token': 'test_access_token', 'Content-Type': 'application/json' } }
      );

      expect(result).toEqual({
        id: 123,
        order_number: '#1001',
        status: 'paid',
        fulfillment_status: 'fulfilled',
        total_price: '99.99',
        currency: 'USD',
        customer: {
          email: 'customer@example.com',
          name: 'John Doe'
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        line_items: [
          {
            id: 1,
            title: 'Test Product',
            quantity: 1,
            price: '99.99'
          }
        ],
        shipping_address: undefined,
        tracking_numbers: []
      });
    });

    test('should fetch order by order number', async () => {
      const mockOrder = {
        id: 123,
        name: '#1001',
        financial_status: 'paid'
      };

      mockedAxios.get.mockResolvedValue({ data: { orders: [mockOrder] } });

      await shopifyIntegration.getOrder('#1001');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test-shop.myshopify.com/admin/api/2023-10/orders.json?name=#1001',
        { headers: { 'X-Shopify-Access-Token': 'test_access_token', 'Content-Type': 'application/json' } }
      );
    });

    test('should return null when order not found', async () => {
      mockedAxios.get.mockResolvedValue({ data: { orders: [] } });

      const result = await shopifyIntegration.getOrder(999);
      expect(result).toBeNull();
    });

    test('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(shopifyIntegration.getOrder(123)).rejects.toThrow('Failed to fetch order: API Error');
    });
  });

  describe('getCustomer', () => {
    test('should fetch customer by email', async () => {
      const mockCustomer = {
        id: 456,
        email: 'customer@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        total_spent: '199.98',
        orders_count: 2,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockedAxios.get.mockResolvedValue({ data: { customers: [mockCustomer] } });

      const result = await shopifyIntegration.getCustomer('customer@example.com');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test-shop.myshopify.com/admin/api/2023-10/customers/search.json?query=email:customer@example.com',
        { headers: { 'X-Shopify-Access-Token': 'test_access_token', 'Content-Type': 'application/json' } }
      );

      expect(result).toEqual({
        id: 456,
        email: 'customer@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        total_spent: '199.98',
        orders_count: 2,
        created_at: '2024-01-01T00:00:00Z',
        addresses: []
      });
    });
  });

  describe('testConnection', () => {
    test('should return success when connection is valid', async () => {
      const mockShop = {
        id: 1,
        name: 'Test Shop',
        domain: 'test-shop.myshopify.com'
      };

      mockedAxios.get.mockResolvedValue({ data: { shop: mockShop } });

      const result = await shopifyIntegration.testConnection();

      expect(result).toEqual({
        success: true,
        shop: mockShop
      });
    });

    test('should return error when connection fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Unauthorized'));

      const result = await shopifyIntegration.testConnection();

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized'
      });
    });
  });

  describe('searchProducts', () => {
    test('should search products by title', async () => {
      const mockProducts = [
        {
          id: 1,
          title: 'Test Product',
          body_html: '<p>Description</p>',
          vendor: 'Test Vendor',
          product_type: 'Test Type',
          handle: 'test-product',
          status: 'active',
          variants: [
            {
              id: 1,
              title: 'Default Title',
              price: '99.99',
              inventory_quantity: 10
            }
          ],
          images: [
            { src: 'https://example.com/image.jpg' }
          ]
        }
      ];

      mockedAxios.get.mockResolvedValue({ data: { products: mockProducts } });

      const result = await shopifyIntegration.searchProducts('test', 5);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test-shop.myshopify.com/admin/api/2023-10/products.json?title=test&limit=5',
        { headers: { 'X-Shopify-Access-Token': 'test_access_token', 'Content-Type': 'application/json' } }
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        title: 'Test Product',
        description: '<p>Description</p>',
        vendor: 'Test Vendor',
        product_type: 'Test Type',
        handle: 'test-product',
        status: 'active',
        variants: [
          {
            id: 1,
            title: 'Default Title',
            price: '99.99',
            inventory_quantity: 10,
            available: true
          }
        ],
        images: ['https://example.com/image.jpg']
      });
    });
  });
});
