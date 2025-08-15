'use client';

import React, { useState, useCallback } from 'react';
import { VisualizationProvider } from '@/lib/visualizationContext';
import { RealTimePipelineStatus } from './RealTimePipelineStatus';
import { PipelineManager } from '@/lib/pipelineManager';
import { PipelineStageStatus, StageId } from '@/types/pipeline';
import { createOptimizationPipeline } from '@/lib/pipelineUtils';

export function RealTimePipelineStatusDemo() {
  const [pipelineManager, setPipelineManager] = useState<PipelineManager | null>(null);
  const [currentPipelineId, setCurrentPipelineId] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);

  // Create a new pipeline
  const createNewPipeline = useCallback(() => {
    const newPipeline = createOptimizationPipeline();
    const manager = new PipelineManager(newPipeline.id);
    setPipelineManager(manager);
    setCurrentPipelineId(newPipeline.id);
  }, []);

  // Simulate pipeline execution with real-time updates
  const simulatePipelineExecution = useCallback(async () => {
    if (!pipelineManager || isSimulating) return;

    setIsSimulating(true);

    const stages: StageId[] = [
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

    try {
      for (const stageId of stages) {
        // Start stage
        pipelineManager.updateStage(stageId, {
          status: PipelineStageStatus.RUNNING,
          progress: 0
        });

        // Simulate progress updates
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 200));
          
          pipelineManager.updateProgress(stageId, progress, 
            `Processing ${stageId}... ${progress}% complete`
          );
        }

        // Complete stage
        await new Promise(resolve => setTimeout(resolve, 300));
        pipelineManager.updateStage(stageId, {
          status: PipelineStageStatus.COMPLETED,
          progress: 100,
          details: `${stageId} completed successfully`
        });
      }
    } catch (error) {
      console.error('Pipeline simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  }, [pipelineManager, isSimulating]);

  // Simulate a stage failure
  const simulateStageFailure = useCallback(() => {
    if (!pipelineManager) return;

    pipelineManager.updateStage('bayesianOptimization', {
      status: PipelineStageStatus.ERROR,
      error: 'Simulated optimization failure - insufficient data'
    });
  }, [pipelineManager]);

  // Reset pipeline
  const resetPipeline = useCallback(() => {
    if (pipelineManager) {
      pipelineManager.reset();
    }
  }, [pipelineManager]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Real-Time Pipeline Updates Demo
        </h2>
        
        <p className="text-gray-600 mb-6">
          This demo shows real-time pipeline status updates using Server-Sent Events (SSE) 
          and WebSocket connections. Create a pipeline and simulate execution to see live updates.
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={createNewPipeline}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create New Pipeline
          </button>
          
          <button
            onClick={simulatePipelineExecution}
            disabled={!pipelineManager || isSimulating}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSimulating ? 'Simulating...' : 'Simulate Execution'}
          </button>
          
          <button
            onClick={simulateStageFailure}
            disabled={!pipelineManager || isSimulating}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Simulate Failure
          </button>
          
          <button
            onClick={resetPipeline}
            disabled={!pipelineManager || isSimulating}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Reset Pipeline
          </button>
        </div>

        {currentPipelineId && (
          <div className="bg-gray-50 rounded-md p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Current Pipeline</h3>
            <p className="text-sm text-gray-600 font-mono">{currentPipelineId}</p>
          </div>
        )}
      </div>

      {pipelineManager && currentPipelineId && (
        <VisualizationProvider initialPipeline={pipelineManager.getPipeline()}>
          <RealTimePipelineStatus
            pipelineId={currentPipelineId}
            autoConnect={true}
            showConnectionStatus={true}
            showLastUpdate={true}
          />
        </VisualizationProvider>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Real-Time Features
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">
              Server-Sent Events (SSE)
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Automatic reconnection on connection loss</li>
              <li>• Heartbeat to keep connection alive</li>
              <li>• Real-time stage progress updates</li>
              <li>• Pipeline event notifications</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">
              WebSocket Fallback
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Bi-directional communication</li>
              <li>• Lower latency updates</li>
              <li>• Automatic fallback to SSE if unavailable</li>
              <li>• Connection status monitoring</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            Note about WebSocket Implementation
          </h4>
          <p className="text-sm text-yellow-700">
            The WebSocket endpoint is currently a placeholder. For production use, 
            you would need to implement a proper WebSocket server using libraries 
            like 'ws' or integrate with a WebSocket service provider.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RealTimePipelineStatusDemo;