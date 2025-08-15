# Budget Brain 🧠💰

**AI-Powered Advertising Budget Optimizer with Monte Carlo Simulation**



## 🎯 What is Budget Brain?

Budget Brain revolutionizes digital advertising budget allocation by combining:
- **Real-time AI data gathering** from web sources
- **Monte Carlo simulation** for uncertainty quantification  
- **Statistical optimization** across Google, Meta, TikTok, and LinkedIn
- **Interactive constraints** and goal-based optimization

### Key Features
- 🤖 **AI-Powered Benchmarks:** Gemini AI fetches real CPM/CTR/CVR data
- 📊 **Monte Carlo Analysis:** 800+ simulations with p10/p50/p90 percentiles
- 🎯 **Multi-Objective Goals:** Optimize for demos, revenue, or CAC
- 🔧 **Flexible Constraints:** Set min/max spend per channel
- 📈 **Visual Analytics:** Interactive charts and uncertainty intervals
- 🎨 **Modern UI:** Animated loading states and responsive design
- 🔄 **Real-Time Pipeline:** Live optimization progress visualization
- 📋 **Simple Recommendations:** Plain-English guidance for non-technical users
- 🧪 **Interactive Testing:** Debug tools for pipeline stage progression
- ♿ **Accessibility First:** WCAG compliant with screen reader support
- 🎯 **Multi-Algorithm Validation:** Ensemble, Bayesian, and Gradient optimization
- 🧠 **AI Result Validation:** LLM-powered reasonableness checking
- 📊 **Confidence Scoring:** Algorithm consensus and stability metrics
- 🏆 **Benchmark Validation:** Industry standard deviation analysis
- ⚡ **Performance Optimization:** Intelligent caching and resource management

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Google AI Studio API key (Gemini)

### Installation

1. **Clone and install:**
```bash
git clone [repository-url]
cd Ad-Spend-Optimizer
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env
# Add your GEMINI_API_KEY
```

3. **Run development server:**
```bash
npm run dev
```

4. **Open in browser:**
```
http://localhost:3000
```

---

## 🏗️ Technical Architecture

### Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, Gemini AI integration
- **Charts:** Recharts for data visualization
- **Validation:** Zod schemas for type safety
- **Testing:** Jest, React Testing Library, 600+ test cases
- **Accessibility:** WCAG 2.1 AA compliant, screen reader support
- **Real-Time:** WebSocket connections, Server-Sent Events fallback

### Core Algorithms
- **Monte Carlo Simulation:** Statistical sampling across parameter ranges
- **Grid Search Optimization:** Systematic evaluation of allocation combinations
- **Uncertainty Quantification:** P10/P50/P90 percentile analysis
- **Real-time Data Integration:** AI-powered benchmark fetching
- **Multi-Algorithm Ensemble:** Combines Gradient, Bayesian, and Monte Carlo methods
- **Confidence Scoring:** Algorithm consensus and stability analysis
- **Benchmark Validation:** Industry standard deviation detection
- **LLM Validation:** AI-powered reasonableness verification

### Enhancement Levels
Budget Brain offers three levels of accuracy enhancement:

#### **⚡ Fast Mode** (< 5 seconds)
- Monte Carlo optimization with basic validation
- Single algorithm approach for quick results
- Suitable for initial budget exploration

#### **🎯 Standard Mode** (5-15 seconds)
- Multi-algorithm validation (Monte Carlo + Gradient)
- Confidence scoring and basic benchmark validation
- Recommended for most optimization scenarios

#### **🔬 Thorough Mode** (15-30 seconds)
- Full ensemble validation (Monte Carlo + Gradient + Bayesian)
- LLM validation with reasoning generation
- Comprehensive benchmark analysis and outlier detection
- Maximum accuracy for critical budget decisions

