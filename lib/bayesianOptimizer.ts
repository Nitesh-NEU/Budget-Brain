/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Bayesian optimization algorithm for budget allocation
 * Uses Gaussian process modeling and acquisition functions for probabilistic optimization
 */

import type { Allocation, Assumptions, Channel, ChannelPriors, AlgorithmResult } from "@/types/shared";
import { deterministicConversions, respectsConstraints } from "./optimizer";

export interface BayesianOptimizerOptions {
  maxIterations?: number;
  acquisitionFunction?: 'ei' | 'ucb' | 'pi'; // Expected Improvement, Upper Confidence Bound, Probability of Improvement
  explorationWeight?: number;
  kernelLengthScale?: number;
  kernelVariance?: number;
  noiseVariance?: number;
}

export interface BayesianOptimizationResult {
  allocation: Allocation;
  performance: number;
  iterations: number;
  acquisitionValues: number[];
  posteriorMean: number;
  posteriorVariance: number;
}

interface GaussianProcessPoint {
  allocation: Allocation;
  performance: number;
}

export class BayesianOptimizer {
  private maxIterations: number;
  private acquisitionFunction: 'ei' | 'ucb' | 'pi';
  private explorationWeight: number;
  private kernelLengthScale: number;
  private kernelVariance: number;
  private noiseVariance: number;
  private observedPoints: GaussianProcessPoint[] = [];

  constructor(options: BayesianOptimizerOptions = {}) {
    this.maxIterations = options.maxIterations ?? 50;
    this.acquisitionFunction = options.acquisitionFunction ?? 'ei';
    this.explorationWeight = options.explorationWeight ?? 2.0;
    this.kernelLengthScale = options.kernelLengthScale ?? 0.1;
    this.kernelVariance = options.kernelVariance ?? 1.0;
    this.noiseVariance = options.noiseVariance ?? 0.01;
  }

  /**
   * Optimize budget allocation using Bayesian optimization
   */
  optimize(
    budget: number,
    priors: ChannelPriors,
    assumptions: Assumptions
  ): BayesianOptimizationResult {
    this.observedPoints = [];
    const acquisitionValues: number[] = [];

    // Initialize with a few random points
    const initialPoints = this.generateInitialPoints(assumptions, 5);
    for (const allocation of initialPoints) {
      // Ensure allocation is valid before evaluation
      if (!allocation || typeof allocation !== 'object') {
        console.warn('Invalid allocation generated, using fallback');
        const fallbackAllocation = this.getEqualAllocation(assumptions);
        const performance = this.evaluateObjective(budget, fallbackAllocation, priors, assumptions);
        this.observedPoints.push({ allocation: fallbackAllocation, performance });
      } else {
        const performance = this.evaluateObjective(budget, allocation, priors, assumptions);
        this.observedPoints.push({ allocation, performance });
      }
    }

    let bestPoint = this.getBestObservedPoint(assumptions.goal);
    
    // Bayesian optimization loop
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      // Find next point to evaluate using acquisition function
      const nextAllocation = this.findNextPoint(assumptions);
      
      // Ensure next allocation is valid
      if (!nextAllocation || typeof nextAllocation !== 'object') {
        console.warn('Invalid next allocation found, using best observed point');
        break;
      }
      
      const nextPerformance = this.evaluateObjective(budget, nextAllocation, priors, assumptions);
      
      // Add to observed points
      this.observedPoints.push({ 
        allocation: nextAllocation, 
        performance: nextPerformance 
      });

      // Update best point
      const currentBest = this.getBestObservedPoint(assumptions.goal);
      if (this.isBetter(currentBest.performance, bestPoint.performance, assumptions.goal)) {
        bestPoint = currentBest;
      }

      // Calculate acquisition value for tracking
      const { mean, variance } = this.gaussianProcessPredict(nextAllocation);
      const acquisitionValue = this.calculateAcquisition(mean, variance, assumptions.goal);
      acquisitionValues.push(acquisitionValue);
    }

    // Get final posterior statistics
    const { mean: posteriorMean, variance: posteriorVariance } = 
      this.gaussianProcessPredict(bestPoint.allocation);

    return {
      allocation: bestPoint.allocation,
      performance: bestPoint.performance,
      iterations: this.maxIterations,
      acquisitionValues,
      posteriorMean,
      posteriorVariance
    };
  }

  /**
   * Generate initial random points respecting constraints
   */
  private generateInitialPoints(assumptions: Assumptions, count: number): Allocation[] {
    const points: Allocation[] = [];
    const channels: Channel[] = ["google", "meta", "tiktok", "linkedin"];
    
    for (let i = 0; i < count; i++) {
      let allocation: Allocation;
      let attempts = 0;
      
      do {
        // Start with minimum constraints if they exist
        if (assumptions.minPct) {
          allocation = { google: 0, meta: 0, tiktok: 0, linkedin: 0 };
          let totalMin = 0;
          
          // Apply minimum constraints
          for (const channel of channels) {
            if (assumptions.minPct[channel]) {
              allocation[channel] = assumptions.minPct[channel]!;
              totalMin += assumptions.minPct[channel]!;
            }
          }
          
          // Distribute remaining randomly among all channels
          if (totalMin < 1) {
            const remaining = 1 - totalMin;
            const randomValues = channels.map(() => Math.random());
            const randomSum = randomValues.reduce((a, b) => a + b, 0);
            
            for (let j = 0; j < channels.length; j++) {
              allocation[channels[j]] += (randomValues[j] / randomSum) * remaining;
            }
          }
        } else {
          // Generate random allocation
          const values = channels.map(() => Math.random());
          const sum = values.reduce((a, b) => a + b, 0);
          
          allocation = {
            google: values[0] / sum,
            meta: values[1] / sum,
            tiktok: values[2] / sum,
            linkedin: values[3] / sum
          };
        }
        
        attempts++;
      } while (!respectsConstraints(allocation, assumptions.minPct, assumptions.maxPct) && attempts < 100);
      
      // If we can't find a valid random point, use equal allocation
      if (attempts >= 100 || !allocation) {
        allocation = this.getEqualAllocation(assumptions);
      }
      
      // Ensure allocation is valid
      allocation = this.normalizeAllocation(allocation);
      points.push(allocation);
    }
    
    return points;
  }

  /**
   * Get equal allocation respecting constraints
   */
  private getEqualAllocation(assumptions: Assumptions): Allocation {
    const channels: Channel[] = ["google", "meta", "tiktok", "linkedin"];
    let allocation: Allocation = { google: 0.25, meta: 0.25, tiktok: 0.25, linkedin: 0.25 };
    
    // Apply minimum constraints first
    if (assumptions.minPct) {
      let totalMin = 0;
      for (const channel of channels) {
        if (assumptions.minPct[channel]) {
          allocation[channel] = assumptions.minPct[channel]!;
          totalMin += assumptions.minPct[channel]!;
        }
      }
      
      // If minimum constraints exceed 1, normalize them proportionally
      if (totalMin > 1) {
        for (const channel of channels) {
          if (assumptions.minPct[channel]) {
            allocation[channel] = assumptions.minPct[channel]! / totalMin;
          } else {
            allocation[channel] = 0;
          }
        }
      } else if (totalMin < 1) {
        // Distribute remaining among unconstrained channels
        const remaining = 1 - totalMin;
        const unconstrainedChannels = channels.filter(ch => !assumptions.minPct?.[ch]);
        if (unconstrainedChannels.length > 0) {
          const perChannel = remaining / unconstrainedChannels.length;
          for (const channel of unconstrainedChannels) {
            allocation[channel] = perChannel;
          }
        }
      }
    }
    
    return this.normalizeAllocation(allocation);
  }

  /**
   * Find next point to evaluate using acquisition function
   */
  private findNextPoint(assumptions: Assumptions): Allocation {
    const candidates = this.generateCandidatePoints(assumptions, 100);
    let bestCandidate = candidates[0];
    let bestAcquisition = -Infinity;
    
    for (const candidate of candidates) {
      const { mean, variance } = this.gaussianProcessPredict(candidate);
      const acquisition = this.calculateAcquisition(mean, variance, assumptions.goal);
      
      if (acquisition > bestAcquisition) {
        bestAcquisition = acquisition;
        bestCandidate = candidate;
      }
    }
    
    return bestCandidate;
  }

  /**
   * Generate candidate points for acquisition optimization
   */
  private generateCandidatePoints(assumptions: Assumptions, count: number): Allocation[] {
    const candidates: Allocation[] = [];
    const channels: Channel[] = ["google", "meta", "tiktok", "linkedin"];
    
    // Add some random candidates
    for (let i = 0; i < count * 0.7; i++) {
      let allocation: Allocation;
      let attempts = 0;
      
      do {
        const values = channels.map(() => Math.random());
        const sum = values.reduce((a, b) => a + b, 0);
        
        allocation = {
          google: values[0] / sum,
          meta: values[1] / sum,
          tiktok: values[2] / sum,
          linkedin: values[3] / sum
        };
        
        attempts++;
      } while (!respectsConstraints(allocation, assumptions.minPct, assumptions.maxPct) && attempts < 50);
      
      if (attempts < 50) {
        candidates.push(allocation);
      }
    }
    
    // Add some candidates around best observed points
    const bestPoints = this.observedPoints
      .sort((a, b) => this.isBetter(a.performance, b.performance, assumptions.goal) ? -1 : 1)
      .slice(0, 3);
    
    for (const point of bestPoints) {
      for (let i = 0; i < count * 0.1; i++) {
        const perturbedAllocation = this.perturbAllocation(point.allocation, 0.05);
        if (respectsConstraints(perturbedAllocation, assumptions.minPct, assumptions.maxPct)) {
          candidates.push(perturbedAllocation);
        }
      }
    }
    
    return candidates.slice(0, count);
  }

  /**
   * Perturb allocation by adding small random noise
   */
  private perturbAllocation(allocation: Allocation, noise: number): Allocation {
    const channels: Channel[] = ["google", "meta", "tiktok", "linkedin"];
    const perturbed: Allocation = { ...allocation };
    
    for (const channel of channels) {
      perturbed[channel] += (Math.random() - 0.5) * 2 * noise;
      perturbed[channel] = Math.max(0, perturbed[channel]);
    }
    
    return this.normalizeAllocation(perturbed);
  }

  /**
   * Gaussian process prediction for a given allocation
   */
  private gaussianProcessPredict(allocation: Allocation): { mean: number; variance: number } {
    if (this.observedPoints.length === 0) {
      return { mean: 0, variance: this.kernelVariance };
    }

    // Calculate kernel matrix K
    const n = this.observedPoints.length;
    const K = this.buildKernelMatrix();
    
    // Calculate kernel vector k* between test point and observed points
    const kStar = this.observedPoints.map(point => 
      this.rbfKernel(allocation, point.allocation)
    );
    
    // Calculate mean: k*^T * (K + σ²I)^(-1) * y
    const y = this.observedPoints.map(p => p.performance);
    const KInv = this.invertMatrix(this.addNoiseToKernel(K));
    const KInvY = this.matrixVectorMultiply(KInv, y);
    const mean = this.vectorMatrixMultiply(kStar, KInvY);
    
    // Calculate variance: k** - k*^T * (K + σ²I)^(-1) * k*
    const kStarStar = this.rbfKernel(allocation, allocation);
    const KInvKStar = this.matrixVectorMultiply(KInv, kStar);
    const variance = kStarStar - this.vectorMatrixMultiply(kStar, KInvKStar);
    
    return { mean, variance: Math.max(0, variance) };
  }

  /**
   * Build kernel matrix for observed points
   */
  private buildKernelMatrix(): number[][] {
    const n = this.observedPoints.length;
    const K: number[][] = [];
    
    for (let i = 0; i < n; i++) {
      K[i] = [];
      for (let j = 0; j < n; j++) {
        K[i][j] = this.rbfKernel(this.observedPoints[i].allocation, this.observedPoints[j].allocation);
      }
    }
    
    return K;
  }

  /**
   * RBF (Radial Basis Function) kernel
   */
  private rbfKernel(x1: Allocation, x2: Allocation): number {
    const channels: Channel[] = ["google", "meta", "tiktok", "linkedin"];
    let squaredDistance = 0;
    
    for (const channel of channels) {
      const diff = x1[channel] - x2[channel];
      squaredDistance += diff * diff;
    }
    
    return this.kernelVariance * Math.exp(-squaredDistance / (2 * this.kernelLengthScale * this.kernelLengthScale));
  }

  /**
   * Add noise to kernel matrix diagonal
   */
  private addNoiseToKernel(K: number[][]): number[][] {
    const n = K.length;
    const KNoisy: number[][] = [];
    
    for (let i = 0; i < n; i++) {
      KNoisy[i] = [...K[i]];
      KNoisy[i][i] += this.noiseVariance;
    }
    
    return KNoisy;
  }

  /**
   * Simple matrix inversion using Gaussian elimination (for small matrices)
   */
  private invertMatrix(matrix: number[][]): number[][] {
    const n = matrix.length;
    const augmented: number[][] = [];
    
    // Create augmented matrix [A|I]
    for (let i = 0; i < n; i++) {
      augmented[i] = [...matrix[i]];
      for (let j = 0; j < n; j++) {
        augmented[i][n + j] = i === j ? 1 : 0;
      }
    }
    
    // Gaussian elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      
      // Swap rows
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      // Make diagonal element 1
      const pivot = augmented[i][i];
      if (Math.abs(pivot) < 1e-10) {
        // Add small regularization to diagonal
        augmented[i][i] += 1e-6;
      }
      
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= augmented[i][i];
      }
      
      // Eliminate column
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }
    
    // Extract inverse matrix
    const inverse: number[][] = [];
    for (let i = 0; i < n; i++) {
      inverse[i] = augmented[i].slice(n);
    }
    
    return inverse;
  }

  /**
   * Matrix-vector multiplication
   */
  private matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
    const result: number[] = [];
    for (let i = 0; i < matrix.length; i++) {
      result[i] = 0;
      for (let j = 0; j < vector.length; j++) {
        result[i] += matrix[i][j] * vector[j];
      }
    }
    return result;
  }

  /**
   * Vector-matrix multiplication (vector as row)
   */
  private vectorMatrixMultiply(vector: number[], matrix: number[]): number {
    let result = 0;
    for (let i = 0; i < vector.length; i++) {
      result += vector[i] * matrix[i];
    }
    return result;
  }

  /**
   * Calculate acquisition function value
   */
  private calculateAcquisition(mean: number, variance: number, goal: string): number {
    const std = Math.sqrt(variance);
    const bestObserved = this.getBestObservedPerformance(goal);
    
    switch (this.acquisitionFunction) {
      case 'ei': // Expected Improvement
        return this.expectedImprovement(mean, std, bestObserved, goal);
      case 'ucb': // Upper Confidence Bound
        return this.upperConfidenceBound(mean, std, goal);
      case 'pi': // Probability of Improvement
        return this.probabilityOfImprovement(mean, std, bestObserved, goal);
      default:
        return this.expectedImprovement(mean, std, bestObserved, goal);
    }
  }

  /**
   * Expected Improvement acquisition function
   */
  private expectedImprovement(mean: number, std: number, bestObserved: number, goal: string): number {
    if (std === 0) return 0;
    
    const improvement = goal === "cac" ? bestObserved - mean : mean - bestObserved;
    const z = improvement / std;
    
    return improvement * this.normalCDF(z) + std * this.normalPDF(z);
  }

  /**
   * Upper Confidence Bound acquisition function
   */
  private upperConfidenceBound(mean: number, std: number, goal: string): number {
    const sign = goal === "cac" ? -1 : 1;
    return sign * mean + this.explorationWeight * std;
  }

  /**
   * Probability of Improvement acquisition function
   */
  private probabilityOfImprovement(mean: number, std: number, bestObserved: number, goal: string): number {
    if (std === 0) return 0;
    
    const improvement = goal === "cac" ? bestObserved - mean : mean - bestObserved;
    const z = improvement / std;
    
    return this.normalCDF(z);
  }

  /**
   * Normal cumulative distribution function approximation
   */
  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Normal probability density function
   */
  private normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Get best observed point
   */
  private getBestObservedPoint(goal: string): GaussianProcessPoint {
    return this.observedPoints.reduce((best, current) => 
      this.isBetter(current.performance, best.performance, goal) ? current : best
    );
  }

  /**
   * Get best observed performance value
   */
  private getBestObservedPerformance(goal: string): number {
    return this.getBestObservedPoint(goal).performance;
  }

  /**
   * Check if one performance is better than another
   */
  private isBetter(performance1: number, performance2: number, goal: string): boolean {
    return goal === "cac" ? performance1 < performance2 : performance1 > performance2;
  }

  /**
   * Normalize allocation to sum to 1
   */
  private normalizeAllocation(allocation: Allocation): Allocation {
    const channels: Channel[] = ["google", "meta", "tiktok", "linkedin"];
    const total = channels.reduce((sum, ch) => sum + Math.max(0, allocation[ch]), 0);
    
    if (total === 0) {
      return { google: 0.25, meta: 0.25, tiktok: 0.25, linkedin: 0.25 };
    }
    
    const normalized: Allocation = { google: 0, meta: 0, tiktok: 0, linkedin: 0 };
    for (const channel of channels) {
      normalized[channel] = Math.max(0, allocation[channel]) / total;
    }
    
    return normalized;
  }

  /**
   * Evaluate objective function for given allocation
   */
  private evaluateObjective(
    budget: number,
    allocation: Allocation,
    priors: ChannelPriors,
    assumptions: Assumptions
  ): number {
    // Ensure allocation is valid
    if (!allocation || typeof allocation !== 'object') {
      throw new Error('Invalid allocation provided to evaluateObjective');
    }
    
    // Ensure all channels have valid values
    const channels: Channel[] = ["google", "meta", "tiktok", "linkedin"];
    for (const channel of channels) {
      if (typeof allocation[channel] !== 'number' || isNaN(allocation[channel])) {
        throw new Error(`Invalid allocation value for channel ${channel}: ${allocation[channel]}`);
      }
    }
    
    const conversions = deterministicConversions(budget, allocation, priors);
    
    switch (assumptions.goal) {
      case "demos":
        return conversions;
      case "revenue":
        const dealSize = assumptions.avgDealSize ?? 1000;
        return conversions * dealSize;
      case "cac":
        return budget / Math.max(conversions, 1e-9);
      default:
        return conversions;
    }
  }

  /**
   * Convert optimization result to AlgorithmResult format
   */
  toAlgorithmResult(result: BayesianOptimizationResult): AlgorithmResult {
    // Calculate confidence based on posterior variance and acquisition values
    let confidence = 0.6; // Base confidence for Bayesian methods
    
    // Lower posterior variance indicates higher confidence
    const normalizedVariance = Math.min(1, result.posteriorVariance / this.kernelVariance);
    confidence += 0.2 * (1 - normalizedVariance);
    
    // Higher acquisition values in later iterations indicate good exploration
    if (result.acquisitionValues.length > 0) {
      const avgAcquisition = result.acquisitionValues.reduce((a, b) => a + b, 0) / result.acquisitionValues.length;
      confidence += 0.2 * Math.min(1, avgAcquisition / 10); // Normalize acquisition contribution
    }
    
    confidence = Math.min(1.0, confidence);
    
    return {
      name: "Bayesian Optimization",
      allocation: result.allocation,
      confidence,
      performance: result.performance
    };
  }
}