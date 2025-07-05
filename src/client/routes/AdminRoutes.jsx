import React from 'react';
import { Route, Switch } from 'react-router-dom';
import SystemHealthDashboard from '../components/monitoring/SystemHealthDashboard';

/**
 * Admin Routes Component
 * 
 * Defines routes for admin-only pages
 */
const AdminRoutes = () => {
  return (
    <Switch>
      <Route path="/admin/monitoring" component={SystemHealthDashboard} />
      {/* Add more admin routes here */}
    </Switch>
  );
};

export default AdminRoutes;
