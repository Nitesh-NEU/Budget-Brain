/**
 * Alternative Options Explorer Demo Page
 * 
 * Demonstrates the AlternativeOptionsExplorer component functionality
 */

import { AlternativeOptionsExplorerDemo } from '@/components/AlternativeOptionsExplorerDemo';

export default function AlternativeOptionsExplorerDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Alternative Options Explorer
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Interactive comparison and selection of alternative allocation strategies with detailed reasoning and confidence metrics.
            </p>
          </div>
          
          <AlternativeOptionsExplorerDemo />
        </div>
      </div>
    </div>
  );
}