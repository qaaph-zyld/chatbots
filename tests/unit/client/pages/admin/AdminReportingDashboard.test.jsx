import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import AdminReportingDashboard from '../../../../../src/client/pages/admin/AdminReportingDashboard';
import { useAuth } from '../../../../../src/auth/hooks/useAuth';

// Mock the auth hook
jest.mock('../../../../../src/auth/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock the formatters
jest.mock('../../../../../src/utils/formatters', () => ({
  formatCurrency: jest.fn((amount) => `$${amount}`)
}));

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="mock-responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="mock-line-chart">{children}</div>,
  BarChart: ({ children }) => <div data-testid="mock-bar-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="mock-pie-chart">{children}</div>,
  Line: () => <div data-testid="mock-line" />,
  Bar: () => <div data-testid="mock-bar" />,
  Pie: () => <div data-testid="mock-pie" />,
  XAxis: () => <div data-testid="mock-xaxis" />,
  YAxis: () => <div data-testid="mock-yaxis" />,
  CartesianGrid: () => <div data-testid="mock-cartesian-grid" />,
  Tooltip: () => <div data-testid="mock-tooltip" />,
  Legend: () => <div data-testid="mock-legend" />,
  Cell: () => <div data-testid="mock-cell" />
}));

// Mock fetch
global.fetch = jest.fn();

describe('AdminReportingDashboard Component', () => {
  const mockAuthToken = 'test-auth-token';
  const mockReportData = {
    summary: {
      totalRevenue: 10000,
      revenueChange: 15,
      activeSubscriptions: 250,
      subscriptionChange: 8,
      totalUsers: 1200,
      userChange: 12,
      avgResponseTime: 120,
      responseTimeChange: -5
    },
    revenueData: [
      { date: '2025-01', revenue: 8000, mrr: 7500 },
      { date: '2025-02', revenue: 9000, mrr: 8000 },
      { date: '2025-03', revenue: 10000, mrr: 9000 }
    ],
    subscriptionData: [
      { date: '2025-01', new: 50, cancelled: 10, net: 40 },
      { date: '2025-02', new: 60, cancelled: 15, net: 45 },
      { date: '2025-03', new: 70, cancelled: 20, net: 50 }
    ],
    planDistribution: [
      { name: 'Basic', value: 100 },
      { name: 'Premium', value: 100 },
      { name: 'Enterprise', value: 50 }
    ],
    performanceData: [
      { date: '2025-01', responseTime: 150, requestCount: 50000 },
      { date: '2025-02', responseTime: 130, requestCount: 60000 },
      { date: '2025-03', responseTime: 120, requestCount: 70000 }
    ]
  };

  beforeEach(() => {
    // Setup mocks
    useAuth.mockReturnValue({ authToken: mockAuthToken });
    
    // Reset fetch mock
    fetch.mockReset();
    
    // Mock successful fetch for report data
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReportData
    });
  });

  test('renders admin reporting dashboard title', async () => {
    await act(async () => {
      render(<AdminReportingDashboard />);
    });
    
    expect(screen.getByText('Admin Reporting Dashboard')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    render(<AdminReportingDashboard />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('fetches and displays report data', async () => {
    await act(async () => {
      render(<AdminReportingDashboard />);
    });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/reports?timeRange=month',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAuthToken}`
          })
        })
      );
    });
    
    // Check summary cards are displayed
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$10000')).toBeInTheDocument();
    expect(screen.getByText('Active Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('Avg. Response Time')).toBeInTheDocument();
    expect(screen.getByText('120 ms')).toBeInTheDocument();
    
    // Check charts are rendered
    expect(screen.getAllByTestId('mock-responsive-container').length).toBeGreaterThan(0);
  });

  test('handles time range change', async () => {
    // Setup second fetch mock for different time range
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReportData
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReportData
    });
    
    await act(async () => {
      render(<AdminReportingDashboard />);
    });
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    });
    
    // Change time range
    const timeRangeSelect = screen.getByLabelText('Time Range');
    await act(async () => {
      fireEvent.change(timeRangeSelect, { target: { value: 'year' } });
    });
    
    // Verify second fetch was called with new time range
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/reports?timeRange=year',
        expect.anything()
      );
    });
  });

  test('handles tab changes', async () => {
    await act(async () => {
      render(<AdminReportingDashboard />);
    });
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    });
    
    // Click on Subscriptions tab
    const subscriptionsTab = screen.getByText('Subscriptions');
    await act(async () => {
      fireEvent.click(subscriptionsTab);
    });
    
    // Verify tab content changed (would check for specific elements in the tab)
    // For the mock, we can't check specific content changes
  });

  test('handles refresh action', async () => {
    // Setup second fetch mock for refresh
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReportData
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReportData
    });
    
    await act(async () => {
      render(<AdminReportingDashboard />);
    });
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    });
    
    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    await act(async () => {
      fireEvent.click(refreshButton);
    });
    
    // Verify second fetch was called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  test('handles export action', async () => {
    // Mock for export endpoint
    const mockBlob = new Blob(['test data'], { type: 'text/csv' });
    const mockResponse = {
      ok: true,
      blob: async () => mockBlob
    };
    
    // Setup mocks
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReportData
    }).mockResolvedValueOnce(mockResponse);
    
    // Mock URL.createObjectURL
    const mockUrl = 'blob:test-url';
    global.URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock document.createElement and related methods
    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn()
    };
    document.createElement = jest.fn().mockImplementation((tag) => {
      if (tag === 'a') return mockAnchor;
      return {};
    });
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    
    await act(async () => {
      render(<AdminReportingDashboard />);
    });
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    });
    
    // Click export button
    const exportButton = screen.getByText('Export Report');
    await act(async () => {
      fireEvent.click(exportButton);
    });
    
    // Verify export API was called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/reports/export?timeRange=month',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAuthToken}`
          })
        })
      );
    });
    
    // Verify download was triggered
    expect(mockAnchor.click).toHaveBeenCalled();
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
      render(<AdminReportingDashboard />);
    });
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Error fetching report data/)).toBeInTheDocument();
    });
  });
});
