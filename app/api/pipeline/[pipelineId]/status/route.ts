import { NextRequest, NextResponse } from 'next/server';
import { PipelineManager } from '@/lib/pipelineManager';
import { PipelineUpdate } from '@/types/pipeline';

// Global pipeline manager instance
let globalPipelineManager: PipelineManager | null = null;

function getPipelineManager(): PipelineManager {
  if (!globalPipelineManager) {
    globalPipelineManager = new PipelineManager();
  }
  return globalPipelineManager;
}

// Polling endpoint for pipeline status updates (fallback when SSE/WebSocket not available)
export async function GET(
  request: NextRequest,
  { params }: { params: { pipelineId: string } }
) {
  const { pipelineId } = params;
  const searchParams = request.nextUrl.searchParams;
  const since = searchParams.get('since');

  try {
    const pipelineManager = getPipelineManager();
    
    // Get pipeline status
    const pipeline = pipelineManager.getPipeline(pipelineId);
    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    // Get recent updates if 'since' timestamp is provided
    let updates: PipelineUpdate[] = [];
    if (since) {
      const sinceTimestamp = parseInt(since);
      updates = pipelineManager.getUpdatesAfter(pipelineId, sinceTimestamp);
    }

    return NextResponse.json({
      pipeline,
      updates,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching pipeline status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline status' },
      { status: 500 }
    );
  }
}

// Update pipeline status (for testing purposes)
export async function POST(
  request: NextRequest,
  { params }: { params: { pipelineId: string } }
) {
  const { pipelineId } = params;

  try {
    const body = await request.json();
    const { stageId, status, progress, details, error } = body;

    const pipelineManager = getPipelineManager();
    
    // Update the pipeline stage
    const update: PipelineUpdate = {
      stageId,
      status,
      progress,
      details,
      error,
      timestamp: Date.now()
    };

    pipelineManager.updateStage(pipelineId, update);

    return NextResponse.json({
      success: true,
      update,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error updating pipeline status:', error);
    return NextResponse.json(
      { error: 'Failed to update pipeline status' },
      { status: 500 }
    );
  }
}