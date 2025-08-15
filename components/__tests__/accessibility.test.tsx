/**
 * Accessibility Tests
 * 
 * Comprehensive tests for screen reader compatibility, keyboard navigation,
 * and WCAG compliance across all visualization components.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { PipelineFlowVisualizer } from '../PipelineFlowVisualizer';
import { ConfidenceDashboard } from '../ConfidenceDashboard';
import { DataQualityPanel } from '../DataQualityPanel';
import { AlternativeOptionsExplorer } from '../AlternativeOptionsExplorer';
import { RealTimePipelineStatus } from '../RealTimePipelineStatus';
import { ExportSystem } from '../ExportSystem';
import { VisualizationProvider } from '../../lib/visualizationContext';

// Mock data
const mockPipelineStages = [
  {
    id: 'dataFetch',
    name: 'Data Fetching',
    status: 'completed' as const,
    progress: 100,
    duration: 2000,
    startTime: Date.now() - 5000,
    endTime: Date.now() - 3000
  },
  {
    id: 'validation',
    name: 'Data Validation',
    status: 'running' as const,
    progress: 65,
    startTime: Date.now() - 3000,
    details: 'Validating citations...'
  },
  {
    id: 'optimization',
    name: 'Optimization',
    status: 'pending' as const,
    progress: 0
  }
];

const mockConfidenceData = {
  overall: 0.88,
  perChannel: {
    google: 0.92,
    meta: 0.85,
    tiktok: 0.78,
    linkedin: 0.90
  },
  stability: 0.91,
  algorithms: [
    {
      name: 'ensemble',
      allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
      confidence: 0.92,
      performance: 0.88
    },
    {
      name: 'bayesian',
      allocation: { google: 0.35, meta: 0.35, tiktok: 0.2, linkedin: 0.1 },
      confidence: 0.87,
      performance: 0.91
    }
  ],
  consensus: {
    agreement: 0.85,
    variance: { google: 0.05, meta: 0.08, tiktok: 0.12, linkedin: 0.06 },
    outlierCount: 1
  }
};

const mockDataQuality = {
  citations: [
    {
      title: 'Test Citation 1',
      url: 'https://example.com/citation1',
      validationStatus: 'valid' as const,
      contentQuality: 0.9,
      lastChecked: '2024-01-15T10:30:00Z'
    },
    {
      title: 'Test Citation 2',
      url: 'https://example.com/citation2',
      validationStatus: 'warning' as const,
      contentQuality: 0.6,
      lastChecked: '2024-01-14T15:45:00Z',
      issues: ['Slow response time']
    }
  ],
  benchmarkAnalysis: {
    deviationScore: 0.15,
    channelDeviations: { google: 0.1, meta: 0.2, tiktok: 0.15, linkedin: 0.1 },
    warnings: [
      {
        type: 'high_deviation',
        message: 'Meta shows high deviation',
        severity: 'medium' as const,
        channel: 'meta' as const
      }
    ]
  },
  warnings: [
    {
      type: 'data_freshness',
      message: 'Data is outdated',
      severity: 'medium' as const
    }
  ],
  sourceQuality: {
    'benchmark-data': {
      source: 'benchmark-data',
      reliability: 0.9,
      validationStatus: 'valid' as const,
      lastUpdated: '2024-01-15T10:30:00Z'
    }
  },
  overallScore: 0.85,
  lastValidated: '2024-01-16T14:30:00Z'
};

const mockAlternatives = [
  {
    id: 'alt-1',
    allocation: { google: 0.5, meta: 0.3, tiktok: 0.15, linkedin: 0.05 },
    confidence: 0.9,
    performance: 0.85,
    reasoning: 'High-confidence allocation based on ensemble methods',
    algorithmSource: 'ensemble',
    riskLevel: 'low' as const,
    expectedOutcome: 125000
  },
  {
    id: 'alt-2',
    allocation: { google: 0.4, meta: 0.4, tiktok: 0.15, linkedin: 0.05 },
    confidence: 0.8,
    performance: 0.82,
    reasoning: 'Balanced allocation with medium confidence',
    algorithmSource: 'bayesian',
    riskLevel: 'medium' as const,
    expectedOutcome: 118000
  }
];

const mockEnhancedResult = {
  allocation: { google: 0.45, meta: 0.30, tiktok: 0.15, linkedin: 0.10 },
  detOutcome: 12500,
  mc: { p10: 10000, p50: 12500, p90: 15000 },
  intervals: {
    google: [0.35, 0.55] as [number, number],
    meta: [0.20, 0.40] as [number, number],
    tiktok: [0.10, 0.20] as [number, number],
    linkedin: [0.05, 0.15] as [number, number]
  },
  objective: 'revenue' as const,
  summary: 'Optimized allocation with high confidence',
  confidence: mockConfidenceData,
  validation: {
    alternativeAlgorithms: [],
    consensus: mockConfidenceData.consensus,
    benchmarkComparison: {
      deviationScore: 0.15,
      channelDeviations: { google: 0.1, meta: 0.2, tiktok: 0.15, linkedin: 0.1 },
      warnings: []
    },
    warnings: []
  },
  alternatives: {
    topAllocations: [
      { google: 0.40, meta: 0.35, tiktok: 0.15, linkedin: 0.10 }
    ],
    reasoningExplanation: 'Multiple viable strategies identified'
  }
};

// Test wrapper for components that need context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <VisualizationProvider>
    {children}
  </VisualizationProvider>
);

describe('Accessibility Tests', () => {
  const user = userEvent.setup();

  describe('ARIA Labels and Roles', () => {
    it('PipelineFlowVisualizer has proper ARIA labels', () => {
      render(<PipelineFlowVisualizer stages={mockPipelineStages} />);
      
      // Main component should have proper role
      expect(screen.getByRole('region', { name: /pipeline flow/i })).toBeInTheDocument();
      
      // Stage buttons should have descriptive labels
      expect(screen.getByLabelText('Data Fetching - completed')).toBeInTheDocument();
      expect(screen.getByLabelText('Data Validation - running')).toBeInTheDocument();
      expect(screen.getByLabelText('Optimization - pending')).toBeInTheDocument();
      
      // Progress bars should have proper ARIA attributes
      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(progressBar => {
        expect(progressBar).toHaveAttribute('aria-valuenow');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it('ConfidenceDashboard has proper ARIA structure', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceData} />);
      
      // Main dashboard should be a region
      expect(screen.getByRole('region', { name: /confidence dashboard/i })).toBeInTheDocument();
      
      // Progress indicators should have labels
      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(progressBar => {
        expect(progressBar).toHaveAttribute('aria-label');
      });
      
      // Algorithm buttons should be properly labeled
      const algorithmButtons = screen.getAllByRole('button');
      algorithmButtons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('DataQualityPanel has proper semantic structure', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      // Main panel should be a region
      expect(screen.getByRole('region', { name: /data quality/i })).toBeInTheDocument();
      
      // Citation list should have proper structure
      expect(screen.getByRole('list')).toBeInTheDocument();
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
      
      // Expandable sections should have proper ARIA attributes
      const expandableButtons = screen.getAllByRole('button', { expanded: false });
      expandableButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-expanded');
      });
    });

    it('AlternativeOptionsExplorer has proper table structure', () => {
      render(
        <AlternativeOptionsExplorer 
          alternatives={mockAlternatives} 
          currentAllocation={mockAlternatives[0].allocation}
        />
      );
      
      // Should have proper table structure for alternatives
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(6); // Algorithm, Confidence, Performance, Risk, Expected, Actions
      expect(screen.getAllByRole('row')).toHaveLength(3); // Header + 2 alternatives
      
      // Sort controls should be properly labeled
      const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
      expect(sortSelect).toBeInTheDocument();
    });

    it('RealTimePipelineStatus has live region for updates', () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline" />,
        { wrapper: TestWrapper }
      );
      
      // Should have live region for status updates
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      // Connection status should be announced
      expect(screen.getByLabelText(/connection status/i)).toBeInTheDocument();
      
      // Pipeline status should be announced
      expect(screen.getByLabelText(/pipeline status/i)).toBeInTheDocument();
    });

    it('ExportSystem has proper form structure', () => {
      render(<ExportSystem data={mockEnhancedResult} />);
      
      // Export button should be properly labeled
      expect(screen.getByRole('button', { name: /export results/i })).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('PipelineFlowVisualizer supports keyboard navigation', async () => {
      render(<PipelineFlowVisualizer stages={mockPipelineStages} />);
      
      const stageButtons = screen.getAllByRole('button');
      
      // First button should be focusable
      await user.tab();
      expect(stageButtons[0]).toHaveFocus();
      
      // Should be able to activate with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByRole('heading', { name: 'Data Fetching' })).toBeInTheDocument();
      
      // Should be able to activate with Space
      await user.keyboard('{Escape}'); // Close details first
      await user.keyboard(' ');
      expect(screen.getByRole('heading', { name: 'Data Fetching' })).toBeInTheDocument();
      
      // Should be able to navigate between stages with arrow keys
      await user.keyboard('{Escape}'); // Close details
      await user.keyboard('{ArrowRight}');
      expect(stageButtons[1]).toHaveFocus();
    });

    it('ConfidenceDashboard supports keyboard navigation', async () => {
      render(<ConfidenceDashboard confidence={mockConfidenceData} />);
      
      // Should be able to navigate to toggle button
      await user.tab();
      const toggleButton = screen.getByRole('button', { name: /show details/i });
      expect(toggleButton).toHaveFocus();
      
      // Should be able to activate with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByText('Hide Details')).toBeInTheDocument();
      
      // Should be able to navigate to algorithm buttons
      await user.tab();
      const algorithmButtons = screen.getAllByText(/ensemble|bayesian/).map(
        text => text.closest('button')
      ).filter(Boolean);
      
      if (algorithmButtons.length > 0) {
        expect(algorithmButtons[0]).toHaveFocus();
      }
    });

    it('DataQualityPanel supports keyboard navigation', async () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} expandable={true} />);
      
      // Should be able to navigate to collapse button
      await user.tab();
      const collapseButton = screen.getByRole('button', { name: /collapse/i });
      expect(collapseButton).toHaveFocus();
      
      // Should be able to activate with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByText('Expand')).toBeInTheDocument();
      
      // Expand again to test citation navigation
      await user.keyboard('{Enter}');
      
      // Should be able to navigate to citation buttons
      await user.tab();
      const citationButtons = screen.getAllByText(/test citation/i).map(
        text => text.closest('button')
      ).filter(Boolean);
      
      if (citationButtons.length > 0) {
        expect(citationButtons[0]).toHaveFocus();
      }
    });

    it('AlternativeOptionsExplorer supports keyboard navigation', async () => {
      render(
        <AlternativeOptionsExplorer 
          alternatives={mockAlternatives} 
          currentAllocation={mockAlternatives[0].allocation}
        />
      );
      
      // Should be able to navigate to sort control
      await user.tab();
      const sortSelect = screen.getByRole('combobox');
      expect(sortSelect).toHaveFocus();
      
      // Should be able to change sort option with keyboard
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      // Should be able to navigate to action buttons
      await user.tab();
      const actionButtons = screen.getAllByRole('button', { name: /details|select/i });
      if (actionButtons.length > 0) {
        expect(actionButtons[0]).toHaveFocus();
      }
    });

    it('supports tab trapping in modals', async () => {
      render(
        <AlternativeOptionsExplorer 
          alternatives={mockAlternatives} 
          currentAllocation={mockAlternatives[0].allocation}
        />
      );
      
      // Open modal
      const detailsButton = screen.getAllByText('Details')[0];
      await user.click(detailsButton);
      
      await waitFor(() => {
        expect(screen.getByText('Alternative Option Details')).toBeInTheDocument();
      });
      
      // Focus should be trapped within modal
      const modalButtons = screen.getAllByRole('button');
      const closeButton = screen.getByText('Close');
      
      // Tab should cycle through modal elements
      await user.tab();
      expect(closeButton).toHaveFocus();
      
      // Shift+Tab should go backwards
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      // Focus should stay within modal
    });
  });

  describe('Screen Reader Announcements', () => {
    it('announces pipeline stage changes', async () => {
      render(<PipelineFlowVisualizer stages={mockPipelineStages} />);
      
      const stageButton = screen.getByLabelText('Data Fetching - completed');
      await user.click(stageButton);
      
      // Should announce stage selection
      expect(screen.getByRole('status')).toHaveTextContent(/data fetching/i);
    });

    it('announces confidence level changes', async () => {
      const { rerender } = render(<ConfidenceDashboard confidence={mockConfidenceData} />);
      
      // Change confidence data
      const updatedConfidence = {
        ...mockConfidenceData,
        overall: 0.95
      };
      
      rerender(<ConfidenceDashboard confidence={updatedConfidence} />);
      
      // Should announce confidence change
      expect(screen.getByRole('status')).toHaveTextContent(/confidence.*95/i);
    });

    it('announces data quality warnings', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      // Should announce quality issues
      expect(screen.getByRole('alert')).toHaveTextContent(/data is outdated/i);
    });

    it('announces real-time pipeline updates', async () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline" />,
        { wrapper: TestWrapper }
      );
      
      // Should have live region for updates
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
      
      // Updates should be announced in live region
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Focus Management', () => {
    it('manages focus when opening/closing details', async () => {
      render(<PipelineFlowVisualizer stages={mockPipelineStages} />);
      
      const stageButton = screen.getByLabelText('Data Fetching - completed');
      await user.click(stageButton);
      
      // Focus should move to details heading
      expect(screen.getByRole('heading', { name: 'Data Fetching' })).toHaveFocus();
      
      // Close details
      const closeButton = screen.getByLabelText('Close details');
      await user.click(closeButton);
      
      // Focus should return to stage button
      expect(stageButton).toHaveFocus();
    });

    it('manages focus in modal dialogs', async () => {
      render(
        <AlternativeOptionsExplorer 
          alternatives={mockAlternatives} 
          currentAllocation={mockAlternatives[0].allocation}
        />
      );
      
      const detailsButton = screen.getAllByText('Details')[0];
      await user.click(detailsButton);
      
      await waitFor(() => {
        expect(screen.getByText('Alternative Option Details')).toBeInTheDocument();
      });
      
      // Focus should move to modal
      const modalHeading = screen.getByRole('heading', { name: /alternative option details/i });
      expect(modalHeading).toHaveFocus();
      
      // Close modal
      const closeButton = screen.getByText('Close');
      await user.click(closeButton);
      
      // Focus should return to details button
      expect(detailsButton).toHaveFocus();
    });

    it('provides skip links for complex components', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceData} />);
      
      // Should have skip link to main content
      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });

  describe('Color and Contrast', () => {
    it('provides text alternatives for color-coded information', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      // Status indicators should have text labels, not just colors
      expect(screen.getByText('Valid')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
      
      // Severity levels should have text labels
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('uses patterns and shapes in addition to color', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceData} />);
      
      // Progress bars should have text percentages
      expect(screen.getByText('88%')).toBeInTheDocument(); // Overall confidence
      expect(screen.getByText('92%')).toBeInTheDocument(); // Google confidence
      
      // Algorithm badges should have text labels
      expect(screen.getByText('ensemble')).toBeInTheDocument();
      expect(screen.getByText('bayesian')).toBeInTheDocument();
    });

    it('provides high contrast mode support', () => {
      render(<PipelineFlowVisualizer stages={mockPipelineStages} />);
      
      // Components should have high contrast classes
      const stageButtons = screen.getAllByRole('button');
      stageButtons.forEach(button => {
        expect(button).toHaveClass('focus:ring-2');
      });
    });
  });

  describe('Responsive Accessibility', () => {
    it('maintains accessibility on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });
      
      render(<AlternativeOptionsExplorer 
        alternatives={mockAlternatives} 
        currentAllocation={mockAlternatives[0].allocation}
      />);
      
      // Touch targets should meet minimum size requirements
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        expect(Math.max(rect.width, rect.height)).toBeGreaterThanOrEqual(44);
      });
    });

    it('provides swipe gesture alternatives', () => {
      render(<AlternativeOptionsExplorer 
        alternatives={mockAlternatives} 
        currentAllocation={mockAlternatives[0].allocation}
      />);
      
      // Should have navigation buttons as alternatives to swipe
      expect(screen.getByLabelText(/previous option/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/next option/i)).toBeInTheDocument();
    });
  });

  describe('Error States and Feedback', () => {
    it('provides accessible error messages', () => {
      const errorData = {
        ...mockDataQuality,
        citations: [
          {
            title: 'Failed Citation',
            url: 'https://invalid-url.com',
            validationStatus: 'invalid' as const,
            contentQuality: 0.1,
            issues: ['URL returns 404', 'Content not accessible']
          }
        ]
      };
      
      render(<DataQualityPanel dataQuality={errorData} />);
      
      // Error should be announced
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // Error details should be accessible
      expect(screen.getByText('URL returns 404')).toBeInTheDocument();
    });

    it('provides loading state announcements', () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline" />,
        { wrapper: TestWrapper }
      );
      
      // Loading state should be announced
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      expect(screen.getByLabelText(/connection status.*connecting/i)).toBeInTheDocument();
    });

    it('provides form validation feedback', async () => {
      render(<ExportSystem data={mockEnhancedResult} />);
      
      const exportButton = screen.getByRole('button', { name: /export results/i });
      await user.click(exportButton);
      
      // Should show export options with proper labels
      await waitFor(() => {
        const formatSelect = screen.getByRole('combobox', { name: /export format/i });
        expect(formatSelect).toBeInTheDocument();
      });
    });
  });

  describe('Internationalization Support', () => {
    it('supports RTL languages', () => {
      // Mock RTL direction
      document.dir = 'rtl';
      
      render(<ConfidenceDashboard confidence={mockConfidenceData} />);
      
      // Components should adapt to RTL
      const dashboard = screen.getByRole('region', { name: /confidence dashboard/i });
      expect(dashboard).toHaveAttribute('dir', 'rtl');
      
      // Reset
      document.dir = 'ltr';
    });

    it('provides language attributes', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      // Should have proper lang attributes
      const panel = screen.getByRole('region', { name: /data quality/i });
      expect(panel).toHaveAttribute('lang', 'en');
    });
  });

  describe('Reduced Motion Support', () => {
    it('respects prefers-reduced-motion', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      render(<PipelineFlowVisualizer stages={mockPipelineStages} />);
      
      // Animations should be disabled
      const runningStage = screen.getByLabelText('Data Validation - running');
      expect(runningStage).not.toHaveClass('animate-pulse');
    });
  });
});