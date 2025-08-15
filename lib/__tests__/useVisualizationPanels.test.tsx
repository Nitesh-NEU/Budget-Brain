import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { 
  useVisualizationPanels, 
  useStageSelection, 
  useAlgorithmSelection,
  PANEL_IDS,
  DEFAULT_PANEL_CONFIGS
} from '../hooks/useVisualizationPanels';
import { VisualizationProvider } from '../visualizationContext';

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <VisualizationProvider>
    {children}
  </VisualizationProvider>
);

describe('useVisualizationPanels', () => {
  it('should provide initial panel state', () => {
    const { result } = renderHook(() => useVisualizationPanels(), {
      wrapper: TestWrapper
    });

    expect(result.current.expandedPanels.size).toBe(0);
    expect(result.current.isExpanded('test-panel')).toBe(false);
  });

  it('should toggle panels', () => {
    const { result } = renderHook(() => useVisualizationPanels(), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.togglePanel('test-panel');
    });

    expect(result.current.isExpanded('test-panel')).toBe(true);

    act(() => {
      result.current.togglePanel('test-panel');
    });

    expect(result.current.isExpanded('test-panel')).toBe(false);
  });

  it('should expand specific panels', () => {
    const { result } = renderHook(() => useVisualizationPanels(), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.expandPanel('test-panel');
    });

    expect(result.current.isExpanded('test-panel')).toBe(true);

    // Should not toggle if already expanded
    act(() => {
      result.current.expandPanel('test-panel');
    });

    expect(result.current.isExpanded('test-panel')).toBe(true);
  });

  it('should collapse specific panels', () => {
    const { result } = renderHook(() => useVisualizationPanels(), {
      wrapper: TestWrapper
    });

    // First expand the panel
    act(() => {
      result.current.expandPanel('test-panel');
    });

    expect(result.current.isExpanded('test-panel')).toBe(true);

    act(() => {
      result.current.collapsePanel('test-panel');
    });

    expect(result.current.isExpanded('test-panel')).toBe(false);

    // Should not toggle if already collapsed
    act(() => {
      result.current.collapsePanel('test-panel');
    });

    expect(result.current.isExpanded('test-panel')).toBe(false);
  });

  it('should expand all collapsible panels', () => {
    const { result } = renderHook(() => useVisualizationPanels(), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.expandAll();
    });

    // Should expand all panels that are collapsible
    const collapsiblePanels = Object.values(PANEL_IDS).filter(panelId => {
      const config = DEFAULT_PANEL_CONFIGS[panelId];
      return config.collapsible !== false;
    });

    collapsiblePanels.forEach(panelId => {
      expect(result.current.isExpanded(panelId)).toBe(true);
    });
  });

  it('should collapse all panels', () => {
    const { result } = renderHook(() => useVisualizationPanels(), {
      wrapper: TestWrapper
    });

    // First expand some panels
    act(() => {
      result.current.expandAll();
    });

    act(() => {
      result.current.collapseAll();
    });

    expect(result.current.expandedPanels.size).toBe(0);
  });

  it('should set expanded panels', () => {
    const { result } = renderHook(() => useVisualizationPanels(), {
      wrapper: TestWrapper
    });

    const panelIds = ['panel1', 'panel2', 'panel3'];

    act(() => {
      result.current.setExpandedPanels(panelIds);
    });

    panelIds.forEach(panelId => {
      expect(result.current.isExpanded(panelId)).toBe(true);
    });

    // Should not have other panels expanded
    expect(result.current.isExpanded('other-panel')).toBe(false);
  });

  it('should toggle multiple panels', () => {
    const { result } = renderHook(() => useVisualizationPanels(), {
      wrapper: TestWrapper
    });

    const panelIds = ['panel1', 'panel2'];

    // Initially expand one panel
    act(() => {
      result.current.expandPanel('panel1');
    });

    act(() => {
      result.current.toggleMultiplePanels(panelIds);
    });

    // panel1 should be collapsed (was expanded)
    expect(result.current.isExpanded('panel1')).toBe(false);
    // panel2 should be expanded (was collapsed)
    expect(result.current.isExpanded('panel2')).toBe(true);
  });

  it('should get panel configuration', () => {
    const { result } = renderHook(() => useVisualizationPanels(), {
      wrapper: TestWrapper
    });

    const config = result.current.getPanelConfig(PANEL_IDS.PIPELINE_FLOW);
    expect(config).toEqual(DEFAULT_PANEL_CONFIGS[PANEL_IDS.PIPELINE_FLOW]);

    const nonExistentConfig = result.current.getPanelConfig('non-existent');
    expect(nonExistentConfig).toBeUndefined();
  });

  it('should get visible panels sorted by priority', () => {
    const { result } = renderHook(() => useVisualizationPanels(), {
      wrapper: TestWrapper
    });

    const visiblePanels = result.current.getVisiblePanels();
    
    expect(visiblePanels).toHaveLength(Object.keys(DEFAULT_PANEL_CONFIGS).length);
    
    // Should be sorted by priority
    for (let i = 1; i < visiblePanels.length; i++) {
      const prevPriority = visiblePanels[i - 1].priority || 999;
      const currentPriority = visiblePanels[i].priority || 999;
      expect(prevPriority).toBeLessThanOrEqual(currentPriority);
    }
  });

  it('should reset to defaults without auto-expand', () => {
    const { result } = renderHook(() => useVisualizationPanels(), {
      wrapper: TestWrapper
    });

    // First expand some panels
    act(() => {
      result.current.expandAll();
    });

    act(() => {
      result.current.resetToDefaults();
    });

    // Should only have default expanded panels
    const defaultExpanded = Object.values(DEFAULT_PANEL_CONFIGS)
      .filter(config => config.defaultExpanded)
      .map(config => config.id);

    defaultExpanded.forEach(panelId => {
      expect(result.current.isExpanded(panelId)).toBe(true);
    });

    // Should not have other panels expanded
    const nonDefaultExpanded = Object.values(DEFAULT_PANEL_CONFIGS)
      .filter(config => !config.defaultExpanded)
      .map(config => config.id);

    nonDefaultExpanded.forEach(panelId => {
      expect(result.current.isExpanded(panelId)).toBe(false);
    });
  });
});

