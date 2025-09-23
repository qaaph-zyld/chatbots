/**
 * Serialization Utilities Unit Tests
 */

describe('Serialization Utilities', () => {
  test('should handle JSON serialization with custom types', () => {
    const serializer = {
      serialize: (obj) => {
        return JSON.stringify(obj, (key, value) => {
          if (value instanceof Date) {
            return { __type: 'Date', value: value.toISOString() };
          }
          if (value instanceof RegExp) {
            return { __type: 'RegExp', source: value.source, flags: value.flags };
          }
          if (value instanceof Set) {
            return { __type: 'Set', value: Array.from(value) };
          }
          if (value instanceof Map) {
            return { __type: 'Map', value: Array.from(value.entries()) };
          }
          return value;
        });
      },
      
      deserialize: (str) => {
        return JSON.parse(str, (key, value) => {
          if (value && typeof value === 'object' && value.__type) {
            switch (value.__type) {
              case 'Date':
                return new Date(value.value);
              case 'RegExp':
                return new RegExp(value.source, value.flags);
              case 'Set':
                return new Set(value.value);
              case 'Map':
                return new Map(value.value);
            }
          }
          return value;
        });
      }
    };

    const original = {
      date: new Date('2023-01-01'),
      regex: /test/gi,
      set: new Set([1, 2, 3]),
      map: new Map([['a', 1], ['b', 2]])
    };

    const serialized = serializer.serialize(original);
    const deserialized = serializer.deserialize(serialized);

    expect(deserialized.date instanceof Date).toBe(true);
    expect(deserialized.regex instanceof RegExp).toBe(true);
    expect(deserialized.set instanceof Set).toBe(true);
    expect(deserialized.map instanceof Map).toBe(true);
  });

  test('should handle binary serialization simulation', () => {
    const binarySerializer = {
      serialize: (data) => {
        const buffer = [];
        
        const writeString = (str) => {
          const bytes = new TextEncoder().encode(str);
          buffer.push(bytes.length);
          buffer.push(...bytes);
        };
        
        const writeNumber = (num) => {
          const view = new DataView(new ArrayBuffer(8));
          view.setFloat64(0, num);
          for (let i = 0; i < 8; i++) {
            buffer.push(view.getUint8(i));
          }
        };
        
        const writeValue = (value) => {
          if (typeof value === 'string') {
            buffer.push(1); // String type
            writeString(value);
          } else if (typeof value === 'number') {
            buffer.push(2); // Number type
            writeNumber(value);
          } else if (typeof value === 'boolean') {
            buffer.push(3); // Boolean type
            buffer.push(value ? 1 : 0);
          } else if (value === null) {
            buffer.push(4); // Null type
          }
        };
        
        writeValue(data);
        return new Uint8Array(buffer);
      },
      
      deserialize: (bytes) => {
        let offset = 0;
        
        const readString = () => {
          const length = bytes[offset++];
          const stringBytes = bytes.slice(offset, offset + length);
          offset += length;
          return new TextDecoder().decode(stringBytes);
        };
        
        const readNumber = () => {
          const buffer = new ArrayBuffer(8);
          const view = new DataView(buffer);
          for (let i = 0; i < 8; i++) {
            view.setUint8(i, bytes[offset++]);
          }
          return view.getFloat64(0);
        };
        
        const readValue = () => {
          const type = bytes[offset++];
          switch (type) {
            case 1: return readString();
            case 2: return readNumber();
            case 3: return bytes[offset++] === 1;
            case 4: return null;
            default: throw new Error('Unknown type');
          }
        };
        
        return readValue();
      }
    };

    expect(binarySerializer.deserialize(binarySerializer.serialize('hello'))).toBe('hello');
    expect(binarySerializer.deserialize(binarySerializer.serialize(42.5))).toBe(42.5);
    expect(binarySerializer.deserialize(binarySerializer.serialize(true))).toBe(true);
    expect(binarySerializer.deserialize(binarySerializer.serialize(null))).toBe(null);
  });

  test('should handle XML-like serialization', () => {
    const xmlSerializer = {
      serialize: (obj, rootTag = 'root') => {
        const escapeXml = (str) => {
          return str.replace(/[<>&'"]/g, (char) => {
            switch (char) {
              case '<': return '&lt;';
              case '>': return '&gt;';
              case '&': return '&amp;';
              case "'": return '&apos;';
              case '"': return '&quot;';
              default: return char;
            }
          });
        };
        
        const serializeValue = (value, tag) => {
          if (value === null || value === undefined) {
            return `<${tag}></${tag}>`;
          }
          
          if (typeof value === 'object' && !Array.isArray(value)) {
            const children = Object.entries(value)
              .map(([key, val]) => serializeValue(val, key))
              .join('');
            return `<${tag}>${children}</${tag}>`;
          }
          
          if (Array.isArray(value)) {
            const items = value
              .map(item => serializeValue(item, 'item'))
              .join('');
            return `<${tag}>${items}</${tag}>`;
          }
          
          return `<${tag}>${escapeXml(String(value))}</${tag}>`;
        };
        
        return `<?xml version="1.0"?>${serializeValue(obj, rootTag)}`;
      },
      
      deserialize: (xml) => {
        // Simple XML parser for basic structures
        const parseTag = (str, startIndex = 0) => {
          const tagStart = str.indexOf('<', startIndex);
          const tagEnd = str.indexOf('>', tagStart);
          const tagName = str.slice(tagStart + 1, tagEnd);
          
          if (tagName.startsWith('/')) return null;
          
          const closeTag = `</${tagName}>`;
          const closeIndex = str.indexOf(closeTag, tagEnd);
          const content = str.slice(tagEnd + 1, closeIndex);
          
          return { tagName, content, endIndex: closeIndex + closeTag.length };
        };
        
        const parse = (content) => {
          if (!content.includes('<')) {
            return content;
          }
          
          const result = {};
          let index = 0;
          
          while (index < content.length) {
            const tag = parseTag(content, index);
            if (!tag) break;
            
            result[tag.tagName] = parse(tag.content);
            index = tag.endIndex;
          }
          
          return result;
        };
        
        const rootMatch = xml.match(/<(\w+)>(.*)<\/\1>/s);
        if (rootMatch) {
          return parse(rootMatch[2]);
        }
        
        return null;
      }
    };

    const data = {
      name: 'John',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'Anytown'
      }
    };

    const xml = xmlSerializer.serialize(data, 'person');
    expect(xml).toContain('<person>');
    expect(xml).toContain('<name>John</name>');
    
    const parsed = xmlSerializer.deserialize(xml);
    expect(parsed.name).toBe('John');
    expect(parsed.address.city).toBe('Anytown');
  });

  test('should handle CSV serialization', () => {
    const csvSerializer = {
      serialize: (data, headers = null) => {
        if (!Array.isArray(data) || data.length === 0) {
          return '';
        }
        
        const actualHeaders = headers || Object.keys(data[0]);
        const escapeField = (field) => {
          const str = String(field);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };
        
        const headerRow = actualHeaders.map(escapeField).join(',');
        const dataRows = data.map(row => 
          actualHeaders.map(header => escapeField(row[header] || '')).join(',')
        );
        
        return [headerRow, ...dataRows].join('\n');
      },
      
      deserialize: (csv) => {
        const lines = csv.trim().split('\n');
        if (lines.length < 2) return [];
        
        const parseRow = (row) => {
          const fields = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
              if (inQuotes && row[i + 1] === '"') {
                current += '"';
                i++; // Skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              fields.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          
          fields.push(current);
          return fields;
        };
        
        const headers = parseRow(lines[0]);
        return lines.slice(1).map(line => {
          const values = parseRow(line);
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });
      }
    };

    const data = [
      { name: 'John Doe', age: 30, city: 'New York' },
      { name: 'Jane Smith', age: 25, city: 'Los Angeles' }
    ];

    const csv = csvSerializer.serialize(data);
    const parsed = csvSerializer.deserialize(csv);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].name).toBe('John Doe');
    expect(parsed[1].city).toBe('Los Angeles');
  });

  test('should handle URL encoding serialization', () => {
    const urlSerializer = {
      serialize: (obj) => {
        const params = new URLSearchParams();
        
        const flatten = (obj, prefix = '') => {
          Object.entries(obj).forEach(([key, value]) => {
            const fullKey = prefix ? `${prefix}[${key}]` : key;
            
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              flatten(value, fullKey);
            } else if (Array.isArray(value)) {
              value.forEach((item, index) => {
                if (typeof item === 'object') {
                  flatten(item, `${fullKey}[${index}]`);
                } else {
                  params.append(`${fullKey}[]`, String(item));
                }
              });
            } else {
              params.set(fullKey, String(value));
            }
          });
        };
        
        flatten(obj);
        return params.toString();
      },
      
      deserialize: (str) => {
        const params = new URLSearchParams(str);
        const result = {};
        
        for (const [key, value] of params) {
          const keys = key.split(/[\[\]]+/).filter(k => k);
          let current = result;
          
          for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!current[k]) {
              current[k] = isNaN(keys[i + 1]) ? {} : [];
            }
            current = current[k];
          }
          
          const lastKey = keys[keys.length - 1];
          if (Array.isArray(current)) {
            current.push(value);
          } else {
            current[lastKey] = value;
          }
        }
        
        return result;
      }
    };

    const data = {
      name: 'John',
      tags: ['javascript', 'testing'],
      meta: { version: '1.0', active: true }
    };

    const encoded = urlSerializer.serialize(data);
    const decoded = urlSerializer.deserialize(encoded);

    expect(decoded.name).toBe('John');
    expect(decoded.tags).toEqual(['javascript', 'testing']);
    expect(decoded.meta.version).toBe('1.0');
  });
});
