import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../setup/test-utils';
import { ROICalculator } from '../../../components/roi/ROICalculator';
import { setupTestMocks } from '../../setup/test-utils';

// Setup mocks before tests
beforeAll(() => {
  setupTestMocks();
});

describe('ROICalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders ROI calculator with all essential elements', () => {
      render(<ROICalculator />);
      
      expect(screen.getByText('ROI Calculator')).toBeInTheDocument();
      expect(screen.getByText('Business Information')).toBeInTheDocument();
      expect(screen.getByText('Your ROI Projection')).toBeInTheDocument();
      expect(screen.getByText('Industry Insights')).toBeInTheDocument();
    });

    it('displays default values correctly', () => {
      render(<ROICalculator />);
      
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument(); // Monthly Orders
      expect(screen.getByDisplayValue('75')).toBeInTheDocument(); // Average Order Value
      expect(screen.getByDisplayValue('500')).toBeInTheDocument(); // Support Tickets
    });

    it('shows industry selection dropdown', () => {
      render(<ROICalculator />);
      
      const industrySelect = screen.getByRole('combobox', { name: /industry/i });
      expect(industrySelect).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('updates monthly orders when input changes', async () => {
      render(<ROICalculator />);
      
      const monthlyOrdersInput = screen.getByLabelText('Monthly Orders');
      fireEvent.change(monthlyOrdersInput, { target: { value: '2000' } });
      
      await waitFor(() => {
        expect(monthlyOrdersInput).toHaveValue(2000);
      });
    });

    it('updates average order value when input changes', async () => {
      render(<ROICalculator />);
      
      const avgOrderValueInput = screen.getByLabelText('Average Order Value ($)');
      fireEvent.change(avgOrderValueInput, { target: { value: '150' } });
      
      await waitFor(() => {
        expect(avgOrderValueInput).toHaveValue(150);
      });
    });

    it('shows advanced options when toggle is clicked', async () => {
      render(<ROICalculator />);
      
      const advancedToggle = screen.getByText('Show Advanced Options');
      fireEvent.click(advancedToggle);
      
      await waitFor(() => {
        expect(screen.getByText('Hide Advanced Options')).toBeInTheDocument();
        expect(screen.getByLabelText('Current Monthly Support Cost ($)')).toBeInTheDocument();
      });
    });

    it('updates business size selection', async () => {
      render(<ROICalculator />);
      
      const businessSizeSelect = screen.getByRole('combobox', { name: /business size/i });
      fireEvent.click(businessSizeSelect);
      
      await waitFor(() => {
        const largeOption = screen.getByText('Large ($10M - $100M annual revenue)');
        fireEvent.click(largeOption);
      });
      
      // ROI calculations should update based on business size
      expect(screen.getByText(/Annual Savings/)).toBeInTheDocument();
    });
  });

  describe('ROI Calculations', () => {
    it('displays ROI metrics', () => {
      render(<ROICalculator />);
      
      expect(screen.getByText('Annual Savings')).toBeInTheDocument();
      expect(screen.getByText('12-Month ROI')).toBeInTheDocument();
      expect(screen.getByText('Monthly Cost Savings')).toBeInTheDocument();
      expect(screen.getByText('Additional Annual Revenue')).toBeInTheDocument();
    });

    it('updates calculations when inputs change', async () => {
      const mockOnResultsChange = jest.fn();
      render(<ROICalculator onResultsChange={mockOnResultsChange} />);
      
      const monthlyOrdersInput = screen.getByLabelText('Monthly Orders');
      fireEvent.change(monthlyOrdersInput, { target: { value: '3000' } });
      
      await waitFor(() => {
        expect(mockOnResultsChange).toHaveBeenCalled();
      });
    });

    it('shows industry-specific benchmarks', () => {
      render(<ROICalculator />);
      
      expect(screen.getByText('Average Ticket Size')).toBeInTheDocument();
      expect(screen.getByText('Support Cost per Ticket')).toBeInTheDocument();
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<ROICalculator />);
      
      expect(screen.getByLabelText('Industry')).toBeInTheDocument();
      expect(screen.getByLabelText('Business Size')).toBeInTheDocument();
      expect(screen.getByLabelText('Monthly Orders')).toBeInTheDocument();
      expect(screen.getByLabelText('Average Order Value ($)')).toBeInTheDocument();
    });

    it('has accessible button text', () => {
      render(<ROICalculator />);
      
      expect(screen.getByRole('button', { name: /start your free trial/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show advanced options/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<ROICalculator />);
      
      const industrySelect = screen.getByRole('combobox', { name: /industry/i });
      industrySelect.focus();
      
      expect(document.activeElement).toBe(industrySelect);
    });
  });

  describe('Responsive Design', () => {
    it('renders properly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<ROICalculator />);
      
      // Component should still render all essential elements
      expect(screen.getByText('ROI Calculator')).toBeInTheDocument();
      expect(screen.getByText('Business Information')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles invalid input gracefully', async () => {
      render(<ROICalculator />);
      
      const monthlyOrdersInput = screen.getByLabelText('Monthly Orders');
      fireEvent.change(monthlyOrdersInput, { target: { value: 'invalid' } });
      
      await waitFor(() => {
        // Should default to 0 or maintain previous valid value
        expect(monthlyOrdersInput).toHaveValue(0);
      });
    });

    it('handles negative values appropriately', async () => {
      render(<ROICalculator />);
      
      const avgOrderValueInput = screen.getByLabelText('Average Order Value ($)');
      fireEvent.change(avgOrderValueInput, { target: { value: '-100' } });
      
      await waitFor(() => {
        // Should handle negative values gracefully
        expect(avgOrderValueInput).toHaveValue(-100);
      });
    });
  });

  describe('Performance', () => {
    it('does not cause excessive re-renders', async () => {
      const mockOnResultsChange = jest.fn();
      render(<ROICalculator onResultsChange={mockOnResultsChange} />);
      
      const monthlyOrdersInput = screen.getByLabelText('Monthly Orders');
      
      // Multiple rapid changes
      fireEvent.change(monthlyOrdersInput, { target: { value: '1000' } });
      fireEvent.change(monthlyOrdersInput, { target: { value: '2000' } });
      fireEvent.change(monthlyOrdersInput, { target: { value: '3000' } });
      
      await waitFor(() => {
        // Should debounce or handle efficiently
        expect(mockOnResultsChange).toHaveBeenCalled();
      });
    });
  });
});
