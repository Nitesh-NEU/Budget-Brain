/**
 * RealTimePipelineStatus Component Tests
 * 
 * Comprehensive tests for the RealTimePipelineStatus component covering
 * real-time updates, WebSocket connections, and pipeline status display.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RealTimePipelineStatus } from '../RealTimePipelineStatus';
import { VisualizationProvider } from '../../lib/visualizationContext';
import { 
  OptimizationPipeline, 
  PipelineStageStatus, 
  PipelineStatus,
  PipelineUpdate,
  PipelineEvent,
  PipelineEventType
} from '@/types/pipeline';

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

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

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

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Setup global mocks
let mockWebSocketInstance: MockWebSocket;
let mockEventSourceInstance: MockEventSource;

Object.defineProperty(global, 'WebSocket', {
  value: jest.fn().mockImplementation((url: string) => {
    mockWebSocketInstance = new MockWebSocket(url);
    return mockWebSocketInstance;
  }),
  writable: true
});

Object.defineProperty(global, 'EventSource', {
  value: jest.fn().mockImplementation((url: string) => {
    mockEventSourceInstance = new MockEventSource(url);
    return mockEventSourceInstance;
  }),
  writable: true
});

// Mock fetch for polling
global.fetch = jest.fn();

// Mock pipeline data
const mockPipeline: OptimizationPipeline = {
  id: 'test-pipeline-1',
  status: PipelineStatus.RUNNING,
  startTime: Date.now() - 10000,
  estimatedTotalDuration: 30000,
  currentStage: 'validation',
  completedStages: ['dataFetch'],
  failedStages: [],
  stages: {
    dataFetch: {
      id: 'dataFetch',
      name: 'Data Fetching',
      status: PipelineStageStatus.COMPLETED,
      startTime: Date.now() - 10000,
      endTime: Date.now() - 8000,
      duration: 2000,
      progress: 100
    },
    validation: {
      id: 'validation',
      name: 'Data Validation',
      status: PipelineStageStatus.RUNNING,
      startTime: Date.now() - 8000,
      progress: 65,
      details: 'Validating citations...'
    },
    ensembleOptimization: {
      id: 'ensembleOptimization',
      name: 'Ensemble Optimization',
      status: PipelineStageStatus.PENDING,
      progress: 0
    },
    bayesianOptimization: {
      id: 'bayesianOptimization',
      name: 'Bayesian Optimization',
      status: PipelineStageStatus.PENDING,
      progress: 0
    },
    gradientOptimization: {
      id: 'gradientOptimization',
      name: 'Gradient Optimization',
      status: PipelineStageStatus.PENDING,
      progress: 0
    },
    confidenceScoring: {
      id: 'confidenceScoring',
      name: 'Confidence Scoring',
      status: PipelineStageStatus.PENDING,
      progress: 0
    },
    benchmarkValidation: {
      id: 'benchmarkValidation',
      name: 'Benchmark Validation',
      status: PipelineStageStatus.PENDING,
      progress: 0
    },
    llmValidation: {
      id: 'llmValidation',
      name: 'LLM Validation',
      status: PipelineStageStatus.PENDING,
      progress: 0
    },
    finalSelection: {
      id: 'finalSelection',
      name: 'Final Selection',
      status: PipelineStageStatus.PENDING,
      progress: 0
    }
  }
};

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <VisualizationProvider initialPipeline={mockPipeline}>
    {children}
  </VisualizationProvider>
);

describe('RealTimePipelineStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        pipeline: mockPipeline,
        updates: []
      })
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders the component with pipeline status', () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByText('Real-Time Pipeline Status')).toBeInTheDocument();
      expect(screen.getByText('Pipeline Status:')).toBeInTheDocument();
      expect(screen.getByText('running')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" className="custom-class" />,
        { wrapper: TestWrapper }
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('shows connection status', async () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      // Initially connecting
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      
      // Simulate connection
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });
  });

  describe('Real-Time Updates', () => {
    it('establishes WebSocket connection', async () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('/api/pipeline/test-pipeline-1/ws')
      );
    });

    it('receives and processes pipeline updates', async () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
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
        } as PipelineUpdate
      };
      
      act(() => {
        mockWebSocketInstance.simulateMessage(updateMessage);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Data Validation')).toBeInTheDocument();
      });
    });

    it('receives and processes pipeline events', async () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      // Simulate receiving a pipeline event
      const eventMessage = {
        type: 'pipeline_event',
        event: {
          type: PipelineEventType.STAGE_STARTED,
          pipelineId: 'test-pipeline-1',
          stageId: 'ensembleOptimization',
          timestamp: Date.now(),
          data: { message: 'Starting ensemble optimization' }
        } as PipelineEvent
      };
      
      act(() => {
        mockWebSocketInstance.simulateMessage(eventMessage);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Starting ensemble optimization')).toBeInTheDocument();
      });
    });

    it('handles WebSocket connection errors', async () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      act(() => {
        mockWebSocketInstance.simulateError();
      });
      
      await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument();
      });
    });

    it('attempts reconnection on connection loss', async () => {
      render(
        <RealTimePipelineStatus 
          pipelineId="test-pipeline-1" 
          reconnectInterval={1000}
          maxReconnectAttempts={3}
        />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      // Simulate connection close
      act(() => {
        mockWebSocketInstance.close();
      });
      
      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
      });
      
      // Fast-forward to trigger reconnection
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // Should attempt to reconnect
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });
  });

  describe('Fallback to Server-Sent Events', () => {
    beforeEach(() => {
      // Disable WebSocket to test SSE fallback
      delete (global as any).WebSocket;
    });

    afterEach(() => {
      // Restore WebSocket
      (global as any).WebSocket = jest.fn().mockImplementation((url: string) => {
        mockWebSocketInstance = new MockWebSocket(url);
        return mockWebSocketInstance;
      });
    });

    it('falls back to SSE when WebSocket is not available', async () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      expect(global.EventSource).toHaveBeenCalledWith(
        '/api/pipeline/test-pipeline-1/events'
      );
    });

    it('receives updates via SSE', async () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      const updateMessage = {
        type: 'pipeline_update',
        update: {
          stageId: 'bayesianOptimization',
          status: PipelineStageStatus.RUNNING,
          progress: 30,
          timestamp: Date.now()
        }
      };
      
      act(() => {
        mockEventSourceInstance.simulateMessage(updateMessage);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Bayesian Optimization')).toBeInTheDocument();
      });
    });
  });

  describe('Polling Fallback', () => {
    beforeEach(() => {
      // Disable both WebSocket and EventSource
      delete (global as any).WebSocket;
      delete (global as any).EventSource;
    });

    afterEach(() => {
      // Restore both
      (global as any).WebSocket = jest.fn().mockImplementation((url: string) => {
        mockWebSocketInstance = new MockWebSocket(url);
        return mockWebSocketInstance;
      });
      (global as any).EventSource = jest.fn().mockImplementation((url: string) => {
        mockEventSourceInstance = new MockEventSource(url);
        return mockEventSourceInstance;
      });
    });

    it('falls back to polling when real-time options are unavailable', async () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" pollingInterval={1000} />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(global.fetch).toHaveBeenCalledWith('/api/pipeline/test-pipeline-1/status');
    });

    it('processes polling responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pipeline: {
            ...mockPipeline,
            status: PipelineStatus.COMPLETED
          },
          updates: [
            {
              stageId: 'finalSelection',
              status: PipelineStageStatus.COMPLETED,
              progress: 100,
              timestamp: Date.now()
            }
          ]
        })
      });
      
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" pollingInterval={1000} />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('completed')).toBeInTheDocument();
      });
    });
  });

  describe('Pipeline Progress Display', () => {
    it('shows overall pipeline progress', () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByText('Overall Progress')).toBeInTheDocument();
      
      // Should show progress percentage
      const progressElements = screen.getAllByRole('progressbar');
      expect(progressElements.length).toBeGreaterThan(0);
    });

    it('displays current stage information', () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByText('Current Stage:')).toBeInTheDocument();
      expect(screen.getByText('Data Validation')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('shows elapsed time', () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByText('Elapsed Time:')).toBeInTheDocument();
      expect(screen.getByText(/\d+s/)).toBeInTheDocument();
    });

    it('shows estimated remaining time', () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByText('Estimated Remaining:')).toBeInTheDocument();
      expect(screen.getByText(/\d+s/)).toBeInTheDocument();
    });

    it('updates progress in real-time', async () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      // Simulate progress update
      const progressUpdate = {
        type: 'pipeline_update',
        update: {
          stageId: 'validation',
          status: PipelineStageStatus.RUNNING,
          progress: 85,
          timestamp: Date.now()
        }
      };
      
      act(() => {
        mockWebSocketInstance.simulateMessage(progressUpdate);
      });
      
      await waitFor(() => {
        expect(screen.getByText('85%')).toBeInTheDocument();
      });
    });
  });

  describe('Stage Status Indicators', () => {
    it('shows completed stages with checkmarks', () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByText('Completed Stages:')).toBeInTheDocument();
      expect(screen.getByText('Data Fetching')).toBeInTheDocument();
    });

    it('shows running stages with progress indicators', () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      const runningStageElement = screen.getByText('Data Validation');
      expect(runningStageElement).toBeInTheDocument();
      
      // Should have animated indicator for running stage
      const parentElement = runningStageElement.closest('[class*="animate"]');
      expect(parentElement).toBeInTheDocument();
    });

    it('shows pending stages in queue', () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByText('Upcoming Stages:')).toBeInTheDocument();
      expect(screen.getByText('Ensemble Optimization')).toBeInTheDocument();
      expect(screen.getByText('Bayesian Optimization')).toBeInTheDocument();
    });

    it('handles stage failures appropriately', async () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      // Simulate stage failure
      const failureUpdate = {
        type: 'pipeline_update',
        update: {
          stageId: 'validation',
          status: PipelineStageStatus.ERROR,
          progress: 65,
          error: 'Validation failed: Invalid data format',
          timestamp: Date.now()
        }
      };
      
      act(() => {
        mockWebSocketInstance.simulateMessage(failureUpdate);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Validation failed: Invalid data format')).toBeInTheDocument();
        expect(screen.getByText('Failed Stages:')).toBeInTheDocument();
      });
    });
  });

  describe('Event Log', () => {
    it('displays recent pipeline events', async () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" showEventLog={true} />,
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByText('Event Log')).toBeInTheDocument();
    });

    it('adds new events to the log', async () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" showEventLog={true} />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      const eventMessage = {
        type: 'pipeline_event',
        event: {
          type: PipelineEventType.STAGE_COMPLETED,
          pipelineId: 'test-pipeline-1',
          stageId: 'validation',
          timestamp: Date.now(),
          data: { message: 'Validation completed successfully' }
        }
      };
      
      act(() => {
        mockWebSocketInstance.simulateMessage(eventMessage);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Validation completed successfully')).toBeInTheDocument();
      });
    });

    it('limits event log size', async () => {
      render(
        <RealTimePipelineStatus 
          pipelineId="test-pipeline-1" 
          showEventLog={true}
          maxEventLogSize={5}
        />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      // Send more events than the limit
      for (let i = 0; i < 10; i++) {
        const eventMessage = {
          type: 'pipeline_event',
          event: {
            type: PipelineEventType.STAGE_PROGRESS,
            pipelineId: 'test-pipeline-1',
            stageId: 'validation',
            timestamp: Date.now() + i,
            data: { message: `Event ${i}` }
          }
        };
        
        act(() => {
          mockWebSocketInstance.simulateMessage(eventMessage);
        });
      }
      
      await waitFor(() => {
        // Should only show the last 5 events
        expect(screen.getByText('Event 9')).toBeInTheDocument();
        expect(screen.getByText('Event 5')).toBeInTheDocument();
        expect(screen.queryByText('Event 4')).not.toBeInTheDocument();
      });
    });
  });

  describe('Configuration Options', () => {
    it('respects enableRealTimeUpdates setting', () => {
      render(
        <RealTimePipelineStatus 
          pipelineId="test-pipeline-1" 
          enableRealTimeUpdates={false}
        />,
        { wrapper: TestWrapper }
      );
      
      expect(global.WebSocket).not.toHaveBeenCalled();
      expect(screen.getByText('Real-time updates disabled')).toBeInTheDocument();
    });

    it('uses custom polling interval', async () => {
      // Disable real-time to test polling
      delete (global as any).WebSocket;
      delete (global as any).EventSource;
      
      render(
        <RealTimePipelineStatus 
          pipelineId="test-pipeline-1" 
          pollingInterval={2000}
        />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('respects maxReconnectAttempts setting', async () => {
      render(
        <RealTimePipelineStatus 
          pipelineId="test-pipeline-1" 
          maxReconnectAttempts={2}
          reconnectInterval={100}
        />,
        { wrapper: TestWrapper }
      );
      
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
      expect(global.WebSocket).toHaveBeenCalledTimes(3); // Initial + 2 reconnects
      
      await waitFor(() => {
        expect(screen.getByText('Max reconnection attempts reached')).toBeInTheDocument();
      });
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('cleans up connections on unmount', () => {
      const { unmount } = render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      const closeSpy = jest.spyOn(mockWebSocketInstance, 'close');
      
      unmount();
      
      expect(closeSpy).toHaveBeenCalled();
    });

    it('cleans up timers on unmount', () => {
      const { unmount } = render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" pollingInterval={1000} />,
        { wrapper: TestWrapper }
      );
      
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('handles pipeline ID changes', async () => {
      const { rerender } = render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      expect(global.WebSocket).toHaveBeenCalledTimes(1);
      
      // Change pipeline ID
      rerender(
        <RealTimePipelineStatus pipelineId="test-pipeline-2" />
      );
      
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      // Should establish new connection for new pipeline
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for status indicators', () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByLabelText('Pipeline status: running')).toBeInTheDocument();
      expect(screen.getByLabelText('Connection status: connecting')).toBeInTheDocument();
    });

    it('announces status changes to screen readers', async () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" />,
        { wrapper: TestWrapper }
      );
      
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      const statusUpdate = {
        type: 'pipeline_update',
        update: {
          stageId: 'validation',
          status: PipelineStageStatus.COMPLETED,
          progress: 100,
          timestamp: Date.now()
        }
      };
      
      act(() => {
        mockWebSocketInstance.simulateMessage(statusUpdate);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Stage Data Validation completed');
      });
    });

    it('provides keyboard navigation for interactive elements', () => {
      render(
        <RealTimePipelineStatus pipelineId="test-pipeline-1" showEventLog={true} />,
        { wrapper: TestWrapper }
      );
      
      const interactiveElements = screen.getAllByRole('button');
      
      interactiveElements.forEach(element => {
        element.focus();
        expect(element).toHaveFocus();
      });
    });
  });
});