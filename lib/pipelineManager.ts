/**
 * Pipeline Manager
 * 
 * This module provides a centralized manager for handling pipeline
 * execution, real-time updates, and event broadcasting.
 */

import { EventEmitter } from 'events';
import {
  OptimizationPipeline,
  PipelineStage,
  PipelineStageStatus,
  PipelineStatus,
  PipelineUpdate,
  ProgressUpdate,
  PipelineEvent,
  PipelineEventType,
  StageExecutionResult,
  StageExecutionContext,
  StageId
} from '../types/pipeline';

import {
  createOptimizationPipeline,
  updatePipelineStage,
  calculatePipelineMetrics,
  createPipelineUpdate,
  createProgressUpdate,
  getNextStage,
  validatePipeline
} from './pipelineUtils';

/**
 * Event callback type for pipeline updates
 */
export type PipelineEventCallback = (event: PipelineEvent) => void;
export type PipelineUpdateCallback = (update: PipelineUpdate & { pipelineId: string }) => void;

/**
 * Stage execution function type
 */
export type StageExecutionFunction = (context: StageExecutionContext) => Promise<StageExecutionResult>;

/**
 * Pipeline Manager class for orchestrating optimization pipeline execution
 */
export class PipelineManager extends EventEmitter {
  private static instances: Map<string, PipelineManager> = new Map();
  private static globalUpdates: Map<string, PipelineUpdate[]> = new Map();
  
  private pipeline: OptimizationPipeline;
  private stageExecutors: Map<string, StageExecutionFunction> = new Map();
  private isRunning: boolean = false;

  constructor(pipelineId?: string) {
    super();
    this.pipeline = createOptimizationPipeline(pipelineId);
    
    // Store instance for global access
    PipelineManager.instances.set(this.pipeline.id, this);
    
    // Initialize updates array for this pipeline
    if (!PipelineManager.globalUpdates.has(this.pipeline.id)) {
      PipelineManager.globalUpdates.set(this.pipeline.id, []);
    }
  }

  /**
   * Gets a pipeline manager instance by ID
   */
  static getInstance(pipelineId: string): PipelineManager | undefined {
    return PipelineManager.instances.get(pipelineId);
  }

  /**
   * Gets all active pipeline instances
   */
  static getAllInstances(): Map<string, PipelineManager> {
    return new Map(PipelineManager.instances);
  }

  /**
   * Gets updates for a specific pipeline after a timestamp
   */
  static getUpdatesAfter(pipelineId: string, timestamp: number): PipelineUpdate[] {
    const updates = PipelineManager.globalUpdates.get(pipelineId) || [];
    return updates.filter(update => update.timestamp > timestamp);
  }

  /**
   * Stores an update globally for polling access
   */
  private static storeUpdate(pipelineId: string, update: PipelineUpdate): void {
    if (!PipelineManager.globalUpdates.has(pipelineId)) {
      PipelineManager.globalUpdates.set(pipelineId, []);
    }
    
    const updates = PipelineManager.globalUpdates.get(pipelineId)!;
    updates.push(update);
    
    // Keep only last 100 updates to prevent memory leaks
    if (updates.length > 100) {
      updates.splice(0, updates.length - 100);
    }
  }

  /**
   * Gets the current pipeline state
   */
  getPipeline(pipelineId?: string): OptimizationPipeline | null {
    if (pipelineId) {
      const instance = PipelineManager.getInstance(pipelineId);
      return instance ? { ...instance.pipeline } : null;
    }
    return { ...this.pipeline };
  }

  /**
   * Gets pipeline metrics
   */
  getMetrics() {
    return calculatePipelineMetrics(this.pipeline);
  }

  /**
   * Gets updates after a specific timestamp
   */
  getUpdatesAfter(pipelineId: string, timestamp: number): PipelineUpdate[] {
    return PipelineManager.getUpdatesAfter(pipelineId, timestamp);
  }

  /**
   * Registers a stage executor function
   */
  registerStageExecutor(stageId: string, executor: StageExecutionFunction): void {
    this.stageExecutors.set(stageId, executor);
  }

