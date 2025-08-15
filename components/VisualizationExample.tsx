'use client';

import React from 'react';
import { 
  VisualizationProvider, 
  useVisualization,
  usePipeline 
} from '../lib/visualizationContext';
import { 
  useVisualizationPanels as usePanelHooks,
  PANEL_IDS 
} from '../lib/hooks/useVisualizationPanels';
import { OptimizationPipeline, PipelineStageStatus, PipelineStatus } from '../types/pipeline';

// Example component that demonstrates the visualization state management
function VisualizationExampleContent() {
  const { pipeline, setPipeline, updateStage } = usePipeline();
  const { 
    expandedPanels, 
    isExpanded, 
    togglePanel, 
    expandAll, 
    collapseAll 
  } = usePanelHooks();
  const { state, actions } = useVisualization();
  const selectedStage = state.visualizationState.selectedStage;
  const setSelectedStage = actions.setSelectedStage;

  // Create a mock pipeline for demonstration
  const createMockPipeline = (): OptimizationPipeline => ({
    id: 'demo-pipeline',
    status: PipelineStatus.RUNNING,
    startTime: Date.now(),
    estimatedTotalDuration: 20000,
    stages: {
      dataFetch: {
        id: 'dataFetch',
        name: 'Data Fetching',
        status: PipelineStageStatus.COMPLETED,
        progress: 100
      },
      validation: {
        id: 'validation',
        name: 'Data Validation',
        status: PipelineStageStatus.RUNNING,
        progress: 60
      },
      ensembleOptimization: {
        id: 'ensembleOptimization',
        name: 'Ensemble Optimization',
        status: PipelineStageStatus.PENDING
      },
      bayesianOptimization: {
        id: 'bayesianOptimization',
        name: 'Bayesian Optimization',
        status: PipelineStageStatus.PENDING
      },
      gradientOptimization: {
        id: 'gradientOptimization',
        name: 'Gradient Optimization',
        status: PipelineStageStatus.PENDING
      },
      confidenceScoring: {
        id: 'confidenceScoring',
        name: 'Confidence Scoring',
        status: PipelineStageStatus.PENDING
      },
      benchmarkValidation: {
        id: 'benchmarkValidation',
        name: 'Benchmark Validation',
        status: PipelineStageStatus.PENDING
      },
      llmValidation: {
        id: 'llmValidation',
        name: 'LLM Validation',
        status: PipelineStageStatus.PENDING
      },
      finalSelection: {
        id: 'finalSelection',
        name: 'Final Selection',
        status: PipelineStageStatus.PENDING
      }
    },
    currentStage: 'validation',
    completedStages: ['dataFetch'],
    failedStages: []
  });

  const handleStartPipeline = () => {
    setPipeline(createMockPipeline());
  };

  const handleUpdateStage = (stageId: string) => {
    updateStage(stageId, {
      status: PipelineStageStatus.COMPLETED,
      progress: 100,
      endTime: Date.now()
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Visualization State Management Demo</h1>
      
      {/* Pipeline Controls */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Pipeline Controls</h2>
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleStartPipeline}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Start Mock Pipeline
          </button>
        </div>
        
        {pipeline && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Pipeline Status: {pipeline.status}</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(pipeline.stages).map(([stageId, stage]) => (
                <div
                  key={stageId}
                  className={`p-2 rounded text-sm cursor-pointer ${
                    stage.status === PipelineStageStatus.COMPLETED
                      ? 'bg-green-100 text-green-800'
                      : stage.status === PipelineStageStatus.RUNNING
                      ? 'bg-yellow-100 text-yellow-800'
                      : stage.status === PipelineStageStatus.ERROR
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-600'
                  } ${selectedStage === stageId ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedStage(stageId)}
                >
                  <div className="font-medium">{stage.name}</div>
                  <div className="text-xs">{stage.status}</div>
                  {stage.progress && (
                    <div className="text-xs">{stage.progress}%</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stage Selection Controls */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Stage Selection</h2>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => console.log('Previous stage')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Previous Stage
          </button>
          <button
            onClick={() => console.log('Next stage')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Next Stage
          </button>
          <button
            onClick={() => setSelectedStage(undefined)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Selection
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Selected Stage: {selectedStage || 'None'}
        </p>
      </div>

      {/* Panel Controls */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Panel Management</h2>
        <div className="flex gap-4 mb-4">
          <button
            onClick={expandAll}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Collapse All
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {Object.values(PANEL_IDS).map(panelId => (
            <div
              key={panelId}
              className={`p-3 border rounded cursor-pointer ${
                isExpanded(panelId) 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'bg-gray-50 border-gray-300'
              }`}
              onClick={() => togglePanel(panelId)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{panelId}</span>
                <span className="text-sm">
                  {isExpanded(panelId) ? '▼' : '▶'}
                </span>
              </div>
              {isExpanded(panelId) && (
                <div className="mt-2 text-sm text-gray-600">
                  Panel content for {panelId}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <p className="text-sm text-gray-600 mt-4">
          Expanded Panels: {expandedPanels.size} / {Object.keys(PANEL_IDS).length}
        </p>
      </div>
    </div>
  );
}

// Main component with provider
export default function VisualizationExample() {
  return (
    <VisualizationProvider>
      <VisualizationExampleContent />
    </VisualizationProvider>
  );
}