import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import '../i18n/i18n'; // Import i18n configuration
import './index.css';

/**
 * Main client-side entry point
 * 
 * Renders the application with internationalization support
 */
ReactDOM.render(
  <React.StrictMode>
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <App />
    </Suspense>
  </React.StrictMode>,
  document.getElementById('root')
);
