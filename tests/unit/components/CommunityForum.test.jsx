/**
 * Tests for CommunityForum component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import CommunityForum from '../../../client/components/CommunityForum';

// Mock axios
jest.mock('axios');

describe('CommunityForum Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Arrange
    axios.get.mockResolvedValue({ data: [] });
    
    // Act
    render(<CommunityForum />);
    
    // Assert
    expect(screen.getByText('Loading discussions...')).toBeInTheDocument();
  });

  it('fetches and displays discussions', async () => {
    // Arrange
    const mockDiscussions = [
      { id: '1', title: 'Discussion 1', author: 'user1', createdAt: '2025-05-01T12:00:00Z', commentCount: 5 },
      { id: '2', title: 'Discussion 2', author: 'user2', createdAt: '2025-05-02T12:00:00Z', commentCount: 10 }
    ];
    
    axios.get.mockResolvedValue({ data: { discussions: mockDiscussions } });
    
    // Act
    render(<CommunityForum />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Discussion 1')).toBeInTheDocument();
      expect(screen.getByText('Discussion 2')).toBeInTheDocument();
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
      expect(screen.getByText('5 comments')).toBeInTheDocument();
      expect(screen.getByText('10 comments')).toBeInTheDocument();
    });
    
    expect(axios.get).toHaveBeenCalledWith('/api/community/discussions');
  });

  it('handles API errors gracefully', async () => {
    // Arrange
    axios.get.mockRejectedValue(new Error('API Error'));
    
    // Act
    render(<CommunityForum />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Error loading discussions. Please try again later.')).toBeInTheDocument();
    });
  });

  it('filters discussions based on search input', async () => {
    // Arrange
    const mockDiscussions = [
      { id: '1', title: 'Discussion about API', author: 'user1', createdAt: '2025-05-01T12:00:00Z', commentCount: 5 },
      { id: '2', title: 'Question about models', author: 'user2', createdAt: '2025-05-02T12:00:00Z', commentCount: 10 }
    ];
    
    axios.get.mockResolvedValue({ data: { discussions: mockDiscussions } });
    
    // Act
    render(<CommunityForum />);
    
    // Wait for discussions to load
    await waitFor(() => {
      expect(screen.getByText('Discussion about API')).toBeInTheDocument();
    });
    
    // Search for "API"
    const searchInput = screen.getByPlaceholderText('Search discussions...');
    fireEvent.change(searchInput, { target: { value: 'API' } });
    
    // Assert
    expect(screen.getByText('Discussion about API')).toBeInTheDocument();
    expect(screen.queryByText('Question about models')).not.toBeInTheDocument();
  });

  it('sorts discussions by newest first', async () => {
    // Arrange
    const mockDiscussions = [
      { id: '1', title: 'Older Discussion', author: 'user1', createdAt: '2025-05-01T12:00:00Z', commentCount: 5 },
      { id: '2', title: 'Newer Discussion', author: 'user2', createdAt: '2025-05-02T12:00:00Z', commentCount: 10 }
    ];
    
    axios.get.mockResolvedValue({ data: { discussions: mockDiscussions } });
    
    // Act
    render(<CommunityForum />);
    
    // Wait for discussions to load
    await waitFor(() => {
      expect(screen.getByText('Older Discussion')).toBeInTheDocument();
    });
    
    // Get sort dropdown and select "newest"
    const sortDropdown = screen.getByLabelText('Sort by:');
    fireEvent.change(sortDropdown, { target: { value: 'newest' } });
    
    // Assert - newer discussion should be first in the list
    const discussionItems = screen.getAllByTestId('discussion-item');
    expect(discussionItems[0]).toHaveTextContent('Newer Discussion');
    expect(discussionItems[1]).toHaveTextContent('Older Discussion');
  });

  it('sorts discussions by most commented', async () => {
    // Arrange
    const mockDiscussions = [
      { id: '1', title: 'Less Commented', author: 'user1', createdAt: '2025-05-01T12:00:00Z', commentCount: 5 },
      { id: '2', title: 'More Commented', author: 'user2', createdAt: '2025-05-02T12:00:00Z', commentCount: 10 }
    ];
    
    axios.get.mockResolvedValue({ data: { discussions: mockDiscussions } });
    
    // Act
    render(<CommunityForum />);
    
    // Wait for discussions to load
    await waitFor(() => {
      expect(screen.getByText('Less Commented')).toBeInTheDocument();
    });
    
    // Get sort dropdown and select "most_commented"
    const sortDropdown = screen.getByLabelText('Sort by:');
    fireEvent.change(sortDropdown, { target: { value: 'most_commented' } });
    
    // Assert - more commented discussion should be first in the list
    const discussionItems = screen.getAllByTestId('discussion-item');
    expect(discussionItems[0]).toHaveTextContent('More Commented');
    expect(discussionItems[1]).toHaveTextContent('Less Commented');
  });

  it('navigates to discussion details when clicking on a discussion', async () => {
    // Arrange
    const mockDiscussions = [
      { id: '1', title: 'Discussion 1', author: 'user1', createdAt: '2025-05-01T12:00:00Z', commentCount: 5 }
    ];
    
    axios.get.mockResolvedValue({ data: { discussions: mockDiscussions } });
    
    // Mock window.location.href
    delete window.location;
    window.location = { href: jest.fn() };
    
    // Act
    render(<CommunityForum />);
    
    // Wait for discussions to load
    await waitFor(() => {
      expect(screen.getByText('Discussion 1')).toBeInTheDocument();
    });
    
    // Click on the discussion
    fireEvent.click(screen.getByText('Discussion 1'));
    
    // Assert
    expect(window.location.href).toBe('/community/discussion/1');
  });

  it('shows pagination controls when there are multiple pages', async () => {
    // Arrange
    const mockDiscussions = Array(15).fill().map((_, i) => ({
      id: `${i+1}`,
      title: `Discussion ${i+1}`,
      author: `user${i+1}`,
      createdAt: `2025-05-0${i % 9 + 1}T12:00:00Z`,
      commentCount: i + 1
    }));
    
    axios.get.mockResolvedValue({ 
      data: { 
        discussions: mockDiscussions,
        pagination: {
          totalPages: 3,
          currentPage: 1,
          totalItems: 30
        }
      } 
    });
    
    // Act
    render(<CommunityForum />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
    
    // Click next page
    fireEvent.click(screen.getByText('Next'));
    
    // Assert axios was called with page=2
    expect(axios.get).toHaveBeenCalledWith('/api/community/discussions?page=2');
  });
});
