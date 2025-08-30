describe('Basic Tests', () => {
  test('should pass basic arithmetic test', () => {
    expect(2 + 2).toBe(4);
  });

  test('should handle string operations', () => {
    expect('hello').toBe('hello');
    expect('test'.length).toBe(4);
  });

  test('should handle array operations', () => {
    expect([1, 2, 3]).toHaveLength(3);
    expect([1, 2, 3]).toContain(2);
  });

  test('should handle object operations', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.value).toBe(42);
  });

  test('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });
});
