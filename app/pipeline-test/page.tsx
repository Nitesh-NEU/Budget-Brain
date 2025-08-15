/**
 * Pipeline Stage Progression Test Page
 * 
 * This page demonstrates the correct sequential progression of pipeline stages
 * and helps debug issues with Bayesian and Gradient Optimization stages.
 */

"use client";
import React, { useState, useEffect } from 'react';
import PipelineFlowVisualizer from '@/components/PipelineFlowVisualizer';
import { 
  createRealisticPipelineSimulation,
  completeStageAndProgress,
  autoProgressPipeline,
  getNextAvailableStages,
  calculateOverallProgress,
  STAGE_EXECUTION_ORDER
} from '@/lib/pipelineStageManager';
import { OptimizationPipeline, PipelineStageStatus, StageId } from '@/types/pipeline';

export default function PipelineTestPage() {
  const [pipeline, setPipeline] = useState<OptimizationPipeline>(
    createRealisticPipelineSimulation('starting')
  );
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

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
          const nextAvailable = getNextAvailableStages(nextPipeline);
          
          if (nextAvailable.length > 0) {
            addLog(`Started stage: ${nextAvailable[0]}`);
          } else if (nextPipeline.status === 'completed') {
            addLog('Pipeline completed successfully!');
            setIsAutoRunning(false);
          }
          
          return nextPipeline;
        }

        const [stageId, stage] = runningStage;
        const currentProgress = stage.progress || 0;

        if (currentProgress < 100) {
          // Increment progress
          const increment = Math.random() * 25 + 15; // 15-40% per tick
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
            addLog(`Completed stage: ${stageId}`);
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
    }, 800);

    return () => clearInterval(interval);
  }, [isAutoRunning]);

  const handleReset = () => {
    setIsAutoRunning(false);
    setPipeline(createRealisticPipelineSimulation('starting'));
    setSelectedStage(null);
    setLog([]);
    addLog('Pipeline reset to starting state');
  };

  const handleStartStop = () => {
    setIsAutoRunning(!isAutoRunning);
    addLog(isAutoRunning ? 'Auto-run stopped' : 'Auto-run started');
  };

  const handleStageClick = (stageId: string) => {
    setSelectedStage(stageId);
    addLog(`Selected stage: ${stageId}`);
  };

  const handleCompleteStage = (stageId: StageId) => {
    setPipeline(prev => {
      const result = completeStageAndProgress(prev, stageId, undefined, `${stageId} manually completed`);
      addLog(`Manually completed stage: ${stageId}`);
      return result;
    });
  };

  const handleStartStage = (stageId: StageId) => {
    setPipeline(prev => {
      const canStart = getNextAvailableStages(prev).includes(stageId);
      if (!canStart) {
        addLog(`Cannot start ${stageId} - dependencies not met`);
        return prev;
      }
      
      const updatedPipeline = {
        ...prev,
        stages: {
          ...prev.stages,
          [stageId]: {
            ...prev.stages[stageId],
            status: PipelineStageStatus.RUNNING,
            startTime: Date.now(),
            progress: 0,
            details: `${prev.stages[stageId].name} started manually`
          }
        },
        currentStage: stageId
      };
      
      addLog(`Manually started stage: ${stageId}`);
      return updatedPipeline;
    });
  };

  const getStageStatusColor = (status: PipelineStageStatus): string => {
    switch (status) {
      case PipelineStageStatus.COMPLETED:
        return 'text-green-600 bg-green-50';
      case PipelineStageStatus.RUNNING:
        return 'text-blue-600 bg-blue-50';
      case PipelineStageStatus.ERROR:
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const nextAvailable = getNextAvailableStages(pipeline);

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <header className="rounded-2xl p-6 bg-gradient-to-r from-green-600 to-blue-500 text-white shadow">
        <h1 className="text-2xl md:text-3xl font-bold">Pipeline Stage Progression Test</h1>
        <p className="opacity-90">Debug and test the sequential progression of optimization pipeline stages</p>
      </header>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Pipeline Controls</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Test the automatic progression of pipeline stages
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

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {calculateOverallProgress(pipeline).toFixed(1)}%
            </div>
            <div className="text-sm text-blue-600">Progress</div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {pipeline.completedStages.length}
            </div>
            <div className="text-sm text-green-600">Completed</div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {Object.values(pipeline.stages).filter(s => s.status === PipelineStageStatus.RUNNING).length}
            </div>
            <div className="text-sm text-yellow-600">Running</div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {nextAvailable.length}
            </div>
            <div className="text-sm text-purple-600">Available</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-600">
              {pipeline.failedStages.length}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
      </div>

      {/* Stage Details and Controls */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Stage Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Stage Controls</h3>
          
          <div className="space-y-3">
            {STAGE_EXECUTION_ORDER.map(stageId => {
              const stage = pipeline.stages[stageId];
              const canStart = nextAvailable.includes(stageId);
              const canComplete = stage.status === PipelineStageStatus.RUNNING;
              
              return (
                <div key={stageId} className={`border rounded-lg p-3 ${getStageStatusColor(stage.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{stage.name}</h4>
                    <span className="text-xs font-medium px-2 py-1 rounded">
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
                  
                  <div className="flex gap-2">
                    {canStart && (
                      <button
                        onClick={() => handleStartStage(stageId)}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        Start
                      </button>
                    )}
                    
                    {canComplete && (
                      <button
                        onClick={() => handleCompleteStage(stageId)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                  
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
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Pipeline State</h4>
              <div className="space-y-1 text-sm font-mono bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div>Status: <span className="text-blue-600">{pipeline.status}</span></div>
                <div>Current: <span className="text-blue-600">{pipeline.currentStage || 'none'}</span></div>
                <div>Completed: <span className="text-green-600">{pipeline.completedStages.join(', ') || 'none'}</span></div>
                <div>Failed: <span className="text-red-600">{pipeline.failedStages.join(', ') || 'none'}</span></div>
                <div>Auto-Running: <span className={isAutoRunning ? 'text-green-600' : 'text-gray-600'}>{isAutoRunning ? 'Yes' : 'No'}</span></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Next Available Stages</h4>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                {nextAvailable.length > 0 ? (
                  <div className="space-y-1">
                    {nextAvailable.map(stageId => (
                      <div key={stageId} className="text-sm font-mono text-blue-600">
                        {stageId} - {pipeline.stages[stageId].name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">No stages available to start</div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Activity Log</h4>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded h-48 overflow-y-auto">
                {log.length > 0 ? (
                  <div className="space-y-1">
                    {log.map((entry, i) => (
                      <div key={i} className="text-xs font-mono text-gray-600">
                        {entry}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">No activity yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expected Behavior */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Expected Pipeline Behavior</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Sequential Stages</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Data Fetch (starts immediately)</li>
              <li>Validation (after Data Fetch completes)</li>
              <li>Ensemble Optimization (after Validation completes)</li>
              <li><strong>Bayesian Optimization</strong> (after Validation completes)</li>
              <li><strong>Gradient Optimization</strong> (after Validation completes)</li>
              <li>Confidence Scoring (after all optimization stages complete)</li>
              <li>Benchmark Validation (after Confidence Scoring)</li>
              <li>LLM Validation (after Confidence Scoring)</li>
              <li>Final Selection (after both validations complete)</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Key Points</h4>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Bayesian and Gradient Optimization can start after Validation</li>
              <li>They don&apos;t need to wait for Ensemble Optimization</li>
              <li>Multiple stages can run in parallel (optimization stages)</li>
              <li>Dependencies are properly managed by the stage manager</li>
              <li>Each stage progresses from Pending → Running → Completed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="text-center">
        <a 
          href="/" 
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          ← Back to Budget Optimizer
        </a>
      </div>
    </main>
  );
}