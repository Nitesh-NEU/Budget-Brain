/**
 * Pipeline Progress Demo
 * 
 * Interactive demo showing proper pipeline stage progression
 */

"use client";
import React, { useState, useEffect } from 'react';
import PipelineFlowVisualizer from './PipelineFlowVisualizer';
import RealTimePipelineStatus from './RealTimePipelineStatus';
import { 
  createRealisticPipelineSimulation,
  completeStageAndProgress,
  autoProgressPipeline,
  getNextAvailableStages,
  calculateOverallProgress,
  STAGE_EXECUTION_ORDER
} from '@/lib/pipelineStageManager';
import { OptimizationPipeline, PipelineStageStatus, StageId } from '@/types/pipeline';

export const PipelineProgressDemo: React.FC = () => {
  const [pipeline, setPipeline] = useState<OptimizationPipeline>(
    createRealisticPipelineSimulation('starting')
  );
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  // Auto-run simulation
  useEffect(() => {
    if (!isAutoRunning) return;

    const interval = setInterval(() => {
      setPipeline(prev => {
        // Find running stage
        const runningStage = Object.entries(prev.stages).find(
          ([_, stage]) => stage.status === PipelineStageStatus.RUNNING
        );

        if (!runningStage) {
          // No running stage, try to start next
          const nextPipeline = autoProgressPipeline(prev);
          if (JSON.stringify(nextPipeline) === JSON.stringify(prev)) {
            // No changes, pipeline might be complete
            setIsAutoRunning(false);
          }
          return nextPipeline;
        }

        const [stageId, stage] = runningStage;
        const currentProgress = stage.progress || 0;

        if (currentProgress < 100) {
          // Increment progress
          const increment = Math.random() * 20 + 10; // 10-30% per tick
          const newProgress = Math.min(100, currentProgress + increment);

          const updatedPipeline = {
            ...prev,
            stages: {
              ...prev.stages,
              [stageId]: {
                ...stage,
                progress: newProgress,
                details: `${stage.name} running... ${Math.round(newProgress)}% complete`
              }
            }
          };

          // Complete stage if it reaches 100%
          if (newProgress >= 100) {
            return completeStageAndProgress(
              updatedPipeline,
              stageId as StageId,
              undefined,
              `${stage.name} completed successfully`
            );
          }

          return updatedPipeline;
        }

        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoRunning]);

  const handleReset = () => {
    setIsAutoRunning(false);
    setPipeline(createRealisticPipelineSimulation('starting'));
    setSelectedStage(null);
  };

  const handleStartStop = () => {
    setIsAutoRunning(!isAutoRunning);
  };

  const handleStageClick = (stageId: string) => {
    setSelectedStage(stageId);
  };

  const handleCompleteStage = (stageId: StageId) => {
    setPipeline(prev => 
      completeStageAndProgress(prev, stageId, undefined, `${stageId} manually completed`)
    );
  };

  const getStageStatusColor = (status: PipelineStageStatus): string => {
    switch (status) {
      case PipelineStageStatus.COMPLETED:
        return 'text-green-600';
      case PipelineStageStatus.RUNNING:
        return 'text-blue-600';
      case PipelineStageStatus.ERROR:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Pipeline Progress Demo</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Interactive demonstration of proper pipeline stage progression
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleStartStop}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                isAutoRunning
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isAutoRunning ? 'Stop' : 'Start'} Auto-Run
            </button>
            
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-500 text-white rounded font-medium hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Pipeline Visualizer */}
        <PipelineFlowVisualizer
          pipeline={pipeline}
          currentStage={pipeline.currentStage}
          onStageClick={handleStageClick}
        />

        {/* Pipeline Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {calculateOverallProgress(pipeline).toFixed(1)}%
            </div>
            <div className="text-sm text-blue-600">Overall Progress</div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {pipeline.completedStages.length}
            </div>
            <div className="text-sm text-green-600">Completed Stages</div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {Object.values(pipeline.stages).filter(s => s.status === PipelineStageStatus.RUNNING).length}
            </div>
            <div className="text-sm text-yellow-600">Running Stages</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {getNextAvailableStages(pipeline).length}
            </div>
            <div className="text-sm text-gray-600">Available Next</div>
          </div>
        </div>
      </div>

      {/* Stage Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Stage Controls</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STAGE_EXECUTION_ORDER.map(stageId => {
            const stage = pipeline.stages[stageId];
            const canComplete = stage.status === PipelineStageStatus.RUNNING || 
                               stage.status === PipelineStageStatus.PENDING;
            
            return (
              <div key={stageId} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{stage.name}</h4>
                  <span className={`text-xs font-medium ${getStageStatusColor(stage.status)}`}>
                    {stage.status.toUpperCase()}
                  </span>
                </div>
                
                {stage.progress !== undefined && stage.progress > 0 && (
                  <div className="mb-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stage.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{Math.round(stage.progress)}%</div>
                  </div>
                )}
                
                {canComplete && (
                  <button
                    onClick={() => handleCompleteStage(stageId)}
                    className="w-full px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Complete Stage
                  </button>
                )}
                
                {stage.details && (
                  <p className="text-xs text-gray-600 mt-2 truncate" title={stage.details}>
                    {stage.details}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Debug Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Pipeline State</h4>
            <div className="space-y-1 text-sm font-mono">
              <div>Status: <span className="text-blue-600">{pipeline.status}</span></div>
              <div>Current Stage: <span className="text-blue-600">{pipeline.currentStage || 'none'}</span></div>
              <div>Completed: <span className="text-green-600">{pipeline.completedStages.join(', ') || 'none'}</span></div>
              <div>Failed: <span className="text-red-600">{pipeline.failedStages.join(', ') || 'none'}</span></div>
              <div>Auto-Running: <span className={isAutoRunning ? 'text-green-600' : 'text-gray-600'}>{isAutoRunning ? 'Yes' : 'No'}</span></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Next Available Stages</h4>
            <div className="space-y-1 text-sm">
              {getNextAvailableStages(pipeline).length > 0 ? (
                getNextAvailableStages(pipeline).map(stageId => (
                  <div key={stageId} className="text-blue-600 font-mono">
                    {stageId}
                  </div>
                ))
              ) : (
                <div className="text-gray-600">No stages available to start</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineProgressDemo;