/**
 * Pipeline Stage Tracking Types and Interfaces
 * 
 * This module defines the core types and interfaces for tracking
 * the optimization pipeline stages, progress, and real-time updates.
 */

// Pipeline stage status enumeration
export enum PipelineStageStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// Pipeline overall status enumeration
export enum PipelineStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// Stage configuration constants
export const PIPELINE_STAGE_CONFIG = {
  DATA_FETCH: {
    id: 'dataFetch',
    name: 'Data Fetching',
    description: 'Fetching benchmark data and priors',
    estimatedDuration: 2000
  },
  VALIDATION: {
    id: 'validation',
    name: 'Data Validation',
    description: 'Validating input data and citations',
    estimatedDuration: 1000
  },
  ENSEMBLE_OPTIMIZATION: {
    id: 'ensembleOptimization',
    name: 'Ensemble Optimization',
    description: 'Running ensemble optimization algorithms',
    estimatedDuration: 3000
  },
  BAYESIAN_OPTIMIZATION: {
    id: 'bayesianOptimization',
    name: 'Bayesian Optimization',
    description: 'Applying Bayesian optimization techniques',
    estimatedDuration: 4000
  },
  GRADIENT_OPTIMIZATION: {
    id: 'gradientOptimization',
    name: 'Gradient Optimization',
    description: 'Running gradient-based optimization',
    estimatedDuration: 2500
  },
  CONFIDENCE_SCORING: {
    id: 'confidenceScoring',
    name: 'Confidence Scoring',
    description: 'Calculating confidence metrics',
    estimatedDuration: 1500
  },
  BENCHMARK_VALIDATION: {
    id: 'benchmarkValidation',
    name: 'Benchmark Validation',
    description: 'Validating against benchmark data',
    estimatedDuration: 2000
  },
  LLM_VALIDATION: {
    id: 'llmValidation',
    name: 'LLM Validation',
    description: 'AI-powered result validation',
    estimatedDuration: 3000
  },
  FINAL_SELECTION: {
    id: 'finalSelection',
    name: 'Final Selection',
    description: 'Selecting optimal allocation',
    estimatedDuration: 500
  }
} as const;

// Individual pipeline stage interface
export interface PipelineStage {
  id: string;
  name: string;
  status: PipelineStageStatus;
  startTime?: number;
  endTime?: number;
  duration?: number;
  progress?: number; // 0-100 percentage
  details?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// Timing information for stages
export interface StageTimingInfo {
  startTime: number;
  endTime?: number;
  duration?: number;
  estimatedDuration: number;
  progress: number;
}

// Progress tracking for real-time updates
export interface ProgressUpdate {
  stageId: string;
  progress: number;
  details?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Pipeline update event for real-time communication
export interface PipelineUpdate {
  stageId: string;
  status: PipelineStageStatus;
  progress?: number;
  details?: string;
  timestamp: number;
  error?: string;
  metadata?: Record<string, any>;
}

// Complete optimization pipeline interface
export interface OptimizationPipeline {
  id: string;
  status: PipelineStatus;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  estimatedTotalDuration: number;
  stages: {
    dataFetch: PipelineStage;
    validation: PipelineStage;
    ensembleOptimization: PipelineStage;
    bayesianOptimization: PipelineStage;
    gradientOptimization: PipelineStage;
    confidenceScoring: PipelineStage;
    benchmarkValidation: PipelineStage;
    llmValidation: PipelineStage;
    finalSelection: PipelineStage;
  };
  currentStage?: string;
  completedStages: string[];
  failedStages: string[];
}

// Pipeline metrics for performance tracking
export interface PipelineMetrics {
  totalStages: number;
  completedStages: number;
  failedStages: number;
  overallProgress: number;
  averageStageTime: number;
  estimatedTimeRemaining?: number;
}

// Stage execution context
export interface StageExecutionContext {
  stageId: string;
  pipeline: OptimizationPipeline;
  previousStageResults?: Record<string, any>;
  configuration?: Record<string, any>;
}

// Pipeline event types for real-time updates
export enum PipelineEventType {
  STAGE_STARTED = 'stage_started',
  STAGE_PROGRESS = 'stage_progress',
  STAGE_COMPLETED = 'stage_completed',
  STAGE_FAILED = 'stage_failed',
  PIPELINE_COMPLETED = 'pipeline_completed',
  PIPELINE_FAILED = 'pipeline_failed'
}

// Pipeline event interface
export interface PipelineEvent {
  type: PipelineEventType;
  pipelineId: string;
  stageId?: string;
  timestamp: number;
  data?: Record<string, any>;
}

// Pipeline configuration interface
export interface PipelineConfiguration {
  enabledStages: string[];
  stageTimeouts: Record<string, number>;
  retryAttempts: Record<string, number>;
  parallelExecution?: boolean;
  realTimeUpdates?: boolean;
}

// Helper type for stage IDs
export type StageId = keyof OptimizationPipeline['stages'];

// Helper type for creating new pipeline stages
export type CreatePipelineStageInput = Omit<PipelineStage, 'id' | 'status' | 'startTime' | 'endTime' | 'duration'>;

// Pipeline factory function type
export type PipelineFactory = (config?: Partial<PipelineConfiguration>) => OptimizationPipeline;

// Stage execution result
export interface StageExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  metadata?: Record<string, any>;
}