import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { usePipelineUpdates, usePipelinePolling, ConnectionStatus } from '../hooks/usePipelineUpdates';
import { VisualizationProvider } from '../visualizationContext';
import { PipelineEventType, PipelineStageStatus } from '../../types/pipeline';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  send(data: string) {
    // Mock send functionality
  }

  // Helper method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  // Helper method to simulate errors
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Mock EventSource
class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  readyState = MockEventSource.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }

  // Helper method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  // Helper method to simulate errors
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Mock global objects
const mockWebSocket = MockWebSocket as any;
const mockEventSource = MockEventSource as any;

Object.defineProperty(global, 'WebSocket', {
  value: mockWebSocket,
  writable: true
});

Object.defineProperty(global, 'EventSource', {
  value: mockEventSource,
  writable: true
});

// Mock fetch for polling
global.fetch = jest.fn();

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <VisualizationProvider>
    {children}
  </VisualizationProvider>
);

describe('usePipelineUpdates', () => {
  let mockWebSocketInstance: MockWebSocket;
  let mockEventSourceInstance: MockEventSource;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Capture instances when they're created
    const originalWebSocket = mockWebSocket;
    mockWebSocket.mockImplementation = function(url: string) {
      mockWebSocketInstance = new originalWebSocket(url);
      return mockWebSocketInstance;
    };

    const originalEventSource = mockEventSource;
    mockEventSource.mockImplementation = function(url: string) {
      mockEventSourceInstance = new originalEventSource(url);
      return mockEventSourceInstance;
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('WebSocket connection', () => {
    it('should establish WebSocket connection', async () => {
      const { result } = renderHook(() => usePipelineUpdates(), {
        wrapper: TestWrapper
      });

      act(() => {
        result.current.connect('test-pipeline-1');
      });

      // Fast-forward timers to simulate connection opening
      act(() => {
        jest.advanceTimersByTime(20);
      });

      expect(result.current.connectionStatus).toBe(ConnectionStatus.CONNECTED);
    });

    it('should handle WebSocket messages', async () => {
      const { result } = renderHook(() => usePipelineUpdates(), {
        wrapper: TestWrapper
      });

      act(() => {
        result.current.connect('test-pipeline-1');
      });

      act(() => {
        jest.advanceTimersByTime(20);
      });

      // Simulate receiving a pipeline update
      const updateMessage = {
        type: 'pipeline_update',
        update: {
          stageId: 'validation',
          status: PipelineStageStatus.COMPLETED,
          progress: 100,
          timestamp: Date.now()
        }
      };

      act(() => {
        mockWebSocketInstance.simulateMessage(updateMessage);
      });

      expect(result.current.lastUpdate).toMatchObject(updateMessage.update);
    });

    it('should handle WebSocket pipeline events', async () => {
      const { result } = renderHook(() => usePipelineUpdates(), {
        wrapper: TestWrapper
      });

      act(() => {
        result.current.connect('test-pipeline-1');
      });

      act(() => {
        jest.advanceTimersByTime(20);
      });

      // Simulate receiving a pipeline event
      const eventMessage = {
        type: 'pipeline_event',
        event: {
          type: PipelineEventType.STAGE_COMPLETED,
          pipelineId: 'test-pipeline-1',
          stageId: 'validation',
          timestamp: Date.now(),
          data: { progress: 100 }
        }
      };

      act(() => {
        mockWebSocketInstance.simulateMessage(eventMessage);
      });

      expect(result.current.lastUpdate?.stageId).toBe('validation');
      expect(result.current.lastUpdate?.status).toBe(PipelineStageStatus.COMPLETED);
    });

    it('should handle WebSocket errors', async () => {
      const { result } = renderHook(() => usePipelineUpdates(), {
        wrapper: TestWrapper
      });

      act(() => {
        result.current.connect('test-pipeline-1');
      });

      act(() => {
        jest.advanceTimersByTime(20);
      });

      act(() => {
        mockWebSocketInstance.simulateError();
      });

      expect(result.current.connectionStatus).toBe(ConnectionStatus.ERROR);
    });

    it('should attempt reconnection on WebSocket close', async () => {
      const { result } = renderHook(() => usePipelineUpdates({
        reconnectInterval: 1000,
        maxReconnectAttempts: 3
      }), {
        wrapper: TestWrapper
      });

      act(() => {
        result.current.connect('test-pipeline-1');
      });

      act(() => {
        jest.advanceTimersByTime(20);
      });

      // Simulate connection close
      act(() => {
        mockWebSocketInstance.close();
      });

      expect(result.current.connectionStatus).toBe(ConnectionStatus.DISCONNECTED);

      // Fast-forward to trigger reconnection
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should attempt to reconnect
      expect(mockWebSocket).toHaveBeenCalledTimes(2);
    });

    it('should disconnect WebSocket', async () => {
      const { result } = renderHook(() => usePipelineUpdates(), {
        wrapper: TestWrapper
      });

      act(() => {
        result.current.connect('test-pipeline-1');
      });

      act(() => {
        jest.advanceTimersByTime(20);
      });

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.connectionStatus).toBe(ConnectionStatus.DISCONNECTED);
    });
  });

  describe('Server-Sent Events fallback', () => {
    beforeEach(() => {
      // Disable WebSocket to test SSE fallback
      delete (global as any).WebSocket;
    });

    afterEach(() => {
      // Restore WebSocket
      (global as any).WebSocket = mockWebSocket;
    });

    it('should fall back to SSE when WebSocket is not available', async () => {
      const { result } = renderHook(() => usePipelineUpdates(), {
        wrapper: TestWrapper
      });

      act(() => {
        result.current.connect('test-pipeline-1');
      });

      act(() => {
        jest.advanceTimersByTime(20);
      });

      expect(result.current.connectionStatus).toBe(ConnectionStatus.CONNECTED);
      expect(mockEventSource).toHaveBeenCalledWith('/api/pipeline/test-pipeline-1/events');
    });

    it('should handle SSE messages', async () => {
      const { result } = renderHook(() => usePipelineUpdates(), {
        wrapper: TestWrapper
      });

      act(() => {
        result.current.connect('test-pipeline-1');
      });

      act(() => {
        jest.advanceTimersByTime(20);
      });

      const updateMessage = {
        type: 'pipeline_update',
        update: {
          stageId: 'bayesianOptimization',
          status: PipelineStageStatus.RUNNING,
          progress: 50,
          timestamp: Date.now()
        }
      };

      act(() => {
        mockEventSourceInstance.simulateMessage(updateMessage);
      });

      expect(result.current.lastUpdate).toMatchObject(updateMessage.update);
    });
  });

  describe('Configuration', () => {
    it('should respect enableRealTimeUpdates setting', () => {
      const { result } = renderHook(() => usePipelineUpdates({
        enableRealTimeUpdates: false
      }), {
        wrapper: TestWrapper
      });

      act(() => {
        result.current.connect('test-pipeline-1');
      });

      expect(mockWebSocket).not.toHaveBeenCalled();
      expect(result.current.connectionStatus).toBe(ConnectionStatus.DISCONNECTED);
    });

    it('should respect maxReconnectAttempts setting', async () => {
      const { result } = renderHook(() => usePipelineUpdates({
        maxReconnectAttempts: 2,
        reconnectInterval: 100
      }), {
        wrapper: TestWrapper
      });

      act(() => {
        result.current.connect('test-pipeline-1');
      });

      act(() => {
        jest.advanceTimersByTime(20);
      });

      // Simulate multiple connection failures
      for (let i = 0; i < 3; i++) {
        act(() => {
          mockWebSocketInstance.close();
        });

        act(() => {
          jest.advanceTimersByTime(100);
        });
      }

      // Should have attempted reconnection only maxReconnectAttempts times
      expect(mockWebSocket).toHaveBeenCalledTimes(3); // Initial + 2 reconnects
    });
  });

  describe('Cleanup', () => {
    it('should cleanup connections on unmount', () => {
      const { result, unmount } = renderHook(() => usePipelineUpdates(), {
        wrapper: TestWrapper
      });

      act(() => {
        result.current.connect('test-pipeline-1');
      });

      act(() => {
        jest.advanceTimersByTime(20);
      });

      unmount();

      expect(result.current.connectionStatus).toBe(ConnectionStatus.DISCONNECTED);
    });
  });
});

describe('usePipelinePolling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        updates: [
          {
            stageId: 'validation',
            status: PipelineStageStatus.RUNNING,
            progress: 75,
            timestamp: Date.now()
          }
        ]
      })
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start polling when pipelineId is provided', () => {
    renderHook(() => usePipelinePolling('test-pipeline-1', 1000), {
      wrapper: TestWrapper
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/pipeline/test-pipeline-1/status');
  });

  it('should not poll when pipelineId is null', () => {
    renderHook(() => usePipelinePolling(null, 1000), {
      wrapper: TestWrapper
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle polling errors gracefully', () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() => usePipelinePolling('test-pipeline-1', 1000), {
      wrapper: TestWrapper
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error polling pipeline status:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should stop polling on unmount', () => {
    const { unmount } = renderHook(() => usePipelinePolling('test-pipeline-1', 1000), {
      wrapper: TestWrapper
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    unmount();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should not have been called again after unmount
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});