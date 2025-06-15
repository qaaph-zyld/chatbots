import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import pages
import '@src/client\pages\WorkflowsListPage';
import '@src/client\pages\WorkflowBuilderPage';
import '@src/client\pages\WorkflowAnalyticsPage';
import '@src/client\pages\WorkflowExecutionPage';
import '@src/client\pages\WorkflowTemplatesPage';
import '@src/client\pages\WorkflowTemplatePreviewPage';
import '@src/client\pages\WorkflowFromTemplatePage';
import '@src/client\pages\WorkflowDetailsPage';
import '@src/client\pages\ComponentsListPage';
import '@src/client\pages\ComponentCreatePage';
import '@src/client\pages\ComponentDetailsPage';
import '@src/client\pages\MarketplaceListPage';
import '@src/client\pages\MarketplaceDetailPage';
import '@src/client\pages\OfflineModelsPage';
import '@src/client\pages\LanguageSettingsPage';
import '@src/client\pages\DocumentationPage';
import '@src/client\pages\CommunityPage';
import '@src/client\pages\admin\CacheMetricsDashboard';

// Import layouts
import AdminLayout from '@src/client\components\admin\AdminLayout';

// Import CSS
import '@src/client\pages\WorkflowPages.css';
import '@src/client\pages\ComponentPages.css';
import '@src/client\pages\MarketplacePages.css';
import '@src/client\pages\WorkflowExecutionPage.css';
import '@src/client\pages\OfflineModelsPage.css';
import '@src/client\pages\LanguageSettingsPage.css';
import '@src/client\pages\DocumentationPage.css';
import '@src/client\pages\CommunityPage.css';

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
      
      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/cache-metrics" replace />} />
        <Route path="cache-metrics" element={<CacheMetricsDashboard />} />
        <Route path="performance" element={<div>Performance Dashboard (Coming Soon)</div>} />
        <Route path="settings" element={<div>Admin Settings (Coming Soon)</div>} />
      </Route>
      
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
