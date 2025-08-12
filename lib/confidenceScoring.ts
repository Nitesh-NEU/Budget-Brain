/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Confidence scoring service for assessing optimization result reliability
 * Provides confidence calculation based on algorithm agreement and stability metrics
 */

import type {
  Allocation,
  Channel,
  AlgorithmResult,
  StabilityMetrics,
  BenchmarkAnalysis,
  ChannelPriors,
  ConsensusMetrics
} from "@/types/shared";
import type { LLMValidationResult } from "./llmValidator";

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  warnings: string[];
}

export interface ConfidenceMetrics {
  overall: number;
  perChannel: Record<Channel, number>;
  stability: number;
}

export class ConfidenceScoring {
  private readonly channels: Channel[] = ["google", "meta", "tiktok", "linkedin"];

  /**
   * Calculate overall confidence score for an allocation based on validation results
   */
  calculateAllocationConfidence(
    allocation: Allocation,
    validationResults: ValidationResult[]
  ): number {
    if (validationResults.length === 0) {
      return 0.5; // Neutral confidence when no validation available
    }

    // Weight validation results by their individual confidence
    const totalWeight = validationResults.reduce((sum, result) => sum + result.confidence, 0);

    if (totalWeight === 0) {
      return 0.1; // Very low confidence if all validations have zero confidence
    }

    // Calculate weighted average of validation confidences
    const weightedConfidence = validationResults.reduce((sum, result) => {
      const weight = result.confidence / totalWeight;
      return sum + (result.isValid ? result.confidence * weight : 0);
    }, 0);

    // Apply penalty for warnings
    const warningCount = validationResults.reduce((sum, result) => sum + result.warnings.length, 0);
    const warningPenalty = Math.min(warningCount * 0.1, 0.3); // Max 30% penalty

    return Math.max(0, Math.min(1, weightedConfidence - warningPenalty));
  }

  /**
   * Assess result stability across multiple optimization runs
   */
  assessResultStability(results: AlgorithmResult[]): StabilityMetrics {
    if (results.length === 0) {
      throw new Error("Cannot assess stability with empty results array");
    }

    if (results.length === 1) {
      return {
        overallStability: 1.0,
        channelStability: this.channels.reduce((acc, ch) => ({ ...acc, [ch]: 1.0 }), {} as Record<Channel, number>),
        convergenceScore: 1.0
      };
    }

    const allocations = results.map(r => r.allocation);

    // Calculate per-channel stability
    const channelStability: Record<Channel, number> = {} as Record<Channel, number>;
    let totalVariance = 0;

    for (const channel of this.channels) {
      const values = allocations.map(a => a[channel]);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

      // Convert variance to stability score (lower variance = higher stability)
      const stability = Math.max(0, 1 - (variance * 10)); // Scale variance to 0-1 range
      channelStability[channel] = Math.min(1, stability);
      totalVariance += variance;
    }

    // Calculate overall stability
    const avgVariance = totalVariance / this.channels.length;
    const overallStability = Math.max(0, Math.min(1, 1 - (avgVariance * 10)));

    // Calculate convergence score based on performance consistency
    const performances = results.map(r => r.performance);
    const perfMean = performances.reduce((sum, val) => sum + val, 0) / performances.length;
    const perfVariance = performances.reduce((sum, val) => sum + Math.pow(val - perfMean, 2), 0) / performances.length;
    const convergenceScore = Math.max(0, Math.min(1, 1 - (perfVariance * 0.1)));

    return {
      overallStability,
      channelStability,
      convergenceScore
    };
  }

