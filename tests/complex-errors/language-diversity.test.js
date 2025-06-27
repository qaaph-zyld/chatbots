/**
 * Language Diversity Tests
 * 
 * This test suite demonstrates errors in multiple programming languages
 * to help the AI fix engine develop cross-language capabilities.
 * 
 * The tests use child_process to execute code in different languages
 * and validate the output and error handling.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper function to run code in a specific language
const runCode = (language, code, options = {}) => {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(os.tmpdir(), 'language-tests');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    let command, args, filePath;
    
    // Language-specific setup
    switch (language) {
      case 'python':
        filePath = path.join(tempDir, 'test.py');
        fs.writeFileSync(filePath, code);
        command = 'python';
        args = [filePath];
        break;
        
      case 'node':
        filePath = path.join(tempDir, 'test.js');
        fs.writeFileSync(filePath, code);
        command = 'node';
        args = [filePath];
        break;
        
      case 'bash':
        filePath = path.join(tempDir, 'test.sh');
        fs.writeFileSync(filePath, code);
        fs.chmodSync(filePath, '755');
        command = 'bash';
        args = [filePath];
        break;
        
      default:
        reject(new Error(`Unsupported language: ${language}`));
        return;
    }
    
    // Execute the code
    const childProcess = spawn(command, args, {
      shell: true,
      timeout: options.timeout || 5000
    });
    
    let stdout = '';
    let stderr = '';
    
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    childProcess.on('error', (error) => {
      reject({
        error,
        stdout,
        stderr,
        code: null
      });
    });
    
    childProcess.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr
      });
    });
  });
};

describe('Language Diversity Tests', () => {
  
  // Skip these tests if the required language runtimes are not available
  const checkLanguageAvailable = async (language) => {
    try {
      let command;
      switch (language) {
        case 'python': command = 'python --version'; break;
        case 'node': command = 'node --version'; break;
        case 'bash': command = 'bash --version'; break;
        default: return false;
      }
      
      const childProcess = spawn(command, [], { shell: true });
      
      return new Promise((resolve) => {
        childProcess.on('close', (code) => {
          resolve(code === 0);
        });
        
        childProcess.on('error', () => {
          resolve(false);
        });
      });
    } catch (error) {
      return false;
    }
  };
  
  // Python Tests
  describe('Python Error Tests', () => {
    let pythonAvailable;
    
    beforeAll(async () => {
      pythonAvailable = await checkLanguageAvailable('python');
    });
    
    const conditionalTest = (name, fn) => {
      if (pythonAvailable) {
        test(name, fn);
      } else {
        test.skip(`${name} (Python not available)`, () => {});
      }
    };
    
    conditionalTest('Indentation error', async () => {
      const code = `
def calculate_sum(a, b):
    result = a + b
  print(result)  # Indentation error
    return result

print(calculate_sum(5, 10))
`;
      
      const result = await runCode('python', code);
      expect(result.code).not.toBe(0);
      expect(result.stderr).toContain('IndentationError');
    });
    
    conditionalTest('Fix verification - indentation error', async () => {
      const code = `
def calculate_sum(a, b):
    result = a + b
    print(result)  # Fixed indentation
    return result

print(calculate_sum(5, 10))
`;
      
      const result = await runCode('python', code);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('15');
    });
    
    conditionalTest('Type error', async () => {
      const code = `
def process_data(data):
    # Bug: Attempting to concatenate string and int
    return "Total: " + data

print(process_data(42))
`;
      
      const result = await runCode('python', code);
      expect(result.code).not.toBe(0);
      expect(result.stderr).toContain('TypeError');
    });
    
    conditionalTest('Fix verification - type error', async () => {
      const code = `
def process_data(data):
    # Fixed: Convert int to string before concatenation
    return "Total: " + str(data)

print(process_data(42))
`;
      
      const result = await runCode('python', code);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Total: 42');
    });
  });
  
  // Bash Tests
  describe('Bash Error Tests', () => {
    let bashAvailable;
    
    beforeAll(async () => {
      bashAvailable = await checkLanguageAvailable('bash');
    });
    
    const conditionalTest = (name, fn) => {
      if (bashAvailable) {
        test(name, fn);
      } else {
        test.skip(`${name} (Bash not available)`, () => {});
      }
    };
    
    conditionalTest('Command not found error', async () => {
      const code = `
#!/bin/bash
# Bug: Typo in command name
echoo "Hello, world!"
`;
      
      const result = await runCode('bash', code);
      expect(result.code).not.toBe(0);
      expect(result.stderr).toContain('command not found');
    });
    
    conditionalTest('Fix verification - command not found', async () => {
      const code = `
#!/bin/bash
# Fixed: Correct command name
echo "Hello, world!"
`;
      
      const result = await runCode('bash', code);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Hello, world!');
    });
    
    conditionalTest('Variable reference error', async () => {
      const code = `
#!/bin/bash
# Bug: Using $ when defining a variable
$counter=1
echo "Counter: $counter"
`;
      
      const result = await runCode('bash', code);
      expect(result.code).not.toBe(0);
      expect(result.stderr).toContain('command not found');
    });
    
    conditionalTest('Fix verification - variable reference', async () => {
      const code = `
#!/bin/bash
# Fixed: Removed $ when defining a variable
counter=1
echo "Counter: $counter"
`;
      
      const result = await runCode('bash', code);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Counter: 1');
    });
  });
  
  // Node.js Tests (included for completeness, though we already have many JS tests)
  describe('Node.js Error Tests', () => {
    let nodeAvailable;
    
    beforeAll(async () => {
      nodeAvailable = await checkLanguageAvailable('node');
    });
    
    const conditionalTest = (name, fn) => {
      if (nodeAvailable) {
        test(name, fn);
      } else {
        test.skip(`${name} (Node.js not available)`, () => {});
      }
    };
    
    conditionalTest('Reference error', async () => {
      const code = `
// Bug: Using a variable before it's defined
console.log(message);
const message = "Hello, world!";
`;
      
      const result = await runCode('node', code);
      expect(result.code).not.toBe(0);
      expect(result.stderr).toContain('ReferenceError');
    });
    
    conditionalTest('Fix verification - reference error', async () => {
      const code = `
// Fixed: Define the variable before using it
const message = "Hello, world!";
console.log(message);
`;
      
      const result = await runCode('node', code);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Hello, world!');
    });
  });
});
