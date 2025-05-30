import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './CommunityForum.css';

/**
 * Community Forum Component
 * 
 * Integrates with external community platforms like GitHub Discussions and Discord
 */
const CommunityForum = ({ platform = 'github', repositoryUrl = 'https://github.com/your-repo/chatbots' }) => {
  const { t } = useTranslation();
  const [discussions, setDiscussions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Categories for GitHub Discussions
  const categories = [
    { id: 'all', name: t('community.allCategories') },
    { id: 'announcements', name: t('community.announcements') },
    { id: 'general', name: t('community.general') },
    { id: 'ideas', name: t('community.ideas') },
    { id: 'help', name: t('community.help') },
    { id: 'bugs', name: t('community.bugs') },
    { id: 'q-a', name: t('community.qa') }
  ];

  // Fetch discussions on component mount
  useEffect(() => {
    fetchDiscussions();
  }, [platform, repositoryUrl]);

  // Fetch discussions when category changes
  useEffect(() => {
    if (selectedCategory !== 'all') {
      fetchDiscussionsByCategory(selectedCategory);
    } else {
      fetchDiscussions();
    }
  }, [selectedCategory]);

  // Fetch discussions from GitHub API
  const fetchDiscussions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the GitHub GraphQL API
      // For this example, we'll simulate the API response
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate discussions data
      const mockDiscussions = generateMockDiscussions();
      setDiscussions(mockDiscussions);
    } catch (err) {
      console.error('Error fetching discussions:', err);
      setError(t('error.fetchDiscussions'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch discussions by category
  const fetchDiscussionsByCategory = async (category) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the GitHub GraphQL API with category filter
      // For this example, we'll simulate the API response
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate discussions data filtered by category
      const mockDiscussions = generateMockDiscussions().filter(
        discussion => discussion.category.toLowerCase() === category.toLowerCase()
      );
      
      setDiscussions(mockDiscussions);
    } catch (err) {
      console.error(`Error fetching discussions for category ${category}:`, err);
      setError(t('error.fetchCategoryDiscussions'));
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock discussions data
  const generateMockDiscussions = () => {
    return [
      {
        id: 1,
        title: 'Welcome to the Chatbot Platform Community!',
        author: 'admin',
        category: 'announcements',
        createdAt: '2025-05-20T10:00:00Z',
        updatedAt: '2025-05-20T10:00:00Z',
        commentsCount: 15,
        url: `${repositoryUrl}/discussions/1`,
        labels: ['welcome', 'community']
      },
      {
        id: 2,
        title: 'How to implement custom NLP models?',
        author: 'user123',
        category: 'help',
        createdAt: '2025-05-21T14:30:00Z',
        updatedAt: '2025-05-22T09:15:00Z',
        commentsCount: 8,
        url: `${repositoryUrl}/discussions/2`,
        labels: ['nlp', 'models', 'help-wanted']
      },
      {
        id: 3,
        title: 'Bug: Offline mode not syncing properly',
        author: 'debugger42',
        category: 'bugs',
        createdAt: '2025-05-22T16:45:00Z',
        updatedAt: '2025-05-23T11:20:00Z',
        commentsCount: 12,
        url: `${repositoryUrl}/discussions/3`,
        labels: ['bug', 'offline', 'sync']
      },
      {
        id: 4,
        title: 'Feature request: Add support for voice assistants',
        author: 'innovator99',
        category: 'ideas',
        createdAt: '2025-05-23T08:10:00Z',
        updatedAt: '2025-05-24T13:05:00Z',
        commentsCount: 20,
        url: `${repositoryUrl}/discussions/4`,
        labels: ['feature-request', 'voice', 'enhancement']
      },
      {
        id: 5,
        title: 'Best practices for multilingual chatbots',
        author: 'polyglot77',
        category: 'general',
        createdAt: '2025-05-24T11:30:00Z',
        updatedAt: '2025-05-25T14:45:00Z',
        commentsCount: 17,
        url: `${repositoryUrl}/discussions/5`,
        labels: ['best-practices', 'multilingual']
      },
      {
        id: 6,
        title: 'How to optimize performance for large knowledge bases?',
        author: 'optimizer42',
        category: 'q-a',
        createdAt: '2025-05-25T09:20:00Z',
        updatedAt: '2025-05-26T10:15:00Z',
        commentsCount: 9,
        url: `${repositoryUrl}/discussions/6`,
        labels: ['performance', 'knowledge-base', 'optimization']
      },
      {
        id: 7,
        title: 'Release v2.0 - Major features and improvements',
        author: 'admin',
        category: 'announcements',
        createdAt: '2025-05-26T15:00:00Z',
        updatedAt: '2025-05-26T15:00:00Z',
        commentsCount: 25,
        url: `${repositoryUrl}/discussions/7`,
        labels: ['release', 'major-update']
      },
      {
        id: 8,
        title: 'Integration with third-party services',
        author: 'integrator55',
        category: 'help',
        createdAt: '2025-05-27T13:40:00Z',
        updatedAt: '2025-05-28T09:30:00Z',
        commentsCount: 11,
        url: `${repositoryUrl}/discussions/8`,
        labels: ['integration', 'third-party', 'api']
      }
    ];
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }
    
    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    
    const results = discussions.filter(discussion => 
      discussion.title.toLowerCase().includes(query) ||
      discussion.author.toLowerCase().includes(query) ||
      discussion.category.toLowerCase().includes(query) ||
      discussion.labels.some(label => label.toLowerCase().includes(query))
    );
    
    setSearchResults(results);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get discussion list to display (search results or all discussions)
  const getDisplayDiscussions = () => {
    return isSearching ? searchResults : discussions;
  };

  // Render category filters
  const renderCategoryFilters = () => {
    return (
      <div className="category-filters">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-filter ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
    );
  };

  // Render discussion list
  const renderDiscussions = () => {
    const displayDiscussions = getDisplayDiscussions();
    
    if (displayDiscussions.length === 0) {
      return (
        <div className="no-discussions">
          {isSearching 
            ? t('community.noSearchResults') 
            : t('community.noDiscussions')}
        </div>
      );
    }
    
    return (
      <div className="discussions-list">
        {displayDiscussions.map(discussion => (
          <div key={discussion.id} className="discussion-card">
            <div className="discussion-header">
              <span className={`discussion-category ${discussion.category}`}>
                {discussion.category}
              </span>
              <span className="discussion-date">
                {formatDate(discussion.updatedAt)}
              </span>
            </div>
            
            <h3 className="discussion-title">
              <a 
                href={discussion.url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {discussion.title}
              </a>
            </h3>
            
            <div className="discussion-meta">
              <span className="discussion-author">
                {t('community.by')} {discussion.author}
              </span>
              <span className="discussion-comments">
                {discussion.commentsCount} {t('community.comments')}
              </span>
            </div>
            
            <div className="discussion-labels">
              {discussion.labels.map(label => (
                <span key={label} className="discussion-label">
                  {label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="community-forum">
      <div className="forum-header">
        <h2>{t('community.forumTitle')}</h2>
        
        <div className="forum-actions">
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('community.searchPlaceholder')}
            />
            <button type="submit">{t('action.search')}</button>
          </form>
          
          <a 
            href={`${repositoryUrl}/discussions/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="new-discussion-button"
          >
            {t('community.newDiscussion')}
          </a>
        </div>
      </div>
      
      {isSearching && (
        <div className="search-header">
          <h3>
            {t('community.searchResults', { count: searchResults.length })}
          </h3>
          <button className="clear-search" onClick={clearSearch}>
            {t('action.clearSearch')}
          </button>
        </div>
      )}
      
      {!isSearching && renderCategoryFilters()}
      
      {error && (
        <div className="forum-error">
          {error}
          <button className="error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {isLoading ? (
        <div className="forum-loading">
          <div className="loading-spinner"></div>
          <p>{t('message.loading')}</p>
        </div>
      ) : (
        renderDiscussions()
      )}
      
      <div className="forum-footer">
        <p>
          {t('community.joinDiscord')} 
          <a 
            href="https://discord.gg/your-discord" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Discord
          </a>
        </p>
      </div>
    </div>
  );
};

export default CommunityForum;
