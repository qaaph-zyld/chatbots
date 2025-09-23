/**
 * Compression Utilities Unit Tests
 */

describe('Compression Utilities', () => {
  test('should handle simple string compression', () => {
    const simpleCompress = {
      compress: (str) => {
        if (!str) return '';
        
        let compressed = '';
        let count = 1;
        let current = str[0];
        
        for (let i = 1; i < str.length; i++) {
          if (str[i] === current) {
            count++;
          } else {
            compressed += count > 1 ? `${count}${current}` : current;
            current = str[i];
            count = 1;
          }
        }
        
        compressed += count > 1 ? `${count}${current}` : current;
        return compressed;
      },
      
      decompress: (compressed) => {
        if (!compressed) return '';
        
        let result = '';
        let i = 0;
        
        while (i < compressed.length) {
          let count = '';
          
          // Read digits
          while (i < compressed.length && /\d/.test(compressed[i])) {
            count += compressed[i];
            i++;
          }
          
          if (i < compressed.length) {
            const char = compressed[i];
            const repeatCount = count ? parseInt(count) : 1;
            result += char.repeat(repeatCount);
            i++;
          }
        }
        
        return result;
      }
    };

    expect(simpleCompress.compress('aaabbbccc')).toBe('3a3b3c');
    expect(simpleCompress.compress('abcdef')).toBe('abcdef');
    expect(simpleCompress.compress('aabbcc')).toBe('2a2b2c');
    
    expect(simpleCompress.decompress('3a3b3c')).toBe('aaabbbccc');
    expect(simpleCompress.decompress('abcdef')).toBe('abcdef');
    expect(simpleCompress.decompress('2a2b2c')).toBe('aabbcc');
  });

  test('should handle LZ77-like compression simulation', () => {
    const lz77Like = {
      compress: (str) => {
        const result = [];
        let i = 0;
        
        while (i < str.length) {
          let bestMatch = { length: 0, distance: 0 };
          
          // Look for matches in the previous 255 characters
          const searchStart = Math.max(0, i - 255);
          
          for (let j = searchStart; j < i; j++) {
            let matchLength = 0;
            
            while (
              i + matchLength < str.length &&
              j + matchLength < i &&
              str[j + matchLength] === str[i + matchLength]
            ) {
              matchLength++;
            }
            
            if (matchLength > bestMatch.length) {
              bestMatch = { length: matchLength, distance: i - j };
            }
          }
          
          if (bestMatch.length >= 3) {
            result.push({ type: 'match', distance: bestMatch.distance, length: bestMatch.length });
            i += bestMatch.length;
          } else {
            result.push({ type: 'literal', char: str[i] });
            i++;
          }
        }
        
        return result;
      },
      
      decompress: (compressed) => {
        let result = '';
        
        for (const token of compressed) {
          if (token.type === 'literal') {
            result += token.char;
          } else if (token.type === 'match') {
            const start = result.length - token.distance;
            for (let i = 0; i < token.length; i++) {
              result += result[start + i];
            }
          }
        }
        
        return result;
      }
    };

    const text = 'abcdefghijklmnopqrstuvwxyzabcdefghijk';
    const compressed = lz77Like.compress(text);
    const decompressed = lz77Like.decompress(compressed);
    
    expect(decompressed).toBe(text);
    
    // Check that compression found matches
    const hasMatches = compressed.some(token => token.type === 'match');
    expect(hasMatches).toBe(true);
  });

  test('should handle dictionary-based compression', () => {
    const dictionaryCompress = {
      buildDictionary: (texts) => {
        const wordCount = new Map();
        
        texts.forEach(text => {
          const words = text.toLowerCase().match(/\w+/g) || [];
          words.forEach(word => {
            wordCount.set(word, (wordCount.get(word) || 0) + 1);
          });
        });
        
        // Sort by frequency and assign codes
        const sortedWords = Array.from(wordCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 256); // Limit dictionary size
        
        const dictionary = new Map();
        sortedWords.forEach(([word], index) => {
          dictionary.set(word, index);
        });
        
        return dictionary;
      },
      
      compress: (text, dictionary) => {
        const tokens = [];
        const words = text.match(/\w+|\W+/g) || [];
        
        words.forEach(word => {
          const lowerWord = word.toLowerCase();
          if (dictionary.has(lowerWord) && /^\w+$/.test(word)) {
            tokens.push({ type: 'dict', code: dictionary.get(lowerWord), original: word });
          } else {
            tokens.push({ type: 'literal', text: word });
          }
        });
        
        return tokens;
      },
      
      decompress: (tokens, reverseDictionary) => {
        return tokens.map(token => {
          if (token.type === 'dict') {
            const dictWord = reverseDictionary.get(token.code);
            // Preserve original casing
            if (token.original === token.original.toUpperCase()) {
              return dictWord.toUpperCase();
            } else if (token.original[0] === token.original[0].toUpperCase()) {
              return dictWord.charAt(0).toUpperCase() + dictWord.slice(1);
            }
            return dictWord;
          }
          return token.text;
        }).join('');
      }
    };

    const texts = [
      'The quick brown fox jumps over the lazy dog',
      'The lazy dog sleeps under the quick brown fox',
      'A quick brown fox and a lazy dog are friends'
    ];
    
    const dictionary = dictionaryCompress.buildDictionary(texts);
    const reverseDictionary = new Map(Array.from(dictionary.entries()).map(([k, v]) => [v, k]));
    
    const text = texts[0];
    const compressed = dictionaryCompress.compress(text, dictionary);
    const decompressed = dictionaryCompress.decompress(compressed, reverseDictionary);
    
    expect(decompressed).toBe(text);
    
    // Check that common words were compressed
    const hasCompressedWords = compressed.some(token => token.type === 'dict');
    expect(hasCompressedWords).toBe(true);
  });

  test('should handle bit packing', () => {
    const bitPacker = {
      pack: (numbers, bitsPerNumber) => {
        const maxValue = (1 << bitsPerNumber) - 1;
        const packed = [];
        let currentByte = 0;
        let bitsInCurrentByte = 0;
        
        for (const num of numbers) {
          if (num > maxValue) {
            throw new Error(`Number ${num} exceeds ${bitsPerNumber} bits`);
          }
          
          let remainingBits = bitsPerNumber;
          let value = num;
          
          while (remainingBits > 0) {
            const bitsToTake = Math.min(remainingBits, 8 - bitsInCurrentByte);
            const mask = (1 << bitsToTake) - 1;
            const bits = (value >> (remainingBits - bitsToTake)) & mask;
            
            currentByte |= bits << (8 - bitsInCurrentByte - bitsToTake);
            bitsInCurrentByte += bitsToTake;
            remainingBits -= bitsToTake;
            
            if (bitsInCurrentByte === 8) {
              packed.push(currentByte);
              currentByte = 0;
              bitsInCurrentByte = 0;
            }
          }
        }
        
        if (bitsInCurrentByte > 0) {
          packed.push(currentByte);
        }
        
        return new Uint8Array(packed);
      },
      
      unpack: (packed, bitsPerNumber, count) => {
        const numbers = [];
        let bitOffset = 0;
        
        for (let i = 0; i < count; i++) {
          let value = 0;
          let bitsRemaining = bitsPerNumber;
          
          while (bitsRemaining > 0) {
            const byteIndex = Math.floor(bitOffset / 8);
            const bitInByte = bitOffset % 8;
            const bitsInThisByte = Math.min(bitsRemaining, 8 - bitInByte);
            
            const mask = ((1 << bitsInThisByte) - 1) << (8 - bitInByte - bitsInThisByte);
            const bits = (packed[byteIndex] & mask) >> (8 - bitInByte - bitsInThisByte);
            
            value = (value << bitsInThisByte) | bits;
            bitOffset += bitsInThisByte;
            bitsRemaining -= bitsInThisByte;
          }
          
          numbers.push(value);
        }
        
        return numbers;
      }
    };

    const numbers = [1, 3, 7, 15, 0, 2, 4, 8];
    const packed = bitPacker.pack(numbers, 4); // 4 bits per number
    const unpacked = bitPacker.unpack(packed, 4, numbers.length);
    
    expect(unpacked).toEqual(numbers);
    expect(packed.length).toBeLessThan(numbers.length); // Should be compressed
  });

  test('should handle frequency-based encoding simulation', () => {
    const frequencyEncoder = {
      buildFrequencyTable: (text) => {
        const frequency = new Map();
        
        for (const char of text) {
          frequency.set(char, (frequency.get(char) || 0) + 1);
        }
        
        return frequency;
      },
      
      buildCodes: (frequency) => {
        // Simple variable-length encoding based on frequency
        const sorted = Array.from(frequency.entries())
          .sort((a, b) => b[1] - a[1]);
        
        const codes = new Map();
        let codeLength = 1;
        let codesAtLength = 0;
        let maxCodesAtLength = 2;
        
        for (const [char] of sorted) {
          if (codesAtLength >= maxCodesAtLength) {
            codeLength++;
            maxCodesAtLength *= 2;
            codesAtLength = 0;
          }
          
          const code = codesAtLength.toString(2).padStart(codeLength, '0');
          codes.set(char, code);
          codesAtLength++;
        }
        
        return codes;
      },
      
      encode: (text, codes) => {
        return text.split('').map(char => codes.get(char)).join('');
      },
      
      decode: (encoded, reverseCodes) => {
        let result = '';
        let i = 0;
        
        while (i < encoded.length) {
          for (let len = 1; len <= encoded.length - i; len++) {
            const code = encoded.substr(i, len);
            if (reverseCodes.has(code)) {
              result += reverseCodes.get(code);
              i += len;
              break;
            }
          }
        }
        
        return result;
      }
    };

    const text = 'hello world hello';
    const frequency = frequencyEncoder.buildFrequencyTable(text);
    const codes = frequencyEncoder.buildCodes(frequency);
    const reverseCodes = new Map(Array.from(codes.entries()).map(([k, v]) => [v, k]));
    
    const encoded = frequencyEncoder.encode(text, codes);
    const decoded = frequencyEncoder.decode(encoded, reverseCodes);
    
    expect(decoded).toBe(text);
    
    // More frequent characters should have shorter codes
    const lCode = codes.get('l');
    const spaceCode = codes.get(' ');
    expect(lCode.length).toBeLessThanOrEqual(spaceCode.length);
  });
});
