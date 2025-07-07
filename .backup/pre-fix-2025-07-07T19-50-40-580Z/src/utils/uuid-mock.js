/**
 * UUID Mock Module
 * 
 * This is a simple mock implementation of the uuid module
 * for testing purposes when the actual uuid module is not available.
 */

/**
 * Generate a mock UUID v4
 * @returns {string} A mock UUID
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = {
  v4: uuidv4
};
