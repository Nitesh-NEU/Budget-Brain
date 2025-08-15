/**
 * Confidence Dashboard Demo Page
 * 
 * Demonstrates the ConfidenceDashboard component with interactive examples
 */

import { ConfidenceDashboardDemo } from '@/components/ConfidenceDashboardDemo';

export default function ConfidenceDashboardDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ConfidenceDashboardDemo />
    </div>
  );
}

export const metadata = {
  title: 'Confidence Dashboard Demo - Budget Brain',
  description: 'Interactive demonstration of confidence metrics and algorithm performance visualization',
};