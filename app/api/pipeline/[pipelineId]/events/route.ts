import { NextRequest } from 'next/server';
import { PipelineManager } from '@/lib/pipelineManager';
import { PipelineEvent, PipelineEventType, PipelineUpdate } from '@/types/pipeline';

// Global pipeline manager instance
let globalPipelineManager: PipelineManager | null = null;

function getPipelineManager(): PipelineManager {
  if (!globalPipelineManager) {
    globalPipelineManager = new PipelineManager();
  }
  return globalPipelineManager;
}

// Server-Sent Events endpoint for real-time pipeline updates
export async function GET(
  request: NextRequest,
  { params }: { params: { pipelineId: string } }
) {
  const { pipelineId } = params;

  // Set up Server-Sent Events headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const pipelineManager = getPipelineManager();
      
      // Send initial connection message
      const initMessage = `data: ${JSON.stringify({
        type: 'connection',
        pipelineId,
        timestamp: Date.now(),
        message: 'Connected to pipeline updates'
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initMessage));

      // Set up pipeline event listener
      const handlePipelineEvent = (event: PipelineEvent) => {
        if (event.pipelineId === pipelineId) {
          const message = `data: ${JSON.stringify({
            type: 'pipeline_event',
            event,
            timestamp: Date.now()
          })}\n\n`;
          
          try {
            controller.enqueue(new TextEncoder().encode(message));
          } catch (error) {
            console.error('Error sending SSE message:', error);
          }
        }
      };

      // Set up pipeline update listener
      const handlePipelineUpdate = (update: PipelineUpdate & { pipelineId: string }) => {
        if (update.pipelineId === pipelineId) {
          const message = `data: ${JSON.stringify({
            type: 'pipeline_update',
            update,
            timestamp: Date.now()
          })}\n\n`;
          
          try {
            controller.enqueue(new TextEncoder().encode(message));
          } catch (error) {
            console.error('Error sending SSE update:', error);
          }
        }
      };

      // Register event listeners
      pipelineManager.on('pipelineEvent', handlePipelineEvent);
      pipelineManager.on('pipelineUpdate', handlePipelineUpdate);

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        const heartbeat = `data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now()
        })}\n\n`;
        
        try {
          controller.enqueue(new TextEncoder().encode(heartbeat));
        } catch (error) {
          console.error('Error sending heartbeat:', error);
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        pipelineManager.off('pipelineEvent', handlePipelineEvent);
        pipelineManager.off('pipelineUpdate', handlePipelineUpdate);
        
        try {
          controller.close();
        } catch (error) {
          console.error('Error closing SSE stream:', error);
        }
      });
    }
  });

  return new Response(stream, { headers });
}