/**
 * Text Processing Utilities Unit Tests
 */

describe('Text Processing Utilities', () => {
  test('should handle text normalization', () => {
    const normalizeWhitespace = (text) => {
      return text.replace(/\s+/g, ' ').trim();
    };
    
    const removeAccents = (text) => {
      return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };
    
    const normalizeCase = (text, caseType = 'lower') => {
      switch (caseType) {
        case 'upper': return text.toUpperCase();
        case 'lower': return text.toLowerCase();
        case 'title': return text.replace(/\w\S*/g, txt => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        case 'sentence': return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        default: return text;
      }
    };
    
    const removePunctuation = (text, keepSpaces = true) => {
      const regex = keepSpaces ? /[^\w\s]/g : /[^\w]/g;
      return text.replace(regex, '');
    };

    expect(normalizeWhitespace('  hello   world  ')).toBe('hello world');
    expect(removeAccents('café naïve résumé')).toBe('cafe naive resume');
    expect(normalizeCase('hello WORLD', 'title')).toBe('Hello World');
    expect(normalizeCase('hello world', 'sentence')).toBe('Hello world');
    expect(removePunctuation('Hello, world!')).toBe('Hello world');
    expect(removePunctuation('Hello, world!', false)).toBe('Helloworld');
  });

  test('should handle text tokenization', () => {
    const tokenizeWords = (text) => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 0);
    };
    
    const tokenizeSentences = (text) => {
      return text
        .split(/[.!?]+/)
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 0);
    };
    
    const tokenizeParagraphs = (text) => {
      return text
        .split(/\n\s*\n/)
        .map(paragraph => paragraph.trim())
        .filter(paragraph => paragraph.length > 0);
    };
    
    const extractHashtags = (text) => {
      const matches = text.match(/#\w+/g);
      return matches ? matches.map(tag => tag.toLowerCase()) : [];
    };
    
    const extractMentions = (text) => {
      const matches = text.match(/@\w+/g);
      return matches ? matches.map(mention => mention.toLowerCase()) : [];
    };

    expect(tokenizeWords('Hello, world! How are you?')).toEqual(['hello', 'world', 'how', 'are', 'you']);
    expect(tokenizeSentences('Hello world. How are you? Fine!')).toEqual(['Hello world', 'How are you', 'Fine']);
    expect(tokenizeParagraphs('Para 1\n\nPara 2\n\nPara 3')).toEqual(['Para 1', 'Para 2', 'Para 3']);
    expect(extractHashtags('Check out #javascript and #nodejs')).toEqual(['#javascript', '#nodejs']);
    expect(extractMentions('Hello @john and @jane')).toEqual(['@john', '@jane']);
  });

  test('should handle text statistics', () => {
    const countWords = (text) => {
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };
    
    const countCharacters = (text, includeSpaces = true) => {
      return includeSpaces ? text.length : text.replace(/\s/g, '').length;
    };
    
    const countSentences = (text) => {
      return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
    };
    
    const countParagraphs = (text) => {
      return text.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0).length;
    };
    
    const calculateReadingTime = (text, wordsPerMinute = 200) => {
      const wordCount = countWords(text);
      return Math.ceil(wordCount / wordsPerMinute);
    };
    
    const getWordFrequency = (text) => {
      const words = text.toLowerCase().match(/\b\w+\b/g) || [];
      const frequency = {};
      
      words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
      });
      
      return frequency;
    };

    const sampleText = 'Hello world. This is a test. How are you?';
    
    expect(countWords(sampleText)).toBe(9);
    expect(countCharacters(sampleText)).toBe(39);
    expect(countCharacters(sampleText, false)).toBe(31);
    expect(countSentences(sampleText)).toBe(3);
    expect(calculateReadingTime('word '.repeat(400))).toBe(2);
    
    const freq = getWordFrequency('hello world hello');
    expect(freq.hello).toBe(2);
    expect(freq.world).toBe(1);
  });

  test('should handle text similarity', () => {
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
    
    const jaccardSimilarity = (text1, text2) => {
      const words1 = new Set(text1.toLowerCase().match(/\b\w+\b/g) || []);
      const words2 = new Set(text2.toLowerCase().match(/\b\w+\b/g) || []);
      
      const intersection = new Set([...words1].filter(word => words2.has(word)));
      const union = new Set([...words1, ...words2]);
      
      return union.size === 0 ? 0 : intersection.size / union.size;
    };
    
    const cosineSimilarity = (text1, text2) => {
      const getWordVector = (text) => {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const vector = {};
        words.forEach(word => {
          vector[word] = (vector[word] || 0) + 1;
        });
        return vector;
      };
      
      const vector1 = getWordVector(text1);
      const vector2 = getWordVector(text2);
      
      const allWords = new Set([...Object.keys(vector1), ...Object.keys(vector2)]);
      
      let dotProduct = 0;
      let magnitude1 = 0;
      let magnitude2 = 0;
      
      allWords.forEach(word => {
        const val1 = vector1[word] || 0;
        const val2 = vector2[word] || 0;
        
        dotProduct += val1 * val2;
        magnitude1 += val1 * val1;
        magnitude2 += val2 * val2;
      });
      
      const magnitude = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
      return magnitude === 0 ? 0 : dotProduct / magnitude;
    };

    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
    
    expect(jaccardSimilarity('hello world', 'hello universe')).toBeCloseTo(0.33, 2);
    expect(jaccardSimilarity('same text', 'same text')).toBe(1);
    
    expect(cosineSimilarity('hello world', 'hello universe')).toBeCloseTo(0.5, 1);
    expect(cosineSimilarity('identical text', 'identical text')).toBe(1);
  });

  test('should handle text formatting', () => {
    const wrapText = (text, width) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      
      words.forEach(word => {
        if ((currentLine + word).length <= width) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      
      if (currentLine) lines.push(currentLine);
      return lines;
    };
    
    const truncateText = (text, maxLength, suffix = '...') => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - suffix.length) + suffix;
    };
    
    const padText = (text, length, char = ' ', align = 'left') => {
      if (text.length >= length) return text;
      
      const padding = char.repeat(length - text.length);
      
      switch (align) {
        case 'right': return padding + text;
        case 'center': 
          const leftPad = Math.floor(padding.length / 2);
          const rightPad = padding.length - leftPad;
          return char.repeat(leftPad) + text + char.repeat(rightPad);
        default: return text + padding;
      }
    };
    
    const indentText = (text, spaces = 2) => {
      const indent = ' '.repeat(spaces);
      return text.split('\n').map(line => indent + line).join('\n');
    };

    expect(wrapText('hello world test', 10)).toEqual(['hello', 'world test']);
    expect(truncateText('hello world', 8)).toBe('hello...');
    expect(truncateText('hello', 10)).toBe('hello');
    expect(padText('hello', 10, '-', 'right')).toBe('-----hello');
    expect(padText('hello', 10, '-', 'center')).toBe('--hello---');
    expect(indentText('line1\nline2', 4)).toBe('    line1\n    line2');
  });

  test('should handle text search and replace', () => {
    const findAllOccurrences = (text, pattern, caseSensitive = true) => {
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(pattern, flags);
      const matches = [];
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          length: match[0].length
        });
      }
      
      return matches;
    };
    
    const replaceMultiple = (text, replacements) => {
      let result = text;
      
      Object.entries(replacements).forEach(([search, replace]) => {
        result = result.replace(new RegExp(search, 'g'), replace);
      });
      
      return result;
    };
    
    const highlightText = (text, terms, highlightTag = 'mark') => {
      let result = text;
      
      terms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        result = result.replace(regex, `<${highlightTag}>$1</${highlightTag}>`);
      });
      
      return result;
    };
    
    const extractBetween = (text, startDelimiter, endDelimiter) => {
      const results = [];
      let startIndex = 0;
      
      while (true) {
        const start = text.indexOf(startDelimiter, startIndex);
        if (start === -1) break;
        
        const end = text.indexOf(endDelimiter, start + startDelimiter.length);
        if (end === -1) break;
        
        results.push(text.substring(start + startDelimiter.length, end));
        startIndex = end + endDelimiter.length;
      }
      
      return results;
    };

    const text = 'Hello world, hello universe';
    const occurrences = findAllOccurrences(text, 'hello', false);
    expect(occurrences).toHaveLength(2);
    expect(occurrences[0].index).toBe(0);
    expect(occurrences[1].index).toBe(13);
    
    const replaced = replaceMultiple('hello world', { 'hello': 'hi', 'world': 'universe' });
    expect(replaced).toBe('hi universe');
    
    const highlighted = highlightText('hello world', ['hello']);
    expect(highlighted).toBe('<mark>hello</mark> world');
    
    const extracted = extractBetween('(test) and (another)', '(', ')');
    expect(extracted).toEqual(['test', 'another']);
  });

  test('should handle text validation', () => {
    const isEmail = (text) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(text);
    };
    
    const isURL = (text) => {
      try {
        new URL(text);
        return true;
      } catch {
        return false;
      }
    };
    
    const isPhoneNumber = (text) => {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      return phoneRegex.test(text.replace(/\s/g, ''));
    };
    
    const containsProfanity = (text, profanityList = ['bad', 'evil']) => {
      const words = text.toLowerCase().split(/\s+/);
      return profanityList.some(profanity => 
        words.some(word => word.includes(profanity.toLowerCase()))
      );
    };
    
    const isStrongPassword = (password) => {
      const checks = {
        minLength: password.length >= 8,
        hasUpper: /[A-Z]/.test(password),
        hasLower: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      };
      
      const passedChecks = Object.values(checks).filter(Boolean).length;
      return { strong: passedChecks >= 4, checks };
    };

    expect(isEmail('test@example.com')).toBe(true);
    expect(isEmail('invalid-email')).toBe(false);
    
    expect(isURL('https://example.com')).toBe(true);
    expect(isURL('not-a-url')).toBe(false);
    
    expect(isPhoneNumber('+1 (555) 123-4567')).toBe(true);
    expect(isPhoneNumber('123')).toBe(false);
    
    expect(containsProfanity('this is bad text')).toBe(true);
    expect(containsProfanity('this is good text')).toBe(false);
    
    const strongResult = isStrongPassword('StrongPass123!');
    expect(strongResult.strong).toBe(true);
    
    const weakResult = isStrongPassword('weak');
    expect(weakResult.strong).toBe(false);
  });
});
