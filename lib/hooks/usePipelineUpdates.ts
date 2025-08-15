'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { PipelineUpdate, PipelineEvent, PipelineEventType, PipelineStageStatus } from '../../types/pipeline';
import { usePipeline } from '../visualizationContext';

// Configuration for real-time updates
export interface PipelineUpdatesConfig {
  enableRealTimeUpdates?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  updateInterval?: number;
}

// Default configuration
const DEFAULT_CONFIG: Required<PipelineUpdatesConfig> = {
  enableRealTimeUpdates: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  updateInterval: 1000
};

// Connection status
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// Hook return type
export interface UsePipelineUpdatesReturn {
  connectionStatus: ConnectionStatus;
  lastUpdate?: PipelineUpdate;
  connect: (pipelineId: string) => void;
  disconnect: () => void;
  reconnect: () => void;
}

/**
 * Custom hook for managing real-time pipeline updates
 * Supports both WebSocket and Server-Sent Events
 */
export function usePipelineUpdates(
  config: PipelineUpdatesConfig = {}
): UsePipelineUpdatesReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { processPipelineUpdate, setError } = usePipeline();
  
  // State for reactive connection status
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [lastUpdate, setLastUpdate] = useState<PipelineUpdate | undefined>(undefined);
  
  // Refs for managing connection state
  const eventSourceRef = useRef<EventSource | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const currentPipelineIdRef = useRef<string | null>(null);

  // Handle pipeline updates
  const handlePipelineUpdate = useCallback((update: PipelineUpdate) => {
    setLastUpdate(update);
    processPipelineUpdate(update);
  }, [processPipelineUpdate]);

  // Handle pipeline events
  const handlePipelineEvent = useCallback((event: PipelineEvent) => {
    switch (event.type) {
      case PipelineEventType.STAGE_STARTED:
      case PipelineEventType.STAGE_PROGRESS:
      case PipelineEventType.STAGE_COMPLETED:
      case PipelineEventType.STAGE_FAILED:
        if (event.stageId) {
          const update: PipelineUpdate = {
            stageId: event.stageId,
            status: event.type === PipelineEventType.STAGE_STARTED ? PipelineStageStatus.RUNNING :
                   event.type === PipelineEventType.STAGE_COMPLETED ? PipelineStageStatus.COMPLETED :
                   event.type === PipelineEventType.STAGE_FAILED ? PipelineStageStatus.ERROR : PipelineStageStatus.RUNNING,
            progress: event.data?.progress,
            details: event.data?.details,
            timestamp: event.timestamp,
            error: event.data?.error,
            metadata: event.data
          };
          handlePipelineUpdate(update);
        }
        break;
      
      case PipelineEventType.PIPELINE_COMPLETED:
      case PipelineEventType.PIPELINE_FAILED:
        // Handle pipeline completion/failure
        if (event.type === PipelineEventType.PIPELINE_FAILED) {
          setError(event.data?.error || 'Pipeline execution failed');
        }
        break;
    }
  }, [handlePipelineUpdate, setError]);

  // WebSocket connection management
  const connectWebSocket = useCallback((pipelineId: string) => {
    if (!finalConfig.enableRealTimeUpdates) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/pipeline/${pipelineId}/ws`;
      
      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;
      
      setConnectionStatus(ConnectionStatus.CONNECTING);

      ws.onopen = () => {
        setConnectionStatus(ConnectionStatus.CONNECTED);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pipeline_event') {
            handlePipelineEvent(data.event);
          } else if (data.type === 'pipeline_update') {
            handlePipelineUpdate(data.update);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus(ConnectionStatus.ERROR);
        setError('Real-time connection error');
      };

      ws.onclose = () => {
        setConnectionStatus(ConnectionStatus.DISCONNECTED);
        webSocketRef.current = null;
        
        // Attempt reconnection if within limits
        if (reconnectAttemptsRef.current < finalConfig.maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (currentPipelineIdRef.current) {
              connectWebSocket(currentPipelineIdRef.current);
            }
          }, finalConfig.reconnectInterval);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus(ConnectionStatus.ERROR);
    }
  }, [finalConfig, handlePipelineEvent, handlePipelineUpdate, setError]);

  // Server-Sent Events connection management
  const connectSSE = useCallback((pipelineId: string) => {
    if (!finalConfig.enableRealTimeUpdates) return;

    try {
      const sseUrl = `/api/pipeline/${pipelineId}/events`;
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;
      
      setConnectionStatus(ConnectionStatus.CONNECTING);

      eventSource.onopen = () => {
        setConnectionStatus(ConnectionStatus.CONNECTED);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pipeline_event') {
            handlePipelineEvent(data.event);
          } else if (data.type === 'pipeline_update') {
            handlePipelineUpdate(data.update);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setConnectionStatus(ConnectionStatus.ERROR);
        eventSource.close();
        eventSourceRef.current = null;
        
        // Attempt reconnection if within limits
        if (reconnectAttemptsRef.current < finalConfig.maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (currentPipelineIdRef.current) {
              connectSSE(currentPipelineIdRef.current);
            }
          }, finalConfig.reconnectInterval);
        }
      };
    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setConnectionStatus(ConnectionStatus.ERROR);
    }
  }, [finalConfig, handlePipelineEvent, handlePipelineUpdate]);

  // Main connect function - tries WebSocket first, falls back to SSE
  const connect = useCallback((pipelineId: string) => {
    currentPipelineIdRef.current = pipelineId;
    
    // Try WebSocket first
    if ('WebSocket' in window) {
      connectWebSocket(pipelineId);
    } else if ('EventSource' in window) {
      // Fallback to Server-Sent Events
      connectSSE(pipelineId);
    } else {
      console.warn('Neither WebSocket nor Server-Sent Events are supported');
      setConnectionStatus(ConnectionStatus.ERROR);
    }
  }, [connectWebSocket, connectSSE]);

  // Disconnect function
  const disconnect = useCallback(() => {
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }

    // Close EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConnectionStatus(ConnectionStatus.DISCONNECTED);
    currentPipelineIdRef.current = null;
    reconnectAttemptsRef.current = 0;
  }, []);

  // Reconnect function
  const reconnect = useCallback(() => {
    disconnect();
    if (currentPipelineIdRef.current) {
      setTimeout(() => {
        if (currentPipelineIdRef.current) {
          connect(currentPipelineIdRef.current);
        }
      }, 1000);
    }
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionStatus,
    lastUpdate,
    connect,
    disconnect,
    reconnect
  };
}

// Utility hook for polling-based updates (fallback when real-time is not available)
export function usePipelinePolling(
  pipelineId: string | null,
  interval: number = 2000
) {
  const { processPipelineUpdate, setError } = usePipeline();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = useCallback(() => {
    if (!pipelineId) return;

    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/pipeline/${pipelineId}/status`);
        if (response.ok) {
          const data = await response.json();
          if (data.updates && Array.isArray(data.updates)) {
            data.updates.forEach((update: PipelineUpdate) => {
              processPipelineUpdate(update);
            });
          }
        }
      } catch (error) {
        console.error('Error polling pipeline status:', error);
        setError('Failed to fetch pipeline status');
      }
    }, interval);
  }, [pipelineId, interval, processPipelineUpdate, setError]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (pipelineId) {
      startPolling();
    }
    
    return stopPolling;
  }, [pipelineId, startPolling, stopPolling]);

  return { startPolling, stopPolling };
}