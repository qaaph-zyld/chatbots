// Simple test to verify Jest is working
describe('Basic ShopBot Tests', () => {
  test('should pass basic arithmetic test', () => {
    expect(2 + 2).toBe(4);
  });

  test('should verify environment setup', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });

  test('should test basic string operations', () => {
    const testString = 'ShopBot MVP';
    expect(testString).toContain('ShopBot');
    expect(testString.length).toBeGreaterThan(0);
  });
});
