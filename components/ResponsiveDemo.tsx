/**
 * ResponsiveDemo Component
 * 
 * Demonstrates all responsive design and mobile optimization features
 * implemented across the visualization components.
 */

"use client";
import React, { useState } from 'react';
import { PipelineFlowVisualizer } from './PipelineFlowVisualizer';
import { ConfidenceDashboard } from './ConfidenceDashboard';
import { DataQualityPanel } from './DataQualityPanel';
import { AlternativeOptionsExplorer } from './AlternativeOptionsExplorer';
import { useResponsive } from '../lib/hooks/useResponsive';
import { PipelineStageStatus } from '../types/pipeline';

// Demo data
const demoStages = [
  {
    id: 'data-fetch',
    name: 'Data Fetch',
    status: PipelineStageStatus.COMPLETED,
    progress: 100,
    duration: 1200,
    details: 'Successfully fetched benchmark data from multiple sources'
  },
  {
    id: 'validation',
    name: 'Validation',
    status: PipelineStageStatus.RUNNING,
    progress: 75,
    duration: 800,
    details: 'Validating data quality and consistency'
  },
  {
    id: 'optimization',
    name: 'Optimization',
    status: PipelineStageStatus.PENDING,
    progress: 0,
    details: 'Waiting for validation to complete'
  }
];

const demoConfidence = {
  overall: 0.87,
  perChannel: {
    google: 0.92,
    meta: 0.85,
    tiktok: 0.78,
    linkedin: 0.89
  },
  stability: 0.91,
  algorithms: [
    {
      name: 'ensemble',
      confidence: 0.92,
      performance: 0.88,
      allocation: { google: 0.45, meta: 0.30, tiktok: 0.15, linkedin: 0.10 }
    },
    {
      name: 'bayesian',
      confidence: 0.85,
      performance: 0.82,
      allocation: { google: 0.40, meta: 0.35, tiktok: 0.15, linkedin: 0.10 }
    },
    {
      name: 'gradient',
      confidence: 0.83,
      performance: 0.86,
      allocation: { google: 0.50, meta: 0.25, tiktok: 0.15, linkedin: 0.10 }
    }
  ],
  consensus: {
    agreement: 0.87,
    outlierCount: 1,
    variance: { google: 0.04, meta: 0.06, tiktok: 0.08, linkedin: 0.03 }
  }
};

const demoDataQuality = {
  citations: [
    {
      url: 'https://ads.google.com/benchmarks',
      title: 'Google Ads Performance Benchmarks',
      validationStatus: 'valid' as const,
      contentQuality: 0.95,
      lastChecked: new Date().toISOString(),
      responseTime: 120
    },
    {
      url: 'https://business.facebook.com/insights',
      title: 'Meta Business Insights',
      validationStatus: 'valid' as const,
      contentQuality: 0.88,
      lastChecked: new Date().toISOString(),
      responseTime: 180
    },
    {
      url: 'https://ads.tiktok.com/data',
      title: 'TikTok Ads Performance Data',
      validationStatus: 'warning' as const,
      contentQuality: 0.72,
      lastChecked: new Date().toISOString(),
      responseTime: 350,
      issues: ['Slower response time', 'Limited historical data']
    }
  ],
  benchmarkAnalysis: {
    deviationScore: 0.18,
    channelDeviations: { google: 0.12, meta: 0.22, tiktok: 0.25, linkedin: 0.15 },
    warnings: [
      {
        type: 'benchmark_deviation',
        message: 'TikTok allocation deviates significantly from industry standards',
        severity: 'medium' as const,
        channel: 'tiktok' as const
      },
      {
        type: 'benchmark_variance',
        message: 'Meta allocation shows moderate variance from benchmarks',
        severity: 'low' as const,
        channel: 'meta' as const
      }
    ]
  },
  warnings: [
    {
      type: 'data_variance',
      message: 'TikTok data shows higher than expected variance',
      severity: 'medium' as const,
      channel: 'tiktok' as const
    },
    {
      type: 'data_staleness',
      message: 'Meta benchmark data is 2 days old',
      severity: 'low' as const,
      channel: 'meta' as const
    }
  ],
  sourceQuality: {
    'google-benchmarks': {
      source: 'google-benchmarks',
      reliability: 0.95,
      validationStatus: 'valid' as const,
      lastUpdated: new Date().toISOString()
    },
    'meta-insights': {
      source: 'meta-insights',
      reliability: 0.88,
      validationStatus: 'valid' as const,
      lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    'tiktok-data': {
      source: 'tiktok-data',
      reliability: 0.72,
      validationStatus: 'warning' as const,
      lastUpdated: new Date().toISOString(),
      issues: ['Limited historical data', 'API rate limits']
    }
  },
  overallScore: 0.85,
  lastValidated: new Date().toISOString()
};

const demoAlternatives = [
  {
    id: 'ensemble-high-conf',
    allocation: { google: 0.45, meta: 0.30, tiktok: 0.15, linkedin: 0.10 },
    confidence: 0.92,
    performance: 0.88,
    reasoning: 'Ensemble method with high confidence. Prioritizes Google Ads based on strong historical performance and reliable data sources. Meta allocation balanced for brand awareness.',
    algorithmSource: 'ensemble',
    riskLevel: 'low' as const,
    expectedOutcome: 125000,
    metadata: {
      iterations: 150,
      convergenceScore: 0.95,
      dataQuality: 0.91
    }
  },
  {
    id: 'bayesian-balanced',
    allocation: { google: 0.40, meta: 0.35, tiktok: 0.15, linkedin: 0.10 },
    confidence: 0.85,
    performance: 0.82,
    reasoning: 'Bayesian optimization with balanced approach. Increases Meta allocation for broader reach while maintaining Google performance. Conservative TikTok allocation due to data uncertainty.',
    algorithmSource: 'bayesian',
    riskLevel: 'medium' as const,
    expectedOutcome: 118000,
    metadata: {
      priorStrength: 0.7,
      posteriorUpdates: 45,
      uncertaintyReduction: 0.68
    }
  },
  {
    id: 'gradient-performance',
    allocation: { google: 0.50, meta: 0.25, tiktok: 0.15, linkedin: 0.10 },
    confidence: 0.83,
    performance: 0.86,
    reasoning: 'Gradient-based optimization focusing on performance maximization. Heavy Google allocation based on conversion data. Reduced Meta spend to optimize for direct response.',
    algorithmSource: 'gradient',
    riskLevel: 'medium' as const,
    expectedOutcome: 132000,
    metadata: {
      learningRate: 0.01,
      gradientNorm: 0.003,
      optimizationSteps: 200
    }
  },
  {
    id: 'llm-strategic',
    allocation: { google: 0.35, meta: 0.30, tiktok: 0.25, linkedin: 0.10 },
    confidence: 0.78,
    performance: 0.79,
    reasoning: 'LLM-guided strategic allocation emphasizing emerging platforms. Higher TikTok allocation for younger demographics and viral potential. Balanced approach across all channels.',
    algorithmSource: 'llm',
    riskLevel: 'high' as const,
    expectedOutcome: 108000,
    metadata: {
      modelConfidence: 0.78,
      reasoningSteps: 12,
      strategicFactors: ['demographic trends', 'platform growth', 'competitive analysis']
    }
  }
];

const ResponsiveDemo: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<'pipeline' | 'confidence' | 'quality' | 'alternatives'>('pipeline');
  const { isMobile, isTablet, width } = useResponsive();
  
  const currentAllocation = demoAlternatives[0].allocation;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Responsive Design Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Interactive demonstration of mobile optimization and responsive features
          </p>
          
          {/* Viewport Info */}
          <div className="flex items-center space-x-4 text-sm">
            <div className={`px-3 py-1 rounded-full ${isMobile ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
              Mobile: {isMobile ? 'Yes' : 'No'}
            </div>
            <div className={`px-3 py-1 rounded-full ${isTablet ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              Tablet: {isTablet ? 'Yes' : 'No'}
            </div>
            <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-800">
              Width: {width}px
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            {[
              { key: 'pipeline', label: 'Pipeline Flow', icon: '🔄' },
              { key: 'confidence', label: 'Confidence', icon: '📊' },
              { key: 'quality', label: 'Data Quality', icon: '✅' },
              { key: 'alternatives', label: 'Alternatives', icon: '🔀' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setSelectedDemo(key as any)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedDemo === key
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                } ${isMobile ? 'min-h-[60px]' : 'min-h-[44px]'}`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-lg">{icon}</span>
                  <span>{label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Demo Content */}
        <div className="space-y-6">
          {selectedDemo === 'pipeline' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-2">Pipeline Flow Visualizer</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {isMobile 
                    ? 'Mobile: Compact stage cards, bottom sheet details, touch-friendly controls'
                    : 'Desktop: Full stage names, inline details, hover interactions'
                  }
                </p>
              </div>
              <PipelineFlowVisualizer stages={demoStages} />
            </div>
          )}

          {selectedDemo === 'confidence' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-2">Confidence Dashboard</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {isMobile 
                    ? 'Mobile: Collapsible panels, stacked layout, smaller charts'
                    : 'Desktop: Side-by-side layout, full-size charts, expanded details'
                  }
                </p>
              </div>
              <ConfidenceDashboard confidence={demoConfidence} />
            </div>
          )}

          {selectedDemo === 'quality' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-2">Data Quality Panel</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {isMobile 
                    ? 'Mobile: Auto-collapsed sections, bottom sheet expansions, touch-optimized'
                    : 'Desktop: Expandable inline sections, detailed tooltips, hover states'
                  }
                </p>
              </div>
              <DataQualityPanel dataQuality={demoDataQuality} />
            </div>
          )}

          {selectedDemo === 'alternatives' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-2">Alternative Options Explorer</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {isMobile 
                    ? 'Mobile: Swipe navigation, bottom sheet modals, touch indicators'
                    : 'Desktop: Grid layout, inline modals, navigation arrows'
                  }
                </p>
              </div>
              <AlternativeOptionsExplorer 
                alternatives={demoAlternatives}
                currentAllocation={currentAllocation}
              />
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Responsive Features Implemented</h2>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📱 Mobile Optimization</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Auto-collapsible panels</li>
                <li>• Touch-friendly controls (44px+)</li>
                <li>• Bottom sheet modals</li>
                <li>• Compact layouts</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">👆 Touch Gestures</h3>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Swipe navigation</li>
                <li>• Touch indicators</li>
                <li>• Gesture feedback</li>
                <li>• Scroll optimization</li>
              </ul>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2">📊 Chart Adaptation</h3>
              <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                <li>• Responsive sizing</li>
                <li>• Simplified mobile views</li>
                <li>• Optimized stroke widths</li>
                <li>• Adaptive fonts</li>
              </ul>
            </div>
            
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-2">♿ Accessibility</h3>
              <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                <li>• WCAG 2.1 AA compliance</li>
                <li>• Keyboard navigation</li>
                <li>• Screen reader support</li>
                <li>• Focus management</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
            🧪 Try These Features
          </h3>
          <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
            {isMobile ? (
              <>
                <p>• Tap component headers to collapse/expand panels</p>
                <p>• Swipe left/right on alternative options</p>
                <p>• Tap stage cards to see bottom sheet details</p>
                <p>• Use touch gestures to navigate content</p>
              </>
            ) : (
              <>
                <p>• Resize your browser window to see responsive behavior</p>
                <p>• Hover over interactive elements for feedback</p>
                <p>• Click stage cards and options to see detailed views</p>
                <p>• Use keyboard navigation (Tab, Enter, Arrow keys)</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveDemo;