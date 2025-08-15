/**
 * PipelineFlowVisualizer Component
 * 
 * Interactive horizontal flow diagram showing optimization pipeline stages
 * with animated progress indicators and responsive design.
 */

"use client";
import React, { useState, useEffect } from 'react';
import { 
  PipelineStage, 
  PipelineStageStatus, 
  OptimizationPipeline,
  PIPELINE_STAGE_CONFIG 
} from '@/types/pipeline';

interface PipelineFlowVisualizerProps {
  pipeline?: OptimizationPipeline;
  stages?: PipelineStage[];
  currentStage?: string;
  onStageClick?: (stageId: string) => void;
  className?: string;
}

interface StageDisplayInfo {
  id: string;
  name: string;
  shortName: string;
  status: PipelineStageStatus;
  progress: number;
  duration?: number;
  details?: string;
  error?: string;
}

const getStageDisplayInfo = (stage: PipelineStage): StageDisplayInfo => {
  const config = Object.values(PIPELINE_STAGE_CONFIG).find(c => c.id === stage.id);
  const shortName = config?.name.split(' ').map(word => word.charAt(0)).join('') || stage.name.substring(0, 2).toUpperCase();
  
  return {
    id: stage.id,
    name: stage.name,
    shortName,
    status: stage.status,
    progress: stage.progress || 0,
    duration: stage.duration,
    details: stage.details,
    error: stage.error
  };
};

const getStatusColor = (status: PipelineStageStatus): string => {
  switch (status) {
    case PipelineStageStatus.PENDING:
      return 'bg-gray-200 text-gray-600 border-gray-300';
    case PipelineStageStatus.RUNNING:
      return 'bg-blue-100 text-blue-700 border-blue-300 animate-pulse';
    case PipelineStageStatus.COMPLETED:
      return 'bg-green-100 text-green-700 border-green-300';
    case PipelineStageStatus.ERROR:
      return 'bg-red-100 text-red-700 border-red-300';
    default:
      return 'bg-gray-200 text-gray-600 border-gray-300';
  }
};

const getStatusIcon = (status: PipelineStageStatus): React.ReactNode => {
  switch (status) {
    case PipelineStageStatus.PENDING:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
        </svg>
      );
    case PipelineStageStatus.RUNNING:
      return (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      );
    case PipelineStageStatus.COMPLETED:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      );
    case PipelineStageStatus.ERROR:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    default:
      return null;
  }
};

