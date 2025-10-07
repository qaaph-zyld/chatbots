/**
 * Statistics Utilities Unit Tests
 */

describe('Statistics Utilities', () => {
  test('should handle basic statistical measures', () => {
    const mean = (numbers) => {
      return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    };
    
    const median = (numbers) => {
      const sorted = [...numbers].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 
        ? (sorted[mid - 1] + sorted[mid]) / 2 
        : sorted[mid];
    };
    
    const mode = (numbers) => {
      const frequency = {};
      numbers.forEach(num => {
        frequency[num] = (frequency[num] || 0) + 1;
      });
      
      let maxFreq = 0;
      let modes = [];
      
      Object.entries(frequency).forEach(([num, freq]) => {
        if (freq > maxFreq) {
          maxFreq = freq;
          modes = [Number(num)];
        } else if (freq === maxFreq) {
          modes.push(Number(num));
        }
      });
      
      return modes;
    };

    const data = [1, 2, 2, 3, 4, 4, 5];
    
    expect(mean(data)).toBeCloseTo(3, 5);
    expect(median(data)).toBe(3);
    expect(mode(data)).toEqual([2, 4]);
  });

  test('should handle variance and standard deviation', () => {
    const variance = (numbers) => {
      const avg = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
      const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2));
      return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    };
    
    const standardDeviation = (numbers) => {
      return Math.sqrt(variance(numbers));
    };
    
    const sampleVariance = (numbers) => {
      const avg = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
      const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2));
      return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (numbers.length - 1);
    };

    const data = [2, 4, 4, 4, 5, 5, 7, 9];
    
    expect(variance(data)).toBeCloseTo(4, 5);
    expect(standardDeviation(data)).toBeCloseTo(2, 5);
    expect(sampleVariance(data)).toBeCloseTo(4.57, 2);
  });

  test('should handle percentiles and quartiles', () => {
    const percentile = (numbers, p) => {
      const sorted = [...numbers].sort((a, b) => a - b);
      const index = (p / 100) * (sorted.length - 1);
      
      if (Number.isInteger(index)) {
        return sorted[index];
      } else {
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
      }
    };
    
    const quartiles = (numbers) => {
      return {
        q1: percentile(numbers, 25),
        q2: percentile(numbers, 50), // median
        q3: percentile(numbers, 75)
      };
    };
    
    const interquartileRange = (numbers) => {
      const q = quartiles(numbers);
      return q.q3 - q.q1;
    };

    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    expect(percentile(data, 50)).toBe(5.5);
    expect(percentile(data, 90)).toBe(9.1);
    
    const q = quartiles(data);
    expect(q.q1).toBe(3.25);
    expect(q.q2).toBe(5.5);
    expect(q.q3).toBe(7.75);
    expect(interquartileRange(data)).toBe(4.5);
  });

  test('should handle correlation and covariance', () => {
    const covariance = (x, y) => {
      const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
      const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
      
      const cov = x.reduce((sum, xi, i) => {
        return sum + (xi - meanX) * (y[i] - meanY);
      }, 0);
      
      return cov / (x.length - 1);
    };
    
    const correlation = (x, y) => {
      const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
      const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
      
      let numerator = 0;
      let sumXSquared = 0;
      let sumYSquared = 0;
      
      for (let i = 0; i < x.length; i++) {
        const xDiff = x[i] - meanX;
        const yDiff = y[i] - meanY;
        
        numerator += xDiff * yDiff;
        sumXSquared += xDiff * xDiff;
        sumYSquared += yDiff * yDiff;
      }
      
      return numerator / Math.sqrt(sumXSquared * sumYSquared);
    };

    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    
    expect(covariance(x, y)).toBeCloseTo(5, 5);
    expect(correlation(x, y)).toBeCloseTo(1, 5); // Perfect positive correlation
  });

  test('should handle regression analysis', () => {
    const linearRegression = (x, y) => {
      const n = x.length;
      const sumX = x.reduce((sum, val) => sum + val, 0);
      const sumY = y.reduce((sum, val) => sum + val, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumXSquared = x.reduce((sum, xi) => sum + xi * xi, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXSquared - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      return { slope, intercept };
    };
    
    const predict = (regression, x) => {
      return regression.slope * x + regression.intercept;
    };
    
    const rSquared = (x, y, regression) => {
      const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
      
      let totalSumSquares = 0;
      let residualSumSquares = 0;
      
      for (let i = 0; i < x.length; i++) {
        const predicted = predict(regression, x[i]);
        totalSumSquares += Math.pow(y[i] - meanY, 2);
        residualSumSquares += Math.pow(y[i] - predicted, 2);
      }
      
      return 1 - (residualSumSquares / totalSumSquares);
    };

    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    
    const regression = linearRegression(x, y);
    expect(regression.slope).toBeCloseTo(2, 5);
    expect(regression.intercept).toBeCloseTo(0, 5);
    expect(predict(regression, 6)).toBeCloseTo(12, 5);
    expect(rSquared(x, y, regression)).toBeCloseTo(1, 5);
  });

  test('should handle probability distributions', () => {
    const normalPDF = (x, mean = 0, stdDev = 1) => {
      const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
      const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
      return coefficient * Math.exp(exponent);
    };
    
    const normalCDF = (x, mean = 0, stdDev = 1) => {
      // Approximation using error function
      const z = (x - mean) / stdDev;
      return 0.5 * (1 + erf(z / Math.sqrt(2)));
    };
    
    // Error function approximation
    const erf = (x) => {
      const a1 =  0.254829592;
      const a2 = -0.284496736;
      const a3 =  1.421413741;
      const a4 = -1.453152027;
      const a5 =  1.061405429;
      const p  =  0.3275911;
      
      const sign = x >= 0 ? 1 : -1;
      x = Math.abs(x);
      
      const t = 1.0 / (1.0 + p * x);
      const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
      
      return sign * y;
    };
    
    const binomialPMF = (n, k, p) => {
      const combination = factorial(n) / (factorial(k) * factorial(n - k));
      return combination * Math.pow(p, k) * Math.pow(1 - p, n - k);
    };
    
    const factorial = (n) => {
      if (n <= 1) return 1;
      return n * factorial(n - 1);
    };

    expect(normalPDF(0, 0, 1)).toBeCloseTo(0.399, 3);
    expect(normalCDF(0, 0, 1)).toBeCloseTo(0.5, 3);
    expect(binomialPMF(10, 3, 0.5)).toBeCloseTo(0.117, 3);
  });

  test('should handle hypothesis testing', () => {
    const tTest = (sample1, sample2) => {
      const mean1 = sample1.reduce((sum, val) => sum + val, 0) / sample1.length;
      const mean2 = sample2.reduce((sum, val) => sum + val, 0) / sample2.length;
      
      const var1 = sample1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (sample1.length - 1);
      const var2 = sample2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (sample2.length - 1);
      
      const pooledVar = ((sample1.length - 1) * var1 + (sample2.length - 1) * var2) / 
                       (sample1.length + sample2.length - 2);
      
      const standardError = Math.sqrt(pooledVar * (1/sample1.length + 1/sample2.length));
      const tStatistic = (mean1 - mean2) / standardError;
      const degreesOfFreedom = sample1.length + sample2.length - 2;
      
      return { tStatistic, degreesOfFreedom, meanDifference: mean1 - mean2 };
    };
    
    const chiSquareTest = (observed, expected) => {
      let chiSquare = 0;
      
      for (let i = 0; i < observed.length; i++) {
        chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
      }
      
      return { chiSquare, degreesOfFreedom: observed.length - 1 };
    };

    const sample1 = [1, 2, 3, 4, 5];
    const sample2 = [2, 3, 4, 5, 6];
    
    const tResult = tTest(sample1, sample2);
    expect(tResult.meanDifference).toBe(-1);
    expect(tResult.degreesOfFreedom).toBe(8);
    
    const observed = [10, 15, 20, 25];
    const expected = [12, 18, 18, 22];
    
    const chiResult = chiSquareTest(observed, expected);
    expect(chiResult.chiSquare).toBeCloseTo(1.65, 2);
    expect(chiResult.degreesOfFreedom).toBe(3);
  });

  test('should handle time series analysis', () => {
    const movingAverage = (data, windowSize) => {
      const result = [];
      
      for (let i = windowSize - 1; i < data.length; i++) {
        const window = data.slice(i - windowSize + 1, i + 1);
        const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
        result.push(average);
      }
      
      return result;
    };
    
    const exponentialSmoothing = (data, alpha) => {
      const result = [data[0]];
      
      for (let i = 1; i < data.length; i++) {
        const smoothed = alpha * data[i] + (1 - alpha) * result[i - 1];
        result.push(smoothed);
      }
      
      return result;
    };
    
    const trend = (data) => {
      const n = data.length;
      const x = Array.from({ length: n }, (_, i) => i);
      
      const sumX = x.reduce((sum, val) => sum + val, 0);
      const sumY = data.reduce((sum, val) => sum + val, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
      const sumXSquared = x.reduce((sum, xi) => sum + xi * xi, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXSquared - sumX * sumX);
      return slope;
    };

    const data = [1, 3, 2, 4, 3, 5, 4, 6, 5, 7];
    
    const ma = movingAverage(data, 3);
    expect(ma[0]).toBeCloseTo(2, 5);
    expect(ma.length).toBe(8);
    
    const smoothed = exponentialSmoothing(data, 0.3);
    expect(smoothed[0]).toBe(1);
    expect(smoothed.length).toBe(10);
    
    expect(trend(data)).toBeCloseTo(0.67, 2);
  });
});
