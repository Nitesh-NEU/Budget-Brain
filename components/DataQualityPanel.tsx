/**
 * DataQualityPanel Component
 * 
 * Displays data quality indicators, citation validation status, benchmark
 * deviation warnings, and data source reliability scoring with expandable
 * sections for detailed quality metrics.
 */

"use client";
import React, { useState, useEffect } from 'react';
import { 
  Channel, 
  Citation, 
  ValidationWarning, 
  BenchmarkAnalysis 
} from '@/types/shared';

// Data quality interfaces based on design document
interface DataSourceQuality {
  source: string;
  reliability: number; // 0-1 score
  lastUpdated?: string;
  validationStatus: 'valid' | 'warning' | 'error';
  issues?: string[];
}

interface CitationQuality extends Citation {
  validationStatus: 'valid' | 'invalid' | 'pending' | 'warning';
  lastChecked?: string;
  responseTime?: number;
  contentQuality?: number; // 0-1 score
  issues?: string[];
}

interface DataQualityInfo {
  citations: CitationQuality[];
  benchmarkAnalysis: BenchmarkAnalysis;
  warnings: ValidationWarning[];
  sourceQuality: Record<string, DataSourceQuality>;
  overallScore: number; // 0-1 overall data quality score
  lastValidated: string;
}

interface DataQualityPanelProps {
  dataQuality: DataQualityInfo;
  expandable?: boolean;
  className?: string;
}

// Severity indicator component
const SeverityIndicator: React.FC<{ severity: ValidationWarning['severity'] }> = ({ severity }) => {
  const getSeverityConfig = (sev: ValidationWarning['severity']) => {
    switch (sev) {
      case 'high':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '⚠️',
          label: 'High'
        };
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '⚡',
          label: 'Medium'
        };
      case 'low':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: 'ℹ️',
          label: 'Low'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '•',
          label: 'Unknown'
        };
    }
  };
  
  const config = getSeverityConfig(severity);
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

