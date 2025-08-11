/**
 * Integration tests for EnsembleService with other optimization algorithms
 * Tests the complete workflow of combining multiple algorithm results
 */

import { EnsembleService } from "../ensembleService";
import { GradientOptimizer } from "../gradientOptimizer";
import { optimize } from "../optimizer";
import type { ChannelPriors, Assumptions, AlgorithmResult } from "@/types/shared";

describe("EnsembleService Integration", () => {
  let ensembleService: EnsembleService;
  let gradientOptimizer: GradientOptimizer;

  const testPriors: ChannelPriors = {
    google: { cpm: [8, 12], ctr: [0.02, 0.04], cvr: [0.08, 0.12] },
    meta: { cpm: [6, 10], ctr: [0.015, 0.035], cvr: [0.06, 0.10] },
    tiktok: { cpm: [4, 8], ctr: [0.01, 0.03], cvr: [0.04, 0.08] },
    linkedin: { cpm: [15, 25], ctr: [0.005, 0.015], cvr: [0.10, 0.15] }
  };

  const testAssumptions: Assumptions = {
    goal: "demos",
    minPct: { google: 0.1 },
    maxPct: { linkedin: 0.3 }
  };

  beforeEach(() => {
    ensembleService = new EnsembleService();
    gradientOptimizer = new GradientOptimizer();
  });

  it("should combine Monte Carlo and Gradient optimization results", () => {
    const budget = 10000;

    // Get Monte Carlo result
    const mcResult = optimize(budget, testPriors, testAssumptions, 100);
    const mcAlgorithmResult: AlgorithmResult = {
      name: "Monte Carlo",
      allocation: mcResult.best.split,
      confidence: 0.8,
      performance: mcResult.best.mc.p50
    };

    // Get Gradient optimization result
    const gradientResult = gradientOptimizer.optimize(budget, testPriors, testAssumptions);
    const gradientAlgorithmResult = gradientOptimizer.toAlgorithmResult(gradientResult);

    // Combine results using ensemble service
    const ensembleResult = ensembleService.combineResults([
      mcAlgorithmResult,
      gradientAlgorithmResult
    ]);

    // Verify ensemble result
    expect(ensembleResult.finalAllocation).toBeDefined();
    expect(ensembleResult.consensus.agreement).toBeGreaterThan(0);
    expect(ensembleResult.weightedPerformance).toBeGreaterThan(0);

    // Verify allocation constraints are respected
    expect(ensembleResult.finalAllocation.google).toBeGreaterThanOrEqual(0.1);
    expect(ensembleResult.finalAllocation.linkedin).toBeLessThanOrEqual(0.3);

    // Verify allocation sums to 1
    const sum = Object.values(ensembleResult.finalAllocation).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 6);
  });

  it("should handle multiple similar algorithms with high consensus", () => {
    const budget = 5000;

    // Create multiple similar algorithm results
    const results: AlgorithmResult[] = [
      {
        name: "Algorithm A",
        allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
        confidence: 0.85,
        performance: 120
      },
      {
        name: "Algorithm B", 
        allocation: { google: 0.42, meta: 0.28, tiktok: 0.2, linkedin: 0.1 },
        confidence: 0.9,
        performance: 125
      },
      {
        name: "Algorithm C",
        allocation: { google: 0.38, meta: 0.32, tiktok: 0.2, linkedin: 0.1 },
        confidence: 0.8,
        performance: 118
      }
    ];

    const ensembleResult = ensembleService.combineResults(results);

    // Should have high consensus
    expect(ensembleResult.consensus.agreement).toBeGreaterThan(0.8);
    expect(ensembleResult.outliers).toHaveLength(0);
    
    // Should have minimal warnings
    expect(ensembleResult.warnings.filter(w => w.severity === "high")).toHaveLength(0);

    // Final allocation should be close to the average
    expect(ensembleResult.finalAllocation.google).toBeCloseTo(0.4, 1);
    expect(ensembleResult.finalAllocation.meta).toBeCloseTo(0.3, 1);
  });

  it("should detect and handle conflicting algorithm results", () => {
    const results: AlgorithmResult[] = [
      {
        name: "Google-focused",
        allocation: { google: 0.7, meta: 0.1, tiktok: 0.1, linkedin: 0.1 },
        confidence: 0.8,
        performance: 100
      },
      {
        name: "Meta-focused",
        allocation: { google: 0.1, meta: 0.7, tiktok: 0.1, linkedin: 0.1 },
        confidence: 0.8,
        performance: 105
      },
      {
        name: "Balanced",
        allocation: { google: 0.25, meta: 0.25, tiktok: 0.25, linkedin: 0.25 },
        confidence: 0.9,
        performance: 95
      }
    ];

    const ensembleResult = ensembleService.combineResults(results);

    // Should have low consensus due to conflicting results
    expect(ensembleResult.consensus.agreement).toBeLessThan(0.6);
    
    // Should generate warnings about low consensus
    expect(ensembleResult.warnings.some(w => w.type === "low_consensus")).toBe(true);
    expect(ensembleResult.warnings.some(w => w.type === "high_channel_variance")).toBe(true);

    // Final allocation should be weighted average
    expect(ensembleResult.finalAllocation.google).toBeGreaterThan(0.2);
    expect(ensembleResult.finalAllocation.meta).toBeGreaterThan(0.2);
  });

  it("should work with real optimization scenarios", () => {
    const budget = 15000;
    const revenueAssumptions: Assumptions = {
      goal: "revenue",
      avgDealSize: 2000,
      minPct: { google: 0.2, meta: 0.1 }
    };

    // Get results from multiple algorithms
    const mcResult = optimize(budget, testPriors, revenueAssumptions, 50);
    const gradientResult = gradientOptimizer.optimize(budget, testPriors, revenueAssumptions);

    const algorithmResults: AlgorithmResult[] = [
      {
        name: "Monte Carlo",
        allocation: mcResult.best.split,
        confidence: 0.85,
        performance: mcResult.best.mc.p50
      },
      gradientOptimizer.toAlgorithmResult(gradientResult)
    ];

    const ensembleResult = ensembleService.combineResults(algorithmResults);

    // Verify the result makes sense
    expect(ensembleResult.finalAllocation).toBeDefined();
    expect(ensembleResult.weightedPerformance).toBeGreaterThan(0);
    
    // Verify constraints are respected
    expect(ensembleResult.finalAllocation.google).toBeGreaterThanOrEqual(0.2);
    expect(ensembleResult.finalAllocation.meta).toBeGreaterThanOrEqual(0.1);

    // Should provide useful metadata
    expect(ensembleResult.consensus).toBeDefined();
    expect(ensembleResult.consensus.agreement).toBeGreaterThan(0);
    expect(ensembleResult.consensus.variance).toBeDefined();
  });

  it("should handle edge case with single algorithm", () => {
    const singleResult: AlgorithmResult = {
      name: "Only Algorithm",
      allocation: { google: 0.5, meta: 0.3, tiktok: 0.1, linkedin: 0.1 },
      confidence: 0.9,
      performance: 150
    };

    const ensembleResult = ensembleService.combineResults([singleResult]);

    expect(ensembleResult.finalAllocation).toEqual(singleResult.allocation);
    expect(ensembleResult.consensus.agreement).toBe(1.0);
    expect(ensembleResult.outliers).toHaveLength(0);
    expect(ensembleResult.warnings).toHaveLength(0);
  });
});