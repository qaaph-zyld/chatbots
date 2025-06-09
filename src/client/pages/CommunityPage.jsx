import React from 'react';
import { useTranslation } from 'react-i18next';
import '@src/client\components\CommunityForum';
import '@src/client\pages\CommunityPage.css';

/**
 * Community Page
 * 
 * Page for community engagement and forum integration
 */
const CommunityPage = () => {
  const { t } = useTranslation();
  
  return (
    <div className="community-page">
      <div className="page-header">
        <div className="header-content">
          <h1>{t('pages.community.title')}</h1>
          <p className="page-description">{t('pages.community.description')}</p>
        </div>
      </div>
      
      <div className="page-content">
        <div className="community-container">
          <CommunityForum 
            platform="github" 
            repositoryUrl="https://github.com/your-repo/chatbots" 
          />
        </div>
        
        <div className="community-info">
          <div className="info-card">
            <h3>{t('pages.community.contribute.title')}</h3>
            <p>{t('pages.community.contribute.description')}</p>
            <a 
              href="https://github.com/your-repo/chatbots/blob/main/CONTRIBUTING.md" 
              target="_blank" 
              rel="noopener noreferrer"
              className="info-link"
            >
              {t('pages.community.contribute.link')}
            </a>
          </div>
          
          <div className="info-card">
            <h3>{t('pages.community.discord.title')}</h3>
            <p>{t('pages.community.discord.description')}</p>
            <a 
              href="https://discord.gg/your-discord" 
              target="_blank" 
              rel="noopener noreferrer"
              className="info-link discord"
            >
              {t('pages.community.discord.link')}
            </a>
          </div>
          
          <div className="info-card">
            <h3>{t('pages.community.events.title')}</h3>
            <p>{t('pages.community.events.description')}</p>
            <div className="events-list">
              <div className="event-item">
                <div className="event-date">
                  <span className="event-month">Jun</span>
                  <span className="event-day">15</span>
                </div>
                <div className="event-details">
                  <h4>Community Call: New Features</h4>
                  <p>Online - 3:00 PM UTC</p>
                </div>
              </div>
              
              <div className="event-item">
                <div className="event-date">
                  <span className="event-month">Jul</span>
                  <span className="event-day">10</span>
                </div>
                <div className="event-details">
                  <h4>Workshop: Building Advanced Chatbots</h4>
                  <p>Online - 2:00 PM UTC</p>
                </div>
              </div>
              
              <div className="event-item">
                <div className="event-date">
                  <span className="event-month">Aug</span>
                  <span className="event-day">05</span>
                </div>
                <div className="event-details">
                  <h4>Hackathon: Innovative Chatbot Solutions</h4>
                  <p>Online - All Day</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="community-resources">
        <h2>{t('pages.community.resources.title')}</h2>
        
        <div className="resources-grid">
          <a 
            href="https://github.com/your-repo/chatbots/wiki" 
            target="_blank" 
            rel="noopener noreferrer"
            className="resource-card"
          >
            <div className="resource-icon">📚</div>
            <div className="resource-content">
              <h3>{t('pages.community.resources.wiki.title')}</h3>
              <p>{t('pages.community.resources.wiki.description')}</p>
            </div>
          </a>
          
          <a 
            href="https://www.youtube.com/channel/your-channel" 
            target="_blank" 
            rel="noopener noreferrer"
            className="resource-card"
          >
            <div className="resource-icon">🎬</div>
            <div className="resource-content">
              <h3>{t('pages.community.resources.videos.title')}</h3>
              <p>{t('pages.community.resources.videos.description')}</p>
            </div>
          </a>
          
          <a 
            href="https://github.com/your-repo/chatbots/blob/main/ROADMAP.md" 
            target="_blank" 
            rel="noopener noreferrer"
            className="resource-card"
          >
            <div className="resource-icon">🗺️</div>
            <div className="resource-content">
              <h3>{t('pages.community.resources.roadmap.title')}</h3>
              <p>{t('pages.community.resources.roadmap.description')}</p>
            </div>
          </a>
          
          <a 
            href="https://github.com/your-repo/chatbots/blob/main/CODE_OF_CONDUCT.md" 
            target="_blank" 
            rel="noopener noreferrer"
            className="resource-card"
          >
            <div className="resource-icon">🤝</div>
            <div className="resource-content">
              <h3>{t('pages.community.resources.codeOfConduct.title')}</h3>
              <p>{t('pages.community.resources.codeOfConduct.description')}</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
