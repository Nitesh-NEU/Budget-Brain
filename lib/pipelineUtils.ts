/**
 * Pipeline Utility Functions
 * 
 * This module provides utility functions for creating, managing,
 * and tracking optimization pipeline stages.
 */

import {
  OptimizationPipeline,
  PipelineStage,
  PipelineStageStatus,
  PipelineStatus,
  PipelineMetrics,
  PipelineUpdate,
  ProgressUpdate,
  StageTimingInfo,
  PIPELINE_STAGE_CONFIG,
  StageId
} from '../types/pipeline';

/**
 * Creates a new pipeline stage with default values
 */
export function createPipelineStage(
  id: string,
  name: string,
  estimatedDuration?: number
): PipelineStage {
  return {
    id,
    name,
    status: PipelineStageStatus.PENDING,
    progress: 0,
    metadata: {
      estimatedDuration: estimatedDuration || 1000
    }
  };
}

/**
 * Creates a new optimization pipeline with all stages initialized
 */
export function createOptimizationPipeline(id?: string): OptimizationPipeline {
  const pipelineId = id || `pipeline_${Date.now()}`;
  const startTime = Date.now();
  
  // Calculate total estimated duration
  const estimatedTotalDuration = Object.values(PIPELINE_STAGE_CONFIG)
    .reduce((total, config) => total + config.estimatedDuration, 0);

  return {
    id: pipelineId,
    status: PipelineStatus.RUNNING,
    startTime,
    estimatedTotalDuration,
    completedStages: [],
    failedStages: [],
    stages: {
      dataFetch: createPipelineStage(
        PIPELINE_STAGE_CONFIG.DATA_FETCH.id,
        PIPELINE_STAGE_CONFIG.DATA_FETCH.name,
        PIPELINE_STAGE_CONFIG.DATA_FETCH.estimatedDuration
      ),
      validation: createPipelineStage(
        PIPELINE_STAGE_CONFIG.VALIDATION.id,
        PIPELINE_STAGE_CONFIG.VALIDATION.name,
        PIPELINE_STAGE_CONFIG.VALIDATION.estimatedDuration
      ),
      ensembleOptimization: createPipelineStage(
        PIPELINE_STAGE_CONFIG.ENSEMBLE_OPTIMIZATION.id,
        PIPELINE_STAGE_CONFIG.ENSEMBLE_OPTIMIZATION.name,
        PIPELINE_STAGE_CONFIG.ENSEMBLE_OPTIMIZATION.estimatedDuration
      ),
      bayesianOptimization: createPipelineStage(
        PIPELINE_STAGE_CONFIG.BAYESIAN_OPTIMIZATION.id,
        PIPELINE_STAGE_CONFIG.BAYESIAN_OPTIMIZATION.name,
        PIPELINE_STAGE_CONFIG.BAYESIAN_OPTIMIZATION.estimatedDuration
      ),
      gradientOptimization: createPipelineStage(
        PIPELINE_STAGE_CONFIG.GRADIENT_OPTIMIZATION.id,
        PIPELINE_STAGE_CONFIG.GRADIENT_OPTIMIZATION.name,
        PIPELINE_STAGE_CONFIG.GRADIENT_OPTIMIZATION.estimatedDuration
      ),
      confidenceScoring: createPipelineStage(
        PIPELINE_STAGE_CONFIG.CONFIDENCE_SCORING.id,
        PIPELINE_STAGE_CONFIG.CONFIDENCE_SCORING.name,
        PIPELINE_STAGE_CONFIG.CONFIDENCE_SCORING.estimatedDuration
      ),
      benchmarkValidation: createPipelineStage(
        PIPELINE_STAGE_CONFIG.BENCHMARK_VALIDATION.id,
        PIPELINE_STAGE_CONFIG.BENCHMARK_VALIDATION.name,
        PIPELINE_STAGE_CONFIG.BENCHMARK_VALIDATION.estimatedDuration
      ),
      llmValidation: createPipelineStage(
        PIPELINE_STAGE_CONFIG.LLM_VALIDATION.id,
        PIPELINE_STAGE_CONFIG.LLM_VALIDATION.name,
        PIPELINE_STAGE_CONFIG.LLM_VALIDATION.estimatedDuration
      ),
      finalSelection: createPipelineStage(
        PIPELINE_STAGE_CONFIG.FINAL_SELECTION.id,
        PIPELINE_STAGE_CONFIG.FINAL_SELECTION.name,
        PIPELINE_STAGE_CONFIG.FINAL_SELECTION.estimatedDuration
      )
    }
  };
}

/**
 * Updates a pipeline stage with new status and timing information
 */