  /**
   * Emits a pipeline event to all registered callbacks
   */
  private emitPipelineEvent(event: PipelineEvent): void {
    // Emit through EventEmitter for local listeners
    this.emit('pipelineEvent', event);
    
    // Also emit globally for cross-instance communication
    PipelineManager.instances.forEach(instance => {
      if (instance !== this) {
        instance.emit('pipelineEvent', event);
      }
    });
  }

  /**
   * Emits a pipeline update to all registered callbacks
   */
  private emitPipelineUpdate(update: PipelineUpdate): void {
    const updateWithPipelineId = { ...update, pipelineId: this.pipeline.id };
    
    // Store update globally for polling access
    PipelineManager.storeUpdate(this.pipeline.id, update);
    
    // Emit through EventEmitter for local listeners
    this.emit('pipelineUpdate', updateWithPipelineId);
    
    // Also emit globally for cross-instance communication
    PipelineManager.instances.forEach(instance => {
      if (instance !== this) {
        instance.emit('pipelineUpdate', updateWithPipelineId);
      }
    });
  }

  /**
   * Updates a pipeline stage and emits appropriate events
   */
  updateStage(stageId: StageId | string, update: Partial<PipelineStage> | PipelineUpdate): void {
    // Handle both direct stage updates and PipelineUpdate objects
    let stageUpdate: Partial<PipelineStage>;
    let pipelineUpdate: PipelineUpdate;
    
    if ('timestamp' in update) {
      // It's a PipelineUpdate object
      pipelineUpdate = update as PipelineUpdate;
      stageUpdate = {
        status: pipelineUpdate.status,
        progress: pipelineUpdate.progress,
        details: pipelineUpdate.details,
        error: pipelineUpdate.error,
        metadata: pipelineUpdate.metadata
      };
    } else {
      // It's a direct stage update
      stageUpdate = update as Partial<PipelineStage>;
      pipelineUpdate = {
        stageId: stageId as string,
        status: stageUpdate.status || this.pipeline.stages[stageId as StageId].status,
        progress: stageUpdate.progress,
        details: stageUpdate.details,
        error: stageUpdate.error,
        timestamp: Date.now(),
        metadata: stageUpdate.metadata
      };
    }

    const previousStatus = this.pipeline.stages[stageId as StageId].status;
    this.pipeline = updatePipelineStage(this.pipeline, stageId as StageId, stageUpdate);
    const newStatus = this.pipeline.stages[stageId as StageId].status;

    // Emit pipeline update
    this.emitPipelineUpdate(pipelineUpdate);

    // Emit stage-specific events
    if (previousStatus !== newStatus) {
      let eventType: PipelineEventType;
      
      switch (newStatus) {
        case PipelineStageStatus.RUNNING:
          eventType = PipelineEventType.STAGE_STARTED;
          break;
        case PipelineStageStatus.COMPLETED:
          eventType = PipelineEventType.STAGE_COMPLETED;
          break;
        case PipelineStageStatus.ERROR:
          eventType = PipelineEventType.STAGE_FAILED;
          break;
        default:
          return;
      }

      this.emitPipelineEvent({
        type: eventType,
        pipelineId: this.pipeline.id,
        stageId: stageId as string,
        timestamp: Date.now(),
        data: { stage: this.pipeline.stages[stageId as StageId] }
      });
    }

    // Emit pipeline completion events
    if (this.pipeline.status === PipelineStatus.COMPLETED) {
      this.emitPipelineEvent({
        type: PipelineEventType.PIPELINE_COMPLETED,
        pipelineId: this.pipeline.id,
        timestamp: Date.now(),
        data: { pipeline: this.pipeline, metrics: this.getMetrics() }
      });
    } else if (this.pipeline.status === PipelineStatus.ERROR) {
      this.emitPipelineEvent({
        type: PipelineEventType.PIPELINE_FAILED,
        pipelineId: this.pipeline.id,
        timestamp: Date.now(),
        data: { pipeline: this.pipeline, failedStages: this.pipeline.failedStages }
      });
    }
  }

