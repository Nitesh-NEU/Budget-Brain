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

### Core Algorithms
- **Monte Carlo Simulation:** Statistical sampling across parameter ranges
- **Grid Search Optimization:** Systematic evaluation of allocation combinations
- **Uncertainty Quantification:** P10/P50/P90 percentile analysis
- **Real-time Data Integration:** AI-powered benchmark fetching

### Key Files
- `lib/optimizer.ts` - Core Monte Carlo optimization engine
- `app/api/priors/route.ts` - AI data fetching and processing
- `app/page.tsx` - Main React application interface
- `types/shared.ts` - TypeScript type definitions

---

## 📊 How It Works

1. **Input Company Profile:** Describe your business and goals
2. **AI Data Gathering:** Gemini searches web for advertising benchmarks  
3. **Set Constraints:** Define min/max spend per channel
4. **Monte Carlo Optimization:** 800 simulations find optimal allocation
5. **Results Analysis:** View recommended split with uncertainty ranges

### Optimization Goals
- **Demos:** Maximize lead generation
- **Revenue:** Maximize revenue (requires average deal size)
- **CAC:** Minimize customer acquisition cost

---

## 🔬 Scientific Approach

### Statistical Methods
- **Deterministic Baseline:** Uses midpoint benchmark values
- **Monte Carlo Simulation:** Samples from full parameter distributions
- **Percentile Analysis:** Quantifies uncertainty with P10/P50/P90
- **Constraint Optimization:** Respects business allocation limits

### Data Sources
- Real-time web search via Google Gemini AI
- Industry benchmark aggregation
- Citation tracking for transparency
- Dynamic market data integration

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

## 🔮 Future Roadmap

### Data Integration
- Direct API connections to ad platforms
- Historical performance analysis
- Real-time bid landscape monitoring
- Seasonal adjustment factors

### Advanced Modeling
- Response curve implementation
- Cross-channel correlation modeling
- Dynamic competition effects
- Multi-objective optimization

### Enterprise Features
- Campaign-level optimization
- A/B testing framework
- Automated rebalancing
- Custom constraint builders

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
