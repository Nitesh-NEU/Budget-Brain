/**
 * ConfidenceDashboard Component
 * 
 * Displays confidence scores and algorithm performance metrics with
 * circular progress indicators, per-channel confidence, and consensus data.
 */

"use client";
import React, { useState, useEffect } from 'react';
import { 
  Channel, 
  AlgorithmResult, 
  ConsensusMetrics, 
  EnhancedModelResult 
} from '@/types/shared';

interface ConfidenceMetrics {
  overall: number;
  perChannel: Record<Channel, number>;
  stability: number;
  algorithms: AlgorithmResult[];
  consensus: ConsensusMetrics;
}

interface ConfidenceDashboardProps {
  confidence: ConfidenceMetrics;
  showDetails?: boolean;
  className?: string;
}

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  showPercentage?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 80,
  strokeWidth = 8,
  color = '#3B82F6',
  backgroundColor = '#E5E7EB',
  label,
  showPercentage = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  const getColorByValue = (val: number): string => {
    if (val >= 80) return '#10B981'; // Green
    if (val >= 60) return '#F59E0B'; // Yellow
    if (val >= 40) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };
  
  const displayColor = color === '#3B82F6' ? getColorByValue(value) : color;
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={displayColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {Math.round(value)}%
          </span>
        )}
        {label && (
          <span className="text-xs text-gray-600 dark:text-gray-400 text-center">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

const AlgorithmBadge: React.FC<{ algorithm: AlgorithmResult; isSelected: boolean; onClick: () => void }> = ({
  algorithm,
  isSelected,
  onClick
}) => {
  const getAlgorithmColor = (name: string): string => {
    const colors: Record<string, string> = {
      'ensemble': 'bg-blue-100 text-blue-800 border-blue-200',
      'bayesian': 'bg-purple-100 text-purple-800 border-purple-200',
      'gradient': 'bg-green-100 text-green-800 border-green-200',
      'llm': 'bg-orange-100 text-orange-800 border-orange-200',
      'benchmark': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    const key = name.toLowerCase();
    return colors[key] || 'bg-gray-100 text-gray-800 border-gray-200';
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200
        ${getAlgorithmColor(algorithm.name)}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
        hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
      `}
    >
      <span>{algorithm.name}</span>
      <span className="ml-1 font-bold">
        {Math.round(algorithm.confidence * 100)}%
      </span>
    </button>
  );
};

const ChannelConfidenceCard: React.FC<{ 
  channel: Channel; 
  confidence: number; 
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ channel, confidence, isExpanded, onToggle }) => {
  const getChannelIcon = (ch: Channel): React.ReactNode => {
    const iconClass = "w-5 h-5";
    
    switch (ch) {
      case 'google':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'meta':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'tiktok':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
        );
      case 'linkedin':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        );
      default:
        return (
          <div className={`${iconClass} bg-gray-300 rounded`} />
        );
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 hover:shadow-sm transition-shadow">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between focus:outline-none"
      >
        <div className="flex items-center space-x-3">
          <div className="text-gray-600 dark:text-gray-400">
            {getChannelIcon(channel)}
          </div>
          <span className="font-medium capitalize text-gray-900 dark:text-gray-100">
            {channel}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <CircularProgress
            value={confidence * 100}
            size={40}
            strokeWidth={4}
            showPercentage={false}
          />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {Math.round(confidence * 100)}%
          </span>
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
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Channel-specific confidence metrics and performance indicators would be displayed here.</p>
          </div>
        </div>
      )}
    </div>
  );
};

const ConsensusIndicator: React.FC<{ consensus: ConsensusMetrics }> = ({ consensus }) => {
  const agreementColor = consensus.agreement >= 0.8 ? 'text-green-600' : 
                        consensus.agreement >= 0.6 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Algorithm Consensus
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Agreement Level</span>
          <div className="flex items-center space-x-2">
            <CircularProgress
              value={consensus.agreement * 100}
              size={32}
              strokeWidth={3}
              showPercentage={false}
            />
            <span className={`font-semibold ${agreementColor}`}>
              {Math.round(consensus.agreement * 100)}%
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Outliers</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {consensus.outlierCount}
          </span>
        </div>
        
        <div className="mt-3">
          <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">
            Channel Variance
          </span>
          <div className="space-y-1">
            {Object.entries(consensus.variance).map(([channel, variance]) => (
              <div key={channel} className="flex items-center justify-between text-xs">
                <span className="capitalize">{channel}</span>
                <span className="font-mono">
                  {(variance * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ConfidenceDashboard: React.FC<ConfidenceDashboardProps> = ({
  confidence,
  showDetails = false,
  className = ''
}) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(null);
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());
  const [showAllDetails, setShowAllDetails] = useState(showDetails);
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
  
  const toggleChannelExpansion = (channel: string) => {
    const newExpanded = new Set(expandedChannels);
    if (newExpanded.has(channel)) {
      newExpanded.delete(channel);
    } else {
      newExpanded.add(channel);
    }
    setExpandedChannels(newExpanded);
  };
  
  const handleAlgorithmClick = (algorithmName: string) => {
    setSelectedAlgorithm(selectedAlgorithm === algorithmName ? null : algorithmName);
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isMobile ? 'flex-col space-y-3' : ''}`}>
        <div className={isMobile ? 'text-center' : ''}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center space-x-2 ${isMobile ? 'w-full justify-center' : ''} focus:outline-none`}
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Confidence Dashboard
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
            Algorithm performance and reliability metrics
          </p>
        </div>
        
        <div className={`flex items-center space-x-2 ${isMobile ? 'w-full justify-center' : ''}`}>
          <button
            onClick={() => setShowAllDetails(!showAllDetails)}
            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-h-[44px]"
          >
            {showAllDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>
      
      {/* Collapsible content */}
      {(!isMobile || !isCollapsed) && (
        <div className="space-y-6">
      
      {/* Overall Confidence */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Overall Confidence
          </h3>
        </div>
        
        <div className={`flex items-center justify-center ${isMobile ? 'flex-col space-y-6' : 'space-x-8'}`}>
          <div className="text-center">
            <CircularProgress
              value={confidence.overall * 100}
              size={isMobile ? 100 : 120}
              strokeWidth={isMobile ? 10 : 12}
              label="Overall"
            />
          </div>
          
          <div className="text-center">
            <CircularProgress
              value={confidence.stability * 100}
              size={isMobile ? 100 : 120}
              strokeWidth={isMobile ? 10 : 12}
              label="Stability"
            />
          </div>
        </div>
      </div>
      
      {/* Algorithm Contributions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Algorithm Contributions
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {confidence.algorithms.map((algorithm) => (
            <AlgorithmBadge
              key={algorithm.name}
              algorithm={algorithm}
              isSelected={selectedAlgorithm === algorithm.name}
              onClick={() => handleAlgorithmClick(algorithm.name)}
            />
          ))}
        </div>
        
        {selectedAlgorithm && showAllDetails && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {(() => {
              const algorithm = confidence.algorithms.find(a => a.name === selectedAlgorithm);
              if (!algorithm) return null;
              
              return (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {algorithm.name} Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                      <span className="ml-2 font-medium">
                        {Math.round(algorithm.confidence * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Performance:</span>
                      <span className="ml-2 font-medium">
                        {Math.round(algorithm.performance * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Allocation:</span>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(algorithm.allocation).map(([channel, value]) => (
                        <div key={channel} className="flex justify-between">
                          <span className="capitalize">{channel}:</span>
                          <span className="font-mono">{Math.round(value * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
      
      {/* Per-Channel Confidence */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Per-Channel Confidence
        </h3>
        
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {Object.entries(confidence.perChannel).map(([channel, conf]) => (
            <ChannelConfidenceCard
              key={channel}
              channel={channel as Channel}
              confidence={conf}
              isExpanded={expandedChannels.has(channel)}
              onToggle={() => toggleChannelExpansion(channel)}
            />
          ))}
        </div>
      </div>
      
      {/* Consensus Metrics */}
      {showAllDetails && (
        <ConsensusIndicator consensus={confidence.consensus} />
      )}
      
        </div>
      )}
    </div>
  );
};

export default ConfidenceDashboard;