  /**
   * Updates stage progress and emits progress event
   */
  updateProgress(stageId: StageId, progress: number, details?: string): void {
    this.updateStage(stageId, { progress, details });
    
    this.emitPipelineEvent({
      type: PipelineEventType.STAGE_PROGRESS,
      pipelineId: this.pipeline.id,
      stageId,
      timestamp: Date.now(),
      data: { progress, details }
    });
  }

  /**
   * Starts execution of a specific stage
   */
  async startStage(stageId: StageId): Promise<StageExecutionResult> {
    const executor = this.stageExecutors.get(stageId);
    if (!executor) {
      const error = `No executor registered for stage: ${stageId}`;
      this.updateStage(stageId, { 
        status: PipelineStageStatus.ERROR, 
        error 
      });
      return { success: false, error, duration: 0 };
    }

    // Mark stage as running
    this.updateStage(stageId, { status: PipelineStageStatus.RUNNING });

    const startTime = Date.now();
    
    try {
      const context: StageExecutionContext = {
        stageId,
        pipeline: this.pipeline,
        previousStageResults: this.getPreviousStageResults(stageId)
      };

      const result = await executor(context);
      const duration = Date.now() - startTime;

      if (result.success) {
        this.updateStage(stageId, { 
          status: PipelineStageStatus.COMPLETED,
          details: result.data ? JSON.stringify(result.data) : undefined
        });
      } else {
        this.updateStage(stageId, { 
          status: PipelineStageStatus.ERROR,
          error: result.error
        });
      }

      return { ...result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.updateStage(stageId, { 
        status: PipelineStageStatus.ERROR,
        error: errorMessage
      });

      return { success: false, error: errorMessage, duration };
    }
  }

  /**
   * Executes the entire pipeline sequentially
   */
  async executePipeline(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Pipeline is already running');
    }

    if (!validatePipeline(this.pipeline)) {
      throw new Error('Invalid pipeline configuration');
    }

    this.isRunning = true;

    try {
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

      for (const stageId of stageOrder) {
        const result = await this.startStage(stageId);
        
        if (!result.success) {
          // Stop execution on first failure
          break;
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Gets results from previous stages for context
   */
  private getPreviousStageResults(currentStageId: StageId): Record<string, any> {
    const results: Record<string, any> = {};
    
    Object.entries(this.pipeline.stages).forEach(([stageId, stage]) => {
      if (stage.status === PipelineStageStatus.COMPLETED && stage.details) {
        try {
          results[stageId] = JSON.parse(stage.details);
        } catch {
          results[stageId] = stage.details;
        }
      }
    });

    return results;
  }

  /**
   * Resets the pipeline to initial state
   */
  reset(): void {
    if (this.isRunning) {
      throw new Error('Cannot reset pipeline while running');
    }
    
    const oldId = this.pipeline.id;
    this.pipeline = createOptimizationPipeline(oldId);
    
    // Clear stored updates
    PipelineManager.globalUpdates.set(oldId, []);
  }

  /**
   * Cleanup method to remove instance from global registry
   */
  destroy(): void {
    PipelineManager.instances.delete(this.pipeline.id);
    PipelineManager.globalUpdates.delete(this.pipeline.id);
    this.removeAllListeners();
  }

  /**
   * Gets the current running stage
   */
  getCurrentStage(): StageId | null {
    const runningStage = Object.entries(this.pipeline.stages).find(
      ([_, stage]) => stage.status === PipelineStageStatus.RUNNING
    );
    
    return runningStage ? runningStage[0] as StageId : null;
  }

  /**
   * Checks if pipeline is currently running
   */
  isExecuting(): boolean {
    return this.isRunning;
  }

  /**
   * Creates a pipeline update object for external communication
   */
  createUpdate(stageId: StageId): PipelineUpdate {
    const stage = this.pipeline.stages[stageId];
    return createPipelineUpdate(
      stageId,
      stage.status,
      stage.progress,
      stage.details,
      stage.error,
      stage.metadata
    );
  }

  /**
   * Creates a progress update object for external communication
   */
  createProgressUpdate(stageId: StageId): ProgressUpdate {
    const stage = this.pipeline.stages[stageId];
    return createProgressUpdate(
      stageId,
      stage.progress || 0,
      stage.details,
      stage.metadata
    );
  }
}