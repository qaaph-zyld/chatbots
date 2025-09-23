/**
 * Configuration Utilities Unit Tests
 */

describe('Configuration Utilities', () => {
  test('should handle environment variable parsing', () => {
    const parseEnv = (envVars) => {
      const config = {};
      
      Object.entries(envVars).forEach(([key, value]) => {
        if (value === 'true') config[key] = true;
        else if (value === 'false') config[key] = false;
        else if (!isNaN(value) && value !== '') config[key] = Number(value);
        else config[key] = value;
      });
      
      return config;
    };

    const env = {
      PORT: '3000',
      DEBUG: 'true',
      TIMEOUT: '5000',
      NAME: 'test-app'
    };

    const config = parseEnv(env);
    expect(config.PORT).toBe(3000);
    expect(config.DEBUG).toBe(true);
    expect(config.NAME).toBe('test-app');
  });

  test('should handle configuration merging', () => {
    const mergeConfig = (defaults, overrides) => {
      const result = { ...defaults };
      
      Object.entries(overrides).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result[key] = mergeConfig(result[key] || {}, value);
        } else {
          result[key] = value;
        }
      });
      
      return result;
    };

    const defaults = {
      server: { port: 3000, host: 'localhost' },
      database: { host: 'localhost', port: 5432 }
    };

    const overrides = {
      server: { port: 8080 },
      database: { host: 'remote-db' }
    };

    const merged = mergeConfig(defaults, overrides);
    expect(merged.server.port).toBe(8080);
    expect(merged.server.host).toBe('localhost');
    expect(merged.database.host).toBe('remote-db');
  });

  test('should handle configuration validation', () => {
    const validateConfig = (config, schema) => {
      const errors = [];
      
      Object.entries(schema).forEach(([key, rules]) => {
        const value = config[key];
        
        if (rules.required && (value === undefined || value === null)) {
          errors.push(`${key} is required`);
        }
        
        if (value !== undefined && rules.type && typeof value !== rules.type) {
          errors.push(`${key} must be of type ${rules.type}`);
        }
        
        if (rules.min && value < rules.min) {
          errors.push(`${key} must be at least ${rules.min}`);
        }
      });
      
      return { valid: errors.length === 0, errors };
    };

    const schema = {
      port: { required: true, type: 'number', min: 1 },
      host: { required: true, type: 'string' },
      debug: { type: 'boolean' }
    };

    const validConfig = { port: 3000, host: 'localhost', debug: true };
    const invalidConfig = { port: 'invalid', debug: true };

    expect(validateConfig(validConfig, schema).valid).toBe(true);
    expect(validateConfig(invalidConfig, schema).valid).toBe(false);
  });

  test('should handle configuration loading', () => {
    const configLoader = {
      sources: [],
      
      addSource: function(source) {
        this.sources.push(source);
      },
      
      load: function() {
        let config = {};
        
        this.sources.forEach(source => {
          if (typeof source === 'function') {
            config = { ...config, ...source() };
          } else {
            config = { ...config, ...source };
          }
        });
        
        return config;
      }
    };

    configLoader.addSource({ app: 'test', version: '1.0' });
    configLoader.addSource(() => ({ env: 'development' }));
    configLoader.addSource({ debug: true });

    const config = configLoader.load();
    expect(config.app).toBe('test');
    expect(config.env).toBe('development');
    expect(config.debug).toBe(true);
  });

  test('should handle configuration caching', () => {
    const cachedConfig = {
      cache: null,
      cacheTime: null,
      ttl: 60000, // 1 minute
      
      get: function(loader) {
        const now = Date.now();
        
        if (!this.cache || !this.cacheTime || now - this.cacheTime > this.ttl) {
          this.cache = loader();
          this.cacheTime = now;
        }
        
        return this.cache;
      },
      
      invalidate: function() {
        this.cache = null;
        this.cacheTime = null;
      }
    };

    let loadCount = 0;
    const loader = () => {
      loadCount++;
      return { data: 'config', timestamp: Date.now() };
    };

    const config1 = cachedConfig.get(loader);
    const config2 = cachedConfig.get(loader);
    
    expect(loadCount).toBe(1);
    expect(config1).toBe(config2);
    
    cachedConfig.invalidate();
    const config3 = cachedConfig.get(loader);
    expect(loadCount).toBe(2);
  });
});
