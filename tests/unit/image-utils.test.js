/**
 * Image Utilities Unit Tests
 */

describe('Image Utilities', () => {
  test('should handle image dimensions and scaling', () => {
    const calculateAspectRatio = (width, height) => width / height;
    
    const scaleToFit = (originalWidth, originalHeight, maxWidth, maxHeight) => {
      const aspectRatio = originalWidth / originalHeight;
      
      let newWidth = maxWidth;
      let newHeight = maxWidth / aspectRatio;
      
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = maxHeight * aspectRatio;
      }
      
      return { width: Math.round(newWidth), height: Math.round(newHeight) };
    };
    
    const scaleToFill = (originalWidth, originalHeight, targetWidth, targetHeight) => {
      const scaleX = targetWidth / originalWidth;
      const scaleY = targetHeight / originalHeight;
      const scale = Math.max(scaleX, scaleY);
      
      return {
        width: Math.round(originalWidth * scale),
        height: Math.round(originalHeight * scale)
      };
    };
    
    const cropToAspectRatio = (width, height, targetRatio) => {
      const currentRatio = width / height;
      
      if (currentRatio > targetRatio) {
        // Too wide, crop width
        const newWidth = height * targetRatio;
        return { width: Math.round(newWidth), height, x: Math.round((width - newWidth) / 2), y: 0 };
      } else {
        // Too tall, crop height
        const newHeight = width / targetRatio;
        return { width, height: Math.round(newHeight), x: 0, y: Math.round((height - newHeight) / 2) };
      }
    };

    expect(calculateAspectRatio(1920, 1080)).toBeCloseTo(1.778, 3);
    expect(scaleToFit(1920, 1080, 800, 600)).toEqual({ width: 800, height: 450 });
    expect(scaleToFill(800, 600, 1920, 1080)).toEqual({ width: 1920, height: 1440 });
    expect(cropToAspectRatio(1920, 1080, 1)).toEqual({ width: 1080, height: 1080, x: 420, y: 0 });
  });

  test('should handle image format and metadata', () => {
    const getImageFormat = (filename) => {
      const ext = filename.split('.').pop().toLowerCase();
      const formats = {
        'jpg': 'JPEG',
        'jpeg': 'JPEG',
        'png': 'PNG',
        'gif': 'GIF',
        'bmp': 'BMP',
        'webp': 'WebP',
        'svg': 'SVG'
      };
      return formats[ext] || 'Unknown';
    };
    
    const calculateFileSize = (width, height, bitsPerPixel = 24) => {
      const pixels = width * height;
      const bytes = (pixels * bitsPerPixel) / 8;
      return Math.round(bytes);
    };
    
    const formatFileSize = (bytes) => {
      const units = ['B', 'KB', 'MB', 'GB'];
      let size = bytes;
      let unitIndex = 0;
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      
      return `${size.toFixed(2)} ${units[unitIndex]}`;
    };
    
    const estimateCompressionRatio = (format, quality = 0.8) => {
      const ratios = {
        'JPEG': quality * 0.1,
        'PNG': 0.5,
        'WebP': quality * 0.08,
        'GIF': 0.3,
        'BMP': 1.0
      };
      return ratios[format] || 0.5;
    };

    expect(getImageFormat('photo.jpg')).toBe('JPEG');
    expect(getImageFormat('logo.png')).toBe('PNG');
    expect(calculateFileSize(1920, 1080)).toBe(6220800);
    expect(formatFileSize(6220800)).toBe('5.93 MB');
    expect(estimateCompressionRatio('JPEG')).toBe(0.08);
  });

  test('should handle image filters and effects', () => {
    const applyBrightness = (imageData, factor) => {
      return imageData.map(pixel => ({
        r: Math.min(255, Math.max(0, pixel.r * factor)),
        g: Math.min(255, Math.max(0, pixel.g * factor)),
        b: Math.min(255, Math.max(0, pixel.b * factor)),
        a: pixel.a || 255
      }));
    };
    
    const applyContrast = (imageData, factor) => {
      const adjust = (value) => {
        const normalized = value / 255;
        const contrasted = ((normalized - 0.5) * factor) + 0.5;
        return Math.min(255, Math.max(0, contrasted * 255));
      };
      
      return imageData.map(pixel => ({
        r: adjust(pixel.r),
        g: adjust(pixel.g),
        b: adjust(pixel.b),
        a: pixel.a || 255
      }));
    };
    
    const applyGrayscale = (imageData) => {
      return imageData.map(pixel => {
        const gray = Math.round(0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b);
        return { r: gray, g: gray, b: gray, a: pixel.a || 255 };
      });
    };
    
    const applySepia = (imageData) => {
      return imageData.map(pixel => ({
        r: Math.min(255, Math.round(pixel.r * 0.393 + pixel.g * 0.769 + pixel.b * 0.189)),
        g: Math.min(255, Math.round(pixel.r * 0.349 + pixel.g * 0.686 + pixel.b * 0.168)),
        b: Math.min(255, Math.round(pixel.r * 0.272 + pixel.g * 0.534 + pixel.b * 0.131)),
        a: pixel.a || 255
      }));
    };

    const testPixel = [{ r: 128, g: 64, b: 192 }];
    
    const brightened = applyBrightness(testPixel, 1.5);
    expect(brightened[0].r).toBe(192);
    
    const contrasted = applyContrast(testPixel, 2);
    expect(contrasted[0].r).toBeCloseTo(128, 0);
    
    const grayscale = applyGrayscale(testPixel);
    expect(grayscale[0].r).toBe(grayscale[0].g);
    expect(grayscale[0].g).toBe(grayscale[0].b);
    
    const sepia = applySepia(testPixel);
    expect(sepia[0].r).toBeGreaterThan(sepia[0].g);
    expect(sepia[0].g).toBeGreaterThan(sepia[0].b);
  });

  test('should handle image transformations', () => {
    const rotatePoint = (x, y, centerX, centerY, angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const dx = x - centerX;
      const dy = y - centerY;
      
      return {
        x: centerX + dx * cos - dy * sin,
        y: centerY + dx * sin + dy * cos
      };
    };
    
    const flipHorizontal = (width, height, getPixel) => {
      return (x, y) => getPixel(width - 1 - x, y);
    };
    
    const flipVertical = (width, height, getPixel) => {
      return (x, y) => getPixel(x, height - 1 - y);
    };
    
    const translateImage = (dx, dy, getPixel) => {
      return (x, y) => getPixel(x - dx, y - dy);
    };
    
    const scaleImage = (scaleX, scaleY, getPixel) => {
      return (x, y) => getPixel(Math.floor(x / scaleX), Math.floor(y / scaleY));
    };

    const rotated = rotatePoint(10, 0, 0, 0, Math.PI / 2);
    expect(rotated.x).toBeCloseTo(0, 5);
    expect(rotated.y).toBeCloseTo(10, 5);
    
    const mockGetPixel = (x, y) => ({ r: x, g: y, b: 0 });
    
    const flippedH = flipHorizontal(100, 50, mockGetPixel);
    expect(flippedH(10, 20)).toEqual({ r: 89, g: 20, b: 0 });
    
    const flippedV = flipVertical(100, 50, mockGetPixel);
    expect(flippedV(10, 20)).toEqual({ r: 10, g: 29, b: 0 });
    
    const translated = translateImage(5, 3, mockGetPixel);
    expect(translated(10, 20)).toEqual({ r: 5, g: 17, b: 0 });
  });

  test('should handle image histogram and analysis', () => {
    const calculateHistogram = (imageData, channel = 'r') => {
      const histogram = new Array(256).fill(0);
      
      imageData.forEach(pixel => {
        const value = pixel[channel];
        if (value >= 0 && value <= 255) {
          histogram[value]++;
        }
      });
      
      return histogram;
    };
    
    const calculateMean = (histogram) => {
      let sum = 0;
      let count = 0;
      
      histogram.forEach((freq, value) => {
        sum += value * freq;
        count += freq;
      });
      
      return count > 0 ? sum / count : 0;
    };
    
    const calculateVariance = (histogram, mean) => {
      let sum = 0;
      let count = 0;
      
      histogram.forEach((freq, value) => {
        sum += freq * Math.pow(value - mean, 2);
        count += freq;
      });
      
      return count > 0 ? sum / count : 0;
    };
    
    const isLowContrast = (histogram, threshold = 0.1) => {
      const total = histogram.reduce((sum, freq) => sum + freq, 0);
      const range = 256;
      const expectedFreq = total / range;
      
      let significantBins = 0;
      histogram.forEach(freq => {
        if (freq > expectedFreq * threshold) {
          significantBins++;
        }
      });
      
      return significantBins < range * 0.3;
    };

    const testData = [
      { r: 100, g: 150, b: 200 },
      { r: 100, g: 100, b: 100 },
      { r: 200, g: 50, b: 75 }
    ];
    
    const histogram = calculateHistogram(testData, 'r');
    expect(histogram[100]).toBe(2);
    expect(histogram[200]).toBe(1);
    
    const mean = calculateMean(histogram);
    expect(mean).toBeCloseTo(133.33, 2);
    
    const variance = calculateVariance(histogram, mean);
    expect(variance).toBeGreaterThan(0);
    
    const lowContrastHist = new Array(256).fill(0);
    lowContrastHist[128] = 100;
    expect(isLowContrast(lowContrastHist)).toBe(true);
  });

  test('should handle image compression simulation', () => {
    const simulateJPEGCompression = (imageData, quality) => {
      const compressionFactor = 1 - (quality / 100);
      
      return imageData.map(pixel => {
        const noise = () => (Math.random() - 0.5) * compressionFactor * 20;
        
        return {
          r: Math.min(255, Math.max(0, Math.round(pixel.r + noise()))),
          g: Math.min(255, Math.max(0, Math.round(pixel.g + noise()))),
          b: Math.min(255, Math.max(0, Math.round(pixel.b + noise()))),
          a: pixel.a || 255
        };
      });
    };
    
    const calculatePSNR = (original, compressed) => {
      let mse = 0;
      const n = original.length;
      
      for (let i = 0; i < n; i++) {
        const dr = original[i].r - compressed[i].r;
        const dg = original[i].g - compressed[i].g;
        const db = original[i].b - compressed[i].b;
        mse += (dr * dr + dg * dg + db * db) / 3;
      }
      
      mse /= n;
      
      if (mse === 0) return Infinity;
      return 20 * Math.log10(255 / Math.sqrt(mse));
    };
    
    const estimateCompressionSize = (width, height, format, quality = 80) => {
      const baseSize = width * height * 3; // RGB
      
      const compressionRatios = {
        'JPEG': quality / 100 * 0.1,
        'PNG': 0.5,
        'WebP': quality / 100 * 0.08
      };
      
      return Math.round(baseSize * (compressionRatios[format] || 0.5));
    };

    const original = [{ r: 128, g: 64, b: 192 }];
    const compressed = simulateJPEGCompression(original, 50);
    
    expect(compressed).toHaveLength(1);
    expect(compressed[0].r).toBeGreaterThanOrEqual(0);
    expect(compressed[0].r).toBeLessThanOrEqual(255);
    
    const psnr = calculatePSNR(original, original);
    expect(psnr).toBe(Infinity);
    
    expect(estimateCompressionSize(1920, 1080, 'JPEG', 80)).toBe(497664);
  });

  test('should handle color quantization', () => {
    const quantizeColor = (color, levels) => {
      const step = 256 / levels;
      
      return {
        r: Math.floor(color.r / step) * step,
        g: Math.floor(color.g / step) * step,
        b: Math.floor(color.b / step) * step,
        a: color.a || 255
      };
    };
    
    const extractPalette = (imageData, maxColors = 16) => {
      const colorMap = new Map();
      
      imageData.forEach(pixel => {
        const key = `${pixel.r},${pixel.g},${pixel.b}`;
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
      });
      
      return Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxColors)
        .map(([key]) => {
          const [r, g, b] = key.split(',').map(Number);
          return { r, g, b };
        });
    };
    
    const findNearestColor = (color, palette) => {
      let nearest = palette[0];
      let minDistance = Infinity;
      
      palette.forEach(paletteColor => {
        const dr = color.r - paletteColor.r;
        const dg = color.g - paletteColor.g;
        const db = color.b - paletteColor.b;
        const distance = dr * dr + dg * dg + db * db;
        
        if (distance < minDistance) {
          minDistance = distance;
          nearest = paletteColor;
        }
      });
      
      return nearest;
    };

    const color = { r: 127, g: 63, b: 191 };
    const quantized = quantizeColor(color, 8);
    
    expect(quantized.r).toBe(96);
    expect(quantized.g).toBe(32);
    expect(quantized.b).toBe(160);
    
    const testData = [
      { r: 255, g: 0, b: 0 },
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 }
    ];
    
    const palette = extractPalette(testData, 3);
    expect(palette).toHaveLength(3);
    expect(palette[0]).toEqual({ r: 255, g: 0, b: 0 });
    
    const nearest = findNearestColor({ r: 250, g: 10, b: 10 }, palette);
    expect(nearest).toEqual({ r: 255, g: 0, b: 0 });
  });
});
