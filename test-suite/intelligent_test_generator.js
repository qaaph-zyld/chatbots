const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class IntelligentTestGenerator {
  constructor() {
    this.businessLogicPatterns = [
      'validate', 'process', 'calculate', 'transform', 'authenticate',
      'authorize', 'encrypt', 'decrypt', 'parse', 'serialize'
    ];
    this.testTemplates = new Map();
    this.initializeTemplates();
  }

  initializeTemplates() {
    // Business logic test template
    this.testTemplates.set('business_logic', {
      template: `
describe('{{functionName}}', () => {
  test('should handle valid input correctly', async () => {
    const validInput = {{validInput}};
    const result = await {{functionName}}(validInput);
    expect(result).toBeDefined();
    expect(result).toMatchObject({{expectedOutput}});
  });

  test('should validate input parameters', async () => {
    const invalidInput = {{invalidInput}};
    await expect({{functionName}}(invalidInput)).rejects.toThrow();
  });

  test('should handle edge cases', async () => {
    const edgeCases = {{edgeCases}};
    for (const edgeCase of edgeCases) {
      const result = await {{functionName}}(edgeCase);
      expect(result).toBeDefined();
    }
  });
});`,
      quality: 85
    });

    // API endpoint test template
    this.testTemplates.set('api_endpoint', {
      template: `
describe('{{endpointName}} API', () => {
  test('should return success response for valid request', async () => {
    const response = await request(app)
      .{{method}}('{{path}}')
      .send({{validPayload}})
      .expect({{successCode}});
    
    expect(response.body).toMatchObject({{expectedResponse}});
  });

  test('should validate request payload', async () => {
    const response = await request(app)
      .{{method}}('{{path}}')
      .send({{invalidPayload}})
      .expect(400);
    
    expect(response.body.error).toBeDefined();
  });

  test('should handle authentication', async () => {
    const response = await request(app)
      .{{method}}('{{path}}')
      .send({{validPayload}})
      .expect(401);
  });
});`,
      quality: 90
    });

    // Data model test template
    this.testTemplates.set('data_model', {
      template: `
describe('{{modelName}} Model', () => {
  test('should create valid model instance', () => {
    const data = {{validData}};
    const instance = new {{modelName}}(data);
    expect(instance).toBeInstanceOf({{modelName}});
    expect(instance.validate()).toBeTruthy();
  });

  test('should enforce required fields', () => {
    const invalidData = {{invalidData}};
    expect(() => new {{modelName}}(invalidData)).toThrow();
  });

  test('should validate field types', () => {
    const wrongTypes = {{wrongTypeData}};
    const instance = new {{modelName}}(wrongTypes);
    expect(instance.validate()).toBeFalsy();
  });
});`,
      quality: 80
    });
  }

  async analyzeCodeContext(filePath) {
    try {
      const code = fs.readFileSync(filePath, 'utf8');
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy']
      });

      const context = {
        functions: [],
        classes: [],
        exports: [],
        imports: [],
        businessLogic: [],
        apiEndpoints: []
      };

      traverse(ast, {
        FunctionDeclaration(path) {
          context.functions.push({
            name: path.node.id.name,
            params: path.node.params.map(p => p.name || 'param'),
            isAsync: path.node.async,
            isBusinessLogic: this.isBusinessLogic(path.node.id.name)
          });
        },
        
        ClassDeclaration(path) {
          context.classes.push({
            name: path.node.id.name,
            methods: this.extractMethods(path)
          });
        },

        ExportNamedDeclaration(path) {
          if (path.node.declaration) {
            context.exports.push(path.node.declaration.id?.name);
          }
        },

        ImportDeclaration(path) {
          context.imports.push({
            source: path.node.source.value,
            specifiers: path.node.specifiers.map(s => s.local.name)
          });
        }
      });

      return context;
    } catch (error) {
      console.log(`Error analyzing ${filePath}: ${error.message}`);
      return { functions: [], classes: [], exports: [], imports: [] };
    }
  }

  isBusinessLogic(functionName) {
    return this.businessLogicPatterns.some(pattern => 
      functionName.toLowerCase().includes(pattern)
    );
  }

  extractMethods(classPath) {
    const methods = [];
    classPath.traverse({
      ClassMethod(methodPath) {
        methods.push({
          name: methodPath.node.key.name,
          isAsync: methodPath.node.async,
          isStatic: methodPath.node.static
        });
      }
    });
    return methods;
  }

  async generateIntelligentTests(context, filePath) {
    const tests = [];
    
    // Generate tests for business logic functions
    for (const func of context.functions.filter(f => f.isBusinessLogic)) {
      const test = await this.generateBusinessLogicTest(func, context);
      tests.push(test);
    }

    // Generate tests for classes
    for (const cls of context.classes) {
      const test = await this.generateClassTest(cls, context);
      tests.push(test);
    }

    // Generate integration tests if API patterns detected
    if (this.hasAPIPatterns(context)) {
      const apiTest = await this.generateAPITest(context);
      tests.push(apiTest);
    }

    return tests;
  }

  async generateBusinessLogicTest(func, context) {
    const template = this.testTemplates.get('business_logic');
    
    const testData = {
      functionName: func.name,
      validInput: this.generateValidInput(func),
      invalidInput: this.generateInvalidInput(func),
      expectedOutput: this.generateExpectedOutput(func),
      edgeCases: this.generateEdgeCases(func)
    };

    return {
      type: 'business_logic',
      content: this.fillTemplate(template.template, testData),
      quality: template.quality,
      coverage: ['statements', 'branches', 'functions']
    };
  }

  async generateClassTest(cls, context) {
    const template = this.testTemplates.get('data_model');
    
    const testData = {
      modelName: cls.name,
      validData: this.generateValidModelData(cls),
      invalidData: this.generateInvalidModelData(cls),
      wrongTypeData: this.generateWrongTypeData(cls)
    };

    return {
      type: 'data_model',
      content: this.fillTemplate(template.template, testData),
      quality: template.quality,
      coverage: ['statements', 'functions']
    };
  }

  async generateAPITest(context) {
    const template = this.testTemplates.get('api_endpoint');
    
    const endpoint = this.detectAPIEndpoint(context);
    
    const testData = {
      endpointName: endpoint.name,
      method: endpoint.method.toLowerCase(),
      path: endpoint.path,
      validPayload: this.generateValidPayload(endpoint),
      invalidPayload: this.generateInvalidPayload(endpoint),
      successCode: endpoint.successCode || 200,
      expectedResponse: this.generateExpectedResponse(endpoint)
    };

    return {
      type: 'api_endpoint',
      content: this.fillTemplate(template.template, testData),
      quality: template.quality,
      coverage: ['statements', 'branches', 'functions', 'lines']
    };
  }

  fillTemplate(template, data) {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, JSON.stringify(value, null, 2));
    }
    return result;
  }

  generateValidInput(func) {
    // Generate contextually appropriate valid input
    if (func.name.includes('email')) {
      return { email: 'test@example.com' };
    }
    if (func.name.includes('user')) {
      return { id: 1, name: 'Test User', email: 'test@example.com' };
    }
    if (func.name.includes('calculate')) {
      return { amount: 100, rate: 0.1 };
    }
    return { data: 'valid_test_data' };
  }

  generateInvalidInput(func) {
    if (func.name.includes('email')) {
      return { email: 'invalid-email' };
    }
    if (func.name.includes('user')) {
      return { id: null, name: '', email: 'invalid' };
    }
    if (func.name.includes('calculate')) {
      return { amount: -100, rate: 'invalid' };
    }
    return null;
  }

  generateExpectedOutput(func) {
    if (func.name.includes('validate')) {
      return { valid: true };
    }
    if (func.name.includes('calculate')) {
      return { result: expect.any(Number) };
    }
    if (func.name.includes('process')) {
      return { processed: true, data: expect.any(Object) };
    }
    return { success: true };
  }

  generateEdgeCases(func) {
    const cases = [];
    
    if (func.name.includes('email')) {
      cases.push(
        { email: '' },
        { email: 'a@b.c' },
        { email: 'very.long.email.address@example.com' }
      );
    }
    
    if (func.name.includes('calculate')) {
      cases.push(
        { amount: 0, rate: 0 },
        { amount: Number.MAX_VALUE, rate: 1 },
        { amount: 0.01, rate: 0.001 }
      );
    }
    
    return cases.length > 0 ? cases : [{ data: 'edge_case' }];
  }

  hasAPIPatterns(context) {
    return context.imports.some(imp => 
      imp.source.includes('express') || 
      imp.source.includes('router') ||
      imp.source.includes('controller')
    );
  }

  detectAPIEndpoint(context) {
    // Simple endpoint detection - would be more sophisticated in practice
    return {
      name: 'TestEndpoint',
      method: 'POST',
      path: '/api/test',
      successCode: 200
    };
  }

  generateValidPayload(endpoint) {
    return { data: 'valid_payload' };
  }

  generateInvalidPayload(endpoint) {
    return { invalid: 'payload' };
  }

  generateExpectedResponse(endpoint) {
    return { success: true, data: expect.any(Object) };
  }

  generateValidModelData(cls) {
    return { name: 'Test', value: 'valid' };
  }

  generateInvalidModelData(cls) {
    return {};
  }

  generateWrongTypeData(cls) {
    return { name: 123, value: null };
  }

  calculateTestQuality(test) {
    let score = test.quality || 50;
    
    // Bonus for comprehensive coverage
    if (test.coverage && test.coverage.length >= 3) {
      score += 10;
    }
    
    // Bonus for edge case testing
    if (test.content.includes('edge case')) {
      score += 15;
    }
    
    // Bonus for error handling
    if (test.content.includes('toThrow') || test.content.includes('rejects')) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }
}

module.exports = IntelligentTestGenerator;
