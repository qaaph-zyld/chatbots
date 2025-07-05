import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import AppRoutes from './routes';
import LanguageSelector from './components/LanguageSelector';

// Configure axios with proxy as specified in user requirements
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

// Set default base URL for API requests
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

/**
 * Main App Component
 * 
 * Entry point for the client application
 */
const App = () => {
  const { t } = useTranslation();
  
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <div className="app-header__logo">
            <h1>{t('app.name')}</h1>
            <p className="app-tagline">{t('app.tagline')}</p>
          </div>
          <nav className="app-header__nav">
            <ul>
              <li><a href="/chatbots">{t('nav.chatbots')}</a></li>
              <li><a href="/templates">{t('nav.workflows')}</a></li>
              <li><a href="/analytics">{t('nav.analytics')}</a></li>
              <li><a href="/components">{t('nav.components')}</a></li>
              <li><a href="/marketplace">{t('nav.marketplace')}</a></li>
              <li><a href="/offline-models">{t('nav.offlineModels')}</a></li>
              <li><a href="/language-settings">{t('nav.languageSettings')}</a></li>
              <li><a href="/documentation">{t('nav.documentation')}</a></li>
              <li><a href="/community">{t('nav.community')}</a></li>
              <li><a href="/settings">{t('nav.settings')}</a></li>
            </ul>
          </nav>
          <div className="app-header__user">
            <LanguageSelector />
            <span className="user-name">User</span>
            <button className="logout-button">{t('auth.logout')}</button>
          </div>
        </header>
        
        <main className="app-content">
          <AppRoutes />
        </main>
        
        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} {t('app.name')}. {t('settings.copyright')}</p>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
