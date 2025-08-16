# Code Quality Analyzer Hook

## Hook Configuration

**Trigger:** File change detection in source code files
**Target Files:** `**/*.{ts,tsx,js,jsx,css,scss}`
**Execution:** On save, commit, or manual trigger

## Hook Description

Listen to source code files in the repository. When changes are detected, analyze the modified code for potential improvements, including code smells, design patterns, and best practices. Generate suggestions for improving code quality while maintaining the existing functionality. Focus on readability, maintainability, and performance optimizations.

## Analysis Criteria

### 1. Code Smells Detection
- **Long Functions**: Functions exceeding 50 lines
- **Large Classes**: Classes with too many responsibilities
- **Duplicate Code**: Repeated logic that could be extracted
- **Complex Conditionals**: Nested if statements and complex boolean logic
- **Magic Numbers**: Hard-coded values without named constants
- **Dead Code**: Unused imports, variables, or functions

### 2. Design Patterns & Architecture
- **Single Responsibility Principle**: Each function/class should have one responsibility
- **DRY (Don't Repeat Yourself)**: Identify opportunities for code reuse
- **Composition over Inheritance**: Favor composition patterns in React components
- **Interface Segregation**: TypeScript interfaces should be focused and minimal
- **Dependency Injection**: Services should use dependency injection patterns

### 3. React/TypeScript Best Practices
- **Component Composition**: Prefer composition over complex prop drilling
- **Hook Dependencies**: Ensure proper dependency arrays in useEffect, useMemo, useCallback
- **Type Safety**: Avoid `any` types, prefer strict TypeScript typing
- **Error Boundaries**: Implement proper error handling in React components
- **Memoization**: Use React.memo, useMemo, useCallback appropriately

### 4. Performance Optimizations
- **Bundle Size**: Identify large imports that could be code-split
- **Re-renders**: Detect unnecessary component re-renders
- **Memory Leaks**: Check for proper cleanup in useEffect hooks
- **Async Operations**: Optimize API calls and async operations
- **Caching Strategies**: Identify opportunities for intelligent caching

### 5. Maintainability Improvements
- **Naming Conventions**: Clear, descriptive variable and function names
- **Code Documentation**: JSDoc comments for complex functions
- **File Organization**: Proper file structure and import organization
- **Error Handling**: Comprehensive error handling and user feedback
- **Testing Coverage**: Identify code that needs test coverage

## Analysis Workflow

### Stage 1: File Change Detection
```yaml
triggers:
  - file_modified: "**/*.{ts,tsx,js,jsx}"
  - file_created: "**/*.{ts,tsx,js,jsx}"
  - git_commit: "pre-commit"
  - manual_trigger: true
```

### Stage 2: Static Code Analysis
```yaml
analyzers:
  - eslint: "Check for linting violations"
  - typescript: "Type checking and inference analysis"
  - complexity: "Cyclomatic complexity measurement"
  - dependencies: "Dependency analysis and optimization"
```

### Stage 3: Pattern Recognition
```yaml
patterns:
  - anti_patterns: "Detect common anti-patterns"
  - design_patterns: "Suggest applicable design patterns"
  - react_patterns: "React-specific pattern analysis"
  - performance_patterns: "Performance optimization opportunities"
```

### Stage 4: Suggestion Generation
```yaml
suggestions:
  - refactoring: "Safe refactoring opportunities"
  - optimization: "Performance improvement suggestions"
  - best_practices: "Industry best practice recommendations"
  - accessibility: "WCAG compliance improvements"
```

## Output Format

### Code Quality Report
```typescript
interface CodeQualityReport {
  file: string;
  timestamp: string;
  score: number; // 0-100 quality score
  issues: QualityIssue[];
  suggestions: Suggestion[];
  metrics: CodeMetrics;
}

interface QualityIssue {
  type: 'code_smell' | 'performance' | 'maintainability' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  line: number;
  column: number;
  message: string;
  suggestion: string;
  examples?: CodeExample[];
}

interface Suggestion {
  category: string;
  description: string;
  impact: 'readability' | 'performance' | 'maintainability' | 'security';
  effort: 'low' | 'medium' | 'high';
  beforeCode?: string;
  afterCode?: string;
}

interface CodeMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
  testCoverage: number;
  bundleImpact: number;
}
```

## Specific Checks for Budget Brain

### TypeScript Optimization
- **Interface Optimization**: Ensure optimal TypeScript interface design
- **Type Guards**: Add proper type guards for runtime safety
- **Generic Constraints**: Use appropriate generic constraints
- **Utility Types**: Leverage TypeScript utility types effectively

### React Performance
- **Component Memoization**: Identify components that benefit from React.memo
- **Hook Optimization**: Optimize custom hooks like `usePipelineUpdates`
- **Context Performance**: Analyze React Context usage for performance
- **Virtual DOM Optimization**: Minimize unnecessary re-renders

### Next.js Specific
- **API Route Optimization**: Optimize API endpoint performance
- **Bundle Analysis**: Identify opportunities for code splitting
- **SSR/SSG Optimization**: Optimize static generation and server-side rendering
- **Image Optimization**: Ensure proper Next.js image optimization

### Business Logic
- **Algorithm Efficiency**: Analyze Monte Carlo and optimization algorithms
- **Cache Strategy**: Optimize caching in AccuracyEnhancementService
- **Error Handling**: Improve error handling in pipeline stages
- **Memory Management**: Optimize memory usage in large calculations

## Integration Points

### Development Workflow
- **Pre-commit Hooks**: Run analysis before commits
- **CI/CD Integration**: Include in continuous integration pipeline
- **IDE Integration**: Real-time feedback in VS Code
- **Pull Request Comments**: Automated code review comments

### Reporting Dashboard
- **Quality Trends**: Track code quality over time
- **Technical Debt**: Identify and prioritize technical debt
- **Team Metrics**: Team-wide code quality metrics
- **Improvement Tracking**: Track implementation of suggestions

## Configuration Options

### Sensitivity Levels
```yaml
analysis_levels:
  strict:
    complexity_threshold: 5
    function_length_limit: 30
    enable_all_checks: true
  
  standard:
    complexity_threshold: 10
    function_length_limit: 50
    enable_performance_checks: true
  
  lenient:
    complexity_threshold: 15
    function_length_limit: 100
    enable_critical_checks_only: true
```

### Custom Rules
```yaml
custom_rules:
  budget_brain_specific:
    - "Ensure all optimization algorithms include confidence scoring"
    - "Pipeline stages must have proper error handling"
    - "All UI components must include accessibility attributes"
    - "API endpoints must include proper validation schemas"
```

## Example Analysis Output

```markdown
## Code Quality Analysis Report
**File:** `lib/accuracyEnhancementService.ts`
**Quality Score:** 87/100
**Analysis Date:** 2025-08-15 14:30:00

### Issues Found (3)
1. **Medium Severity - Performance**
   - Line 156: Consider memoizing expensive calculation result
   - Suggestion: Add useMemo to cache ensemble calculation results

2. **Low Severity - Maintainability** 
   - Line 89: Function exceeds recommended length (65 lines)
   - Suggestion: Extract validation logic into separate function

3. **High Severity - Type Safety**
   - Line 203: Using 'any' type reduces type safety
   - Suggestion: Define proper interface for algorithm result

### Suggestions (5)
1. **Refactoring Opportunity**
   - Extract common validation logic into utility function
   - Impact: Maintainability | Effort: Medium

2. **Performance Optimization**
   - Implement result caching for similar inputs
   - Impact: Performance | Effort: Low

### Metrics
- Lines of Code: 324
- Cyclomatic Complexity: 12
- Maintainability Index: 78
- Test Coverage: 94%
```

This hook provides comprehensive automated code quality analysis that would help maintain the high standards evident in your Budget Brain project while supporting continuous improvement.
