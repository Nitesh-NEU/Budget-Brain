/**
 * ConfidenceDashboard Component Tests
 * 
 * Comprehensive tests for the ConfidenceDashboard component covering all functionality
 * including confidence metrics, algorithm details, and interactive features.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfidenceDashboard } from '../ConfidenceDashboard';
import { ConfidenceMetrics, AlgorithmResult, ConsensusMetrics } from '@/types/shared';

// Mock data for testing
const mockAlgorithmResults: AlgorithmResult[] = [
  {
    name: 'ensemble',
    allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
    confidence: 0.92,
    performance: 0.88,
    details: {
      iterations: 100,
      convergence: 0.95,
      executionTime: 2500
    }
  },
  {
    name: 'bayesian',
    allocation: { google: 0.35, meta: 0.35, tiktok: 0.2, linkedin: 0.1 },
    confidence: 0.87,
    performance: 0.91,
    details: {
      iterations: 150,
      convergence: 0.89,
      executionTime: 3200
    }
  },
  {
    name: 'gradient',
    allocation: { google: 0.45, meta: 0.25, tiktok: 0.2, linkedin: 0.1 },
    confidence: 0.85,
    performance: 0.86,
    details: {
      iterations: 80,
      convergence: 0.92,
      executionTime: 1800
    }
  }
];

const mockConsensusMetrics: ConsensusMetrics = {
  agreement: 0.85,
  variance: {
    google: 0.05,
    meta: 0.08,
    tiktok: 0.12,
    linkedin: 0.06
  },
  outlierCount: 1
};

const mockConfidenceMetrics: ConfidenceMetrics = {
  overall: 0.88,
  perChannel: {
    google: 0.92,
    meta: 0.85,
    tiktok: 0.78,
    linkedin: 0.90
  },
  stability: 0.91,
  algorithms: mockAlgorithmResults,
  consensus: mockConsensusMetrics
};

describe('ConfidenceDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with basic information', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      expect(screen.getByText('Confidence Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Algorithm performance and confidence metrics')).toBeInTheDocument();
      expect(screen.getByText('Overall Confidence')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <ConfidenceDashboard confidence={mockConfidenceMetrics} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders with showDetails prop', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} showDetails={true} />);
      
      expect(screen.getByText('Hide Details')).toBeInTheDocument();
    });

    it('renders without showDetails prop', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} showDetails={false} />);
      
      expect(screen.getByText('Show Details')).toBeInTheDocument();
    });
  });

  describe('Overall Confidence Display', () => {
    it('displays the correct overall confidence score', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      expect(screen.getByText('88%')).toBeInTheDocument();
    });

    it('displays stability score', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      expect(screen.getByText('Stability')).toBeInTheDocument();
      expect(screen.getByText('91%')).toBeInTheDocument();
    });

    it('applies correct color classes based on confidence level', () => {
      const highConfidenceData = { ...mockConfidenceMetrics, overall: 0.95 };
      const { rerender } = render(<ConfidenceDashboard confidence={highConfidenceData} />);
      
      expect(screen.getByText('95%')).toHaveClass('text-green-600');
      
      const lowConfidenceData = { ...mockConfidenceMetrics, overall: 0.45 };
      rerender(<ConfidenceDashboard confidence={lowConfidenceData} />);
      
      expect(screen.getByText('45%')).toHaveClass('text-red-600');
      
      const mediumConfidenceData = { ...mockConfidenceMetrics, overall: 0.75 };
      rerender(<ConfidenceDashboard confidence={mediumConfidenceData} />);
      
      expect(screen.getByText('75%')).toHaveClass('text-yellow-600');
    });

    it('displays circular progress indicator', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      // Check for SVG circle elements (progress indicators)
      const circles = document.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
    });
  });

  describe('Per-Channel Confidence', () => {
    it('displays all channel confidence scores', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      expect(screen.getByText('Channel Confidence')).toBeInTheDocument();
      expect(screen.getByText('google')).toBeInTheDocument();
      expect(screen.getByText('meta')).toBeInTheDocument();
      expect(screen.getByText('tiktok')).toBeInTheDocument();
      expect(screen.getByText('linkedin')).toBeInTheDocument();
      
      expect(screen.getByText('92%')).toBeInTheDocument(); // Google
      expect(screen.getByText('85%')).toBeInTheDocument(); // Meta
      expect(screen.getByText('78%')).toBeInTheDocument(); // TikTok
      expect(screen.getByText('90%')).toBeInTheDocument(); // LinkedIn
    });

    it('applies color coding to channel confidence bars', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      // Progress bars should have appropriate colors based on confidence levels
      const progressBars = document.querySelectorAll('[role="progressbar"]');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('shows channel confidence in correct order', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      const channelElements = screen.getAllByText(/google|meta|tiktok|linkedin/);
      expect(channelElements.length).toBeGreaterThan(0);
    });
  });

  describe('Algorithm Contribution Badges', () => {
    it('displays all algorithm badges', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      expect(screen.getByText('Algorithm Contributions')).toBeInTheDocument();
      expect(screen.getByText('ensemble')).toBeInTheDocument();
      expect(screen.getByText('bayesian')).toBeInTheDocument();
      expect(screen.getByText('gradient')).toBeInTheDocument();
    });

    it('shows algorithm confidence scores', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      // Should show confidence percentages for each algorithm
      expect(screen.getByText('92%')).toBeInTheDocument(); // Ensemble
      expect(screen.getByText('87%')).toBeInTheDocument(); // Bayesian
      expect(screen.getByText('85%')).toBeInTheDocument(); // Gradient
    });

    it('shows algorithm performance scores', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      expect(screen.getByText('Performance:')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument(); // Ensemble performance
      expect(screen.getByText('91%')).toBeInTheDocument(); // Bayesian performance
      expect(screen.getByText('86%')).toBeInTheDocument(); // Gradient performance
    });

    it('expands algorithm details when clicked', async () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      const ensembleButton = screen.getByText('ensemble').closest('button');
      expect(ensembleButton).toBeInTheDocument();
      
      fireEvent.click(ensembleButton!);
      
      await waitFor(() => {
        expect(screen.getByText('Iterations:')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Convergence:')).toBeInTheDocument();
        expect(screen.getByText('95%')).toBeInTheDocument();
        expect(screen.getByText('Execution Time:')).toBeInTheDocument();
        expect(screen.getByText('2.5s')).toBeInTheDocument();
      });
    });
  });

  describe('Consensus Metrics', () => {
    it('displays consensus agreement', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      expect(screen.getByText('Consensus Metrics')).toBeInTheDocument();
      expect(screen.getByText('Algorithm Agreement')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('shows outlier count', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      expect(screen.getByText('Outliers')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('displays variance indicators', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      expect(screen.getByText('Channel Variance')).toBeInTheDocument();
      
      // Should show variance for each channel
      expect(screen.getByText('5%')).toBeInTheDocument(); // Google variance
      expect(screen.getByText('8%')).toBeInTheDocument(); // Meta variance
      expect(screen.getByText('12%')).toBeInTheDocument(); // TikTok variance
      expect(screen.getByText('6%')).toBeInTheDocument(); // LinkedIn variance
    });

    it('applies warning indicators for high variance', () => {
      const highVarianceData = {
        ...mockConfidenceMetrics,
        consensus: {
          ...mockConsensusMetrics,
          variance: {
            google: 0.25, // High variance
            meta: 0.08,
            tiktok: 0.12,
            linkedin: 0.06
          }
        }
      };
      
      render(<ConfidenceDashboard confidence={highVarianceData} />);
      
      // Should show warning indicator for high variance
      expect(screen.getByText('25%')).toHaveClass('text-red-600');
    });
  });

  describe('Interactive Features', () => {
    it('toggles details visibility', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      const toggleButton = screen.getByText('Show Details');
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('Hide Details')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Hide Details'));
      expect(screen.getByText('Show Details')).toBeInTheDocument();
    });

    it('expands and collapses algorithm sections', async () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      const algorithmButton = screen.getByText('bayesian').closest('button');
      fireEvent.click(algorithmButton!);
      
      await waitFor(() => {
        expect(screen.getByText('Iterations:')).toBeInTheDocument();
      });
      
      // Click again to collapse
      fireEvent.click(algorithmButton!);
      
      await waitFor(() => {
        expect(screen.queryByText('Iterations:')).not.toBeInTheDocument();
      });
    });

    it('handles algorithm selection callback', () => {
      const mockOnAlgorithmSelect = jest.fn();
      render(
        <ConfidenceDashboard 
          confidence={mockConfidenceMetrics} 
          onAlgorithmSelect={mockOnAlgorithmSelect}
        />
      );
      
      const algorithmButton = screen.getByText('ensemble').closest('button');
      fireEvent.click(algorithmButton!);
      
      expect(mockOnAlgorithmSelect).toHaveBeenCalledWith('ensemble');
    });
  });

  describe('Summary Statistics', () => {
    it('calculates and displays average confidence', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText('Avg Algorithm Confidence:')).toBeInTheDocument();
      // Average of 92%, 87%, 85% = 88%
      expect(screen.getByText('88%')).toBeInTheDocument();
    });

    it('shows best performing algorithm', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      expect(screen.getByText('Best Performance:')).toBeInTheDocument();
      expect(screen.getByText('bayesian (91%)')).toBeInTheDocument();
    });

    it('shows most confident algorithm', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      expect(screen.getByText('Highest Confidence:')).toBeInTheDocument();
      expect(screen.getByText('ensemble (92%)')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty algorithms array', () => {
      const emptyAlgorithmsData = {
        ...mockConfidenceMetrics,
        algorithms: []
      };
      
      render(<ConfidenceDashboard confidence={emptyAlgorithmsData} />);
      
      expect(screen.getByText('Algorithm Contributions')).toBeInTheDocument();
      expect(screen.getByText('No algorithm data available')).toBeInTheDocument();
    });

    it('handles missing consensus data', () => {
      const noConsensusData = {
        ...mockConfidenceMetrics,
        consensus: undefined
      };
      
      render(<ConfidenceDashboard confidence={noConsensusData} />);
      
      expect(screen.getByText('88%')).toBeInTheDocument(); // Overall confidence should still show
    });

    it('handles zero confidence values', () => {
      const zeroConfidenceData = {
        ...mockConfidenceMetrics,
        overall: 0,
        perChannel: {
          google: 0,
          meta: 0,
          tiktok: 0,
          linkedin: 0
        }
      };
      
      render(<ConfidenceDashboard confidence={zeroConfidenceData} />);
      
      expect(screen.getAllByText('0%')).toHaveLength(5); // Overall + 4 channels
    });

    it('handles missing algorithm details', () => {
      const noDetailsData = {
        ...mockConfidenceMetrics,
        algorithms: [
          {
            name: 'simple',
            allocation: { google: 0.5, meta: 0.3, tiktok: 0.15, linkedin: 0.05 },
            confidence: 0.8,
            performance: 0.75
            // No details property
          }
        ]
      };
      
      render(<ConfidenceDashboard confidence={noDetailsData} />);
      
      const algorithmButton = screen.getByText('simple').closest('button');
      fireEvent.click(algorithmButton!);
      
      // Should handle missing details gracefully
      expect(screen.getByText('simple')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('supports keyboard navigation', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      const toggleButton = screen.getByText('Show Details');
      
      toggleButton.focus();
      expect(toggleButton).toHaveFocus();
      
      fireEvent.keyDown(toggleButton, { key: 'Enter' });
      expect(screen.getByText('Hide Details')).toBeInTheDocument();
    });

    it('has proper focus management for algorithm buttons', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      const algorithmButtons = screen.getAllByText(/ensemble|bayesian|gradient/).map(
        text => text.closest('button')
      ).filter(Boolean);
      
      algorithmButtons.forEach(button => {
        if (button) {
          button.focus();
          expect(button).toHaveFocus();
        }
      });
    });

    it('provides proper progress bar labels', () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(progressBar => {
        expect(progressBar).toHaveAttribute('aria-valuenow');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      });
    });
  });

  describe('Performance', () => {
    it('renders efficiently with many algorithms', () => {
      const manyAlgorithmsData = {
        ...mockConfidenceMetrics,
        algorithms: Array.from({ length: 20 }, (_, i) => ({
          name: `algorithm-${i}`,
          allocation: { google: 0.25, meta: 0.25, tiktok: 0.25, linkedin: 0.25 },
          confidence: Math.random(),
          performance: Math.random()
        }))
      };
      
      const startTime = performance.now();
      render(<ConfidenceDashboard confidence={manyAlgorithmsData} />);
      const endTime = performance.now();
      
      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('handles rapid state changes efficiently', async () => {
      render(<ConfidenceDashboard confidence={mockConfidenceMetrics} />);
      
      const toggleButton = screen.getByText('Show Details');
      
      // Rapid toggle clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          expect(toggleButton).toBeInTheDocument();
        });
      }
    });
  });
});