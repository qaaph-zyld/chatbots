// Basic test to verify Jest functionality

describe('Basic Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle simple string matching', () => {
    const str = 'hello';
    expect(str).toBe('hello');
    expect(str).toHaveLength(5);
  });
});
