/**
 * Pipeline Types and Utilities Test Suite
 */

import {
  PipelineStageStatus,
  PipelineStatus,
  PIPELINE_STAGE_CONFIG,
  OptimizationPipeline,
  PipelineStage
} from '../../types/pipeline';

import {
  createOptimizationPipeline,
  createPipelineStage,
  updatePipelineStage,
  calculatePipelineMetrics,
  getNextStage,
  validatePipeline,
  validatePipelineStage
} from '../pipelineUtils';

import { PipelineManager } from '../pipelineManager';

describe('Pipeline Types and Configuration', () => {
  test('PIPELINE_STAGE_CONFIG contains all required stages', () => {
    const expectedStages = [
      'DATA_FETCH',
      'VALIDATION', 
      'ENSEMBLE_OPTIMIZATION',
      'BAYESIAN_OPTIMIZATION',
      'GRADIENT_OPTIMIZATION',
      'CONFIDENCE_SCORING',
      'BENCHMARK_VALIDATION',
      'LLM_VALIDATION',
      'FINAL_SELECTION'
    ];

    expectedStages.forEach(stage => {
      expect(PIPELINE_STAGE_CONFIG[stage]).toBeDefined();
      expect(PIPELINE_STAGE_CONFIG[stage].id).toBeTruthy();
      expect(PIPELINE_STAGE_CONFIG[stage].name).toBeTruthy();
      expect(PIPELINE_STAGE_CONFIG[stage].estimatedDuration).toBeGreaterThan(0);
    });
  });

  test('PipelineStageStatus enum has correct values', () => {
    expect(PipelineStageStatus.PENDING).toBe('pending');
    expect(PipelineStageStatus.RUNNING).toBe('running');
    expect(PipelineStageStatus.COMPLETED).toBe('completed');
    expect(PipelineStageStatus.ERROR).toBe('error');
  });

  test('PipelineStatus enum has correct values', () => {
    expect(PipelineStatus.RUNNING).toBe('running');
    expect(PipelineStatus.COMPLETED).toBe('completed');
    expect(PipelineStatus.ERROR).toBe('error');
  });
});

describe('Pipeline Utilities', () => {
  test('createPipelineStage creates valid stage', () => {
    const stage = createPipelineStage('test', 'Test Stage', 1000);
    
    expect(stage.id).toBe('test');
    expect(stage.name).toBe('Test Stage');
    expect(stage.status).toBe(PipelineStageStatus.PENDING);
    expect(stage.progress).toBe(0);
    expect(stage.metadata?.estimatedDuration).toBe(1000);
  });

  test('createOptimizationPipeline creates complete pipeline', () => {
    const pipeline = createOptimizationPipeline('test-pipeline');
    
    expect(pipeline.id).toBe('test-pipeline');
    expect(pipeline.status).toBe(PipelineStatus.RUNNING);
    expect(pipeline.startTime).toBeDefined();
    expect(pipeline.estimatedTotalDuration).toBeGreaterThan(0);
    expect(pipeline.completedStages).toEqual([]);
    expect(pipeline.failedStages).toEqual([]);
    
    // Check all stages are created
    const expectedStageIds = [
      'dataFetch', 'validation', 'ensembleOptimization',
      'bayesianOptimization', 'gradientOptimization', 'confidenceScoring',
      'benchmarkValidation', 'llmValidation', 'finalSelection'
    ];
    
    expectedStageIds.forEach(stageId => {
      expect(pipeline.stages[stageId]).toBeDefined();
      expect(pipeline.stages[stageId].status).toBe(PipelineStageStatus.PENDING);
    });
  });

  test('updatePipelineStage updates stage correctly', () => {
    const pipeline = createOptimizationPipeline();
    const updatedPipeline = updatePipelineStage(pipeline, 'dataFetch', {
      status: PipelineStageStatus.RUNNING
    });
    
    expect(updatedPipeline.stages.dataFetch.status).toBe(PipelineStageStatus.RUNNING);
    expect(updatedPipeline.stages.dataFetch.startTime).toBeDefined();
    expect(updatedPipeline.currentStage).toBe('dataFetch');
  });

  test('calculatePipelineMetrics returns correct metrics', () => {
    const pipeline = createOptimizationPipeline();
    const metrics = calculatePipelineMetrics(pipeline);
    
    expect(metrics.totalStages).toBe(9);
    expect(metrics.completedStages).toBe(0);
    expect(metrics.failedStages).toBe(0);
    expect(metrics.overallProgress).toBe(0);
    expect(metrics.averageStageTime).toBe(0);
  });

  test('getNextStage returns correct sequence', () => {
    expect(getNextStage('dataFetch')).toBe('validation');
    expect(getNextStage('validation')).toBe('ensembleOptimization');
    expect(getNextStage('finalSelection')).toBeNull();
  });

  test('validatePipelineStage validates correctly', () => {
    const validStage: PipelineStage = {
      id: 'test',
      name: 'Test',
      status: PipelineStageStatus.PENDING,
      progress: 50
    };
    
    expect(validatePipelineStage(validStage)).toBe(true);
    
    const invalidStage = { ...validStage, progress: 150 };
    expect(validatePipelineStage(invalidStage)).toBe(false);
  });

  test('validatePipeline validates complete pipeline', () => {
    const pipeline = createOptimizationPipeline();
    expect(validatePipeline(pipeline)).toBe(true);
    
    const invalidPipeline = { ...pipeline, id: '' };
    expect(validatePipeline(invalidPipeline)).toBe(false);
  });
});

