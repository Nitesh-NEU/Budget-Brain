/**
 * Data Quality Panel Demo Page
 * 
 * Demo page showcasing the DataQualityPanel component with various
 * data quality scenarios and interactive examples.
 */

import { DataQualityPanelDemo } from '@/components/DataQualityPanelDemo';

export default function DataQualityDemoPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DataQualityPanelDemo />
    </main>
  );
}

export const metadata = {
  title: 'Data Quality Panel Demo',
  description: 'Interactive demonstration of data quality indicators, citation validation, and benchmark analysis features.',
};