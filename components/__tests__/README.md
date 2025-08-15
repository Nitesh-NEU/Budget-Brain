# Visualization Components Test Suite

This directory contains comprehensive tests for all visualization components in the pipeline visualization UI system.

## Test Coverage

### Component Tests

#### 1. PipelineFlowVisualizer (`PipelineFlowVisualizer.test.tsx`)
- **Rendering**: Basic component rendering, empty states, error handling
- **Stage Interactions**: Stage selection, details display, progress indicators
- **Real-time Updates**: Pipeline status changes, progress updates
- **Responsive Design**: Mobile adaptation, touch interactions
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

#### 2. ConfidenceDashboard (`ConfidenceDashboard.test.tsx`)
- **Confidence Metrics**: Overall confidence, per-channel scores, stability indicators
- **Algorithm Details**: Algorithm contributions, performance metrics, convergence data
- **Consensus Metrics**: Agreement levels, variance indicators, outlier detection
- **Interactive Features**: Expandable sections, algorithm selection
- **Data Validation**: Edge cases, missing data handling

#### 3. DataQualityPanel (`DataQualityPanel.test.ts`)
- **Citation Quality**: URL validation, content quality scores, response times
- **Benchmark Analysis**: Deviation scores, channel-specific warnings
- **Source Reliability**: Data source validation, reliability scoring
- **Warning System**: Severity levels, issue categorization
- **Expandable UI**: Collapsible sections, detailed views

#### 4. AlternativeOptionsExplorer (`AlternativeOptionsExplorer.test.tsx`)
- **Options Display**: Alternative allocations, confidence scores, risk levels
- **Sorting & Filtering**: Multiple sort criteria, performance-based ordering
- **Selection Interface**: Option selection, detailed views, comparison features
- **Summary Statistics**: Aggregate metrics, performance summaries
- **Modal Interactions**: Details modal, focus management

#### 5. RealTimePipelineStatus (`RealTimePipelineStatus.test.tsx`)
- **Connection Management**: WebSocket connections, SSE fallback, polling
- **Real-time Updates**: Pipeline progress, stage transitions, error handling
- **Event Processing**: Pipeline events, status announcements
- **Reconnection Logic**: Automatic reconnection, connection failure recovery
- **Performance**: Efficient update handling, memory management

#### 6. ExportSystem (`ExportSystem.test.tsx`)
- **Export Formats**: PDF, PNG, JSON, CSV export functionality
- **Export Options**: Configurable export settings, content selection
- **File Generation**: Blob creation, download triggers
- **Error Handling**: Invalid formats, export failures

### Responsive Design Tests (`ResponsiveDesign.test.tsx`, `ResponsiveFunctionality.test.tsx`)
- **Viewport Detection**: Mobile, tablet, desktop breakpoints
- **Layout Adaptation**: Collapsible panels, touch-friendly controls
- **Swipe Navigation**: Touch gestures, alternative navigation methods
- **Performance**: Efficient resize handling, debounced updates

### Accessibility Tests (`accessibility.test.tsx`)
- **ARIA Compliance**: Proper roles, labels, and attributes
- **Keyboard Navigation**: Tab order, focus management, keyboard shortcuts
- **Screen Reader Support**: Live regions, status announcements
- **Color Accessibility**: Text alternatives, high contrast support
- **Touch Accessibility**: Minimum touch target sizes, gesture alternatives

### Integration Tests

#### 1. API Integration (`api-integration.test.ts`)
- **Optimize API**: Request/response handling, enhanced pipeline data
- **Pipeline Status API**: Status polling, update processing
- **Real-time Events**: WebSocket message handling, event processing
- **Export API**: Export request handling, file generation
- **Error Handling**: Network failures, malformed responses, timeout handling

#### 2. Visualization Integration (`visualization-integration.test.tsx`)
- **Complete Dashboard**: Full component integration, state consistency
- **Cross-component Interactions**: State sharing, event propagation
- **Real-time Updates**: Live data flow, concurrent updates
- **User Workflows**: Complete exploration flows, export workflows
- **Performance**: Large dataset handling, rapid updates, memory efficiency

### Library Tests

#### 1. Visualization Context (`visualizationContext.test.tsx`)
- **State Management**: Pipeline state, visualization preferences
- **Context Providers**: State initialization, action dispatching
- **Hook Integration**: useVisualization, usePipeline, useVisualizationState

#### 2. Pipeline Updates (`usePipelineUpdates.test.tsx`)
- **WebSocket Integration**: Connection management, message processing
- **SSE Fallback**: Server-sent events, connection fallback
- **Polling Mechanism**: Status polling, error recovery
- **Configuration**: Update intervals, reconnection settings

#### 3. Visualization Panels (`useVisualizationPanels.test.tsx`)
- **Panel Management**: Expand/collapse functionality, panel configuration
- **Stage Selection**: Pipeline stage navigation, selection state
- **Algorithm Selection**: Algorithm filtering, selection management

## Test Data and Mocks

### Mock Data Structure
- **Pipeline Data**: Complete pipeline with all stages, realistic timing
- **Confidence Metrics**: Multi-algorithm confidence scores, consensus data
- **Data Quality**: Citation validation, benchmark analysis, warnings
- **Alternative Options**: Multiple allocation strategies with performance data

### Mock Services
- **WebSocket**: Simulated real-time connections, message handling
- **Fetch API**: HTTP request/response mocking, error simulation
- **File APIs**: Blob creation, URL generation for exports

## Test Utilities

### Custom Matchers
- Accessibility compliance checks
- Performance threshold validation
- Real-time update verification

### Test Helpers
- Component rendering with context providers
- User interaction simulation
- Async operation handling

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites
```bash
# Component tests only
npm test components/__tests__

# Integration tests only
npm test lib/__tests__/api-integration.test.ts
npm test lib/__tests__/visualization-integration.test.tsx

# Accessibility tests only
npm test components/__tests__/accessibility.test.tsx
```

### Coverage Reports
```bash
npm test -- --coverage
```

## Test Quality Metrics

### Coverage Targets
- **Line Coverage**: >90%
- **Branch Coverage**: >85%
- **Function Coverage**: >95%
- **Statement Coverage**: >90%

### Test Categories
- **Unit Tests**: Individual component functionality
- **Integration Tests**: Component interactions, API integration
- **Accessibility Tests**: WCAG compliance, screen reader support
- **Performance Tests**: Load handling, memory usage
- **Error Handling**: Failure scenarios, recovery mechanisms

## Continuous Integration

### Test Automation
- Pre-commit hooks for test validation
- CI/CD pipeline integration
- Automated accessibility testing
- Performance regression detection

### Quality Gates
- All tests must pass before merge
- Coverage thresholds must be met
- Accessibility standards must be maintained
- Performance benchmarks must be satisfied

## Maintenance

### Test Updates
- Update tests when component APIs change
- Add tests for new features and edge cases
- Maintain mock data consistency with real API responses
- Regular accessibility audit updates

### Performance Monitoring
- Monitor test execution times
- Optimize slow-running tests
- Maintain efficient mock implementations
- Regular cleanup of obsolete tests

This comprehensive test suite ensures the reliability, accessibility, and performance of the visualization components while providing confidence in the system's behavior across various scenarios and user interactions.