/**
 * Subscription Management Admin Component
 * 
 * Provides administrative interface for managing subscriptions across tenants
 * Features include:
 * - Viewing all active subscriptions
 * - Filtering by status, plan, and tenant
 * - Modifying subscription details
 * - Handling subscription cancellations and reactivations
 * - Viewing payment history
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
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as CancelIcon,
  Refresh as ReactivateIcon,
  History as HistoryIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../../../auth/hooks/useAuth';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const SubscriptionManagementAdmin = () => {
  const { authToken } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    plan: '',
    tenantName: '',
    search: ''
  });
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);

  // Fetch subscriptions with pagination and filtering
  useEffect(() => {
    const fetchSubscriptions = async () => {
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
          `/api/admin/subscriptions?${queryParams.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Error fetching subscriptions: ${response.statusText}`);
        }
        
        const data = await response.json();
        setSubscriptions(data.subscriptions);
        setTotalCount(data.totalCount);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscriptions();
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

  // Handle edit subscription
  const handleEditSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setDialogType('edit');
    setDialogOpen(true);
  };

  // Handle cancel subscription
  const handleCancelSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setDialogType('cancel');
    setDialogOpen(true);
  };

  // Handle reactivate subscription
  const handleReactivateSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setDialogType('reactivate');
    setDialogOpen(true);
  };

  // Handle view payment history
  const handleViewPaymentHistory = async (subscription) => {
    try {
      setSelectedSubscription(subscription);
      setDialogType('history');
      setDialogOpen(true);
      setLoadingPaymentHistory(true);
      
      const response = await fetch(
        `/api/admin/subscriptions/${subscription._id}/payments`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching payment history: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPaymentHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPaymentHistory(false);
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedSubscription(null);
    setPaymentHistory([]);
  };

  // Handle subscription update
  const handleSubscriptionUpdate = async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData(event.target);
      const updatedData = {
        plan: formData.get('plan'),
        status: formData.get('status'),
        notes: formData.get('notes')
      };
      
      const response = await fetch(
        `/api/admin/subscriptions/${selectedSubscription._id}`,
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
        throw new Error(`Error updating subscription: ${response.statusText}`);
      }
      
      // Refresh subscriptions list
      const updatedSubscriptions = subscriptions.map(sub => 
        sub._id === selectedSubscription._id ? { ...sub, ...updatedData } : sub
      );
      setSubscriptions(updatedSubscriptions);
      handleDialogClose();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle subscription cancellation
  const handleSubscriptionCancellationConfirm = async () => {
    try {
      const response = await fetch(
        `/api/admin/subscriptions/${selectedSubscription._id}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error cancelling subscription: ${response.statusText}`);
      }
      
      // Update subscription status in the list
      const updatedSubscriptions = subscriptions.map(sub => 
        sub._id === selectedSubscription._id ? { ...sub, status: 'cancelled' } : sub
      );
      setSubscriptions(updatedSubscriptions);
      handleDialogClose();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle subscription reactivation
  const handleSubscriptionReactivationConfirm = async () => {
    try {
      const response = await fetch(
        `/api/admin/subscriptions/${selectedSubscription._id}/reactivate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error reactivating subscription: ${response.statusText}`);
      }
      
      // Update subscription status in the list
      const updatedSubscriptions = subscriptions.map(sub => 
        sub._id === selectedSubscription._id ? { ...sub, status: 'active' } : sub
      );
      setSubscriptions(updatedSubscriptions);
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
      case 'cancelled':
        color = 'error';
        break;
      case 'past_due':
        color = 'warning';
        break;
      case 'trialing':
        color = 'info';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={status} color={color} size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Subscription Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
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
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="past_due">Past Due</MenuItem>
              <MenuItem value="trialing">Trial</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Plan"
              name="plan"
              value={filters.plan}
              onChange={handleFilterChange}
            >
              <MenuItem value="">All Plans</MenuItem>
              <MenuItem value="basic">Basic</MenuItem>
              <MenuItem value="premium">Premium</MenuItem>
              <MenuItem value="enterprise">Enterprise</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Search Tenant"
              name="tenantName"
              value={filters.tenantName}
              onChange={handleFilterChange}
              InputProps={{
                endAdornment: <SearchIcon color="action" />
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Subscriptions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tenant</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Next Billing</TableCell>
              <TableCell>Amount</TableCell>
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
            ) : subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No subscriptions found
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((subscription) => (
                <TableRow key={subscription._id}>
                  <TableCell>{subscription.tenantName}</TableCell>
                  <TableCell>{subscription.plan}</TableCell>
                  <TableCell>{renderStatusChip(subscription.status)}</TableCell>
                  <TableCell>{formatDate(subscription.startDate)}</TableCell>
                  <TableCell>{formatDate(subscription.currentPeriodEnd)}</TableCell>
                  <TableCell>{formatCurrency(subscription.amount, subscription.currency)}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditSubscription(subscription)}
                    >
                      Edit
                    </Button>
                    {subscription.status === 'active' && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleCancelSubscription(subscription)}
                      >
                        Cancel
                      </Button>
                    )}
                    {subscription.status === 'cancelled' && (
                      <Button
                        size="small"
                        color="success"
                        startIcon={<ReactivateIcon />}
                        onClick={() => handleReactivateSubscription(subscription)}
                      >
                        Reactivate
                      </Button>
                    )}
                    <Button
                      size="small"
                      startIcon={<HistoryIcon />}
                      onClick={() => handleViewPaymentHistory(subscription)}
                    >
                      History
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
      
      {/* Edit Subscription Dialog */}
      {selectedSubscription && dialogType === 'edit' && (
        <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
          <form onSubmit={handleSubscriptionUpdate}>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Plan"
                    name="plan"
                    defaultValue={selectedSubscription.plan}
                  >
                    <MenuItem value="basic">Basic</MenuItem>
                    <MenuItem value="premium">Premium</MenuItem>
                    <MenuItem value="enterprise">Enterprise</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    name="status"
                    defaultValue={selectedSubscription.status}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="past_due">Past Due</MenuItem>
                    <MenuItem value="trialing">Trial</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Admin Notes"
                    name="notes"
                    multiline
                    rows={3}
                    defaultValue={selectedSubscription.notes || ''}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDialogClose}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                Save Changes
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
      
      {/* Cancel Subscription Dialog */}
      {selectedSubscription && dialogType === 'cancel' && (
        <Dialog open={dialogOpen} onClose={handleDialogClose}>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to cancel the subscription for {selectedSubscription.tenantName}?
            </Typography>
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              This action will immediately cancel the subscription and revoke access to premium features.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>No, Keep Active</Button>
            <Button onClick={handleSubscriptionCancellationConfirm} variant="contained" color="error">
              Yes, Cancel Subscription
            </Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* Reactivate Subscription Dialog */}
      {selectedSubscription && dialogType === 'reactivate' && (
        <Dialog open={dialogOpen} onClose={handleDialogClose}>
          <DialogTitle>Reactivate Subscription</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to reactivate the subscription for {selectedSubscription.tenantName}?
            </Typography>
            <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
              This will reinstate billing and restore access to premium features.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button onClick={handleSubscriptionReactivationConfirm} variant="contained" color="success">
              Reactivate Subscription
            </Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* Payment History Dialog */}
      {selectedSubscription && dialogType === 'history' && (
        <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
          <DialogTitle>Payment History - {selectedSubscription.tenantName}</DialogTitle>
          <DialogContent>
            {loadingPaymentHistory ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : paymentHistory.length === 0 ? (
              <Typography>No payment history found</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Payment Method</TableCell>
                      <TableCell>Invoice ID</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                        <TableCell>{renderStatusChip(payment.status)}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell>{payment.invoiceId}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default SubscriptionManagementAdmin;
