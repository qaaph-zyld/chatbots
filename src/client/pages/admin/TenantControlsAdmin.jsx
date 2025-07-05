/**
 * Tenant Controls Admin Component
 * 
 * Provides administrative interface for managing tenant settings and controls
 * Features include:
 * - Viewing all tenants
 * - Managing tenant status (active/suspended)
 * - Setting tenant-specific limits and quotas
 * - Managing tenant administrators
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Block as SuspendIcon,
  CheckCircle as ActivateIcon,
  Delete as DeleteIcon,
  Person as AdminIcon
} from '@mui/icons-material';
import { useAuth } from '../../../auth/hooks/useAuth';
import { formatDate } from '../../../utils/formatters';

const TenantControlsAdmin = () => {
  const { authToken } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [tenantAdmins, setTenantAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Fetch tenants with pagination and filtering
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const queryParams = new URLSearchParams({
          page: page + 1,
          limit: rowsPerPage,
          ...Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== '')
          )
        });
        
        const response = await fetch(
          `/api/admin/tenants?${queryParams.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Error fetching tenants: ${response.statusText}`);
        }
        
        const data = await response.json();
        setTenants(data.tenants);
        setTotalCount(data.totalCount);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTenants();
  }, [page, rowsPerPage, filters, authToken]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter change
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };

  // Handle edit tenant
  const handleEditTenant = (tenant) => {
    setSelectedTenant(tenant);
    setDialogType('edit');
    setDialogOpen(true);
  };

  // Handle suspend tenant
  const handleSuspendTenant = (tenant) => {
    setSelectedTenant(tenant);
    setDialogType('suspend');
    setDialogOpen(true);
  };

  // Handle activate tenant
  const handleActivateTenant = (tenant) => {
    setSelectedTenant(tenant);
    setDialogType('activate');
    setDialogOpen(true);
  };

  // Handle delete tenant
  const handleDeleteTenant = (tenant) => {
    setSelectedTenant(tenant);
    setDialogType('delete');
    setDialogOpen(true);
  };

  // Handle view tenant admins
  const handleViewTenantAdmins = async (tenant) => {
    try {
      setSelectedTenant(tenant);
      setDialogType('admins');
      setDialogOpen(true);
      setLoadingAdmins(true);
      
      const response = await fetch(
        `/api/admin/tenants/${tenant._id}/admins`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching tenant admins: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTenantAdmins(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedTenant(null);
    setTenantAdmins([]);
  };

  // Handle tenant update
  const handleTenantUpdate = async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData(event.target);
      const updatedData = {
        name: formData.get('name'),
        maxUsers: parseInt(formData.get('maxUsers'), 10),
        maxStorage: parseInt(formData.get('maxStorage'), 10),
        maxRequests: parseInt(formData.get('maxRequests'), 10),
        features: {
          analytics: formData.get('analyticsEnabled') === 'on',
          customization: formData.get('customizationEnabled') === 'on',
          apiAccess: formData.get('apiAccessEnabled') === 'on'
        }
      };
      
      const response = await fetch(
        `/api/admin/tenants/${selectedTenant._id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedData)
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error updating tenant: ${response.statusText}`);
      }
      
      // Refresh tenants list
      const updatedTenants = tenants.map(tenant => 
        tenant._id === selectedTenant._id ? { ...tenant, ...updatedData } : tenant
      );
      setTenants(updatedTenants);
      handleDialogClose();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle tenant suspension
  const handleTenantSuspensionConfirm = async () => {
    try {
      const response = await fetch(
        `/api/admin/tenants/${selectedTenant._id}/suspend`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error suspending tenant: ${response.statusText}`);
      }
      
      // Update tenant status in the list
      const updatedTenants = tenants.map(tenant => 
        tenant._id === selectedTenant._id ? { ...tenant, status: 'suspended' } : tenant
      );
      setTenants(updatedTenants);
      handleDialogClose();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle tenant activation
  const handleTenantActivationConfirm = async () => {
    try {
      const response = await fetch(
        `/api/admin/tenants/${selectedTenant._id}/activate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error activating tenant: ${response.statusText}`);
      }
      
      // Update tenant status in the list
      const updatedTenants = tenants.map(tenant => 
        tenant._id === selectedTenant._id ? { ...tenant, status: 'active' } : tenant
      );
      setTenants(updatedTenants);
      handleDialogClose();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle tenant deletion
  const handleTenantDeletionConfirm = async () => {
    try {
      const response = await fetch(
        `/api/admin/tenants/${selectedTenant._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error deleting tenant: ${response.statusText}`);
      }
      
      // Remove tenant from the list
      const updatedTenants = tenants.filter(tenant => tenant._id !== selectedTenant._id);
      setTenants(updatedTenants);
      handleDialogClose();
    } catch (err) {
      setError(err.message);
    }
  };

  // Render status chip
  const renderStatusChip = (status) => {
    let color = 'default';
    
    switch (status) {
      case 'active':
        color = 'success';
        break;
      case 'suspended':
        color = 'error';
        break;
      case 'pending':
        color = 'warning';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={status} color={color} size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tenant Controls
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Search Tenant"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tenants Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Users</TableCell>
              <TableCell>Storage Used</TableCell>
              <TableCell>API Requests</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No tenants found
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => (
                <TableRow key={tenant._id}>
                  <TableCell>{tenant.name}</TableCell>
                  <TableCell>{renderStatusChip(tenant.status)}</TableCell>
                  <TableCell>{formatDate(tenant.createdAt)}</TableCell>
                  <TableCell>{tenant.userCount} / {tenant.maxUsers}</TableCell>
                  <TableCell>{tenant.storageUsed} / {tenant.maxStorage} MB</TableCell>
                  <TableCell>{tenant.apiRequests} / {tenant.maxRequests}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditTenant(tenant)}
                    >
                      Edit
                    </Button>
                    {tenant.status === 'active' && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<SuspendIcon />}
                        onClick={() => handleSuspendTenant(tenant)}
                      >
                        Suspend
                      </Button>
                    )}
                    {tenant.status === 'suspended' && (
                      <Button
                        size="small"
                        color="success"
                        startIcon={<ActivateIcon />}
                        onClick={() => handleActivateTenant(tenant)}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      size="small"
                      startIcon={<AdminIcon />}
                      onClick={() => handleViewTenantAdmins(tenant)}
                    >
                      Admins
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteTenant(tenant)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default TenantControlsAdmin;
