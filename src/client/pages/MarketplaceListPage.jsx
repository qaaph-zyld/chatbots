import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * Marketplace List Page
 * 
 * Displays a list of components available in the marketplace
 */
const MarketplaceListPage = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    tags: [],
    sort: 'downloads',
    order: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const navigate = useNavigate();

  // Fetch components on component mount and when filters or pagination change
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit,
          sort: filters.sort,
          order: filters.order,
          search: filters.search,
          type: filters.type
        });
        
        if (filters.tags.length > 0) {
          params.append('tags', filters.tags.join(','));
        }
        
        const response = await axios.get(`/api/marketplace?${params.toString()}`);
        
        setComponents(response.data.items);
        setPagination({
          ...pagination,
          total: response.data.total,
          totalPages: response.data.totalPages
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching marketplace components:', err);
        setError('Failed to load marketplace components. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchComponents();
  }, [filters, pagination.page, pagination.limit]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setFilters({
      ...filters,
      search: e.target.value
    });
  };

  // Handle type filter change
  const handleTypeChange = (e) => {
    setFilters({
      ...filters,
      type: e.target.value
    });
  };

  // Handle tag filter change
  const handleTagChange = (tag) => {
    if (filters.tags.includes(tag)) {
      setFilters({
        ...filters,
        tags: filters.tags.filter(t => t !== tag)
      });
    } else {
      setFilters({
        ...filters,
        tags: [...filters.tags, tag]
      });
    }
  };

  // Handle sort change
  const handleSortChange = (e) => {
    const [sort, order] = e.target.value.split('-');
    setFilters({
      ...filters,
      sort,
      order
    });
  };

  // Handle page change
  const handlePageChange = (page) => {
    setPagination({
      ...pagination,
      page
    });
  };

  // Handle component installation
  const handleInstallComponent = async (id) => {
    try {
      setLoading(true);
      await axios.post(`/api/marketplace/${id}/install`);
      alert('Component installed successfully!');
    } catch (err) {
      console.error('Error installing component:', err);
      setError('Failed to install component. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Generate pagination links
  const renderPagination = () => {
    const pages = [];
    const maxPages = Math.min(pagination.totalPages, 5);
    
    let startPage = Math.max(1, pagination.page - 2);
    let endPage = Math.min(pagination.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-button ${pagination.page === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="pagination">
        <button
          className="pagination-button"
          onClick={() => handlePageChange(1)}
          disabled={pagination.page === 1}
        >
          &laquo;
        </button>
        <button
          className="pagination-button"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          &lt;
        </button>
        {pages}
        <button
          className="pagination-button"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
        >
          &gt;
        </button>
        <button
          className="pagination-button"
          onClick={() => handlePageChange(pagination.totalPages)}
          disabled={pagination.page === pagination.totalPages}
        >
          &raquo;
        </button>
      </div>
    );
  };

  return (
    <div className="marketplace-list-page">
      <div className="marketplace-list-page__header">
        <h1>Component Marketplace</h1>
        <Link to="/components" className="back-button">
          My Components
        </Link>
      </div>

      <div className="marketplace-filters">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search components..."
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="type-filter">
          <select value={filters.type} onChange={handleTypeChange}>
            <option value="">All Types</option>
            <option value="message">Message</option>
            <option value="input">Input</option>
            <option value="button">Button</option>
            <option value="card">Card</option>
            <option value="carousel">Carousel</option>
            <option value="list">List</option>
            <option value="media">Media</option>
            <option value="form">Form</option>
            <option value="chart">Chart</option>
            <option value="container">Container</option>
          </select>
        </div>

        <div className="sort-filter">
          <select
            value={`${filters.sort}-${filters.order}`}
            onChange={handleSortChange}
          >
            <option value="downloads-desc">Most Downloaded</option>
            <option value="rating-desc">Highest Rated</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="created-desc">Newest</option>
            <option value="created-asc">Oldest</option>
          </select>
        </div>
      </div>

      {loading && components.length === 0 ? (
        <div className="marketplace-list-page__loading">
          <p>Loading components...</p>
        </div>
      ) : error ? (
        <div className="marketplace-list-page__error">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {components.length === 0 ? (
            <div className="marketplace-list-page__empty">
              <p>No components found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="marketplace-components-grid">
                {components.map((component) => (
                  <div key={component.id} className="marketplace-component-card">
                    <div className="marketplace-component-card__header">
                      <h2>{component.displayName || component.name}</h2>
                      <span className="component-type">{component.type}</span>
                    </div>
                    <div className="marketplace-component-card__content">
                      <p className="component-description">{component.description}</p>
                      <div className="component-meta">
                        <span className="component-version">v{component.version}</span>
                        <span className="component-author">by {component.author}</span>
                      </div>
                      <div className="component-stats">
                        <div className="component-rating">
                          <span className="rating-stars">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={`rating-star ${i < Math.floor(component.rating) ? 'active' : ''}`}
                              >
                                ★
                              </span>
                            ))}
                          </span>
                          <span className="rating-value">
                            {component.rating.toFixed(1)} ({component.ratingCount})
                          </span>
                        </div>
                        <div className="component-downloads">
                          <span className="downloads-icon">↓</span>
                          <span className="downloads-value">{component.downloads}</span>
                        </div>
                      </div>
                      {component.tags && component.tags.length > 0 && (
                        <div className="component-tags">
                          {component.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`component-tag ${filters.tags.includes(tag) ? 'active' : ''}`}
                              onClick={() => handleTagChange(tag)}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="marketplace-component-card__actions">
                      <Link
                        to={`/marketplace/${component.id}`}
                        className="view-button"
                      >
                        View Details
                      </Link>
                      <button
                        className="install-button"
                        onClick={() => handleInstallComponent(component.id)}
                      >
                        Install
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {pagination.totalPages > 1 && renderPagination()}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MarketplaceListPage;
