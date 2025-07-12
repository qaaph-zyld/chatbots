
describe('Assertion Failure Test', () => {
  test('should handle assertion failures', () => {
    const sum = (a, b) => a - b; // Bug: should be a + b
    expect(sum(2, 3)).toBe(5);
  });
});
