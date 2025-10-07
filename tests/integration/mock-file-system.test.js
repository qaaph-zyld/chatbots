/**
 * Mock File System Integration Test
 */

jest.mock('fs', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/')),
  basename: jest.fn((path) => path.split('/').pop()),
  extname: jest.fn((path) => {
    const parts = path.split('.');
    return parts.length > 1 ? '.' + parts.pop() : '';
  })
}));

const fs = require('fs');
const path = require('path');

describe('Mock File System Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle file reading operations', async () => {
    const fileContent = 'test file content';
    fs.readFile.mockImplementation((filePath, encoding, callback) => {
      if (typeof encoding === 'function') {
        callback = encoding;
        encoding = 'utf8';
      }
      callback(null, fileContent);
    });

    const fileService = {
      async readFile(filePath) {
        return new Promise((resolve, reject) => {
          fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });
      }
    };

    const content = await fileService.readFile('/test/file.txt');
    expect(content).toBe(fileContent);
    expect(fs.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf8', expect.any(Function));
  });

  test('should handle file writing operations', async () => {
    fs.writeFile.mockImplementation((filePath, data, callback) => {
      callback(null);
    });

    const fileService = {
      async writeFile(filePath, data) {
        return new Promise((resolve, reject) => {
          fs.writeFile(filePath, data, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    };

    await fileService.writeFile('/test/output.txt', 'test data');
    expect(fs.writeFile).toHaveBeenCalledWith('/test/output.txt', 'test data', expect.any(Function));
  });

  test('should handle directory operations', () => {
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockReturnValue(undefined);
    fs.readdirSync.mockReturnValue(['file1.txt', 'file2.txt', 'subdir']);

    const dirService = {
      ensureDir(dirPath) {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      },
      
      listFiles(dirPath) {
        return fs.readdirSync(dirPath);
      }
    };

    dirService.ensureDir('/test/new-dir');
    expect(fs.existsSync).toHaveBeenCalledWith('/test/new-dir');
    expect(fs.mkdirSync).toHaveBeenCalledWith('/test/new-dir', { recursive: true });

    const files = dirService.listFiles('/test/existing');
    expect(files).toEqual(['file1.txt', 'file2.txt', 'subdir']);
  });

  test('should handle file metadata operations', () => {
    fs.statSync.mockReturnValue({
      isFile: () => true,
      isDirectory: () => false,
      size: 1024,
      mtime: new Date('2023-01-01'),
      ctime: new Date('2023-01-01')
    });

    const fileService = {
      getFileInfo(filePath) {
        const stats = fs.statSync(filePath);
        return {
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime,
          created: stats.ctime
        };
      }
    };

    const info = fileService.getFileInfo('/test/file.txt');
    expect(info.isFile).toBe(true);
    expect(info.size).toBe(1024);
    expect(fs.statSync).toHaveBeenCalledWith('/test/file.txt');
  });

  test('should handle path operations', () => {
    const pathService = {
      joinPaths(...parts) {
        return path.join(...parts);
      },
      
      getDirectory(filePath) {
        return path.dirname(filePath);
      },
      
      getFilename(filePath) {
        return path.basename(filePath);
      },
      
      getExtension(filePath) {
        return path.extname(filePath);
      }
    };

    expect(pathService.joinPaths('home', 'user', 'documents')).toBe('home/user/documents');
    expect(pathService.getDirectory('/home/user/file.txt')).toBe('/home/user');
    expect(pathService.getFilename('/home/user/file.txt')).toBe('file.txt');
    expect(pathService.getExtension('/home/user/file.txt')).toBe('.txt');
  });
});
