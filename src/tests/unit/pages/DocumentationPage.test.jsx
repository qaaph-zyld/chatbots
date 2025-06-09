/**
 * Tests for DocumentationPage component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import '@src/client\pages\DocumentationPage';

// Mock axios
jest.mock('axios');

// Mock DocumentationBrowser component
jest.mock('../../../client/components/DocumentationBrowser', () => {
  return function MockDocumentationBrowser({ onItemSelect }) {
    return (
      <div data-testid="documentation-browser">
        <button onClick={() => onItemSelect({ id: 'test-doc', title: 'Test Doc' })}>
          Select Test Doc
        </button>
      </div>
    );
  };
});

describe('DocumentationPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API response for documentation item
    axios.get.mockResolvedValue({
      data: {
        id: 'test-doc',
        title: 'Test Doc',
        category: 'getting-started',
        htmlContent: '<h1>Test Documentation</h1><p>This is test content</p>',
        updatedAt: '2025-05-01T12:00:00Z'
      }
    });
  });

  it('renders the page title and description', () => {
    // Act
    render(
      <BrowserRouter>
        <DocumentationPage />
      </BrowserRouter>
    );
    
    // Assert
    expect(screen.getByText('Documentation')).toBeInTheDocument();
    expect(screen.getByText(/comprehensive documentation/i)).toBeInTheDocument();
  });

  it('displays the DocumentationBrowser component', () => {
    // Act
    render(
      <BrowserRouter>
        <DocumentationPage />
      </BrowserRouter>
    );
    
    // Assert
    expect(screen.getByTestId('documentation-browser')).toBeInTheDocument();
  });

  it('loads and displays documentation content when an item is selected', async () => {
    // Act
    render(
      <BrowserRouter>
        <DocumentationPage />
      </BrowserRouter>
    );
    
    // Click the button to select a doc
    fireEvent.click(screen.getByText('Select Test Doc'));
    
    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/documentation/item/test-doc');
      expect(screen.getByText('Test Documentation')).toBeInTheDocument();
      expect(screen.getByText('This is test content')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching documentation', async () => {
    // Arrange - delay the API response
    axios.get.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            data: {
              id: 'test-doc',
              title: 'Test Doc',
              category: 'getting-started',
              htmlContent: '<h1>Test Documentation</h1>',
              updatedAt: '2025-05-01T12:00:00Z'
            }
          });
        }, 100);
      });
    });
    
    // Act
    render(
      <BrowserRouter>
        <DocumentationPage />
      </BrowserRouter>
    );
    
    // Click to select a doc
    fireEvent.click(screen.getByText('Select Test Doc'));
    
    // Assert - should show loading state
    expect(screen.getByText('Loading documentation...')).toBeInTheDocument();
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Test Documentation')).toBeInTheDocument();
    });
  });

  it('displays error message when documentation fails to load', async () => {
    // Arrange
    axios.get.mockRejectedValue(new Error('Failed to fetch documentation'));
    
    // Act
    render(
      <BrowserRouter>
        <DocumentationPage />
      </BrowserRouter>
    );
    
    // Click to select a doc
    fireEvent.click(screen.getByText('Select Test Doc'));
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Error loading documentation. Please try again.')).toBeInTheDocument();
    });
  });

  it('displays last updated date for documentation', async () => {
    // Act
    render(
      <BrowserRouter>
        <DocumentationPage />
      </BrowserRouter>
    );
    
    // Click to select a doc
    fireEvent.click(screen.getByText('Select Test Doc'));
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      expect(screen.getByText(/May 1, 2025/)).toBeInTheDocument();
    });
  });

  it('updates URL when documentation item is selected', async () => {
    // Mock window.history.pushState
    const pushStateSpy = jest.spyOn(window.history, 'pushState');
    
    // Act
    render(
      <BrowserRouter>
        <DocumentationPage />
      </BrowserRouter>
    );
    
    // Click to select a doc
    fireEvent.click(screen.getByText('Select Test Doc'));
    
    // Assert
    await waitFor(() => {
      expect(pushStateSpy).toHaveBeenCalledWith(
        expect.anything(),
        '',
        expect.stringContaining('/documentation/test-doc')
      );
    });
    
    // Cleanup
    pushStateSpy.mockRestore();
  });

  it('shows contribution guidelines section', () => {
    // Act
    render(
      <BrowserRouter>
        <DocumentationPage />
      </BrowserRouter>
    );
    
    // Assert
    expect(screen.getByText('Contributing to Documentation')).toBeInTheDocument();
    expect(screen.getByText(/help improve our documentation/i)).toBeInTheDocument();
  });
});
