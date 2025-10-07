/**
 * Algorithm Utilities Unit Tests
 */

describe('Algorithm Utilities', () => {
  test('should handle sorting algorithms', () => {
    const bubbleSort = (arr) => {
      const sorted = [...arr];
      for (let i = 0; i < sorted.length; i++) {
        for (let j = 0; j < sorted.length - i - 1; j++) {
          if (sorted[j] > sorted[j + 1]) {
            [sorted[j], sorted[j + 1]] = [sorted[j + 1], sorted[j]];
          }
        }
      }
      return sorted;
    };

    const unsorted = [64, 34, 25, 12, 22, 11, 90];
    const sorted = bubbleSort(unsorted);
    expect(sorted).toEqual([11, 12, 22, 25, 34, 64, 90]);
  });

  test('should handle search algorithms', () => {
    const binarySearch = (arr, target) => {
      let left = 0;
      let right = arr.length - 1;
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
      }
      return -1;
    };

    const sorted = [1, 3, 5, 7, 9, 11, 13];
    expect(binarySearch(sorted, 7)).toBe(3);
    expect(binarySearch(sorted, 4)).toBe(-1);
  });

  test('should handle fibonacci sequence', () => {
    const fibonacci = (n) => {
      if (n <= 1) return n;
      let a = 0, b = 1;
      for (let i = 2; i <= n; i++) {
        [a, b] = [b, a + b];
      }
      return b;
    };

    expect(fibonacci(0)).toBe(0);
    expect(fibonacci(1)).toBe(1);
    expect(fibonacci(5)).toBe(5);
    expect(fibonacci(10)).toBe(55);
  });

  test('should handle factorial calculation', () => {
    const factorial = (n) => {
      if (n <= 1) return 1;
      return n * factorial(n - 1);
    };

    expect(factorial(0)).toBe(1);
    expect(factorial(1)).toBe(1);
    expect(factorial(5)).toBe(120);
    expect(factorial(6)).toBe(720);
  });

  test('should handle palindrome check', () => {
    const isPalindrome = (str) => {
      const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleaned === cleaned.split('').reverse().join('');
    };

    expect(isPalindrome('racecar')).toBe(true);
    expect(isPalindrome('A man a plan a canal Panama')).toBe(true);
    expect(isPalindrome('hello')).toBe(false);
  });

  test('should handle array deduplication', () => {
    const deduplicate = (arr) => [...new Set(arr)];
    const deduplicateObjects = (arr, key) => {
      const seen = new Set();
      return arr.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    };

    expect(deduplicate([1, 2, 2, 3, 3, 4])).toEqual([1, 2, 3, 4]);
    
    const objects = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 1, name: 'A' }
    ];
    expect(deduplicateObjects(objects, 'id')).toHaveLength(2);
  });
});
