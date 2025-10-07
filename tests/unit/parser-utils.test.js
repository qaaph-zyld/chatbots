/**
 * Parser Utilities Unit Tests
 */

describe('Parser Utilities', () => {
  test('should handle CSV parsing', () => {
    const parseCSV = (csvString, delimiter = ',') => {
      const lines = csvString.trim().split('\n');
      const headers = lines[0].split(delimiter).map(h => h.trim());
      
      return lines.slice(1).map(line => {
        const values = line.split(delimiter).map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });
    };

    const csvData = `name,age,city
John,25,New York
Jane,30,Los Angeles
Bob,35,Chicago`;

    const parsed = parseCSV(csvData);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toEqual({ name: 'John', age: '25', city: 'New York' });
  });

  test('should handle query string parsing', () => {
    const parseQueryString = (queryString) => {
      const params = {};
      const pairs = queryString.replace(/^\?/, '').split('&');
      
      pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
          params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
        }
      });
      
      return params;
    };

    const buildQueryString = (params) => {
      return Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    };

    const parsed = parseQueryString('?name=John%20Doe&age=25&active=true');
    expect(parsed).toEqual({ name: 'John Doe', age: '25', active: 'true' });

    const built = buildQueryString({ name: 'John Doe', age: 25 });
    expect(built).toBe('name=John%20Doe&age=25');
  });

  test('should handle simple expression parsing', () => {
    const parseExpression = (expr) => {
      // Simple calculator for basic arithmetic
      const tokens = expr.replace(/\s+/g, '').match(/\d+|[+\-*/()]/g);
      if (!tokens) return null;
      
      const evaluate = (tokens) => {
        const stack = [];
        const operators = [];
        
        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
        
        const applyOperator = () => {
          const b = stack.pop();
          const a = stack.pop();
          const op = operators.pop();
          
          switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return a / b;
            default: return 0;
          }
        };
        
        for (const token of tokens) {
          if (!isNaN(token)) {
            stack.push(Number(token));
          } else if (token === '(') {
            operators.push(token);
          } else if (token === ')') {
            while (operators.length && operators[operators.length - 1] !== '(') {
              stack.push(applyOperator());
            }
            operators.pop(); // Remove '('
          } else if (['+', '-', '*', '/'].includes(token)) {
            while (
              operators.length &&
              operators[operators.length - 1] !== '(' &&
              precedence[operators[operators.length - 1]] >= precedence[token]
            ) {
              stack.push(applyOperator());
            }
            operators.push(token);
          }
        }
        
        while (operators.length) {
          stack.push(applyOperator());
        }
        
        return stack[0];
      };
      
      return evaluate(tokens);
    };

    expect(parseExpression('2 + 3 * 4')).toBe(14);
    expect(parseExpression('(2 + 3) * 4')).toBe(20);
    expect(parseExpression('10 / 2 - 3')).toBe(2);
  });

  test('should handle template parsing', () => {
    const parseTemplate = (template, data) => {
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data.hasOwnProperty(key) ? data[key] : match;
      });
    };

    const parseAdvancedTemplate = (template, data) => {
      return template.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
        const value = path.split('.').reduce((obj, key) => obj?.[key], data);
        return value !== undefined ? value : match;
      });
    };

    const simple = parseTemplate('Hello {{name}}, you are {{age}} years old', {
      name: 'John',
      age: 25
    });
    expect(simple).toBe('Hello John, you are 25 years old');

    const advanced = parseAdvancedTemplate('Hello {{user.name}}, your email is {{user.email}}', {
      user: { name: 'John', email: 'john@example.com' }
    });
    expect(advanced).toBe('Hello John, your email is john@example.com');
  });

  test('should handle configuration parsing', () => {
    const parseConfig = (configString) => {
      const config = {};
      const lines = configString.split('\n');
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            let value = valueParts.join('=').trim();
            
            // Remove quotes
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            
            // Parse boolean and number values
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(value) && value !== '') value = Number(value);
            
            config[key.trim()] = value;
          }
        }
      });
      
      return config;
    };

    const configString = `
# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME="myapp"
DB_SSL=true
# App settings
DEBUG=false
MAX_CONNECTIONS=100
`;

    const config = parseConfig(configString);
    expect(config.DB_HOST).toBe('localhost');
    expect(config.DB_PORT).toBe(5432);
    expect(config.DB_SSL).toBe(true);
    expect(config.DEBUG).toBe(false);
  });

  test('should handle markdown parsing basics', () => {
    const parseMarkdown = (markdown) => {
      let html = markdown;
      
      // Headers
      html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
      html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
      html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
      
      // Bold and italic
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Links
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
      
      // Code
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
      
      // Line breaks
      html = html.replace(/\n/g, '<br>');
      
      return html;
    };

    const markdown = `# Title
## Subtitle
This is **bold** and *italic* text.
Here's a [link](http://example.com) and some \`code\`.`;

    const html = parseMarkdown(markdown);
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<a href="http://example.com">link</a>');
    expect(html).toContain('<code>code</code>');
  });
});
