import React from 'react';
import { Route, Switch } from 'react-router-dom';
import AdminRoutes from './AdminRoutes';

/**
 * Main Routes Component
 * 
 * Defines all application routes
 */
const AppRoutes = () => {
  return (
    <Switch>
      {/* Admin routes */}
      <Route path="/admin" component={AdminRoutes} />
      
      {/* Public routes */}
      <Route path="/" exact render={() => <div>Home Page</div>} />
      <Route path="/chatbots" render={() => <div>Chatbots Page</div>} />
      <Route path="/templates" render={() => <div>Templates Page</div>} />
      <Route path="/analytics" render={() => <div>Analytics Page</div>} />
      <Route path="/components" render={() => <div>Components Page</div>} />
      <Route path="/marketplace" render={() => <div>Marketplace Page</div>} />
      <Route path="/offline-models" render={() => <div>Offline Models Page</div>} />
      <Route path="/language-settings" render={() => <div>Language Settings Page</div>} />
      <Route path="/documentation" render={() => <div>Documentation Page</div>} />
      <Route path="/community" render={() => <div>Community Page</div>} />
      <Route path="/settings" render={() => <div>Settings Page</div>} />
      
      {/* 404 route */}
      <Route render={() => <div>404 - Page Not Found</div>} />
    </Switch>
  );
};

export default AppRoutes;
