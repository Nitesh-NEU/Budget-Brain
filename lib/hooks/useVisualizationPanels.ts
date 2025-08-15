'use client';

import { useCallback, useMemo } from 'react';
import { useVisualizationState, useUserPreferences } from '../visualizationContext';

// Panel configuration
export interface PanelConfig {
  id: string;
  title: string;
  defaultExpanded?: boolean;
  collapsible?: boolean;
  priority?: number;
}

// Available panels
export const PANEL_IDS = {
  PIPELINE_FLOW: 'pipeline-flow',
  CONFIDENCE_DASHBOARD: 'confidence-dashboard',
  DATA_QUALITY: 'data-quality',
  ALTERNATIVE_OPTIONS: 'alternative-options',
  EXPORT_OPTIONS: 'export-options',
  ALGORITHM_DETAILS: 'algorithm-details',
  PERFORMANCE_METRICS: 'performance-metrics',
  VALIDATION_RESULTS: 'validation-results'
} as const;

export type PanelId = typeof PANEL_IDS[keyof typeof PANEL_IDS];

// Default panel configurations
export const DEFAULT_PANEL_CONFIGS: Record<PanelId, PanelConfig> = {
  [PANEL_IDS.PIPELINE_FLOW]: {
    id: PANEL_IDS.PIPELINE_FLOW,
    title: 'Pipeline Flow',
    defaultExpanded: true,
    collapsible: false,
    priority: 1
  },
  [PANEL_IDS.CONFIDENCE_DASHBOARD]: {
    id: PANEL_IDS.CONFIDENCE_DASHBOARD,
    title: 'Confidence Dashboard',
    defaultExpanded: true,
    collapsible: true,
    priority: 2
  },
  [PANEL_IDS.DATA_QUALITY]: {
    id: PANEL_IDS.DATA_QUALITY,
    title: 'Data Quality',
    defaultExpanded: false,
    collapsible: true,
    priority: 3
  },
  [PANEL_IDS.ALTERNATIVE_OPTIONS]: {
    id: PANEL_IDS.ALTERNATIVE_OPTIONS,
    title: 'Alternative Options',
    defaultExpanded: false,
    collapsible: true,
    priority: 4
  },
  [PANEL_IDS.EXPORT_OPTIONS]: {
    id: PANEL_IDS.EXPORT_OPTIONS,
    title: 'Export Options',
    defaultExpanded: false,
    collapsible: true,
    priority: 8
  },
  [PANEL_IDS.ALGORITHM_DETAILS]: {
    id: PANEL_IDS.ALGORITHM_DETAILS,
    title: 'Algorithm Details',
    defaultExpanded: false,
    collapsible: true,
    priority: 5
  },
  [PANEL_IDS.PERFORMANCE_METRICS]: {
    id: PANEL_IDS.PERFORMANCE_METRICS,
    title: 'Performance Metrics',
    defaultExpanded: false,
    collapsible: true,
    priority: 6
  },
  [PANEL_IDS.VALIDATION_RESULTS]: {
    id: PANEL_IDS.VALIDATION_RESULTS,
    title: 'Validation Results',
    defaultExpanded: false,
    collapsible: true,
    priority: 7
  }
};

// Hook return type
export interface UseVisualizationPanelsReturn {
  // Panel state
  expandedPanels: Set<string>;
  isExpanded: (panelId: string) => boolean;
  
