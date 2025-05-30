/**
 * Database Connection Mock
 * 
 * This mock simulates the database connection for unit tests
 */

const connectDB = jest.fn().mockResolvedValue(true);

module.exports = {
  connectDB
};