describe('useStageSelection', () => {
  it('should provide initial stage selection state', () => {
    const { result } = renderHook(() => useStageSelection(), {
      wrapper: TestWrapper
    });

    expect(result.current.selectedStage).toBeUndefined();
    expect(result.current.getTotalStages()).toBe(9); // Number of stages in the pipeline
  });

  it('should set selected stage', () => {
    const { result } = renderHook(() => useStageSelection(), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.setSelectedStage('validation');
    });

    expect(result.current.selectedStage).toBe('validation');
  });

  it('should get stage index', () => {
    const { result } = renderHook(() => useStageSelection(), {
      wrapper: TestWrapper
    });

    expect(result.current.getStageIndex('dataFetch')).toBe(0);
    expect(result.current.getStageIndex('validation')).toBe(1);
    expect(result.current.getStageIndex('finalSelection')).toBe(8);
    expect(result.current.getStageIndex('nonexistent')).toBe(-1);
  });

  it('should select next stage', () => {
    const { result } = renderHook(() => useStageSelection(), {
      wrapper: TestWrapper
    });

    // When no stage is selected, should select first stage
    act(() => {
      result.current.selectNextStage();
    });

    expect(result.current.selectedStage).toBe('dataFetch');

    // Should move to next stage
    act(() => {
      result.current.selectNextStage();
    });

    expect(result.current.selectedStage).toBe('validation');

    // Set to last stage
    act(() => {
      result.current.setSelectedStage('finalSelection');
    });

    // Should not move beyond last stage
    act(() => {
      result.current.selectNextStage();
    });

    expect(result.current.selectedStage).toBe('finalSelection');
  });

  it('should select previous stage', () => {
    const { result } = renderHook(() => useStageSelection(), {
      wrapper: TestWrapper
    });

    // When no stage is selected, should select last stage
    act(() => {
      result.current.selectPreviousStage();
    });

    expect(result.current.selectedStage).toBe('finalSelection');

    // Should move to previous stage
    act(() => {
      result.current.selectPreviousStage();
    });

    expect(result.current.selectedStage).toBe('llmValidation');

    // Set to first stage
    act(() => {
      result.current.setSelectedStage('dataFetch');
    });

    // Should not move before first stage
    act(() => {
      result.current.selectPreviousStage();
    });

    expect(result.current.selectedStage).toBe('dataFetch');
  });

  it('should clear selection', () => {
    const { result } = renderHook(() => useStageSelection(), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.setSelectedStage('validation');
    });

    expect(result.current.selectedStage).toBe('validation');

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedStage).toBeUndefined();
  });
});

describe('useAlgorithmSelection', () => {
  it('should provide initial algorithm selection state', () => {
    const { result } = renderHook(() => useAlgorithmSelection(), {
      wrapper: TestWrapper
    });

    expect(result.current.selectedAlgorithm).toBeUndefined();
  });

  it('should set selected algorithm', () => {
    const { result } = renderHook(() => useAlgorithmSelection(), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.setSelectedAlgorithm('bayesian-optimizer');
    });

    expect(result.current.selectedAlgorithm).toBe('bayesian-optimizer');
  });

  it('should clear algorithm selection', () => {
    const { result } = renderHook(() => useAlgorithmSelection(), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.setSelectedAlgorithm('ensemble-method');
    });

    expect(result.current.selectedAlgorithm).toBe('ensemble-method');

    act(() => {
      result.current.clearAlgorithmSelection();
    });

    expect(result.current.selectedAlgorithm).toBeUndefined();
  });
});