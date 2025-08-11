/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Ensemble service for combining multiple optimization algorithm results
 * Provides consensus calculation and outlier detection capabilities
 */

import type { 
  Allocation, 
  Channel, 
  AlgorithmResult, 
  ConsensusMetrics,
  ValidationWarning
} from "@/types/shared";

export interface EnsembledResult {
  finalAllocation: Allocation;
  consensus: ConsensusMetrics;
  weightedPerformance: number;
  outliers: AlgorithmResult[];
  warnings: ValidationWarning[];
}

export interface OutlierAnalysis {
  outliers: AlgorithmResult[];
  outlierThreshold: number;
  deviationScores: Record<string, number>;
}

export class EnsembleService {
  private readonly channels: Channel[] = ["google", "meta", "tiktok", "linkedin"];
  private readonly outlierThreshold: number;

  constructor(outlierThreshold: number = 0.5) {
    this.outlierThreshold = outlierThreshold;
  }

  /**
   * Combine results from multiple optimization algorithms
   */
  combineResults(results: AlgorithmResult[]): EnsembledResult {
    if (results.length === 0) {
      throw new Error("Cannot combine empty results array");
    }

    if (results.length === 1) {
      return {
        finalAllocation: results[0].allocation,
        consensus: this.calculateConsensus([results[0].allocation]),
        weightedPerformance: results[0].performance,
        outliers: [],
        warnings: []
      };
    }

    // Detect outliers first
    const outlierAnalysis = this.detectOutliers(results);
    const validResults = results.filter(r => !outlierAnalysis.outliers.includes(r));
    
    // If all results are outliers, use all results with warning
    const resultsToUse = validResults.length > 0 ? validResults : results;
    const allocations = resultsToUse.map(r => r.allocation);
    
    // Calculate consensus metrics
    const consensus = this.calculateConsensus(allocations);
    
    // Weight results by confidence scores
    const finalAllocation = this.weightResults(resultsToUse, resultsToUse.map(r => r.confidence));
    
    // Calculate weighted performance
    const totalWeight = resultsToUse.reduce((sum, r) => sum + r.confidence, 0);
    const weightedPerformance = totalWeight > 0 
      ? resultsToUse.reduce((sum, r) => sum + (r.performance * r.confidence), 0) / totalWeight
      : resultsToUse.reduce((sum, r) => sum + r.performance, 0) / resultsToUse.length;

    // Generate warnings
    const warnings = this.generateWarnings(consensus, outlierAnalysis, validResults.length < results.length);

    return {
      finalAllocation,
      consensus,
      weightedPerformance,
      outliers: outlierAnalysis.outliers,
      warnings
    };
  }

  /**
   * Calculate consensus metrics for multiple allocations
   */
  calculateConsensus(allocations: Allocation[]): ConsensusMetrics {
    if (allocations.length === 0) {
      throw new Error("Cannot calculate consensus for empty allocations array");
    }

    if (allocations.length === 1) {
      return {
        agreement: 1.0,
        variance: this.channels.reduce((acc, ch) => ({ ...acc, [ch]: 0 }), {} as Record<Channel, number>),
        outlierCount: 0
      };
    }

    // Calculate variance for each channel
    const variance: Record<Channel, number> = {} as Record<Channel, number>;
    let totalVariance = 0;

    for (const channel of this.channels) {
      const values = allocations.map(a => a[channel]);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const channelVariance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      
      variance[channel] = channelVariance;
      totalVariance += channelVariance;
    }

    // Calculate agreement score (inverse of normalized variance)
    // Higher variance = lower agreement
    const maxPossibleVariance = 0.0625; // Maximum variance when one channel gets 100% and others get 0%
    const normalizedVariance = Math.min(totalVariance / this.channels.length, maxPossibleVariance);
    const agreement = 1 - (normalizedVariance / maxPossibleVariance);

    // Count outliers using pairwise distance method
    const outlierCount = this.countOutliersByDistance(allocations);

    return {
      agreement: Math.max(0, Math.min(1, agreement)),
      variance,
      outlierCount
    };
  }

  /**
   * Detect outlier results using statistical methods
   */
  detectOutliers(results: AlgorithmResult[]): OutlierAnalysis {
    if (results.length <= 2) {
      return {
        outliers: [],
        outlierThreshold: this.outlierThreshold,
        deviationScores: {}
      };
    }

    const allocations = results.map(r => r.allocation);
    const deviationScores: Record<string, number> = {};
    const outliers: AlgorithmResult[] = [];

    // Calculate deviation score for each result
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const allocation = allocations[i];
      
      // Calculate average distance to all other allocations
      let totalDistance = 0;
      let comparisons = 0;

      for (let j = 0; j < allocations.length; j++) {
        if (i !== j) {
          totalDistance += this.calculateAllocationDistance(allocation, allocations[j]);
          comparisons++;
        }
      }

      const avgDistance = comparisons > 0 ? totalDistance / comparisons : 0;
      deviationScores[result.name] = avgDistance;

      // Mark as outlier if deviation exceeds threshold
      if (avgDistance > this.outlierThreshold) {
        outliers.push(result);
      }
    }

