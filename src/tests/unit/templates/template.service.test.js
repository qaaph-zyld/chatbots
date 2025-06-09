/**
 * Template Service Unit Tests
 */

// Mock the storage service
jest.mock('../../../storage', () => ({
  localStorageService: {
    initialize: jest.fn().mockResolvedValue(true),
    store: jest.fn().mockImplementation((collection, id, data) => {
      return Promise.resolve({ id, ...data });
    }),
    retrieve: jest.fn(),
    query: jest.fn(),
    delete: jest.fn()
  }
}));

// Mock the logger
jest.mock('../../../utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

require('@src/storage');
require('@src/templates\template.service');

describe('Template Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });
  
  describe('initialize', () => {
    test('should initialize storage service and create default templates', async () => {
      // Mock storage service to return null for template retrieval (templates don't exist yet)
      localStorageService.retrieve.mockResolvedValue(null);
      
      const result = await templateService.initialize();
      
      expect(result).toBe(true);
      expect(localStorageService.initialize).toHaveBeenCalled();
      
      // Should create 5 default templates
      expect(localStorageService.store).toHaveBeenCalledTimes(5);
      
      // Check that each default template was created
      const templateIds = ['customer-support', 'sales-assistant', 'faq-bot', 'educational-assistant', 'personal-assistant'];
      for (const id of templateIds) {
        expect(localStorageService.retrieve).toHaveBeenCalledWith('templates', id);
      }
    });
    
    test('should not create default templates if they already exist', async () => {
      // Mock storage service to return a template (templates already exist)
      localStorageService.retrieve.mockResolvedValue({ id: 'existing-template' });
      
      const result = await templateService.initialize();
      
      expect(result).toBe(true);
      expect(localStorageService.initialize).toHaveBeenCalled();
      
      // Should not create any templates
      expect(localStorageService.store).not.toHaveBeenCalled();
    });
  });
  
  describe('getAllTemplates', () => {
    test('should return all templates from storage', async () => {
      const mockTemplates = [
        { id: 'template1', name: 'Template 1' },
        { id: 'template2', name: 'Template 2' }
      ];
      
      localStorageService.query.mockResolvedValue(mockTemplates);
      
      const templates = await templateService.getAllTemplates();
      
      expect(templates).toEqual(mockTemplates);
      expect(localStorageService.query).toHaveBeenCalledWith('templates', {}, {});
    });
    
    test('should pass query and options to storage service', async () => {
      const mockQuery = { category: 'business' };
      const mockOptions = { limit: 10, offset: 5, sort: { name: 1 } };
      
      await templateService.getAllTemplates(mockQuery, mockOptions);
      
      expect(localStorageService.query).toHaveBeenCalledWith('templates', mockQuery, mockOptions);
    });
  });
  
  describe('getTemplateById', () => {
    test('should return template by ID from storage', async () => {
      const mockTemplate = { id: 'template1', name: 'Template 1' };
      
      localStorageService.retrieve.mockResolvedValue(mockTemplate);
      
      const template = await templateService.getTemplateById('template1');
      
      expect(template).toEqual(mockTemplate);
      expect(localStorageService.retrieve).toHaveBeenCalledWith('templates', 'template1');
    });
    
    test('should return null if template not found', async () => {
      localStorageService.retrieve.mockResolvedValue(null);
      
      const template = await templateService.getTemplateById('non-existent');
      
      expect(template).toBeNull();
    });
  });
  
  describe('createTemplate', () => {
    test('should create a new template', async () => {
      const mockTemplate = {
        name: 'New Template',
        description: 'A new template',
        category: 'business',
        config: {
          personality: { traits: {} },
          intents: ['greeting', 'farewell'],
          responses: {
            greeting: 'Hello',
            farewell: 'Goodbye',
            fallback: 'I don\'t understand'
          }
        }
      };
      
      const createdTemplate = await templateService.createTemplate(mockTemplate);
      
      expect(createdTemplate.name).toBe(mockTemplate.name);
      expect(createdTemplate.description).toBe(mockTemplate.description);
      expect(localStorageService.store).toHaveBeenCalled();
      
      // Verify that an ID was generated
      const storeCall = localStorageService.store.mock.calls[0];
      expect(storeCall[0]).toBe('templates');
      expect(storeCall[1]).toBeTruthy(); // ID should be truthy
      expect(storeCall[2]).toEqual(mockTemplate);
    });
    
    test('should use provided ID if available', async () => {
      const mockTemplate = {
        id: 'custom-id',
        name: 'Template with Custom ID',
        description: 'A template with a custom ID',
        category: 'business',
        config: {
          personality: { traits: {} },
          intents: ['greeting', 'farewell'],
          responses: {
            greeting: 'Hello',
            farewell: 'Goodbye',
            fallback: 'I don\'t understand'
          }
        }
      };
      
      await templateService.createTemplate(mockTemplate);
      
      expect(localStorageService.store).toHaveBeenCalledWith('templates', 'custom-id', mockTemplate);
    });
    
    test('should throw error if template is invalid', async () => {
      const invalidTemplate = {
        name: 'Invalid Template',
        // Missing required fields
      };
      
      await expect(templateService.createTemplate(invalidTemplate)).rejects.toThrow('Template description is required');
      
      expect(localStorageService.store).not.toHaveBeenCalled();
    });
  });
  
  describe('updateTemplate', () => {
    test('should update an existing template', async () => {
      const existingTemplate = {
        id: 'template1',
        name: 'Original Name',
        description: 'Original description',
        category: 'business',
        config: {
          personality: { traits: {} },
          intents: ['greeting', 'farewell'],
          responses: {
            greeting: 'Hello',
            farewell: 'Goodbye',
            fallback: 'I don\'t understand'
          }
        }
      };
      
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description'
      };
      
      localStorageService.retrieve.mockResolvedValue(existingTemplate);
      
      const updatedTemplate = await templateService.updateTemplate('template1', updateData);
      
      expect(updatedTemplate.name).toBe(updateData.name);
      expect(updatedTemplate.description).toBe(updateData.description);
      expect(updatedTemplate.id).toBe('template1'); // ID should remain the same
      
      // Verify that the template was updated with merged data
      expect(localStorageService.store).toHaveBeenCalledWith(
        'templates',
        'template1',
        expect.objectContaining({
          ...existingTemplate,
          ...updateData,
          id: 'template1',
          updated_at: expect.any(Number)
        })
      );
    });
    
    test('should return null if template not found', async () => {
      localStorageService.retrieve.mockResolvedValue(null);
      
      const result = await templateService.updateTemplate('non-existent', { name: 'New Name' });
      
      expect(result).toBeNull();
      expect(localStorageService.store).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteTemplate', () => {
    test('should delete a template', async () => {
      localStorageService.delete.mockResolvedValue(true);
      
      const result = await templateService.deleteTemplate('template1');
      
      expect(result).toBe(true);
      expect(localStorageService.delete).toHaveBeenCalledWith('templates', 'template1');
    });
  });
  
  describe('applyTemplate', () => {
    test('should apply a template to a bot', async () => {
      const mockTemplate = {
        id: 'template1',
        name: 'Template 1',
        config: {
          personality: { traits: { helpfulness: 0.9 } },
          intents: ['greeting', 'farewell'],
          responses: {
            greeting: 'Hello',
            farewell: 'Goodbye',
            fallback: 'I don\'t understand'
          },
          plugins: ['plugin1', 'plugin2'],
          settings: { setting1: 'value1' }
        }
      };
      
      const mockBot = {
        id: 'bot1',
        name: 'Bot 1',
        description: 'A test bot'
      };
      
      const customizations = {
        personality: { traits: { friendliness: 0.8 } },
        responses: {
          greeting: 'Custom greeting'
        }
      };
      
      localStorageService.retrieve
        .mockResolvedValueOnce(mockTemplate) // First call for template
        .mockResolvedValueOnce(mockBot); // Second call for bot
      
      const updatedBot = await templateService.applyTemplate('template1', 'bot1', customizations);
      
      expect(updatedBot.template_id).toBe('template1');
      expect(updatedBot.personality).toEqual(customizations.personality);
      expect(updatedBot.responses.greeting).toBe(customizations.responses.greeting);
      expect(updatedBot.responses.farewell).toBe(mockTemplate.config.responses.farewell);
      
      expect(localStorageService.store).toHaveBeenCalledWith(
        'bots',
        'bot1',
        expect.objectContaining({
          id: 'bot1',
          name: 'Bot 1',
          template_id: 'template1',
          personality: customizations.personality,
          intents: mockTemplate.config.intents,
          responses: {
            ...mockTemplate.config.responses,
            ...customizations.responses
          },
          plugins: mockTemplate.config.plugins,
          settings: mockTemplate.config.settings,
          updated_at: expect.any(Number)
        })
      );
    });
    
    test('should return null if template not found', async () => {
      localStorageService.retrieve.mockResolvedValue(null);
      
      const result = await templateService.applyTemplate('non-existent', 'bot1', {});
      
      expect(result).toBeNull();
      expect(localStorageService.store).not.toHaveBeenCalled();
    });
    
    test('should return null if bot not found', async () => {
      localStorageService.retrieve
        .mockResolvedValueOnce({ id: 'template1' }) // Template exists
        .mockResolvedValueOnce(null); // Bot doesn't exist
      
      const result = await templateService.applyTemplate('template1', 'non-existent', {});
      
      expect(result).toBeNull();
      expect(localStorageService.store).not.toHaveBeenCalled();
    });
  });
  
  describe('createBotFromTemplate', () => {
    test('should create a new bot from a template', async () => {
      const mockTemplate = {
        id: 'template1',
        name: 'Template 1',
        config: {
          personality: { traits: { helpfulness: 0.9 } },
          intents: ['greeting', 'farewell'],
          responses: {
            greeting: 'Hello',
            farewell: 'Goodbye',
            fallback: 'I don\'t understand'
          },
          plugins: ['plugin1', 'plugin2'],
          settings: { setting1: 'value1' }
        }
      };
      
      const botData = {
        name: 'New Bot',
        description: 'A bot created from a template'
      };
      
      const customizations = {
        personality: { traits: { friendliness: 0.8 } }
      };
      
      localStorageService.retrieve.mockResolvedValue(mockTemplate);
      
      const createdBot = await templateService.createBotFromTemplate('template1', botData, customizations);
      
      expect(createdBot.name).toBe(botData.name);
      expect(createdBot.description).toBe(botData.description);
      expect(createdBot.template_id).toBe('template1');
      expect(createdBot.personality).toEqual(customizations.personality);
      
      expect(localStorageService.store).toHaveBeenCalledWith(
        'bots',
        expect.any(String), // Generated ID
        expect.objectContaining({
          name: botData.name,
          description: botData.description,
          template_id: 'template1',
          personality: customizations.personality,
          intents: mockTemplate.config.intents,
          responses: mockTemplate.config.responses,
          plugins: mockTemplate.config.plugins,
          settings: mockTemplate.config.settings,
          created_at: expect.any(Number),
          updated_at: expect.any(Number)
        })
      );
    });
    
    test('should use provided bot ID if available', async () => {
      const mockTemplate = {
        id: 'template1',
        name: 'Template 1',
        config: {
          personality: { traits: {} },
          intents: ['greeting', 'farewell'],
          responses: {
            greeting: 'Hello',
            farewell: 'Goodbye',
            fallback: 'I don\'t understand'
          },
          plugins: [],
          settings: {}
        }
      };
      
      const botData = {
        id: 'custom-bot-id',
        name: 'Bot with Custom ID'
      };
      
      localStorageService.retrieve.mockResolvedValue(mockTemplate);
      
      await templateService.createBotFromTemplate('template1', botData, {});
      
      expect(localStorageService.store).toHaveBeenCalledWith(
        'bots',
        'custom-bot-id',
        expect.objectContaining({
          id: 'custom-bot-id'
        })
      );
    });
    
    test('should return null if template not found', async () => {
      localStorageService.retrieve.mockResolvedValue(null);
      
      const result = await templateService.createBotFromTemplate('non-existent', { name: 'New Bot' }, {});
      
      expect(result).toBeNull();
      expect(localStorageService.store).not.toHaveBeenCalled();
    });
  });
});
