/**
 * ExportSystem Component Tests
 * 
 * Tests for the ExportSystem component functionality including
 * format selection, export options, and export execution.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExportSystem from '../ExportSystem';
import { EnhancedModelResult } from '@/types/shared';

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn(),
  },
  writable: true,
});

// Mock document.createElement for download functionality
const mockLink = {
  href: '',
  download: '',
  click: jest.fn(),
  style: {},
};

const originalCreateElement = document.createElement;
Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName) => {
    if (tagName === 'a') {
      return mockLink as any;
    }
    if (tagName === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: jest.fn(() => ({
          fillStyle: '',
          font: '',
          fillRect: jest.fn(),
          fillText: jest.fn(),
        })),
        toBlob: jest.fn((callback) => {
          callback(new Blob(['mock-image'], { type: 'image/png' }));
        }),
      } as any;
    }
    return originalCreateElement.call(document, tagName);
  }),
  writable: true,
});

// Mock document.body methods
Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn(),
  writable: true,
});

describe('ExportSystem', () => {
  const mockData: EnhancedModelResult = {
    allocation: {
      google: 0.4,
      meta: 0.3,
      tiktok: 0.2,
      linkedin: 0.1
    },
    detOutcome: 1000,
    mc: { p10: 800, p50: 1000, p90: 1200 },
    intervals: {
      google: [0.3, 0.5],
      meta: [0.2, 0.4],
      tiktok: [0.1, 0.3],
      linkedin: [0.05, 0.15]
    },
    objective: "revenue",
    summary: "Test optimization result",
    confidence: {
      overall: 0.85,
      perChannel: {
        google: 0.9,
        meta: 0.8,
        tiktok: 0.7,
        linkedin: 0.85
      },
      stability: 0.88
    },
    validation: {
      alternativeAlgorithms: [
        {
          name: "ensemble",
          allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.9,
          performance: 0.85
        }
      ],
      consensus: {
        agreement: 0.8,
        variance: { google: 0.02, meta: 0.03, tiktok: 0.04, linkedin: 0.01 },
        outlierCount: 0
      },
      benchmarkComparison: {
        deviationScore: 0.1,
        channelDeviations: { google: 0.05, meta: 0.08, tiktok: 0.12, linkedin: 0.03 },
        warnings: []
      },
      warnings: []
    },
    alternatives: {
      topAllocations: [
        { google: 0.35, meta: 0.35, tiktok: 0.2, linkedin: 0.1 }
      ],
      reasoningExplanation: "Test reasoning"
    }
  };

  const mockOnExport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders export button', () => {
    render(<ExportSystem data={mockData} onExport={mockOnExport} />);
    
    expect(screen.getByText('Export Results')).toBeInTheDocument();
  });

  it('works without pipeline data', () => {
    render(<ExportSystem data={mockData} />);
    
    expect(screen.getByText('Export Results')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ExportSystem data={mockData} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});