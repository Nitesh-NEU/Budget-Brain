/**
 * ExportSystemDemo Component
 * 
 * Demonstrates the ExportSystem component with sample data
 * for testing and development purposes.
 */

"use client";
import React from 'react';
import ExportSystem, { ExportOptions } from './ExportSystem';
import { EnhancedModelResult, OptimizationPipeline, PipelineStageStatus, PipelineStatus } from '@/types/shared';

const ExportSystemDemo: React.FC = () => {
  // Sample enhanced model result data
  const sampleData: EnhancedModelResult = {
    allocation: {
      google: 0.35,
      meta: 0.30,
      tiktok: 0.20,
      linkedin: 0.15
    },
    detOutcome: 1250.75,
    mc: {
      p10: 980.25,
      p50: 1250.75,
      p90: 1520.30
    },
    intervals: {
      google: [0.25, 0.45],
      meta: [0.20, 0.40],
      tiktok: [0.10, 0.30],
      linkedin: [0.05, 0.25]
    },
    objective: "revenue",
    summary: "Optimized allocation for maximum revenue generation with balanced risk distribution across channels.",
    citations: [
      {
        title: "Google Ads Benchmark Report 2024",
        url: "https://example.com/google-benchmark",
        note: "Industry CPM and CTR data"
      },
      {
        title: "Meta Advertising Performance Study",
        url: "https://example.com/meta-study",
        note: "Conversion rate benchmarks"
      }
    ],
    confidence: {
      overall: 0.87,
      perChannel: {
        google: 0.92,
        meta: 0.85,
        tiktok: 0.78,
        linkedin: 0.83
      },
      stability: 0.91
    },
    validation: {
      alternativeAlgorithms: [
        {
          name: "Ensemble",
          allocation: { google: 0.35, meta: 0.30, tiktok: 0.20, linkedin: 0.15 },
          confidence: 0.92,
          performance: 0.89
        },
        {
          name: "Bayesian",
          allocation: { google: 0.33, meta: 0.32, tiktok: 0.22, linkedin: 0.13 },
          confidence: 0.88,
          performance: 0.85
        },
        {
          name: "Gradient",
          allocation: { google: 0.37, meta: 0.28, tiktok: 0.18, linkedin: 0.17 },
          confidence: 0.84,
          performance: 0.87
        }
      ],
      consensus: {
        agreement: 0.82,
        variance: {
          google: 0.02,
          meta: 0.03,
          tiktok: 0.04,
          linkedin: 0.05
        },
        outlierCount: 1
      },
      benchmarkComparison: {
        deviationScore: 0.15,
        channelDeviations: {
          google: 0.12,
          meta: 0.18,
          tiktok: 0.22,
          linkedin: 0.08
        },
        warnings: [
          {
            type: "deviation",
            message: "TikTok allocation is 22% above industry benchmark",
            severity: "medium",
            channel: "tiktok"
          }
        ]
      },
      warnings: [
        {
          type: "data_quality",
          message: "Limited historical data for TikTok channel",
          severity: "low",
          channel: "tiktok"
        }
      ]
    },
    alternatives: {
      topAllocations: [
        { google: 0.40, meta: 0.25, tiktok: 0.20, linkedin: 0.15 },
        { google: 0.30, meta: 0.35, tiktok: 0.20, linkedin: 0.15 },
        { google: 0.35, meta: 0.30, tiktok: 0.15, linkedin: 0.20 }
      ],
      reasoningExplanation: "Alternative allocations based on different risk tolerance levels and performance optimization strategies."
    }
  };

  // Sample pipeline data
  const samplePipeline: OptimizationPipeline = {
    id: "pipeline-demo-001",
    status: PipelineStatus.COMPLETED,
    startTime: Date.now() - 15000,
    endTime: Date.now(),
    totalDuration: 15000,
    estimatedTotalDuration: 18000,
    currentStage: undefined,
    completedStages: [
      "dataFetch", "validation", "ensembleOptimization", 
      "bayesianOptimization", "gradientOptimization", 
      "confidenceScoring", "benchmarkValidation", 
      "llmValidation", "finalSelection"
    ],
    failedStages: [],
    stages: {
      dataFetch: {
        id: "dataFetch",
        name: "Data Fetching",
        status: PipelineStageStatus.COMPLETED,
        startTime: Date.now() - 15000,
        endTime: Date.now() - 13000,
        duration: 2000,
        progress: 100,
        details: "Successfully fetched benchmark data and priors"
      },
      validation: {
        id: "validation",
        name: "Data Validation",
        status: PipelineStageStatus.COMPLETED,
        startTime: Date.now() - 13000,
        endTime: Date.now() - 12000,
        duration: 1000,
        progress: 100,
        details: "All data sources validated successfully"
      },
      ensembleOptimization: {
        id: "ensembleOptimization",
        name: "Ensemble Optimization",
        status: PipelineStageStatus.COMPLETED,
        startTime: Date.now() - 12000,
        endTime: Date.now() - 9000,
        duration: 3000,
        progress: 100,
        details: "Ensemble methods completed with high confidence"
      },
      bayesianOptimization: {
        id: "bayesianOptimization",
        name: "Bayesian Optimization",
        status: PipelineStageStatus.COMPLETED,
        startTime: Date.now() - 9000,
        endTime: Date.now() - 5000,
        duration: 4000,
        progress: 100,
        details: "Bayesian optimization converged after 12 iterations"
      },
      gradientOptimization: {
        id: "gradientOptimization",
        name: "Gradient Optimization",
        status: PipelineStageStatus.COMPLETED,
        startTime: Date.now() - 5000,
        endTime: Date.now() - 2500,
        duration: 2500,
        progress: 100,
        details: "Gradient descent achieved optimal convergence"
      },
      confidenceScoring: {
        id: "confidenceScoring",
        name: "Confidence Scoring",
        status: PipelineStageStatus.COMPLETED,
        startTime: Date.now() - 2500,
        endTime: Date.now() - 1000,
        duration: 1500,
        progress: 100,
        details: "Confidence metrics calculated across all algorithms"
      },
      benchmarkValidation: {
        id: "benchmarkValidation",
        name: "Benchmark Validation",
        status: PipelineStageStatus.COMPLETED,
        startTime: Date.now() - 1000,
        endTime: Date.now() - 500,
        duration: 500,
        progress: 100,
        details: "Results validated against industry benchmarks"
      },
      llmValidation: {
        id: "llmValidation",
        name: "LLM Validation",
        status: PipelineStageStatus.COMPLETED,
        startTime: Date.now() - 500,
        endTime: Date.now() - 200,
        duration: 300,
        progress: 100,
        details: "AI validation completed with positive assessment"
      },
      finalSelection: {
        id: "finalSelection",
        name: "Final Selection",
        status: PipelineStageStatus.COMPLETED,
        startTime: Date.now() - 200,
        endTime: Date.now(),
        duration: 200,
        progress: 100,
        details: "Optimal allocation selected and finalized"
      }
    }
  };

  const handleExport = (options: ExportOptions) => {
    console.log('Export requested with options:', options);
    
    // Here you could integrate with external export services
    // or perform additional processing before the built-in export
    
    // Example: Send export analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'export_results', {
        export_format: options.format,
        include_metrics: options.includeMetrics,
        include_visualization: options.includeVisualization,
        include_methodology: options.includeMethodology,
        include_pipeline: options.includePipelineData
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Export System Demo
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Test the export functionality with sample optimization results
        </p>
      </div>

      {/* Sample Results Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Sample Optimization Results
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allocation Summary */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              Channel Allocation
            </h3>
            <div className="space-y-2">
              {Object.entries(sampleData.allocation).map(([channel, allocation]) => (
                <div key={channel} className="flex justify-between items-center">
                  <span className="capitalize text-gray-600 dark:text-gray-400">
                    {channel}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${allocation * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12">
                      {(allocation * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              Performance Metrics
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Overall Confidence</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {(sampleData.confidence.overall * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Stability Score</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {(sampleData.confidence.stability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Expected Outcome</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  ${sampleData.detOutcome.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pipeline Duration</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {(samplePipeline.totalDuration! / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Export System */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Export Results
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Download your optimization results in various formats
              </p>
            </div>
            
            <ExportSystem
              data={sampleData}
              pipeline={samplePipeline}
              onExport={handleExport}
            />
          </div>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Export Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Supported Formats
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• <strong>PDF:</strong> Complete report with visualizations</li>
              <li>• <strong>PNG:</strong> Charts and flow diagrams</li>
              <li>• <strong>JSON:</strong> Raw data and metrics</li>
              <li>• <strong>CSV:</strong> Tabular data for analysis</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Export Options
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Performance metrics and confidence scores</li>
              <li>• Pipeline execution data and timing</li>
              <li>• Algorithm details and methodology</li>
              <li>• Visual charts and diagrams</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportSystemDemo;