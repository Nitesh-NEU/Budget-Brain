/**
 * Visualization Integration Tests
 * 
 * End-to-end integration tests for the complete visualization system,
 * testing component interactions, state management, and data flow.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { PipelineFlowVisualizer } from '../../components/PipelineFlowVisualizer';
import { ConfidenceDashboard } from '../../components/ConfidenceDashboard';
import { DataQualityPanel } from '../../components/DataQualityPanel';
import { AlternativeOptionsExplorer } from '../../components/AlternativeOptionsExplorer';
import { RealTimePipelineStatus } from '../../components/RealTimePipelineStatus';
import { ExportSystem } from '../../components/ExportSystem';
import { VisualizationProvider, useVisualization } from '../visualizationContext';
import { 
  OptimizationPipeline, 
  PipelineStageStatus, 
  PipelineStatus,
  PipelineUpdate,
  PipelineEvent,
  PipelineEventType
} from '@/types/pipeline';
import { EnhancedModelResult } from '@/types/shared';

// Mock WebSocket and fetch
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  send(data: string) {}

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

let mockWebSocketInstance: MockWebSocket;

Object.defineProperty(global, 'WebSocket', {
  value: jest.fn().mockImplementation((url: string) => {
    mockWebSocketInstance = new MockWebSocket(url);
    return mockWebSocketInstance;
  }),
  writable: true
});

global.fetch = jest.fn();

// Mock URL.createObjectURL for export tests
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn(),
  },
  writable: true,
});

// Mock complete data set
const mockPipeline: OptimizationPipeline = {
  id: 'integration-test-pipeline',
  status: PipelineStatus.RUNNING,
  startTime: Date.now() - 15000,
  estimatedTotalDuration: 45000,
  currentStage: 'bayesianOptimization',
  completedStages: ['dataFetch', 'validation', 'ensembleOptimization'],
  failedStages: [],
  stages: {
    dataFetch: {
      id: 'dataFetch',
      name: 'Data Fetching',
      status: PipelineStageStatus.COMPLETED,
      startTime: Date.now() - 15000,
      endTime: Date.now() - 12000,
      duration: 3000,
      progress: 100
    },
    validation: {
      id: 'validation',
      name: 'Data Validation',
      status: PipelineStageStatus.COMPLETED,
      startTime: Date.now() - 12000,
      endTime: Date.now() - 9000,
      duration: 3000,
      progress: 100
    },
    ensembleOptimization: {
      id: 'ensembleOptimization',
      name: 'Ensemble Optimization',
      status: PipelineStageStatus.COMPLETED,
      startTime: Date.now() - 9000,
      endTime: Date.now() - 6000,
      duration: 3000,
      progress: 100
    },
    bayesianOptimization: {
      id: 'bayesianOptimization',
      name: 'Bayesian Optimization',
      status: PipelineStageStatus.RUNNING,
      startTime: Date.now() - 6000,
      progress: 75,
      details: 'Iteration 120/150'
    },
    gradientOptimization: {
      id: 'gradientOptimization',
      name: 'Gradient Optimization',
      status: PipelineStageStatus.PENDING,
      progress: 0
    },
    confidenceScoring: {
      id: 'confidenceScoring',
      name: 'Confidence Scoring',
      status: PipelineStageStatus.PENDING,
      progress: 0
    },
    benchmarkValidation: {
      id: 'benchmarkValidation',
      name: 'Benchmark Validation',
      status: PipelineStageStatus.PENDING,
      progress: 0
    },
    llmValidation: {
      id: 'llmValidation',
      name: 'LLM Validation',
      status: PipelineStageStatus.PENDING,
      progress: 0
    },
    finalSelection: {
      id: 'finalSelection',
      name: 'Final Selection',
      status: PipelineStageStatus.PENDING,
      progress: 0
    }
  }
};

const mockEnhancedResult: EnhancedModelResult = {
  allocation: {
    google: 0.42,
    meta: 0.33,
    tiktok: 0.15,
    linkedin: 0.10
  },
  detOutcome: 13750,
  mc: {
    p10: 11000,
    p50: 13750,
    p90: 16500
  },
  intervals: {
    google: [0.32, 0.52],
    meta: [0.23, 0.43],
    tiktok: [0.10, 0.20],
    linkedin: [0.05, 0.15]
  },
  objective: 'revenue',
  summary: 'High-confidence multi-algorithm optimization result',
  confidence: {
    overall: 0.91,
    perChannel: {
      google: 0.94,
      meta: 0.88,
      tiktok: 0.82,
      linkedin: 0.93
    },
    stability: 0.89,
    algorithms: [
      {
        name: 'ensemble',
        allocation: { google: 0.42, meta: 0.33, tiktok: 0.15, linkedin: 0.10 },
        confidence: 0.93,
        performance: 0.89,
        details: {
          iterations: 100,
          convergence: 0.96,
          executionTime: 2800
        }
      },
      {
        name: 'bayesian',
        allocation: { google: 0.40, meta: 0.35, tiktok: 0.15, linkedin: 0.10 },
        confidence: 0.89,
        performance: 0.92,
        details: {
          iterations: 150,
          convergence: 0.91,
          executionTime: 4200
        }
      },
      {
        name: 'gradient',
        allocation: { google: 0.44, meta: 0.31, tiktok: 0.15, linkedin: 0.10 },
        confidence: 0.87,
        performance: 0.86,
        details: {
          iterations: 85,
          convergence: 0.94,
          executionTime: 2100
        }
      }
    ],
    consensus: {
      agreement: 0.88,
      variance: {
        google: 0.04,
        meta: 0.06,
        tiktok: 0.08,
        linkedin: 0.05
      },
      outlierCount: 0
    }
  },
  validation: {
    alternativeAlgorithms: [
      {
        name: 'bayesian',
        allocation: { google: 0.40, meta: 0.35, tiktok: 0.15, linkedin: 0.10 },
        confidence: 0.89,
        performance: 0.92
      },
      {
        name: 'gradient',
        allocation: { google: 0.44, meta: 0.31, tiktok: 0.15, linkedin: 0.10 },
        confidence: 0.87,
        performance: 0.86
      }
    ],
    consensus: {
      agreement: 0.88,
      variance: {
        google: 0.04,
        meta: 0.06,
        tiktok: 0.08,
        linkedin: 0.05
      },
      outlierCount: 0
    },
    benchmarkComparison: {
      deviationScore: 0.12,
      channelDeviations: {
        google: 0.08,
        meta: 0.15,
        tiktok: 0.18,
        linkedin: 0.06
      },
      warnings: [
        {
          type: 'moderate_deviation',
          message: 'TikTok allocation shows moderate deviation from benchmark',
          severity: 'medium',
          channel: 'tiktok'
        }
      ]
    },
    warnings: [
      {
        type: 'data_freshness',
        message: 'Some benchmark data is 2 days old',
        severity: 'low'
      }
    ]
  },
  alternatives: {
    topAllocations: [
      { google: 0.40, meta: 0.35, tiktok: 0.15, linkedin: 0.10 },
      { google: 0.44, meta: 0.31, tiktok: 0.15, linkedin: 0.10 },
      { google: 0.38, meta: 0.37, tiktok: 0.15, linkedin: 0.10 }
    ],
    reasoningExplanation: 'Multiple high-confidence strategies with similar performance characteristics'
  }
};

const mockDataQuality = {
  citations: [
    {
      title: 'Google Ads Performance Benchmarks 2024',
      url: 'https://example.com/google-benchmarks',
      validationStatus: 'valid' as const,
      contentQuality: 0.95,
      lastChecked: '2024-01-16T10:30:00Z',
      responseTime: 180
    },
    {
      title: 'Meta Advertising Insights Q4 2023',
      url: 'https://example.com/meta-insights',
      validationStatus: 'valid' as const,
      contentQuality: 0.88,
      lastChecked: '2024-01-16T09:45:00Z',
      responseTime: 220
    },
    {
      title: 'TikTok Business Performance Data',
      url: 'https://example.com/tiktok-data',
      validationStatus: 'warning' as const,
      contentQuality: 0.72,
      lastChecked: '2024-01-15T16:20:00Z',
      responseTime: 1200,
      issues: ['Slow response time', 'Limited data coverage']
    }
  ],
  benchmarkAnalysis: {
    deviationScore: 0.12,
    channelDeviations: {
      google: 0.08,
      meta: 0.15,
      tiktok: 0.18,
      linkedin: 0.06
    },
    warnings: [
      {
        type: 'moderate_deviation',
        message: 'TikTok allocation shows moderate deviation from benchmark',
        severity: 'medium' as const,
        channel: 'tiktok' as const
      }
    ]
  },
  warnings: [
    {
      type: 'data_freshness',
      message: 'Some benchmark data is 2 days old',
      severity: 'low' as const
    }
  ],
  sourceQuality: {
    'google-benchmarks': {
      source: 'google-benchmarks',
      reliability: 0.95,
      validationStatus: 'valid' as const,
      lastUpdated: '2024-01-16T10:30:00Z'
    },
    'meta-insights': {
      source: 'meta-insights',
      reliability: 0.88,
      validationStatus: 'valid' as const,
      lastUpdated: '2024-01-16T09:45:00Z'
    },
    'tiktok-data': {
      source: 'tiktok-data',
      reliability: 0.72,
      validationStatus: 'warning' as const,
      lastUpdated: '2024-01-15T16:20:00Z',
      issues: ['Data coverage gaps', 'Response time issues']
    }
  },
  overallScore: 0.85,
  lastValidated: '2024-01-16T14:30:00Z'
};

const mockAlternatives = [
  {
    id: 'alt-ensemble',
    allocation: { google: 0.42, meta: 0.33, tiktok: 0.15, linkedin: 0.10 },
    confidence: 0.93,
    performance: 0.89,
    reasoning: 'Ensemble method combining multiple algorithms for robust optimization',
    algorithmSource: 'ensemble',
    riskLevel: 'low' as const,
    expectedOutcome: 13750
  },
  {
    id: 'alt-bayesian',
    allocation: { google: 0.40, meta: 0.35, tiktok: 0.15, linkedin: 0.10 },
    confidence: 0.89,
    performance: 0.92,
    reasoning: 'Bayesian optimization with strong performance metrics',
    algorithmSource: 'bayesian',
    riskLevel: 'low' as const,
    expectedOutcome: 14100
  },
  {
    id: 'alt-gradient',
    allocation: { google: 0.44, meta: 0.31, tiktok: 0.15, linkedin: 0.10 },
    confidence: 0.87,
    performance: 0.86,
    reasoning: 'Gradient-based optimization favoring Google channel',
    algorithmSource: 'gradient',
    riskLevel: 'medium' as const,
    expectedOutcome: 13200
  }
];

// Complete visualization dashboard component for integration testing
const VisualizationDashboard: React.FC = () => {
  const { state, actions } = useVisualization();
  
  React.useEffect(() => {
    // Initialize with mock data
    actions.setPipeline(mockPipeline);
  }, [actions]);

  return (
    <div className="visualization-dashboard">
      <div className="pipeline-section">
        <PipelineFlowVisualizer 
          pipeline={state.pipeline}
          onStageClick={(stageId) => {
            actions.setSelectedStage(stageId);
          }}
        />
      </div>
      
      <div className="real-time-section">
        <RealTimePipelineStatus 
          pipelineId={state.pipeline?.id || 'test-pipeline'}
          enableRealTimeUpdates={true}
        />
      </div>
      
      <div className="confidence-section">
        <ConfidenceDashboard 
          confidence={mockEnhancedResult.confidence}
          onAlgorithmSelect={(algorithmId) => {
            actions.setSelectedAlgorithm(algorithmId);
          }}
        />
      </div>
      
      <div className="quality-section">
        <DataQualityPanel 
          dataQuality={mockDataQuality}
          expandable={true}
        />
      </div>
      
      <div className="alternatives-section">
        <AlternativeOptionsExplorer 
          alternatives={mockAlternatives}
          currentAllocation={mockEnhancedResult.allocation}
          onSelectAlternative={(alternative) => {
            console.log('Selected alternative:', alternative);
          }}
        />
      </div>
      
      <div className="export-section">
        <ExportSystem 
          data={mockEnhancedResult}
          pipelineStages={state.pipeline ? Object.values(state.pipeline.stages) : []}
          onExport={(options) => {
            console.log('Export requested:', options);
          }}
        />
      </div>
    </div>
  );
};

describe('Visualization Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        pipeline: mockPipeline,
        updates: []
      })
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Complete Dashboard Integration', () => {
    it('renders all visualization components together', async () => {
      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      // All major sections should be present
      expect(screen.getByText('Optimization Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Real-Time Pipeline Status')).toBeInTheDocument();
      expect(screen.getByText('Confidence Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Data Quality Panel')).toBeInTheDocument();
      expect(screen.getByText('Alternative Options Explorer')).toBeInTheDocument();
      expect(screen.getByText('Export Results')).toBeInTheDocument();
    });

    it('maintains consistent state across components', async () => {
      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      // Pipeline data should be consistent across components
      expect(screen.getByText('Bayesian Optimization')).toBeInTheDocument(); // Current stage
      expect(screen.getByText('75%')).toBeInTheDocument(); // Progress in multiple places
      expect(screen.getByText('91%')).toBeInTheDocument(); // Overall confidence
    });

    it('handles cross-component interactions', async () => {
      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      // Click on a pipeline stage
      const stageButton = screen.getByLabelText(/bayesian optimization.*running/i);
      await user.click(stageButton);

      // Should show stage details
      expect(screen.getByText('Iteration 120/150')).toBeInTheDocument();

      // Click on an algorithm in confidence dashboard
      const algorithmButton = screen.getByText('ensemble').closest('button');
      if (algorithmButton) {
        await user.click(algorithmButton);
        
        // Should show algorithm details
        expect(screen.getByText('Iterations:')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
      }
    });
  });

  describe('Real-Time Updates Integration', () => {
    it('propagates real-time updates across all components', async () => {
      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      // Simulate WebSocket connection
      act(() => {
        jest.advanceTimersByTime(20);
      });

      // Simulate pipeline update
      const updateMessage = {
        type: 'pipeline_update',
        update: {
          stageId: 'bayesianOptimization',
          status: PipelineStageStatus.COMPLETED,
          progress: 100,
          timestamp: Date.now()
        } as PipelineUpdate
      };

      act(() => {
        mockWebSocketInstance.simulateMessage(updateMessage);
      });

      await waitFor(() => {
        // Update should be reflected in pipeline visualizer
        expect(screen.getByLabelText(/bayesian optimization.*completed/i)).toBeInTheDocument();
        
        // Update should be reflected in real-time status
        expect(screen.getByText('Bayesian Optimization completed')).toBeInTheDocument();
      });
    });

    it('handles pipeline completion flow', async () => {
      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      act(() => {
        jest.advanceTimersByTime(20);
      });

      // Simulate completion of remaining stages
      const stages = ['bayesianOptimization', 'gradientOptimization', 'confidenceScoring', 'benchmarkValidation', 'llmValidation', 'finalSelection'];
      
      for (const stageId of stages) {
        const updateMessage = {
          type: 'pipeline_update',
          update: {
            stageId,
            status: PipelineStageStatus.COMPLETED,
            progress: 100,
            timestamp: Date.now()
          }
        };

        act(() => {
          mockWebSocketInstance.simulateMessage(updateMessage);
        });
      }

      // Final pipeline completion event
      const completionEvent = {
        type: 'pipeline_event',
        event: {
          type: PipelineEventType.PIPELINE_COMPLETED,
          pipelineId: 'integration-test-pipeline',
          timestamp: Date.now(),
          data: { 
            message: 'Pipeline completed successfully',
            totalDuration: 45000,
            finalResults: mockEnhancedResult
          }
        } as PipelineEvent
      };

      act(() => {
        mockWebSocketInstance.simulateMessage(completionEvent);
      });

      await waitFor(() => {
        expect(screen.getByText('Pipeline completed successfully')).toBeInTheDocument();
      });
    });

    it('handles pipeline errors gracefully', async () => {
      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      act(() => {
        jest.advanceTimersByTime(20);
      });

      // Simulate stage failure
      const errorMessage = {
        type: 'pipeline_update',
        update: {
          stageId: 'bayesianOptimization',
          status: PipelineStageStatus.ERROR,
          progress: 75,
          error: 'Optimization failed to converge after 200 iterations',
          timestamp: Date.now()
        }
      };

      act(() => {
        mockWebSocketInstance.simulateMessage(errorMessage);
      });

      await waitFor(() => {
        // Error should be displayed in pipeline visualizer
        expect(screen.getByText('Optimization failed to converge after 200 iterations')).toBeInTheDocument();
        
        // Error should be announced in real-time status
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Flow and State Management', () => {
    it('maintains data consistency during updates', async () => {
      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      // Initial state should be consistent
      expect(screen.getAllByText('75%')).toHaveLength(2); // Progress shown in multiple places
      
      // Update progress
      act(() => {
        jest.advanceTimersByTime(20);
      });

      const progressUpdate = {
        type: 'pipeline_update',
        update: {
          stageId: 'bayesianOptimization',
          status: PipelineStageStatus.RUNNING,
          progress: 85,
          timestamp: Date.now()
        }
      };

      act(() => {
        mockWebSocketInstance.simulateMessage(progressUpdate);
      });

      await waitFor(() => {
        // Updated progress should be reflected everywhere
        expect(screen.getAllByText('85%')).toHaveLength(2);
      });
    });

    it('handles concurrent updates correctly', async () => {
      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      act(() => {
        jest.advanceTimersByTime(20);
      });

      // Send multiple rapid updates
      const updates = [
        { stageId: 'bayesianOptimization', progress: 80 },
        { stageId: 'bayesianOptimization', progress: 85 },
        { stageId: 'bayesianOptimization', progress: 90 }
      ];

      updates.forEach((update, index) => {
        setTimeout(() => {
          const updateMessage = {
            type: 'pipeline_update',
            update: {
              ...update,
              status: PipelineStageStatus.RUNNING,
              timestamp: Date.now() + index
            }
          };

          act(() => {
            mockWebSocketInstance.simulateMessage(updateMessage);
          });
        }, index * 10);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        // Should show the latest update
        expect(screen.getByText('90%')).toBeInTheDocument();
      });
    });
  });

  describe('User Interaction Flows', () => {
    it('supports complete exploration workflow', async () => {
      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      // 1. Explore pipeline stages
      const completedStage = screen.getByLabelText(/data fetching.*completed/i);
      await user.click(completedStage);
      
      expect(screen.getByText('Duration:')).toBeInTheDocument();
      expect(screen.getByText('3.00 seconds')).toBeInTheDocument();

      // 2. Check confidence metrics
      const showDetailsButton = screen.getByText('Show Details');
      await user.click(showDetailsButton);
      
      expect(screen.getByText('Algorithm Contributions')).toBeInTheDocument();

      // 3. Explore algorithm details
      const ensembleButton = screen.getByText('ensemble').closest('button');
      if (ensembleButton) {
        await user.click(ensembleButton);
        expect(screen.getByText('Convergence:')).toBeInTheDocument();
      }

      // 4. Check data quality
      const qualityPanel = screen.getByText('Data Quality Panel');
      expect(qualityPanel).toBeInTheDocument();
      
      const citationButton = screen.getByText('Google Ads Performance Benchmarks 2024').closest('button');
      if (citationButton) {
        await user.click(citationButton);
        expect(screen.getByText('Response Time:')).toBeInTheDocument();
      }

      // 5. Explore alternatives
      const detailsButtons = screen.getAllByText('Details');
      if (detailsButtons.length > 0) {
        await user.click(detailsButtons[0]);
        
        await waitFor(() => {
          expect(screen.getByText('Alternative Option Details')).toBeInTheDocument();
        });
      }
    });

    it('supports export workflow', async () => {
      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      // Click export button
      const exportButton = screen.getByText('Export Results');
      await user.click(exportButton);

      // Should show export options
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Select export format
      const formatSelect = screen.getByRole('combobox', { name: /format/i });
      await user.selectOptions(formatSelect, 'pdf');

      // Configure export options
      const includeMetrics = screen.getByRole('checkbox', { name: /include metrics/i });
      await user.click(includeMetrics);

      // Execute export
      const confirmExport = screen.getByRole('button', { name: /export/i });
      await user.click(confirmExport);

      // Should trigger export
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Performance and Scalability', () => {
    it('handles large datasets efficiently', async () => {
      // Create large dataset
      const largeAlternatives = Array.from({ length: 50 }, (_, i) => ({
        id: `alt-${i}`,
        allocation: {
          google: 0.3 + (i * 0.001),
          meta: 0.3 + (i * 0.001),
          tiktok: 0.2 - (i * 0.0005),
          linkedin: 0.2 - (i * 0.0005)
        },
        confidence: 0.7 + (Math.random() * 0.3),
        performance: 0.7 + (Math.random() * 0.3),
        reasoning: `Alternative ${i} with specific optimization strategy`,
        algorithmSource: ['ensemble', 'bayesian', 'gradient'][i % 3],
        riskLevel: ['low', 'medium', 'high'][i % 3] as const,
        expectedOutcome: 10000 + (i * 100)
      }));

      const LargeDataDashboard = () => (
        <VisualizationProvider>
          <AlternativeOptionsExplorer 
            alternatives={largeAlternatives}
            currentAllocation={mockEnhancedResult.allocation}
          />
        </VisualizationProvider>
      );

      const startTime = performance.now();
      render(<LargeDataDashboard />);
      const endTime = performance.now();

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(500);
      
      // Should show pagination or virtualization
      expect(screen.getByText('Compare 50 alternative allocation strategies')).toBeInTheDocument();
    });

    it('handles rapid state updates efficiently', async () => {
      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      act(() => {
        jest.advanceTimersByTime(20);
      });

      // Send many rapid updates
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const updateMessage = {
          type: 'pipeline_update',
          update: {
            stageId: 'bayesianOptimization',
            status: PipelineStageStatus.RUNNING,
            progress: 75 + (i % 25),
            timestamp: Date.now() + i
          }
        };

        act(() => {
          mockWebSocketInstance.simulateMessage(updateMessage);
        });
      }

      const endTime = performance.now();

      // Should handle updates efficiently
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Should still be responsive
      expect(screen.getByText('Bayesian Optimization')).toBeInTheDocument();
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('recovers from WebSocket connection failures', async () => {
      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      act(() => {
        jest.advanceTimersByTime(20);
      });

      // Simulate connection error
      act(() => {
        mockWebSocketInstance.simulateError();
      });

      await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument();
      });

      // Should attempt reconnection
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should show reconnection attempt
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });

    it('handles malformed data gracefully', async () => {
      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      act(() => {
        jest.advanceTimersByTime(20);
      });

      // Send malformed update
      const malformedMessage = {
        type: 'pipeline_update',
        update: {
          stageId: 'nonexistent-stage',
          status: 'invalid-status',
          progress: 'not-a-number'
        }
      };

      act(() => {
        mockWebSocketInstance.simulateMessage(malformedMessage);
      });

      // Should not crash and should continue working
      expect(screen.getByText('Optimization Pipeline')).toBeInTheDocument();
    });

    it('maintains functionality during partial failures', async () => {
      // Mock fetch to fail for some requests
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/status')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ pipeline: mockPipeline, updates: [] })
        });
      });

      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      // Should still render other components even if real-time status fails
      expect(screen.getByText('Confidence Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Data Quality Panel')).toBeInTheDocument();
      expect(screen.getByText('Alternative Options Explorer')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains accessibility across component interactions', async () => {
      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      // Navigate through components with keyboard
      await user.tab(); // First focusable element
      
      const firstButton = document.activeElement;
      expect(firstButton).toHaveAttribute('type', 'button');
      
      // Activate with keyboard
      await user.keyboard('{Enter}');
      
      // Focus should be managed properly
      expect(document.activeElement).toBeInTheDocument();
    });

    it('provides consistent ARIA live regions', () => {
      render(
        <VisualizationProvider>
          <VisualizationDashboard />
        </VisualizationProvider>
      );

      // Should have live regions for updates
      const liveRegions = screen.getAllByRole('status');
      expect(liveRegions.length).toBeGreaterThan(0);
      
      liveRegions.forEach(region => {
        expect(region).toHaveAttribute('aria-live');
      });
    });
  });
});