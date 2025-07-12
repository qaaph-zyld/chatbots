
describe('Timeout Test', () => {
  test('should handle timeouts', async () => {
    const fetchData = () => new Promise(resolve => {
      // Never resolves, causing timeout
    });
    const data = await fetchData();
    expect(data).toBeDefined();
  });
});
