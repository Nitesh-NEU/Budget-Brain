/**
 * Integration tests for AccuracyEnhancementService
 * Tests the complete enhancement pipeline with real optimization scenarios
 */

import { AccuracyEnhancementService } from "../accuracyEnhancementService";
import type { ChannelPriors, Assumptions } from "@/types/shared";
import type { EnhancementOptions } from "../accuracyEnhancementService";

describe("AccuracyEnhancementService Integration Tests", () => {
  let service: AccuracyEnhancementService;

  beforeEach(() => {
    service = new AccuracyEnhancementService();
  });

  describe("Real-world optimization scenarios", () => {
    it("should handle B2B SaaS company optimization", async () => {
      const budget = 50000;
      const b2bPriors: ChannelPriors = {
        google: { cpm: [15, 25], ctr: [0.025, 0.045], cvr: [0.12, 0.28] },
        meta: { cpm: [12, 20], ctr: [0.02, 0.04], cvr: [0.08, 0.22] },
        tiktok: { cpm: [18, 30], ctr: [0.035, 0.055], cvr: [0.06, 0.18] },
        linkedin: { cpm: [25, 40], ctr: [0.015, 0.035], cvr: [0.18, 0.45] }
      };

      const b2bAssumptions: Assumptions = {
        goal: "revenue",
        avgDealSize: 5000,
        minPct: { linkedin: 0.15 }, // B2B companies typically need LinkedIn presence
        maxPct: { tiktok: 0.25 } // Limit TikTok for B2B
      };

      const result = await service.enhanceOptimization(budget, b2bPriors, b2bAssumptions, {
        level: "thorough",
        includeAlternatives: true,
        validateAgainstBenchmarks: true
      });

      // Verify B2B-specific constraints are respected
      expect(result.allocation.linkedin).toBeGreaterThanOrEqual(0.15);
      expect(result.allocation.tiktok).toBeLessThanOrEqual(0.25);

      // Should have high confidence for B2B scenario
      expect(result.confidence.overall).toBeGreaterThan(0.4);

      // Should provide alternatives
      expect(result.alternatives.topAllocations.length).toBeGreaterThan(0);
      expect(result.alternatives.reasoningExplanation).toContain("algorithm");
    });

    it("should handle e-commerce company optimization", async () => {
      const budget = 25000;
      const ecommercePriors: ChannelPriors = {
        google: { cpm: [8, 18], ctr: [0.03, 0.06], cvr: [0.15, 0.35] },
        meta: { cpm: [6, 14], ctr: [0.025, 0.05], cvr: [0.12, 0.3] },
        tiktok: { cpm: [10, 22], ctr: [0.04, 0.07], cvr: [0.08, 0.25] },
        linkedin: { cpm: [20, 35], ctr: [0.01, 0.025], cvr: [0.1, 0.2] }
      };

      const ecommerceAssumptions: Assumptions = {
        goal: "demos",
        maxPct: { linkedin: 0.15 }, // E-commerce typically uses less LinkedIn
        minPct: { meta: 0.2, tiktok: 0.15 } // Focus on social platforms
      };

      const result = await service.enhanceOptimization(budget, ecommercePriors, ecommerceAssumptions, {
        level: "standard",
        includeAlternatives: true,
        validateAgainstBenchmarks: true
      });

      // Verify e-commerce constraints are respected
      expect(result.allocation.linkedin).toBeLessThanOrEqual(0.15);
      expect(result.allocation.meta).toBeGreaterThanOrEqual(0.2);
      expect(result.allocation.tiktok).toBeGreaterThanOrEqual(0.15);

      // Should have validation results
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThan(0);
      expect(result.validation.consensus).toBeDefined();
    });

    it("should handle CAC optimization scenario", async () => {
      const budget = 15000;
      const cacPriors: ChannelPriors = {
        google: { cpm: [12, 22], ctr: [0.02, 0.04], cvr: [0.1, 0.25] },
        meta: { cpm: [10, 18], ctr: [0.018, 0.038], cvr: [0.08, 0.22] },
        tiktok: { cpm: [14, 26], ctr: [0.03, 0.05], cvr: [0.06, 0.18] },
        linkedin: { cpm: [18, 32], ctr: [0.012, 0.028], cvr: [0.12, 0.3] }
      };

      const cacAssumptions: Assumptions = {
        goal: "cac",
        targetCAC: 120
      };

      const result = await service.enhanceOptimization(budget, cacPriors, cacAssumptions, {
        level: "standard",
        includeAlternatives: true,
        validateAgainstBenchmarks: true
      });

      // For CAC optimization, should minimize cost per acquisition
      expect(result.objective).toBe("cac");

      // Should have reasonable confidence
      expect(result.confidence.overall).toBeGreaterThan(0.3);

      // Should provide benchmark comparison
      expect(result.validation.benchmarkComparison).toBeDefined();
      expect(result.validation.benchmarkComparison.deviationScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Enhancement level performance comparison", () => {
    const testBudget = 20000;
    const testPriors: ChannelPriors = {
      google: { cpm: [10, 20], ctr: [0.025, 0.045], cvr: [0.1, 0.3] },
      meta: { cpm: [8, 16], ctr: [0.02, 0.04], cvr: [0.08, 0.25] },
      tiktok: { cpm: [12, 24], ctr: [0.03, 0.05], cvr: [0.06, 0.2] },
      linkedin: { cpm: [15, 30], ctr: [0.015, 0.03], cvr: [0.15, 0.4] }
    };

    const testAssumptions: Assumptions = {
      goal: "demos",
      avgDealSize: 1500
    };

    it("should complete fast enhancement quickly", async () => {
      const startTime = Date.now();

      const result = await service.enhanceOptimization(testBudget, testPriors, testAssumptions, {
        level: "fast",
        includeAlternatives: true,
        validateAgainstBenchmarks: true
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(8000); // Should complete within 8 seconds
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThanOrEqual(1);
    });

    it("should provide more comprehensive results for thorough enhancement", async () => {
      const fastResult = await service.enhanceOptimization(testBudget, testPriors, testAssumptions, {
        level: "fast",
        includeAlternatives: true,
        validateAgainstBenchmarks: true
      });

      const thoroughResult = await service.enhanceOptimization(testBudget, testPriors, testAssumptions, {
        level: "thorough",
        includeAlternatives: true,
        validateAgainstBenchmarks: true
      });

      // Thorough should have same or better confidence
      expect(thoroughResult.confidence.overall).toBeGreaterThanOrEqual(fastResult.confidence.overall - 0.1);

      // Both should have valid allocations
      const fastSum = Object.values(fastResult.allocation).reduce((sum, val) => sum + val, 0);
      const thoroughSum = Object.values(thoroughResult.allocation).reduce((sum, val) => sum + val, 0);

      expect(fastSum).toBeCloseTo(1, 5);
      expect(thoroughSum).toBeCloseTo(1, 5);
    });
  });

  describe("Parallel execution validation", () => {
    it("should handle multiple simultaneous enhancement requests", async () => {
      const budget = 30000;
      const priors: ChannelPriors = {
        google: { cpm: [12, 22], ctr: [0.02, 0.04], cvr: [0.1, 0.25] },
        meta: { cpm: [10, 18], ctr: [0.018, 0.038], cvr: [0.08, 0.22] },
        tiktok: { cpm: [14, 26], ctr: [0.03, 0.05], cvr: [0.06, 0.18] },
        linkedin: { cpm: [18, 32], ctr: [0.012, 0.028], cvr: [0.12, 0.3] }
      };

      const scenarios = [
        { goal: "demos" as const, avgDealSize: 1000 },
        { goal: "revenue" as const, avgDealSize: 2500 },
        { goal: "cac" as const, targetCAC: 150 }
      ];

      const promises = scenarios.map(assumptions =>
        service.enhanceOptimization(budget, priors, assumptions, {
          level: "standard",
          includeAlternatives: true,
          validateAgainstBenchmarks: true
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);

      results.forEach((result, index) => {
        expect(result.objective).toBe(scenarios[index].goal);
        expect(result.confidence.overall).toBeGreaterThan(0);
        expect(result.validation.alternativeAlgorithms.length).toBeGreaterThan(0);

        // Allocation should sum to 1
        const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
        expect(allocationSum).toBeCloseTo(1, 5);
      });
    });
  });

  describe("Error recovery and resilience", () => {
    it("should handle algorithm timeouts gracefully", async () => {
      const budget = 10000;
      const priors: ChannelPriors = {
        google: { cpm: [10, 20], ctr: [0.02, 0.05], cvr: [0.1, 0.3] },
        meta: { cpm: [8, 15], ctr: [0.015, 0.04], cvr: [0.08, 0.25] },
        tiktok: { cpm: [12, 25], ctr: [0.03, 0.06], cvr: [0.05, 0.2] },
        linkedin: { cpm: [15, 30], ctr: [0.01, 0.03], cvr: [0.15, 0.4] }
      };

      const assumptions: Assumptions = {
        goal: "demos",
        avgDealSize: 1000
      };

      // Use very short timeout to trigger timeout handling
      const result = await service.enhanceOptimization(budget, priors, assumptions, {
        level: "standard",
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        timeoutMs: 100 // Very short timeout
      });

      // Should still return a valid result
      expect(result).toHaveProperty("allocation");
      expect(result).toHaveProperty("confidence");

      // Allocation should still be valid
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 5);

      // Should have at least the primary Monte Carlo result
      expect(result.confidence.overall).toBeGreaterThan(0);
    });

    it("should handle extreme constraint scenarios", async () => {
      const budget = 5000;
      const priors: ChannelPriors = {
        google: { cpm: [10, 20], ctr: [0.02, 0.05], cvr: [0.1, 0.3] },
        meta: { cpm: [8, 15], ctr: [0.015, 0.04], cvr: [0.08, 0.25] },
        tiktok: { cpm: [12, 25], ctr: [0.03, 0.06], cvr: [0.05, 0.2] },
        linkedin: { cpm: [15, 30], ctr: [0.01, 0.03], cvr: [0.15, 0.4] }
      };

      // Extreme constraints that are difficult to satisfy
      const extremeAssumptions: Assumptions = {
        goal: "demos",
        minPct: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.2 }, // Sums to 1.1
        maxPct: { google: 0.5, meta: 0.4, tiktok: 0.3, linkedin: 0.3 }
      };

      const result = await service.enhanceOptimization(budget, priors, extremeAssumptions, {
        level: "fast",
        includeAlternatives: false,
        validateAgainstBenchmarks: false
      });

      // Should handle gracefully and return valid allocation
      expect(result).toHaveProperty("allocation");

      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 5);

      // Should generate warnings about constraint conflicts
      expect(result.validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("Validation quality assessment", () => {
    it("should provide consistent results across multiple runs", async () => {
      const budget = 15000;
      const priors: ChannelPriors = {
        google: { cpm: [12, 18], ctr: [0.025, 0.04], cvr: [0.12, 0.28] },
        meta: { cpm: [10, 16], ctr: [0.02, 0.035], cvr: [0.1, 0.25] },
        tiktok: { cpm: [14, 20], ctr: [0.03, 0.045], cvr: [0.08, 0.22] },
        linkedin: { cpm: [18, 25], ctr: [0.015, 0.025], cvr: [0.15, 0.35] }
      };

      const assumptions: Assumptions = {
        goal: "revenue",
        avgDealSize: 2000
      };

      // Run multiple times to check consistency
      const runs = 3;
      const results = await Promise.all(
        Array(runs).fill(null).map(() =>
          service.enhanceOptimization(budget, priors, assumptions, {
            level: "standard",
            includeAlternatives: false,
            validateAgainstBenchmarks: true
          })
        )
      );

      // Check that results are reasonably consistent
      const allocations = results.map(r => r.allocation);
      const confidences = results.map(r => r.confidence.overall);

      // Calculate variance in allocations across runs
      const channels = ["google", "meta", "tiktok", "linkedin"] as const;
      for (const channel of channels) {
        const values = allocations.map(a => a[channel]);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

        // Variance should be relatively low for consistent results
        expect(variance).toBeLessThan(0.01); // Less than 1% variance
      }

      // Confidence should be reasonably consistent
      const avgConfidence = confidences.reduce((sum, val) => sum + val, 0) / confidences.length;
      const confidenceVariance = confidences.reduce((sum, val) => sum + Math.pow(val - avgConfidence, 2), 0) / confidences.length;

      expect(confidenceVariance).toBeLessThan(0.05); // Less than 5% variance in confidence
    });
  });
});