### Key Files
- `lib/optimizer.ts` - Core Monte Carlo optimization engine
- `app/api/priors/route.ts` - AI data fetching and processing
- `app/page.tsx` - Main React application interface
- `types/shared.ts` - TypeScript type definitions
- `lib/pipelineStageManager.ts` - Pipeline progression and dependency management
- `components/PipelineFlowVisualizer.tsx` - Real-time pipeline visualization
- `lib/visualizationContext.tsx` - State management for pipeline data
- `components/__tests__/` - Comprehensive test suite (600+ tests)
- `lib/accuracyEnhancementService.ts` - Main accuracy enhancement orchestrator
- `lib/gradientOptimizer.ts` - Gradient-based optimization algorithm
- `lib/bayesianOptimizer.ts` - Bayesian optimization with Gaussian processes
- `lib/ensembleService.ts` - Multi-algorithm result combination
- `lib/confidenceScoring.ts` - Algorithm consensus and stability metrics
- `lib/llmValidator.ts` - AI-powered result validation
- `lib/benchmarkValidator.ts` - Industry benchmark comparison
- `lib/performanceMonitor.ts` - Resource usage and performance tracking

---

## 📊 How It Works

### User Journey
1. **Input Company Profile:** Describe your business and goals
2. **Click "Get Priors":** Pipeline visualization appears, AI starts data gathering
3. **Watch Progress:** Real-time pipeline shows Data Fetch → Validation stages
4. **Set Constraints:** Define min/max spend per channel
5. **Click "Optimize":** Pipeline progresses through optimization algorithms
6. **Get Results:** View recommended split with simple, plain-English guidance

### Pipeline Stages
The optimization process follows a structured 9-stage pipeline:

1. **Data Fetch** - Gemini AI searches web for advertising benchmarks
2. **Validation** - Verify data quality and citation reliability  
3. **Ensemble Optimization** - Multi-algorithm approach for robust results
4. **Bayesian Optimization** - Probabilistic optimization with uncertainty
5. **Gradient Optimization** - Mathematical optimization for precision
6. **Confidence Scoring** - Calculate reliability metrics across channels
7. **Benchmark Validation** - Compare results against industry standards
8. **LLM Validation** - AI-powered reasonableness check
9. **Final Selection** - Select optimal allocation with confidence metrics

### Accuracy Enhancement Pipeline
Budget Brain features a sophisticated multi-algorithm validation system:

#### **🎯 Multiple Optimization Algorithms**
- **Monte Carlo Simulation:** Statistical sampling with uncertainty quantification
- **Gradient Optimization:** Mathematical precision with deterministic results
- **Bayesian Optimization:** Probabilistic modeling with Gaussian processes
- **Ensemble Methods:** Combines multiple algorithms for robust recommendations

#### **🧠 AI-Powered Validation**
- **LLM Validation:** Gemini AI validates allocation reasonableness
- **Reasoning Generation:** AI explains why specific allocations are recommended
- **Warning Detection:** Identifies potentially problematic budget distributions
- **Context-Aware Analysis:** Considers business type and market conditions

#### **📊 Confidence & Consensus Metrics**
- **Algorithm Agreement:** Measures consensus across different optimization methods
- **Stability Scoring:** Evaluates result consistency across multiple runs
- **Per-Channel Confidence:** Individual reliability scores for each platform
- **Outlier Detection:** Identifies and flags conflicting algorithm results

#### **🏆 Benchmark Validation**
- **Industry Comparison:** Validates against real-world advertising benchmarks
- **Deviation Analysis:** Flags allocations that deviate significantly from norms
- **Channel-Specific Validation:** Platform-specific reasonableness checks
- **Risk Assessment:** Categorizes recommendations by confidence level

### Optimization Goals
- **Demos:** Maximize lead generation
- **Revenue:** Maximize revenue (requires average deal size)
- **CAC:** Minimize customer acquisition cost

---

## ⚡ Performance & Optimization

### Intelligent Caching System
- **Result Caching:** Stores optimization results for similar inputs
- **Memory Management:** Automatic cache eviction with LRU policy
- **Cache Hit Optimization:** Reduces computation time by up to 90%
- **Configurable Limits:** Adjustable memory usage and cache size limits

### Resource Management
- **Concurrent Operation Limits:** Prevents system overload during peak usage
- **Timeout Handling:** Graceful degradation for long-running optimizations
- **Memory Monitoring:** Real-time tracking of resource usage
- **Performance Alerts:** Automatic notifications for resource threshold breaches

### Optimization Strategies
- **Parallel Algorithm Execution:** Runs multiple optimization algorithms simultaneously
- **Early Termination:** Stops computation when confidence thresholds are met
- **Adaptive Enhancement Levels:** Automatically adjusts complexity based on input
- **Background Processing:** Non-blocking optimization for better user experience

