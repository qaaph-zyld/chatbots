/**
 * Storage Service Tests
 */

const path = require('path');
const fs = require('fs').promises;
require('@src/storage\storage.service');
require('@src/utils');

// Mock dependencies
jest.mock('../../../utils', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock fs.promises
jest.mock('fs', () => {
  const originalModule = jest.requireActual('fs');
  return {
    ...originalModule,
    promises: {
      access: jest.fn(),
      mkdir: jest.fn(),
      writeFile: jest.fn(),
      readFile: jest.fn(),
      readdir: jest.fn(),
      unlink: jest.fn(),
      stat: jest.fn()
    }
  };
});

describe('Storage Service', () => {
  let storageService;
  const testBaseDir = '/test/storage';
  const testTempDir = '/test/storage/temp';
  const testDataDir = '/test/storage/data';
  const testCacheDir = '/test/storage/cache';
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new storage service instance for each test
    storageService = new StorageService({
      baseDir: testBaseDir,
      tempDir: testTempDir,
      dataDir: testDataDir,
      cacheDir: testCacheDir
    });
    
    // Mock successful directory access by default
    fs.access.mockResolvedValue(undefined);
    
    // Mock successful file operations by default
    fs.writeFile.mockResolvedValue(undefined);
    fs.readFile.mockResolvedValue(Buffer.from('test file content'));
    fs.readdir.mockResolvedValue(['file1.txt', 'file2.jpg']);
    fs.unlink.mockResolvedValue(undefined);
    fs.stat.mockResolvedValue({
      size: 1024,
      birthtime: new Date('2025-01-01'),
      mtime: new Date('2025-01-02')
    });
  });

  describe('initialize', () => {
    it('should create required directories if they do not exist', async () => {
      // Arrange
      fs.access.mockRejectedValue({ code: 'ENOENT' });
      
      // Act
      await storageService.initialize();
      
      // Assert
      expect(fs.mkdir).toHaveBeenCalledTimes(4);
      expect(fs.mkdir).toHaveBeenCalledWith(testBaseDir, { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith(testTempDir, { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith(testDataDir, { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith(testCacheDir, { recursive: true });
      expect(storageService.initialized).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('Storage service initialized', expect.any(Object));
    });

    it('should not create directories if they already exist', async () => {
      // Arrange
      fs.access.mockResolvedValue(undefined);
      
      // Act
      await storageService.initialize();
      
      // Assert
      expect(fs.mkdir).not.toHaveBeenCalled();
      expect(storageService.initialized).toBe(true);
    });

    it('should handle errors during initialization', async () => {
      // Arrange
      const testError = new Error('Test error');
      fs.access.mockRejectedValue(testError);
      
      // Act & Assert
      await expect(storageService.initialize()).rejects.toThrow(testError);
      expect(logger.error).toHaveBeenCalledWith('Failed to initialize storage service', expect.any(Object));
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should create directory if it does not exist', async () => {
      // Arrange
      const testDir = '/test/new-dir';
      fs.access.mockRejectedValue({ code: 'ENOENT' });
      
      // Act
      await storageService.ensureDirectoryExists(testDir);
      
      // Assert
      expect(fs.mkdir).toHaveBeenCalledWith(testDir, { recursive: true });
      expect(logger.debug).toHaveBeenCalledWith(`Created directory: ${testDir}`);
    });

    it('should not create directory if it already exists', async () => {
      // Arrange
      const testDir = '/test/existing-dir';
      fs.access.mockResolvedValue(undefined);
      
      // Act
      await storageService.ensureDirectoryExists(testDir);
      
      // Assert
      expect(fs.mkdir).not.toHaveBeenCalled();
    });

    it('should propagate non-ENOENT errors', async () => {
      // Arrange
      const testDir = '/test/error-dir';
      const testError = new Error('Permission denied');
      testError.code = 'EACCES';
      fs.access.mockRejectedValue(testError);
      
      // Act & Assert
      await expect(storageService.ensureDirectoryExists(testDir)).rejects.toThrow(testError);
      expect(fs.mkdir).not.toHaveBeenCalled();
    });
  });

  describe('storeFile', () => {
    it('should store a file and return file info', async () => {
      // Arrange
      const fileData = Buffer.from('test file content');
      const filename = 'test-file.txt';
      const options = {
        fileId: 'test-id-123',
        category: 'documents',
        metadata: { owner: 'user123' }
      };
      
      // Act
      const result = await storageService.storeFile(fileData, filename, options);
      
      // Assert
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(testDataDir, 'documents', 'test-id-123.txt'),
        fileData
      );
      expect(result).toEqual({
        id: 'test-id-123',
        originalName: filename,
        path: path.join(testDataDir, 'documents', 'test-id-123.txt'),
        category: 'documents',
        size: fileData.length,
        extension: '.txt',
        createdAt: expect.any(Date),
        metadata: { owner: 'user123' }
      });
      expect(logger.debug).toHaveBeenCalledWith('File stored', expect.any(Object));
    });

    it('should initialize if not already initialized', async () => {
      // Arrange
      const fileData = 'string data';
      const filename = 'test-file.txt';
      storageService.initialized = false;
      
      // Act
      await storageService.storeFile(fileData, filename);
      
      // Assert
      expect(storageService.initialized).toBe(true);
    });

    it('should generate a file ID if not provided', async () => {
      // Arrange
      const fileData = Buffer.from('test content');
      const filename = 'test-file.txt';
      
      // Act
      const result = await storageService.storeFile(fileData, filename);
      
      // Assert
      expect(result.id).toBeDefined();
      expect(result.id).not.toBe('');
    });

    it('should use default category if not provided', async () => {
      // Arrange
      const fileData = Buffer.from('test content');
      const filename = 'test-file.txt';
      
      // Act
      const result = await storageService.storeFile(fileData, filename);
      
      // Assert
      expect(result.category).toBe('general');
    });
  });

  describe('retrieveFile', () => {
    it('should retrieve a file by ID and return data and info', async () => {
      // Arrange
      const fileId = 'test-id-123';
      const category = 'documents';
      const fileContent = Buffer.from('test file content');
      
      fs.readdir.mockResolvedValue(['test-id-123.txt', 'other-file.pdf']);
      fs.readFile.mockResolvedValue(fileContent);
      
      // Act
      const result = await storageService.retrieveFile(fileId, category);
      
      // Assert
      expect(fs.readdir).toHaveBeenCalledWith(path.join(testDataDir, category));
      expect(fs.readFile).toHaveBeenCalledWith(path.join(testDataDir, category, 'test-id-123.txt'));
      expect(result).toEqual({
        data: fileContent,
        info: {
          id: fileId,
          originalName: 'test-id-123.txt',
          path: path.join(testDataDir, category, 'test-id-123.txt'),
          category,
          size: fileContent.length,
          extension: '.txt',
          accessedAt: expect.any(Date)
        }
      });
      expect(logger.debug).toHaveBeenCalledWith('File retrieved', expect.any(Object));
    });

    it('should throw an error if file is not found', async () => {
      // Arrange
      const fileId = 'non-existent-id';
      fs.readdir.mockResolvedValue(['other-file.txt']);
      
      // Act & Assert
      await expect(storageService.retrieveFile(fileId)).rejects.toThrow('File not found');
      expect(logger.warn).toHaveBeenCalledWith('File not found', expect.any(Object));
    });

    it('should initialize if not already initialized', async () => {
      // Arrange
      const fileId = 'test-id';
      storageService.initialized = false;
      fs.readdir.mockResolvedValue(['test-id.txt']);
      
      // Act
      await storageService.retrieveFile(fileId);
      
      // Assert
      expect(storageService.initialized).toBe(true);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file and return true', async () => {
      // Arrange
      const fileId = 'test-id-123';
      const category = 'documents';
      
      fs.readdir.mockResolvedValue(['test-id-123.txt', 'other-file.pdf']);
      
      // Act
      const result = await storageService.deleteFile(fileId, category);
      
      // Assert
      expect(fs.readdir).toHaveBeenCalledWith(path.join(testDataDir, category));
      expect(fs.unlink).toHaveBeenCalledWith(path.join(testDataDir, category, 'test-id-123.txt'));
      expect(result).toBe(true);
      expect(logger.debug).toHaveBeenCalledWith('File deleted', expect.any(Object));
    });

    it('should return false if file is not found', async () => {
      // Arrange
      const fileId = 'non-existent-id';
      fs.readdir.mockResolvedValue(['other-file.txt']);
      
      // Act
      const result = await storageService.deleteFile(fileId);
      
      // Assert
      expect(result).toBe(false);
      expect(fs.unlink).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('File not found for deletion', expect.any(Object));
    });
  });

  describe('listFiles', () => {
    it('should list files in a category with their info', async () => {
      // Arrange
      const category = 'documents';
      
      fs.readdir.mockResolvedValue(['file1.txt', 'file2.jpg']);
      fs.stat.mockImplementation((filePath) => {
        const filename = path.basename(filePath);
        return Promise.resolve({
          size: filename === 'file1.txt' ? 1024 : 2048,
          birthtime: new Date('2025-01-01'),
          mtime: new Date('2025-01-02')
        });
      });
      
      // Act
      const result = await storageService.listFiles(category);
      
      // Assert
      expect(fs.readdir).toHaveBeenCalledWith(path.join(testDataDir, category));
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'file1',
        originalName: 'file1.txt',
        path: path.join(testDataDir, category, 'file1.txt'),
        category,
        size: 1024,
        extension: '.txt',
        createdAt: expect.any(Date),
        modifiedAt: expect.any(Date)
      });
      expect(result[1].originalName).toBe('file2.jpg');
      expect(logger.debug).toHaveBeenCalledWith('Files listed', expect.any(Object));
    });

    it('should create the category directory if it does not exist', async () => {
      // Arrange
      const category = 'new-category';
      fs.access.mockRejectedValue({ code: 'ENOENT' });
      fs.readdir.mockResolvedValue([]);
      
      // Act
      await storageService.listFiles(category);
      
      // Assert
      expect(fs.mkdir).toHaveBeenCalledWith(path.join(testDataDir, category), { recursive: true });
    });

    it('should handle errors when listing files', async () => {
      // Arrange
      const testError = new Error('Read error');
      fs.readdir.mockRejectedValue(testError);
      
      // Act & Assert
      await expect(storageService.listFiles()).rejects.toThrow(testError);
      expect(logger.error).toHaveBeenCalledWith('Error listing files', expect.any(Object));
    });
  });

  describe('createTempFile', () => {
    it('should create a temporary file and return file info', async () => {
      // Arrange
      const fileData = Buffer.from('temp file content');
      const extension = 'txt';
      
      // Act
      const result = await storageService.createTempFile(fileData, extension);
      
      // Assert
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(testTempDir),
        fileData
      );
      expect(result).toEqual({
        id: expect.any(String),
        path: expect.stringContaining(testTempDir),
        size: fileData.length,
        extension,
        createdAt: expect.any(Date)
      });
      expect(logger.debug).toHaveBeenCalledWith('Temporary file created', expect.any(Object));
    });

    it('should handle string data', async () => {
      // Arrange
      const fileData = 'string content';
      
      // Act
      const result = await storageService.createTempFile(fileData);
      
      // Assert
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(testTempDir),
        fileData
      );
      expect(result.size).toBe(Buffer.from(fileData).length);
    });
  });

  describe('cleanupTempFiles', () => {
    it('should delete old temporary files', async () => {
      // Arrange
      const now = Date.now();
      const oldDate = new Date(now - 48 * 60 * 60 * 1000); // 48 hours ago
      const recentDate = new Date(now - 1 * 60 * 60 * 1000); // 1 hour ago
      
      fs.readdir.mockResolvedValue(['old-file.txt', 'recent-file.txt']);
      fs.stat.mockImplementation((filePath) => {
        const filename = path.basename(filePath);
        return Promise.resolve({
          size: 1024,
          birthtime: new Date('2025-01-01'),
          mtime: filename === 'old-file.txt' ? oldDate : recentDate
        });
      });
      
      // Act
      const result = await storageService.cleanupTempFiles(24 * 60 * 60 * 1000); // 24 hours
      
      // Assert
      expect(fs.readdir).toHaveBeenCalledWith(testTempDir);
      expect(fs.unlink).toHaveBeenCalledTimes(1);
      expect(fs.unlink).toHaveBeenCalledWith(path.join(testTempDir, 'old-file.txt'));
      expect(result).toBe(1);
      expect(logger.debug).toHaveBeenCalledWith('Temporary files cleaned up', { deletedCount: 1 });
    });

    it('should not delete recent temporary files', async () => {
      // Arrange
      const now = Date.now();
      const recentDate = new Date(now - 1 * 60 * 60 * 1000); // 1 hour ago
      
      fs.readdir.mockResolvedValue(['recent-file.txt']);
      fs.stat.mockResolvedValue({
        size: 1024,
        birthtime: new Date('2025-01-01'),
        mtime: recentDate
      });
      
      // Act
      const result = await storageService.cleanupTempFiles(24 * 60 * 60 * 1000); // 24 hours
      
      // Assert
      expect(fs.unlink).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });
});
