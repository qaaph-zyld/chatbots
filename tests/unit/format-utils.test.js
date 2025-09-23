/**
 * Format Utilities Unit Tests
 */

describe('Format Utilities', () => {
  test('should handle number formatting', () => {
    const formatNumber = (num, decimals = 2) => {
      return Number(num).toFixed(decimals);
    };

    const formatCurrency = (amount, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    };

    expect(formatNumber(3.14159, 2)).toBe('3.14');
    expect(formatNumber(1000, 0)).toBe('1000');
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  test('should handle date formatting', () => {
    const formatDate = (date, format = 'YYYY-MM-DD') => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day);
    };

    const date = new Date('2023-06-15');
    expect(formatDate(date)).toBe('2023-06-15');
    expect(formatDate(date, 'DD/MM/YYYY')).toBe('15/06/2023');
  });

  test('should handle text formatting', () => {
    const capitalize = (str) => {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const titleCase = (str) => {
      return str.split(' ').map(capitalize).join(' ');
    };

    const truncate = (str, length, suffix = '...') => {
      return str.length > length ? str.substring(0, length) + suffix : str;
    };

    expect(capitalize('hello WORLD')).toBe('Hello world');
    expect(titleCase('hello world test')).toBe('Hello World Test');
    expect(truncate('This is a long text', 10)).toBe('This is a ...');
  });

  test('should handle size formatting', () => {
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
  });

  test('should handle phone number formatting', () => {
    const formatPhone = (phone) => {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
      return phone;
    };

    expect(formatPhone('1234567890')).toBe('(123) 456-7890');
    expect(formatPhone('123-456-7890')).toBe('(123) 456-7890');
    expect(formatPhone('invalid')).toBe('invalid');
  });

  test('should handle template string formatting', () => {
    const template = (str, data) => {
      return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || match;
      });
    };

    const result = template('Hello {{name}}, you are {{age}} years old', {
      name: 'John',
      age: 30
    });
    
    expect(result).toBe('Hello John, you are 30 years old');
  });
});
