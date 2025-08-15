/**
 * PipelineFlowVisualizer Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PipelineFlowVisualizer from '../PipelineFlowVisualizer';
import { 
  PipelineStage, 
  PipelineStageStatus, 
  OptimizationPipeline,
  PipelineStatus 
} from '@/types/pipeline';

// Mock data
const mockStages: PipelineStage[] = [
  {
    id: 'dataFetch',
    name: 'Data Fetching',
    status: PipelineStageStatus.COMPLETED,
    progress: 100,
    duration: 2000,
    startTime: Date.now() - 5000,
    endTime: Date.now() - 3000
  },
  {
    id: 'validation',
    name: 'Data Validation',
    status: PipelineStageStatus.RUNNING,
    progress: 65,
    startTime: Date.now() - 3000,
    details: 'Validating citations...'
  },
  {
    id: 'optimization',
    name: 'Optimization',
    status: PipelineStageStatus.PENDING,
    progress: 0
  }
];

const mockPipeline: OptimizationPipeline = {
  id: 'test-pipeline',
  status: PipelineStatus.RUNNING,
  startTime: Date.now() - 5000,
  estimatedTotalDuration: 20000,
  currentStage: 'validation',
  completedStages: ['dataFetch'],
  failedStages: [],
  stages: {
    dataFetch: mockStages[0],
    validation: mockStages[1],
    ensembleOptimization: mockStages[2],
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

// Mock window.innerWidth for responsive tests
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('PipelineFlowVisualizer', () => {
  beforeEach(() => {
    // Reset window width
    window.innerWidth = 1024;
  });

  it('renders without crashing', () => {
    render(<PipelineFlowVisualizer stages={mockStages} />);
    expect(screen.getByText('Optimization Pipeline')).toBeInTheDocument();
  });

  it('displays empty state when no stages provided', () => {
    render(<PipelineFlowVisualizer stages={[]} />);
    expect(screen.getByText('No pipeline stages available')).toBeInTheDocument();
  });

  it('renders all stages with correct status', () => {
    render(<PipelineFlowVisualizer stages={mockStages} />);
    
    expect(screen.getByText('Data Fetching')).toBeInTheDocument();
    expect(screen.getByText('Data Validation')).toBeInTheDocument();
    expect(screen.getByText('Optimization')).toBeInTheDocument();
  });

  it('shows stage details when stage is clicked', () => {
    render(<PipelineFlowVisualizer stages={mockStages} />);
    
    const dataFetchStage = screen.getByText('Data Fetching');
    fireEvent.click(dataFetchStage);
    
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('Duration:')).toBeInTheDocument();
  });

  it('calls onStageClick when stage is clicked', () => {
    const mockOnStageClick = jest.fn();
    render(<PipelineFlowVisualizer stages={mockStages} onStageClick={mockOnStageClick} />);
    
    const dataFetchStage = screen.getByText('Data Fetching');
    fireEvent.click(dataFetchStage);
    
    expect(mockOnStageClick).toHaveBeenCalledWith('dataFetch');
  });

  it('displays progress bars for running and completed stages', () => {
    render(<PipelineFlowVisualizer stages={mockStages} />);
    
    // Should have progress bars for completed and running stages
    const progressBars = document.querySelectorAll('.h-1.bg-gray-200');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('shows error state correctly', () => {
    const errorStage: PipelineStage = {
      id: 'errorStage',
      name: 'Error Stage',
      status: PipelineStageStatus.ERROR,
      progress: 50,
      error: 'Something went wrong'
    };
    
    render(<PipelineFlowVisualizer stages={[errorStage]} />);
    
    const stageButton = screen.getByLabelText('Error Stage - error');
    fireEvent.click(stageButton);
    
    expect(screen.getByText('Error:')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays pipeline summary when pipeline prop is provided', () => {
    render(<PipelineFlowVisualizer pipeline={mockPipeline} />);
    
    expect(screen.getByText('Pipeline Status:')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
    expect(screen.getByText('Completed Stages:')).toBeInTheDocument();
  });

  it('handles mobile responsive design', () => {
    // Mock mobile width
    window.innerWidth = 600;
    window.dispatchEvent(new Event('resize'));
    
    render(<PipelineFlowVisualizer stages={mockStages} />);
    
    // Should render stage short names on mobile
    // This would need to be tested with actual DOM inspection
    // as the component uses useEffect to detect mobile
  });

  it('auto-selects current stage', () => {
    render(<PipelineFlowVisualizer stages={mockStages} currentStage="validation" />);
    
    // The validation stage should be auto-selected
    // This would be visible through the selected styling
    const validationStage = screen.getByText('Data Validation');
    expect(validationStage).toBeInTheDocument();
  });

  it('closes stage details when close button is clicked', () => {
    render(<PipelineFlowVisualizer stages={mockStages} />);
    
    // Click to open details
    const dataFetchStage = screen.getByText('Data Fetching');
    fireEvent.click(dataFetchStage);
    
    expect(screen.getByText('Status:')).toBeInTheDocument();
    
    // Click close button
    const closeButton = screen.getByLabelText('Close details');
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Status:')).not.toBeInTheDocument();
  });

  it('displays stage duration when available', () => {
    render(<PipelineFlowVisualizer stages={mockStages} />);
    
    const dataFetchStage = screen.getByText('Data Fetching');
    fireEvent.click(dataFetchStage);
    
    expect(screen.getByText('2.00 seconds')).toBeInTheDocument();
  });

  it('shows running animation for running stages', () => {
    render(<PipelineFlowVisualizer stages={mockStages} />);
    
    // Running stage should have animate-pulse class
    const runningStageButton = screen.getByLabelText('Data Validation - running');
    expect(runningStageButton).toHaveClass('animate-pulse');
  });

  it('handles keyboard navigation', () => {
    render(<PipelineFlowVisualizer stages={mockStages} />);
    
    const stageButton = screen.getByLabelText('Data Fetching - completed');
    
    // Should be focusable
    stageButton.focus();
    expect(stageButton).toHaveFocus();
    
    // Should respond to Enter key
    fireEvent.keyDown(stageButton, { key: 'Enter' });
    expect(screen.getByText('Status:')).toBeInTheDocument();
  });
});

describe('PipelineFlowVisualizer Accessibility', () => {
  it('has proper ARIA labels', () => {
    render(<PipelineFlowVisualizer stages={mockStages} />);
    
    expect(screen.getByLabelText('Data Fetching - completed')).toBeInTheDocument();
    expect(screen.getByLabelText('Data Validation - running')).toBeInTheDocument();
    expect(screen.getByLabelText('Optimization - pending')).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    render(<PipelineFlowVisualizer stages={mockStages} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('tabIndex', '0');
    });
  });

  it('has proper focus management', () => {
    render(<PipelineFlowVisualizer stages={mockStages} />);
    
    const stageButton = screen.getByLabelText('Data Fetching - completed');
    expect(stageButton).toHaveClass('focus:outline-none', 'focus:ring-2');
  });
});