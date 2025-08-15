/**
 * ExportSystem Component
 * 
 * Provides export functionality for pipeline visualization and metrics
 * with support for PDF, PNG, JSON, and CSV formats.
 */

"use client";
import React, { useState, useRef } from 'react';
import { 
  EnhancedModelResult, 
  OptimizationPipeline,
  PipelineStage,
  Channel 
} from '@/types/shared';

export interface ExportOptions {
  format: 'pdf' | 'png' | 'json' | 'csv';
  includeMetrics: boolean;
  includeVisualization: boolean;
  includeMethodology: boolean;
  includePipelineData: boolean;
}

interface ExportSystemProps {
  data: EnhancedModelResult;
  pipelineStages?: PipelineStage[];
  pipeline?: OptimizationPipeline;
  className?: string;
  onExport?: (options: ExportOptions) => void;
}

interface ExportFormatConfig {
  format: ExportOptions['format'];
  label: string;
  description: string;
  icon: React.ReactNode;
  supportedOptions: (keyof Omit<ExportOptions, 'format'>)[];
}

const ExportSystem: React.FC<ExportSystemProps> = ({
  data,
  pipelineStages = [],
  pipeline,
  className = '',
  onExport
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportOptions['format']>('pdf');
  const [exportOptions, setExportOptions] = useState<Omit<ExportOptions, 'format'>>({
    includeMetrics: true,
    includeVisualization: true,
    includeMethodology: true,
    includePipelineData: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const exportFormats: ExportFormatConfig[] = [
    {
      format: 'pdf',
      label: 'PDF Report',
      description: 'Complete report with visualizations and metrics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      supportedOptions: ['includeMetrics', 'includeVisualization', 'includeMethodology', 'includePipelineData']
    },
    {
      format: 'png',
      label: 'PNG Image',
      description: 'Visual charts and flow diagrams',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      supportedOptions: ['includeVisualization']
    },
    {
      format: 'json',
      label: 'JSON Data',
      description: 'Raw data and metrics in JSON format',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      supportedOptions: ['includeMetrics', 'includePipelineData']
    },
    {
      format: 'csv',
      label: 'CSV Data',
      description: 'Tabular data for spreadsheet analysis',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 002 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
      supportedOptions: ['includeMetrics', 'includePipelineData']
    }
  ];

  const currentFormatConfig = exportFormats.find(f => f.format === selectedFormat);

  const handleOptionChange = (option: keyof Omit<ExportOptions, 'format'>, value: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const generateFileName = (format: ExportOptions['format']): string => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const objective = data.objective || 'optimization';
    return `budget-optimization-${objective}-${timestamp}.${format}`;
  };

  const exportAsJSON = (): void => {
    const exportData = {
      ...(exportOptions.includeMetrics && {
        results: data,
        confidence: data.confidence,
        validation: data.validation,
        alternatives: data.alternatives
      }),
      ...(exportOptions.includePipelineData && pipeline && {
        pipeline: {
          id: pipeline.id,
          status: pipeline.status,
          totalDuration: pipeline.totalDuration,
          stages: Object.values(pipeline.stages).map(stage => ({
            id: stage.id,
            name: stage.name,
            status: stage.status,
            duration: stage.duration,
            progress: stage.progress
          }))
        }
      }),
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        format: 'json',
        options: exportOptions
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    downloadBlob(blob, generateFileName('json'));
  };

  const exportAsCSV = (): void => {
    let csvContent = '';
    
    if (exportOptions.includeMetrics) {
      // Allocation data
      csvContent += 'Channel Allocation\n';
      csvContent += 'Channel,Allocation,Confidence\n';
      Object.entries(data.allocation).forEach(([channel, allocation]) => {
        const confidence = data.confidence.perChannel[channel as Channel] || 0;
        csvContent += `${channel},${(allocation * 100).toFixed(2)}%,${(confidence * 100).toFixed(2)}%\n`;
      });
      
      csvContent += '\n';
      
      // Performance metrics
      csvContent += 'Performance Metrics\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Overall Confidence,${(data.confidence.overall * 100).toFixed(2)}%\n`;
      csvContent += `Stability Score,${(data.confidence.stability * 100).toFixed(2)}%\n`;
      csvContent += `Deterministic Outcome,${data.detOutcome.toFixed(2)}\n`;
      csvContent += `Monte Carlo P10,${data.mc.p10.toFixed(2)}\n`;
      csvContent += `Monte Carlo P50,${data.mc.p50.toFixed(2)}\n`;
      csvContent += `Monte Carlo P90,${data.mc.p90.toFixed(2)}\n`;
      
      csvContent += '\n';
    }
    
    if (exportOptions.includePipelineData && pipeline) {
      csvContent += 'Pipeline Stages\n';
      csvContent += 'Stage,Status,Duration (ms),Progress\n';
      Object.values(pipeline.stages).forEach(stage => {
        csvContent += `${stage.name},${stage.status},${stage.duration || 0},${stage.progress || 0}%\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadBlob(blob, generateFileName('csv'));
  };

  const exportAsPNG = async (): Promise<void> => {
    if (!exportRef.current) return;
    
    try {
      // For PNG export, we would typically use html2canvas or similar
      // Since it's not installed, we'll create a simple canvas-based export
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = 800;
      canvas.height = 600;
      
      // Simple visualization export (placeholder implementation)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#1f2937';
      ctx.font = '24px Arial';
      ctx.fillText('Budget Optimization Results', 50, 50);
      
      ctx.font = '16px Arial';
      let y = 100;
      
      // Draw allocation data
      ctx.fillText('Channel Allocation:', 50, y);
      y += 30;
      
      Object.entries(data.allocation).forEach(([channel, allocation]) => {
        ctx.fillText(`${channel}: ${(allocation * 100).toFixed(1)}%`, 70, y);
        y += 25;
      });
      
      y += 20;
      ctx.fillText(`Overall Confidence: ${(data.confidence.overall * 100).toFixed(1)}%`, 50, y);
      
      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, generateFileName('png'));
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Error exporting PNG:', error);
    }
  };

  const exportAsPDF = async (): Promise<void> => {
    // For PDF export, we would typically use jsPDF or similar
    // Since it's not installed, we'll create a simple text-based PDF export
    try {
      let pdfContent = `Budget Optimization Report
Generated: ${new Date().toLocaleString()}

=== ALLOCATION RESULTS ===
`;
      
      if (exportOptions.includeMetrics) {
        Object.entries(data.allocation).forEach(([channel, allocation]) => {
          const confidence = data.confidence.perChannel[channel as Channel] || 0;
          pdfContent += `${channel.toUpperCase()}: ${(allocation * 100).toFixed(2)}% (Confidence: ${(confidence * 100).toFixed(1)}%)\n`;
        });
        
        pdfContent += `
=== PERFORMANCE METRICS ===
Overall Confidence: ${(data.confidence.overall * 100).toFixed(2)}%
Stability Score: ${(data.confidence.stability * 100).toFixed(2)}%
Deterministic Outcome: ${data.detOutcome.toFixed(2)}
Monte Carlo Results:
  P10: ${data.mc.p10.toFixed(2)}
  P50: ${data.mc.p50.toFixed(2)}
  P90: ${data.mc.p90.toFixed(2)}
`;
      }
      
      if (exportOptions.includeMethodology) {
        pdfContent += `
=== METHODOLOGY ===
Algorithms Used: ${data.validation.alternativeAlgorithms.map(a => a.name).join(', ')}
Consensus Agreement: ${(data.validation.consensus.agreement * 100).toFixed(1)}%
Benchmark Deviation: ${(data.validation.benchmarkComparison.deviationScore * 100).toFixed(1)}%
`;
      }
      
      if (exportOptions.includePipelineData && pipeline) {
        pdfContent += `
=== PIPELINE EXECUTION ===
Total Duration: ${pipeline.totalDuration || 0}ms
Status: ${pipeline.status}

Stage Details:
`;
        Object.values(pipeline.stages).forEach(stage => {
          pdfContent += `  ${stage.name}: ${stage.status} (${stage.duration || 0}ms)\n`;
        });
      }
      
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const filename = `budget-optimization-${data.objective || 'optimization'}-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.txt`;
      downloadBlob(blob, filename); // Save as txt since we don't have PDF library
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (): Promise<void> => {
    setIsExporting(true);
    
    try {
      const fullOptions: ExportOptions = {
        format: selectedFormat,
        ...exportOptions
      };
      
      // Call external handler if provided
      if (onExport) {
        onExport(fullOptions);
      }
      
      // Handle built-in export functionality
      switch (selectedFormat) {
        case 'json':
          exportAsJSON();
          break;
        case 'csv':
          exportAsCSV();
          break;
        case 'png':
          await exportAsPNG();
          break;
        case 'pdf':
          await exportAsPDF();
          break;
      }
      
      // Close modal after successful export
      setTimeout(() => {
        setIsOpen(false);
      }, 1000);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={className}>
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Results
      </button>

      {/* Export Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Export Results
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Format Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {exportFormats.map((format) => (
                    <button
                      key={format.format}
                      onClick={() => setSelectedFormat(format.format)}
                      className={`p-3 rounded-lg border-2 transition-colors text-left ${
                        selectedFormat === format.format
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <div className={`${selectedFormat === format.format ? 'text-blue-600' : 'text-gray-400'}`}>
                          {format.icon}
                        </div>
                        <span className="ml-2 font-medium text-sm text-gray-900 dark:text-gray-100">
                          {format.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {format.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              {currentFormatConfig && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Include in Export
                  </label>
                  <div className="space-y-3">
                    {currentFormatConfig.supportedOptions.map((option) => {
                      const optionLabels = {
                        includeMetrics: 'Performance Metrics',
                        includeVisualization: 'Charts & Visualizations',
                        includeMethodology: 'Algorithm Details',
                        includePipelineData: 'Pipeline Execution Data'
                      };
                      
                      return (
                        <label key={option} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={exportOptions[option]}
                            onChange={(e) => handleOptionChange(option, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {optionLabels[option]}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </div>
                  ) : (
                    'Export'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden div for PNG export reference */}
      <div ref={exportRef} className="hidden">
        {/* This would contain the visualization elements for PNG export */}
      </div>
    </div>
  );
};

export default ExportSystem;