// Mock implementation of the scaling/cluster module
export default {
  scaleUp: jest.fn().mockResolvedValue(true),
  scaleDown: jest.fn().mockResolvedValue(true),
  getStatus: jest.fn().mockResolvedValue({ status: 'ready' })
};