const ProgressBar: React.FC<{ progress: number; status: PipelineStageStatus }> = ({ progress, status }) => {
  if (status === PipelineStageStatus.PENDING) return null;
  
  const progressColor = status === PipelineStageStatus.ERROR ? 'bg-red-500' : 
                       status === PipelineStageStatus.COMPLETED ? 'bg-green-500' : 'bg-blue-500';
  
  return (
    <div className="w-full h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
      <div 
        className={`h-full ${progressColor} transition-all duration-300 ease-out`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};

const StageConnector: React.FC<{ fromStatus: PipelineStageStatus; toStatus: PipelineStageStatus }> = ({ 
  fromStatus, 
  toStatus 
}) => {
  const isActive = fromStatus === PipelineStageStatus.COMPLETED || 
                   (fromStatus === PipelineStageStatus.RUNNING && toStatus !== PipelineStageStatus.PENDING);
  
  return (
    <div className="flex-1 flex items-center px-2">
      <div className={`h-0.5 w-full transition-colors duration-300 ${
        isActive ? 'bg-blue-300' : 'bg-gray-200'
      }`} />
      <div className={`w-2 h-2 rounded-full ml-1 transition-colors duration-300 ${
        isActive ? 'bg-blue-400' : 'bg-gray-300'
      }`} />
    </div>
  );
};

const StageCard: React.FC<{
  stage: StageDisplayInfo;
  isSelected: boolean;
  onClick: () => void;
  isMobile: boolean;
}> = ({ stage, isSelected, onClick, isMobile }) => {
  const statusColor = getStatusColor(stage.status);
  const statusIcon = getStatusIcon(stage.status);
  
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onClick}
        className={`
          relative p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md
          ${statusColor}
          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
          ${isMobile ? 'min-w-[60px]' : 'min-w-[80px]'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        aria-label={`${stage.name} - ${stage.status}`}
      >
        <div className="flex flex-col items-center space-y-1">
          {statusIcon}
          <span className={`text-xs font-medium ${isMobile ? 'text-[10px]' : ''}`}>
            {isMobile ? stage.shortName : stage.name}
          </span>
        </div>
        
        {stage.status === PipelineStageStatus.RUNNING && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
        )}
      </button>
      
      <ProgressBar progress={stage.progress} status={stage.status} />
      
      {stage.duration && (
        <span className="text-xs text-gray-500 mt-1">
          {(stage.duration / 1000).toFixed(1)}s
        </span>
      )}
    </div>
  );
};

const StageDetails: React.FC<{ stage: StageDisplayInfo; onClose: () => void; isMobile: boolean }> = ({ stage, onClose, isMobile }) => {
  if (isMobile) {
    return (
      <>
        {/* Mobile overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
        {/* Mobile bottom sheet */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
          <div className="p-4">
            {/* Handle bar */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{stage.name}</h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close details"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">{stage.name}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close details"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <span className="font-medium">Status:</span>
          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(stage.status)}`}>
            {stage.status}
          </span>
        </div>
        
        {stage.progress > 0 && (
          <div className="flex items-center space-x-2">
            <span className="font-medium">Progress:</span>
            <span>{stage.progress.toFixed(1)}%</span>
          </div>
        )}
        
        {stage.duration && (
          <div className="flex items-center space-x-2">
            <span className="font-medium">Duration:</span>
            <span>{(stage.duration / 1000).toFixed(2)} seconds</span>
          </div>
        )}
        
        {stage.details && (
          <div>
            <span className="font-medium">Details:</span>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{stage.details}</p>
          </div>
        )}
        
        {stage.error && (
          <div>
            <span className="font-medium text-red-600">Error:</span>
            <p className="text-red-600 mt-1">{stage.error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const PipelineFlowVisualizer: React.FC<PipelineFlowVisualizerProps> = ({
  pipeline,
  stages: propStages,
  currentStage,
  onStageClick,
  className = ''
}) => {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Determine stages from either pipeline or direct stages prop
  const stages = propStages || (pipeline ? Object.values(pipeline.stages) : []);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Auto-select current stage
  useEffect(() => {
    if (currentStage && !selectedStage) {
      setSelectedStage(currentStage);
    }
  }, [currentStage, selectedStage]);
  
  const handleStageClick = (stageId: string) => {
    setSelectedStage(selectedStage === stageId ? null : stageId);
    onStageClick?.(stageId);
  };
  
  if (stages.length === 0) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        <div className="flex flex-col items-center space-y-2">
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>No pipeline stages available</p>
        </div>
      </div>
    );
  }
  
  const stageDisplays = stages.map(getStageDisplayInfo);
  const selectedStageData = selectedStage ? stageDisplays.find(s => s.id === selectedStage) : null;
  
  return (
    <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Optimization Pipeline
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track the progress of your budget optimization
        </p>
      </div>
      
      {/* Pipeline Flow */}
      <div className="overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-max pb-4">
          {stageDisplays.map((stage, index) => (
            <React.Fragment key={stage.id}>
              <StageCard
                stage={stage}
                isSelected={selectedStage === stage.id}
                onClick={() => handleStageClick(stage.id)}
                isMobile={isMobile}
              />
              {index < stageDisplays.length - 1 && (
                <StageConnector
                  fromStatus={stage.status}
                  toStatus={stageDisplays[index + 1].status}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Stage Details */}
      {selectedStageData && (
        <StageDetails
          stage={selectedStageData}
          onClose={() => setSelectedStage(null)}
          isMobile={isMobile}
        />
      )}
      
      {/* Pipeline Summary */}
      {pipeline && (
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">Pipeline Status:</span>
            <span className={`px-2 py-1 rounded text-xs ${
              pipeline.status === 'completed' ? 'bg-green-100 text-green-700' :
              pipeline.status === 'error' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {pipeline.status}
            </span>
          </div>
          
          {pipeline.totalDuration && (
            <div className="flex items-center justify-between mt-1">
              <span>Total Duration:</span>
              <span>{(pipeline.totalDuration / 1000).toFixed(2)}s</span>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-1">
            <span>Completed Stages:</span>
            <span>{pipeline.completedStages.length} / {Object.keys(pipeline.stages).length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineFlowVisualizer;