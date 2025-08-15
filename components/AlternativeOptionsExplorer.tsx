/**
 * AlternativeOptionsExplorer Component
 * 
 * Creates an interactive comparison table for alternative allocations with
 * confidence scores, reasoning explanations, and selection mechanisms.
 */

"use client";
import React, { useState, useEffect } from 'react';
import { 
  Channel, 
  Allocation, 
  AlgorithmResult 
} from '@/types/shared';

// Alternative option interface based on design document
interface AlternativeOption {
  id: string;
  allocation: Allocation;
  confidence: number;
  performance: number;
  reasoning: string;
  algorithmSource: string;
  expectedOutcome?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

interface AlternativeOptionsExplorerProps {
  alternatives: AlternativeOption[];
  currentAllocation: Allocation;
  onSelectAlternative?: (option: AlternativeOption) => void;
  className?: string;
  maxDisplayed?: number;
}

// Allocation visualization component
const AllocationVisualization: React.FC<{ 
  allocation: Allocation; 
  confidence: number;
  isSelected?: boolean;
  size?: 'small' | 'medium' | 'large';
}> = ({ allocation, confidence, isSelected = false, size = 'medium' }) => {
  const channels = Object.keys(allocation) as Channel[];
  const total = Object.values(allocation).reduce((sum, val) => sum + val, 0);
  
  const getChannelColor = (channel: Channel): string => {
    const colors: Record<Channel, string> = {
      google: '#4285F4',
      meta: '#1877F2', 
      tiktok: '#FF0050',
      linkedin: '#0A66C2'
    };
    return colors[channel] || '#6B7280';
  };
  
  const getChannelIcon = (channel: Channel): React.ReactNode => {
    const iconSize = size === 'small' ? 'w-3 h-3' : size === 'medium' ? 'w-4 h-4' : 'w-5 h-5';
    
    switch (channel) {
      case 'google':
        return (
          <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'meta':
        return (
          <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'tiktok':
        return (
          <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
        );
      case 'linkedin':
        return (
          <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        );
      default:
        return <div className={`${iconSize} bg-gray-300 rounded`} />;
    }
  };
  
  const barHeight = size === 'small' ? 'h-2' : size === 'medium' ? 'h-3' : 'h-4';
  const containerClass = size === 'small' ? 'space-y-1' : size === 'medium' ? 'space-y-2' : 'space-y-3';
  
  return (
    <div className={`${containerClass} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 rounded-lg p-2' : ''}`}>
      {/* Confidence indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium text-gray-600 dark:text-gray-400`}>
          Confidence: {Math.round(confidence * 100)}%
        </span>
        <div className={`w-12 ${barHeight} bg-gray-200 rounded-full overflow-hidden`}>
          <div 
            className={`${barHeight} transition-all duration-300 ${
              confidence >= 0.8 ? 'bg-green-500' :
              confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>
      
      {/* Channel allocations */}
      <div className={containerClass}>
        {channels.map((channel) => {
          const percentage = total > 0 ? (allocation[channel] / total) * 100 : 0;
          return (
            <div key={channel} className="flex items-center space-x-2">
              <div 
                className="flex items-center justify-center rounded"
                style={{ color: getChannelColor(channel) }}
              >
                {getChannelIcon(channel)}
              </div>
              <div className="flex-1 flex items-center space-x-2">
                <span className={`capitalize font-medium text-gray-900 dark:text-gray-100 ${
                  size === 'small' ? 'text-xs' : 'text-sm'
                }`}>
                  {channel}
                </span>
                <div className={`flex-1 ${barHeight} bg-gray-200 rounded-full overflow-hidden`}>
                  <div 
                    className={`${barHeight} transition-all duration-500`}
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: getChannelColor(channel)
                    }}
                  />
                </div>
                <span className={`font-mono text-gray-600 dark:text-gray-400 ${
                  size === 'small' ? 'text-xs' : 'text-sm'
                }`}>
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Risk level indicator component
const RiskLevelIndicator: React.FC<{ level: AlternativeOption['riskLevel'] }> = ({ level }) => {
  if (!level) return null;
  
  const getRiskConfig = (risk: NonNullable<AlternativeOption['riskLevel']>) => {
    switch (risk) {
      case 'low':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '🟢',
          label: 'Low Risk'
        };
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '🟡',
          label: 'Medium Risk'
        };
      case 'high':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '🔴',
          label: 'High Risk'
        };
    }
  };
  
  const config = getRiskConfig(level);
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

// Algorithm source badge component
const AlgorithmSourceBadge: React.FC<{ source: string }> = ({ source }) => {
  const getSourceColor = (src: string): string => {
    const colors: Record<string, string> = {
      'ensemble': 'bg-blue-100 text-blue-800 border-blue-200',
      'bayesian': 'bg-purple-100 text-purple-800 border-purple-200',
      'gradient': 'bg-green-100 text-green-800 border-green-200',
      'llm': 'bg-orange-100 text-orange-800 border-orange-200',
      'benchmark': 'bg-gray-100 text-gray-800 border-gray-200',
      'hybrid': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    
    const key = src.toLowerCase();
    return colors[key] || 'bg-gray-100 text-gray-800 border-gray-200';
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSourceColor(source)}`}>
      {source}
    </span>
  );
};

// Alternative option card component
const AlternativeOptionCard: React.FC<{
  option: AlternativeOption;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
  rank: number;
}> = ({ option, isSelected, isCurrent, onSelect, onViewDetails, rank }) => {
  return (
    <div className={`
      border rounded-lg p-4 transition-all duration-200 cursor-pointer
      ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}
      ${isCurrent ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}
      hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
            ${rank === 1 ? 'bg-yellow-100 text-yellow-800' : 
              rank === 2 ? 'bg-gray-100 text-gray-800' :
              rank === 3 ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}
          `}>
            #{rank}
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <AlgorithmSourceBadge source={option.algorithmSource} />
              <RiskLevelIndicator level={option.riskLevel} />
              {isCurrent && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  Current
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Performance: {Math.round(option.performance * 100)}%</span>
              {option.expectedOutcome && (
                <span>Expected: {option.expectedOutcome.toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onViewDetails}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
          >
            Details
          </button>
          {!isCurrent && (
            <button
              onClick={onSelect}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              Select
            </button>
          )}
        </div>
      </div>
      
      {/* Allocation visualization */}
      <AllocationVisualization
        allocation={option.allocation}
        confidence={option.confidence}
        isSelected={isSelected}
        size="medium"
      />
      
      {/* Reasoning preview */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {option.reasoning}
        </p>
      </div>
    </div>
  );
};

// Detailed reasoning modal component
const ReasoningModal: React.FC<{
  option: AlternativeOption | null;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}> = ({ option, isOpen, onClose, isMobile }) => {
  if (!isOpen || !option) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white dark:bg-gray-800 rounded-lg w-full overflow-y-auto ${
        isMobile 
          ? 'fixed bottom-0 left-0 right-0 rounded-t-2xl rounded-b-none max-h-[90vh] p-0' 
          : 'max-w-2xl max-h-[80vh]'
      }`}>
        <div className={isMobile ? 'p-4' : 'p-6'}>
          {isMobile && (
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          )}
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Alternative Option Details
            </h3>
            <button
              onClick={onClose}
              className={`text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 rounded ${
                isMobile ? 'p-2 hover:bg-gray-100 dark:hover:bg-gray-700' : ''
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Option metadata */}
            <div className="flex items-center space-x-4">
              <AlgorithmSourceBadge source={option.algorithmSource} />
              <RiskLevelIndicator level={option.riskLevel} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Confidence: {Math.round(option.confidence * 100)}%
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Performance: {Math.round(option.performance * 100)}%
              </span>
            </div>
            
            {/* Allocation visualization */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Allocation Breakdown
              </h4>
              <AllocationVisualization
                allocation={option.allocation}
                confidence={option.confidence}
                size="large"
              />
            </div>
            
            {/* Detailed reasoning */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Reasoning & Methodology
              </h4>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {option.reasoning}
                </p>
              </div>
            </div>
            
            {/* Additional metadata */}
            {option.metadata && Object.keys(option.metadata).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Additional Information
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(option.metadata).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="ml-2 text-gray-900 dark:text-gray-100">
                          {typeof value === 'number' ? value.toLocaleString() : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className={`mt-6 flex justify-end space-x-3 ${isMobile ? 'pb-4' : ''}`}>
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 ${
                isMobile ? 'w-full min-h-[44px]' : ''
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Swipe navigation hook
const useSwipeNavigation = (itemCount: number, isMobile: boolean) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentIndex < itemCount - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const goToSlide = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, itemCount - 1)));
  };
  
  const goNext = () => {
    if (currentIndex < itemCount - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  return {
    currentIndex,
    onTouchStart: isMobile ? onTouchStart : undefined,
    onTouchMove: isMobile ? onTouchMove : undefined,
    onTouchEnd: isMobile ? onTouchEnd : undefined,
    goToSlide,
    goNext,
    goPrev,
    canGoNext: currentIndex < itemCount - 1,
    canGoPrev: currentIndex > 0
  };
};

// Main AlternativeOptionsExplorer component
const AlternativeOptionsExplorer: React.FC<AlternativeOptionsExplorerProps> = ({
  alternatives,
  currentAllocation,
  onSelectAlternative,
  className = '',
  maxDisplayed = 5
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [detailsModalOption, setDetailsModalOption] = useState<AlternativeOption | null>(null);
  const [sortBy, setSortBy] = useState<'confidence' | 'performance' | 'risk'>('confidence');
  const [showAll, setShowAll] = useState(false);
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
  
  // Sort alternatives based on selected criteria
  const sortedAlternatives = [...alternatives].sort((a, b) => {
    switch (sortBy) {
      case 'confidence':
        return b.confidence - a.confidence;
      case 'performance':
        return b.performance - a.performance;
      case 'risk':
        const riskOrder = { low: 0, medium: 1, high: 2 };
        const aRisk = a.riskLevel ? riskOrder[a.riskLevel] : 1;
        const bRisk = b.riskLevel ? riskOrder[b.riskLevel] : 1;
        return aRisk - bRisk;
      default:
        return 0;
    }
  });
  
  // Determine which alternatives to display
  const displayedAlternatives = showAll ? sortedAlternatives : sortedAlternatives.slice(0, maxDisplayed);
  
  // Swipe navigation for mobile
  const swipeNavigation = useSwipeNavigation(displayedAlternatives.length, isMobile);
  
  // Check if an allocation matches the current allocation
  const isCurrentAllocation = (allocation: Allocation): boolean => {
    const channels = Object.keys(allocation) as Channel[];
    return channels.every(channel => 
      Math.abs(allocation[channel] - currentAllocation[channel]) < 0.001
    );
  };
  
  const handleSelectOption = (option: AlternativeOption) => {
    if (onSelectAlternative) {
      onSelectAlternative(option);
    }
    setSelectedOption(option.id);
  };
  
  const handleViewDetails = (option: AlternativeOption) => {
    setDetailsModalOption(option);
  };
  
  if (alternatives.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border p-6 text-center ${className}`}>
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Alternative Options Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Alternative allocation options will appear here when available from the optimization algorithms.
        </p>
      </div>
    );
  }
  
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
              Alternative Options Explorer
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
            Compare {alternatives.length} alternative allocation strategies
          </p>
        </div>
        
        <div className={`flex items-center space-x-3 ${isMobile ? 'w-full flex-col space-y-2 space-x-0' : ''}`}>
          {/* Sort controls */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className={`px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-h-[44px] ${isMobile ? 'w-full' : ''}`}
          >
            <option value="confidence">Sort by Confidence</option>
            <option value="performance">Sort by Performance</option>
            <option value="risk">Sort by Risk Level</option>
          </select>
          
          {/* Show all toggle */}
          {alternatives.length > maxDisplayed && (
            <button
              onClick={() => setShowAll(!showAll)}
              className={`px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-h-[44px] ${isMobile ? 'w-full' : ''}`}
            >
              {showAll ? `Show Top ${maxDisplayed}` : `Show All ${alternatives.length}`}
            </button>
          )}
        </div>
      </div>
      
      {/* Collapsible content */}
      {(!isMobile || !isCollapsed) && (
        <>
          {/* Alternative options - Mobile swipe or Desktop grid */}
          {isMobile ? (
            <div className="relative">
              <div 
                className="overflow-hidden"
                {...swipeNavigation}
              >
                <div 
                  className="flex transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(-${swipeNavigation.currentIndex * 100}%)` }}
                >
                  {displayedAlternatives.map((option, index) => (
                    <div key={option.id} className="w-full flex-shrink-0 px-2">
                      <AlternativeOptionCard
                        option={option}
                        isSelected={selectedOption === option.id}
                        isCurrent={isCurrentAllocation(option.allocation)}
                        onSelect={() => handleSelectOption(option)}
                        onViewDetails={() => handleViewDetails(option)}
                        rank={index + 1}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Navigation buttons for desktop */}
              {!isMobile && displayedAlternatives.length > 1 && (
                <>
                  <button
                    onClick={swipeNavigation.goPrev}
                    disabled={!swipeNavigation.canGoPrev}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={swipeNavigation.goNext}
                    disabled={!swipeNavigation.canGoNext}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              
              {/* Swipe indicators */}
              {displayedAlternatives.length > 1 && (
                <div className="flex justify-center space-x-2 mt-4">
                  {displayedAlternatives.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => swipeNavigation.goToSlide(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === swipeNavigation.currentIndex 
                          ? 'bg-blue-500' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      aria-label={`Go to option ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {displayedAlternatives.map((option, index) => (
                <AlternativeOptionCard
                  key={option.id}
                  option={option}
                  isSelected={selectedOption === option.id}
                  isCurrent={isCurrentAllocation(option.allocation)}
                  onSelect={() => handleSelectOption(option)}
                  onViewDetails={() => handleViewDetails(option)}
                  rank={index + 1}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Summary statistics */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
          Options Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Avg Confidence:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
              {Math.round((alternatives.reduce((sum, opt) => sum + opt.confidence, 0) / alternatives.length) * 100)}%
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Avg Performance:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
              {Math.round((alternatives.reduce((sum, opt) => sum + opt.performance, 0) / alternatives.length) * 100)}%
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">High Confidence:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
              {alternatives.filter(opt => opt.confidence >= 0.8).length}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Low Risk:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
              {alternatives.filter(opt => opt.riskLevel === 'low').length}
            </span>
          </div>
        </div>
      </div>
      
      {/* Details modal */}
      <ReasoningModal
        option={detailsModalOption}
        isOpen={detailsModalOption !== null}
        onClose={() => setDetailsModalOption(null)}
        isMobile={isMobile}
      />
    </div>
  );
};

export { AlternativeOptionsExplorer };
export default AlternativeOptionsExplorer;