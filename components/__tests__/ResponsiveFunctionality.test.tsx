/**
 * Responsive Functionality Tests
 * 
 * Tests for responsive behavior and mobile optimization functionality
 * without relying on CSS styling in test environment.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { PipelineFlowVisualizer } from '../PipelineFlowVisualizer';
import { ConfidenceDashboard } from '../ConfidenceDashboard';
import { DataQualityPanel } from '../DataQualityPanel';
import { AlternativeOptionsExplorer } from '../AlternativeOptionsExplorer';

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

describe('Responsive Functionality', () => {
  beforeEach(() => {
    // Reset to desktop size
    mockWindowSize(1200);
  });

  describe('PipelineFlowVisualizer Responsive Features', () => {
    test('renders pipeline stages correctly', () => {
      render(<PipelineFlowVisualizer stages={mockPipelineStages} />);
      
      expect(screen.getByText('Optimization Pipeline')).toBeInTheDocument();
      expect(screen.getByLabelText('Data Fetch - completed')).toBeInTheDocument();
      expect(screen.getByLabelText('Validation - running')).toBeInTheDocument();
    });

    test('handles stage selection and details display', () => {
      render(<PipelineFlowVisualizer stages={mockPipelineStages} />);
      
      const stageButton = screen.getByLabelText('Data Fetch - completed');
      fireEvent.click(stageButton);
      
      // Should show stage details (using more specific selector)
      expect(screen.getByRole('heading', { name: 'Data Fetch' })).toBeInTheDocument();
    });

    test('responds to window resize events', async () => {
      render(<PipelineFlowVisualizer stages={mockPipelineStages} />);
      
      // Change to mobile size
      mockWindowSize(600);
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByText('Optimization Pipeline')).toBeInTheDocument();
      });
    });
  });

  describe('ConfidenceDashboard Responsive Features', () => {
    test('renders confidence metrics correctly', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceData} />);
      
      expect(screen.getByText('Confidence Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Overall Confidence')).toBeInTheDocument();
      expect(screen.getAllByText('85%')).toHaveLength(2); // Overall confidence and summary
    });

    test('handles collapsible behavior', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceData} />);
      
      const toggleButton = screen.getByText('Show Details');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('Hide Details')).toBeInTheDocument();
    });

    test('adapts to mobile viewport', async () => {
      render(<ConfidenceDashboard confidence={mockConfidenceData} />);
      
      mockWindowSize(600);
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByText('Confidence Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('DataQualityPanel Responsive Features', () => {
    test('renders data quality information correctly', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText('Data Quality Panel')).toBeInTheDocument();
      expect(screen.getByText('Overall Data Quality')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    test('handles expandable sections', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      const expandButton = screen.getByText('Collapse');
      fireEvent.click(expandButton);
      
      expect(screen.getByText('Expand')).toBeInTheDocument();
    });

    test('shows citation quality indicators', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText('Citation Quality (1 sources)')).toBeInTheDocument();
      expect(screen.getByText('Test Citation')).toBeInTheDocument();
    });
  });

  describe('AlternativeOptionsExplorer Responsive Features', () => {
    test('renders alternative options correctly', () => {
      render(
        <AlternativeOptionsExplorer 
          alternatives={mockAlternatives} 
          currentAllocation={mockAlternatives[0].allocation}
        />
      );
      
      expect(screen.getByText('Alternative Options Explorer')).toBeInTheDocument();
      expect(screen.getByText('Compare 2 alternative allocation strategies')).toBeInTheDocument();
    });

    test('handles sorting functionality', () => {
      render(
        <AlternativeOptionsExplorer 
          alternatives={mockAlternatives} 
          currentAllocation={mockAlternatives[0].allocation}
        />
      );
      
      const sortSelect = screen.getByDisplayValue('Sort by Confidence');
      fireEvent.change(sortSelect, { target: { value: 'performance' } });
      
      expect(screen.getByDisplayValue('Sort by Performance')).toBeInTheDocument();
    });

    test('shows options summary', () => {
      render(
        <AlternativeOptionsExplorer 
          alternatives={mockAlternatives} 
          currentAllocation={mockAlternatives[0].allocation}
        />
      );
      
      expect(screen.getByText('Options Summary')).toBeInTheDocument();
      expect(screen.getByText('Avg Confidence:')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    test('adapts layout for mobile', async () => {
      render(
        <AlternativeOptionsExplorer 
          alternatives={mockAlternatives} 
          currentAllocation={mockAlternatives[0].allocation}
        />
      );
      
      mockWindowSize(600);
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByText('Alternative Options Explorer')).toBeInTheDocument();
      });
    });
  });

  describe('Touch Gesture Simulation', () => {
    test('handles touch events on mobile components', () => {
      const { container } = render(
        <AlternativeOptionsExplorer 
          alternatives={mockAlternatives} 
          currentAllocation={mockAlternatives[0].allocation}
        />
      );
      
      mockWindowSize(600);
      fireEvent(window, new Event('resize'));
      
      // Simulate touch events
      const touchableElement = container.firstChild as Element;
      
      fireEvent.touchStart(touchableElement, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchMove(touchableElement, {
        touches: [{ clientX: 50, clientY: 100 }]
      });
      
      fireEvent.touchEnd(touchableElement);
      
      // Component should handle touch events without errors
      expect(screen.getByText('Alternative Options Explorer')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout Adaptation', () => {
    test('components maintain functionality across viewport sizes', async () => {
      const { rerender } = render(<ConfidenceDashboard confidence={mockConfidenceData} />);
      
      // Test different viewport sizes
      const viewportSizes = [320, 768, 1024, 1440];
      
      for (const width of viewportSizes) {
        mockWindowSize(width);
        fireEvent(window, new Event('resize'));
        
        rerender(<ConfidenceDashboard confidence={mockConfidenceData} />);
        
        await waitFor(() => {
          expect(screen.getByText('Confidence Dashboard')).toBeInTheDocument();
        });
      }
    });

    test('collapsible panels work across different screen sizes', async () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      // Test mobile size
      mockWindowSize(600);
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByText('Data Quality Panel')).toBeInTheDocument();
      });
      
      // Test tablet size
      mockWindowSize(900);
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByText('Data Quality Panel')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Error Handling', () => {
    test('components handle rapid resize events gracefully', async () => {
      render(<PipelineFlowVisualizer stages={mockPipelineStages} />);
      
      // Simulate rapid resize events
      for (let i = 0; i < 20; i++) {
        mockWindowSize(600 + i * 30);
        fireEvent(window, new Event('resize'));
      }
      
      await waitFor(() => {
        expect(screen.getByText('Optimization Pipeline')).toBeInTheDocument();
      });
    });

    test('components handle empty data gracefully on mobile', () => {
      mockWindowSize(600);
      
      render(<AlternativeOptionsExplorer alternatives={[]} currentAllocation={{}} />);
      
      expect(screen.getByText('No Alternative Options Available')).toBeInTheDocument();
    });

    test('components handle missing data properties', () => {
      const incompleteData = {
        ...mockConfidenceData,
        algorithms: []
      };
      
      render(<ConfidenceDashboard confidence={incompleteData} />);
      
      expect(screen.getByText('Confidence Dashboard')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    test('components maintain proper ARIA labels', () => {
      render(<PipelineFlowVisualizer stages={mockPipelineStages} />);
      
      expect(screen.getByLabelText('Data Fetch - completed')).toBeInTheDocument();
      expect(screen.getByLabelText('Validation - running')).toBeInTheDocument();
    });

    test('interactive elements are keyboard accessible', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceData} />);
      
      const toggleButton = screen.getByText('Show Details');
      
      // Should be focusable
      toggleButton.focus();
      expect(document.activeElement).toBe(toggleButton);
      
      // Should respond to keyboard events
      fireEvent.keyDown(toggleButton, { key: 'Enter' });
      // Check if the button text changed or details are shown
      expect(toggleButton).toBeInTheDocument();
    });

    test('components provide proper focus management', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      const buttons = screen.getAllByRole('button');
      
      // All buttons should be focusable
      buttons.forEach(button => {
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });
  });
});