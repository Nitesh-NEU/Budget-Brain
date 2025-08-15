import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { 
  VisualizationProvider, 
  useVisualization, 
  usePipeline, 
  useVisualizationState
} from '../visualizationContext';
import { OptimizationPipeline, PipelineStageStatus, PipelineStatus } from '../../types/pipeline';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock pipeline data
const mockPipeline: OptimizationPipeline = {
  id: 'test-pipeline-1',
  status: PipelineStatus.RUNNING,
  startTime: Date.now(),
  estimatedTotalDuration: 20000,
  stages: {
    dataFetch: {
      id: 'dataFetch',
      name: 'Data Fetching',
      status: PipelineStageStatus.COMPLETED,
      startTime: Date.now() - 5000,
      endTime: Date.now() - 3000,
      duration: 2000,
      progress: 100
    },
    validation: {
      id: 'validation',
      name: 'Data Validation',
      status: PipelineStageStatus.RUNNING,
      startTime: Date.now() - 3000,
      progress: 60
    },
    ensembleOptimization: {
      id: 'ensembleOptimization',
      name: 'Ensemble Optimization',
      status: PipelineStageStatus.PENDING
    },
    bayesianOptimization: {
      id: 'bayesianOptimization',
      name: 'Bayesian Optimization',
      status: PipelineStageStatus.PENDING
    },
    gradientOptimization: {
      id: 'gradientOptimization',
      name: 'Gradient Optimization',
      status: PipelineStageStatus.PENDING
    },
    confidenceScoring: {
      id: 'confidenceScoring',
      name: 'Confidence Scoring',
      status: PipelineStageStatus.PENDING
    },
    benchmarkValidation: {
      id: 'benchmarkValidation',
      name: 'Benchmark Validation',
      status: PipelineStageStatus.PENDING
    },
    llmValidation: {
      id: 'llmValidation',
      name: 'LLM Validation',
      status: PipelineStageStatus.PENDING
    },
    finalSelection: {
      id: 'finalSelection',
      name: 'Final Selection',
      status: PipelineStageStatus.PENDING
    }
  },
  currentStage: 'validation',
  completedStages: ['dataFetch'],
  failedStages: []
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; initialPipeline?: OptimizationPipeline }> = ({ 
  children, 
  initialPipeline 
}) => (
  <VisualizationProvider initialPipeline={initialPipeline}>
    {children}
  </VisualizationProvider>
);

describe('VisualizationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('useVisualization', () => {
    it('should provide initial state', () => {
      const { result } = renderHook(() => useVisualization(), {
        wrapper: TestWrapper
      });

      expect(result.current.state.pipeline).toBeUndefined();
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.error).toBeUndefined();
      expect(result.current.state.visualizationState.expandedPanels).toEqual(new Set());
      expect(result.current.state.visualizationState.comparisonMode).toBe(false);
    });

    it('should update pipeline state', () => {
      const { result } = renderHook(() => useVisualization(), {
        wrapper: TestWrapper
      });

      act(() => {
        result.current.actions.setPipeline(mockPipeline);
      });

      expect(result.current.state.pipeline).toEqual(mockPipeline);
      expect(result.current.state.isLoading).toBe(false);
    });

    it('should handle loading state', () => {
      const { result } = renderHook(() => useVisualization(), {
        wrapper: TestWrapper
      });

      act(() => {
        result.current.actions.setLoading(true);
      });

      expect(result.current.state.isLoading).toBe(true);

      act(() => {
        result.current.actions.setLoading(false);
      });

      expect(result.current.state.isLoading).toBe(false);
    });
  });

  describe('usePipeline', () => {
    it('should provide pipeline-specific functionality', () => {
      const { result } = renderHook(() => usePipeline(), {
        wrapper: TestWrapper
      });

      expect(result.current.pipeline).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(typeof result.current.setPipeline).toBe('function');
      expect(typeof result.current.updateStage).toBe('function');
    });
  });

  describe('useVisualizationState', () => {
    it('should manage visualization state', () => {
      const { result } = renderHook(() => useVisualizationState(), {
        wrapper: TestWrapper
      });

      expect(result.current.selectedStage).toBeUndefined();
      expect(result.current.expandedPanels.size).toBe(0);
      expect(result.current.comparisonMode).toBe(false);

      act(() => {
        result.current.setSelectedStage('validation');
      });

      expect(result.current.selectedStage).toBe('validation');
    });

    it('should toggle panels', () => {
      const { result } = renderHook(() => useVisualizationState(), {
        wrapper: TestWrapper
      });

      act(() => {
        result.current.togglePanel('test-panel');
      });

      expect(result.current.expandedPanels.has('test-panel')).toBe(true);

      act(() => {
        result.current.togglePanel('test-panel');
      });

      expect(result.current.expandedPanels.has('test-panel')).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useVisualization());
      }).toThrow('useVisualization must be used within a VisualizationProvider');

      consoleSpy.mockRestore();
    });
  });
});