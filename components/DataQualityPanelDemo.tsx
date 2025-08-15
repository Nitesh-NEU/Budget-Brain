/**
 * DataQualityPanelDemo Component
 * 
 * Demo component showcasing the DataQualityPanel with sample data
 * for testing and development purposes.
 */

"use client";
import React from 'react';
import { DataQualityPanel } from './DataQualityPanel';
import { Channel, ValidationWarning, BenchmarkAnalysis } from '@/types/shared';

// Sample data for demonstration
const sampleDataQuality = {
  citations: [
    {
      title: "Google Ads Benchmark Report 2024",
      url: "https://ads.google.com/benchmark-report-2024",
      note: "Official Google Ads performance benchmarks",
      validationStatus: 'valid' as const,
      lastChecked: "2024-01-15T10:30:00Z",
      responseTime: 245,
      contentQuality: 0.95,
    },
    {
      title: "Meta Advertising Performance Study",
      url: "https://business.facebook.com/performance-study-2024",
      note: "Meta's internal performance analysis",
      validationStatus: 'valid' as const,
      lastChecked: "2024-01-14T15:45:00Z",
      responseTime: 180,
      contentQuality: 0.88,
    },
    {
      title: "TikTok Ads Manager Insights",
      url: "https://ads.tiktok.com/insights-report",
      note: "TikTok advertising platform insights",
      validationStatus: 'warning' as const,
      lastChecked: "2024-01-13T09:20:00Z",
      responseTime: 1200,
      contentQuality: 0.72,
      issues: [
        "Slow response time detected",
        "Content freshness warning - data may be outdated"
      ]
    },
    {
      title: "LinkedIn Campaign Manager Data",
      url: "https://campaign-manager.linkedin.com/data-export",
      note: "LinkedIn campaign performance data",
      validationStatus: 'invalid' as const,
      lastChecked: "2024-01-12T14:10:00Z",
      responseTime: 5000,
      contentQuality: 0.45,
      issues: [
        "URL returns 404 error",
        "Authentication required",
        "Data format incompatible"
      ]
    },
    {
      title: "Industry Benchmark Database",
      url: "https://marketingbenchmarks.com/api/data",
      note: "Third-party industry benchmarks",
      validationStatus: 'pending' as const,
      lastChecked: "2024-01-16T08:00:00Z",
      contentQuality: 0.68,
    },
    {
      title: "Historical Performance Archive",
      url: "https://internal-data.company.com/archive",
      note: "Internal historical performance data",
      validationStatus: 'valid' as const,
      lastChecked: "2024-01-16T12:00:00Z",
      responseTime: 95,
      contentQuality: 0.92,
    }
  ],
  benchmarkAnalysis: {
    deviationScore: 0.65,
    channelDeviations: {
      google: 0.45,
      meta: 0.72,
      tiktok: 0.88,
      linkedin: 0.55
    } as Record<Channel, number>,
    warnings: [
      {
        type: "high_deviation",
        message: "TikTok allocation significantly deviates from industry benchmarks",
        severity: "high" as const,
        channel: "tiktok" as Channel
      },
      {
        type: "moderate_deviation", 
        message: "Meta allocation shows moderate deviation from expected ranges",
        severity: "medium" as const,
        channel: "meta" as Channel
      }
    ] as ValidationWarning[]
  } as BenchmarkAnalysis,
  warnings: [
    {
      type: "data_freshness",
      message: "Some benchmark data is older than 30 days and may not reflect current market conditions",
      severity: "medium" as const
    },
    {
      type: "citation_failure",
      message: "LinkedIn Campaign Manager data source is currently unavailable",
      severity: "high" as const,
      channel: "linkedin" as Channel
    },
    {
      type: "response_time",
      message: "TikTok Ads Manager API showing elevated response times",
      severity: "low" as const,
      channel: "tiktok" as Channel
    },
    {
      type: "validation_pending",
      message: "Industry benchmark database validation is still in progress",
      severity: "low" as const
    },
    {
      type: "content_quality",
      message: "Some data sources show reduced content quality scores",
      severity: "medium" as const
    }
  ] as ValidationWarning[],
  sourceQuality: {
    "Google Ads API": {
      source: "Google Ads API",
      reliability: 0.95,
      lastUpdated: "2024-01-15T10:30:00Z",
      validationStatus: 'valid' as const
    },
    "Meta Marketing API": {
      source: "Meta Marketing API", 
      reliability: 0.88,
      lastUpdated: "2024-01-14T15:45:00Z",
      validationStatus: 'valid' as const
    },
    "TikTok Ads Manager": {
      source: "TikTok Ads Manager",
      reliability: 0.72,
      lastUpdated: "2024-01-13T09:20:00Z",
      validationStatus: 'warning' as const,
      issues: [
        "Intermittent API timeouts",
        "Data freshness concerns"
      ]
    },
    "LinkedIn Campaign Manager": {
      source: "LinkedIn Campaign Manager",
      reliability: 0.45,
      lastUpdated: "2024-01-10T12:00:00Z",
      validationStatus: 'error' as const,
      issues: [
        "API endpoint unavailable",
        "Authentication failures",
        "Data export errors"
      ]
    },
    "Industry Benchmarks DB": {
      source: "Industry Benchmarks DB",
      reliability: 0.78,
      lastUpdated: "2024-01-12T18:30:00Z",
      validationStatus: 'valid' as const
    },
    "Internal Data Archive": {
      source: "Internal Data Archive",
      reliability: 0.92,
      lastUpdated: "2024-01-16T12:00:00Z",
      validationStatus: 'valid' as const
    }
  },
  overallScore: 0.75,
  lastValidated: "2024-01-16T14:30:00Z"
};

export const DataQualityPanelDemo: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Data Quality Panel Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Interactive demonstration of data quality indicators, citation validation, 
          and benchmark analysis features.
        </p>
      </div>
      
      {/* Demo with expandable panel */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Full Data Quality Panel (Expandable)
        </h2>
        <DataQualityPanel 
          dataQuality={sampleDataQuality}
          expandable={true}
          className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg"
        />
      </div>
      
      {/* Demo with always expanded panel */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Always Expanded Panel
        </h2>
        <DataQualityPanel 
          dataQuality={sampleDataQuality}
          expandable={false}
          className="bg-white dark:bg-gray-800 border rounded-lg p-4"
        />
      </div>
      
      {/* Demo with high quality data */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          High Quality Data Example
        </h2>
        <DataQualityPanel 
          dataQuality={{
            ...sampleDataQuality,
            overallScore: 0.92,
            citations: sampleDataQuality.citations.map(c => ({
              ...c,
              validationStatus: 'valid' as const,
              contentQuality: Math.max(0.85, c.contentQuality || 0.85),
              issues: []
            })),
            warnings: sampleDataQuality.warnings.filter(w => w.severity === 'low').slice(0, 1),
            benchmarkAnalysis: {
              ...sampleDataQuality.benchmarkAnalysis,
              deviationScore: 0.25,
              channelDeviations: {
                google: 0.15,
                meta: 0.22,
                tiktok: 0.35,
                linkedin: 0.18
              } as Record<Channel, number>,
              warnings: []
            }
          }}
          expandable={false}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
        />
      </div>
      
      {/* Demo with poor quality data */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Poor Quality Data Example
        </h2>
        <DataQualityPanel 
          dataQuality={{
            ...sampleDataQuality,
            overallScore: 0.35,
            citations: sampleDataQuality.citations.map(c => ({
              ...c,
              validationStatus: Math.random() > 0.6 ? 'invalid' as const : 'warning' as const,
              contentQuality: Math.min(0.5, c.contentQuality || 0.3),
              issues: [
                "Data validation failed",
                "Source unreliable",
                "Content quality below threshold"
              ]
            })),
            warnings: [
              ...sampleDataQuality.warnings,
              {
                type: "critical_failure",
                message: "Multiple data sources are failing validation",
                severity: "high" as const
              },
              {
                type: "data_corruption",
                message: "Potential data corruption detected in benchmark sources",
                severity: "high" as const
              }
            ],
            benchmarkAnalysis: {
              ...sampleDataQuality.benchmarkAnalysis,
              deviationScore: 0.95,
              channelDeviations: {
                google: 0.85,
                meta: 0.92,
                tiktok: 0.98,
                linkedin: 0.88
              } as Record<Channel, number>,
              warnings: [
                ...sampleDataQuality.benchmarkAnalysis.warnings,
                {
                  type: "extreme_deviation",
                  message: "All channels show extreme deviation from benchmarks",
                  severity: "high" as const
                }
              ]
            }
          }}
          expandable={false}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        />
      </div>
      
      {/* Usage Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Usage Instructions
        </h3>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>• <strong>Citation Cards:</strong> Click to expand and view detailed validation information</p>
          <p>• <strong>Severity Indicators:</strong> Color-coded badges show issue priority levels</p>
          <p>• <strong>Progress Bars:</strong> Visual indicators for quality scores and deviation levels</p>
          <p>• <strong>Source Reliability:</strong> Expandable section showing data source health</p>
          <p>• <strong>Benchmark Analysis:</strong> Shows how allocations compare to industry standards</p>
          <p>• <strong>Validation Warnings:</strong> Collapsible list of data quality issues</p>
        </div>
      </div>
    </div>
  );
};

export default DataQualityPanelDemo;