### Performance Metrics
- **Sub-5 Second Response:** Fast mode optimization completes in under 5 seconds
- **90%+ Cache Hit Rate:** Efficient caching reduces redundant computations
- **Memory Efficiency:** Optimized memory usage with automatic cleanup
- **Scalable Architecture:** Handles concurrent users with resource pooling

---

## 🎨 Visualization Features

### Real-Time Pipeline Visualization
- **Live Progress Tracking:** Watch optimization stages complete in real-time
- **Interactive Stage Details:** Click stages to see progress, timing, and status
- **Dependency Management:** Proper sequential progression (Bayesian/Gradient after Validation)
- **Error Handling:** Visual feedback for failed stages with error details
- **Mobile Responsive:** Touch-friendly controls and swipe navigation

### User Experience Enhancements
- **Simple Recommendations:** Plain-English guidance for non-technical users
  - Primary platform focus with percentage allocation
  - Secondary platform recommendations
  - Step-by-step action plans
  - Risk level assessment with confidence indicators
- **Visual Feedback:** Color-coded status indicators and progress bars
- **Accessibility:** Screen reader support, keyboard navigation, WCAG compliance
- **Export Options:** PDF reports, PNG visualizations, JSON/CSV data export

### Interactive Components
- **Confidence Dashboard:** Algorithm performance and consensus metrics
- **Data Quality Panel:** Citation validation and benchmark analysis  
- **Alternative Options Explorer:** Compare different optimization strategies
- **Real-Time Status:** Live pipeline updates with WebSocket connections

### Debug and Testing Tools
- **Pipeline Test Page:** (`/pipeline-test`) Interactive stage progression testing
- **Pipeline Demo:** (`/pipeline-demo`) Showcase different pipeline scenarios
- **Comprehensive Test Suite:** 600+ test cases covering all components
- **Development Tools:** Debug panels for pipeline state inspection

---

## 🔬 Scientific Approach

### Statistical Methods
- **Deterministic Baseline:** Uses midpoint benchmark values
- **Monte Carlo Simulation:** Samples from full parameter distributions
- **Percentile Analysis:** Quantifies uncertainty with P10/P50/P90
- **Constraint Optimization:** Respects business allocation limits
- **Gradient Optimization:** Mathematical precision with deterministic convergence
- **Bayesian Optimization:** Probabilistic modeling with Gaussian processes
- **Ensemble Methods:** Combines multiple algorithms for robust results

### Validation Framework
- **Multi-Algorithm Consensus:** Compares results across different optimization methods
- **Confidence Scoring:** Quantifies reliability based on algorithm agreement
- **Stability Analysis:** Measures result consistency across multiple runs
- **Outlier Detection:** Identifies and flags conflicting algorithm results
- **Benchmark Validation:** Compares against industry standards and norms
- **AI Validation:** LLM-powered reasonableness checking and explanation generation

### Data Sources
- Real-time web search via Google Gemini AI
- Industry benchmark aggregation
- Citation tracking for transparency
- Dynamic market data integration
- Historical performance patterns
- Cross-platform advertising benchmarks

---

## 🧪 Testing & Quality Assurance

### Comprehensive Test Coverage
- **600+ Test Cases** across all components and scenarios
- **Unit Tests:** Individual component functionality and edge cases
- **Integration Tests:** Component interactions and API integration
- **Accessibility Tests:** WCAG compliance and screen reader compatibility
- **Performance Tests:** Large dataset handling and memory efficiency
- **Real-Time Tests:** WebSocket connections and pipeline updates

### Test Categories
- **Component Tests:** PipelineFlowVisualizer, ConfidenceDashboard, DataQualityPanel
- **API Integration:** Optimize endpoint, pipeline status, real-time events
- **Pipeline Management:** Stage progression, dependency handling, error recovery
- **User Experience:** Responsive design, touch interactions, keyboard navigation
- **Accessibility:** Screen reader announcements, focus management, ARIA compliance

### Quality Metrics
- **Line Coverage:** >90%
- **Branch Coverage:** >85% 
- **Function Coverage:** >95%
- **Accessibility:** WCAG 2.1 AA compliant
- **Performance:** <100ms component render times

### Testing Tools
- **Jest:** Unit and integration testing framework
- **React Testing Library:** Component testing with user-centric approach
- **Testing Library User Events:** Realistic user interaction simulation
- **Accessibility Testing:** Automated WCAG compliance validation

---

## ⚖️ Limitations & Assumptions

- Linear performance models (no diminishing returns)
- Independent channel performance (no correlation)
- Static competition environment
- Grid search optimization (10% increments)
- No cross-channel attribution modeling

---

## 🛡️ Security & Privacy

- No personal data storage
- API keys secured via environment variables
- Client-side state management only
- No persistent user tracking
- Open source transparency (with licensing restrictions)

---

## �️ Dtevelopment & Demo Pages

### Available Demo Pages
- **Main Application:** `/` - Full budget optimization workflow
- **Pipeline Demo:** `/pipeline-demo` - Interactive pipeline visualization showcase
- **Pipeline Test:** `/pipeline-test` - Debug tool for testing stage progression
- **Component Demos:** Individual component showcases with various scenarios

### Development Workflow
1. **Component Development:** Build individual visualization components
2. **Integration Testing:** Test component interactions and data flow
3. **Pipeline Testing:** Verify stage progression and dependency management
4. **Accessibility Testing:** Ensure WCAG compliance and screen reader support
5. **Performance Testing:** Validate with large datasets and rapid updates

### Debug Tools (Development Mode)
- **Pipeline Stage Test:** Interactive controls for manual stage progression
- **Real-Time Simulation:** Automated pipeline progression with realistic timing
- **State Inspection:** Debug panels showing pipeline state and dependencies
- **Activity Logging:** Track stage transitions and user interactions

### Code Quality
- **TypeScript:** Full type safety with strict mode enabled
- **ESLint:** Code quality and consistency enforcement
- **Prettier:** Automated code formatting
- **Husky:** Pre-commit hooks for quality gates
- **Comprehensive Documentation:** Inline comments and README files

---

## 🔮 Future Roadmap

### ✅ Recently Completed
- **Real-Time Pipeline Visualization:** Live optimization progress tracking
- **User-Friendly Recommendations:** Plain-English guidance for non-technical users
- **Comprehensive Test Suite:** 600+ test cases with full accessibility coverage
- **Interactive Debug Tools:** Pipeline testing and stage progression validation
- **Mobile Optimization:** Responsive design with touch-friendly controls
- **Multi-Algorithm Validation Pipeline:** Ensemble, Bayesian, and Gradient optimization
- **AI-Powered Result Validation:** LLM-based reasonableness checking with Gemini
- **Confidence Scoring System:** Algorithm consensus and stability metrics
- **Benchmark Validation:** Industry standard deviation analysis
- **Performance Optimization:** Intelligent caching and resource management
- **Enhancement Level Configuration:** Fast/Standard/Thorough optimization modes

### 🚧 In Progress
- **Enhanced Error Recovery:** Improved pipeline failure handling and retry logic
- **Performance Optimization:** Faster rendering for large datasets
- **Advanced Export Options:** Custom report generation and scheduling

### 🔮 Planned Features

#### Data Integration
- Direct API connections to ad platforms (Google Ads, Meta Business, etc.)
- Historical performance analysis and trend detection
- Real-time bid landscape monitoring
- Seasonal adjustment factors and market conditions

#### Advanced Modeling
- Response curve implementation (diminishing returns modeling)
- Cross-channel correlation and attribution modeling
- Dynamic competition effects and market saturation
- Multi-objective optimization with Pareto frontier analysis

#### Enterprise Features
- Campaign-level optimization and budget allocation
- A/B testing framework with statistical significance
- Automated rebalancing based on performance triggers
- Custom constraint builders and business rule engines
- Team collaboration and approval workflows

#### User Experience
- Guided onboarding and tutorial system
- Advanced filtering and search capabilities
- Custom dashboard creation and layout management
- Integration with popular business intelligence tools

---

## 📄 License

**This project is proprietary software.** 

Copyright © 2025 Nitesh More. All rights reserved.

The source code is made available for **educational viewing only**. Commercial use, modification, distribution, or incorporation into other projects is strictly prohibited without explicit written permission.

For licensing inquiries: [nitesh.more22@gmail.com]

See [LICENSE](./LICENSE) for complete terms and conditions.

---

## 🤝 Contact

**Creator:** Nitesh More
**Email:** nitesh.more22@gmail.com 
**LinkedIn:** https://www.linkedin.com/in/niteshmore22/ 

---

*Built during [ Hackathon ] 2025*
