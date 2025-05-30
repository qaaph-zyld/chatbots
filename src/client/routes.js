import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import pages
import WorkflowsListPage from './pages/WorkflowsListPage';
import WorkflowBuilderPage from './pages/WorkflowBuilderPage';
import WorkflowAnalyticsPage from './pages/WorkflowAnalyticsPage';
import WorkflowExecutionPage from './pages/WorkflowExecutionPage';
import WorkflowTemplatesPage from './pages/WorkflowTemplatesPage';
import WorkflowTemplatePreviewPage from './pages/WorkflowTemplatePreviewPage';
import WorkflowFromTemplatePage from './pages/WorkflowFromTemplatePage';
import WorkflowDetailsPage from './pages/WorkflowDetailsPage';
import ComponentsListPage from './pages/ComponentsListPage';
import ComponentCreatePage from './pages/ComponentCreatePage';
import ComponentDetailsPage from './pages/ComponentDetailsPage';
import MarketplaceListPage from './pages/MarketplaceListPage';
import MarketplaceDetailPage from './pages/MarketplaceDetailPage';
import OfflineModelsPage from './pages/OfflineModelsPage';
import LanguageSettingsPage from './pages/LanguageSettingsPage';
import DocumentationPage from './pages/DocumentationPage';
import CommunityPage from './pages/CommunityPage';

// Import CSS
import './pages/WorkflowPages.css';
import './pages/ComponentPages.css';
import './pages/MarketplacePages.css';
import './pages/WorkflowExecutionPage.css';
import './pages/OfflineModelsPage.css';
import './pages/LanguageSettingsPage.css';
import './pages/DocumentationPage.css';
import './pages/CommunityPage.css';

/**
 * Application Routes
 * 
 * Defines the routing structure for the client application
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirect root to chatbots */}
      <Route path="/" element={<Navigate to="/chatbots" replace />} />
      
      {/* Chatbot routes */}
      <Route path="/chatbots" element={<div>Chatbots List Page</div>} />
      <Route path="/chatbots/:chatbotId" element={<div>Chatbot Details Page</div>} />
      
      {/* Workflow routes */}
      <Route path="/chatbots/:chatbotId/workflows" element={<WorkflowsListPage />} />
      <Route path="/chatbots/:chatbotId/workflows/templates" element={<WorkflowTemplatesPage />} />
      <Route path="/chatbots/:chatbotId/workflows/create" element={<WorkflowBuilderPage />} />
      <Route path="/chatbots/:chatbotId/workflows/:workflowId" element={<WorkflowDetailsPage />} />
      <Route path="/chatbots/:chatbotId/workflows/:workflowId/edit" element={<WorkflowBuilderPage />} />
      <Route path="/chatbots/:chatbotId/workflows/:workflowId/analytics" element={<WorkflowAnalyticsPage />} />
      <Route path="/chatbots/:chatbotId/workflows/template/:templateId" element={<WorkflowFromTemplatePage />} />
      <Route path="/chatbots/:chatbotId/workflows/template/:templateId/preview" element={<WorkflowTemplatePreviewPage />} />
      
      {/* Custom Component Routes */}
      <Route path="/components" element={<ComponentsListPage />} />
      <Route path="/components/create" element={<ComponentCreatePage />} />
      <Route path="/components/:name/:version?" element={<ComponentDetailsPage />} />
      
      {/* Marketplace Routes */}
      <Route path="/marketplace" element={<MarketplaceListPage />} />
      <Route path="/marketplace/:id" element={<MarketplaceDetailPage />} />
      
      {/* Offline and Language Routes */}
      <Route path="/offline-models" element={<OfflineModelsPage />} />
      <Route path="/language-settings" element={<LanguageSettingsPage />} />
      
      {/* Documentation Routes */}
      <Route path="/documentation" element={<DocumentationPage />} />
      <Route path="/documentation/:category" element={<DocumentationPage />} />
      <Route path="/documentation/:category/:id" element={<DocumentationPage />} />
      
      {/* Community Routes */}
      <Route path="/community" element={<CommunityPage />} />
      
      {/* Workflow execution routes */}
      <Route path="/workflow-executions/:executionId" element={<WorkflowExecutionPage />} />
      
      {/* 404 route */}
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
