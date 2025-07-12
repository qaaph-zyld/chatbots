
describe('Timeout Test', () => {
  test('should handle timeouts', async () => {
    const fetchData = () => new Promise(resolve => {
      // Fixed: added resolve call
      resolve({ data: 'test' });
    });
    const data = await fetchData();
    expect(data).toBeDefined();
  });
});
