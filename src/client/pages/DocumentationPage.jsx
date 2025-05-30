import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DocumentationBrowser from '../components/DocumentationBrowser';
import './DocumentationPage.css';

/**
 * Documentation Page
 * 
 * Page for browsing and searching documentation
 */
const DocumentationPage = () => {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Handle item selection
  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  return (
    <div className="documentation-page">
      <div className="page-header">
        <div className="header-content">
          <h1>{t('pages.documentation.title')}</h1>
          <p className="page-description">{t('pages.documentation.description')}</p>
        </div>
      </div>
      
      <div className="page-content">
        <div className="documentation-container">
          <DocumentationBrowser onSelectItem={handleSelectItem} />
        </div>
        
        <div className="documentation-info">
          <div className="info-card">
            <h3>{t('pages.documentation.contribute.title')}</h3>
            <p>{t('pages.documentation.contribute.description')}</p>
            <a 
              href="https://github.com/your-repo/chatbots/blob/main/CONTRIBUTING.md" 
              target="_blank" 
              rel="noopener noreferrer"
              className="info-link"
            >
              {t('pages.documentation.contribute.link')}
            </a>
          </div>
          
          <div className="info-card">
            <h3>{t('pages.documentation.api.title')}</h3>
            <p>{t('pages.documentation.api.description')}</p>
            <a 
              href="/api-docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="info-link"
            >
              {t('pages.documentation.api.link')}
            </a>
          </div>
          
          <div className="info-card">
            <h3>{t('pages.documentation.community.title')}</h3>
            <p>{t('pages.documentation.community.description')}</p>
            <div className="community-links">
              <a 
                href="https://discord.gg/your-discord" 
                target="_blank" 
                rel="noopener noreferrer"
                className="community-link discord"
              >
                Discord
              </a>
              <a 
                href="https://github.com/your-repo/chatbots/discussions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="community-link github"
              >
                GitHub Discussions
              </a>
              <a 
                href="https://stackoverflow.com/questions/tagged/chatbot-platform" 
                target="_blank" 
                rel="noopener noreferrer"
                className="community-link stackoverflow"
              >
                Stack Overflow
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
