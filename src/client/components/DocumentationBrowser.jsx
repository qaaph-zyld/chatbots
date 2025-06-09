import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '@src/client\components\DocumentationBrowser.css';

/**
 * Documentation Browser Component
 * 
 * Allows users to browse and search documentation
 */
const DocumentationBrowser = ({ onSelectItem, initialCategory = null, initialItem = null }) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(initialItem);
  const [itemContent, setItemContent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tableOfContents, setTableOfContents] = useState([]);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch items when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchItemsByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  // Fetch item content when selected item changes
  useEffect(() => {
    if (selectedItem) {
      fetchItemContent(selectedItem);
    } else {
      setItemContent(null);
      setTableOfContents([]);
    }
  }, [selectedItem]);

  // Fetch categories
  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/documentation/categories');
      setCategories(response.data.data);
      
      // If initial category is not set, select the first category
      if (!selectedCategory && response.data.data.length > 0) {
        setSelectedCategory(response.data.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching documentation categories:', err);
      setError(t('error.fetchCategories'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch items by category
  const fetchItemsByCategory = async (category) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/documentation/category/${category}`);
      setItems(response.data.data);
      
      // If initial item is not set, select the first item
      if (!selectedItem && response.data.data.length > 0) {
        setSelectedItem(response.data.data[0].id);
      }
    } catch (err) {
      console.error(`Error fetching documentation items for category ${category}:`, err);
      setError(t('error.fetchItems'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch item content
  const fetchItemContent = async (itemId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/documentation/item/${itemId}`);
      setItemContent(response.data.data);
      
      // Generate table of contents
      generateTableOfContents(response.data.data.content);
      
      // Notify parent component
      if (onSelectItem) {
        onSelectItem(response.data.data);
      }
    } catch (err) {
      console.error(`Error fetching documentation item ${itemId}:`, err);
      setError(t('error.fetchItemContent'));
    } finally {
      setIsLoading(false);
    }
  };

  // Generate table of contents
  const generateTableOfContents = async (content) => {
    try {
      const response = await axios.post('/api/documentation/toc', { content });
      setTableOfContents(response.data.data);
    } catch (err) {
      console.error('Error generating table of contents:', err);
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedItem(null);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // Handle item selection
  const handleItemSelect = (itemId) => {
    setSelectedItem(itemId);
    setIsSearching(false);
  };

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/documentation/search', {
        params: {
          query: searchQuery,
          category: selectedCategory || undefined
        }
      });
      
      setSearchResults(response.data.data);
      setIsSearching(true);
    } catch (err) {
      console.error(`Error searching documentation for "${searchQuery}":`, err);
      setError(t('error.search'));
    } finally {
      setIsLoading(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // Render category list
  const renderCategories = () => {
    return (
      <div className="doc-categories">
        <h3>{t('documentation.categories')}</h3>
        <ul className="category-list">
          {categories.map(category => (
            <li 
              key={category.id}
              className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategorySelect(category.id)}
            >
              {category.name}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Render item list
  const renderItems = () => {
    const displayItems = isSearching ? searchResults : items;
    
    return (
      <div className="doc-items">
        <div className="items-header">
          <h3>
            {isSearching 
              ? t('documentation.searchResults', { count: searchResults.length }) 
              : t('documentation.items')}
          </h3>
          {isSearching && (
            <button className="clear-search" onClick={clearSearch}>
              {t('action.clearSearch')}
            </button>
          )}
        </div>
        
        {displayItems.length > 0 ? (
          <ul className="item-list">
            {displayItems.map(item => (
              <li 
                key={item.id}
                className={`item-item ${selectedItem === item.id ? 'active' : ''}`}
                onClick={() => handleItemSelect(item.id)}
              >
                <div className="item-title">{item.title}</div>
                {isSearching && (
                  <div className="item-category">{getCategoryName(item.category)}</div>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="item-tags">
                    {item.tags.map(tag => (
                      <span key={tag} className="item-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-items">
            {isSearching 
              ? t('documentation.noSearchResults') 
              : t('documentation.noItems')}
          </div>
        )}
      </div>
    );
  };

  // Render item content
  const renderItemContent = () => {
    if (!itemContent) {
      return (
        <div className="doc-content empty">
          <p>{t('documentation.selectItem')}</p>
        </div>
      );
    }
    
    return (
      <div className="doc-content">
        <div className="content-header">
          <h2>{itemContent.title}</h2>
          {itemContent.tags && itemContent.tags.length > 0 && (
            <div className="content-tags">
              {itemContent.tags.map(tag => (
                <span key={tag} className="content-tag">{tag}</span>
              ))}
            </div>
          )}
          <div className="content-meta">
            <span className="content-version">v{itemContent.version}</span>
            <span className="content-updated">
              {t('documentation.updated')}: {formatDate(itemContent.updatedAt)}
            </span>
          </div>
        </div>
        
        <div className="content-body">
          {tableOfContents.length > 0 && (
            <div className="content-toc">
              <h3>{t('documentation.tableOfContents')}</h3>
              <ul className="toc-list">
                {tableOfContents.map((heading, index) => (
                  <li 
                    key={index}
                    className={`toc-item level-${heading.level}`}
                  >
                    <a href={`#${heading.id}`}>{heading.text}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div 
            className="content-html"
            dangerouslySetInnerHTML={{ __html: itemContent.htmlContent }}
          />
        </div>
      </div>
    );
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="documentation-browser">
      <div className="doc-search">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('documentation.searchPlaceholder')}
          />
          <button type="submit">{t('action.search')}</button>
        </form>
      </div>
      
      {error && (
        <div className="doc-error">
          {error}
          <button className="error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <div className="doc-container">
        <div className="doc-sidebar">
          {renderCategories()}
          {renderItems()}
        </div>
        
        {isLoading ? (
          <div className="doc-loading">
            <div className="loading-spinner"></div>
            <p>{t('message.loading')}</p>
          </div>
        ) : (
          renderItemContent()
        )}
      </div>
    </div>
  );
};

export default DocumentationBrowser;
