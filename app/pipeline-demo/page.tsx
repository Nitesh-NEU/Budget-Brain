/**
 * Pipeline Visualization Demo Page
 * 
 * Demonstrates the PipelineFlowVisualizer component with various scenarios
 */

"use client";
import React from 'react';
import PipelineFlowVisualizerDemo from '@/components/PipelineFlowVisualizerDemo';

export default function PipelineDemoPage() {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <header className="rounded-2xl p-6 bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow">
        <h1 className="text-2xl md:text-3xl font-bold">Pipeline Visualization Demo</h1>
        <p className="opacity-90">Interactive demonstration of the PipelineFlowVisualizer component</p>
      </header>

      {/* Demo Component */}
      <PipelineFlowVisualizerDemo />

      {/* Documentation */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Component Features</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Visual Features</h3>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
              <li>• Horizontal flow diagram with stage connections</li>
              <li>• Animated progress indicators for running stages</li>
              <li>• Color-coded status visualization (pending, running, completed, error)</li>
              <li>• Interactive stage selection with detailed information</li>
              <li>• Responsive design for mobile and tablet devices</li>
              <li>• Real-time progress updates with smooth animations</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Technical Features</h3>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
              <li>• TypeScript support with full type safety</li>
              <li>• Accessibility compliant with ARIA labels</li>
              <li>• Keyboard navigation support</li>
              <li>• Dark mode compatible styling</li>
              <li>• Customizable stage configurations</li>
              <li>• Error handling and fallback states</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Integration Guide */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Integration Guide</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">1. Import the Component</h3>
            <pre className="p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm overflow-x-auto">
{`import PipelineFlowVisualizer from '@/components/PipelineFlowVisualizer';
import { OptimizationPipeline } from '@/types/pipeline';`}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">2. Use with Pipeline Data</h3>
            <pre className="p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm overflow-x-auto">
{`<PipelineFlowVisualizer
  pipeline={optimizationPipeline}
  currentStage={currentStageId}
  onStageClick={(stageId) => handleStageSelection(stageId)}
/>`}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">3. Use with Custom Stages</h3>
            <pre className="p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm overflow-x-auto">
{`<PipelineFlowVisualizer
  stages={customStages}
  onStageClick={(stageId) => console.log('Selected:', stageId)}
  className="my-custom-class"
/>`}
            </pre>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <div className="text-center">
        <a 
          href="/" 
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          ← Back to Budget Optimizer
        </a>
      </div>
    </main>
  );
}