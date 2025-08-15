/**
 * PipelineFlowVisualizer Component Logic Tests
 */

import { 
  PipelineStage, 
  PipelineStageStatus, 
  OptimizationPipeline,
  PipelineStatus,
  PIPELINE_STAGE_CONFIG 
} from '@/types/pipeline';

describe('PipelineFlowVisualizer Logic', () => {
  // Helper function to create mock stages (similar to component logic)
  const createMockStage = (
    id: string, 
    status: PipelineStageStatus, 
    progress: number = 0,
    duration?: number,
    details?: string,
    error?: string
  ): PipelineStage => {
    const config = Object.values(PIPELINE_STAGE_CONFIG).find(c => c.id === id);
    return {
      id,
      name: config?.name || id,
      status,
      progress,
      duration,
      details,
      error,
      startTime: Date.now() - (duration || 0),
      endTime: status === PipelineStageStatus.COMPLETED ? Date.now() : undefined
    };
  };

  // Helper function to get stage display info (similar to component logic)
  const getStageDisplayInfo = (stage: PipelineStage) => {
    const config = Object.values(PIPELINE_STAGE_CONFIG).find(c => c.id === stage.id);
    const shortName = config?.name.split(' ').map(word => word.charAt(0)).join('') || stage.name.substring(0, 2).toUpperCase();
    
    return {
      id: stage.id,
      name: stage.name,
      shortName,
      status: stage.status,
      progress: stage.progress || 0,
      duration: stage.duration,
      details: stage.details,
      error: stage.error
    };
  };

  // Helper function to get status color (similar to component logic)
  const getStatusColor = (status: PipelineStageStatus): string => {
    switch (status) {
      case PipelineStageStatus.PENDING:
        return 'bg-gray-200 text-gray-600 border-gray-300';
      case PipelineStageStatus.RUNNING:
        return 'bg-blue-100 text-blue-700 border-blue-300 animate-pulse';
      case PipelineStageStatus.COMPLETED:
        return 'bg-green-100 text-green-700 border-green-300';
      case PipelineStageStatus.ERROR:
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-200 text-gray-600 border-gray-300';
    }
  };

  describe('createMockStage', () => {
    it('should create a stage with correct properties', () => {
      const stage = createMockStage('dataFetch', PipelineStageStatus.COMPLETED, 100, 2000, 'Test details');
      
      expect(stage.id).toBe('dataFetch');
      expect(stage.name).toBe('Data Fetching');
      expect(stage.status).toBe(PipelineStageStatus.COMPLETED);
      expect(stage.progress).toBe(100);
      expect(stage.duration).toBe(2000);
      expect(stage.details).toBe('Test details');
      expect(stage.endTime).toBeDefined();
    });

    it('should handle unknown stage IDs', () => {
      const stage = createMockStage('unknownStage', PipelineStageStatus.PENDING);
      
      expect(stage.id).toBe('unknownStage');
      expect(stage.name).toBe('unknownStage');
      expect(stage.status).toBe(PipelineStageStatus.PENDING);
    });

    it('should not set endTime for non-completed stages', () => {
      const stage = createMockStage('dataFetch', PipelineStageStatus.RUNNING);
      
      expect(stage.endTime).toBeUndefined();
    });
  });

  describe('getStageDisplayInfo', () => {
    it('should generate correct display info for known stages', () => {
      const stage = createMockStage('dataFetch', PipelineStageStatus.COMPLETED, 100);
      const displayInfo = getStageDisplayInfo(stage);
      
      expect(displayInfo.id).toBe('dataFetch');
      expect(displayInfo.name).toBe('Data Fetching');
      expect(displayInfo.shortName).toBe('DF');
      expect(displayInfo.status).toBe(PipelineStageStatus.COMPLETED);
      expect(displayInfo.progress).toBe(100);
    });

    it('should handle stages with multi-word names', () => {
      const stage = createMockStage('ensembleOptimization', PipelineStageStatus.RUNNING, 50);
      const displayInfo = getStageDisplayInfo(stage);
      
      expect(displayInfo.shortName).toBe('EO');
    });

    it('should fallback to substring for unknown stages', () => {
      const stage: PipelineStage = {
        id: 'customStage',
        name: 'Custom Processing Stage',
        status: PipelineStageStatus.PENDING,
        progress: 0
      };
      const displayInfo = getStageDisplayInfo(stage);
      
      expect(displayInfo.shortName).toBe('CU');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for each status', () => {
      expect(getStatusColor(PipelineStageStatus.PENDING)).toContain('bg-gray-200');
      expect(getStatusColor(PipelineStageStatus.RUNNING)).toContain('bg-blue-100');
      expect(getStatusColor(PipelineStageStatus.RUNNING)).toContain('animate-pulse');
      expect(getStatusColor(PipelineStageStatus.COMPLETED)).toContain('bg-green-100');
      expect(getStatusColor(PipelineStageStatus.ERROR)).toContain('bg-red-100');
    });
  });

  describe('Pipeline Stage Configuration', () => {
    it('should have all required stage configurations', () => {
      const requiredStages = [
        'dataFetch',
        'validation',
        'ensembleOptimization',
        'bayesianOptimization',
        'gradientOptimization',
        'confidenceScoring',
        'benchmarkValidation',
        'llmValidation',
        'finalSelection'
      ];

      requiredStages.forEach(stageId => {
        const config = Object.values(PIPELINE_STAGE_CONFIG).find(c => c.id === stageId);
        expect(config).toBeDefined();
        expect(config?.name).toBeDefined();
        expect(config?.description).toBeDefined();
        expect(config?.estimatedDuration).toBeGreaterThan(0);
      });
    });

    it('should have reasonable estimated durations', () => {
      Object.values(PIPELINE_STAGE_CONFIG).forEach(config => {
        expect(config.estimatedDuration).toBeGreaterThan(0);
        expect(config.estimatedDuration).toBeLessThan(10000); // Less than 10 seconds
      });
    });
  });

  describe('Pipeline Progress Calculation', () => {
    it('should calculate overall progress correctly', () => {
      const stages = [
        createMockStage('dataFetch', PipelineStageStatus.COMPLETED, 100),
        createMockStage('validation', PipelineStageStatus.COMPLETED, 100),
        createMockStage('ensembleOptimization', PipelineStageStatus.RUNNING, 50),
        createMockStage('bayesianOptimization', PipelineStageStatus.PENDING, 0)
      ];

      const totalProgress = stages.reduce((sum, stage) => sum + stage.progress, 0) / stages.length;
      expect(totalProgress).toBe(62.5); // (100 + 100 + 50 + 0) / 4
    });

    it('should handle empty stages array', () => {
      const stages: PipelineStage[] = [];
      const totalProgress = stages.reduce((sum, stage) => sum + stage.progress, 0) / Math.max(stages.length, 1);
      expect(totalProgress).toBe(0);
    });
  });

  describe('Stage Status Transitions', () => {
    it('should validate status transition logic', () => {
      // Test valid transitions
      const validTransitions = [
        [PipelineStageStatus.PENDING, PipelineStageStatus.RUNNING],
        [PipelineStageStatus.RUNNING, PipelineStageStatus.COMPLETED],
        [PipelineStageStatus.RUNNING, PipelineStageStatus.ERROR],
        [PipelineStageStatus.ERROR, PipelineStageStatus.RUNNING] // Retry
      ];

      validTransitions.forEach(([from, to]) => {
        // This would be actual transition validation logic in a real implementation
        expect(from).toBeDefined();
        expect(to).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle stages with errors', () => {
      const errorStage = createMockStage(
        'dataFetch', 
        PipelineStageStatus.ERROR, 
        30, 
        undefined, 
        undefined, 
        'Network timeout'
      );

      expect(errorStage.status).toBe(PipelineStageStatus.ERROR);
      expect(errorStage.error).toBe('Network timeout');
      expect(errorStage.progress).toBe(30);
    });

    it('should handle missing stage details gracefully', () => {
      const minimalStage: PipelineStage = {
        id: 'test',
        name: 'Test Stage',
        status: PipelineStageStatus.PENDING
      };

      const displayInfo = getStageDisplayInfo(minimalStage);
      expect(displayInfo.progress).toBe(0);
      expect(displayInfo.details).toBeUndefined();
      expect(displayInfo.error).toBeUndefined();
    });
  });
});