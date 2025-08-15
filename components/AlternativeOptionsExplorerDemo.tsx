/**
 * AlternativeOptionsExplorerDemo Component
 * 
 * Demo component showcasing the AlternativeOptionsExplorer with sample data
 */

"use client";
import React, { useState } from 'react';
import { AlternativeOptionsExplorer } from './AlternativeOptionsExplorer';
import { Channel, Allocation } from '@/types/shared';

// Sample alternative options data
const sampleAlternatives = [
  {
    id: 'alt-1',
    allocation: {
      google: 0.45,
      meta: 0.30,
      tiktok: 0.15,
      linkedin: 0.10
    } as Allocation,
    confidence: 0.92,
    performance: 0.88,
    reasoning: `This allocation prioritizes Google Ads due to strong historical performance in your industry vertical. The 45% allocation to Google is based on superior conversion rates (3.2% vs industry average of 2.1%) and lower cost-per-acquisition. Meta receives 30% allocation leveraging lookalike audiences and retargeting capabilities. TikTok allocation (15%) targets younger demographics with high engagement rates, while LinkedIn (10%) focuses on B2B lead generation with premium targeting options.`,
    algorithmSource: 'ensemble',
    expectedOutcome: 125000,
    riskLevel: 'low' as const,
    metadata: {
      convergenceScore: 0.94,
      iterationsRequired: 23,
      algorithmAgreement: 0.89,
      expectedCPA: 45.20,
      projectedROAS: 4.2
    }
  },
  {
    id: 'alt-2',
    allocation: {
      google: 0.35,
      meta: 0.40,
      tiktok: 0.20,
      linkedin: 0.05
    } as Allocation,
    confidence: 0.87,
    performance: 0.91,
    reasoning: `Meta-focused strategy leveraging advanced audience segmentation and dynamic creative optimization. This approach allocates 40% to Meta platforms, capitalizing on their sophisticated targeting algorithms and cross-platform reach (Facebook + Instagram). Google receives 35% with focus on high-intent search campaigns. TikTok gets increased allocation (20%) to capture emerging market trends and viral content opportunities. LinkedIn reduced to 5% due to higher CPCs in current market conditions.`,
    algorithmSource: 'bayesian',
    expectedOutcome: 132000,
    riskLevel: 'medium' as const,
    metadata: {
      bayesianConfidence: 0.87,
      priorStrength: 0.72,
      posteriorVariance: 0.15,
      expectedCPA: 42.80,
      projectedROAS: 4.6
    }
  },
  {
    id: 'alt-3',
    allocation: {
      google: 0.50,
      meta: 0.25,
      tiktok: 0.20,
      linkedin: 0.05
    } as Allocation,
    confidence: 0.85,
    performance: 0.86,
    reasoning: `Conservative Google-dominant strategy based on gradient optimization results. Allocates 50% to Google Ads for maximum stability and predictable returns. This approach minimizes risk by leveraging Google's mature advertising ecosystem and extensive keyword data. Meta allocation reduced to 25% focusing on high-performing audience segments. TikTok maintains 20% for growth potential, while LinkedIn reduced to 5% due to budget efficiency concerns.`,
    algorithmSource: 'gradient',
    expectedOutcome: 118000,
    riskLevel: 'low' as const,
    metadata: {
      gradientSteps: 156,
      convergenceRate: 0.023,
      localOptimum: false,
      expectedCPA: 48.50,
      projectedROAS: 3.9
    }
  },
  {
    id: 'alt-4',
    allocation: {
      google: 0.30,
      meta: 0.35,
      tiktok: 0.25,
      linkedin: 0.10
    } as Allocation,
    confidence: 0.79,
    performance: 0.94,
    reasoning: `Aggressive growth-oriented allocation emphasizing emerging platforms and social commerce. TikTok receives 25% allocation to capitalize on rapid user growth and lower competition. Meta gets 35% focusing on Reels and shopping features. Google reduced to 30% but concentrated on high-value keywords. LinkedIn maintains 10% for B2B opportunities. This strategy targets younger demographics and social commerce trends but carries higher volatility risk.`,
    algorithmSource: 'llm',
    expectedOutcome: 145000,
    riskLevel: 'high' as const,
    metadata: {
      llmConfidence: 0.79,
      reasoningScore: 0.91,
      marketTrendAlignment: 0.88,
      expectedCPA: 38.90,
      projectedROAS: 5.1
    }
  },
  {
    id: 'alt-5',
    allocation: {
      google: 0.40,
      meta: 0.30,
      tiktok: 0.15,
      linkedin: 0.15
    } as Allocation,
    confidence: 0.83,
    performance: 0.82,
    reasoning: `Balanced B2B-focused strategy with increased LinkedIn allocation. Google maintains 40% for search dominance, Meta 30% for broad reach, TikTok 15% for brand awareness, and LinkedIn 15% for professional targeting. This allocation optimizes for lead quality over quantity, particularly effective for B2B services and high-value products. The strategy balances performance marketing with brand building across professional and consumer channels.`,
    algorithmSource: 'hybrid',
    expectedOutcome: 115000,
    riskLevel: 'medium' as const,
    metadata: {
      b2bOptimization: true,
      leadQualityScore: 0.89,
      brandAwarenessImpact: 0.76,
      expectedCPA: 52.30,
      projectedROAS: 3.7
    }
  },
  {
    id: 'alt-6',
    allocation: {
      google: 0.38,
      meta: 0.32,
      tiktok: 0.22,
      linkedin: 0.08
    } as Allocation,
    confidence: 0.81,
    performance: 0.89,
    reasoning: `Data-driven allocation based on benchmark analysis and competitive intelligence. Google receives 38% allocation optimized for search volume trends and seasonal patterns. Meta gets 32% with emphasis on video content and Stories format. TikTok allocation increased to 22% based on engagement rate superiority and cost efficiency trends. LinkedIn reduced to 8% due to audience overlap optimization. This strategy adapts to current market dynamics while maintaining performance stability.`,
    algorithmSource: 'benchmark',
    expectedOutcome: 128000,
    riskLevel: 'medium' as const,
    metadata: {
      benchmarkDeviation: 0.12,
      competitiveAnalysis: 0.85,
      seasonalAdjustment: 0.93,
      expectedCPA: 44.70,
      projectedROAS: 4.4
    }
  }
];

const currentAllocation: Allocation = {
  google: 0.45,
  meta: 0.30,
  tiktok: 0.15,
  linkedin: 0.10
};

export const AlternativeOptionsExplorerDemo: React.FC = () => {
  const [selectedAlternative, setSelectedAlternative] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);

  const handleSelectAlternative = (option: any) => {
    setSelectedAlternative(option);
    setShowNotification(true);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Demo header */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Alternative Options Explorer Demo
        </h2>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          This demo shows how users can explore and compare different allocation strategies generated by various optimization algorithms. 
          Each option includes confidence scores, performance metrics, detailed reasoning, and risk assessments.
        </p>
      </div>

      {/* Current allocation display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
          Current Allocation (Baseline)
        </h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          {Object.entries(currentAllocation).map(([channel, value]) => (
            <div key={channel} className="text-center">
              <div className="capitalize font-medium text-gray-900 dark:text-gray-100">
                {channel}
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(value * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selection notification */}
      {showNotification && selectedAlternative && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800 dark:text-green-200">
              Selected alternative from <strong>{selectedAlternative.algorithmSource}</strong> algorithm 
              with {Math.round(selectedAlternative.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      )}

      {/* Alternative Options Explorer */}
      <AlternativeOptionsExplorer
        alternatives={sampleAlternatives}
        currentAllocation={currentAllocation}
        onSelectAlternative={handleSelectAlternative}
        maxDisplayed={4}
      />

      {/* Demo features explanation */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
          Demo Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Interactive Features:</h4>
            <ul className="space-y-1">
              <li>• Click "Details" to view full reasoning and methodology</li>
              <li>• Click "Select" to choose an alternative allocation</li>
              <li>• Sort options by confidence, performance, or risk level</li>
              <li>• Toggle between showing top options or all alternatives</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Visual Elements:</h4>
            <ul className="space-y-1">
              <li>• Color-coded confidence indicators and risk levels</li>
              <li>• Algorithm source badges for transparency</li>
              <li>• Interactive allocation visualizations</li>
              <li>• Performance metrics and expected outcomes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlternativeOptionsExplorerDemo;