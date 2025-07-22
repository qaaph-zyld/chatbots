import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { Tabs } from '@/components/ui/tabs';
import { AutomatedInsights } from '@/components/reporting/AutomatedInsights';
import { ReportBuilder } from '@/components/reporting/ReportBuilder';
import { ScheduledReports } from '@/components/reporting/ScheduledReports';
import { ComparativeAnalysis } from '@/components/reporting/ComparativeAnalysis';
import { PerformanceOptimizer } from '@/components/reporting/PerformanceOptimizer';
import ReportingDashboard from '@/app/dashboard/reporting/page';

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/dashboard/reporting',
  useSearchParams: () => new URLSearchParams()
}));

// Mock the child components
jest.mock('@/components/reporting/AutomatedInsights', () => ({
  AutomatedInsights: () => <div data-testid="automated-insights">Automated Insights Component</div>
}));

jest.mock('@/components/reporting/ReportBuilder', () => ({
  ReportBuilder: () => <div data-testid="report-builder">Report Builder Component</div>
}));

jest.mock('@/components/reporting/ScheduledReports', () => ({
  ScheduledReports: () => <div data-testid="scheduled-reports">Scheduled Reports Component</div>
}));

jest.mock('@/components/reporting/ComparativeAnalysis', () => ({
  ComparativeAnalysis: () => <div data-testid="comparative-analysis">Comparative Analysis Component</div>
}));

jest.mock('@/components/reporting/PerformanceOptimizer', () => ({
  PerformanceOptimizer: () => <div data-testid="performance-optimizer">Performance Optimizer Component</div>
}));

describe('Advanced Reporting & Insights Generation Integration', () => {
  describe('ReportingDashboard Component', () => {
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
      user = userEvent.setup();
      render(
        <Tabs defaultValue="insights">
          <ReportingDashboard />
        </Tabs>
      );
    });

    it('should render the reporting dashboard with all tabs', () => {
      expect(screen.getByText('Advanced Reporting & Insights')).toBeInTheDocument();
      expect(screen.getAllByText('Insights')).toHaveLength(2); // Desktop and mobile versions
      expect(screen.getAllByText('Reports')).toHaveLength(2); // Desktop and mobile versions
      expect(screen.getAllByText('Scheduled')).toHaveLength(2); // Desktop and mobile versions
      expect(screen.getAllByText('Benchmarks')).toHaveLength(2); // Desktop and mobile versions
      expect(screen.getAllByText('Optimizer')).toHaveLength(2); // Desktop and mobile versions
    });

    it('should show the AutomatedInsights component by default', () => {
      expect(screen.getByTestId('automated-insights')).toBeInTheDocument();
    });

    it('should switch to ReportBuilder when Reports tab is clicked', async () => {
      const reportsTab = screen.getAllByText('Reports')[0];
      await act(async () => {
        await user.click(reportsTab);
      });
      await waitFor(() => {
        expect(screen.getByTestId('report-builder')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should switch to ScheduledReports when Scheduled tab is clicked', async () => {
      const scheduledTab = screen.getAllByText('Scheduled')[0];
      await act(async () => {
        await user.click(scheduledTab);
      });
      await waitFor(() => {
        expect(screen.getByTestId('scheduled-reports')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should switch to ComparativeAnalysis when Benchmarks tab is clicked', async () => {
      await act(async () => {
        const benchmarksTab = screen.getAllByText('Benchmarks')[0];
        await user.click(benchmarksTab);
      });
      await waitFor(() => {
        expect(screen.getByTestId('comparative-analysis')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should switch to PerformanceOptimizer when Optimizer tab is clicked', async () => {
      await act(async () => {
        const optimizerTab = screen.getAllByText('Optimizer')[0];
        await user.click(optimizerTab);
      });
      await waitFor(() => {
        expect(screen.getByTestId('performance-optimizer')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Individual Reporting Components', () => {
    it('should render AutomatedInsights component', () => {
      render(<AutomatedInsights />);
      expect(screen.getByTestId('automated-insights')).toBeInTheDocument();
    });

    it('should render ReportBuilder component', () => {
      render(
        <Tabs defaultValue="builder">
          <ReportBuilder />
        </Tabs>
      );
      expect(screen.getByTestId('report-builder')).toBeInTheDocument();
    });

    it('should render ScheduledReports component', () => {
      render(
        <Tabs defaultValue="scheduled">
          <ScheduledReports />
        </Tabs>
      );
      expect(screen.getByTestId('scheduled-reports')).toBeInTheDocument();
    });

    it('should render ComparativeAnalysis component', () => {
      render(
        <Tabs defaultValue="analysis">
          <ComparativeAnalysis />
        </Tabs>
      );
      expect(screen.getByTestId('comparative-analysis')).toBeInTheDocument();
    });

    it('should render PerformanceOptimizer component', () => {
      render(
        <Tabs defaultValue="optimizer">
          <PerformanceOptimizer />
        </Tabs>
      );
      expect(screen.getByTestId('performance-optimizer')).toBeInTheDocument();
    });
  });
});