export function updatePipelineStage(
  pipeline: OptimizationPipeline,
  stageId: StageId,
  update: Partial<PipelineStage>
): OptimizationPipeline {
  const updatedPipeline = { ...pipeline };
  const stage = { ...updatedPipeline.stages[stageId] };
  
  // Apply updates
  Object.assign(stage, update);
  
  // Update timing information
  if (update.status === PipelineStageStatus.RUNNING && !stage.startTime) {
    stage.startTime = Date.now();
    stage.progress = 0;
  }
  
  if (update.status === PipelineStageStatus.COMPLETED && stage.startTime && !stage.endTime) {
    stage.endTime = Date.now();
    stage.duration = stage.endTime - stage.startTime;
    stage.progress = 100;
    
    // Add to completed stages if not already there
    if (!updatedPipeline.completedStages.includes(stageId)) {
      updatedPipeline.completedStages.push(stageId);
    }
  }
  
  if (update.status === PipelineStageStatus.ERROR) {
    stage.progress = 0;
    
    // Add to failed stages if not already there
    if (!updatedPipeline.failedStages.includes(stageId)) {
      updatedPipeline.failedStages.push(stageId);
    }
  }
  
  updatedPipeline.stages[stageId] = stage;
  
  // Update pipeline-level status
  updatedPipeline.currentStage = stageId;
  
  // Check if pipeline is complete
  const allStageIds = Object.keys(updatedPipeline.stages) as StageId[];
  const completedCount = updatedPipeline.completedStages.length;
  const failedCount = updatedPipeline.failedStages.length;
  
  if (completedCount === allStageIds.length) {
    updatedPipeline.status = PipelineStatus.COMPLETED;
    updatedPipeline.endTime = Date.now();
    updatedPipeline.totalDuration = updatedPipeline.endTime - updatedPipeline.startTime;
  } else if (failedCount > 0) {
    updatedPipeline.status = PipelineStatus.ERROR;
  }
  
  return updatedPipeline;
}

/**
 * Calculates pipeline metrics for progress tracking
 */
export function calculatePipelineMetrics(pipeline: OptimizationPipeline): PipelineMetrics {
  const allStageIds = Object.keys(pipeline.stages) as StageId[];
  const totalStages = allStageIds.length;
  const completedStages = pipeline.completedStages.length;
  const failedStages = pipeline.failedStages.length;
  
  // Calculate overall progress
  let totalProgress = 0;
  allStageIds.forEach(stageId => {
    const stage = pipeline.stages[stageId];
    totalProgress += stage.progress || 0;
  });
  const overallProgress = totalProgress / totalStages;
  
  // Calculate average stage time for completed stages
  let totalDuration = 0;
  let completedWithDuration = 0;
  
  allStageIds.forEach(stageId => {
    const stage = pipeline.stages[stageId];
    if (stage.duration) {
      totalDuration += stage.duration;
      completedWithDuration++;
    }
  });
  
  const averageStageTime = completedWithDuration > 0 ? totalDuration / completedWithDuration : 0;
  
  // Estimate time remaining
  let estimatedTimeRemaining: number | undefined;
  if (pipeline.status === PipelineStatus.RUNNING && averageStageTime > 0) {
    const remainingStages = totalStages - completedStages - failedStages;
    estimatedTimeRemaining = remainingStages * averageStageTime;
  }
  
  return {
    totalStages,
    completedStages,
    failedStages,
    overallProgress,
    averageStageTime,
    estimatedTimeRemaining
  };
}

/**
 * Creates a pipeline update event
 */
export function createPipelineUpdate(
  stageId: string,
  status: PipelineStageStatus,
  progress?: number,
  details?: string,
  error?: string,
  metadata?: Record<string, any>
): PipelineUpdate {
  return {
    stageId,
    status,
    progress,
    details,
    timestamp: Date.now(),
    error,
    metadata
  };
}

/**
 * Creates a progress update event
 */
export function createProgressUpdate(
  stageId: string,
  progress: number,
  details?: string,
  metadata?: Record<string, any>
): ProgressUpdate {
  return {
    stageId,
    progress,
    details,
    timestamp: Date.now(),
    metadata
  };
}

/**
 * Gets the next stage in the pipeline sequence
 */
export function getNextStage(currentStageId: StageId): StageId | null {
  const stageOrder: StageId[] = [
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
  
  const currentIndex = stageOrder.indexOf(currentStageId);
  if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
    return stageOrder[currentIndex + 1];
  }
  
  return null;
}

/**
 * Gets timing information for a specific stage
 */
export function getStageTimingInfo(stage: PipelineStage): StageTimingInfo {
  const estimatedDuration = stage.metadata?.estimatedDuration || 1000;
  const startTime = stage.startTime || Date.now();
  const endTime = stage.endTime;
  const duration = endTime ? endTime - startTime : undefined;
  const progress = stage.progress || 0;
  
  return {
    startTime,
    endTime,
    duration,
    estimatedDuration,
    progress
  };
}

/**
 * Validates pipeline stage configuration
 */
export function validatePipelineStage(stage: PipelineStage): boolean {
  return !!(
    stage.id &&
    stage.name &&
    Object.values(PipelineStageStatus).includes(stage.status) &&
    (stage.progress === undefined || (stage.progress >= 0 && stage.progress <= 100))
  );
}

/**
 * Validates complete pipeline configuration
 */
export function validatePipeline(pipeline: OptimizationPipeline): boolean {
  if (!pipeline.id || !pipeline.startTime || !Object.values(PipelineStatus).includes(pipeline.status)) {
    return false;
  }
  
  // Validate all stages
  const stageIds = Object.keys(pipeline.stages) as StageId[];
  return stageIds.every(stageId => validatePipelineStage(pipeline.stages[stageId]));
}