    return {
      outliers,
      outlierThreshold: this.outlierThreshold,
      deviationScores
    };
  }

  /**
   * Weight results by confidence scores to create final allocation
   */
  weightResults(results: AlgorithmResult[], confidenceScores: number[]): Allocation {
    if (results.length !== confidenceScores.length) {
      throw new Error("Results and confidence scores arrays must have same length");
    }

    if (results.length === 0) {
      throw new Error("Cannot weight empty results array");
    }

    // Initialize weighted allocation
    const weightedAllocation: Allocation = {
      google: 0,
      meta: 0,
      tiktok: 0,
      linkedin: 0
    };

    // Calculate total weight
    const totalWeight = confidenceScores.reduce((sum, score) => sum + Math.max(0, score), 0);
    
    if (totalWeight === 0) {
      // If all confidence scores are 0, use equal weighting
      const equalWeight = 1 / results.length;
      for (let i = 0; i < results.length; i++) {
        for (const channel of this.channels) {
          weightedAllocation[channel] += results[i].allocation[channel] * equalWeight;
        }
      }
    } else {
      // Weight by confidence scores
      for (let i = 0; i < results.length; i++) {
        const weight = Math.max(0, confidenceScores[i]) / totalWeight;
        for (const channel of this.channels) {
          weightedAllocation[channel] += results[i].allocation[channel] * weight;
        }
      }
    }

    // Normalize to ensure sum equals 1
    return this.normalizeAllocation(weightedAllocation);
  }

  /**
   * Calculate Euclidean distance between two allocations
   */
  private calculateAllocationDistance(allocation1: Allocation, allocation2: Allocation): number {
    let sumSquaredDiff = 0;
    for (const channel of this.channels) {
      const diff = allocation1[channel] - allocation2[channel];
      sumSquaredDiff += diff * diff;
    }
    return Math.sqrt(sumSquaredDiff);
  }

  /**
   * Count outliers using pairwise distance method
   */
  private countOutliersByDistance(allocations: Allocation[]): number {
    if (allocations.length <= 2) return 0;

    const distances: number[] = [];
    
    // Calculate all pairwise distances
    for (let i = 0; i < allocations.length; i++) {
      let avgDistance = 0;
      let comparisons = 0;
      
      for (let j = 0; j < allocations.length; j++) {
        if (i !== j) {
          avgDistance += this.calculateAllocationDistance(allocations[i], allocations[j]);
          comparisons++;
        }
      }
      
      distances.push(comparisons > 0 ? avgDistance / comparisons : 0);
    }

    // Use statistical outlier detection (values beyond 1.5 * IQR)
    const sortedDistances = [...distances].sort((a, b) => a - b);
    const q1 = sortedDistances[Math.floor(sortedDistances.length * 0.25)];
    const q3 = sortedDistances[Math.floor(sortedDistances.length * 0.75)];
    const iqr = q3 - q1;
    const outlierThreshold = q3 + 1.5 * iqr;

    return distances.filter(d => d > outlierThreshold).length;
  }

  /**
   * Normalize allocation to sum to 1
   */
  private normalizeAllocation(allocation: Allocation): Allocation {
    const total = this.channels.reduce((sum, ch) => sum + Math.max(0, allocation[ch]), 0);
    
    if (total === 0) {
      // Return equal allocation if all values are 0
      return {
        google: 0.25,
        meta: 0.25,
        tiktok: 0.25,
        linkedin: 0.25
      };
    }
    
    const normalized: Allocation = {} as Allocation;
    for (const channel of this.channels) {
      normalized[channel] = Math.max(0, allocation[channel]) / total;
    }
    
    return normalized;
  }

  /**
   * Generate warnings based on consensus and outlier analysis
   */
  private generateWarnings(
    consensus: ConsensusMetrics, 
    outlierAnalysis: OutlierAnalysis,
    hasOutliers: boolean
  ): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Low agreement warning
    if (consensus.agreement < 0.5) {
      warnings.push({
        type: "low_consensus",
        message: `Low agreement between algorithms (${(consensus.agreement * 100).toFixed(1)}%). Results may be less reliable.`,
        severity: consensus.agreement < 0.3 ? "high" : "medium"
      });
    }

    // High variance warning for specific channels
    for (const channel of this.channels) {
      if (consensus.variance[channel] > 0.05) { // 5% variance threshold
        warnings.push({
          type: "high_channel_variance",
          message: `High variance in ${channel} allocation across algorithms. Consider reviewing channel constraints.`,
          severity: consensus.variance[channel] > 0.1 ? "high" : "medium",
          channel
        });
      }
    }

    // Outlier detection warning
    if (hasOutliers) {
      const outlierNames = outlierAnalysis.outliers.map(o => o.name).join(", ");
      warnings.push({
        type: "outlier_detected",
        message: `Outlier algorithms detected: ${outlierNames}. These results were excluded from final recommendation.`,
        severity: outlierAnalysis.outliers.length > 1 ? "high" : "medium"
      });
    }

    // High outlier count warning
    if (consensus.outlierCount > Math.floor(consensus.outlierCount * 0.3)) {
      warnings.push({
        type: "many_outliers",
        message: `${consensus.outlierCount} outlier allocations detected. Algorithm results show significant disagreement.`,
        severity: "high"
      });
    }

    return warnings;
  }
}