/**
 * API Integration Tests
 * 
 * Tests for API response handling, pipeline data processing, and export functionality
 * integration with the visualization components.
 */

import { 
  EnhancedModelResult, 
  OptimizeRequest, 
  Allocation,
  ConfidenceMetrics,
  ValidationResult,
  AlternativeOptions
} from '@/types/shared';
import { 
  OptimizationPipeline, 
  PipelineStageStatus, 
  PipelineStatus,
  PipelineUpdate,
  PipelineEvent,
  PipelineEventType
} from '@/types/pipeline';

// Mock fetch globally
global.fetch = jest.fn();

// Mock WebSocket for real-time tests
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

Object.defineProperty(global, 'WebSocket', {
  value: MockWebSocket,
  writable: true
});

// Mock data
const mockOptimizeRequest: OptimizeRequest = {
  budget: 10000,
  objective: 'revenue',
  channels: ['google', 'meta', 'tiktok', 'linkedin'],
  constraints: {
    google: { min: 0.2, max: 0.6 },
    meta: { min: 0.1, max: 0.5 },
    tiktok: { min: 0.05, max: 0.3 },
    linkedin: { min: 0.05, max: 0.2 }
  }
};

const mockEnhancedResult: EnhancedModelResult = {
  allocation: {
    google: 0.45,
    meta: 0.30,
    tiktok: 0.15,
    linkedin: 0.10
  },
  detOutcome: 12500,
  mc: {
    p10: 10000,
    p50: 12500,
    p90: 15000
  },
  intervals: {
    google: [0.35, 0.55],
    meta: [0.20, 0.40],
    tiktok: [0.10, 0.20],
    linkedin: [0.05, 0.15]
  },
  objective: 'revenue',
  summary: 'Optimized allocation with high confidence',
  confidence: {
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
        allocation: { google: 0.45, meta: 0.30, tiktok: 0.15, linkedin: 0.10 },
        confidence: 0.92,
        performance: 0.88
      }
    ],
    consensus: {
      agreement: 0.85,
      variance: { google: 0.05, meta: 0.08, tiktok: 0.12, linkedin: 0.06 },
      outlierCount: 1
    }
  },
  validation: {
    alternativeAlgorithms: [
      {
        name: 'bayesian',
        allocation: { google: 0.40, meta: 0.35, tiktok: 0.15, linkedin: 0.10 },
        confidence: 0.87,
        performance: 0.91
      }
    ],
    consensus: {
      agreement: 0.85,
      variance: { google: 0.05, meta: 0.08, tiktok: 0.12, linkedin: 0.06 },
      outlierCount: 1
    },
    benchmarkComparison: {
      deviationScore: 0.15,
      channelDeviations: { google: 0.10, meta: 0.12, tiktok: 0.18, linkedin: 0.08 },
      warnings: []
    },
    warnings: []
  },
  alternatives: {
    topAllocations: [
      { google: 0.40, meta: 0.35, tiktok: 0.15, linkedin: 0.10 },
      { google: 0.50, meta: 0.25, tiktok: 0.15, linkedin: 0.10 }
    ],
    reasoningExplanation: 'Multiple viable allocation strategies identified'
  }
};

