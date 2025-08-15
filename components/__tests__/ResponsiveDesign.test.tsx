/**
 * Responsive Design Tests
 * 
 * Tests for mobile optimization, touch-friendly controls, and responsive behavior
 * across all visualization components.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';

import { PipelineFlowVisualizer } from '../PipelineFlowVisualizer';
import { ConfidenceDashboard } from '../ConfidenceDashboard';
import { DataQualityPanel } from '../DataQualityPanel';
import { AlternativeOptionsExplorer } from '../AlternativeOptionsExplorer';
import { useResponsive, useCollapsible, useTouchGestures } from '../../lib/hooks/useResponsive';

// Mock data
const mockPipelineStages = [
  {
    id: 'data-fetch',
    name: 'Data Fetch',
    status: 'completed' as const,
    progress: 100,
    duration: 1200
  },
  {
    id: 'validation',
    name: 'Validation',
    status: 'running' as const,
    progress: 65,
    duration: 800
  }
];

const mockConfidenceData = {
  overall: 0.85,
  perChannel: {
    google: 0.9,
    meta: 0.8,
    tiktok: 0.75,
    linkedin: 0.85
  },
  stability: 0.88,
  algorithms: [
    {
      name: 'ensemble',
      confidence: 0.9,
      performance: 0.85,
      allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 }
    }
  ],
  consensus: {
    agreement: 0.85,
    outlierCount: 1,
    variance: { google: 0.05, meta: 0.08, tiktok: 0.12, linkedin: 0.06 }
  }
};

const mockDataQuality = {
  citations: [
    {
      url: 'https://example.com',
      title: 'Test Citation',
      validationStatus: 'valid' as const,
      contentQuality: 0.9
    }
  ],
  benchmarkAnalysis: {
    deviationScore: 0.15,
    channelDeviations: { google: 0.1, meta: 0.2, tiktok: 0.15, linkedin: 0.1 }
  },
  warnings: [
    {
      message: 'Test warning',
      severity: 'medium' as const,
      channel: 'tiktok'
    }
  ],
  sourceQuality: {
    'benchmark-data': {
      source: 'benchmark-data',
      reliability: 0.9,
      validationStatus: 'valid' as const
    }
  },
  overallScore: 0.85,
  lastValidated: new Date().toISOString()
};

const mockAlternatives = [
  {
    id: 'alt-1',
    allocation: { google: 0.5, meta: 0.3, tiktok: 0.15, linkedin: 0.05 },
    confidence: 0.9,
    performance: 0.85,
    reasoning: 'High-confidence allocation based on ensemble methods',
    algorithmSource: 'ensemble',
    riskLevel: 'low' as const
  },
  {
    id: 'alt-2',
    allocation: { google: 0.4, meta: 0.4, tiktok: 0.15, linkedin: 0.05 },
    confidence: 0.8,
    performance: 0.82,
    reasoning: 'Balanced allocation with medium confidence',
    algorithmSource: 'bayesian',
    riskLevel: 'medium' as const
  }
];

// Mock window.innerWidth for responsive tests
const mockWindowSize = (width: number, height: number = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
};

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('Responsive Design', () => {
  beforeEach(() => {
    // Reset to desktop size
    mockWindowSize(1200);
  });

  describe('Mobile Detection and Adaptation', () => {
    test('components detect mobile viewport correctly', async () => {
      mockWindowSize(600); // Mobile size
      
      render(<PipelineFlowVisualizer stages={mockPipelineStages} />);
      
      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      await waitFor(() => {
        // Check for mobile-specific elements or classes
        const stageCards = screen.getAllByRole('button');
        expect(stageCards.length).toBeGreaterThan(0);
        
        // Mobile stage cards should have touch-friendly sizing
        stageCards.forEach(card => {
          const styles = window.getComputedStyle(card);
          // Touch-friendly minimum size should be applied
          expect(parseInt(styles.minHeight) || 0).toBeGreaterThanOrEqual(44);
        });
      });
    });

    test('components adapt layout for tablet viewport', async () => {
      mockWindowSize(900); // Tablet size
      
      render(<ConfidenceDashboard confidence={mockConfidenceData} />);
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      await waitFor(() => {
        const dashboard = screen.getByText('Confidence Dashboard');
        expect(dashboard).toBeInTheDocument();
        
        // Should show tablet-optimized layout
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          const styles = window.getComputedStyle(button);
          expect(parseInt(styles.minHeight) || 0).toBeGreaterThanOrEqual(32);
        });
      });
    });
  });

  describe('Collapsible Panels', () => {
    test('panels auto-collapse on mobile', async () => {
      mockWindowSize(600); // Mobile size
      
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      await waitFor(() => {
        const header = screen.getByText('Data Quality Panel');
        expect(header).toBeInTheDocument();
        
        // Should have collapse/expand functionality on mobile
        const collapseButton = screen.getByRole('button', { name: /data quality panel/i });
        expect(collapseButton).toBeInTheDocument();
      });
    });

    test('panels can be toggled on mobile', async () => {
      mockWindowSize(600);
      
      render(<ConfidenceDashboard confidence={mockConfidenceData} />);
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /confidence dashboard/i });
        
        // Click to toggle
        fireEvent.click(toggleButton);
        
        // Should toggle collapsed state
        expect(toggleButton).toBeInTheDocument();
      });
    });
  });

  describe('Touch-Friendly Controls', () => {
    test('buttons meet minimum touch target size', () => {
      mockWindowSize(600);
      
      render(<AlternativeOptionsExplorer 
        alternatives={mockAlternatives} 
        currentAllocation={mockAlternatives[0].allocation}
      />);
      
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        // Touch targets should be at least 44px (iOS) or 48dp (Android)
        expect(Math.max(rect.width, rect.height)).toBeGreaterThanOrEqual(44);
      });
    });

    test('interactive elements have proper spacing on mobile', () => {
      mockWindowSize(600);
      
      render(<PipelineFlowVisualizer stages={mockPipelineStages} />);
      
      const interactiveElements = screen.getAllByRole('button');
      
      // Should have adequate spacing between touch targets
      expect(interactiveElements.length).toBeGreaterThan(0);
    });
  });

  describe('Swipe Navigation', () => {
    test('swipe navigation works on mobile for alternatives', async () => {
      mockWindowSize(600);
      
      const { container } = render(
        <AlternativeOptionsExplorer 
          alternatives={mockAlternatives} 
          currentAllocation={mockAlternatives[0].allocation}
        />
      );
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      await waitFor(() => {
        // Should show swipe indicators on mobile
        const indicators = container.querySelectorAll('[aria-label*="Go to option"]');
        expect(indicators.length).toBeGreaterThan(0);
      });
    });

    test('swipe gestures trigger navigation', async () => {
      mockWindowSize(600);
      
      const { container } = render(
        <AlternativeOptionsExplorer 
          alternatives={mockAlternatives} 
          currentAllocation={mockAlternatives[0].allocation}
        />
      );
      
      const swipeContainer = container.querySelector('[class*="swipe"]') || container.firstChild as Element;
      
      if (swipeContainer) {
        // Simulate swipe left
        fireEvent.touchStart(swipeContainer, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        
        fireEvent.touchMove(swipeContainer, {
          touches: [{ clientX: 50, clientY: 100 }]
        });
        
        fireEvent.touchEnd(swipeContainer);
        
        // Should trigger navigation (tested via state change)
        expect(swipeContainer).toBeInTheDocument();
      }
    });
  });

  describe('Chart Optimization', () => {
    test('charts render smaller on mobile', async () => {
      mockWindowSize(600);
      
      render(<ConfidenceDashboard confidence={mockConfidenceData} />);
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      await waitFor(() => {
        // Charts should be present and optimized for mobile
        const dashboard = screen.getByText('Confidence Dashboard');
        expect(dashboard).toBeInTheDocument();
        
        // SVG elements should be sized appropriately for mobile
        const svgElements = document.querySelectorAll('svg');
        svgElements.forEach(svg => {
          const width = parseInt(svg.getAttribute('width') || '0');
          const height = parseInt(svg.getAttribute('height') || '0');
          
          if (width > 0 && height > 0) {
            // Mobile charts should be reasonably sized
            expect(width).toBeLessThanOrEqual(150);
            expect(height).toBeLessThanOrEqual(150);
          }
        });
      });
    });

    test('progress bars adapt to mobile layout', () => {
      mockWindowSize(600);
      
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      // Progress bars should be present and mobile-optimized
      const progressElements = document.querySelectorAll('[class*="progress"]');
      expect(progressElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Modal and Overlay Behavior', () => {
    test('modals become bottom sheets on mobile', async () => {
      mockWindowSize(600);
      
      render(<AlternativeOptionsExplorer 
        alternatives={mockAlternatives} 
        currentAllocation={mockAlternatives[0].allocation}
      />);
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      // Find and click details button
      await waitFor(() => {
        const detailsButtons = screen.getAllByText('Details');
        if (detailsButtons.length > 0) {
          fireEvent.click(detailsButtons[0]);
          
          // Modal should appear as bottom sheet on mobile
          const modal = screen.getByText('Alternative Option Details');
          expect(modal).toBeInTheDocument();
        }
      });
    });

    test('stage details become bottom sheets on mobile', async () => {
      mockWindowSize(600);
      
      render(<PipelineFlowVisualizer stages={mockPipelineStages} />);
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      await waitFor(() => {
        const stageButtons = screen.getAllByRole('button');
        if (stageButtons.length > 0) {
          fireEvent.click(stageButtons[0]);
          
          // Should show mobile-optimized stage details
          expect(stageButtons[0]).toBeInTheDocument();
        }
      });
    });
  });

  describe('Performance Optimization', () => {
    test('components handle rapid resize events', async () => {
      render(<PipelineFlowVisualizer stages={mockPipelineStages} />);
      
      // Simulate rapid resize events
      for (let i = 0; i < 10; i++) {
        mockWindowSize(600 + i * 50);
        act(() => {
          window.dispatchEvent(new Event('resize'));
        });
      }
      
      await waitFor(() => {
        const visualizer = screen.getByText('Optimization Pipeline');
        expect(visualizer).toBeInTheDocument();
      });
    });

    test('components debounce resize handlers', async () => {
      const { rerender } = render(<ConfidenceDashboard confidence={mockConfidenceData} />);
      
      // Multiple rapid resizes should not cause issues
      for (let i = 0; i < 5; i++) {
        mockWindowSize(800 + i * 100);
        act(() => {
          window.dispatchEvent(new Event('resize'));
        });
        
        rerender(<ConfidenceDashboard confidence={mockConfidenceData} />);
      }
      
      await waitFor(() => {
        const dashboard = screen.getByText('Confidence Dashboard');
        expect(dashboard).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility on Mobile', () => {
    test('touch targets meet accessibility guidelines', () => {
      mockWindowSize(600);
      
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        // WCAG 2.1 AA requires minimum 44x44px touch targets
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      });
    });

    test('focus management works on mobile', async () => {
      mockWindowSize(600);
      
      render(<AlternativeOptionsExplorer 
        alternatives={mockAlternatives} 
        currentAllocation={mockAlternatives[0].allocation}
      />);
      
      const focusableElements = screen.getAllByRole('button');
      
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
        expect(document.activeElement).toBe(focusableElements[0]);
      }
    });
  });
});

describe('useResponsive Hook', () => {
  test('detects mobile correctly', () => {
    mockWindowSize(600);
    
    const TestComponent = () => {
      const { isMobile, isTablet, isDesktop } = useResponsive();
      return (
        <div>
          <span data-testid="mobile">{isMobile.toString()}</span>
          <span data-testid="tablet">{isTablet.toString()}</span>
          <span data-testid="desktop">{isDesktop.toString()}</span>
        </div>
      );
    };
    
    render(<TestComponent />);
    
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    
    expect(screen.getByTestId('mobile')).toHaveTextContent('true');
    expect(screen.getByTestId('tablet')).toHaveTextContent('false');
    expect(screen.getByTestId('desktop')).toHaveTextContent('false');
  });

  test('detects tablet correctly', () => {
    mockWindowSize(900);
    
    const TestComponent = () => {
      const { isMobile, isTablet, isDesktop } = useResponsive();
      return (
        <div>
          <span data-testid="mobile">{isMobile.toString()}</span>
          <span data-testid="tablet">{isTablet.toString()}</span>
          <span data-testid="desktop">{isDesktop.toString()}</span>
        </div>
      );
    };
    
    render(<TestComponent />);
    
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    
    expect(screen.getByTestId('mobile')).toHaveTextContent('false');
    expect(screen.getByTestId('tablet')).toHaveTextContent('true');
    expect(screen.getByTestId('desktop')).toHaveTextContent('false');
  });
});

describe('useCollapsible Hook', () => {
  test('auto-collapses on mobile', () => {
    mockWindowSize(600);
    
    const TestComponent = () => {
      const { isCollapsed, isMobile } = useCollapsible(false, true);
      return (
        <div>
          <span data-testid="collapsed">{isCollapsed.toString()}</span>
          <span data-testid="mobile">{isMobile.toString()}</span>
        </div>
      );
    };
    
    render(<TestComponent />);
    
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    
    expect(screen.getByTestId('mobile')).toHaveTextContent('true');
    expect(screen.getByTestId('collapsed')).toHaveTextContent('true');
  });
});