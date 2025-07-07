import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import SubscriptionManagementAdmin from '../../../../../src/client/pages/admin/SubscriptionManagementAdmin';
import { useAuth } from '../../../../../src/auth/hooks/useAuth';

// Mock the auth hook
jest.mock('../../../../../src/auth/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock the formatters
jest.mock('../../../../../src/utils/formatters', () => ({
  formatCurrency: jest.fn((amount) => `$${amount}`),
  formatDate: jest.fn((date) => '2025-07-01')
}));

// Mock fetch
global.fetch = jest.fn();

describe('SubscriptionManagementAdmin Component', () => {
  const mockAuthToken = 'test-auth-token';
  const mockSubscriptions = [
    {
      _id: '1',
      tenantName: 'Tenant 1',
      plan: 'premium',
      status: 'active',
      startDate: '2025-01-01',
      currentPeriodEnd: '2025-12-31',
      amount: 99.99,
      currency: 'USD'
    },
    {
      _id: '2',
      tenantName: 'Tenant 2',
      plan: 'basic',
      status: 'cancelled',
      startDate: '2025-02-01',
      currentPeriodEnd: '2025-03-01',
      amount: 49.99,
      currency: 'USD'
    }
  ];

  beforeEach(() => {
    // Setup mocks
    useAuth.mockReturnValue({ authToken: mockAuthToken });
    
    // Reset fetch mock
    fetch.mockReset();
    
    // Mock successful fetch for subscriptions
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        subscriptions: mockSubscriptions,
        totalCount: mockSubscriptions.length
      })
    });
  });

  test('renders subscription management title', async () => {
    await act(async () => {
      render(<SubscriptionManagementAdmin />);
    });
    
    expect(screen.getByText('Subscription Management')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    render(<SubscriptionManagementAdmin />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('fetches and displays subscriptions', async () => {
    await act(async () => {
      render(<SubscriptionManagementAdmin />);
    });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/subscriptions?page=1&limit=10',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAuthToken}`
          })
        })
      );
    });
    
    expect(screen.getByText('Tenant 1')).toBeInTheDocument();
    expect(screen.getByText('Tenant 2')).toBeInTheDocument();
    expect(screen.getByText('premium')).toBeInTheDocument();
    expect(screen.getByText('basic')).toBeInTheDocument();
  });

  test('handles filter changes', async () => {
    // Setup second fetch mock for filtered results
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        subscriptions: [mockSubscriptions[0]],
        totalCount: 1
      })
    });
    
    await act(async () => {
      render(<SubscriptionManagementAdmin />);
    });
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Tenant 1')).toBeInTheDocument();
    });
    
    // Change status filter
    const statusFilter = screen.getByLabelText('Status');
    await act(async () => {
      fireEvent.change(statusFilter, { target: { value: 'active' } });
    });
    
    // Verify second fetch was called with filter
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/subscriptions?page=1&limit=10&status=active',
        expect.anything()
      );
    });
  });

  test('opens edit subscription dialog', async () => {
    await act(async () => {
      render(<SubscriptionManagementAdmin />);
    });
    
    // Wait for subscriptions to load
    await waitFor(() => {
      expect(screen.getByText('Tenant 1')).toBeInTheDocument();
    });
    
    // Click edit button for first subscription
    const editButtons = screen.getAllByText('Edit');
    await act(async () => {
      fireEvent.click(editButtons[0]);
    });
    
    // Verify dialog is open
    expect(screen.getByText('Edit Subscription')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  test('handles subscription update', async () => {
    // Mock successful update
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        subscriptions: mockSubscriptions,
        totalCount: mockSubscriptions.length
      })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });
    
    await act(async () => {
      render(<SubscriptionManagementAdmin />);
    });
    
    // Wait for subscriptions to load
    await waitFor(() => {
      expect(screen.getByText('Tenant 1')).toBeInTheDocument();
    });
    
    // Click edit button for first subscription
    const editButtons = screen.getAllByText('Edit');
    await act(async () => {
      fireEvent.click(editButtons[0]);
    });
    
    // Submit form
    const saveButton = screen.getByText('Save Changes');
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    // Verify update API was called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/subscriptions/1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAuthToken}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  test('handles error state', async () => {
    // Reset fetch mock
    fetch.mockReset();
    
    // Mock failed fetch
    fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error'
    });
    
    await act(async () => {
      render(<SubscriptionManagementAdmin />);
    });
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Error fetching subscriptions/)).toBeInTheDocument();
    });
  });
});
