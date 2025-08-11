/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Gradient-based optimization algorithm for budget allocation
 * Uses deterministic gradient descent to find optimal channel allocation
 */

import type { Allocation, Assumptions, Channel, ChannelPriors, AlgorithmResult } from "@/types/shared";
import { deterministicConversions, respectsConstraints } from "./optimizer";

export interface GradientOptimizerOptions {
  learningRate?: number;
  maxIterations?: number;
  tolerance?: number;
  stepSize?: number;
}

export interface GradientOptimizationResult {
  allocation: Allocation;
  performance: number;
  iterations: number;
  converged: boolean;
  gradientNorm: number;
}

export class GradientOptimizer {
  private learningRate: number;
  private maxIterations: number;
  private tolerance: number;
  private stepSize: number;

  constructor(options: GradientOptimizerOptions = {}) {
    this.learningRate = options.learningRate ?? 0.01;
    this.maxIterations = options.maxIterations ?? 1000;
    this.tolerance = options.tolerance ?? 1e-6;
    this.stepSize = options.stepSize ?? 1e-4;
  }

  /**
   * Optimize budget allocation using gradient descent
   */
  optimize(
    budget: number,
    priors: ChannelPriors,
    assumptions: Assumptions
  ): GradientOptimizationResult {
    // Start with equal allocation as initial guess
    let allocation = this.getInitialAllocation(assumptions);
    
    let bestAllocation = { ...allocation };
    let bestPerformance = this.evaluateObjective(budget, allocation, priors, assumptions);
    
    let iteration = 0;
    let converged = false;
    let gradientNorm = 0;

    for (iteration = 0; iteration < this.maxIterations; iteration++) {
      // Calculate gradient
      const gradient = this.calculateGradient(budget, allocation, priors, assumptions);
      gradientNorm = this.calculateGradientNorm(gradient);
      
      // Check convergence
      if (gradientNorm < this.tolerance) {
        converged = true;
        break;
      }

      // Update allocation using gradient descent
      const newAllocation = this.updateAllocation(allocation, gradient, assumptions);
      const newPerformance = this.evaluateObjective(budget, newAllocation, priors, assumptions);
      
      // Accept improvement or use line search
      if (this.shouldAcceptUpdate(newPerformance, bestPerformance, assumptions.goal)) {
        allocation = newAllocation;
        bestAllocation = { ...allocation };
        bestPerformance = newPerformance;
      } else {
        // Reduce learning rate if no improvement
        this.learningRate *= 0.9;
        if (this.learningRate < 1e-8) break;
      }
    }

    return {
      allocation: bestAllocation,
      performance: bestPerformance,
      iterations: iteration,
      converged,
      gradientNorm
    };
  }

  /**
   * Get initial allocation respecting constraints
   */
  private getInitialAllocation(assumptions: Assumptions): Allocation {
    const channels: Channel[] = ["google", "meta", "tiktok", "linkedin"];
    const allocation: Allocation = { google: 0.25, meta: 0.25, tiktok: 0.25, linkedin: 0.25 };
    
    // Adjust for minimum constraints
    if (assumptions.minPct) {
      let totalMin = 0;
      for (const channel of channels) {
        if (assumptions.minPct[channel]) {
          allocation[channel] = assumptions.minPct[channel]!;
          totalMin += assumptions.minPct[channel]!;
        }
      }
      
      // Distribute remaining budget among unconstrained channels
      if (totalMin < 1) {
        const remaining = 1 - totalMin;
        const unconstrainedChannels = channels.filter(ch => !assumptions.minPct?.[ch]);
        const perChannel = remaining / unconstrainedChannels.length;
        
        for (const channel of unconstrainedChannels) {
          allocation[channel] = perChannel;
        }
      }
    }

    return this.normalizeAllocation(allocation);
  }

  /**
   * Calculate gradient using finite differences
   */
  private calculateGradient(
    budget: number,
    allocation: Allocation,
    priors: ChannelPriors,
    assumptions: Assumptions
  ): Allocation {
    const channels: Channel[] = ["google", "meta", "tiktok", "linkedin"];
    const gradient: Allocation = { google: 0, meta: 0, tiktok: 0, linkedin: 0 };
    
    const basePerformance = this.evaluateObjective(budget, allocation, priors, assumptions);
    
    for (const channel of channels) {
      // Forward difference
      const perturbedAllocation = { ...allocation };
      perturbedAllocation[channel] += this.stepSize;
      
      // Normalize to maintain sum = 1
      const normalizedPerturbed = this.normalizeAllocation(perturbedAllocation);
      
      if (respectsConstraints(normalizedPerturbed, assumptions.minPct, assumptions.maxPct)) {
        const perturbedPerformance = this.evaluateObjective(budget, normalizedPerturbed, priors, assumptions);
        gradient[channel] = (perturbedPerformance - basePerformance) / this.stepSize;
      } else {
        gradient[channel] = 0; // Can't move in this direction due to constraints
      }
    }

    return gradient;
  }

  /**
   * Update allocation using gradient information
   */
  private updateAllocation(
    allocation: Allocation,
    gradient: Allocation,
    assumptions: Assumptions
  ): Allocation {
    const channels: Channel[] = ["google", "meta", "tiktok", "linkedin"];
    let newAllocation: Allocation = { ...allocation };
    
    // For maximization problems, move in gradient direction
    // For minimization problems (CAC), move opposite to gradient
    const direction = assumptions.goal === "cac" ? -1 : 1;
    
    // Apply gradient update with constraint checking
    for (const channel of channels) {
      const proposedValue = newAllocation[channel] + direction * this.learningRate * gradient[channel];
      
      // Respect max constraints during update
      if (assumptions.maxPct?.[channel]) {
        newAllocation[channel] = Math.min(proposedValue, assumptions.maxPct[channel]!);
      } else {
        newAllocation[channel] = proposedValue;
      }
      
      // Respect min constraints during update
      if (assumptions.minPct?.[channel]) {
        newAllocation[channel] = Math.max(newAllocation[channel], assumptions.minPct[channel]!);
      }
    }
    
    // Normalize and apply constraints again
    newAllocation = this.normalizeAllocation(newAllocation);
    return this.applyConstraints(newAllocation, assumptions);
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
   * Apply min/max constraints to allocation
   */
  private applyConstraints(allocation: Allocation, assumptions: Assumptions): Allocation {
    const channels: Channel[] = ["google", "meta", "tiktok", "linkedin"];
    let constrained: Allocation = { ...allocation };
    
    // Apply min/max constraints iteratively
    let changed = true;
    let iterations = 0;
    const maxIterations = 10;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      // Apply constraints
      for (const channel of channels) {
        const oldValue = constrained[channel];
        
        if (assumptions.minPct?.[channel]) {
          constrained[channel] = Math.max(constrained[channel], assumptions.minPct[channel]!);
        }
        if (assumptions.maxPct?.[channel]) {
          constrained[channel] = Math.min(constrained[channel], assumptions.maxPct[channel]!);
        }
        
        if (Math.abs(constrained[channel] - oldValue) > 1e-10) {
          changed = true;
        }
      }
      
      // Normalize after applying constraints
      constrained = this.normalizeAllocation(constrained);
      
      // Check if normalization violated max constraints and adjust
      for (const channel of channels) {
        if (assumptions.maxPct?.[channel] && constrained[channel] > assumptions.maxPct[channel]!) {
          const excess = constrained[channel] - assumptions.maxPct[channel]!;
          constrained[channel] = assumptions.maxPct[channel]!;
          
          // Redistribute excess to other channels that can accept it
          const availableChannels = channels.filter(ch => 
            ch !== channel && 
            (!assumptions.maxPct?.[ch] || constrained[ch] < assumptions.maxPct[ch]!)
          );
          
          if (availableChannels.length > 0) {
            const redistributeAmount = excess / availableChannels.length;
            for (const availableChannel of availableChannels) {
              const maxAllowed = assumptions.maxPct?.[availableChannel] ?? 1;
              const canAdd = Math.min(redistributeAmount, maxAllowed - constrained[availableChannel]);
              constrained[availableChannel] += canAdd;
            }
          }
          
          changed = true;
        }
      }
    }
    
    return this.normalizeAllocation(constrained);
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
   * Calculate L2 norm of gradient
   */
  private calculateGradientNorm(gradient: Allocation): number {
    const channels: Channel[] = ["google", "meta", "tiktok", "linkedin"];
    return Math.sqrt(channels.reduce((sum, ch) => sum + gradient[ch] * gradient[ch], 0));
  }

  /**
   * Determine if update should be accepted
   */
  private shouldAcceptUpdate(newPerformance: number, bestPerformance: number, goal: string): boolean {
    if (goal === "cac") {
      return newPerformance < bestPerformance; // Lower CAC is better
    } else {
      return newPerformance > bestPerformance; // Higher conversions/revenue is better
    }
  }

  /**
   * Compare performance against Monte Carlo results
   */
  compareWithMonteCarlo(
    gradientResult: GradientOptimizationResult,
    monteCarloResult: { p10: number; p50: number; p90: number },
    goal: string
  ): {
    performanceDifference: number;
    relativePerformance: number;
    isCompetitive: boolean;
  } {
    const mcPerformance = monteCarloResult.p50;
    const gradientPerformance = gradientResult.performance;
    
    const performanceDifference = Math.abs(gradientPerformance - mcPerformance);
    const relativePerformance = gradientPerformance / mcPerformance;
    
    // Consider competitive if within 5% of Monte Carlo median
    const isCompetitive = performanceDifference / Math.abs(mcPerformance) < 0.05;
    
    return {
      performanceDifference,
      relativePerformance,
      isCompetitive
    };
  }

  /**
   * Convert optimization result to AlgorithmResult format
   */
  toAlgorithmResult(
    result: GradientOptimizationResult,
    monteCarloComparison?: {
      performanceDifference: number;
      relativePerformance: number;
      isCompetitive: boolean;
    }
  ): AlgorithmResult {
    // Calculate confidence based on convergence and performance
    let confidence = 0.5; // Base confidence
    
    if (result.converged) confidence += 0.3;
    if (result.gradientNorm < 1e-4) confidence += 0.1;
    if (monteCarloComparison?.isCompetitive) confidence += 0.1;
    
    confidence = Math.min(1.0, confidence);
    
    return {
      name: "Gradient Descent",
      allocation: result.allocation,
      confidence,
      performance: result.performance
    };
  }
}