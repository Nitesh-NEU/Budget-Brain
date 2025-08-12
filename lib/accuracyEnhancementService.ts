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
  AlgorithmResult,
  ValidationWarning
} from "@/types/shared";

import { GradientOptimizer } from "./gradientOptimizer";
import { BayesianOptimizer } from "./bayesianOptimizer";
import { EnsembleService } from "./ensembleService";
import { ConfidenceScoring } from "./confidenceScoring";
import { LLMValidator } from "./llmValidator";
import { optimize, monteCarloOutcome } from "./optimizer";

export interface EnhancementOptions {
  level: 'fast' | 'standard' | 'thorough';
  includeAlternatives: boolean;
  validateAgainstBenchmarks: boolean;
  enableLLMValidation?: boolean;
  timeoutMs?: number;
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

export class AccuracyEnhancementService {
  private gradientOptimizer: GradientOptimizer;
  private ensembleService: EnsembleService;
  private confidenceScoring: ConfidenceScoring;
  private llmValidator: LLMValidator;
  private config: EnhancementConfig;

  constructor(config?: Partial<EnhancementConfig>) {
    this.gradientOptimizer = new GradientOptimizer();
    this.ensembleService = new EnsembleService();
    this.confidenceScoring = new ConfidenceScoring();
    this.llmValidator = new LLMValidator();

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
  }

  /**
   * Main method to enhance optimization results with validation pipeline
   */
  async enhanceOptimization(
    budget: number,
    priors: ChannelPriors,
    assumptions: Assumptions,
    options: EnhancementOptions = { level: 'standard', includeAlternatives: true, validateAgainstBenchmarks: true, enableLLMValidation: true }
  ): Promise<EnhancedModelResult> {
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
      benchmarkAnalysis = this.confidenceScoring.benchmarkComparison(
        ensembledResult.finalAllocation,
        priors
      );
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

    return enhancedResult;
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
}