// Citation quality card component
const CitationQualityCard: React.FC<{ 
  citation: CitationQuality; 
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ citation, isExpanded, onToggle }) => {
  const getValidationStatusConfig = (status: CitationQuality['validationStatus']) => {
    switch (status) {
      case 'valid':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          icon: '✓',
          label: 'Valid'
        };
      case 'invalid':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
          icon: '✗',
          label: 'Invalid'
        };
      case 'warning':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200',
          icon: '⚠',
          label: 'Warning'
        };
      case 'pending':
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200',
          icon: '⏳',
          label: 'Pending'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200',
          icon: '?',
          label: 'Unknown'
        };
    }
  };
  
  const statusConfig = getValidationStatusConfig(citation.validationStatus);
  
  return (
    <div className={`border rounded-lg p-3 transition-all duration-200 ${statusConfig.bgColor}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between focus:outline-none"
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <span className={`text-lg ${statusConfig.color}`}>
            {statusConfig.icon}
          </span>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {citation.title || 'Untitled Citation'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {citation.url}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-2">
          <span className={`text-xs font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
          {citation.contentQuality !== undefined && (
            <div className="flex items-center space-x-1">
              <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${citation.contentQuality * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">
                {Math.round(citation.contentQuality * 100)}%
              </span>
            </div>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2 text-sm">
            {citation.lastChecked && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Checked:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {new Date(citation.lastChecked).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {citation.responseTime !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {citation.responseTime}ms
                </span>
              </div>
            )}
            
            {citation.note && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Note:</span>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {citation.note}
                </p>
              </div>
            )}
            
            {citation.issues && citation.issues.length > 0 && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Issues:</span>
                <ul className="mt-1 space-y-1">
                  {citation.issues.map((issue, index) => (
                    <li key={index} className="text-red-600 text-xs flex items-center">
                      <span className="mr-1">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Benchmark deviation warning component
const BenchmarkDeviationCard: React.FC<{ analysis: BenchmarkAnalysis }> = ({ analysis }) => {
  const getDeviationSeverity = (score: number): ValidationWarning['severity'] => {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  };
  
  const deviationSeverity = getDeviationSeverity(analysis.deviationScore);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          Benchmark Deviation Analysis
        </h4>
        <SeverityIndicator severity={deviationSeverity} />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Overall Deviation</span>
          <div className="flex items-center space-x-2">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  analysis.deviationScore >= 0.8 ? 'bg-red-500' :
                  analysis.deviationScore >= 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${analysis.deviationScore * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {Math.round(analysis.deviationScore * 100)}%
            </span>
          </div>
        </div>
        
        <div>
          <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">
            Channel Deviations
          </span>
          <div className="space-y-2">
            {Object.entries(analysis.channelDeviations).map(([channel, deviation]) => (
              <div key={channel} className="flex items-center justify-between text-sm">
                <span className="capitalize text-gray-900 dark:text-gray-100">{channel}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        deviation >= 0.8 ? 'bg-red-500' :
                        deviation >= 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${deviation * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    {Math.round(deviation * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Data source reliability component
const DataSourceReliabilityCard: React.FC<{ 
  sources: Record<string, DataSourceQuality>;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ sources, isExpanded, onToggle }) => {
  const sourceEntries = Object.entries(sources);
  const averageReliability = sourceEntries.reduce((sum, [, source]) => sum + source.reliability, 0) / sourceEntries.length;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between focus:outline-none mb-3"
      >
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          Data Source Reliability
        </h4>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${averageReliability * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {Math.round(averageReliability * 100)}%
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {isExpanded && (
        <div className="space-y-3">
          {sourceEntries.map(([sourceName, source]) => (
            <div key={sourceName} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {sourceName}
                </span>
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    source.validationStatus === 'valid' ? 'bg-green-500' :
                    source.validationStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {Math.round(source.reliability * 100)}%
                  </span>
                </div>
              </div>
              
              {source.lastUpdated && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Last updated: {new Date(source.lastUpdated).toLocaleDateString()}
                </p>
              )}
              
              {source.issues && source.issues.length > 0 && (
                <div className="mt-2">
                  <ul className="space-y-1">
                    {source.issues.map((issue, index) => (
                      <li key={index} className="text-xs text-red-600 flex items-center">
                        <span className="mr-1">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main DataQualityPanel component
export const DataQualityPanel: React.FC<DataQualityPanelProps> = ({
  dataQuality,
  expandable = true,
  className = ''
}) => {
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());
  const [showAllWarnings, setShowAllWarnings] = useState(false);
  const [showSourceDetails, setShowSourceDetails] = useState(false);
  const [isMainPanelExpanded, setIsMainPanelExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-collapse on mobile for better UX
      if (mobile && !isCollapsed) {
        setIsCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isCollapsed]);
  
  const toggleCitationExpansion = (url: string) => {
    const newExpanded = new Set(expandedCitations);
    if (newExpanded.has(url)) {
      newExpanded.delete(url);
    } else {
      newExpanded.add(url);
    }
    setExpandedCitations(newExpanded);
  };
  
  const getOverallQualityColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };
  
  const validCitations = dataQuality.citations.filter(c => c.validationStatus === 'valid').length;
  const totalCitations = dataQuality.citations.length;
  
  const highSeverityWarnings = dataQuality.warnings.filter(w => w.severity === 'high').length;
  const mediumSeverityWarnings = dataQuality.warnings.filter(w => w.severity === 'medium').length;
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isMobile ? 'flex-col space-y-3' : ''}`}>
        <div className={isMobile ? 'text-center' : ''}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center space-x-2 ${isMobile ? 'w-full justify-center' : ''} focus:outline-none`}
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Data Quality Panel
            </h2>
            {isMobile && (
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  isCollapsed ? '' : 'rotate-180'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Source validation, citation quality, and benchmark analysis
          </p>
        </div>
        
        {expandable && (
          <button
            onClick={() => setIsMainPanelExpanded(!isMainPanelExpanded)}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-h-[44px]"
          >
            {isMainPanelExpanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>
      
      {/* Overall Quality Score */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <div className={`flex items-center justify-between ${isMobile ? 'flex-col space-y-3 text-center' : ''}`}>
          <div className={isMobile ? 'text-center' : ''}>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Overall Data Quality
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last validated: {new Date(dataQuality.lastValidated).toLocaleDateString()}
            </p>
          </div>
          
          <div className={`text-right ${isMobile ? 'text-center' : ''}`}>
            <div className={`text-2xl font-bold ${getOverallQualityColor(dataQuality.overallScore)}`}>
              {Math.round(dataQuality.overallScore * 100)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {validCitations}/{totalCitations} citations valid
            </div>
          </div>
        </div>
        
        {(highSeverityWarnings > 0 || mediumSeverityWarnings > 0) && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4 text-sm">
              {highSeverityWarnings > 0 && (
                <div className="flex items-center space-x-1 text-red-600">
                  <span>⚠️</span>
                  <span>{highSeverityWarnings} high priority issues</span>
                </div>
              )}
              {mediumSeverityWarnings > 0 && (
                <div className="flex items-center space-x-1 text-yellow-600">
                  <span>⚡</span>
                  <span>{mediumSeverityWarnings} medium priority issues</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {(isMainPanelExpanded && (!isMobile || !isCollapsed)) && (
        <>
          {/* Citation Quality Indicators */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Citation Quality ({totalCitations} sources)
              </h3>
            </div>
            
            <div className="space-y-2">
              {dataQuality.citations.map((citation, index) => (
                <CitationQualityCard
                  key={`${citation.url}-${index}`}
                  citation={citation}
                  isExpanded={expandedCitations.has(citation.url)}
                  onToggle={() => toggleCitationExpansion(citation.url)}
                />
              ))}
            </div>
          </div>
          
          {/* Benchmark Deviation Warnings */}
          <BenchmarkDeviationCard analysis={dataQuality.benchmarkAnalysis} />
          
          {/* Data Source Reliability */}
          <DataSourceReliabilityCard
            sources={dataQuality.sourceQuality}
            isExpanded={showSourceDetails}
            onToggle={() => setShowSourceDetails(!showSourceDetails)}
          />
          
          {/* Validation Warnings */}
          {dataQuality.warnings.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Validation Warnings ({dataQuality.warnings.length})
                </h3>
                {dataQuality.warnings.length > 3 && (
                  <button
                    onClick={() => setShowAllWarnings(!showAllWarnings)}
                    className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none"
                  >
                    {showAllWarnings ? 'Show Less' : 'Show All'}
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                {(showAllWarnings ? dataQuality.warnings : dataQuality.warnings.slice(0, 3))
                  .map((warning, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <SeverityIndicator severity={warning.severity} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {warning.message}
                        </p>
                        {warning.channel && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Channel: {warning.channel}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DataQualityPanel;