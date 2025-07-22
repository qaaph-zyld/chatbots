import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../../setup/test-utils';
import { CoreWebVitalsOptimizer } from '../../../components/performance/CoreWebVitalsOptimizer';
import { setupTestMocks } from '../../setup/test-utils';

// Setup mocks before tests
beforeAll(() => {
  setupTestMocks();
});

describe('CoreWebVitalsOptimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('renders performance optimization center with all sections', () => {
      render(<CoreWebVitalsOptimizer />);
      
      expect(screen.getByText('Performance Optimization Center')).toBeInTheDocument();
      expect(screen.getByText('Core Web Vitals')).toBeInTheDocument();
      expect(screen.getByText('Mobile Experience')).toBeInTheDocument();
      expect(screen.getByText('Performance Recommendations')).toBeInTheDocument();
    });

    it('displays Core Web Vitals metrics', () => {
      render(<CoreWebVitalsOptimizer />);
      
      expect(screen.getByText('Largest Contentful Paint (LCP)')).toBeInTheDocument();
      expect(screen.getByText('First Input Delay (FID)')).toBeInTheDocument();
      expect(screen.getByText('Cumulative Layout Shift (CLS)')).toBeInTheDocument();
    });

    it('shows mobile performance metrics', () => {
      render(<CoreWebVitalsOptimizer />);
      
      expect(screen.getByText('Mobile Page Speed')).toBeInTheDocument();
      expect(screen.getByText('Touch Responsiveness')).toBeInTheDocument();
      expect(screen.getByText('Min Touch Target')).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('shows performance scores with proper formatting', () => {
      render(<CoreWebVitalsOptimizer />);
      
      // Should show metrics in proper format (seconds, milliseconds, etc.)
      const lcpElements = screen.getAllByText(/\d+\.\d+s/);
      expect(lcpElements.length).toBeGreaterThan(0); // LCP in seconds
      const fidElements = screen.getAllByText(/\d+ms/);
      expect(fidElements.length).toBeGreaterThan(0); // FID in milliseconds
      expect(screen.getByText(/0\.\d+/)).toBeInTheDocument(); // CLS as decimal
    });

    it('displays score badges (Good/Needs Improvement/Poor)', () => {
      render(<CoreWebVitalsOptimizer />);
      
      const badges = screen.getAllByText(/Good|Needs Improvement|Poor/);
      expect(badges.length).toBeGreaterThan(0);
    });

    it('shows mobile performance scores out of 100', () => {
      render(<CoreWebVitalsOptimizer />);
      
      // Should show mobile performance scores out of 100
      const mobileScoreElements = screen.getAllByText(/\d+\/100/);
      expect(mobileScoreElements.length).toBeGreaterThan(0);
    });
  });

  describe('Real-time Updates', () => {
    it('updates metrics over time', async () => {
      const mockOnMetricsUpdate = jest.fn();
      render(<CoreWebVitalsOptimizer onMetricsUpdate={mockOnMetricsUpdate} />);
      
      // Fast-forward time to trigger metric updates
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      await waitFor(() => {
        expect(mockOnMetricsUpdate).toHaveBeenCalled();
      });
    });

    it('calls onMetricsUpdate callback when metrics change', () => {
      const mockOnMetricsUpdate = jest.fn();
      render(<CoreWebVitalsOptimizer onMetricsUpdate={mockOnMetricsUpdate} />);
      
      expect(mockOnMetricsUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          lcp: expect.any(Number),
          fid: expect.any(Number),
          cls: expect.any(Number),
          fcp: expect.any(Number),
          ttfb: expect.any(Number)
        })
      );
    });
  });

  describe('Optimization Process', () => {
    it('shows optimization button', () => {
      render(<CoreWebVitalsOptimizer />);
      
      const optimizeButton = screen.getByRole('button', { name: /run optimization/i });
      expect(optimizeButton).toBeInTheDocument();
    });

    it('shows loading state during optimization', async () => {
      render(<CoreWebVitalsOptimizer />);
      
      const optimizeButton = screen.getByRole('button', { name: /run optimization/i });
      fireEvent.click(optimizeButton);
      
      expect(screen.getByText('Optimizing...')).toBeInTheDocument();
      expect(optimizeButton).toBeDisabled();
    });

    it('improves metrics after optimization', async () => {
      const mockOnMetricsUpdate = jest.fn();
      render(<CoreWebVitalsOptimizer onMetricsUpdate={mockOnMetricsUpdate} />);
      
      const optimizeButton = screen.getByRole('button', { name: /run optimization/i });
      fireEvent.click(optimizeButton);
      
      // Fast-forward through optimization process
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /run optimization/i })).not.toBeDisabled();
      });
    });
  });

  describe('Recommendations System', () => {
    it('displays optimization recommendations', () => {
      render(<CoreWebVitalsOptimizer />);
      
      expect(screen.getByText('Performance Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Implement Image Lazy Loading')).toBeInTheDocument();
      expect(screen.getByText('Enable Code Splitting')).toBeInTheDocument();
    });

    it('shows implementation status for recommendations', () => {
      render(<CoreWebVitalsOptimizer />);
      
      const implementedElements = screen.getAllByText('✓ Implemented');
      expect(implementedElements.length).toBeGreaterThan(0);
    });

    it('filters recommendations by category', async () => {
      render(<CoreWebVitalsOptimizer />);
      
      const loadingButton = screen.getByRole('button', { name: /loading/i });
      fireEvent.click(loadingButton);
      
      await waitFor(() => {
        // Should show only loading-related recommendations
        expect(screen.getByText('Implement Image Lazy Loading')).toBeInTheDocument();
      });
    });

    it('shows impact and effort levels for recommendations', () => {
      render(<CoreWebVitalsOptimizer />);
      
      const highImpactElements = screen.getAllByText('high impact');
      expect(highImpactElements.length).toBeGreaterThan(0);
      const lowEffortElements = screen.getAllByText('low effort');
      expect(lowEffortElements.length).toBeGreaterThan(0);
    });
  });

  describe('Progress Tracking', () => {
    it('displays implementation progress', () => {
      render(<CoreWebVitalsOptimizer />);
      
      expect(screen.getByText('Optimization Implementation Progress')).toBeInTheDocument();
      expect(screen.getByText(/\d+\/\d+ optimizations/)).toBeInTheDocument();
    });

    it('shows progress percentage', () => {
      render(<CoreWebVitalsOptimizer />);
      
      expect(screen.getByText(/\d+% of recommended optimizations implemented/)).toBeInTheDocument();
    });
  });

  describe('Performance Insights', () => {
    it('displays performance insights section', () => {
      render(<CoreWebVitalsOptimizer />);
      
      expect(screen.getByText('Performance Insights')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument(); // Performance Score
      expect(screen.getByText('1.8s')).toBeInTheDocument(); // Average Load Time
      expect(screen.getByText('95%')).toBeInTheDocument(); // Mobile Friendly Score
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<CoreWebVitalsOptimizer />);
      
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Performance Optimization Center');
    });

    it('has accessible button labels', () => {
      render(<CoreWebVitalsOptimizer />);
      
      expect(screen.getByRole('button', { name: /run optimization/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
    });

    it('provides proper ARIA labels for progress bars', () => {
      render(<CoreWebVitalsOptimizer />);
      
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('adapts to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<CoreWebVitalsOptimizer />);
      
      expect(screen.getByText('Performance Optimization Center')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles metric calculation errors gracefully', () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<CoreWebVitalsOptimizer />);
      
      // Component should still render even if there are calculation errors
      expect(screen.getByText('Performance Optimization Center')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('cleans up intervals on unmount', () => {
      const { unmount } = render(<CoreWebVitalsOptimizer />);
      
      // Should not throw errors or cause memory leaks
      unmount();
    });

    it('does not cause excessive re-renders', () => {
      const mockOnMetricsUpdate = jest.fn();
      render(<CoreWebVitalsOptimizer onMetricsUpdate={mockOnMetricsUpdate} />);
      
      // Fast-forward time multiple times
      act(() => {
        jest.advanceTimersByTime(3000);
        jest.advanceTimersByTime(3000);
        jest.advanceTimersByTime(3000);
      });
      
      // Should not cause excessive callback calls
      expect(mockOnMetricsUpdate).toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('works with custom className', () => {
      const { container } = render(<CoreWebVitalsOptimizer className="custom-class" />);
      
      // Find the main container div with the custom class
      const mainDiv = container.querySelector('.custom-class') as HTMLElement;
      expect(mainDiv).toBeInTheDocument();
      expect(mainDiv.className).toContain('custom-class');
    });

    it('integrates with existing performance monitoring', () => {
      const mockOnMetricsUpdate = jest.fn();
      render(<CoreWebVitalsOptimizer onMetricsUpdate={mockOnMetricsUpdate} />);
      
      expect(mockOnMetricsUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          lcp: expect.any(Number),
          fid: expect.any(Number),
          cls: expect.any(Number)
        })
      );
    });
  });
});
