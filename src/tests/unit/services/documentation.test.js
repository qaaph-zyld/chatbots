/**
 * Tests for Documentation Service
 */

require('@src/services\documentation.service');
require('@src/utils\indexedDB');
const fs = require('fs').promises;
const path = require('path');

// Mock dependencies
jest.mock('../../../utils/indexedDB');
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue('# Test content'),
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('Documentation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should return all categories with formatted names', async () => {
      // Act
      const result = await documentationService.getCategories();
      
      // Assert
      expect(result).toEqual(expect.arrayContaining([
        { id: 'getting-started', name: 'Getting Started' },
        { id: 'api', name: 'Api' }
      ]));
    });
  });

  describe('getDocumentationByCategory', () => {
    it('should return items for valid category', async () => {
      // Arrange
      const mockItems = [
        { id: 'item1', category: 'getting-started' },
        { id: 'item2', category: 'getting-started' }
      ];
      dbUtils.getAllDocumentationItems.mockResolvedValue(mockItems);
      
      // Act
      const result = await documentationService.getDocumentationByCategory('getting-started');
      
      // Assert
      expect(result).toEqual(mockItems);
      expect(dbUtils.getAllDocumentationItems).toHaveBeenCalled();
    });
    
    it('should throw error for invalid category', async () => {
      // Act & Assert
      await expect(documentationService.getDocumentationByCategory('invalid'))
        .rejects.toThrow('Category invalid not found');
    });
  });

  describe('getDocumentationItem', () => {
    it('should return item with content and HTML', async () => {
      // Arrange
      const mockItem = { id: 'test-item', category: 'getting-started', title: 'Test' };
      dbUtils.getDocumentationItem.mockResolvedValue(mockItem);
      
      // Act
      const result = await documentationService.getDocumentationItem('test-item');
      
      // Assert
      expect(result).toEqual({
        ...mockItem,
        content: '# Test content',
        htmlContent: expect.any(String)
      });
    });
    
    it('should throw error if item not found', async () => {
      // Arrange
      dbUtils.getDocumentationItem.mockResolvedValue(null);
      
      // Act & Assert
      await expect(documentationService.getDocumentationItem('missing'))
        .rejects.toThrow('Documentation item missing not found');
    });
  });

  describe('saveDocumentationItem', () => {
    it('should save new item with required fields', async () => {
      // Arrange
      const newItem = {
        id: 'new-item',
        title: 'New Item',
        category: 'getting-started',
        content: '# New content'
      };
      dbUtils.getDocumentationItem.mockResolvedValue(null);
      
      // Act
      const result = await documentationService.saveDocumentationItem(newItem);
      
      // Assert
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('new-item.md'),
        '# New content'
      );
      expect(dbUtils.storeDocumentationItem).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: 'new-item',
        title: 'New Item',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      }));
    });
    
    it('should update existing item', async () => {
      // Arrange
      const existingItem = {
        id: 'existing',
        title: 'Existing Item',
        category: 'api',
        createdAt: '2025-01-01T00:00:00.000Z'
      };
      const updateData = {
        id: 'existing',
        title: 'Updated Item',
        category: 'api',
        content: '# Updated content'
      };
      dbUtils.getDocumentationItem.mockResolvedValue(existingItem);
      
      // Act
      const result = await documentationService.saveDocumentationItem(updateData);
      
      // Assert
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('existing.md'),
        '# Updated content'
      );
      expect(result).toEqual(expect.objectContaining({
        id: 'existing',
        title: 'Updated Item',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: expect.any(String)
      }));
    });
    
    it('should throw error for invalid category', async () => {
      // Arrange
      const item = {
        id: 'test',
        title: 'Test',
        category: 'invalid',
        content: '# Test'
      };
      
      // Act & Assert
      await expect(documentationService.saveDocumentationItem(item))
        .rejects.toThrow('Category invalid not found');
    });
    
    it('should throw error for missing required fields', async () => {
      // Arrange
      const item = {
        id: 'test',
        // Missing title
        category: 'api',
        content: '# Test'
      };
      
      // Act & Assert
      await expect(documentationService.saveDocumentationItem(item))
        .rejects.toThrow('Missing required fields');
    });
  });

  describe('deleteDocumentationItem', () => {
    it('should delete item and return true', async () => {
      // Arrange
      const mockItem = { id: 'to-delete', category: 'api' };
      dbUtils.getDocumentationItem.mockResolvedValue(mockItem);
      
      // Act
      const result = await documentationService.deleteDocumentationItem('to-delete');
      
      // Assert
      expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('to-delete.md'));
      expect(dbUtils.deleteDocumentationItem).toHaveBeenCalledWith('to-delete');
      expect(result).toBe(true);
    });
    
    it('should throw error if item not found', async () => {
      // Arrange
      dbUtils.getDocumentationItem.mockResolvedValue(null);
      
      // Act & Assert
      await expect(documentationService.deleteDocumentationItem('missing'))
        .rejects.toThrow('Documentation item missing not found');
    });
  });

  describe('searchDocumentation', () => {
    it('should return empty array for empty query', async () => {
      // Act
      const result = await documentationService.searchDocumentation('');
      
      // Assert
      expect(result).toEqual([]);
    });
    
    it('should search in title, tags, and content', async () => {
      // Arrange
      const mockItems = [
        { id: 'item1', title: 'Test Item', category: 'api', tags: [] },
        { id: 'item2', title: 'Other', category: 'api', tags: ['test'] },
        { id: 'item3', title: 'Another', category: 'api', tags: [] }
      ];
      dbUtils.getAllDocumentationItems.mockResolvedValue(mockItems);
      
      // Mock content search
      fs.readFile.mockImplementation((path) => {
        if (path.includes('item3')) return Promise.resolve('Content with test keyword');
        return Promise.resolve('Other content');
      });
      
      // Act
      const result = await documentationService.searchDocumentation('test');
      
      // Assert
      expect(result).toHaveLength(3);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'item1', matchType: 'title' }),
        expect.objectContaining({ id: 'item2', matchType: 'tag' }),
        expect.objectContaining({ id: 'item3', matchType: 'content' })
      ]));
    });
    
    it('should filter by category when specified', async () => {
      // Arrange
      const mockItems = [
        { id: 'item1', title: 'Test', category: 'api', tags: [] },
        { id: 'item2', title: 'Test', category: 'getting-started', tags: [] }
      ];
      dbUtils.getAllDocumentationItems.mockResolvedValue(mockItems);
      
      // Act
      const result = await documentationService.searchDocumentation('test', 'api');
      
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item1');
    });
  });
});
