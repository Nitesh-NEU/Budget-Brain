/**
 * Pipeline Stage Manager
 * 
 * Manages the sequential progression of pipeline stages and ensures
 * proper stage dependencies are respected.
 */

import {
  OptimizationPipeline,
  PipelineStage,
  PipelineStageStatus,
  PipelineStatus,
  StageId,
  PIPELINE_STAGE_CONFIG
} from '@/types/pipeline';

/**
 * Defines the sequential order of pipeline stages
 */
export const STAGE_EXECUTION_ORDER: StageId[] = [
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

/**
 * Stage dependency configuration
 * Each stage lists the stages that must be completed before it can start
 */
export const STAGE_DEPENDENCIES: Record<StageId, StageId[]> = {
  dataFetch: [],
  validation: ['dataFetch'],
  ensembleOptimization: ['dataFetch', 'validation'],
  bayesianOptimization: ['dataFetch', 'validation'], // Can run in parallel with ensemble
  gradientOptimization: ['dataFetch', 'validation'], // Can run in parallel with ensemble
  confidenceScoring: ['ensembleOptimization', 'bayesianOptimization', 'gradientOptimization'],
  benchmarkValidation: ['confidenceScoring'],
  llmValidation: ['confidenceScoring'],
  finalSelection: ['benchmarkValidation', 'llmValidation']
};

/**
 * Stages that can run in parallel
 */
export const PARALLEL_STAGE_GROUPS: StageId[][] = [
  ['ensembleOptimization', 'bayesianOptimization', 'gradientOptimization'],
  ['benchmarkValidation', 'llmValidation']
];

/**
 * Checks if a stage can be started based on its dependencies
 */
export function canStageStart(pipeline: OptimizationPipeline, stageId: StageId): boolean {
  const dependencies = STAGE_DEPENDENCIES[stageId];
  
  // Check if all dependencies are completed
  return dependencies.every(depStageId => 
    pipeline.stages[depStageId].status === PipelineStageStatus.COMPLETED
  );
}

/**
 * Gets the next stages that can be started
 */
export function getNextAvailableStages(pipeline: OptimizationPipeline): StageId[] {
  const availableStages: StageId[] = [];
  
  for (const stageId of STAGE_EXECUTION_ORDER) {
    const stage = pipeline.stages[stageId];
    
    // Skip if stage is already running, completed, or failed
    if (stage.status !== PipelineStageStatus.PENDING) {
      continue;
    }
    
    // Check if stage can start based on dependencies
    if (canStageStart(pipeline, stageId)) {
      availableStages.push(stageId);
    }
  }
  
  return availableStages;
}

/**
 * Automatically progresses the pipeline by starting available stages
 */
export function autoProgressPipeline(pipeline: OptimizationPipeline): OptimizationPipeline {
  const updatedPipeline = { ...pipeline };
  const availableStages = getNextAvailableStages(updatedPipeline);
  
  // Start available stages
  for (const stageId of availableStages) {
    // Check if we should start this stage based on parallel execution rules
    const shouldStart = shouldStartStage(updatedPipeline, stageId);
    
    if (shouldStart) {
      updatedPipeline.stages[stageId] = {
        ...updatedPipeline.stages[stageId],
        status: PipelineStageStatus.RUNNING,
        startTime: Date.now(),
        progress: 0
      };
      
      // Update current stage if not set or if this is the first running stage
      if (!updatedPipeline.currentStage || 
          updatedPipeline.stages[updatedPipeline.currentStage].status !== PipelineStageStatus.RUNNING) {
        updatedPipeline.currentStage = stageId;
      }
    }
  }
  
  return updatedPipeline;
}

/**
 * Determines if a stage should be started based on parallel execution rules
 */
function shouldStartStage(pipeline: OptimizationPipeline, stageId: StageId): boolean {
  // Find if this stage is part of a parallel group
  const parallelGroup = PARALLEL_STAGE_GROUPS.find(group => group.includes(stageId));
  
  if (!parallelGroup) {
    // Not in a parallel group, can start if dependencies are met
    return true;
  }
  
  // Check if any other stage in the parallel group is already running
  const runningInGroup = parallelGroup.some(groupStageId => 
    pipeline.stages[groupStageId].status === PipelineStageStatus.RUNNING
  );
  
  // For demo purposes, we'll run stages sequentially even within parallel groups
  // In a real implementation, you might want to run them truly in parallel
  return !runningInGroup;
}

/**
 * Simulates stage completion and automatically progresses to next stages
 */
export function completeStageAndProgress(
  pipeline: OptimizationPipeline, 
  stageId: StageId,
  duration?: number,
  details?: string
): OptimizationPipeline {
  let updatedPipeline = { ...pipeline };
  
  // Complete the current stage
  const stage = updatedPipeline.stages[stageId];
  const endTime = Date.now();
  const calculatedDuration = duration || (stage.startTime ? endTime - stage.startTime : 0);
  
  updatedPipeline.stages[stageId] = {
    ...stage,
    status: PipelineStageStatus.COMPLETED,
    progress: 100,
    endTime,
    duration: calculatedDuration,
    details: details || stage.details
  };
  
  // Add to completed stages
  if (!updatedPipeline.completedStages.includes(stageId)) {
    updatedPipeline.completedStages.push(stageId);
  }
  
  // Auto-progress to next available stages
  updatedPipeline = autoProgressPipeline(updatedPipeline);
  
  // Check if pipeline is complete
  const allStagesCompleted = STAGE_EXECUTION_ORDER.every(
    id => updatedPipeline.stages[id].status === PipelineStageStatus.COMPLETED
  );
  
  if (allStagesCompleted) {
    updatedPipeline.status = PipelineStatus.COMPLETED;
    updatedPipeline.endTime = Date.now();
    updatedPipeline.totalDuration = updatedPipeline.endTime - updatedPipeline.startTime;
  }
  
  return updatedPipeline;
}

/**
 * Simulates stage failure and handles error propagation
 */
export function failStageAndHandle(
  pipeline: OptimizationPipeline,
  stageId: StageId,
  error: string
): OptimizationPipeline {
  const updatedPipeline = { ...pipeline };
  
  // Mark stage as failed
  updatedPipeline.stages[stageId] = {
    ...updatedPipeline.stages[stageId],
    status: PipelineStageStatus.ERROR,
    error,
    endTime: Date.now()
  };
  
  // Add to failed stages
  if (!updatedPipeline.failedStages.includes(stageId)) {
    updatedPipeline.failedStages.push(stageId);
  }
  
  // Mark pipeline as failed
  updatedPipeline.status = PipelineStatus.ERROR;
  
  return updatedPipeline;
}

/**
 * Gets the overall pipeline progress as a percentage
 */
export function calculateOverallProgress(pipeline: OptimizationPipeline): number {
  const totalStages = STAGE_EXECUTION_ORDER.length;
  let totalProgress = 0;
  
  for (const stageId of STAGE_EXECUTION_ORDER) {
    const stage = pipeline.stages[stageId];
    totalProgress += stage.progress || 0;
  }
  
  return totalProgress / totalStages;
}

/**
 * Gets the estimated time remaining for the pipeline
 */
export function getEstimatedTimeRemaining(pipeline: OptimizationPipeline): number | null {
  const completedStages = pipeline.completedStages.length;
  const totalStages = STAGE_EXECUTION_ORDER.length;
  
  if (completedStages === 0) {
    return pipeline.estimatedTotalDuration;
  }
  
  // Calculate average time per completed stage
  let totalCompletedTime = 0;
  let completedCount = 0;
  
  for (const stageId of pipeline.completedStages) {
    const stage = pipeline.stages[stageId as StageId];
    if (stage.duration) {
      totalCompletedTime += stage.duration;
      completedCount++;
    }
  }
  
  if (completedCount === 0) {
    return null;
  }
  
  const averageStageTime = totalCompletedTime / completedCount;
  const remainingStages = totalStages - completedStages;
  
  return remainingStages * averageStageTime;
}

/**
 * Creates a realistic pipeline simulation with proper stage progression
 */
export function createRealisticPipelineSimulation(
  scenario: 'starting' | 'mid-progress' | 'near-completion' | 'completed' | 'failed'
): OptimizationPipeline {
  const baseTime = Date.now();
  
  let pipeline: OptimizationPipeline = {
    id: `simulation-${scenario}-${Date.now()}`,
    status: PipelineStatus.RUNNING,
    startTime: baseTime - 10000,
    estimatedTotalDuration: 25000,
    currentStage: 'dataFetch',
    completedStages: [],
    failedStages: [],
    stages: {
      dataFetch: {
        id: 'dataFetch',
        name: PIPELINE_STAGE_CONFIG.DATA_FETCH.name,
        status: PipelineStageStatus.PENDING,
        progress: 0
      },
      validation: {
        id: 'validation',
        name: PIPELINE_STAGE_CONFIG.VALIDATION.name,
        status: PipelineStageStatus.PENDING,
        progress: 0
      },
      ensembleOptimization: {
        id: 'ensembleOptimization',
        name: PIPELINE_STAGE_CONFIG.ENSEMBLE_OPTIMIZATION.name,
        status: PipelineStageStatus.PENDING,
        progress: 0
      },
      bayesianOptimization: {
        id: 'bayesianOptimization',
        name: PIPELINE_STAGE_CONFIG.BAYESIAN_OPTIMIZATION.name,
        status: PipelineStageStatus.PENDING,
        progress: 0
      },
      gradientOptimization: {
        id: 'gradientOptimization',
        name: PIPELINE_STAGE_CONFIG.GRADIENT_OPTIMIZATION.name,
        status: PipelineStageStatus.PENDING,
        progress: 0
      },
      confidenceScoring: {
        id: 'confidenceScoring',
        name: PIPELINE_STAGE_CONFIG.CONFIDENCE_SCORING.name,
        status: PipelineStageStatus.PENDING,
        progress: 0
      },
      benchmarkValidation: {
        id: 'benchmarkValidation',
        name: PIPELINE_STAGE_CONFIG.BENCHMARK_VALIDATION.name,
        status: PipelineStageStatus.PENDING,
        progress: 0
      },
      llmValidation: {
        id: 'llmValidation',
        name: PIPELINE_STAGE_CONFIG.LLM_VALIDATION.name,
        status: PipelineStageStatus.PENDING,
        progress: 0
      },
      finalSelection: {
        id: 'finalSelection',
        name: PIPELINE_STAGE_CONFIG.FINAL_SELECTION.name,
        status: PipelineStageStatus.PENDING,
        progress: 0
      }
    }
  };
  
  // Apply scenario-specific progression
  switch (scenario) {
    case 'starting':
      pipeline = autoProgressPipeline(pipeline);
      break;
      
    case 'mid-progress':
      // Complete first few stages
      pipeline = completeStageAndProgress(pipeline, 'dataFetch', 2000, 'Data fetched from 5 sources');
      pipeline = completeStageAndProgress(pipeline, 'validation', 1200, 'All data validated successfully');
      pipeline = completeStageAndProgress(pipeline, 'ensembleOptimization', 3200, 'Ensemble optimization completed');
      // bayesianOptimization should now be running
      break;
      
    case 'near-completion':
      // Complete most stages
      const stagesToComplete: StageId[] = [
        'dataFetch', 'validation', 'ensembleOptimization', 
        'bayesianOptimization', 'gradientOptimization', 'confidenceScoring'
      ];
      
      for (const stageId of stagesToComplete) {
        const duration = PIPELINE_STAGE_CONFIG[stageId.toUpperCase() as keyof typeof PIPELINE_STAGE_CONFIG]?.estimatedDuration || 2000;
        pipeline = completeStageAndProgress(pipeline, stageId, duration, `${stageId} completed successfully`);
      }
      break;
      
    case 'completed':
      // Complete all stages
      for (const stageId of STAGE_EXECUTION_ORDER) {
        const duration = PIPELINE_STAGE_CONFIG[stageId.toUpperCase() as keyof typeof PIPELINE_STAGE_CONFIG]?.estimatedDuration || 2000;
        pipeline = completeStageAndProgress(pipeline, stageId, duration, `${stageId} completed successfully`);
      }
      break;
      
    case 'failed':
      // Complete first few stages then fail
      pipeline = completeStageAndProgress(pipeline, 'dataFetch', 2000, 'Data fetched successfully');
      pipeline = completeStageAndProgress(pipeline, 'validation', 1200, 'Data validated');
      pipeline = failStageAndHandle(pipeline, 'ensembleOptimization', 'Ensemble optimization failed due to insufficient data quality');
      break;
  }
  
  return pipeline;
}