/**
 * Search Utilities Unit Tests
 */

describe('Search Utilities', () => {
  test('should handle linear search implementation', () => {
    const linearSearch = (arr, target) => {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) {
          return i;
        }
      }
      return -1;
    };

    expect(linearSearch([1, 3, 5, 7, 9], 5)).toBe(2);
    expect(linearSearch([1, 3, 5, 7, 9], 6)).toBe(-1);
    expect(linearSearch([], 1)).toBe(-1);
    expect(linearSearch([42], 42)).toBe(0);
  });

  test('should handle binary search implementation', () => {
    const binarySearch = (arr, target) => {
      let left = 0;
      let right = arr.length - 1;
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        if (arr[mid] === target) {
          return mid;
        } else if (arr[mid] < target) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      
      return -1;
    };

    expect(binarySearch([1, 3, 5, 7, 9, 11, 13], 7)).toBe(3);
    expect(binarySearch([1, 3, 5, 7, 9, 11, 13], 6)).toBe(-1);
    expect(binarySearch([1], 1)).toBe(0);
    expect(binarySearch([], 1)).toBe(-1);
  });

  test('should handle text search with fuzzy matching', () => {
    const fuzzySearch = (text, query, threshold = 0.6) => {
      const calculateSimilarity = (str1, str2) => {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
      };
      
      const levenshteinDistance = (str1, str2) => {
        const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
        
        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= str2.length; j++) {
          for (let i = 1; i <= str1.length; i++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
              matrix[j][i - 1] + 1,
              matrix[j - 1][i] + 1,
              matrix[j - 1][i - 1] + cost
            );
          }
        }
        
        return matrix[str2.length][str1.length];
      };
      
      const similarity = calculateSimilarity(text.toLowerCase(), query.toLowerCase());
      return similarity >= threshold ? { match: true, similarity } : { match: false, similarity };
    };

    expect(fuzzySearch('hello world', 'hello')).toEqual({ match: true, similarity: expect.any(Number) });
    expect(fuzzySearch('javascript', 'java').match).toBe(true);
    expect(fuzzySearch('python', 'java').match).toBe(false);
  });

  test('should handle multi-field search', () => {
    const multiFieldSearch = (items, query, fields) => {
      const normalizeQuery = query.toLowerCase();
      
      return items.filter(item => {
        return fields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(normalizeQuery);
          } else if (typeof value === 'number') {
            return value.toString().includes(normalizeQuery);
          }
          return false;
        });
      });
    };

    const data = [
      { name: 'John Doe', email: 'john@example.com', age: 30 },
      { name: 'Jane Smith', email: 'jane@test.com', age: 25 },
      { name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
    ];

    const results = multiFieldSearch(data, 'john', ['name', 'email']);
    expect(results).toHaveLength(2);
    expect(results.some(r => r.name === 'John Doe')).toBe(true);
    expect(results.some(r => r.name === 'Bob Johnson')).toBe(true);
  });

  test('should handle search with filters', () => {
    const searchWithFilters = (items, query, filters = {}) => {
      let results = items;
      
      // Apply text search if query provided
      if (query) {
        const normalizedQuery = query.toLowerCase();
        results = results.filter(item => 
          Object.values(item).some(value => 
            typeof value === 'string' && value.toLowerCase().includes(normalizedQuery)
          )
        );
      }
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          results = results.filter(item => {
            if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
              return item[key] >= value.min && item[key] <= value.max;
            }
            return item[key] === value;
          });
        }
      });
      
      return results;
    };

    const products = [
      { name: 'Laptop', category: 'electronics', price: 999 },
      { name: 'Phone', category: 'electronics', price: 599 },
      { name: 'Book', category: 'education', price: 29 },
      { name: 'Tablet', category: 'electronics', price: 399 }
    ];

    const results1 = searchWithFilters(products, 'laptop');
    expect(results1).toHaveLength(1);
    
    const results2 = searchWithFilters(products, null, { category: 'electronics' });
    expect(results2).toHaveLength(3);
    
    const results3 = searchWithFilters(products, null, { price: { min: 400, max: 700 } });
    expect(results3).toHaveLength(2);
  });

  test('should handle search result ranking', () => {
    const rankedSearch = (items, query, scoreFields) => {
      const normalizedQuery = query.toLowerCase();
      
      const scoredItems = items.map(item => {
        let score = 0;
        
        scoreFields.forEach(({ field, weight = 1 }) => {
          const value = item[field];
          if (typeof value === 'string') {
            const normalizedValue = value.toLowerCase();
            
            // Exact match gets highest score
            if (normalizedValue === normalizedQuery) {
              score += weight * 10;
            }
            // Starts with query gets high score
            else if (normalizedValue.startsWith(normalizedQuery)) {
              score += weight * 5;
            }
            // Contains query gets medium score
            else if (normalizedValue.includes(normalizedQuery)) {
              score += weight * 2;
            }
          }
        });
        
        return { ...item, _score: score };
      });
      
      return scoredItems
        .filter(item => item._score > 0)
        .sort((a, b) => b._score - a._score);
    };

    const articles = [
      { title: 'JavaScript Basics', content: 'Learn JavaScript fundamentals' },
      { title: 'Advanced JavaScript', content: 'Deep dive into JavaScript' },
      { title: 'Python Guide', content: 'JavaScript is mentioned here' },
      { title: 'JavaScript Tips', content: 'Quick JavaScript tips and tricks' }
    ];

    const results = rankedSearch(articles, 'javascript', [
      { field: 'title', weight: 2 },
      { field: 'content', weight: 1 }
    ]);

    expect(results[0].title).toBe('JavaScript Basics'); // Exact match in title
    expect(results[1].title).toBe('JavaScript Tips'); // Starts with in title
    expect(results.length).toBe(4);
  });

  test('should handle search with pagination', () => {
    const paginatedSearch = (items, query, page = 1, pageSize = 10) => {
      const normalizedQuery = query.toLowerCase();
      
      const filteredItems = items.filter(item =>
        Object.values(item).some(value =>
          typeof value === 'string' && value.toLowerCase().includes(normalizedQuery)
        )
      );
      
      const totalItems = filteredItems.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      const pageItems = filteredItems.slice(startIndex, endIndex);
      
      return {
        items: pageItems,
        pagination: {
          currentPage: page,
          pageSize,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    };

    const data = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      description: i % 2 === 0 ? 'test description' : 'other description'
    }));

    const result = paginatedSearch(data, 'test', 1, 5);
    
    expect(result.items).toHaveLength(5);
    expect(result.pagination.totalItems).toBe(13); // 13 items contain 'test'
    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.hasNextPage).toBe(true);
  });
});
