
describe('Syntax Error Test', () => {
  test('should handle syntax errors', () => {
    const obj = {
      name: 'test',
      value: 42
    }; // Fixed: added closing brace
    expect(obj.name).toBe('test');
  });
});