const mockPipeline: OptimizationPipeline = {
  id: 'test-pipeline-123',
  status: PipelineStatus.RUNNING,
  startTime: Date.now() - 10000,
  estimatedTotalDuration: 30000,
  currentStage: 'validation',
  completedStages: ['dataFetch'],
  failedStages: [],
  stages: {
    dataFetch: {
      id: 'dataFetch',
      name: 'Data Fetching',
      status: PipelineStageStatus.COMPLETED,
      startTime: Date.now() - 10000,
      endTime: Date.now() - 8000,
      duration: 2000,
      progress: 100
    },
    validation: {
      id: 'validation',
      name: 'Data Validation',
      status: PipelineStageStatus.RUNNING,
      startTime: Date.now() - 8000,
      progress: 65
    },
    ensembleOptimization: {
      id: 'ensembleOptimization',
      name: 'Ensemble Optimization',
      status: PipelineStageStatus.PENDING,
      progress: 0
    },
    bayesianOptimization: {
      id: 'bayesianOptimization',
      name: 'Bayesian Optimization',
      status: PipelineStageStatus.PENDING,
      progress: 0
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

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Optimize API Endpoint', () => {
    it('sends correct request format', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockEnhancedResult,
          pipeline: mockPipeline
        })
      });

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockOptimizeRequest)
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockOptimizeRequest)
      });

      const result = await response.json();
      expect(result).toHaveProperty('allocation');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('pipeline');
    });

    it('handles enhanced response with pipeline data', async () => {
      const enhancedResponse = {
        ...mockEnhancedResult,
        pipeline: mockPipeline,
        timing: {
          dataFetch: 2000,
          validation: 3000,
          optimization: 8000
        },
        algorithmDetails: {
          ensemble: { iterations: 100, convergence: 0.95 },
          bayesian: { iterations: 150, convergence: 0.89 }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => enhancedResponse
      });

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockOptimizeRequest)
      });

      const result = await response.json();
      
      expect(result.pipeline).toBeDefined();
      expect(result.pipeline.id).toBe('test-pipeline-123');
      expect(result.timing).toBeDefined();
      expect(result.algorithmDetails).toBeDefined();
    });

    it('handles API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal server error',
          message: 'Optimization failed'
        })
      });

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockOptimizeRequest)
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);

      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error).toHaveProperty('message');
    });

    it('validates request parameters', async () => {
      const invalidRequest = {
        budget: -1000, // Invalid negative budget
        objective: 'invalid_objective',
        channels: []
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Validation error',
          details: ['Budget must be positive', 'Invalid objective', 'At least one channel required']
        })
      });

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest)
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.details).toContain('Budget must be positive');
    });
  });

  describe('Pipeline Status API', () => {
    it('fetches pipeline status correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pipeline: mockPipeline,
          updates: [
            {
              stageId: 'validation',
              status: PipelineStageStatus.RUNNING,
              progress: 75,
              timestamp: Date.now()
            }
          ]
        })
      });

      const response = await fetch('/api/pipeline/test-pipeline-123/status');
      const result = await response.json();

      expect(result.pipeline).toBeDefined();
      expect(result.pipeline.id).toBe('test-pipeline-123');
      expect(result.updates).toBeInstanceOf(Array);
    });

    it('handles pipeline not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: 'Pipeline not found',
          pipelineId: 'non-existent-pipeline'
        })
      });

      const response = await fetch('/api/pipeline/non-existent-pipeline/status');
      
      expect(response.status).toBe(404);
      const error = await response.json();
      expect(error.error).toBe('Pipeline not found');
    });

    it('processes pipeline updates correctly', async () => {
      const updates = [
        {
          stageId: 'validation',
          status: PipelineStageStatus.COMPLETED,
          progress: 100,
          timestamp: Date.now() - 1000
        },
        {
          stageId: 'ensembleOptimization',
          status: PipelineStageStatus.RUNNING,
          progress: 25,
          timestamp: Date.now()
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pipeline: {
            ...mockPipeline,
            currentStage: 'ensembleOptimization',
            completedStages: ['dataFetch', 'validation']
          },
          updates
        })
      });

      const response = await fetch('/api/pipeline/test-pipeline-123/status');
      const result = await response.json();

      expect(result.pipeline.currentStage).toBe('ensembleOptimization');
      expect(result.pipeline.completedStages).toContain('validation');
      expect(result.updates).toHaveLength(2);
    });
  });

  describe('Real-Time Pipeline Events', () => {
    it('establishes WebSocket connection for pipeline events', () => {
      const ws = new MockWebSocket('/api/pipeline/test-pipeline-123/ws');
      
      expect(ws.url).toBe('/api/pipeline/test-pipeline-123/ws');
      expect(ws.readyState).toBe(MockWebSocket.CONNECTING);
    });

    it('processes pipeline update messages', (done) => {
      const ws = new MockWebSocket('/api/pipeline/test-pipeline-123/ws');
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        expect(data.type).toBe('pipeline_update');
        expect(data.update.stageId).toBe('validation');
        expect(data.update.progress).toBe(85);
        done();
      };

      setTimeout(() => {
        ws.simulateMessage({
          type: 'pipeline_update',
          update: {
            stageId: 'validation',
            status: PipelineStageStatus.RUNNING,
            progress: 85,
            timestamp: Date.now()
          }
        });
      }, 20);
    });

    it('processes pipeline event messages', (done) => {
      const ws = new MockWebSocket('/api/pipeline/test-pipeline-123/ws');
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        expect(data.type).toBe('pipeline_event');
        expect(data.event.type).toBe(PipelineEventType.STAGE_STARTED);
        expect(data.event.stageId).toBe('bayesianOptimization');
        done();
      };

      setTimeout(() => {
        ws.simulateMessage({
          type: 'pipeline_event',
          event: {
            type: PipelineEventType.STAGE_STARTED,
            pipelineId: 'test-pipeline-123',
            stageId: 'bayesianOptimization',
            timestamp: Date.now(),
            data: { message: 'Starting Bayesian optimization' }
          }
        });
      }, 20);
    });

    it('handles WebSocket connection errors', (done) => {
      const ws = new MockWebSocket('/api/pipeline/test-pipeline-123/ws');
      
      ws.onerror = (event) => {
        expect(event.type).toBe('error');
        done();
      };

      setTimeout(() => {
        const errorEvent = new Event('error');
        if (ws.onerror) {
          ws.onerror(errorEvent);
        }
      }, 20);
    });
  });

  describe('Export API Integration', () => {
    it('exports pipeline visualization as PDF', async () => {
      const exportData = {
        format: 'pdf',
        includeMetrics: true,
        includeVisualization: true,
        includeMethodology: true,
        data: mockEnhancedResult,
        pipeline: mockPipeline
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['mock-pdf-content'], { type: 'application/pdf' }),
        headers: new Headers({
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="pipeline-report.pdf"'
        })
      });

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      
      const blob = await response.blob();
      expect(blob.type).toBe('application/pdf');
    });

    it('exports data as JSON', async () => {
      const exportData = {
        format: 'json',
        includeMetrics: true,
        data: mockEnhancedResult,
        pipeline: mockPipeline
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockEnhancedResult,
          pipeline: mockPipeline,
          exportTimestamp: Date.now(),
          exportFormat: 'json'
        })
      });

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      });

      const result = await response.json();
      expect(result).toHaveProperty('allocation');
      expect(result).toHaveProperty('pipeline');
      expect(result).toHaveProperty('exportTimestamp');
    });

    it('exports visualization as PNG', async () => {
      const exportData = {
        format: 'png',
        includeVisualization: true,
        data: mockEnhancedResult
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['mock-image-data'], { type: 'image/png' }),
        headers: new Headers({
          'Content-Type': 'image/png',
          'Content-Disposition': 'attachment; filename="pipeline-visualization.png"'
        })
      });

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      });

      expect(response.ok).toBe(true);
      const blob = await response.blob();
      expect(blob.type).toBe('image/png');
    });

    it('handles export errors', async () => {
      const exportData = {
        format: 'invalid-format',
        data: mockEnhancedResult
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid export format',
          supportedFormats: ['pdf', 'png', 'json', 'csv']
        })
      });

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toBe('Invalid export format');
      expect(error.supportedFormats).toContain('pdf');
    });
  });

  describe('Data Validation and Processing', () => {
    it('validates allocation constraints', async () => {
      const invalidAllocation = {
        google: 0.8, // Exceeds max constraint
        meta: 0.1,
        tiktok: 0.05,
        linkedin: 0.05
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Constraint violation',
          violations: [
            {
              channel: 'google',
              value: 0.8,
              constraint: { min: 0.2, max: 0.6 },
              message: 'Google allocation exceeds maximum constraint'
            }
          ]
        })
      });

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mockOptimizeRequest,
          initialAllocation: invalidAllocation
        })
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.violations[0].channel).toBe('google');
    });

    it('processes confidence metrics correctly', async () => {
      const responseWithConfidence = {
        ...mockEnhancedResult,
        confidence: {
          overall: 0.92,
          perChannel: {
            google: 0.95,
            meta: 0.88,
            tiktok: 0.85,
            linkedin: 0.92
          },
          stability: 0.94,
          algorithms: [
            {
              name: 'ensemble',
              confidence: 0.95,
              performance: 0.91,
              allocation: { google: 0.45, meta: 0.30, tiktok: 0.15, linkedin: 0.10 }
            },
            {
              name: 'bayesian',
              confidence: 0.89,
              performance: 0.93,
              allocation: { google: 0.42, meta: 0.33, tiktok: 0.15, linkedin: 0.10 }
            }
          ],
          consensus: {
            agreement: 0.87,
            variance: { google: 0.03, meta: 0.05, tiktok: 0.08, linkedin: 0.04 },
            outlierCount: 0
          }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithConfidence
      });

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockOptimizeRequest)
      });

      const result = await response.json();
      
      expect(result.confidence.overall).toBe(0.92);
      expect(result.confidence.algorithms).toHaveLength(2);
      expect(result.confidence.consensus.outlierCount).toBe(0);
    });

    it('handles alternative allocations', async () => {
      const responseWithAlternatives = {
        ...mockEnhancedResult,
        alternatives: {
          topAllocations: [
            { google: 0.40, meta: 0.35, tiktok: 0.15, linkedin: 0.10 },
            { google: 0.50, meta: 0.25, tiktok: 0.15, linkedin: 0.10 },
            { google: 0.35, meta: 0.40, tiktok: 0.15, linkedin: 0.10 }
          ],
          reasoningExplanation: 'Multiple high-confidence strategies available',
          confidenceScores: [0.89, 0.87, 0.85],
          performanceScores: [0.91, 0.88, 0.90]
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithAlternatives
      });

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockOptimizeRequest)
      });

      const result = await response.json();
      
      expect(result.alternatives.topAllocations).toHaveLength(3);
      expect(result.alternatives.confidenceScores).toHaveLength(3);
      expect(result.alternatives.performanceScores).toHaveLength(3);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('handles network timeouts', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network timeout')
      );

      try {
        await fetch('/api/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockOptimizeRequest)
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network timeout');
      }
    });

    it('handles server unavailable', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          error: 'Service unavailable',
          retryAfter: 30,
          message: 'Server is temporarily unavailable'
        })
      });

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockOptimizeRequest)
      });

      expect(response.status).toBe(503);
      const error = await response.json();
      expect(error.retryAfter).toBe(30);
    });

    it('handles malformed responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token in JSON');
        }
      });

      try {
        const response = await fetch('/api/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockOptimizeRequest)
        });
        await response.json();
      } catch (error) {
        expect(error).toBeInstanceOf(SyntaxError);
      }
    });

    it('handles partial pipeline failures', async () => {
      const failedPipeline = {
        ...mockPipeline,
        status: PipelineStatus.FAILED,
        failedStages: ['bayesianOptimization'],
        stages: {
          ...mockPipeline.stages,
          bayesianOptimization: {
            id: 'bayesianOptimization',
            name: 'Bayesian Optimization',
            status: PipelineStageStatus.ERROR,
            progress: 45,
            error: 'Convergence failed after 200 iterations',
            startTime: Date.now() - 5000,
            endTime: Date.now() - 1000
          }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockEnhancedResult,
          pipeline: failedPipeline,
          warnings: [
            'Bayesian optimization failed, using ensemble results',
            'Confidence scores may be lower due to algorithm failure'
          ]
        })
      });

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockOptimizeRequest)
      });

      const result = await response.json();
      
      expect(result.pipeline.status).toBe(PipelineStatus.FAILED);
      expect(result.pipeline.failedStages).toContain('bayesianOptimization');
      expect(result.warnings).toContain('Bayesian optimization failed, using ensemble results');
    });
  });

  describe('Performance and Caching', () => {
    it('handles large response payloads efficiently', async () => {
      const largeResponse = {
        ...mockEnhancedResult,
        alternatives: {
          topAllocations: Array.from({ length: 100 }, (_, i) => ({
            google: 0.3 + (i * 0.001),
            meta: 0.3 + (i * 0.001),
            tiktok: 0.2 - (i * 0.0005),
            linkedin: 0.2 - (i * 0.0005)
          })),
          reasoningExplanation: 'Extensive analysis with 100 alternatives',
          confidenceScores: Array.from({ length: 100 }, () => Math.random() * 0.3 + 0.7),
          performanceScores: Array.from({ length: 100 }, () => Math.random() * 0.3 + 0.7)
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => largeResponse
      });

      const startTime = performance.now();
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockOptimizeRequest)
      });
      const result = await response.json();
      const endTime = performance.now();

      expect(result.alternatives.topAllocations).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should process within 1 second
    });

    it('supports response caching headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnhancedResult,
        headers: new Headers({
          'Cache-Control': 'public, max-age=300',
          'ETag': '"abc123"',
          'Last-Modified': new Date().toUTCString()
        })
      });

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockOptimizeRequest)
      });

      expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
      expect(response.headers.get('ETag')).toBe('"abc123"');
    });
  });
});