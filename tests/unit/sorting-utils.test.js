/**
 * Sorting Utilities Unit Tests
 */

describe('Sorting Utilities', () => {
  test('should handle bubble sort implementation', () => {
    const bubbleSort = (arr) => {
      const result = [...arr];
      const n = result.length;
      
      for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          if (result[j] > result[j + 1]) {
            [result[j], result[j + 1]] = [result[j + 1], result[j]];
          }
        }
      }
      
      return result;
    };

    expect(bubbleSort([64, 34, 25, 12, 22, 11, 90])).toEqual([11, 12, 22, 25, 34, 64, 90]);
    expect(bubbleSort([5, 2, 8, 1, 9])).toEqual([1, 2, 5, 8, 9]);
    expect(bubbleSort([1])).toEqual([1]);
    expect(bubbleSort([])).toEqual([]);
  });

  test('should handle quick sort implementation', () => {
    const quickSort = (arr) => {
      if (arr.length <= 1) return arr;
      
      const pivot = arr[Math.floor(arr.length / 2)];
      const left = arr.filter(x => x < pivot);
      const middle = arr.filter(x => x === pivot);
      const right = arr.filter(x => x > pivot);
      
      return [...quickSort(left), ...middle, ...quickSort(right)];
    };

    expect(quickSort([64, 34, 25, 12, 22, 11, 90])).toEqual([11, 12, 22, 25, 34, 64, 90]);
    expect(quickSort([3, 6, 8, 10, 1, 2, 1])).toEqual([1, 1, 2, 3, 6, 8, 10]);
    expect(quickSort([1])).toEqual([1]);
    expect(quickSort([])).toEqual([]);
  });

  test('should handle merge sort implementation', () => {
    const mergeSort = (arr) => {
      if (arr.length <= 1) return arr;
      
      const mid = Math.floor(arr.length / 2);
      const left = mergeSort(arr.slice(0, mid));
      const right = mergeSort(arr.slice(mid));
      
      return merge(left, right);
    };
    
    const merge = (left, right) => {
      const result = [];
      let leftIndex = 0;
      let rightIndex = 0;
      
      while (leftIndex < left.length && rightIndex < right.length) {
        if (left[leftIndex] < right[rightIndex]) {
          result.push(left[leftIndex]);
          leftIndex++;
        } else {
          result.push(right[rightIndex]);
          rightIndex++;
        }
      }
      
      return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
    };

    expect(mergeSort([64, 34, 25, 12, 22, 11, 90])).toEqual([11, 12, 22, 25, 34, 64, 90]);
    expect(mergeSort([38, 27, 43, 3, 9, 82, 10])).toEqual([3, 9, 10, 27, 38, 43, 82]);
  });

  test('should handle insertion sort implementation', () => {
    const insertionSort = (arr) => {
      const result = [...arr];
      
      for (let i = 1; i < result.length; i++) {
        const key = result[i];
        let j = i - 1;
        
        while (j >= 0 && result[j] > key) {
          result[j + 1] = result[j];
          j--;
        }
        
        result[j + 1] = key;
      }
      
      return result;
    };

    expect(insertionSort([64, 34, 25, 12, 22, 11, 90])).toEqual([11, 12, 22, 25, 34, 64, 90]);
    expect(insertionSort([5, 2, 4, 6, 1, 3])).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test('should handle selection sort implementation', () => {
    const selectionSort = (arr) => {
      const result = [...arr];
      const n = result.length;
      
      for (let i = 0; i < n - 1; i++) {
        let minIndex = i;
        
        for (let j = i + 1; j < n; j++) {
          if (result[j] < result[minIndex]) {
            minIndex = j;
          }
        }
        
        if (minIndex !== i) {
          [result[i], result[minIndex]] = [result[minIndex], result[i]];
        }
      }
      
      return result;
    };

    expect(selectionSort([64, 25, 12, 22, 11])).toEqual([11, 12, 22, 25, 64]);
    expect(selectionSort([29, 10, 14, 37, 13])).toEqual([10, 13, 14, 29, 37]);
  });

  test('should handle heap sort implementation', () => {
    const heapSort = (arr) => {
      const result = [...arr];
      const n = result.length;
      
      // Build max heap
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapify(result, n, i);
      }
      
      // Extract elements from heap one by one
      for (let i = n - 1; i > 0; i--) {
        [result[0], result[i]] = [result[i], result[0]];
        heapify(result, i, 0);
      }
      
      return result;
    };
    
    const heapify = (arr, n, i) => {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      
      if (left < n && arr[left] > arr[largest]) {
        largest = left;
      }
      
      if (right < n && arr[right] > arr[largest]) {
        largest = right;
      }
      
      if (largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        heapify(arr, n, largest);
      }
    };

    expect(heapSort([12, 11, 13, 5, 6, 7])).toEqual([5, 6, 7, 11, 12, 13]);
    expect(heapSort([64, 34, 25, 12, 22, 11, 90])).toEqual([11, 12, 22, 25, 34, 64, 90]);
  });

  test('should handle custom comparator sorting', () => {
    const customSort = (arr, compareFn) => {
      return [...arr].sort(compareFn);
    };

    const numbers = [3, 1, 4, 1, 5, 9, 2, 6];
    
    // Ascending
    expect(customSort(numbers, (a, b) => a - b)).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
    
    // Descending
    expect(customSort(numbers, (a, b) => b - a)).toEqual([9, 6, 5, 4, 3, 2, 1, 1]);
    
    // Objects by property
    const people = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
      { name: 'Bob', age: 35 }
    ];
    
    const sortedByAge = customSort(people, (a, b) => a.age - b.age);
    expect(sortedByAge[0].name).toBe('Jane');
    expect(sortedByAge[2].name).toBe('Bob');
  });

  test('should handle stable sorting', () => {
    const stableSort = (arr, keyFn) => {
      return arr
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
          const keyA = keyFn(a.item);
          const keyB = keyFn(b.item);
          return keyA === keyB ? a.index - b.index : keyA - keyB;
        })
        .map(({ item }) => item);
    };

    const items = [
      { name: 'Alice', score: 85 },
      { name: 'Bob', score: 90 },
      { name: 'Charlie', score: 85 },
      { name: 'David', score: 90 }
    ];

    const sorted = stableSort(items, item => item.score);
    
    // Items with same score should maintain original order
    expect(sorted[0].name).toBe('Alice');
    expect(sorted[1].name).toBe('Charlie');
    expect(sorted[2].name).toBe('Bob');
    expect(sorted[3].name).toBe('David');
  });
});
