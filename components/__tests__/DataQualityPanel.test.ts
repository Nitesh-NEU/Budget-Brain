/**
 * DataQualityPanel Component Tests
 * 
 * Unit tests for the DataQualityPanel component covering all functionality
 * including citation validation, benchmark analysis, and data quality indicators.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataQualityPanel } from '../DataQualityPanel';
import { Channel, ValidationWarning, BenchmarkAnalysis } from '@/types/shared';

// Mock data for testing
const mockDataQuality = {
  citations: [
    {
      title: "Test Citation 1",
      url: "https://example.com/citation1",
      note: "Test note",
      validationStatus: 'valid' as const,
      lastChecked: "2024-01-15T10:30:00Z",
      responseTime: 200,
      contentQuality: 0.9,
    },
    {
      title: "Test Citation 2", 
      url: "https://example.com/citation2",
      validationStatus: 'invalid' as const,
      lastChecked: "2024-01-14T15:45:00Z",
      responseTime: 5000,
      contentQuality: 0.3,
      issues: ["URL returns 404", "Content quality low"]
    },
    {
      title: "Test Citation 3",
      url: "https://example.com/citation3",
      validationStatus: 'warning' as const,
      lastChecked: "2024-01-13T09:20:00Z",
      responseTime: 1500,
      contentQuality: 0.6,
      issues: ["Slow response time"]
    }
  ],
  benchmarkAnalysis: {
    deviationScore: 0.7,
    channelDeviations: {
      google: 0.5,
      meta: 0.8,
      tiktok: 0.9,
      linkedin: 0.4
    } as Record<Channel, number>,
    warnings: [
      {
        type: "high_deviation",
        message: "TikTok shows high deviation",
        severity: "high" as const,
        channel: "tiktok" as Channel
      }
    ] as ValidationWarning[]
  } as BenchmarkAnalysis,
  warnings: [
    {
      type: "data_freshness",
      message: "Data is outdated",
      severity: "medium" as const
    },
    {
      type: "citation_failure", 
      message: "Citation validation failed",
      severity: "high" as const,
      channel: "linkedin" as Channel
    }
  ] as ValidationWarning[],
  sourceQuality: {
    "Test Source 1": {
      source: "Test Source 1",
      reliability: 0.9,
      lastUpdated: "2024-01-15T10:30:00Z",
      validationStatus: 'valid' as const
    },
    "Test Source 2": {
      source: "Test Source 2",
      reliability: 0.5,
      lastUpdated: "2024-01-10T12:00:00Z", 
      validationStatus: 'error' as const,
      issues: ["API unavailable", "Authentication failed"]
    }
  },
  overallScore: 0.75,
  lastValidated: "2024-01-16T14:30:00Z"
};

describe('DataQualityPanel', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with basic information', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText('Data Quality Panel')).toBeInTheDocument();
      expect(screen.getByText('Source validation, citation quality, and benchmark analysis')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument(); // Overall score
      expect(screen.getByText('2/3 citations valid')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <DataQualityPanel dataQuality={mockDataQuality} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders expandable controls when expandable is true', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} expandable={true} />);
      
      expect(screen.getByText('Collapse')).toBeInTheDocument();
    });

    it('does not render expandable controls when expandable is false', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} expandable={false} />);
      
      expect(screen.queryByText('Collapse')).not.toBeInTheDocument();
      expect(screen.queryByText('Expand')).not.toBeInTheDocument();
    });
  });

  describe('Overall Quality Score', () => {
    it('displays the correct overall quality score', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('shows the last validated date', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText(/Last validated:/)).toBeInTheDocument();
    });

    it('displays warning counts when present', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText('1 high priority issues')).toBeInTheDocument();
      expect(screen.getByText('1 medium priority issues')).toBeInTheDocument();
    });

    it('applies correct color classes based on score', () => {
      const highScoreData = { ...mockDataQuality, overallScore: 0.9 };
      const { rerender } = render(<DataQualityPanel dataQuality={highScoreData} />);
      
      expect(screen.getByText('90%')).toHaveClass('text-green-600');
      
      const lowScoreData = { ...mockDataQuality, overallScore: 0.3 };
      rerender(<DataQualityPanel dataQuality={lowScoreData} />);
      
      expect(screen.getByText('30%')).toHaveClass('text-red-600');
    });
  });

  describe('Citation Quality', () => {
    it('renders all citations', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText('Test Citation 1')).toBeInTheDocument();
      expect(screen.getByText('Test Citation 2')).toBeInTheDocument();
      expect(screen.getByText('Test Citation 3')).toBeInTheDocument();
    });

    it('shows citation count in header', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText('Citation Quality (3 sources)')).toBeInTheDocument();
    });

    it('displays validation status correctly', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText('Valid')).toBeInTheDocument();
      expect(screen.getByText('Invalid')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('expands citation details when clicked', async () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      const citationButton = screen.getByText('Test Citation 1').closest('button');
      expect(citationButton).toBeInTheDocument();
      
      fireEvent.click(citationButton!);
      
      await waitFor(() => {
        expect(screen.getByText('Last Checked:')).toBeInTheDocument();
        expect(screen.getByText('Response Time:')).toBeInTheDocument();
        expect(screen.getByText('200ms')).toBeInTheDocument();
      });
    });

    it('shows issues when citation has problems', async () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      const citationButton = screen.getByText('Test Citation 2').closest('button');
      fireEvent.click(citationButton!);
      
      await waitFor(() => {
        expect(screen.getByText('Issues:')).toBeInTheDocument();
        expect(screen.getByText('URL returns 404')).toBeInTheDocument();
        expect(screen.getByText('Content quality low')).toBeInTheDocument();
      });
    });

    it('displays content quality progress bars', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      const progressBars = screen.getAllByRole('progressbar', { hidden: true });
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('Benchmark Deviation Analysis', () => {
    it('renders benchmark deviation card', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText('Benchmark Deviation Analysis')).toBeInTheDocument();
      expect(screen.getByText('Overall Deviation')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('shows channel deviations', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText('Channel Deviations')).toBeInTheDocument();
      expect(screen.getByText('google')).toBeInTheDocument();
      expect(screen.getByText('meta')).toBeInTheDocument();
      expect(screen.getByText('tiktok')).toBeInTheDocument();
      expect(screen.getByText('linkedin')).toBeInTheDocument();
    });

    it('applies correct severity indicator', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      // High deviation score (0.7) should show high severity
      const severityBadges = screen.getAllByText('High');
      expect(severityBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Data Source Reliability', () => {
    it('renders data source reliability section', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText('Data Source Reliability')).toBeInTheDocument();
    });

    it('calculates and displays average reliability', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      // Average of 0.9 and 0.5 = 0.7 = 70%
      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('expands to show source details when clicked', async () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      const reliabilityButton = screen.getByText('Data Source Reliability').closest('button');
      fireEvent.click(reliabilityButton!);
      
      await waitFor(() => {
        expect(screen.getByText('Test Source 1')).toBeInTheDocument();
        expect(screen.getByText('Test Source 2')).toBeInTheDocument();
      });
    });

    it('shows source issues when present', async () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      const reliabilityButton = screen.getByText('Data Source Reliability').closest('button');
      fireEvent.click(reliabilityButton!);
      
      await waitFor(() => {
        expect(screen.getByText('API unavailable')).toBeInTheDocument();
        expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      });
    });
  });

  describe('Validation Warnings', () => {
    it('renders validation warnings section', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText('Validation Warnings (2)')).toBeInTheDocument();
    });

    it('displays warning messages', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText('Data is outdated')).toBeInTheDocument();
      expect(screen.getByText('Citation validation failed')).toBeInTheDocument();
    });

    it('shows severity indicators for warnings', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('shows channel information when available', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      expect(screen.getByText('Channel: linkedin')).toBeInTheDocument();
    });

    it('handles show all/show less for many warnings', () => {
      const manyWarningsData = {
        ...mockDataQuality,
        warnings: [
          ...mockDataQuality.warnings,
          { type: "test3", message: "Warning 3", severity: "low" as const },
          { type: "test4", message: "Warning 4", severity: "low" as const },
          { type: "test5", message: "Warning 5", severity: "low" as const }
        ]
      };
      
      render(<DataQualityPanel dataQuality={manyWarningsData} />);
      
      expect(screen.getByText('Show All')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Show All'));
      expect(screen.getByText('Show Less')).toBeInTheDocument();
    });
  });

  describe('Expandable Functionality', () => {
    it('collapses and expands main panel when expandable', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} expandable={true} />);
      
      // Initially expanded
      expect(screen.getByText('Citation Quality (3 sources)')).toBeInTheDocument();
      
      // Collapse
      fireEvent.click(screen.getByText('Collapse'));
      expect(screen.getByText('Expand')).toBeInTheDocument();
      
      // Expand again
      fireEvent.click(screen.getByText('Expand'));
      expect(screen.getByText('Collapse')).toBeInTheDocument();
      expect(screen.getByText('Citation Quality (3 sources)')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty citations array', () => {
      const emptyData = {
        ...mockDataQuality,
        citations: []
      };
      
      render(<DataQualityPanel dataQuality={emptyData} />);
      
      expect(screen.getByText('Citation Quality (0 sources)')).toBeInTheDocument();
      expect(screen.getByText('0/0 citations valid')).toBeInTheDocument();
    });

    it('handles missing optional fields', () => {
      const minimalData = {
        citations: [{
          url: "https://example.com",
          validationStatus: 'valid' as const
        }],
        benchmarkAnalysis: {
          deviationScore: 0.5,
          channelDeviations: {} as Record<Channel, number>,
          warnings: []
        },
        warnings: [],
        sourceQuality: {},
        overallScore: 0.8,
        lastValidated: "2024-01-16T14:30:00Z"
      };
      
      render(<DataQualityPanel dataQuality={minimalData} />);
      
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('1/1 citations valid')).toBeInTheDocument();
    });

    it('handles zero overall score', () => {
      const zeroScoreData = {
        ...mockDataQuality,
        overallScore: 0
      };
      
      render(<DataQualityPanel dataQuality={zeroScoreData} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('supports keyboard navigation', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      expect(firstButton).toHaveFocus();
    });

    it('has proper focus management', () => {
      render(<DataQualityPanel dataQuality={mockDataQuality} />);
      
      const citationButton = screen.getByText('Test Citation 1').closest('button');
      fireEvent.focus(citationButton!);
      expect(citationButton).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with large datasets', () => {
      const largeCitationsData = {
        ...mockDataQuality,
        citations: Array.from({ length: 100 }, (_, i) => ({
          title: `Citation ${i}`,
          url: `https://example.com/citation${i}`,
          validationStatus: 'valid' as const,
          contentQuality: Math.random()
        }))
      };
      
      const startTime = performance.now();
      render(<DataQualityPanel dataQuality={largeCitationsData} />);
      const endTime = performance.now();
      
      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});