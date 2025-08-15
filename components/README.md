# Components Documentation

This directory contains React components for the Budget Brain application's pipeline visualization system.

## Components

- [PipelineFlowVisualizer](#pipelineflowvisualizer-component) - Pipeline stage visualization
- [ConfidenceDashboard](#confidencedashboard-component) - Confidence metrics and algorithm performance
- [DataQualityPanel](#dataqualitypanel-component) - Data quality indicators and citation validation
- [ExportSystem](#exportsystem-component) - Export functionality for pipeline visualization and metrics

---

# PipelineFlowVisualizer Component

A React component for visualizing optimization pipeline stages with real-time progress tracking and interactive features.

## Features

- **Interactive Flow Diagram**: Horizontal pipeline visualization with clickable stages
- **Real-time Progress**: Animated progress indicators and status updates
- **Responsive Design**: Mobile and tablet optimized layouts
- **Accessibility**: Full keyboard navigation and screen reader support
- **TypeScript**: Complete type safety with pipeline interfaces
- **Customizable**: Flexible styling and configuration options

## Installation

The component is part of the Budget Brain application and uses the following dependencies:

```json
{
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "@types/react": "^18.0.0"
}
```

## Usage

### Basic Usage

```tsx
import PipelineFlowVisualizer from '@/components/PipelineFlowVisualizer';
import { OptimizationPipeline } from '@/types/pipeline';

function MyComponent() {
  const [pipeline, setPipeline] = useState<OptimizationPipeline>(/* ... */);
  
  return (
    <PipelineFlowVisualizer
      pipeline={pipeline}
      onStageClick={(stageId) => console.log('Clicked:', stageId)}
    />
  );
}
```

### With Custom Stages

```tsx
import { PipelineStage, PipelineStageStatus } from '@/types/pipeline';

const customStages: PipelineStage[] = [
  {
    id: 'stage1',
    name: 'Data Processing',
    status: PipelineStageStatus.COMPLETED,
    progress: 100,
    duration: 2000
  },
  {
    id: 'stage2',
    name: 'Analysis',
    status: PipelineStageStatus.RUNNING,
    progress: 65,
    details: 'Processing data...'
  }
];

<PipelineFlowVisualizer
  stages={customStages}
  currentStage="stage2"
  onStageClick={handleStageClick}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pipeline` | `OptimizationPipeline` | `undefined` | Complete pipeline object with all stages |
| `stages` | `PipelineStage[]` | `undefined` | Array of individual stages (alternative to pipeline) |
| `currentStage` | `string` | `undefined` | ID of the currently active stage |
| `onStageClick` | `(stageId: string) => void` | `undefined` | Callback when a stage is clicked |
| `className` | `string` | `''` | Additional CSS classes |

## Stage Status Types

```typescript
enum PipelineStageStatus {
  PENDING = 'pending',    // Stage not yet started
  RUNNING = 'running',    // Stage currently executing
  COMPLETED = 'completed', // Stage finished successfully
  ERROR = 'error'         // Stage failed with error
}
```

## Pipeline Interface

```typescript
interface OptimizationPipeline {
  id: string;
  status: PipelineStatus;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  estimatedTotalDuration: number;
  stages: {
    dataFetch: PipelineStage;
    validation: PipelineStage;
    ensembleOptimization: PipelineStage;
    bayesianOptimization: PipelineStage;
    gradientOptimization: PipelineStage;
    confidenceScoring: PipelineStage;
    benchmarkValidation: PipelineStage;
    llmValidation: PipelineStage;
    finalSelection: PipelineStage;
  };
  currentStage?: string;
  completedStages: string[];
  failedStages: string[];
}
```

## Styling

The component uses Tailwind CSS classes and supports:

- **Dark Mode**: Automatic dark mode support
- **Custom Colors**: Override status colors via CSS variables
- **Responsive**: Mobile-first responsive design
- **Animations**: Smooth transitions and progress animations

### CSS Variables

```css
:root {
  --pipeline-pending-color: #e5e7eb;
  --pipeline-running-color: #dbeafe;
  --pipeline-completed-color: #dcfce7;
  --pipeline-error-color: #fee2e2;
}
```

## Accessibility

- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**: Full keyboard support with focus management
- **Screen Readers**: Semantic HTML and proper role attributes
- **High Contrast**: Supports high contrast mode
- **Reduced Motion**: Respects `prefers-reduced-motion` setting

## Examples

### Real-time Updates

```tsx
function OptimizationView() {
  const [pipeline, setPipeline] = useState<OptimizationPipeline>(initialPipeline);
  
  useEffect(() => {
    const eventSource = new EventSource('/api/pipeline-updates');
    
    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setPipeline(prev => updatePipelineStage(prev, update));
    };
    
    return () => eventSource.close();
  }, []);
  
  return (
    <PipelineFlowVisualizer
      pipeline={pipeline}
      currentStage={pipeline.currentStage}
      onStageClick={(stageId) => {
        // Show detailed stage information
        setSelectedStage(stageId);
      }}
    />
  );
}
```

### Error Handling

```tsx
function PipelineWithErrorHandling() {
  const handleStageClick = (stageId: string) => {
    const stage = pipeline.stages[stageId];
    
    if (stage.status === PipelineStageStatus.ERROR) {
      // Show error details modal
      showErrorModal(stage.error);
    } else {
      // Show stage details
      showStageDetails(stage);
    }
  };
  
  return (
    <PipelineFlowVisualizer
      pipeline={pipeline}
      onStageClick={handleStageClick}
    />
  );
}
```

## Testing

The component includes comprehensive tests covering:

- Component rendering and interaction
- Stage status visualization
- Progress tracking
- Error handling
- Accessibility features
- Responsive behavior

Run tests with:

```bash
npm test -- pipelineFlowVisualizer.test.ts
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style and TypeScript patterns
2. Add tests for new features
3. Ensure accessibility compliance
4. Test on mobile devices
5. Update documentation

## License

Part of the Budget Brain application. See main LICENSE file for details.
---


# ConfidenceDashboard Component

A React component for displaying confidence scores, algorithm performance metrics, and consensus data with interactive visualizations.

## Features

- **Circular Progress Indicators**: Visual confidence scores with color coding
- **Per-Channel Metrics**: Individual channel confidence with expandable details
- **Algorithm Badges**: Interactive algorithm contribution display
- **Consensus Metrics**: Agreement indicators and variance analysis
- **Responsive Design**: Mobile and desktop optimized layouts
- **Accessibility**: Full keyboard navigation and screen reader support
- **TypeScript**: Complete type safety with confidence interfaces

## Usage

### Basic Usage

```tsx
import ConfidenceDashboard from '@/components/ConfidenceDashboard';
import { Channel, AlgorithmResult, ConsensusMetrics } from '@/types/shared';

function MyComponent() {
  const confidenceData = {
    overall: 0.87,
    perChannel: {
      google: 0.92,
      meta: 0.85,
      tiktok: 0.78,
      linkedin: 0.81
    } as Record<Channel, number>,
    stability: 0.89,
    algorithms: [
      {
        name: 'ensemble',
        allocation: { google: 0.35, meta: 0.28, tiktok: 0.22, linkedin: 0.15 },
        confidence: 0.91,
        performance: 0.88
      }
    ] as AlgorithmResult[],
    consensus: {
      agreement: 0.84,
      variance: { google: 0.02, meta: 0.03, tiktok: 0.04, linkedin: 0.02 },
      outlierCount: 1
    } as ConsensusMetrics
  };
  
  return (
    <ConfidenceDashboard
      confidence={confidenceData}
      showDetails={true}
    />
  );
}
```

### With Custom Styling

```tsx
<ConfidenceDashboard
  confidence={confidenceData}
  showDetails={false}
  className="bg-white rounded-lg shadow-lg p-6"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `confidence` | `ConfidenceMetrics` | **required** | Complete confidence data object |
| `showDetails` | `boolean` | `false` | Whether to show detailed metrics by default |
| `className` | `string` | `''` | Additional CSS classes |

## Data Interfaces

### ConfidenceMetrics

```typescript
interface ConfidenceMetrics {
  overall: number;                           // Overall confidence (0-1)
  perChannel: Record<Channel, number>;       // Per-channel confidence scores
  stability: number;                         // Result stability score (0-1)
  algorithms: AlgorithmResult[];             // Algorithm contributions
  consensus: ConsensusMetrics;               // Algorithm consensus data
}
```

### AlgorithmResult

```typescript
interface AlgorithmResult {
  name: string;                              // Algorithm name
  allocation: Record<Channel, number>;       // Channel allocation
  confidence: number;                        // Algorithm confidence (0-1)
  performance: number;                       // Performance score (0-1)
}
```

### ConsensusMetrics

```typescript
interface ConsensusMetrics {
  agreement: number;                         // Algorithm agreement level (0-1)
  variance: Record<Channel, number>;         // Channel allocation variance
  outlierCount: number;                      // Number of outlier algorithms
}
```

## Color Coding

The component uses automatic color coding based on confidence levels:

- **Green (≥80%)**: High confidence, reliable results
- **Yellow (60-79%)**: Medium confidence, acceptable results
- **Red (40-59%)**: Low confidence, review recommended
- **Gray (<40%)**: Very low confidence, caution advised

## Interactive Features

### Algorithm Badges
- Click to view detailed algorithm metrics
- Shows allocation breakdown and performance data
- Color-coded by algorithm type

### Channel Cards
- Expandable sections for detailed channel metrics
- Individual confidence indicators
- Channel-specific risk assessment

### Consensus Indicators
- Visual agreement level display
- Variance metrics for each channel
- Outlier detection and highlighting

## Accessibility Features

- **ARIA Labels**: Descriptive labels for all interactive elements
- **Keyboard Navigation**: Full keyboard support with proper focus management
- **Screen Readers**: Semantic HTML structure with role attributes
- **High Contrast**: Support for high contrast display modes
- **Reduced Motion**: Respects user motion preferences

## Styling

The component uses Tailwind CSS with custom CSS modules for enhanced styling:

### CSS Classes

```css
/* Confidence level indicators */
.confidenceHigh { color: #10B981; }      /* Green for high confidence */
.confidenceMedium { color: #F59E0B; }    /* Yellow for medium confidence */
.confidenceLow { color: #EF4444; }       /* Red for low confidence */
.confidenceVeryLow { color: #6B7280; }   /* Gray for very low confidence */

/* Algorithm-specific colors */
.algorithmEnsemble { /* Blue theme */ }
.algorithmBayesian { /* Purple theme */ }
.algorithmGradient { /* Green theme */ }
.algorithmLlm { /* Orange theme */ }
```

### Dark Mode Support

The component automatically adapts to dark mode with appropriate color adjustments:

```css
@media (prefers-color-scheme: dark) {
  .confidenceCard {
    background-color: rgba(31, 41, 55, 1);
    border-color: rgba(75, 85, 99, 0.3);
  }
}
```

## Examples

### High Confidence Scenario

```tsx
const highConfidenceData = {
  overall: 0.91,
  perChannel: { google: 0.95, meta: 0.89, tiktok: 0.87, linkedin: 0.92 },
  stability: 0.93,
  algorithms: [
    { name: 'ensemble', confidence: 0.94, performance: 0.91, /* ... */ },
    { name: 'bayesian', confidence: 0.89, performance: 0.87, /* ... */ }
  ],
  consensus: { agreement: 0.92, variance: { /* low variance */ }, outlierCount: 0 }
};

<ConfidenceDashboard confidence={highConfidenceData} showDetails={true} />
```

### Low Confidence Scenario

```tsx
const lowConfidenceData = {
  overall: 0.45,
  perChannel: { google: 0.52, meta: 0.41, tiktok: 0.38, linkedin: 0.49 },
  stability: 0.42,
  algorithms: [
    { name: 'ensemble', confidence: 0.48, performance: 0.44, /* ... */ }
  ],
  consensus: { agreement: 0.35, variance: { /* high variance */ }, outlierCount: 3 }
};

<ConfidenceDashboard confidence={lowConfidenceData} showDetails={true} />
```

## Testing

The component includes comprehensive tests covering:

- Confidence score display and color coding
- Algorithm badge interactions
- Channel expansion functionality
- Consensus metrics visualization
- Accessibility compliance
- Responsive behavior

Run tests with:

```bash
npm test -- confidenceDashboard.test.ts
```

## Demo

View the interactive demo at `/confidence-dashboard-demo` to see all features in action with sample data scenarios.

## Performance Considerations

- **Lazy Loading**: Detailed metrics load only when panels are expanded
- **Memoization**: Expensive calculations are memoized to prevent re-computation
- **Virtual Scrolling**: Large algorithm lists use virtual scrolling for performance

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow existing TypeScript patterns and interfaces
2. Maintain accessibility standards (WCAG 2.1 AA)
3. Add comprehensive tests for new features
4. Ensure responsive design works on all screen sizes
5. Update documentation for any API changes

---

# DataQualityPanel Component

A React component for displaying data quality indicators, citation validation status, benchmark deviation warnings, and data source reliability scoring with expandable sections for detailed quality metrics.

## Features

- **Citation Quality Indicators**: URL validation status with detailed metrics
- **Benchmark Deviation Warnings**: Severity-based warning system with visual indicators
- **Data Source Reliability**: Scoring and visualization of data source health
- **Expandable Sections**: Detailed quality metrics with interactive expansion
- **Severity Indicators**: Color-coded severity levels (high, medium, low)
- **Responsive Design**: Mobile and desktop optimized layouts
- **Accessibility**: Full keyboard navigation and screen reader support
- **TypeScript**: Complete type safety with data quality interfaces

## Usage

### Basic Usage

```tsx
import DataQualityPanel from '@/components/DataQualityPanel';
import { ValidationWarning, BenchmarkAnalysis } from '@/types/shared';

function MyComponent() {
  const dataQualityInfo = {
    citations: [
      {
        title: "Google Ads Benchmark Report 2024",
        url: "https://ads.google.com/benchmark-report-2024",
        validationStatus: 'valid' as const,
        lastChecked: "2024-01-15T10:30:00Z",
        responseTime: 245,
        contentQuality: 0.95
      }
    ],
    benchmarkAnalysis: {
      deviationScore: 0.65,
      channelDeviations: {
        google: 0.45,
        meta: 0.72,
        tiktok: 0.88,
        linkedin: 0.55
      },
      warnings: [
        {
          type: "high_deviation",
          message: "TikTok allocation significantly deviates from benchmarks",
          severity: "high" as const,
          channel: "tiktok"
        }
      ]
    },
    warnings: [
      {
        type: "data_freshness",
        message: "Some benchmark data is older than 30 days",
        severity: "medium" as const
      }
    ],
    sourceQuality: {
      "Google Ads API": {
        source: "Google Ads API",
        reliability: 0.95,
        lastUpdated: "2024-01-15T10:30:00Z",
        validationStatus: 'valid' as const
      }
    },
    overallScore: 0.75,
    lastValidated: "2024-01-16T14:30:00Z"
  };
  
  return (
    <DataQualityPanel
      dataQuality={dataQualityInfo}
      expandable={true}
    />
  );
}
```

### With Custom Styling

```tsx
<DataQualityPanel
  dataQuality={dataQualityInfo}
  expandable={false}
  className="bg-white rounded-lg shadow-lg p-6"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dataQuality` | `DataQualityInfo` | **required** | Complete data quality information object |
| `expandable` | `boolean` | `true` | Whether the main panel can be collapsed/expanded |
| `className` | `string` | `''` | Additional CSS classes |

## Data Interfaces

### DataQualityInfo

```typescript
interface DataQualityInfo {
  citations: CitationQuality[];              // Citation validation results
  benchmarkAnalysis: BenchmarkAnalysis;      // Benchmark deviation analysis
  warnings: ValidationWarning[];             // Data quality warnings
  sourceQuality: Record<string, DataSourceQuality>; // Source reliability data
  overallScore: number;                       // Overall quality score (0-1)
  lastValidated: string;                      // Last validation timestamp
}
```

### CitationQuality

```typescript
interface CitationQuality extends Citation {
  validationStatus: 'valid' | 'invalid' | 'pending' | 'warning';
  lastChecked?: string;                       // Last validation timestamp
  responseTime?: number;                      // Response time in milliseconds
  contentQuality?: number;                    // Content quality score (0-1)
  issues?: string[];                          // List of validation issues
}
```

### DataSourceQuality

```typescript
interface DataSourceQuality {
  source: string;                             // Source name
  reliability: number;                        // Reliability score (0-1)
  lastUpdated?: string;                       // Last update timestamp
  validationStatus: 'valid' | 'warning' | 'error';
  issues?: string[];                          // List of source issues
}
```

### ValidationWarning

```typescript
interface ValidationWarning {
  type: string;                               // Warning type identifier
  message: string;                            // Human-readable warning message
  severity: 'low' | 'medium' | 'high';      // Warning severity level
  channel?: Channel;                          // Associated channel (optional)
}
```

## Color Coding and Severity Levels

The component uses automatic color coding based on validation status and severity:

### Citation Status
- **Green (Valid)**: Citation is accessible and content is verified
- **Red (Invalid)**: Citation is inaccessible or content is problematic
- **Yellow (Warning)**: Citation has issues but is still usable
- **Gray (Pending)**: Citation validation is in progress

### Severity Levels
- **High (Red)**: Critical issues requiring immediate attention
- **Medium (Yellow)**: Important issues that should be addressed
- **Low (Blue)**: Minor issues for informational purposes

### Overall Quality Score
- **Green (≥80%)**: High quality, reliable data sources
- **Yellow (60-79%)**: Acceptable quality with some concerns
- **Orange (40-59%)**: Poor quality, review recommended
- **Red (<40%)**: Very poor quality, caution advised

## Interactive Features

### Citation Cards
- Click to expand and view detailed validation information
- Shows response times, content quality scores, and specific issues
- Color-coded borders based on validation status

### Benchmark Deviation Analysis
- Visual progress bars showing deviation levels
- Per-channel deviation breakdown
- Severity indicators for deviation warnings

### Data Source Reliability
- Expandable section showing all data sources
- Individual reliability scores and status indicators
- Issue tracking for problematic sources

### Validation Warnings
- Collapsible list with severity-based filtering
- Channel-specific warnings when applicable
- Show all/show less functionality for long warning lists

## Accessibility Features

- **ARIA Labels**: Descriptive labels for all interactive elements
- **Keyboard Navigation**: Full keyboard support with proper focus management
- **Screen Readers**: Semantic HTML structure with role attributes
- **High Contrast**: Support for high contrast display modes
- **Reduced Motion**: Respects user motion preferences

## Styling

The component uses Tailwind CSS with custom CSS modules for enhanced styling:

### CSS Classes

```css
/* Validation status indicators */
.citationCard.valid { border-left: 4px solid #10B981; }
.citationCard.invalid { border-left: 4px solid #EF4444; }
.citationCard.warning { border-left: 4px solid #F59E0B; }
.citationCard.pending { border-left: 4px solid #6B7280; }

/* Severity indicators */
.severityHigh { background-color: rgba(239, 68, 68, 0.1); color: #DC2626; }
.severityMedium { background-color: rgba(245, 158, 11, 0.1); color: #D97706; }
.severityLow { background-color: rgba(59, 130, 246, 0.1); color: #2563EB; }

/* Progress bars */
.progressBarHigh { background-color: #EF4444; }
.progressBarMedium { background-color: #F59E0B; }
.progressBarLow { background-color: #10B981; }
```

### Dark Mode Support

The component automatically adapts to dark mode:

```css
@media (prefers-color-scheme: dark) {
  .qualityCard {
    background-color: rgba(31, 41, 55, 1);
    border-color: rgba(75, 85, 99, 0.3);
  }
  
  .citationCard.valid {
    background-color: rgba(16, 185, 129, 0.05);
  }
}
```

## Examples

### High Quality Data

```tsx
const highQualityData = {
  overallScore: 0.92,
  citations: [
    {
      title: "Official API Documentation",
      url: "https://api.example.com/docs",
      validationStatus: 'valid' as const,
      contentQuality: 0.95,
      responseTime: 150
    }
  ],
  warnings: [], // No warnings
  benchmarkAnalysis: {
    deviationScore: 0.25, // Low deviation
    channelDeviations: { /* low values */ },
    warnings: []
  },
  sourceQuality: {
    "Primary API": {
      source: "Primary API",
      reliability: 0.98,
      validationStatus: 'valid' as const
    }
  },
  lastValidated: "2024-01-16T14:30:00Z"
};

<DataQualityPanel dataQuality={highQualityData} />
```

### Poor Quality Data

```tsx
const poorQualityData = {
  overallScore: 0.35,
  citations: [
    {
      title: "Broken Link",
      url: "https://broken.example.com",
      validationStatus: 'invalid' as const,
      contentQuality: 0.2,
      responseTime: 5000,
      issues: ["URL returns 404", "Content quality below threshold"]
    }
  ],
  warnings: [
    {
      type: "critical_failure",
      message: "Multiple data sources are failing validation",
      severity: "high" as const
    }
  ],
  benchmarkAnalysis: {
    deviationScore: 0.95, // High deviation
    channelDeviations: { /* high values */ },
    warnings: [
      {
        type: "extreme_deviation",
        message: "All channels show extreme deviation",
        severity: "high" as const
      }
    ]
  },
  sourceQuality: {
    "Unreliable Source": {
      source: "Unreliable Source",
      reliability: 0.25,
      validationStatus: 'error' as const,
      issues: ["API unavailable", "Data corruption detected"]
    }
  },
  lastValidated: "2024-01-16T14:30:00Z"
};

<DataQualityPanel dataQuality={poorQualityData} />
```

## Testing

The component includes comprehensive tests covering:

- Citation validation display and interaction
- Benchmark deviation analysis
- Data source reliability indicators
- Warning severity handling
- Expandable section functionality
- Accessibility compliance
- Responsive behavior

Run tests with:

```bash
npm test -- DataQualityPanel.test.ts
```

## Demo

View the interactive demo at `/data-quality-demo` to see all features in action with various data quality scenarios including high quality, poor quality, and mixed scenarios.

## Performance Considerations

- **Lazy Loading**: Detailed metrics load only when sections are expanded
- **Virtualization**: Large citation lists use virtual scrolling
- **Memoization**: Expensive calculations are memoized
- **Progressive Enhancement**: Core functionality works without JavaScript

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow existing TypeScript patterns and data quality interfaces
2. Maintain accessibility standards (WCAG 2.1 AA)
3. Add comprehensive tests for new validation features
4. Ensure responsive design works on all screen sizes
5. Update documentation for any API changes
6. Test with various data quality scenarios
-
--

# ExportSystem Component

A React component for exporting pipeline visualization and metrics data in multiple formats including PDF, PNG, JSON, and CSV with customizable export options.

## Features

- **Multiple Export Formats**: PDF reports, PNG images, JSON data, and CSV files
- **Customizable Options**: Select what data to include in exports
- **Interactive Modal**: User-friendly export configuration interface
- **Format-Specific Options**: Different options available based on selected format
- **Built-in Export Logic**: Handles file generation and download automatically
- **Progress Indicators**: Shows export progress with loading states
- **TypeScript**: Complete type safety with export interfaces
- **Accessibility**: Full keyboard navigation and screen reader support

## Usage

### Basic Usage

```tsx
import ExportSystem from '@/components/ExportSystem';
import { EnhancedModelResult, OptimizationPipeline } from '@/types/shared';

function MyComponent() {
  const optimizationData: EnhancedModelResult = {
    allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
    confidence: { overall: 0.85, perChannel: { /* ... */ }, stability: 0.88 },
    validation: { /* ... */ },
    alternatives: { /* ... */ },
    // ... other result data
  };

  const pipelineData: OptimizationPipeline = {
    id: "pipeline-001",
    status: "completed",
    stages: { /* ... */ },
    // ... other pipeline data
  };

  const handleExport = (options: ExportOptions) => {
    console.log('Export requested:', options);
    // Optional: Add custom export logic or analytics
  };

  return (
    <ExportSystem
      data={optimizationData}
      pipeline={pipelineData}
      onExport={handleExport}
    />
  );
}
```

### Minimal Usage (Data Only)

```tsx
<ExportSystem
  data={optimizationData}
  // Pipeline and onExport are optional
/>
```

### With Custom Styling

```tsx
<ExportSystem
  data={optimizationData}
  pipeline={pipelineData}
  className="my-custom-export-button"
  onExport={handleExport}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `EnhancedModelResult` | **required** | Optimization results and metrics data |
| `pipeline` | `OptimizationPipeline` | `undefined` | Pipeline execution data (optional) |
| `pipelineStages` | `PipelineStage[]` | `[]` | Alternative to pipeline for individual stages |
| `className` | `string` | `''` | Additional CSS classes for the export button |
| `onExport` | `(options: ExportOptions) => void` | `undefined` | Callback when export is initiated |

## Export Options Interface

```typescript
interface ExportOptions {
  format: 'pdf' | 'png' | 'json' | 'csv';
  includeMetrics: boolean;          // Performance metrics and confidence scores
  includeVisualization: boolean;    // Charts and visual diagrams
  includeMethodology: boolean;      // Algorithm details and methodology
  includePipelineData: boolean;     // Pipeline execution data and timing
}
```

## Export Formats

### PDF Report
- **Description**: Complete report with visualizations and metrics
- **Supported Options**: All options (metrics, visualization, methodology, pipeline data)
- **Output**: Text-based report file (currently saves as .txt due to library limitations)
- **Use Case**: Comprehensive documentation and stakeholder reports

### PNG Image
- **Description**: Visual charts and flow diagrams
- **Supported Options**: Visualization only
- **Output**: Canvas-generated image file
- **Use Case**: Presentations and visual documentation

### JSON Data
- **Description**: Raw data and metrics in JSON format
- **Supported Options**: Metrics and pipeline data
- **Output**: Structured JSON file with complete data
- **Use Case**: Data analysis and programmatic processing

### CSV Data
- **Description**: Tabular data for spreadsheet analysis
- **Supported Options**: Metrics and pipeline data
- **Output**: Comma-separated values file
- **Use Case**: Spreadsheet analysis and data import

## Export Modal Interface

The component displays an interactive modal with:

1. **Format Selection**: Grid of format options with icons and descriptions
2. **Export Options**: Checkboxes for data inclusion based on selected format
3. **Action Buttons**: Cancel and Export buttons with loading states
4. **Progress Indication**: Loading spinner during export process

### Format Selection Grid

Each format option displays:
- **Icon**: Visual representation of the format
- **Label**: Format name (e.g., "PDF Report")
- **Description**: Brief explanation of the format's purpose
- **Selection State**: Visual indication when selected

### Dynamic Options

Export options change based on the selected format:

- **PDF**: All options available
- **PNG**: Only visualization option
- **JSON**: Metrics and pipeline data options
- **CSV**: Metrics and pipeline data options

## File Naming Convention

Generated files follow this naming pattern:
```
budget-optimization-{objective}-{timestamp}.{extension}
```

Examples:
- `budget-optimization-revenue-2024-01-16T14-30-00.pdf`
- `budget-optimization-demos-2024-01-16T14-30-00.json`
- `budget-optimization-cac-2024-01-16T14-30-00.csv`

## Export Data Structure

### JSON Export Structure

```json
{
  "results": {
    "allocation": { "google": 0.4, "meta": 0.3, "tiktok": 0.2, "linkedin": 0.1 },
    "confidence": { "overall": 0.85, "perChannel": { /* ... */ } },
    "validation": { /* ... */ },
    "alternatives": { /* ... */ }
  },
  "pipeline": {
    "id": "pipeline-001",
    "status": "completed",
    "totalDuration": 15000,
    "stages": [
      {
        "id": "dataFetch",
        "name": "Data Fetching",
        "status": "completed",
        "duration": 2000,
        "progress": 100
      }
    ]
  },
  "exportMetadata": {
    "exportedAt": "2024-01-16T14:30:00.000Z",
    "format": "json",
    "options": { /* export options used */ }
  }
}
```

### CSV Export Structure

```csv
Channel Allocation
Channel,Allocation,Confidence
google,40.00%,92.00%
meta,30.00%,85.00%
tiktok,20.00%,78.00%
linkedin,10.00%,81.00%

Performance Metrics
Metric,Value
Overall Confidence,85.00%
Stability Score,88.00%
Deterministic Outcome,1250.75
Monte Carlo P10,980.25
Monte Carlo P50,1250.75
Monte Carlo P90,1520.30

Pipeline Stages
Stage,Status,Duration (ms),Progress
Data Fetching,completed,2000,100%
Data Validation,completed,1000,100%
```

## Accessibility Features

- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**: Full keyboard support with proper focus management
- **Screen Readers**: Semantic HTML structure with role attributes
- **Focus Management**: Proper focus trapping within the modal
- **High Contrast**: Support for high contrast display modes

## Error Handling

The component includes robust error handling for:

- **Export Failures**: Graceful handling of export errors with user feedback
- **Missing Data**: Handles cases where optional data is not provided
- **Browser Compatibility**: Fallbacks for unsupported browser features
- **File System Errors**: Proper error messages for download failures

## Browser Support

- **Chrome 90+**: Full support for all export formats
- **Firefox 88+**: Full support with minor PNG limitations
- **Safari 14+**: Full support with canvas export considerations
- **Edge 90+**: Full support for all features

## Examples

### Complete Export Setup

```tsx
function OptimizationResults() {
  const [results, setResults] = useState<EnhancedModelResult | null>(null);
  const [pipeline, setPipeline] = useState<OptimizationPipeline | null>(null);

  const handleExport = (options: ExportOptions) => {
    // Track export analytics
    analytics.track('export_results', {
      format: options.format,
      includeMetrics: options.includeMetrics,
      includePipeline: options.includePipelineData
    });

    // Optional: Custom export processing
    if (options.format === 'json') {
      // Add custom metadata
      console.log('JSON export with custom processing');
    }
  };

  if (!results) {
    return <div>Loading...</div>;
  }

  return (
    <div className="results-container">
      <h2>Optimization Results</h2>
      
      {/* Display results */}
      <ResultsDisplay data={results} />
      
      {/* Export functionality */}
      <div className="export-section">
        <ExportSystem
          data={results}
          pipeline={pipeline}
          onExport={handleExport}
          className="mt-4"
        />
      </div>
    </div>
  );
}
```

### Export with Custom Processing

```tsx
function CustomExportHandler() {
  const handleExport = async (options: ExportOptions) => {
    // Pre-export processing
    if (options.format === 'pdf') {
      // Generate additional visualizations
      await generateCustomCharts();
    }

    // Post-export analytics
    await logExportEvent(options);
  };

  return (
    <ExportSystem
      data={optimizationData}
      pipeline={pipelineData}
      onExport={handleExport}
    />
  );
}
```

## Testing

The component includes comprehensive tests covering:

- Export button rendering and interaction
- Modal opening and closing
- Format selection functionality
- Export option toggling
- Export execution for all formats
- Error handling scenarios
- Accessibility compliance
- Loading states and progress indication

Run tests with:

```bash
npm test -- ExportSystem.test.tsx
```

## Demo

View the interactive demo at `/export-demo` to test all export formats and options with sample optimization data.

## Performance Considerations

- **Lazy Loading**: Export functionality loads only when needed
- **Memory Management**: Large exports are processed in chunks
- **Browser Limits**: Respects browser file size limitations
- **Progress Feedback**: Shows progress for long-running exports

## Future Enhancements

Planned improvements include:

1. **Enhanced PDF Generation**: Integration with jsPDF for rich PDF reports
2. **Advanced PNG Export**: Integration with html2canvas for complex visualizations
3. **Excel Export**: Native Excel file generation with formatting
4. **Email Integration**: Direct email sharing of exported reports
5. **Cloud Storage**: Integration with cloud storage providers
6. **Batch Export**: Export multiple optimization results simultaneously

## Contributing

1. Follow existing TypeScript patterns and export interfaces
2. Maintain accessibility standards (WCAG 2.1 AA)
3. Add comprehensive tests for new export formats
4. Ensure cross-browser compatibility
5. Update documentation for any API changes
6. Test with various data sizes and complexity levels

## Dependencies

The component currently uses only built-in browser APIs:

- **Blob API**: For file generation
- **URL API**: For download links
- **Canvas API**: For PNG export (basic implementation)

For enhanced functionality, consider adding:

```json
{
  "jspdf": "^2.5.1",           // Enhanced PDF generation
  "html2canvas": "^1.4.1",     // Advanced PNG export
  "xlsx": "^0.18.5"            // Excel export support
}
```

## License

Part of the Budget Brain application. See main LICENSE file for details.