describe('PipelineManager', () => {
  let manager: PipelineManager;

  beforeEach(() => {
    manager = new PipelineManager('test-pipeline');
  });

  test('constructor creates valid pipeline', () => {
    const pipeline = manager.getPipeline();
    expect(pipeline.id).toBe('test-pipeline');
    expect(pipeline.status).toBe(PipelineStatus.RUNNING);
  });

  test('getMetrics returns pipeline metrics', () => {
    const metrics = manager.getMetrics();
    expect(metrics.totalStages).toBe(9);
    expect(metrics.completedStages).toBe(0);
  });

  test('updateStage updates pipeline state', () => {
    manager.updateStage('dataFetch', { status: PipelineStageStatus.RUNNING });
    
    const pipeline = manager.getPipeline();
    expect(pipeline.stages.dataFetch.status).toBe(PipelineStageStatus.RUNNING);
  });

  test('updateProgress updates stage progress', () => {
    manager.updateProgress('dataFetch', 50, 'Halfway done');
    
    const pipeline = manager.getPipeline();
    expect(pipeline.stages.dataFetch.progress).toBe(50);
    expect(pipeline.stages.dataFetch.details).toBe('Halfway done');
  });

  test('onEvent registers and unregisters callbacks', () => {
    const callback = jest.fn();
    const unsubscribe = manager.onEvent(callback);
    
    manager.updateStage('dataFetch', { status: PipelineStageStatus.RUNNING });
    expect(callback).toHaveBeenCalled();
    
    callback.mockClear();
    unsubscribe();
    
    manager.updateStage('validation', { status: PipelineStageStatus.RUNNING });
    expect(callback).not.toHaveBeenCalled();
  });

  test('reset resets pipeline to initial state', () => {
    manager.updateStage('dataFetch', { status: PipelineStageStatus.COMPLETED });
    manager.reset();
    
    const pipeline = manager.getPipeline();
    expect(pipeline.stages.dataFetch.status).toBe(PipelineStageStatus.PENDING);
    expect(pipeline.completedStages).toEqual([]);
  });

  test('getCurrentStage returns running stage', () => {
    expect(manager.getCurrentStage()).toBeNull();
    
    manager.updateStage('dataFetch', { status: PipelineStageStatus.RUNNING });
    expect(manager.getCurrentStage()).toBe('dataFetch');
  });
});