/**
 * File System Utilities Unit Tests
 */

describe('File System Utilities', () => {
  test('should handle path operations', () => {
    const joinPath = (...parts) => {
      return parts
        .map(part => part.replace(/^\/+|\/+$/g, ''))
        .filter(part => part.length > 0)
        .join('/');
    };
    
    const getExtension = (filename) => {
      const lastDot = filename.lastIndexOf('.');
      return lastDot === -1 ? '' : filename.substring(lastDot + 1);
    };
    
    const getBasename = (filepath) => {
      const parts = filepath.split('/');
      return parts[parts.length - 1];
    };
    
    const getDirname = (filepath) => {
      const parts = filepath.split('/');
      return parts.slice(0, -1).join('/') || '/';
    };
    
    const normalizePath = (path) => {
      const parts = path.split('/').filter(part => part !== '');
      const normalized = [];
      
      for (const part of parts) {
        if (part === '..') {
          normalized.pop();
        } else if (part !== '.') {
          normalized.push(part);
        }
      }
      
      return '/' + normalized.join('/');
    };

    expect(joinPath('/home', 'user/', '/documents')).toBe('home/user/documents');
    expect(getExtension('file.txt')).toBe('txt');
    expect(getExtension('file')).toBe('');
    expect(getBasename('/path/to/file.txt')).toBe('file.txt');
    expect(getDirname('/path/to/file.txt')).toBe('/path/to');
    expect(normalizePath('/home/user/../documents/./file.txt')).toBe('/home/documents/file.txt');
  });

  test('should handle file size calculations', () => {
    const formatFileSize = (bytes) => {
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = bytes;
      let unitIndex = 0;
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      
      return `${size.toFixed(2)} ${units[unitIndex]}`;
    };
    
    const parseFileSize = (sizeString) => {
      const match = sizeString.match(/^([\d.]+)\s*([KMGT]?B)$/i);
      if (!match) return 0;
      
      const value = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      
      const multipliers = { 'B': 1, 'KB': 1024, 'MB': 1024**2, 'GB': 1024**3, 'TB': 1024**4 };
      return Math.floor(value * (multipliers[unit] || 1));
    };
    
    const calculateDirectorySize = (files) => {
      return files.reduce((total, file) => total + (file.size || 0), 0);
    };
    
    const estimateCompressionRatio = (fileExtension) => {
      const ratios = {
        'txt': 0.3,
        'js': 0.25,
        'html': 0.2,
        'css': 0.15,
        'json': 0.3,
        'jpg': 0.95,
        'png': 0.9,
        'mp4': 0.98,
        'zip': 1.0
      };
      
      return ratios[fileExtension.toLowerCase()] || 0.5;
    };

    expect(formatFileSize(1024)).toBe('1.00 KB');
    expect(formatFileSize(1536)).toBe('1.50 KB');
    expect(formatFileSize(1048576)).toBe('1.00 MB');
    
    expect(parseFileSize('1.5 MB')).toBe(1572864);
    expect(parseFileSize('500 KB')).toBe(512000);
    
    const files = [{ name: 'file1.txt', size: 1000 }, { name: 'file2.txt', size: 2000 }];
    expect(calculateDirectorySize(files)).toBe(3000);
    
    expect(estimateCompressionRatio('txt')).toBe(0.3);
    expect(estimateCompressionRatio('jpg')).toBe(0.95);
  });

  test('should handle file type detection', () => {
    const detectFileType = (filename) => {
      const extension = filename.split('.').pop().toLowerCase();
      
      const types = {
        // Text files
        'txt': 'text/plain',
        'md': 'text/markdown',
        'csv': 'text/csv',
        
        // Code files
        'js': 'application/javascript',
        'json': 'application/json',
        'html': 'text/html',
        'css': 'text/css',
        'xml': 'application/xml',
        
        // Images
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        
        // Documents
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        
        // Archives
        'zip': 'application/zip',
        'tar': 'application/x-tar',
        'gz': 'application/gzip'
      };
      
      return types[extension] || 'application/octet-stream';
    };
    
    const isTextFile = (filename) => {
      const mimeType = detectFileType(filename);
      return mimeType.startsWith('text/') || 
             ['application/javascript', 'application/json', 'application/xml'].includes(mimeType);
    };
    
    const isImageFile = (filename) => {
      return detectFileType(filename).startsWith('image/');
    };
    
    const getFileCategory = (filename) => {
      const mimeType = detectFileType(filename);
      
      if (mimeType.startsWith('text/') || mimeType.includes('javascript') || mimeType.includes('json')) {
        return 'text';
      } else if (mimeType.startsWith('image/')) {
        return 'image';
      } else if (mimeType.startsWith('video/')) {
        return 'video';
      } else if (mimeType.startsWith('audio/')) {
        return 'audio';
      } else if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip')) {
        return 'archive';
      } else {
        return 'other';
      }
    };

    expect(detectFileType('document.pdf')).toBe('application/pdf');
    expect(detectFileType('script.js')).toBe('application/javascript');
    expect(detectFileType('image.png')).toBe('image/png');
    
    expect(isTextFile('readme.txt')).toBe(true);
    expect(isTextFile('config.json')).toBe(true);
    expect(isTextFile('image.jpg')).toBe(false);
    
    expect(isImageFile('photo.jpg')).toBe(true);
    expect(isImageFile('document.pdf')).toBe(false);
    
    expect(getFileCategory('script.js')).toBe('text');
    expect(getFileCategory('photo.png')).toBe('image');
    expect(getFileCategory('archive.zip')).toBe('archive');
  });

  test('should handle file permissions simulation', () => {
    const parsePermissions = (octal) => {
      const permissions = { owner: {}, group: {}, others: {} };
      const octalStr = octal.toString();
      
      const parseDigit = (digit) => ({
        read: (digit & 4) !== 0,
        write: (digit & 2) !== 0,
        execute: (digit & 1) !== 0
      });
      
      if (octalStr.length >= 3) {
        permissions.owner = parseDigit(parseInt(octalStr[octalStr.length - 3]));
        permissions.group = parseDigit(parseInt(octalStr[octalStr.length - 2]));
        permissions.others = parseDigit(parseInt(octalStr[octalStr.length - 1]));
      }
      
      return permissions;
    };
    
    const formatPermissions = (permissions) => {
      const formatGroup = (group) => {
        return (group.read ? 'r' : '-') +
               (group.write ? 'w' : '-') +
               (group.execute ? 'x' : '-');
      };
      
      return formatGroup(permissions.owner) +
             formatGroup(permissions.group) +
             formatGroup(permissions.others);
    };
    
    const hasPermission = (permissions, user, action) => {
      const userTypes = { owner: 'owner', group: 'group', other: 'others' };
      const userType = userTypes[user] || 'others';
      return permissions[userType][action] || false;
    };
    
    const calculatePermissionOctal = (permissions) => {
      const digitFromGroup = (group) => {
        return (group.read ? 4 : 0) + (group.write ? 2 : 0) + (group.execute ? 1 : 0);
      };
      
      return digitFromGroup(permissions.owner) * 100 +
             digitFromGroup(permissions.group) * 10 +
             digitFromGroup(permissions.others);
    };

    const perms755 = parsePermissions(755);
    expect(perms755.owner.read).toBe(true);
    expect(perms755.owner.write).toBe(true);
    expect(perms755.owner.execute).toBe(true);
    expect(perms755.others.write).toBe(false);
    
    expect(formatPermissions(perms755)).toBe('rwxr-xr-x');
    expect(hasPermission(perms755, 'owner', 'write')).toBe(true);
    expect(hasPermission(perms755, 'other', 'write')).toBe(false);
    expect(calculatePermissionOctal(perms755)).toBe(755);
  });

  test('should handle directory tree operations', () => {
    const buildDirectoryTree = (paths) => {
      const tree = { name: 'root', type: 'directory', children: [] };
      
      paths.forEach(path => {
        const parts = path.split('/').filter(part => part);
        let current = tree;
        
        parts.forEach((part, index) => {
          let child = current.children.find(c => c.name === part);
          
          if (!child) {
            child = {
              name: part,
              type: index === parts.length - 1 ? 'file' : 'directory',
              children: []
            };
            current.children.push(child);
          }
          
          current = child;
        });
      });
      
      return tree;
    };
    
    const flattenTree = (tree, prefix = '') => {
      const result = [];
      
      if (tree.name !== 'root') {
        result.push(prefix + tree.name);
      }
      
      if (tree.children) {
        tree.children.forEach(child => {
          const childPrefix = tree.name === 'root' ? '' : prefix + tree.name + '/';
          result.push(...flattenTree(child, childPrefix));
        });
      }
      
      return result;
    };
    
    const findInTree = (tree, name) => {
      if (tree.name === name) return tree;
      
      if (tree.children) {
        for (const child of tree.children) {
          const found = findInTree(child, name);
          if (found) return found;
        }
      }
      
      return null;
    };
    
    const countFiles = (tree) => {
      let count = tree.type === 'file' ? 1 : 0;
      
      if (tree.children) {
        count += tree.children.reduce((sum, child) => sum + countFiles(child), 0);
      }
      
      return count;
    };

    const paths = ['src/index.js', 'src/utils/helper.js', 'tests/test.js', 'README.md'];
    const tree = buildDirectoryTree(paths);
    
    expect(tree.children).toHaveLength(3); // src, tests, README.md
    expect(tree.children.find(c => c.name === 'src').children).toHaveLength(2); // index.js, utils
    
    const flattened = flattenTree(tree);
    expect(flattened).toContain('src/index.js');
    expect(flattened).toContain('README.md');
    
    const found = findInTree(tree, 'helper.js');
    expect(found).toBeTruthy();
    expect(found.type).toBe('file');
    
    expect(countFiles(tree)).toBe(4);
  });

  test('should handle file filtering and searching', () => {
    const filterByExtension = (files, extensions) => {
      const extSet = new Set(extensions.map(ext => ext.toLowerCase()));
      return files.filter(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        return extSet.has(ext);
      });
    };
    
    const filterBySize = (files, minSize = 0, maxSize = Infinity) => {
      return files.filter(file => file.size >= minSize && file.size <= maxSize);
    };
    
    const filterByDate = (files, startDate, endDate) => {
      return files.filter(file => {
        const fileDate = new Date(file.modified);
        return fileDate >= startDate && fileDate <= endDate;
      });
    };
    
    const searchByName = (files, pattern) => {
      const regex = new RegExp(pattern, 'i');
      return files.filter(file => regex.test(file.name));
    };
    
    const groupByExtension = (files) => {
      const groups = {};
      
      files.forEach(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!groups[ext]) groups[ext] = [];
        groups[ext].push(file);
      });
      
      return groups;
    };

    const files = [
      { name: 'script.js', size: 1000, modified: '2023-01-01' },
      { name: 'style.css', size: 500, modified: '2023-01-02' },
      { name: 'test.js', size: 2000, modified: '2023-01-03' },
      { name: 'image.png', size: 5000, modified: '2023-01-04' }
    ];
    
    expect(filterByExtension(files, ['js'])).toHaveLength(2);
    expect(filterBySize(files, 1000, 3000)).toHaveLength(2);
    
    const startDate = new Date('2023-01-02');
    const endDate = new Date('2023-01-03');
    expect(filterByDate(files, startDate, endDate)).toHaveLength(2);
    
    expect(searchByName(files, 'test')).toHaveLength(1);
    
    const grouped = groupByExtension(files);
    expect(grouped.js).toHaveLength(2);
    expect(grouped.css).toHaveLength(1);
  });
});
