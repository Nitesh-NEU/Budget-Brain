'use client';

import React, { useEffect, useState } from 'react';
import { usePipelineUpdates, ConnectionStatus } from '@/lib/hooks/usePipelineUpdates';
import { usePipeline } from '@/lib/visualizationContext';
import { PipelineStageStatus } from '@/types/pipeline';

interface RealTimePipelineStatusProps {
  pipelineId: string;
  autoConnect?: boolean;
  showConnectionStatus?: boolean;
  showLastUpdate?: boolean;
}

export function RealTimePipelineStatus({
  pipelineId,
  autoConnect = true,
  showConnectionStatus = true,
  showLastUpdate = true
}: RealTimePipelineStatusProps) {
  const { pipeline, isLoading, error } = usePipeline();
  const { connectionStatus, lastUpdate, connect, disconnect, reconnect } = usePipelineUpdates();
  const [isConnected, setIsConnected] = useState(false);

  // Auto-connect when component mounts
  useEffect(() => {
    if (autoConnect && pipelineId && !isConnected) {
      connect(pipelineId);
      setIsConnected(true);
    }

    return () => {
      if (isConnected) {
        disconnect();
        setIsConnected(false);
      }
    };
  }, [pipelineId, autoConnect, connect, disconnect, isConnected]);

  // Handle connection status changes
  useEffect(() => {
    if (connectionStatus === ConnectionStatus.DISCONNECTED && isConnected) {
      setIsConnected(false);
    } else if (connectionStatus === ConnectionStatus.CONNECTED && !isConnected) {
      setIsConnected(true);
    }
  }, [connectionStatus, isConnected]);

  const getConnectionStatusColor = (status: ConnectionStatus): string => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'text-green-600';
      case ConnectionStatus.CONNECTING:
        return 'text-yellow-600';
      case ConnectionStatus.ERROR:
        return 'text-red-600';
      case ConnectionStatus.DISCONNECTED:
      default:
        return 'text-gray-600';
    }
  };

  const getConnectionStatusIcon = (status: ConnectionStatus): string => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return '🟢';
      case ConnectionStatus.CONNECTING:
        return '🟡';
      case ConnectionStatus.ERROR:
        return '🔴';
      case ConnectionStatus.DISCONNECTED:
      default:
        return '⚪';
    }
  };

  const getStageStatusColor = (status: PipelineStageStatus): string => {
    switch (status) {
      case PipelineStageStatus.COMPLETED:
        return 'text-green-600';
      case PipelineStageStatus.RUNNING:
        return 'text-blue-600';
      case PipelineStageStatus.ERROR:
        return 'text-red-600';
      case PipelineStageStatus.PENDING:
      default:
        return 'text-gray-600';
    }
  };

  const handleManualConnect = () => {
    if (connectionStatus === ConnectionStatus.DISCONNECTED) {
      connect(pipelineId);
      setIsConnected(true);
    } else if (connectionStatus === ConnectionStatus.CONNECTED) {
      disconnect();
      setIsConnected(false);
    } else if (connectionStatus === ConnectionStatus.ERROR) {
      reconnect();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Real-Time Pipeline Status
        </h3>
        
        {showConnectionStatus && (
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${getConnectionStatusColor(connectionStatus)}`}>
              {getConnectionStatusIcon(connectionStatus)} {connectionStatus.toUpperCase()}
            </span>
            <button
              onClick={handleManualConnect}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {connectionStatus === ConnectionStatus.CONNECTED ? 'Disconnect' : 
               connectionStatus === ConnectionStatus.ERROR ? 'Retry' : 'Connect'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">Error: {error}</p>
        </div>
      )}

      {isLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-600">Loading pipeline...</p>
        </div>
      )}

      {pipeline && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(pipeline.stages).map(([stageId, stage]) => (
              <div
                key={stageId}
                className="p-3 bg-gray-50 rounded-md border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {stage.name}
                  </h4>
                  <span className={`text-xs font-medium ${getStageStatusColor(stage.status)}`}>
                    {stage.status.toUpperCase()}
                  </span>
                </div>
                
                {stage.progress !== undefined && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(stage.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stage.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {stage.details && (
                  <p className="text-xs text-gray-600 truncate" title={stage.details}>
                    {stage.details}
                  </p>
                )}
                
                {stage.error && (
                  <p className="text-xs text-red-600 truncate" title={stage.error}>
                    Error: {stage.error}
                  </p>
                )}
                
                {stage.duration && (
                  <p className="text-xs text-gray-500 mt-1">
                    Duration: {stage.duration}ms
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Pipeline ID: {pipeline.id}</span>
              <span>Status: {pipeline.status.toUpperCase()}</span>
            </div>
            
            {pipeline.totalDuration && (
              <div className="mt-2 text-sm text-gray-600">
                Total Duration: {pipeline.totalDuration}ms
              </div>
            )}
          </div>
        </div>
      )}

      {showLastUpdate && lastUpdate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Last Update</h4>
          <div className="bg-gray-50 rounded-md p-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium text-gray-700">Stage:</span>
                <span className="ml-1 text-gray-600">{lastUpdate.stageId}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`ml-1 ${getStageStatusColor(lastUpdate.status)}`}>
                  {lastUpdate.status.toUpperCase()}
                </span>
              </div>
              {lastUpdate.progress !== undefined && (
                <div>
                  <span className="font-medium text-gray-700">Progress:</span>
                  <span className="ml-1 text-gray-600">{Math.round(lastUpdate.progress)}%</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Time:</span>
                <span className="ml-1 text-gray-600">
                  {new Date(lastUpdate.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            {lastUpdate.details && (
              <div className="mt-2">
                <span className="font-medium text-gray-700 text-xs">Details:</span>
                <p className="text-xs text-gray-600 mt-1">{lastUpdate.details}</p>
              </div>
            )}
            
            {lastUpdate.error && (
              <div className="mt-2">
                <span className="font-medium text-red-700 text-xs">Error:</span>
                <p className="text-xs text-red-600 mt-1">{lastUpdate.error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RealTimePipelineStatus;