  // Panel actions
  togglePanel: (panelId: string) => void;
  expandPanel: (panelId: string) => void;
  collapsePanel: (panelId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  resetToDefaults: () => void;
  
  // Panel configuration
  getPanelConfig: (panelId: string) => PanelConfig | undefined;
  getVisiblePanels: () => PanelConfig[];
  
  // Bulk operations
  setExpandedPanels: (panelIds: string[]) => void;
  toggleMultiplePanels: (panelIds: string[]) => void;
}

/**
 * Custom hook for managing visualization panel state
 */
export function useVisualizationPanels(): UseVisualizationPanelsReturn {
  const {
    expandedPanels,
    togglePanel,
    setExpandedPanels
  } = useVisualizationState();
  
  const { userPreferences } = useUserPreferences();

  // Check if a panel is expanded
  const isExpanded = useCallback((panelId: string): boolean => {
    return expandedPanels.has(panelId);
  }, [expandedPanels]);

  // Expand a specific panel
  const expandPanel = useCallback((panelId: string) => {
    if (!isExpanded(panelId)) {
      togglePanel(panelId);
    }
  }, [isExpanded, togglePanel]);

  // Collapse a specific panel
  const collapsePanel = useCallback((panelId: string) => {
    if (isExpanded(panelId)) {
      togglePanel(panelId);
    }
  }, [isExpanded, togglePanel]);

  // Expand all collapsible panels
  const expandAll = useCallback(() => {
    const allPanelIds = Object.values(PANEL_IDS).filter(panelId => {
      const config = DEFAULT_PANEL_CONFIGS[panelId];
      return config.collapsible !== false;
    });
    setExpandedPanels(allPanelIds);
  }, [setExpandedPanels]);

  // Collapse all panels
  const collapseAll = useCallback(() => {
    setExpandedPanels([]);
  }, [setExpandedPanels]);

  // Reset to default expanded state
  const resetToDefaults = useCallback(() => {
    const defaultExpanded = Object.values(DEFAULT_PANEL_CONFIGS)
      .filter(config => {
        // Consider user preferences for auto-expand
        if (userPreferences.autoExpandPanels) {
          return config.collapsible !== false;
        }
        return config.defaultExpanded;
      })
      .map(config => config.id);
    
    setExpandedPanels(defaultExpanded);
  }, [setExpandedPanels, userPreferences.autoExpandPanels]);

  // Get panel configuration
  const getPanelConfig = useCallback((panelId: string): PanelConfig | undefined => {
    return DEFAULT_PANEL_CONFIGS[panelId as PanelId];
  }, []);

  // Get visible panels sorted by priority
  const getVisiblePanels = useCallback((): PanelConfig[] => {
    return Object.values(DEFAULT_PANEL_CONFIGS)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999));
  }, []);

  // Toggle multiple panels at once
  const toggleMultiplePanels = useCallback((panelIds: string[]) => {
    const currentExpanded = new Set(expandedPanels);
    
    panelIds.forEach(panelId => {
      if (currentExpanded.has(panelId)) {
        currentExpanded.delete(panelId);
      } else {
        currentExpanded.add(panelId);
      }
    });
    
    setExpandedPanels(Array.from(currentExpanded));
  }, [expandedPanels, setExpandedPanels]);

  return {
    // Panel state
    expandedPanels,
    isExpanded,
    
    // Panel actions
    togglePanel,
    expandPanel,
    collapsePanel,
    expandAll,
    collapseAll,
    resetToDefaults,
    
    // Panel configuration
    getPanelConfig,
    getVisiblePanels,
    
    // Bulk operations
    setExpandedPanels,
    toggleMultiplePanels
  };
}

// Specialized hook for stage selection and navigation
export interface UseStageSelectionReturn {
  selectedStage?: string;
  setSelectedStage: (stageId?: string) => void;
  selectNextStage: () => void;
  selectPreviousStage: () => void;
  clearSelection: () => void;
  getStageIndex: (stageId: string) => number;
  getTotalStages: () => number;
}

export function useStageSelection(): UseStageSelectionReturn {
  const { selectedStage, setSelectedStage } = useVisualizationState();

  // Define stage order for navigation
  const stageOrder = useMemo(() => [
    'dataFetch',
    'validation',
    'ensembleOptimization',
    'bayesianOptimization',
    'gradientOptimization',
    'confidenceScoring',
    'benchmarkValidation',
    'llmValidation',
    'finalSelection'
  ], []);

  // Get stage index
  const getStageIndex = useCallback((stageId: string): number => {
    return stageOrder.indexOf(stageId);
  }, [stageOrder]);

  // Get total number of stages
  const getTotalStages = useCallback((): number => {
    return stageOrder.length;
  }, [stageOrder]);

  // Select next stage
  const selectNextStage = useCallback(() => {
    if (!selectedStage) {
      setSelectedStage(stageOrder[0]);
      return;
    }

    const currentIndex = getStageIndex(selectedStage);
    if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
      setSelectedStage(stageOrder[currentIndex + 1]);
    }
  }, [selectedStage, stageOrder, getStageIndex, setSelectedStage]);

  // Select previous stage
  const selectPreviousStage = useCallback(() => {
    if (!selectedStage) {
      setSelectedStage(stageOrder[stageOrder.length - 1]);
      return;
    }

    const currentIndex = getStageIndex(selectedStage);
    if (currentIndex > 0) {
      setSelectedStage(stageOrder[currentIndex - 1]);
    }
  }, [selectedStage, stageOrder, getStageIndex, setSelectedStage]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedStage(undefined);
  }, [setSelectedStage]);

  return {
    selectedStage,
    setSelectedStage,
    selectNextStage,
    selectPreviousStage,
    clearSelection,
    getStageIndex,
    getTotalStages
  };
}

// Hook for managing algorithm selection
export interface UseAlgorithmSelectionReturn {
  selectedAlgorithm?: string;
  setSelectedAlgorithm: (algorithmId?: string) => void;
  clearAlgorithmSelection: () => void;
}

export function useAlgorithmSelection(): UseAlgorithmSelectionReturn {
  const { selectedAlgorithm, setSelectedAlgorithm } = useVisualizationState();

  const clearAlgorithmSelection = useCallback(() => {
    setSelectedAlgorithm(undefined);
  }, [setSelectedAlgorithm]);

  return {
    selectedAlgorithm,
    setSelectedAlgorithm,
    clearAlgorithmSelection
  };
}