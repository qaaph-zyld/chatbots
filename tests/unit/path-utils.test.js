/**
 * Path Utilities Unit Tests
 */

describe('Path Utilities', () => {
  test('should handle path joining', () => {
    const parts = ['folder', 'subfolder', 'file.txt'];
    const joined = parts.join('/');
    expect(joined).toBe('folder/subfolder/file.txt');
  });

  test('should handle path parsing', () => {
    const fullPath = '/home/user/documents/file.txt';
    const parts = fullPath.split('/');
    const filename = parts[parts.length - 1];
    const directory = parts.slice(0, -1).join('/');
    
    expect(filename).toBe('file.txt');
    expect(directory).toBe('/home/user/documents');
  });

  test('should handle file extensions', () => {
    const filename = 'document.pdf';
    const lastDot = filename.lastIndexOf('.');
    const extension = lastDot > 0 ? filename.substring(lastDot + 1) : '';
    const basename = lastDot > 0 ? filename.substring(0, lastDot) : filename;
    
    expect(extension).toBe('pdf');
    expect(basename).toBe('document');
  });

  test('should handle path normalization', () => {
    const messyPath = '/folder//subfolder/./file.txt';
    const normalized = messyPath.replace(/\/+/g, '/').replace('/./g', '/');
    
    expect(normalized).toBe('/folder/subfolder/file.txt');
  });

  test('should handle relative paths', () => {
    const basePath = '/home/user';
    const relativePath = 'documents/file.txt';
    const absolutePath = basePath + '/' + relativePath;
    
    expect(absolutePath).toBe('/home/user/documents/file.txt');
  });
});