  /**
   * Compare allocation against industry benchmarks
   */
  benchmarkComparison(allocation: Allocation, industryBenchmarks: ChannelPriors): BenchmarkAnalysis {
    const channelDeviations: Record<Channel, number> = {} as Record<Channel, number>;
    let totalDeviation = 0;
    const warnings = [];

    for (const channel of this.channels) {
      const allocatedPct = allocation[channel];
      const benchmarkPriors = industryBenchmarks[channel];

      // Use the midpoint of benchmark range as reference
      const benchmarkMidpoint = {
        cpm: (benchmarkPriors.cpm[0] + benchmarkPriors.cpm[1]) / 2,
        ctr: (benchmarkPriors.ctr[0] + benchmarkPriors.ctr[1]) / 2,
        cvr: (benchmarkPriors.cvr[0] + benchmarkPriors.cvr[1]) / 2
      };

      // Calculate expected allocation based on performance metrics
      // Higher CTR and CVR with lower CPM should get more allocation
      const performanceScore = (benchmarkMidpoint.ctr * benchmarkMidpoint.cvr) / benchmarkMidpoint.cpm;

      // Normalize performance scores to get expected allocation
      const allPerformanceScores = this.channels.map(ch => {
        const priors = industryBenchmarks[ch];
        const midpoint = {
          cpm: (priors.cpm[0] + priors.cpm[1]) / 2,
          ctr: (priors.ctr[0] + priors.ctr[1]) / 2,
          cvr: (priors.cvr[0] + priors.cvr[1]) / 2
        };
        return (midpoint.ctr * midpoint.cvr) / midpoint.cpm;
      });

      const totalPerformance = allPerformanceScores.reduce((sum, score) => sum + score, 0);
      const expectedAllocation = totalPerformance > 0 ? performanceScore / totalPerformance : 0.25;

      // Calculate deviation
      const deviation = Math.abs(allocatedPct - expectedAllocation);
      channelDeviations[channel] = deviation;
      totalDeviation += deviation;

      // Generate warnings for significant deviations
      if (deviation > 0.2) { // 20% deviation threshold
        warnings.push({
          type: "benchmark_deviation",
          message: `${channel} allocation (${(allocatedPct * 100).toFixed(1)}%) deviates significantly from benchmark expectation (${(expectedAllocation * 100).toFixed(1)}%)`,
          severity: deviation > 0.3 ? "high" as const : "medium" as const,
          channel
        });
      }
    }

    // Calculate overall deviation score (0 = perfect match, 1 = maximum deviation)
    const maxPossibleDeviation = 2; // Maximum when one channel gets 100% and others get 0%
    const deviationScore = Math.min(1, totalDeviation / maxPossibleDeviation);

    return {
      deviationScore,
      channelDeviations,
      warnings
    };
  }

  /**
   * Calculate comprehensive confidence metrics combining multiple factors
   */
  calculateComprehensiveConfidence(
    allocation: Allocation,
    algorithmResults: AlgorithmResult[],
    consensus: ConsensusMetrics,
    stabilityMetrics: StabilityMetrics,
    benchmarkAnalysis?: BenchmarkAnalysis,
    llmValidation?: LLMValidationResult
  ): ConfidenceMetrics {
    // Base confidence from algorithm consensus
    const consensusConfidence = consensus.agreement;

    // Stability contribution
    const stabilityConfidence = stabilityMetrics.overallStability;

    // Benchmark comparison contribution (if available)
    const benchmarkConfidence = benchmarkAnalysis
      ? Math.max(0, 1 - benchmarkAnalysis.deviationScore)
      : 0.7; // Neutral score when no benchmark available

    // Algorithm performance consistency
    const performanceConsistency = stabilityMetrics.convergenceScore;

    // LLM validation contribution (if available)
    const llmConfidence = llmValidation?.confidence ?? 0.7; // Neutral score when no LLM validation

    // Weight different factors (adjusted to include LLM validation)
    const weights = llmValidation ? {
      consensus: 0.25,
      stability: 0.2,
      benchmark: 0.2,
      performance: 0.15,
      llm: 0.2
    } : {
      consensus: 0.3,
      stability: 0.25,
      benchmark: 0.25,
      performance: 0.2,
      llm: 0
    };

    const overall =
      consensusConfidence * weights.consensus +
      stabilityConfidence * weights.stability +
      benchmarkConfidence * weights.benchmark +
      performanceConsistency * weights.performance +
      llmConfidence * weights.llm;

    // Calculate per-channel confidence
    const perChannel: Record<Channel, number> = {} as Record<Channel, number>;

    for (const channel of this.channels) {
      const channelConsensus = Math.max(0, 1 - (consensus.variance[channel] * 5)); // Scale variance
      const channelStability = stabilityMetrics.channelStability[channel];
      const channelBenchmark = benchmarkAnalysis
        ? Math.max(0, 1 - (benchmarkAnalysis.channelDeviations[channel] * 2))
        : 0.7;

      perChannel[channel] =
        channelConsensus * weights.consensus +
        channelStability * weights.stability +
        channelBenchmark * weights.benchmark +
        performanceConsistency * weights.performance;
    }

    return {
      overall: Math.max(0, Math.min(1, overall)),
      perChannel,
      stability: stabilityConfidence
    };
  }

  /**
   * Generate confidence-based recommendations
   */
  generateConfidenceRecommendations(confidence: ConfidenceMetrics): string[] {
    const recommendations: string[] = [];

    if (confidence.overall < 0.5) {
      recommendations.push("Overall confidence is low. Consider reviewing input parameters or constraints.");
    }

    if (confidence.stability < 0.6) {
      recommendations.push("Results show low stability. Multiple optimization runs may yield different results.");
    }

    // Check for channels with particularly low confidence
    for (const channel of this.channels) {
      if (confidence.perChannel[channel] < 0.4) {
        recommendations.push(`${channel} allocation has low confidence. Consider reviewing channel-specific constraints or priors.`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push("Confidence metrics indicate reliable optimization results.");
    }

    return recommendations;
  }
}