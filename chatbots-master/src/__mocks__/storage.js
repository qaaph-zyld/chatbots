// Mock implementation of the storage module
export const localStorageService = {
  initialize: jest.fn().mockResolvedValue(true),
  storeFile: jest.fn().mockResolvedValue({ path: '/mock/path/file.json' }),
  retrieveFile: jest.fn().mockResolvedValue({ data: 'mocked data' }),
  deleteFile: jest.fn().mockResolvedValue(true)
};

export default {
  localStorageService
};
