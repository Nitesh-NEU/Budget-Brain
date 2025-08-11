/**
 * Unit tests for GradientOptimizer
 */

import { GradientOptimizer } from "../gradientOptimizer";
import type { ChannelPriors, Assumptions } from "../../types/shared";

describe("GradientOptimizer", () => {
  const mockPriors: ChannelPriors = {
    google: { cpm: [10, 20], ctr: [0.02, 0.05], cvr: [0.01, 0.03] },
    meta: { cpm: [8, 15], ctr: [0.015, 0.04], cvr: [0.008, 0.025] },
    tiktok: { cpm: [5, 12], ctr: [0.01, 0.03], cvr: [0.005, 0.02] },
    linkedin: { cpm: [15, 30], ctr: [0.005, 0.02], cvr: [0.01, 0.04] }
  };

  const mockAssumptions: Assumptions = {
    goal: "demos"
  };

  let optimizer: GradientOptimizer;

  beforeEach(() => {
    optimizer = new GradientOptimizer();
  });

  describe("constructor", () => {
    it("should initialize with default options", () => {
      const opt = new GradientOptimizer();
      expect(opt).toBeInstanceOf(GradientOptimizer);
    });

    it("should accept custom options", () => {
      const opt = new GradientOptimizer({
        learningRate: 0.05,
        maxIterations: 500,
        tolerance: 1e-5,
        stepSize: 1e-3
      });
      expect(opt).toBeInstanceOf(GradientOptimizer);
    });
  });

  describe("optimize", () => {
    it("should return a valid optimization result", () => {
      const budget = 10000;
      const result = optimizer.optimize(budget, mockPriors, mockAssumptions);

      expect(result).toHaveProperty("allocation");
      expect(result).toHaveProperty("performance");
      expect(result).toHaveProperty("iterations");
      expect(result).toHaveProperty("converged");
      expect(result).toHaveProperty("gradientNorm");

      // Check allocation sums to 1
      const total = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(total).toBeCloseTo(1, 5);

      // Check all allocations are non-negative
      Object.values(result.allocation).forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
      });

      expect(result.performance).toBeGreaterThan(0);
      expect(result.iterations).toBeGreaterThanOrEqual(0);
    });

    it("should respect minimum percentage constraints", () => {
      const constrainedAssumptions: Assumptions = {
        goal: "demos",
        minPct: { google: 0.3, meta: 0.2 }
      };

      const result = optimizer.optimize(10000, mockPriors, constrainedAssumptions);

      expect(result.allocation.google).toBeGreaterThanOrEqual(0.3);
      expect(result.allocation.meta).toBeGreaterThanOrEqual(0.2);
    });

    it("should respect maximum percentage constraints", () => {
      const constrainedAssumptions: Assumptions = {
        goal: "demos",
        maxPct: { google: 0.4, meta: 0.3 }
      };

      const result = optimizer.optimize(10000, mockPriors, constrainedAssumptions);

      expect(result.allocation.google).toBeLessThanOrEqual(0.4);
      expect(result.allocation.meta).toBeLessThanOrEqual(0.3);
    });

    it("should handle revenue goal with average deal size", () => {
      const revenueAssumptions: Assumptions = {
        goal: "revenue",
        avgDealSize: 2000
      };

      const result = optimizer.optimize(10000, mockPriors, revenueAssumptions);

      expect(result.performance).toBeGreaterThan(0);
      // Revenue should be higher than conversions due to deal size multiplier
      expect(result.performance).toBeGreaterThan(100);
    });

    it("should handle CAC goal (minimization)", () => {
      const cacAssumptions: Assumptions = {
        goal: "cac"
      };

      const result = optimizer.optimize(10000, mockPriors, cacAssumptions);

      expect(result.performance).toBeGreaterThan(0);
      // CAC should be reasonable (budget/conversions)
      expect(result.performance).toBeLessThan(10000);
    });
  });

  describe("compareWithMonteCarlo", () => {
    it("should compare gradient results with Monte Carlo results", () => {
      const gradientResult = optimizer.optimize(10000, mockPriors, mockAssumptions);
      const monteCarloResult = { p10: 80, p50: 100, p90: 120 };

      const comparison = optimizer.compareWithMonteCarlo(
        gradientResult,
        monteCarloResult,
        "demos"
      );

      expect(comparison).toHaveProperty("performanceDifference");
      expect(comparison).toHaveProperty("relativePerformance");
      expect(comparison).toHaveProperty("isCompetitive");

      expect(comparison.performanceDifference).toBeGreaterThanOrEqual(0);
      expect(comparison.relativePerformance).toBeGreaterThan(0);
      expect(typeof comparison.isCompetitive).toBe("boolean");
    });
  });

  describe("toAlgorithmResult", () => {
    it("should convert optimization result to AlgorithmResult format", () => {
      const gradientResult = optimizer.optimize(10000, mockPriors, mockAssumptions);
      const algorithmResult = optimizer.toAlgorithmResult(gradientResult);

      expect(algorithmResult).toHaveProperty("name", "Gradient Descent");
      expect(algorithmResult).toHaveProperty("allocation");
      expect(algorithmResult).toHaveProperty("confidence");
      expect(algorithmResult).toHaveProperty("performance");

      expect(algorithmResult.confidence).toBeGreaterThan(0);
      expect(algorithmResult.confidence).toBeLessThanOrEqual(1);
      expect(algorithmResult.performance).toBe(gradientResult.performance);
    });

    it("should include Monte Carlo comparison in confidence calculation", () => {
      const gradientResult = optimizer.optimize(10000, mockPriors, mockAssumptions);
      const monteCarloComparison = {
        performanceDifference: 5,
        relativePerformance: 0.95,
        isCompetitive: true
      };

      const algorithmResult = optimizer.toAlgorithmResult(gradientResult, monteCarloComparison);

      expect(algorithmResult.confidence).toBeGreaterThan(0.5);
    });
  });

  describe("edge cases", () => {
    it("should handle zero budget gracefully", () => {
      const result = optimizer.optimize(0, mockPriors, mockAssumptions);
      expect(result.performance).toBe(0);
    });

    it("should handle very small budgets", () => {
      const result = optimizer.optimize(1, mockPriors, mockAssumptions);
      expect(result.performance).toBeGreaterThanOrEqual(0);
    });

    it("should handle conflicting constraints gracefully", () => {
      const conflictingAssumptions: Assumptions = {
        goal: "demos",
        minPct: { google: 0.6, meta: 0.6 } // Sum > 1, impossible
      };

      const result = optimizer.optimize(10000, mockPriors, conflictingAssumptions);
      
      // Should still return a valid result, even if constraints can't be perfectly satisfied
      const total = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(total).toBeCloseTo(1, 5);
    });
  });
});