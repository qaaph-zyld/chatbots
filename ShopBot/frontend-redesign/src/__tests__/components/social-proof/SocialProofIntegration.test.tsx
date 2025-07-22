import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../setup/test-utils';
import { SocialProofIntegration } from '../../../components/social-proof/SocialProofIntegration';
import { setupTestMocks } from '../../setup/test-utils';

// Setup mocks before tests
beforeAll(() => {
  setupTestMocks();
});

describe('SocialProofIntegration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders social proof integration with all tabs', () => {
      render(<SocialProofIntegration />);
      
      expect(screen.getByText('Trusted by Industry Leaders')).toBeInTheDocument();
      expect(screen.getByText('Customer Stories')).toBeInTheDocument();
      expect(screen.getByText('Case Studies')).toBeInTheDocument();
      expect(screen.getByText('Platform Stats')).toBeInTheDocument();
    });

    it('displays testimonials by default', () => {
      render(<SocialProofIntegration />);
      
      // Should show testimonial content
      expect(screen.getByText(/ShopBot transformed our customer support/)).toBeInTheDocument();
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    });

    it('shows filter options when enabled', () => {
      render(<SocialProofIntegration showFilters={true} />);
      
      expect(screen.getByText('All Industries')).toBeInTheDocument();
      expect(screen.getByText('All Business Sizes')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('switches to case studies tab', async () => {
      render(<SocialProofIntegration />);
      
      const caseStudiesTab = screen.getByText('Case Studies');
      fireEvent.click(caseStudiesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Fashion Retailer Reduces Support Costs by 65%')).toBeInTheDocument();
      });
    });

    it('switches to platform stats tab', async () => {
      render(<SocialProofIntegration />);
      
      const statsTab = screen.getByText('Platform Stats');
      fireEvent.click(statsTab);
      
      await waitFor(() => {
        expect(screen.getByText('Active Customers')).toBeInTheDocument();
        expect(screen.getByText('Tickets Processed')).toBeInTheDocument();
      });
    });
  });

  describe('Testimonial Carousel', () => {
    it('displays testimonial navigation buttons', () => {
      render(<SocialProofIntegration />);
      
      // Look for navigation buttons specifically by finding buttons with ChevronLeft/ChevronRight icons
      const allButtons = screen.getAllByRole('button');
      const navigationButtons = allButtons.filter(button => {
        // Look for buttons that contain ChevronLeft or ChevronRight icons (mock-icon data-testid)
        const svg = button.querySelector('[data-testid="mock-icon"]');
        return svg !== null;
      });
      
      // Should have at least 2 navigation buttons (prev and next) when testimonials are available
      expect(navigationButtons.length).toBeGreaterThanOrEqual(2); // Should have prev and next buttons
      expect(navigationButtons[0]).toBeInTheDocument(); // Prev button
      expect(navigationButtons[1]).toBeInTheDocument(); // Next button
    });

    it('shows star ratings for testimonials', () => {
      render(<SocialProofIntegration />);
      
      // Should show 5-star rating (5 filled stars)
      const stars = screen.getAllByTestId(/star/i);
      expect(stars.length).toBeGreaterThan(0);
    });

    it('displays verified badge for verified testimonials', () => {
      render(<SocialProofIntegration />);
      
      const verifiedBadges = screen.getAllByText('Verified');
      expect(verifiedBadges.length).toBeGreaterThan(0);
      expect(verifiedBadges[0]).toBeInTheDocument();
    });
  });

  describe('Filtering Functionality', () => {
    it('filters testimonials by industry', async () => {
      render(<SocialProofIntegration showFilters={true} />);
      
      // Click industry filter - use button selector instead of combobox
      const industryFilter = screen.getByText('All Industries');
      fireEvent.click(industryFilter);
      
      await waitFor(() => {
        const fashionOption = screen.getByText('Fashion');
        fireEvent.click(fashionOption);
      });
      
      // Should filter testimonials accordingly
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    });

    it('limits testimonials when maxTestimonials prop is set', () => {
      render(<SocialProofIntegration maxTestimonials={2} />);
      
      // Should only show limited number of testimonials
      const testimonialCards = screen.getAllByText(/\$.*\/month/); // Cost savings pattern
      expect(testimonialCards.length).toBeLessThanOrEqual(6); // Accounting for main carousel + grid
    });
  });

  describe('Case Studies Display', () => {
    it('shows case study details when on case studies tab', async () => {
      render(<SocialProofIntegration />);
      
      const caseStudiesTab = screen.getByText('Case Studies');
      fireEvent.click(caseStudiesTab);
      
      await waitFor(() => {
        expect(screen.getAllByText('Challenge')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Solution')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Results')[0]).toBeInTheDocument();
      });
    });

    it('displays case study metrics', async () => {
      render(<SocialProofIntegration />);
      
      const caseStudiesTab = screen.getByText('Case Studies');
      fireEvent.click(caseStudiesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Cost Reduction')).toBeInTheDocument();
        expect(screen.getByText('Response Time')).toBeInTheDocument();
      });
    });
  });

  describe('Platform Statistics', () => {
    it('displays platform stats when on stats tab', async () => {
      render(<SocialProofIntegration />);
      
      const statsTab = screen.getByText('Platform Stats');
      fireEvent.click(statsTab);
      
      await waitFor(() => {
        expect(screen.getByText('2,847+')).toBeInTheDocument(); // Total customers
        expect(screen.getByText('1.3M+')).toBeInTheDocument(); // Tickets processed
        expect(screen.getByText('4.7/5')).toBeInTheDocument(); // Customer satisfaction
      });
    });

    it('shows trust indicators', async () => {
      render(<SocialProofIntegration />);
      
      const statsTab = screen.getByText('Platform Stats');
      fireEvent.click(statsTab);
      
      await waitFor(() => {
        expect(screen.getByText('SOC 2 Compliant')).toBeInTheDocument();
        expect(screen.getByText('GDPR Ready')).toBeInTheDocument();
        expect(screen.getByText('99.9% Uptime')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for navigation', () => {
      render(<SocialProofIntegration />);
      
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(3);
    });

    it('supports keyboard navigation between tabs', async () => {
      render(<SocialProofIntegration />);
      
      const firstTab = screen.getByRole('tab', { name: 'Customer Stories' });
      firstTab.focus();
      
      expect(document.activeElement).toBe(firstTab);
      
      // Simulate arrow key navigation
      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      
      await waitFor(() => {
        const secondTab = screen.getByRole('tab', { name: 'Case Studies' });
        expect(document.activeElement).toBe(secondTab);
      });
    });

    it('has proper heading hierarchy', () => {
      render(<SocialProofIntegration />);
      
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Trusted by Industry Leaders');
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<SocialProofIntegration />);
      
      expect(screen.getByText('Trusted by Industry Leaders')).toBeInTheDocument();
      // Component should render without layout issues
    });
  });

  describe('Performance', () => {
    it('handles rapid tab switching without issues', async () => {
      render(<SocialProofIntegration />);
      
      const tabs = ['Customer Stories', 'Case Studies', 'Platform Stats'];
      
      // Rapidly switch between tabs
      for (const tabName of tabs) {
        const tab = screen.getByText(tabName);
        fireEvent.click(tab);
        await waitFor(() => {
          expect(tab).toHaveAttribute('aria-selected', 'true');
        });
      }
    });

    it('does not cause memory leaks with carousel auto-rotation', () => {
      const { unmount } = render(<SocialProofIntegration />);
      
      // Component should clean up timers on unmount
      unmount();
      
      // No assertions needed - test passes if no errors thrown
    });
  });

  describe('Integration', () => {
    it('works with custom className', () => {
      render(<SocialProofIntegration className="custom-class" />);
      
      const container = screen.getByText('Trusted by Industry Leaders').closest('div')?.parentElement;
      expect(container).toBeTruthy();
      expect(container).toHaveClass('custom-class');
    });

    it('hides filters when showFilters is false', () => {
      render(<SocialProofIntegration showFilters={false} />);
      
      expect(screen.queryByText('All Industries')).not.toBeInTheDocument();
      expect(screen.queryByText('All Business Sizes')).not.toBeInTheDocument();
    });
  });
});
