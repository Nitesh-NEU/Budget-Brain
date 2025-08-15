/**
 * PipelineFlowVisualizer Demo Component
 * 
 * Demonstrates the PipelineFlowVisualizer with mock data and different states
 */

"use client";
import React, { useState, useEffect } from 'react';
import PipelineFlowVisualizer from './PipelineFlowVisualizer';
import { 
  PipelineStage, 
  PipelineStageStatus, 
  OptimizationPipeline,
  PipelineStatus,
  PIPELINE_STAGE_CONFIG 
} from '@/types/pipeline';
import { 
  createRealisticPipelineSimulation,
  completeStageAndProgress,
  autoProgressPipeline,
  getNextAvailableStages,
  calculateOverallProgress
} from '@/lib/pipelineStageManager';

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

const createMockPipeline = (scenario: 'idle' | 'running' | 'completed' | 'error'): OptimizationPipeline => {
  switch (scenario) {
    case 'running':
      return createRealisticPipelineSimulation('mid-progress');
    case 'completed':
      return createRealisticPipelineSimulation('completed');
    case 'error':
      return createRealisticPipelineSimulation('failed');
    default:
      return createRealisticPipelineSimulation('starting');
  }
};

export const PipelineFlowVisualizerDemo: React.FC = () => {
  const [scenario, setScenario] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [pipeline, setPipeline] = useState<OptimizationPipeline>(createMockPipeline('idle'));
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  useEffect(() => {
    setPipeline(createMockPipeline(scenario));
  }, [scenario]);

  // Simulate real-time updates for running scenario
  useEffect(() => {
    if (scenario !== 'running') return;

    const interval = setInterval(() => {
      setPipeline(prev => {
        // Find the current running stage
        const runningStage = Object.entries(prev.stages).find(
          ([_, stage]) => stage.status === PipelineStageStatus.RUNNING
        );
        
        if (!runningStage) {
          // No running stage, try to start next available stages
          return autoProgressPipeline(prev);
        }
        
        const [stageId, stage] = runningStage;
        const currentProgress = stage.progress || 0;
        
        if (currentProgress < 100) {
          // Update progress
          const progressIncrement = Math.random() * 15 + 5; // 5-20% increment
          const newProgress = Math.min(100, currentProgress + progressIncrement);
          
          const updatedPipeline = {
            ...prev,
            stages: {
              ...prev.stages,
              [stageId]: {
                ...stage,
                progress: newProgress,
                details: `${stage.name} in progress... ${Math.round(newProgress)}% complete`
              }
            }
          };
          
          // If stage reaches 100%, complete it and start next stages
          if (newProgress >= 100) {
            return completeStageAndProgress(
              updatedPipeline, 
              stageId as any, 
              undefined, 
              `${stage.name} completed successfully`
            );
          }
          
          return updatedPipeline;
        }
        
        return prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [scenario]);

  const handleStageClick = (stageId: string) => {
    setSelectedStage(stageId);
    console.log('Stage clicked:', stageId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Pipeline Flow Visualizer Demo</h2>
        
        {/* Scenario Controls */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Demo Scenario:</label>
          <div className="flex flex-wrap gap-2">
            {(['idle', 'running', 'completed', 'error'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  scenario === s
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Visualizer */}
        <PipelineFlowVisualizer
          pipeline={pipeline}
          currentStage={pipeline.currentStage}
          onStageClick={handleStageClick}
        />

        {/* Debug Info */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded text-sm">
          <h3 className="font-medium mb-2">Debug Information:</h3>
          <div className="space-y-1 text-xs font-mono">
            <div>Scenario: {scenario}</div>
            <div>Pipeline Status: {pipeline.status}</div>
            <div>Current Stage: {pipeline.currentStage || 'none'}</div>
            <div>Completed: {pipeline.completedStages.length} / {Object.keys(pipeline.stages).length}</div>
            <div>Failed: {pipeline.failedStages.length}</div>
            <div>Overall Progress: {calculateOverallProgress(pipeline).toFixed(1)}%</div>
            <div>Selected Stage: {selectedStage || 'none'}</div>
            <div>Next Available: {getNextAvailableStages(pipeline).join(', ') || 'none'}</div>
            {pipeline.totalDuration && (
              <div>Total Duration: {(pipeline.totalDuration / 1000).toFixed(2)}s</div>
            )}
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Usage Examples</h3>
        
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium">Basic Usage:</h4>
            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
{`<PipelineFlowVisualizer
  pipeline={optimizationPipeline}
  onStageClick={(stageId) => console.log('Clicked:', stageId)}
/>`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium">With Custom Stages:</h4>
            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
{`<PipelineFlowVisualizer
  stages={customStages}
  currentStage="dataFetch"
  onStageClick={handleStageSelection}
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineFlowVisualizerDemo;