/**
 * Matrix Utilities Unit Tests
 */

describe('Matrix Utilities', () => {
  test('should handle matrix creation and basic operations', () => {
    const createMatrix = (rows, cols, fill = 0) => {
      return Array(rows).fill().map(() => Array(cols).fill(fill));
    };
    
    const identityMatrix = (size) => {
      const matrix = createMatrix(size, size, 0);
      for (let i = 0; i < size; i++) {
        matrix[i][i] = 1;
      }
      return matrix;
    };
    
    const matrixDimensions = (matrix) => {
      return { rows: matrix.length, cols: matrix[0].length };
    };

    const matrix = createMatrix(3, 3, 5);
    expect(matrix).toHaveLength(3);
    expect(matrix[0]).toHaveLength(3);
    expect(matrix[1][1]).toBe(5);
    
    const identity = identityMatrix(3);
    expect(identity[0][0]).toBe(1);
    expect(identity[0][1]).toBe(0);
    expect(identity[1][1]).toBe(1);
    
    expect(matrixDimensions(matrix)).toEqual({ rows: 3, cols: 3 });
  });

  test('should handle matrix addition and subtraction', () => {
    const addMatrices = (a, b) => {
      if (a.length !== b.length || a[0].length !== b[0].length) {
        throw new Error('Matrix dimensions must match');
      }
      
      return a.map((row, i) => 
        row.map((val, j) => val + b[i][j])
      );
    };
    
    const subtractMatrices = (a, b) => {
      if (a.length !== b.length || a[0].length !== b[0].length) {
        throw new Error('Matrix dimensions must match');
      }
      
      return a.map((row, i) => 
        row.map((val, j) => val - b[i][j])
      );
    };
    
    const scalarMultiply = (matrix, scalar) => {
      return matrix.map(row => 
        row.map(val => val * scalar)
      );
    };

    const a = [[1, 2], [3, 4]];
    const b = [[5, 6], [7, 8]];
    
    const sum = addMatrices(a, b);
    expect(sum).toEqual([[6, 8], [10, 12]]);
    
    const diff = subtractMatrices(a, b);
    expect(diff).toEqual([[-4, -4], [-4, -4]]);
    
    const scaled = scalarMultiply(a, 2);
    expect(scaled).toEqual([[2, 4], [6, 8]]);
  });

  test('should handle matrix multiplication', () => {
    const multiplyMatrices = (a, b) => {
      if (a[0].length !== b.length) {
        throw new Error('Invalid matrix dimensions for multiplication');
      }
      
      const result = Array(a.length).fill().map(() => Array(b[0].length).fill(0));
      
      for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b[0].length; j++) {
          for (let k = 0; k < b.length; k++) {
            result[i][j] += a[i][k] * b[k][j];
          }
        }
      }
      
      return result;
    };
    
    const dotProduct = (a, b) => {
      if (a.length !== b.length) {
        throw new Error('Vectors must have same length');
      }
      
      return a.reduce((sum, val, i) => sum + val * b[i], 0);
    };

    const a = [[1, 2], [3, 4]];
    const b = [[5, 6], [7, 8]];
    
    const product = multiplyMatrices(a, b);
    expect(product).toEqual([[19, 22], [43, 50]]);
    
    const vec1 = [1, 2, 3];
    const vec2 = [4, 5, 6];
    expect(dotProduct(vec1, vec2)).toBe(32);
  });

  test('should handle matrix transpose and determinant', () => {
    const transpose = (matrix) => {
      return matrix[0].map((_, colIndex) => 
        matrix.map(row => row[colIndex])
      );
    };
    
    const determinant2x2 = (matrix) => {
      if (matrix.length !== 2 || matrix[0].length !== 2) {
        throw new Error('Matrix must be 2x2');
      }
      
      return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    };
    
    const determinant3x3 = (matrix) => {
      if (matrix.length !== 3 || matrix[0].length !== 3) {
        throw new Error('Matrix must be 3x3');
      }
      
      const [[a, b, c], [d, e, f], [g, h, i]] = matrix;
      
      return a * (e * i - f * h) - 
             b * (d * i - f * g) + 
             c * (d * h - e * g);
    };

    const matrix = [[1, 2, 3], [4, 5, 6]];
    const transposed = transpose(matrix);
    expect(transposed).toEqual([[1, 4], [2, 5], [3, 6]]);
    
    const matrix2x2 = [[1, 2], [3, 4]];
    expect(determinant2x2(matrix2x2)).toBe(-2);
    
    const matrix3x3 = [[1, 2, 3], [0, 1, 4], [5, 6, 0]];
    expect(determinant3x3(matrix3x3)).toBe(1);
  });

  test('should handle matrix inverse', () => {
    const inverse2x2 = (matrix) => {
      const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
      
      if (Math.abs(det) < 1e-10) {
        throw new Error('Matrix is not invertible');
      }
      
      return [
        [matrix[1][1] / det, -matrix[0][1] / det],
        [-matrix[1][0] / det, matrix[0][0] / det]
      ];
    };
    
    const isInvertible = (matrix) => {
      if (matrix.length === 2 && matrix[0].length === 2) {
        const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
        return Math.abs(det) > 1e-10;
      }
      return false; // Simplified for 2x2 only
    };

    const matrix = [[4, 7], [2, 6]];
    const inv = inverse2x2(matrix);
    
    expect(inv[0][0]).toBeCloseTo(0.6, 5);
    expect(inv[0][1]).toBeCloseTo(-0.7, 5);
    expect(inv[1][0]).toBeCloseTo(-0.2, 5);
    expect(inv[1][1]).toBeCloseTo(0.4, 5);
    
    expect(isInvertible(matrix)).toBe(true);
    expect(isInvertible([[1, 2], [2, 4]])).toBe(false); // Singular matrix
  });

  test('should handle matrix decomposition', () => {
    const luDecomposition = (matrix) => {
      const n = matrix.length;
      const L = Array(n).fill().map(() => Array(n).fill(0));
      const U = Array(n).fill().map(() => Array(n).fill(0));
      
      // Initialize L diagonal to 1
      for (let i = 0; i < n; i++) {
        L[i][i] = 1;
      }
      
      // Compute U and L
      for (let i = 0; i < n; i++) {
        // Upper triangular matrix U
        for (let k = i; k < n; k++) {
          let sum = 0;
          for (let j = 0; j < i; j++) {
            sum += L[i][j] * U[j][k];
          }
          U[i][k] = matrix[i][k] - sum;
        }
        
        // Lower triangular matrix L
        for (let k = i + 1; k < n; k++) {
          let sum = 0;
          for (let j = 0; j < i; j++) {
            sum += L[k][j] * U[j][i];
          }
          L[k][i] = (matrix[k][i] - sum) / U[i][i];
        }
      }
      
      return { L, U };
    };

    const matrix = [[2, -1, -2], [-4, 6, 3], [-4, -2, 8]];
    const { L, U } = luDecomposition(matrix);
    
    expect(L[0][0]).toBe(1);
    expect(L[1][0]).toBe(-2);
    expect(U[0][0]).toBe(2);
    expect(U[0][1]).toBe(-1);
  });

  test('should handle eigenvalues and eigenvectors (2x2)', () => {
    const eigenvalues2x2 = (matrix) => {
      const [[a, b], [c, d]] = matrix;
      const trace = a + d;
      const det = a * d - b * c;
      
      const discriminant = trace * trace - 4 * det;
      
      if (discriminant < 0) {
        return null; // Complex eigenvalues
      }
      
      const sqrt = Math.sqrt(discriminant);
      return [
        (trace + sqrt) / 2,
        (trace - sqrt) / 2
      ];
    };
    
    const eigenvector2x2 = (matrix, eigenvalue) => {
      const [[a, b], [c, d]] = matrix;
      
      // (A - λI)v = 0
      const adjustedA = a - eigenvalue;
      const adjustedD = d - eigenvalue;
      
      if (Math.abs(b) > 1e-10) {
        return [1, -adjustedA / b];
      } else if (Math.abs(c) > 1e-10) {
        return [-c / adjustedD, 1];
      } else {
        return [1, 0]; // Default eigenvector
      }
    };

    const matrix = [[3, 1], [0, 2]];
    const eigenvals = eigenvalues2x2(matrix);
    
    expect(eigenvals).toContain(3);
    expect(eigenvals).toContain(2);
    
    const eigenvec1 = eigenvector2x2(matrix, 3);
    expect(eigenvec1[0]).toBe(1);
    expect(eigenvec1[1]).toBeCloseTo(0, 5);
  });

  test('should handle matrix norms and properties', () => {
    const frobeniusNorm = (matrix) => {
      let sum = 0;
      for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[0].length; j++) {
          sum += matrix[i][j] * matrix[i][j];
        }
      }
      return Math.sqrt(sum);
    };
    
    const trace = (matrix) => {
      let sum = 0;
      const size = Math.min(matrix.length, matrix[0].length);
      for (let i = 0; i < size; i++) {
        sum += matrix[i][i];
      }
      return sum;
    };
    
    const isSymmetric = (matrix) => {
      if (matrix.length !== matrix[0].length) return false;
      
      for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[0].length; j++) {
          if (Math.abs(matrix[i][j] - matrix[j][i]) > 1e-10) {
            return false;
          }
        }
      }
      return true;
    };
    
    const isOrthogonal = (matrix) => {
      if (matrix.length !== matrix[0].length) return false;
      
      // Check if A * A^T = I
      const transpose = matrix[0].map((_, colIndex) => 
        matrix.map(row => row[colIndex])
      );
      
      // Multiply matrix by its transpose
      const product = Array(matrix.length).fill().map(() => Array(matrix.length).fill(0));
      
      for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix.length; j++) {
          for (let k = 0; k < matrix.length; k++) {
            product[i][j] += matrix[i][k] * transpose[k][j];
          }
        }
      }
      
      // Check if result is identity matrix
      for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix.length; j++) {
          const expected = i === j ? 1 : 0;
          if (Math.abs(product[i][j] - expected) > 1e-10) {
            return false;
          }
        }
      }
      
      return true;
    };

    const matrix = [[1, 2], [3, 4]];
    expect(frobeniusNorm(matrix)).toBeCloseTo(5.477, 3);
    expect(trace(matrix)).toBe(5);
    
    const symmetric = [[1, 2], [2, 3]];
    expect(isSymmetric(symmetric)).toBe(true);
    expect(isSymmetric(matrix)).toBe(false);
    
    const orthogonal = [[1, 0], [0, 1]]; // Identity matrix
    expect(isOrthogonal(orthogonal)).toBe(true);
  });
});
