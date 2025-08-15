'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { OptimizationPipeline, PipelineStage, PipelineStageStatus, PipelineUpdate } from '../types/pipeline';

// Visualization state interface
export interface VisualizationState {
  selectedStage?: string;
  expandedPanels: Set<string>;
  selectedAlgorithm?: string;
  comparisonMode: boolean;
  showDetails: boolean;
  exportOptions: ExportOptions;
  userPreferences: UserPreferences;
}

// Export options interface
export interface ExportOptions {
  format: 'pdf' | 'png' | 'json' | 'csv';
  includeMetrics: boolean;
  includeVisualization: boolean;
  includeMethodology: boolean;
}

// User preferences interface
export interface UserPreferences {
  autoExpandPanels: boolean;
  defaultView: 'pipeline' | 'confidence' | 'quality';
  animationsEnabled: boolean;
  compactMode: boolean;
  theme: 'light' | 'dark' | 'auto';
}

// Combined context state
export interface VisualizationContextState {
  pipeline?: OptimizationPipeline;
  visualizationState: VisualizationState;
  isLoading: boolean;
  error?: string;
}

// Action types
export enum VisualizationActionType {
  SET_PIPELINE = 'SET_PIPELINE',
  UPDATE_STAGE = 'UPDATE_STAGE',
  SET_SELECTED_STAGE = 'SET_SELECTED_STAGE',
  TOGGLE_PANEL = 'TOGGLE_PANEL',
  SET_EXPANDED_PANELS = 'SET_EXPANDED_PANELS',
  SET_SELECTED_ALGORITHM = 'SET_SELECTED_ALGORITHM',
  SET_COMPARISON_MODE = 'SET_COMPARISON_MODE',
  SET_SHOW_DETAILS = 'SET_SHOW_DETAILS',
  SET_EXPORT_OPTIONS = 'SET_EXPORT_OPTIONS',
  SET_USER_PREFERENCES = 'SET_USER_PREFERENCES',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  RESET_STATE = 'RESET_STATE'
}

// Action interfaces
export interface VisualizationAction {
  type: VisualizationActionType;
  payload?: any;
}

// Default states
const defaultExportOptions: ExportOptions = {
  format: 'pdf',
  includeMetrics: true,
  includeVisualization: true,
  includeMethodology: true
};

const defaultUserPreferences: UserPreferences = {
  autoExpandPanels: false,
  defaultView: 'pipeline',
  animationsEnabled: true,
  compactMode: false,
  theme: 'auto'
};

const defaultVisualizationState: VisualizationState = {
  expandedPanels: new Set(),
  comparisonMode: false,
  showDetails: false,
  exportOptions: defaultExportOptions,
  userPreferences: defaultUserPreferences
};

const defaultContextState: VisualizationContextState = {
  visualizationState: defaultVisualizationState,
  isLoading: false
};

// Context interfaces
export interface VisualizationContextValue {
  state: VisualizationContextState;
  actions: {
    setPipeline: (pipeline: OptimizationPipeline) => void;
    updateStage: (stageId: string, update: Partial<PipelineStage>) => void;
    setSelectedStage: (stageId?: string) => void;
    togglePanel: (panelId: string) => void;
    setExpandedPanels: (panelIds: string[]) => void;
    setSelectedAlgorithm: (algorithmId?: string) => void;
    setComparisonMode: (enabled: boolean) => void;
    setShowDetails: (show: boolean) => void;
    setExportOptions: (options: Partial<ExportOptions>) => void;
    setUserPreferences: (preferences: Partial<UserPreferences>) => void;
    setLoading: (loading: boolean) => void;
    setError: (error?: string) => void;
    resetState: () => void;
    processPipelineUpdate: (update: PipelineUpdate) => void;
  };
}

// Create contexts
const VisualizationContext = createContext<VisualizationContextValue | undefined>(undefined);

// Reducer function
function visualizationReducer(
  state: VisualizationContextState,
  action: VisualizationAction
): VisualizationContextState {
  switch (action.type) {
    case VisualizationActionType.SET_PIPELINE:
      return {
        ...state,
        pipeline: action.payload,
        isLoading: false,
        error: undefined
      };

    case VisualizationActionType.UPDATE_STAGE:
      if (!state.pipeline) return state;
      
      const { stageId, update } = action.payload;
      const updatedPipeline = {
        ...state.pipeline,
        stages: {
          ...state.pipeline.stages,
          [stageId]: {
            ...state.pipeline.stages[stageId as keyof typeof state.pipeline.stages],
            ...update
          }
        }
      };

      return {
        ...state,
        pipeline: updatedPipeline
      };

    case VisualizationActionType.SET_SELECTED_STAGE:
      return {
        ...state,
        visualizationState: {
          ...state.visualizationState,
          selectedStage: action.payload
        }
      };

    case VisualizationActionType.TOGGLE_PANEL:
      const newExpandedPanels = new Set(state.visualizationState.expandedPanels);
      if (newExpandedPanels.has(action.payload)) {
        newExpandedPanels.delete(action.payload);
      } else {
        newExpandedPanels.add(action.payload);
      }
      
      return {
        ...state,
        visualizationState: {
          ...state.visualizationState,
          expandedPanels: newExpandedPanels
        }
      };

    case VisualizationActionType.SET_EXPANDED_PANELS:
      return {
        ...state,
        visualizationState: {
          ...state.visualizationState,
          expandedPanels: new Set(action.payload)
        }
      };

    case VisualizationActionType.SET_SELECTED_ALGORITHM:
      return {
        ...state,
        visualizationState: {
          ...state.visualizationState,
          selectedAlgorithm: action.payload
        }
      };

    case VisualizationActionType.SET_COMPARISON_MODE:
      return {
        ...state,
        visualizationState: {
          ...state.visualizationState,
          comparisonMode: action.payload
        }
      };

    case VisualizationActionType.SET_SHOW_DETAILS:
      return {
        ...state,
        visualizationState: {
          ...state.visualizationState,
          showDetails: action.payload
        }
      };

    case VisualizationActionType.SET_EXPORT_OPTIONS:
      return {
        ...state,
        visualizationState: {
          ...state.visualizationState,
          exportOptions: {
            ...state.visualizationState.exportOptions,
            ...action.payload
          }
        }
      };

    case VisualizationActionType.SET_USER_PREFERENCES:
      return {
        ...state,
        visualizationState: {
          ...state.visualizationState,
          userPreferences: {
            ...state.visualizationState.userPreferences,
            ...action.payload
          }
        }
      };

    case VisualizationActionType.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case VisualizationActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case VisualizationActionType.RESET_STATE:
      return defaultContextState;

    default:
      return state;
  }
}

// Local storage keys
const STORAGE_KEYS = {
  USER_PREFERENCES: 'kiro-visualization-preferences',
  EXPANDED_PANELS: 'kiro-expanded-panels',
  EXPORT_OPTIONS: 'kiro-export-options'
} as const;

// Persistence utilities
const loadFromStorage = function<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = function<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail if storage is not available
  }
};

// Provider component
export interface VisualizationProviderProps {
  children: React.ReactNode;
  initialPipeline?: OptimizationPipeline;
}

export function VisualizationProvider({ 
  children, 
  initialPipeline 
}: VisualizationProviderProps) {
  // Load persisted state
  const loadPersistedState = useCallback((): VisualizationContextState => {
    const userPreferences = loadFromStorage(STORAGE_KEYS.USER_PREFERENCES, defaultUserPreferences);
    const expandedPanels = loadFromStorage(STORAGE_KEYS.EXPANDED_PANELS, []);
    const exportOptions = loadFromStorage(STORAGE_KEYS.EXPORT_OPTIONS, defaultExportOptions);

    return {
      pipeline: initialPipeline,
      visualizationState: {
        ...defaultVisualizationState,
        userPreferences,
        expandedPanels: new Set(expandedPanels),
        exportOptions
      },
      isLoading: false
    };
  }, [initialPipeline]);

  const [state, dispatch] = useReducer(visualizationReducer, null, loadPersistedState);

  // Persist state changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.USER_PREFERENCES, state.visualizationState.userPreferences);
  }, [state.visualizationState.userPreferences]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.EXPANDED_PANELS, Array.from(state.visualizationState.expandedPanels));
  }, [state.visualizationState.expandedPanels]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.EXPORT_OPTIONS, state.visualizationState.exportOptions);
  }, [state.visualizationState.exportOptions]);

  // Action creators
  const actions = {
    setPipeline: useCallback((pipeline: OptimizationPipeline) => {
      dispatch({ type: VisualizationActionType.SET_PIPELINE, payload: pipeline });
    }, []),

    updateStage: useCallback((stageId: string, update: Partial<PipelineStage>) => {
      dispatch({ 
        type: VisualizationActionType.UPDATE_STAGE, 
        payload: { stageId, update } 
      });
    }, []),

    setSelectedStage: useCallback((stageId?: string) => {
      dispatch({ type: VisualizationActionType.SET_SELECTED_STAGE, payload: stageId });
    }, []),

    togglePanel: useCallback((panelId: string) => {
      dispatch({ type: VisualizationActionType.TOGGLE_PANEL, payload: panelId });
    }, []),

    setExpandedPanels: useCallback((panelIds: string[]) => {
      dispatch({ type: VisualizationActionType.SET_EXPANDED_PANELS, payload: panelIds });
    }, []),

    setSelectedAlgorithm: useCallback((algorithmId?: string) => {
      dispatch({ type: VisualizationActionType.SET_SELECTED_ALGORITHM, payload: algorithmId });
    }, []),

    setComparisonMode: useCallback((enabled: boolean) => {
      dispatch({ type: VisualizationActionType.SET_COMPARISON_MODE, payload: enabled });
    }, []),

    setShowDetails: useCallback((show: boolean) => {
      dispatch({ type: VisualizationActionType.SET_SHOW_DETAILS, payload: show });
    }, []),

    setExportOptions: useCallback((options: Partial<ExportOptions>) => {
      dispatch({ type: VisualizationActionType.SET_EXPORT_OPTIONS, payload: options });
    }, []),

    setUserPreferences: useCallback((preferences: Partial<UserPreferences>) => {
      dispatch({ type: VisualizationActionType.SET_USER_PREFERENCES, payload: preferences });
    }, []),

    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: VisualizationActionType.SET_LOADING, payload: loading });
    }, []),

    setError: useCallback((error?: string) => {
      dispatch({ type: VisualizationActionType.SET_ERROR, payload: error });
    }, []),

    resetState: useCallback(() => {
      dispatch({ type: VisualizationActionType.RESET_STATE });
    }, []),

    processPipelineUpdate: useCallback((update: PipelineUpdate) => {
      dispatch({
        type: VisualizationActionType.UPDATE_STAGE,
        payload: {
          stageId: update.stageId,
          update: {
            status: update.status,
            progress: update.progress,
            details: update.details,
            error: update.error,
            metadata: update.metadata
          }
        }
      });
    }, [])
  };

  const contextValue: VisualizationContextValue = {
    state,
    actions
  };

  return (
    <VisualizationContext.Provider value={contextValue}>
      {children}
    </VisualizationContext.Provider>
  );
}

// Custom hook to use the visualization context
export function useVisualization(): VisualizationContextValue {
  const context = useContext(VisualizationContext);
  if (!context) {
    throw new Error('useVisualization must be used within a VisualizationProvider');
  }
  return context;
}

// Specialized hooks for common use cases
export function usePipeline() {
  const { state, actions } = useVisualization();
  return {
    pipeline: state.pipeline,
    isLoading: state.isLoading,
    error: state.error,
    setPipeline: actions.setPipeline,
    updateStage: actions.updateStage,
    processPipelineUpdate: actions.processPipelineUpdate,
    setLoading: actions.setLoading,
    setError: actions.setError
  };
}

export function useVisualizationState() {
  const { state, actions } = useVisualization();
  return {
    ...state.visualizationState,
    setSelectedStage: actions.setSelectedStage,
    togglePanel: actions.togglePanel,
    setExpandedPanels: actions.setExpandedPanels,
    setSelectedAlgorithm: actions.setSelectedAlgorithm,
    setComparisonMode: actions.setComparisonMode,
    setShowDetails: actions.setShowDetails
  };
}

export function useExportOptions() {
  const { state, actions } = useVisualization();
  return {
    exportOptions: state.visualizationState.exportOptions,
    setExportOptions: actions.setExportOptions
  };
}

export function useUserPreferences() {
  const { state, actions } = useVisualization();
  return {
    userPreferences: state.visualizationState.userPreferences,
    setUserPreferences: actions.setUserPreferences
  };
}