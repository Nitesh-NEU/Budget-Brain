/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Accuracy Enhancement Service - Main orchestrator for validation pipeline
 * Coordinates multiple validation algorithms and provides enhanced optimization results
 */

import type {
  Allocation,
  Assumptions,
  ChannelPriors,
  EnhancedModelResult,
  ModelResult,
  AlgorithmResult
} from "@/types/shared";

import { GradientOptimizer } from "./gradientOptimizer";
import { BayesianOptimizer } from "./bayesianOptimizer";
import { EnsembleService } from "./ensembleService";
import { ConfidenceScoring } from "./confidenceScoring";
import { LLMValidator } from "./llmValidator";
import { BenchmarkValidator, ValidationContext } from "./benchmarkValidator";
import { optimize, monteCarloOutcome } from "./optimizer";
import { PerformanceMonitor, type PerformanceAlert } from "./performanceMonitor";

export interface EnhancementOptions {
  level: 'fast' | 'standard' | 'thorough';
  includeAlternatives: boolean;
  validateAgainstBenchmarks: boolean;
  enableLLMValidation?: boolean;
  timeoutMs?: number;
  enableCaching?: boolean;
  maxMemoryUsageMB?: number;
  maxConcurrentOperations?: number;
}

export interface ValidationAlgorithmConfig {
  name: string;
  enabled: boolean;
  weight: number;
  timeoutMs: number;
}

export interface EnhancementConfig {
  algorithms: {
    gradient: ValidationAlgorithmConfig;
    bayesian: ValidationAlgorithmConfig;
    heuristic: ValidationAlgorithmConfig;
  };
  parallelExecution: boolean;
  maxConcurrency: number;
}

export interface CacheEntry {
  key: string;
  result: EnhancedModelResult;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  memorySize: number;
}

export interface ResourceUsage {
  memoryUsageMB: number;
  activeOperations: number;
  cacheHitRate: number;
  averageResponseTime: number;
  totalRequests: number;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  cacheHit: boolean;
  memoryUsed: number;
  operationsCount: number;
}

export class AccuracyEnhancementService {
  private gradientOptimizer: GradientOptimizer;
  private ensembleService: EnsembleService;
  private confidenceScoring: ConfidenceScoring;
  private llmValidator: LLMValidator;
  private benchmarkValidator: BenchmarkValidator;
  private config: EnhancementConfig;
  
  // Caching and performance monitoring
  private cache: Map<string, CacheEntry> = new Map();
  private maxCacheSize: number = 100;
  private maxCacheAgeMins: number = 60;
  private maxMemoryUsageMB: number = 256;
  private activeOperations: number = 0;
  private maxConcurrentOperations: number = 10;
  
  // Performance metrics
  private totalRequests: number = 0;
  private cacheHits: number = 0;
  private responseTimes: number[] = [];
  private lastCleanup: number = Date.now();
  private errorCount: number = 0;
  
  // Advanced performance monitoring
  private performanceMonitor: PerformanceMonitor;

  constructor(config?: Partial<EnhancementConfig>) {
    this.gradientOptimizer = new GradientOptimizer();
    this.ensembleService = new EnsembleService();
    this.confidenceScoring = new ConfidenceScoring();
    this.llmValidator = new LLMValidator();
    this.benchmarkValidator = new BenchmarkValidator();

    // Default configuration
    this.config = {
      algorithms: {
        gradient: { name: "Gradient Descent", enabled: true, weight: 1.0, timeoutMs: 5000 },
        bayesian: { name: "Bayesian Optimization", enabled: true, weight: 1.0, timeoutMs: 10000 },
        heuristic: { name: "Heuristic Validation", enabled: true, weight: 0.5, timeoutMs: 2000 }
      },
      parallelExecution: true,
      maxConcurrency: 3,
      ...config
    };

    // Initialize performance monitor
    this.performanceMonitor = new PerformanceMonitor({
      memoryUsageMB: this.maxMemoryUsageMB * 0.8, // Alert at 80% of limit
      averageResponseTimeMs: 5000,
      errorRatePercent: 5,
      cacheHitRatePercent: 70,
      concurrentOperationsCount: this.maxConcurrentOperations * 0.8
    });

    // Start periodic cleanup and monitoring
    this.startPeriodicCleanup();
    this.startPerformanceMonitoring();
  }

  /**
   * Main method to enhance optimization results with validation pipeline
   */
  async enhanceOptimization(
    budget: number,
    priors: ChannelPriors,
    assumptions: Assumptions,
    options: EnhancementOptions = { 
      level: 'standard', 
      includeAlternatives: true, 
      validateAgainstBenchmarks: true, 
      enableLLMValidation: true,
      enableCaching: true,
      maxMemoryUsageMB: 256,
      maxConcurrentOperations: 10
    }
  ): Promise<EnhancedModelResult> {
    const startTime = Date.now();
    this.totalRequests++;

    // Update resource limits from options
    if (options.maxMemoryUsageMB) {
      this.maxMemoryUsageMB = options.maxMemoryUsageMB;
    }
    if (options.maxConcurrentOperations) {
      this.maxConcurrentOperations = options.maxConcurrentOperations;
    }

    // Check resource limits
    await this.checkResourceLimits();

    // Generate cache key
    const cacheKey = options.enableCaching !== false 
      ? this.generateCacheKey(budget, priors, assumptions, options)
      : null;

    // Check cache first
    if (cacheKey) {
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        this.cacheHits++;
        this.recordResponseTime(Date.now() - startTime);
        return cachedResult;
      }
    }

    // Increment active operations
    this.activeOperations++;

    try {
      // Configure enhancement based on level
      const enhancementConfig = this.getEnhancementConfig(options.level);

    // Run primary Monte Carlo optimization
    const primaryResult = this.runPrimaryOptimization(budget, priors, assumptions);

    // Run validation algorithms in parallel or sequentially
    const validationResults = await this.runValidationPipeline(
      budget,
      priors,
      assumptions,
      enhancementConfig,
      options.timeoutMs
    );

    // Combine all results including primary
    const allResults = [
      this.convertToAlgorithmResult(primaryResult, "Monte Carlo"),
      ...validationResults
    ];

    // Use ensemble service to combine results
    const ensembledResult = this.ensembleService.combineResults(allResults);

    // Calculate stability metrics
    const stabilityMetrics = this.confidenceScoring.assessResultStability(allResults);

    // Calculate consensus metrics
    const consensus = ensembledResult.consensus;

    // Benchmark comparison (if enabled)
    let benchmarkAnalysis;
    if (options.validateAgainstBenchmarks) {
      try {
        // Create validation context from assumptions
        const validationContext: ValidationContext = {
          budget,
          assumptions,
          // Extract industry type from assumptions if available
          industryType: this.extractIndustryType(assumptions),
          // Determine company size based on budget
          companySize: this.determineCompanySize(budget)
        };

        // Use the dedicated BenchmarkValidator for comprehensive validation
        benchmarkAnalysis = this.benchmarkValidator.validateAllocation(
          ensembledResult.finalAllocation,
          priors,
          validationContext
        );
      } catch (error) {
        console.warn("Benchmark validation failed:", error);
        benchmarkAnalysis = {
          deviationScore: 0,
          channelDeviations: { google: 0, meta: 0, tiktok: 0, linkedin: 0 },
          warnings: []
        };
      }
    }

    // Run LLM validation if enabled
    let llmValidationResult;
    let llmReasoningExplanation = "";

    if (options.enableLLMValidation) {
      try {
        const optimizationContext = {
          budget,
          priors,
          assumptions
        };

        llmValidationResult = await this.llmValidator.validateAllocation(
          ensembledResult.finalAllocation,
          optimizationContext
        );

        // Generate reasoning explanation
        llmReasoningExplanation = await this.llmValidator.explainRecommendation(
          ensembledResult.finalAllocation,
          assumptions
        );
      } catch (error) {
        console.warn("LLM validation failed:", error);
        llmValidationResult = null;
      }
    }

    // Calculate comprehensive confidence
    const confidenceMetrics = this.confidenceScoring.calculateComprehensiveConfidence(
      ensembledResult.finalAllocation,
      allResults,
      consensus,
      stabilityMetrics,
      benchmarkAnalysis,
      llmValidationResult || undefined
    );

    // Generate alternatives if requested
    const alternatives = options.includeAlternatives
      ? this.generateAlternatives(allResults, ensembledResult.finalAllocation, llmReasoningExplanation)
      : { topAllocations: [], reasoningExplanation: "Alternative allocations not requested" };

    // Combine all warnings
    const allWarnings = [
      ...ensembledResult.warnings,
      ...(benchmarkAnalysis?.warnings || []),
      ...(llmValidationResult?.warnings || [])
    ];

      // Create enhanced result
      const enhancedResult: EnhancedModelResult = {
        ...primaryResult,
        allocation: ensembledResult.finalAllocation,
        confidence: confidenceMetrics,
        validation: {
          alternativeAlgorithms: validationResults,
          consensus,
          benchmarkComparison: benchmarkAnalysis || {
            deviationScore: 0,
            channelDeviations: { google: 0, meta: 0, tiktok: 0, linkedin: 0 },
            warnings: []
          },
          warnings: allWarnings
        },
        alternatives
      };

      // Cache the result if caching is enabled
      if (cacheKey) {
        this.cacheResult(cacheKey, enhancedResult);
      }

      // Record performance metrics
      this.recordResponseTime(Date.now() - startTime);

      return enhancedResult;
    } catch (error) {
      // Track errors for performance monitoring
      this.errorCount++;
      throw error;
    } finally {
      // Decrement active operations
      this.activeOperations--;
    }
  }

  /**
   * Run the primary Monte Carlo optimization
   */
  private runPrimaryOptimization(
    budget: number,
    priors: ChannelPriors,
    assumptions: Assumptions
  ): ModelResult {
    const result = optimize(budget, priors, assumptions);
    const mc = monteCarloOutcome(budget, result.best.split, priors, assumptions.goal, assumptions.avgDealSize);

    return {
      allocation: result.best.split,
      detOutcome: result.best.det,
      mc,
      intervals: result.intervals,
      objective: assumptions.goal,
      summary: `Optimized for ${assumptions.goal} with ${budget} budget`,
      citations: []
    };
  }

  /**
   * Run validation algorithms based on enhancement configuration
   */
  private async runValidationPipeline(
    budget: number,
    priors: ChannelPriors,
    assumptions: Assumptions,
    enhancementConfig: EnhancementConfig,
    globalTimeoutMs?: number
  ): Promise<AlgorithmResult[]> {
    const validationTasks: Promise<AlgorithmResult | null>[] = [];

    // Create validation tasks
    if (enhancementConfig.algorithms.gradient.enabled) {
      validationTasks.push(
        this.runWithTimeout(
          () => this.runGradientOptimization(budget, priors, assumptions),
          enhancementConfig.algorithms.gradient.timeoutMs,
          "Gradient Descent"
        )
      );
    }

    if (enhancementConfig.algorithms.bayesian.enabled) {
      validationTasks.push(
        this.runWithTimeout(
          () => this.runBayesianOptimization(budget, priors, assumptions),
          enhancementConfig.algorithms.bayesian.timeoutMs,
          "Bayesian Optimization"
        )
      );
    }

    if (enhancementConfig.algorithms.heuristic.enabled) {
      validationTasks.push(
        this.runWithTimeout(
          () => this.runHeuristicValidation(budget, priors, assumptions),
          enhancementConfig.algorithms.heuristic.timeoutMs,
          "Heuristic Validation"
        )
      );
    }

    // Execute tasks with global timeout if specified
    let results: (AlgorithmResult | null)[];

    if (globalTimeoutMs) {
      const globalTimeout = new Promise<(AlgorithmResult | null)[]>((_, reject) => {
        setTimeout(() => reject(new Error("Global validation timeout")), globalTimeoutMs);
      });

      try {
        results = await Promise.race([
          Promise.all(validationTasks),
          globalTimeout
        ]);
      } catch (error) {
        console.warn("Validation pipeline timeout, using partial results");
        // Return empty results on global timeout
        results = [];
      }
    } else {
      results = await Promise.all(validationTasks);
    }

    // Filter out null results (timeouts/failures)
    return results.filter((result): result is AlgorithmResult => result !== null);
  }

  /**
   * Run gradient optimization algorithm
   */
  private async runGradientOptimization(
    budget: number,
    priors: ChannelPriors,
    assumptions: Assumptions
  ): Promise<AlgorithmResult> {
    const result = this.gradientOptimizer.optimize(budget, priors, assumptions);
    return this.gradientOptimizer.toAlgorithmResult(result);
  }

  /**
   * Run Bayesian optimization algorithm
   */
  private async runBayesianOptimization(
    budget: number,
    priors: ChannelPriors,
    assumptions: Assumptions
  ): Promise<AlgorithmResult> {
    const optimizer = new BayesianOptimizer({
      maxIterations: 30,
      acquisitionFunction: 'ei', // Expected Improvement
      explorationWeight: 2.0,
      kernelLengthScale: 0.1,
      kernelVariance: 1.0,
      noiseVariance: 0.01
    });

    const result = optimizer.optimize(budget, priors, assumptions);
    return optimizer.toAlgorithmResult(result);
  }

  /**
   * Run heuristic validation algorithm
   */
  private async runHeuristicValidation(
    budget: number,
    priors: ChannelPriors,
    assumptions: Assumptions
  ): Promise<AlgorithmResult> {
    // Simple heuristic: allocate based on channel performance ratios
    const channels = ["google", "meta", "tiktok", "linkedin"] as const;
    const performanceScores: Record<string, number> = {};

    // Calculate performance score for each channel
    for (const channel of channels) {
      const cpmMid = (priors[channel].cpm[0] + priors[channel].cpm[1]) / 2;
      const ctrMid = (priors[channel].ctr[0] + priors[channel].ctr[1]) / 2;
      const cvrMid = (priors[channel].cvr[0] + priors[channel].cvr[1]) / 2;

      // Higher CTR and CVR with lower CPM = better performance
      performanceScores[channel] = (ctrMid * cvrMid) / cpmMid;
    }

    // Normalize to get allocation percentages
    const totalScore = Object.values(performanceScores).reduce((sum, score) => sum + score, 0);
    const allocation: Allocation = {
      google: performanceScores.google / totalScore,
      meta: performanceScores.meta / totalScore,
      tiktok: performanceScores.tiktok / totalScore,
      linkedin: performanceScores.linkedin / totalScore
    };

    // Apply constraints if any
    const constrainedAllocation = this.applyConstraints(allocation, assumptions);

    // Calculate expected performance
    const expectedConversions = this.calculateExpectedConversions(budget, constrainedAllocation, priors);
    let performance = expectedConversions;

    if (assumptions.goal === "revenue") {
      performance = expectedConversions * (assumptions.avgDealSize || 1000);
    } else if (assumptions.goal === "cac") {
      performance = budget / Math.max(expectedConversions, 1e-9);
    }

    return {
      name: "Heuristic Validation",
      allocation: constrainedAllocation,
      confidence: 0.7,
      performance
    };
  }

  /**
   * Apply constraints to allocation
   */
  private applyConstraints(allocation: Allocation, assumptions: Assumptions): Allocation {
    const channels = ["google", "meta", "tiktok", "linkedin"] as const;
    let constrained = { ...allocation };

    // Apply min/max constraints
    for (const channel of channels) {
      if (assumptions.minPct?.[channel]) {
        constrained[channel] = Math.max(constrained[channel], assumptions.minPct[channel]!);
      }
      if (assumptions.maxPct?.[channel]) {
        constrained[channel] = Math.min(constrained[channel], assumptions.maxPct[channel]!);
      }
    }

    // Normalize to sum to 1
    const total = channels.reduce((sum, ch) => sum + constrained[ch], 0);
    if (total > 0) {
      for (const channel of channels) {
        constrained[channel] = constrained[channel] / total;
      }
    }

    return constrained;
  }

  /**
   * Calculate expected conversions for an allocation
   */
  private calculateExpectedConversions(
    budget: number,
    allocation: Allocation,
    priors: ChannelPriors
  ): number {
    const channels = ["google", "meta", "tiktok", "linkedin"] as const;
    let totalConversions = 0;

    for (const channel of channels) {
      const spend = budget * allocation[channel];
      const cpmMid = (priors[channel].cpm[0] + priors[channel].cpm[1]) / 2;
      const ctrMid = (priors[channel].ctr[0] + priors[channel].ctr[1]) / 2;
      const cvrMid = (priors[channel].cvr[0] + priors[channel].cvr[1]) / 2;

      const impressions = (spend / cpmMid) * 1000;
      const clicks = impressions * ctrMid;
      const conversions = clicks * cvrMid;

      totalConversions += conversions;
    }

    return totalConversions;
  }

  /**
   * Convert ModelResult to AlgorithmResult format
   */
  private convertToAlgorithmResult(result: ModelResult, name: string): AlgorithmResult {
    return {
      name,
      allocation: result.allocation,
      confidence: 0.8, // Base confidence for Monte Carlo
      performance: result.mc.p50
    };
  }

  /**
   * Run a function with timeout
   */
  private async runWithTimeout<T>(
    fn: () => Promise<T> | T,
    timeoutMs: number,
    algorithmName: string
  ): Promise<T | null> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`${algorithmName} timeout`)), timeoutMs);
      });

      const result = await Promise.race([
        Promise.resolve(fn()),
        timeoutPromise
      ]);

      return result;
    } catch (error) {
      console.warn(`${algorithmName} failed or timed out:`, error);
      return null;
    }
  }

  /**
   * Get enhancement configuration based on level
   */
  private getEnhancementConfig(level: EnhancementOptions['level']): EnhancementConfig {
    const baseConfig = { ...this.config };

    switch (level) {
      case 'fast':
        return {
          ...baseConfig,
          algorithms: {
            gradient: { ...baseConfig.algorithms.gradient, enabled: true, timeoutMs: 2000 },
            bayesian: { ...baseConfig.algorithms.bayesian, enabled: false },
            heuristic: { ...baseConfig.algorithms.heuristic, enabled: true, timeoutMs: 1000 }
          },
          maxConcurrency: 2
        };

      case 'standard':
        return {
          ...baseConfig,
          algorithms: {
            gradient: { ...baseConfig.algorithms.gradient, enabled: true, timeoutMs: 5000 },
            bayesian: { ...baseConfig.algorithms.bayesian, enabled: true, timeoutMs: 8000 },
            heuristic: { ...baseConfig.algorithms.heuristic, enabled: true, timeoutMs: 2000 }
          },
          maxConcurrency: 3
        };

      case 'thorough':
        return {
          ...baseConfig,
          algorithms: {
            gradient: { ...baseConfig.algorithms.gradient, enabled: true, timeoutMs: 10000 },
            bayesian: { ...baseConfig.algorithms.bayesian, enabled: true, timeoutMs: 15000 },
            heuristic: { ...baseConfig.algorithms.heuristic, enabled: true, timeoutMs: 5000 }
          },
          maxConcurrency: 3
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Extract industry type from assumptions or other context
   */
  private extractIndustryType(assumptions: Assumptions): string | undefined {
    // For now, we'll use simple heuristics based on goal and other factors
    // In a real implementation, this could be passed as a parameter or inferred from other data
    
    if (assumptions.goal === "cac" && assumptions.targetCAC && assumptions.targetCAC > 500) {
      return "b2b"; // High CAC typically indicates B2B
    }
    
    if (assumptions.goal === "revenue" && assumptions.avgDealSize && assumptions.avgDealSize < 200) {
      return "ecommerce"; // Low deal size typically indicates e-commerce
    }
    
    if (assumptions.goal === "demos") {
      return "saas"; // Demo requests typically indicate SaaS
    }
    
    return undefined; // Use default benchmarks
  }

  /**
   * Determine company size based on budget
   */
  private determineCompanySize(budget: number): 'small' | 'medium' | 'large' {
    if (budget < 10000) {
      return 'small';
    } else if (budget < 100000) {
      return 'medium';
    } else {
      return 'large';
    }
  }

  /**
   * Generate alternative allocations from algorithm results
   */
  private generateAlternatives(
    results: AlgorithmResult[],
    finalAllocation: Allocation,
    llmReasoning?: string
  ): { topAllocations: Allocation[]; reasoningExplanation: string } {
    // Sort results by confidence and performance
    const sortedResults = [...results].sort((a, b) => {
      const scoreA = a.confidence * 0.6 + (a.performance / 10000) * 0.4; // Normalize performance
      const scoreB = b.confidence * 0.6 + (b.performance / 10000) * 0.4;
      return scoreB - scoreA;
    });

    // Get top 3 unique allocations (excluding the final allocation)
    const topAllocations: Allocation[] = [];
    const allocationStrings = new Set([JSON.stringify(finalAllocation)]);

    for (const result of sortedResults) {
      const allocationString = JSON.stringify(result.allocation);
      if (!allocationStrings.has(allocationString) && topAllocations.length < 3) {
        topAllocations.push(result.allocation);
        allocationStrings.add(allocationString);
      }
    }

    // Generate reasoning explanation
    let reasoningExplanation: string;

    if (llmReasoning) {
      // Use LLM-generated reasoning if available
      reasoningExplanation = llmReasoning;
    } else {
      // Fallback to algorithm-based reasoning
      const algorithmNames = results.map(r => r.name).join(", ");
      const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

      reasoningExplanation = `Final allocation determined by combining results from ${algorithmNames}. ` +
        `Average algorithm confidence: ${(avgConfidence * 100).toFixed(1)}%. ` +
        `${topAllocations.length} alternative allocations provided based on individual algorithm recommendations.`;
    }

    return {
      topAllocations,
      reasoningExplanation
    };
  }

  /**
   * Generate cache key for optimization inputs
   */
  private generateCacheKey(
    budget: number,
    priors: ChannelPriors,
    assumptions: Assumptions,
    options: EnhancementOptions
  ): string {
    // Create a deterministic hash of the inputs
    const keyData = {
      budget: Math.round(budget), // Round to avoid minor floating point differences
      priors: this.roundPriors(priors),
      assumptions: this.roundAssumptions(assumptions),
      level: options.level,
      includeAlternatives: options.includeAlternatives,
      validateAgainstBenchmarks: options.validateAgainstBenchmarks,
      enableLLMValidation: options.enableLLMValidation
    };

    return this.hashObject(keyData);
  }

  /**
   * Round priors to avoid cache misses due to minor floating point differences
   */
  private roundPriors(priors: ChannelPriors): ChannelPriors {
    const roundedPriors: ChannelPriors = {} as ChannelPriors;
    
    for (const [channel, channelPriors] of Object.entries(priors)) {
      roundedPriors[channel as keyof ChannelPriors] = {
        cpm: [Math.round(channelPriors.cpm[0] * 100) / 100, Math.round(channelPriors.cpm[1] * 100) / 100],
        ctr: [Math.round(channelPriors.ctr[0] * 10000) / 10000, Math.round(channelPriors.ctr[1] * 10000) / 10000],
        cvr: [Math.round(channelPriors.cvr[0] * 10000) / 10000, Math.round(channelPriors.cvr[1] * 10000) / 10000]
      };
    }
    
    return roundedPriors;
  }

  /**
   * Round assumptions to avoid cache misses due to minor floating point differences
   */
  private roundAssumptions(assumptions: Assumptions): Assumptions {
    return {
      ...assumptions,
      avgDealSize: assumptions.avgDealSize ? Math.round(assumptions.avgDealSize * 100) / 100 : undefined,
      targetCAC: assumptions.targetCAC ? Math.round(assumptions.targetCAC * 100) / 100 : undefined,
      minPct: assumptions.minPct ? this.roundAllocation(assumptions.minPct) : undefined,
      maxPct: assumptions.maxPct ? this.roundAllocation(assumptions.maxPct) : undefined
    };
  }

  /**
   * Round allocation percentages
   */
  private roundAllocation(allocation: Partial<Allocation>): Partial<Allocation> {
    const rounded: Partial<Allocation> = {};
    for (const [channel, value] of Object.entries(allocation)) {
      if (value !== undefined) {
        rounded[channel as keyof Allocation] = Math.round(value * 10000) / 10000;
      }
    }
    return rounded;
  }

  /**
   * Simple hash function for objects
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Get cached result if available and not expired
   */
  private getCachedResult(cacheKey: string): EnhancedModelResult | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const ageMinutes = (now - entry.timestamp) / (1000 * 60);

    // Check if cache entry is expired
    if (ageMinutes > this.maxCacheAgeMins) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.result;
  }

  /**
   * Cache optimization result
   */
  private cacheResult(cacheKey: string, result: EnhancedModelResult): void {
    const now = Date.now();
    const memorySize = this.estimateMemorySize(result);

    // Check if adding this entry would exceed memory limit
    const currentMemoryUsage = this.getCurrentMemoryUsage();
    if (currentMemoryUsage + memorySize > this.maxMemoryUsageMB * 1024 * 1024) {
      // Evict least recently used entries to make space
      this.evictLRUEntries(memorySize);
    }

    // Add to cache
    const entry: CacheEntry = {
      key: cacheKey,
      result,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      memorySize
    };

    this.cache.set(cacheKey, entry);

    // Enforce max cache size
    if (this.cache.size > this.maxCacheSize) {
      this.evictOldestEntries();
    }
  }

  /**
   * Estimate memory size of a result object
   */
  private estimateMemorySize(result: EnhancedModelResult): number {
    // Rough estimation based on JSON string length
    const jsonString = JSON.stringify(result);
    return jsonString.length * 2; // Assume 2 bytes per character (UTF-16)
  }

  /**
   * Get current memory usage of cache
   */
  private getCurrentMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.memorySize;
    }
    return totalSize;
  }

  /**
   * Evict least recently used entries to free up memory
   */
  private evictLRUEntries(requiredSpace: number): void {
    // Sort entries by last accessed time (oldest first)
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.lastAccessed - b.lastAccessed
    );

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      this.cache.delete(key);
      freedSpace += entry.memorySize;
      
      if (freedSpace >= requiredSpace) {
        break;
      }
    }
  }

  /**
   * Evict oldest entries when cache size limit is exceeded
   */
  private evictOldestEntries(): void {
    // Sort entries by timestamp (oldest first)
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    );

    // Remove oldest entries until we're under the limit
    const entriesToRemove = this.cache.size - this.maxCacheSize + 1;
    for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Check resource limits and throw error if exceeded
   */
  private async checkResourceLimits(): Promise<void> {
    // Check concurrent operations limit
    if (this.activeOperations >= this.maxConcurrentOperations) {
      throw new Error(`Maximum concurrent operations limit reached: ${this.maxConcurrentOperations}`);
    }

    // Check memory usage
    const currentMemoryUsage = this.getCurrentMemoryUsage();
    if (currentMemoryUsage > this.maxMemoryUsageMB * 1024 * 1024 * 0.9) { // 90% threshold
      // Trigger aggressive cleanup
      this.evictLRUEntries(currentMemoryUsage * 0.3); // Free up 30% of current usage
    }

    // Periodic cleanup if needed
    const now = Date.now();
    if (now - this.lastCleanup > 5 * 60 * 1000) { // 5 minutes
      this.performPeriodicCleanup();
      this.lastCleanup = now;
    }
  }

  /**
   * Record response time for performance metrics
   */
  private recordResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);
    
    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }
  }

  /**
   * Start periodic cleanup process
   */
  private startPeriodicCleanup(): void {
    // Run cleanup every 10 minutes
    setInterval(() => {
      this.performPeriodicCleanup();
    }, 10 * 60 * 1000);
  }

  /**
   * Perform periodic cleanup of expired cache entries
   */
  private performPeriodicCleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const ageMinutes = (now - entry.timestamp) / (1000 * 60);
      if (ageMinutes > this.maxCacheAgeMins) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      this.cache.delete(key);
    }

    // Log cleanup results if significant
    if (expiredKeys.length > 0) {
      console.log(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * Get current resource usage statistics
   */
  public getResourceUsage(): ResourceUsage {
    const cacheHitRate = this.totalRequests > 0 ? this.cacheHits / this.totalRequests : 0;
    const averageResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
      : 0;

    return {
      memoryUsageMB: this.getCurrentMemoryUsage() / (1024 * 1024),
      activeOperations: this.activeOperations,
      cacheHitRate,
      averageResponseTime,
      totalRequests: this.totalRequests
    };
  }

  /**
   * Clear cache manually
   */
  public clearCache(): void {
    this.cache.clear();
    console.log("Cache cleared manually");
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    memoryUsageMB: number;
    hitRate: number;
    totalRequests: number;
    entries: Array<{
      key: string;
      timestamp: number;
      accessCount: number;
      lastAccessed: number;
      memorySize: number;
    }>;
  } {
    const entries = Array.from(this.cache.values()).map(entry => ({
      key: entry.key,
      timestamp: entry.timestamp,
      accessCount: entry.accessCount,
      lastAccessed: entry.lastAccessed,
      memorySize: entry.memorySize
    }));

    return {
      size: this.cache.size,
      memoryUsageMB: this.getCurrentMemoryUsage() / (1024 * 1024),
      hitRate: this.totalRequests > 0 ? this.cacheHits / this.totalRequests : 0,
      totalRequests: this.totalRequests,
      entries
    };
  }

  /**
   * Configure cache settings
   */
  public configureCaching(options: {
    maxCacheSize?: number;
    maxCacheAgeMins?: number;
    maxMemoryUsageMB?: number;
    maxConcurrentOperations?: number;
  }): void {
    if (options.maxCacheSize !== undefined) {
      this.maxCacheSize = options.maxCacheSize;
    }
    if (options.maxCacheAgeMins !== undefined) {
      this.maxCacheAgeMins = options.maxCacheAgeMins;
    }
    if (options.maxMemoryUsageMB !== undefined) {
      this.maxMemoryUsageMB = options.maxMemoryUsageMB;
      // Update performance monitor thresholds
      this.performanceMonitor.configureThresholds({
        memoryUsageMB: this.maxMemoryUsageMB * 0.8
      });
    }
    if (options.maxConcurrentOperations !== undefined) {
      this.maxConcurrentOperations = options.maxConcurrentOperations;
      // Update performance monitor thresholds
      this.performanceMonitor.configureThresholds({
        concurrentOperationsCount: this.maxConcurrentOperations * 0.8
      });
    }

    // Trigger cleanup if new limits are more restrictive
    this.performPeriodicCleanup();
    
    if (this.cache.size > this.maxCacheSize) {
      this.evictOldestEntries();
    }
    
    const currentMemoryUsage = this.getCurrentMemoryUsage();
    if (currentMemoryUsage > this.maxMemoryUsageMB * 1024 * 1024) {
      this.evictLRUEntries(currentMemoryUsage - this.maxMemoryUsageMB * 1024 * 1024);
    }
  }

  /**
   * Start performance monitoring process
   */
  private startPerformanceMonitoring(): void {
    // Monitor performance every 30 seconds
    setInterval(() => {
      const resourceUsage = this.getResourceUsage();
      const alerts = this.performanceMonitor.recordMetrics({
        memoryUsageMB: resourceUsage.memoryUsageMB,
        activeOperations: resourceUsage.activeOperations,
        cacheHitRate: resourceUsage.cacheHitRate,
        averageResponseTime: resourceUsage.averageResponseTime,
        totalRequests: resourceUsage.totalRequests,
        errorCount: this.errorCount
      });

      // Log critical alerts
      const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
      if (criticalAlerts.length > 0) {
        console.error('Critical performance alerts:', criticalAlerts);
      }

      // Log high severity alerts
      const highAlerts = alerts.filter(alert => alert.severity === 'high');
      if (highAlerts.length > 0) {
        console.warn('High severity performance alerts:', highAlerts);
      }
    }, 30 * 1000);
  }

  /**
   * Get performance alerts
   */
  public getPerformanceAlerts(hoursBack: number = 24): PerformanceAlert[] {
    return this.performanceMonitor.getRecentAlerts(hoursBack);
  }

  /**
   * Get performance summary with recommendations
   */
  public getPerformanceSummary(): {
    currentStatus: 'healthy' | 'warning' | 'critical';
    recentAlerts: number;
    criticalAlerts: number;
    trends: any[];
    recommendations: string[];
  } {
    return this.performanceMonitor.getPerformanceSummary();
  }

  /**
   * Get performance trends for analysis
   */
  public getPerformanceTrends(hoursBack: number = 24): any[] {
    return this.performanceMonitor.getPerformanceTrends(hoursBack);
  }

  /**
   * Configure performance monitoring thresholds
   */
  public configurePerformanceThresholds(thresholds: {
    memoryUsageMB?: number;
    averageResponseTimeMs?: number;
    errorRatePercent?: number;
    cacheHitRatePercent?: number;
    concurrentOperationsCount?: number;
  }): void {
    this.performanceMonitor.configureThresholds(thresholds);
  }

  /**
   * Export all performance data for analysis
   */
  public exportPerformanceData(): {
    alerts: PerformanceAlert[];
    metricsHistory: Record<string, Array<{ value: number; timestamp: number }>>;
    thresholds: any;
    resourceUsage: ResourceUsage;
    cacheStats: any;
  } {
    const performanceData = this.performanceMonitor.exportPerformanceData();
    return {
      ...performanceData,
      resourceUsage: this.getResourceUsage(),
      cacheStats: this.getCacheStats()
    };
  }

  /**
   * Reset performance monitoring data
   */
  public resetPerformanceMonitoring(): void {
    this.performanceMonitor.clearHistory();
    this.errorCount = 0;
    this.totalRequests = 0;
    this.cacheHits = 0;
    this.responseTimes = [];
  }

  /**
   * Get detailed performance report
   */
  public getDetailedPerformanceReport(): {
    summary: any;
    resourceUsage: ResourceUsage;
    cacheStats: any;
    recentAlerts: PerformanceAlert[];
    trends: any[];
    recommendations: string[];
    systemHealth: {
      score: number; // 0-100
      status: 'healthy' | 'warning' | 'critical';
      issues: string[];
    };
  } {
    const summary = this.getPerformanceSummary();
    const resourceUsage = this.getResourceUsage();
    const cacheStats = this.getCacheStats();
    const recentAlerts = this.getPerformanceAlerts(1); // Last hour
    const trends = this.getPerformanceTrends(24);

    // Calculate system health score
    let healthScore = 100;
    const issues: string[] = [];

    // Deduct points for alerts
    const criticalAlerts = recentAlerts.filter(a => a.severity === 'critical');
    const highAlerts = recentAlerts.filter(a => a.severity === 'high');
    const mediumAlerts = recentAlerts.filter(a => a.severity === 'medium');

    healthScore -= criticalAlerts.length * 30;
    healthScore -= highAlerts.length * 15;
    healthScore -= mediumAlerts.length * 5;

    if (criticalAlerts.length > 0) {
      issues.push(`${criticalAlerts.length} critical performance issues`);
    }
    if (highAlerts.length > 0) {
      issues.push(`${highAlerts.length} high severity performance issues`);
    }

    // Check resource utilization
    if (resourceUsage.memoryUsageMB > this.maxMemoryUsageMB * 0.9) {
      healthScore -= 20;
      issues.push('High memory usage');
    }

    if (resourceUsage.cacheHitRate < 0.5) {
      healthScore -= 10;
      issues.push('Low cache hit rate');
    }

    if (resourceUsage.averageResponseTime > 10000) {
      healthScore -= 15;
      issues.push('Slow response times');
    }

    healthScore = Math.max(0, Math.min(100, healthScore));

    let status: 'healthy' | 'warning' | 'critical';
    if (healthScore >= 80) {
      status = 'healthy';
    } else if (healthScore >= 60) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      summary,
      resourceUsage,
      cacheStats,
      recentAlerts,
      trends,
      recommendations: summary.recommendations,
      systemHealth: {
        score: healthScore,
        status,
        issues
      }
    };
  }
}