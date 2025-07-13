// Test using Node.js built-in test runner
const test = require('node:test');
const assert = require('node:assert');

test('minimal passing test', (t) => {
  console.log('Node.js test is running');
  assert.strictEqual(1 + 1, 2);
});
