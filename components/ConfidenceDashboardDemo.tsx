/**
 * ConfidenceDashboardDemo Component
 * 
 * Demo component showcasing the ConfidenceDashboard with sample data
 */

"use client";
import React from 'react';
import { ConfidenceDashboard } from './ConfidenceDashboard';
import { Channel, AlgorithmResult, ConsensusMetrics } from '@/types/shared';

// Sample data for demonstration
const sampleConfidenceData = {
  overall: 0.87,
  perChannel: {
    google: 0.92,
    meta: 0.85,
    tiktok: 0.78,
    linkedin: 0.81
  } as Record<Channel, number>,
  stability: 0.89,
  algorithms: [
    {
      name: 'ensemble',
      allocation: {
        google: 0.35,
        meta: 0.28,
        tiktok: 0.22,
        linkedin: 0.15
      },
      confidence: 0.91,
      performance: 0.88
    },
    {
      name: 'bayesian',
      allocation: {
        google: 0.38,
        meta: 0.25,
        tiktok: 0.24,
        linkedin: 0.13
      },
      confidence: 0.85,
      performance: 0.82
    },
    {
      name: 'gradient',
      allocation: {
        google: 0.33,
        meta: 0.30,
        tiktok: 0.20,
        linkedin: 0.17
      },
      confidence: 0.89,
      performance: 0.86
    },
    {
      name: 'llm',
      allocation: {
        google: 0.36,
        meta: 0.27,
        tiktok: 0.23,
        linkedin: 0.14
      },
      confidence: 0.83,
      performance: 0.79
    }
  ] as AlgorithmResult[],
  consensus: {
    agreement: 0.84,
    variance: {
      google: 0.02,
      meta: 0.03,
      tiktok: 0.04,
      linkedin: 0.02
    },
    outlierCount: 1
  } as ConsensusMetrics
};

const sampleConfidenceDataLow = {
  overall: 0.62,
  perChannel: {
    google: 0.68,
    meta: 0.59,
    tiktok: 0.55,
    linkedin: 0.64
  } as Record<Channel, number>,
  stability: 0.58,
  algorithms: [
    {
      name: 'ensemble',
      allocation: {
        google: 0.40,
        meta: 0.25,
        tiktok: 0.20,
        linkedin: 0.15
      },
      confidence: 0.65,
      performance: 0.61
    },
    {
      name: 'bayesian',
      allocation: {
        google: 0.35,
        meta: 0.30,
        tiktok: 0.18,
        linkedin: 0.17
      },
      confidence: 0.58,
      performance: 0.55
    },
    {
      name: 'gradient',
      allocation: {
        google: 0.42,
        meta: 0.23,
        tiktok: 0.22,
        linkedin: 0.13
      },
      confidence: 0.63,
      performance: 0.59
    }
  ] as AlgorithmResult[],
  consensus: {
    agreement: 0.52,
    variance: {
      google: 0.07,
      meta: 0.06,
      tiktok: 0.04,
      linkedin: 0.05
    },
    outlierCount: 2
  } as ConsensusMetrics
};

export const ConfidenceDashboardDemo: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = React.useState<'high' | 'low'>('high');
  const [showDetails, setShowDetails] = React.useState(true);
  
  const currentData = selectedScenario === 'high' ? sampleConfidenceData : sampleConfidenceDataLow;
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Confidence Dashboard Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Interactive demonstration of confidence metrics and algorithm performance visualization
        </p>
        
        {/* Demo Controls */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Scenario:
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value as 'high' | 'low')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            >
              <option value="high">High Confidence</option>
              <option value="low">Low Confidence</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Details:
            </label>
            <input
              type="checkbox"
              checked={showDetails}
              onChange={(e) => setShowDetails(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Confidence Dashboard */}
      <ConfidenceDashboard
        confidence={currentData}
        showDetails={showDetails}
        className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6"
      />
      
      {/* Information Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          About This Demo
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Features Demonstrated
            </h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Circular progress indicators for confidence scores</li>
              <li>Per-channel confidence metrics with color coding</li>
              <li>Algorithm contribution badges with performance data</li>
              <li>Consensus metrics with agreement indicators</li>
              <li>Interactive expandable sections</li>
              <li>Responsive design for mobile and desktop</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Interaction Guide
            </h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Click algorithm badges to view detailed metrics</li>
              <li>Expand channel cards to see additional information</li>
              <li>Toggle &quot;Show Details&quot; to control information density</li>
              <li>Switch scenarios to see different confidence levels</li>
              <li>Observe color coding: green (high), yellow (medium), red (low)</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Current Scenario: {selectedScenario === 'high' ? 'High Confidence' : 'Low Confidence'}
          </h4>
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            {selectedScenario === 'high' 
              ? 'This scenario shows strong algorithm consensus with high confidence scores across all channels. The optimization results are highly reliable.'
              : 'This scenario demonstrates lower confidence with more algorithm disagreement. Users would see warnings and might want to review their input data or constraints.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceDashboardDemo;