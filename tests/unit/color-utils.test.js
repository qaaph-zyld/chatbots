/**
 * Color Utilities Unit Tests
 */

describe('Color Utilities', () => {
  test('should handle RGB color operations', () => {
    const createRGB = (r, g, b) => ({ r, g, b });
    
    const rgbToHex = (rgb) => {
      const toHex = (c) => {
        const hex = Math.round(c).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
    };
    
    const hexToRGB = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    const rgbToGrayscale = (rgb) => {
      const gray = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
      return { r: gray, g: gray, b: gray };
    };

    const red = createRGB(255, 0, 0);
    expect(rgbToHex(red)).toBe('#ff0000');
    expect(hexToRGB('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(rgbToGrayscale({ r: 100, g: 150, b: 200 })).toEqual({ r: 137, g: 137, b: 137 });
  });

  test('should handle HSL color operations', () => {
    const rgbToHSL = (rgb) => {
      const r = rgb.r / 255;
      const g = rgb.g / 255;
      const b = rgb.b / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      
      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      
      return { h: h * 360, s: s * 100, l: l * 100 };
    };
    
    const hslToRGB = (hsl) => {
      const h = hsl.h / 360;
      const s = hsl.s / 100;
      const l = hsl.l / 100;
      
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      let r, g, b;
      
      if (s === 0) {
        r = g = b = l;
      } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      
      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      };
    };

    const rgb = { r: 255, g: 0, 0 };
    const hsl = rgbToHSL(rgb);
    expect(hsl.h).toBeCloseTo(0, 1);
    expect(hsl.s).toBeCloseTo(100, 1);
    expect(hsl.l).toBeCloseTo(50, 1);
    
    const backToRGB = hslToRGB(hsl);
    expect(backToRGB.r).toBe(255);
    expect(backToRGB.g).toBe(0);
    expect(backToRGB.b).toBe(0);
  });

  test('should handle color mixing and blending', () => {
    const mixColors = (color1, color2, ratio = 0.5) => {
      return {
        r: Math.round(color1.r * (1 - ratio) + color2.r * ratio),
        g: Math.round(color1.g * (1 - ratio) + color2.g * ratio),
        b: Math.round(color1.b * (1 - ratio) + color2.b * ratio)
      };
    };
    
    const addColors = (color1, color2) => {
      return {
        r: Math.min(255, color1.r + color2.r),
        g: Math.min(255, color1.g + color2.g),
        b: Math.min(255, color1.b + color2.b)
      };
    };
    
    const multiplyColors = (color1, color2) => {
      return {
        r: Math.round((color1.r * color2.r) / 255),
        g: Math.round((color1.g * color2.g) / 255),
        b: Math.round((color1.b * color2.b) / 255)
      };
    };
    
    const invertColor = (color) => {
      return {
        r: 255 - color.r,
        g: 255 - color.g,
        b: 255 - color.b
      };
    };

    const red = { r: 255, g: 0, b: 0 };
    const blue = { r: 0, g: 0, b: 255 };
    
    expect(mixColors(red, blue)).toEqual({ r: 128, g: 0, b: 128 });
    expect(addColors(red, blue)).toEqual({ r: 255, g: 0, b: 255 });
    expect(multiplyColors({ r: 128, g: 64, b: 32 }, { r: 128, g: 128, b: 128 })).toEqual({ r: 64, g: 32, b: 16 });
    expect(invertColor({ r: 100, g: 150, b: 200 })).toEqual({ r: 155, g: 105, b: 55 });
  });

  test('should handle color brightness and contrast', () => {
    const brightness = (color) => {
      return (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
    };
    
    const adjustBrightness = (color, factor) => {
      return {
        r: Math.min(255, Math.max(0, Math.round(color.r * factor))),
        g: Math.min(255, Math.max(0, Math.round(color.g * factor))),
        b: Math.min(255, Math.max(0, Math.round(color.b * factor)))
      };
    };
    
    const contrast = (color1, color2) => {
      const l1 = brightness(color1) / 255;
      const l2 = brightness(color2) / 255;
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    };
    
    const isLightColor = (color) => {
      return brightness(color) > 127.5;
    };

    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };
    const gray = { r: 128, g: 128, b: 128 };
    
    expect(brightness(white)).toBe(255);
    expect(brightness(black)).toBe(0);
    expect(adjustBrightness(gray, 1.5)).toEqual({ r: 192, g: 192, b: 192 });
    expect(contrast(white, black)).toBeCloseTo(21, 0);
    expect(isLightColor(white)).toBe(true);
    expect(isLightColor(black)).toBe(false);
  });

  test('should handle color palettes', () => {
    const complementaryColor = (hsl) => {
      return {
        h: (hsl.h + 180) % 360,
        s: hsl.s,
        l: hsl.l
      };
    };
    
    const analogousColors = (hsl, angle = 30) => {
      return [
        { h: (hsl.h - angle + 360) % 360, s: hsl.s, l: hsl.l },
        hsl,
        { h: (hsl.h + angle) % 360, s: hsl.s, l: hsl.l }
      ];
    };
    
    const triadicColors = (hsl) => {
      return [
        hsl,
        { h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l },
        { h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l }
      ];
    };

    const baseColor = { h: 0, s: 100, l: 50 };
    const complement = complementaryColor(baseColor);
    expect(complement.h).toBe(180);
    
    const analogous = analogousColors(baseColor);
    expect(analogous).toHaveLength(3);
    expect(analogous[0].h).toBe(330);
    expect(analogous[2].h).toBe(30);
    
    const triadic = triadicColors(baseColor);
    expect(triadic[1].h).toBe(120);
    expect(triadic[2].h).toBe(240);
  });

  test('should handle color distance and similarity', () => {
    const colorDistance = (color1, color2) => {
      const dr = color1.r - color2.r;
      const dg = color1.g - color2.g;
      const db = color1.b - color2.b;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    };
    
    const colorSimilarity = (color1, color2) => {
      const maxDistance = Math.sqrt(3 * 255 * 255);
      const distance = colorDistance(color1, color2);
      return 1 - (distance / maxDistance);
    };
    
    const findClosestColor = (targetColor, palette) => {
      let closest = palette[0];
      let minDistance = colorDistance(targetColor, closest);
      
      palette.forEach(color => {
        const distance = colorDistance(targetColor, color);
        if (distance < minDistance) {
          minDistance = distance;
          closest = color;
        }
      });
      
      return closest;
    };

    const red = { r: 255, g: 0, b: 0 };
    const darkRed = { r: 200, g: 0, b: 0 };
    const blue = { r: 0, g: 0, b: 255 };
    
    expect(colorDistance(red, darkRed)).toBe(55);
    expect(colorSimilarity(red, darkRed)).toBeCloseTo(0.87, 2);
    
    const palette = [red, blue, { r: 0, g: 255, b: 0 }];
    const target = { r: 250, g: 10, b: 10 };
    expect(findClosestColor(target, palette)).toEqual(red);
  });
});
