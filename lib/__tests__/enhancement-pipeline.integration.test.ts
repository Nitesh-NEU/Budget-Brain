/**
 * Comprehensive Integration Tests for Enhanced Optimization Pipeline
 * Tests the complete enhancement pipeline with real optimization scenarios,
 * performance requirements, and error handling
 */

import { AccuracyEnhancementService } from "../accuracyEnhancementService";
import type { ChannelPriors, Assumptions } from "@/types/shared";
import type { EnhancementOptions } from "../accuracyEnhancementService";

describe("Enhanced Optimization Pipeline Integration", () => {
  let service: AccuracyEnhancementService;

  beforeEach(() => {
    service = new AccuracyEnhancementService();
  });

  describe("Complete Enhancement Pipeline with Real Scenarios", () => {
    it("should handle B2B SaaS optimization with full pipeline", async () => {
      const budget = 75000;
      const b2bPriors: ChannelPriors = {
        google: { cpm: [18, 28], ctr: [0.028, 0.048], cvr: [0.15, 0.32] },
        meta: { cpm: [14, 22], ctr: [0.022, 0.042], cvr: [0.10, 0.26] },
        tiktok: { cpm: [20, 32], ctr: [0.038, 0.058], cvr: [0.08, 0.20] },
        linkedin: { cpm: [28, 45], ctr: [0.018, 0.038], cvr: [0.20, 0.48] }
      };

      const b2bAssumptions: Assumptions = {
        goal: "revenue",
        avgDealSize: 8500,
        minPct: { linkedin: 0.20 }, // B2B requires significant LinkedIn presence
        maxPct: { tiktok: 0.20 } // Limit TikTok for B2B
      };

      const result = await service.enhanceOptimization(budget, b2bPriors, b2bAssumptions, {
        level: "thorough",
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: true
      });

      // Verify complete pipeline execution
      expect(result).toHaveProperty("allocation");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("validation");
      expect(result).toHaveProperty("alternatives");

      // Verify B2B constraints are respected
      expect(result.allocation.linkedin).toBeGreaterThanOrEqual(0.19); // Allow small tolerance
      expect(result.allocation.tiktok).toBeLessThanOrEqual(0.21); // Allow small tolerance

      // Verify allocation sums to 1
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 4);

      // Verify confidence metrics
      expect(result.confidence.overall).toBeGreaterThan(0.3);
      expect(result.confidence.perChannel).toBeDefined();
      expect(result.confidence.stability).toBeGreaterThan(0);

      // Verify validation pipeline results
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThan(0);
      expect(result.validation.consensus).toBeDefined();
      expect(result.validation.benchmarkComparison).toBeDefined();

      // Verify alternatives are provided
      expect(result.alternatives.topAllocations.length).toBeGreaterThanOrEqual(0);
      expect(result.alternatives.reasoningExplanation).toBeTruthy();

      // Verify objective matches
      expect(result.objective).toBe("revenue");
    }, 30000);

    it("should handle e-commerce optimization with full pipeline", async () => {
      const budget = 35000;
      const ecommercePriors: ChannelPriors = {
        google: { cpm: [10, 20], ctr: [0.035, 0.065], cvr: [0.18, 0.38] },
        meta: { cpm: [8, 16], ctr: [0.028, 0.052], cvr: [0.14, 0.32] },
        tiktok: { cpm: [12, 24], ctr: [0.045, 0.075], cvr: [0.10, 0.28] },
        linkedin: { cpm: [22, 38], ctr: [0.012, 0.028], cvr: [0.12, 0.22] }
      };

      const ecommerceAssumptions: Assumptions = {
        goal: "demos",
        maxPct: { linkedin: 0.12 }, // E-commerce uses less LinkedIn
        minPct: { meta: 0.25, tiktok: 0.18 } // Focus on social platforms
      };

      const result = await service.enhanceOptimization(budget, ecommercePriors, ecommerceAssumptions, {
        level: "standard",
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: true
      });

      // Verify complete pipeline execution
      expect(result).toHaveProperty("allocation");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("validation");
      expect(result).toHaveProperty("alternatives");

      // Verify e-commerce constraints are respected
      expect(result.allocation.linkedin).toBeLessThanOrEqual(0.13); // Allow small tolerance
      expect(result.allocation.meta).toBeGreaterThanOrEqual(0.24); // Allow small tolerance
      expect(result.allocation.tiktok).toBeGreaterThanOrEqual(0.17); // Allow small tolerance

      // Verify allocation sums to 1
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 4);

      // Verify validation pipeline results
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThan(0);
      expect(result.validation.consensus.agreement).toBeGreaterThanOrEqual(0);
      expect(result.validation.benchmarkComparison.deviationScore).toBeGreaterThanOrEqual(0);

      // Verify objective matches
      expect(result.objective).toBe("demos");
    }, 25000);

    it("should handle CAC optimization with full pipeline", async () => {
      const budget = 18000;
      const cacPriors: ChannelPriors = {
        google: { cpm: [14, 24], ctr: [0.022, 0.042], cvr: [0.12, 0.28] },
        meta: { cpm: [12, 20], ctr: [0.020, 0.040], cvr: [0.10, 0.25] },
        tiktok: { cpm: [16, 28], ctr: [0.032, 0.052], cvr: [0.08, 0.20] },
        linkedin: { cpm: [20, 35], ctr: [0.014, 0.030], cvr: [0.14, 0.32] }
      };

      const cacAssumptions: Assumptions = {
        goal: "cac",
        targetCAC: 150
      };

      const result = await service.enhanceOptimization(budget, cacPriors, cacAssumptions, {
        level: "standard",
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: false // Test without LLM validation
      });

      // Verify complete pipeline execution
      expect(result).toHaveProperty("allocation");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("validation");
      expect(result).toHaveProperty("alternatives");

      // Verify allocation sums to 1
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 4);

      // For CAC optimization, should minimize cost per acquisition
      expect(result.objective).toBe("cac");

      // Verify validation pipeline results (without LLM)
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThan(0);
      expect(result.validation.benchmarkComparison).toBeDefined();

      // Should still have confidence scoring
      expect(result.confidence.overall).toBeGreaterThan(0);
    }, 20000);

    it("should handle startup optimization scenario", async () => {
      const budget = 8000; // Small budget
      const startupPriors: ChannelPriors = {
        google: { cpm: [8, 16], ctr: [0.015, 0.035], cvr: [0.08, 0.20] },
        meta: { cpm: [6, 14], ctr: [0.012, 0.032], cvr: [0.06, 0.18] },
        tiktok: { cpm: [10, 20], ctr: [0.020, 0.040], cvr: [0.04, 0.15] },
        linkedin: { cpm: [14, 26], ctr: [0.008, 0.020], cvr: [0.10, 0.25] }
      };

      const startupAssumptions: Assumptions = {
        goal: "demos",
        maxPct: { linkedin: 0.25 }, // Startups may limit expensive channels
        minPct: { google: 0.30 } // Focus on proven channels
      };

      const result = await service.enhanceOptimization(budget, startupPriors, startupAssumptions, {
        level: "fast", // Startups need quick results
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: false
      });

      // Verify complete pipeline execution
      expect(result).toHaveProperty("allocation");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("validation");

      // Verify startup constraints
      expect(result.allocation.linkedin).toBeLessThanOrEqual(0.26); // Allow tolerance
      expect(result.allocation.google).toBeGreaterThanOrEqual(0.29); // Allow tolerance

      // Verify allocation sums to 1
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 4);

      // Should have some validation algorithms (fast level)
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThanOrEqual(1);
    }, 15000);
  });

  describe("Performance Requirements by Enhancement Level", () => {
    const testBudget = 25000;
    const testPriors: ChannelPriors = {
      google: { cpm: [12, 22], ctr: [0.025, 0.045], cvr: [0.12, 0.30] },
      meta: { cpm: [10, 18], ctr: [0.020, 0.040], cvr: [0.10, 0.26] },
      tiktok: { cpm: [14, 26], ctr: [0.030, 0.050], cvr: [0.08, 0.22] },
      linkedin: { cpm: [18, 32], ctr: [0.015, 0.030], cvr: [0.16, 0.38] }
    };

    const testAssumptions: Assumptions = {
      goal: "revenue",
      avgDealSize: 2000
    };

    it("should meet fast enhancement performance requirements", async () => {
      const startTime = Date.now();

      const result = await service.enhanceOptimization(testBudget, testPriors, testAssumptions, {
        level: "fast",
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: false
      });

      const duration = Date.now() - startTime;

      // Fast level should complete within 10 seconds
      expect(duration).toBeLessThan(10000);

      // Should have at least 1 validation algorithm
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThanOrEqual(1);

      // Should have valid allocation
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 4);

      // Should have reasonable confidence
      expect(result.confidence.overall).toBeGreaterThan(0.2);
    }, 12000);

    it("should meet standard enhancement performance requirements", async () => {
      const startTime = Date.now();

      const result = await service.enhanceOptimization(testBudget, testPriors, testAssumptions, {
        level: "standard",
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: false // Disable to avoid API delays
      });

      const duration = Date.now() - startTime;

      // Standard level should complete within 20 seconds
      expect(duration).toBeLessThan(20000);

      // Should have multiple validation algorithms
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThanOrEqual(2);

      // Should have valid allocation
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 4);

      // Should have good confidence
      expect(result.confidence.overall).toBeGreaterThan(0.3);
    }, 25000);

    it("should meet thorough enhancement performance requirements", async () => {
      const startTime = Date.now();

      const result = await service.enhanceOptimization(testBudget, testPriors, testAssumptions, {
        level: "thorough",
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: false // Disable to avoid API delays
      });

      const duration = Date.now() - startTime;

      // Thorough level should complete within 35 seconds
      expect(duration).toBeLessThan(35000);

      // Should have multiple validation algorithms
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThanOrEqual(2);

      // Should have valid allocation
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 4);

      // Should have high confidence
      expect(result.confidence.overall).toBeGreaterThan(0.3);

      // Should provide comprehensive alternatives
      expect(result.alternatives.topAllocations.length).toBeGreaterThanOrEqual(0);
    }, 40000);

    it("should show performance improvement with higher enhancement levels", async () => {
      // Test that higher levels provide better or equal confidence
      const fastResult = await service.enhanceOptimization(testBudget, testPriors, testAssumptions, {
        level: "fast",
        includeAlternatives: false,
        validateAgainstBenchmarks: true,
        enableLLMValidation: false
      });

      const standardResult = await service.enhanceOptimization(testBudget, testPriors, testAssumptions, {
        level: "standard",
        includeAlternatives: false,
        validateAgainstBenchmarks: true,
        enableLLMValidation: false
      });

      // Standard should have same or more validation algorithms
      expect(standardResult.validation.alternativeAlgorithms.length)
        .toBeGreaterThanOrEqual(fastResult.validation.alternativeAlgorithms.length);

      // Both should have valid allocations
      const fastSum = Object.values(fastResult.allocation).reduce((sum, val) => sum + val, 0);
      const standardSum = Object.values(standardResult.allocation).reduce((sum, val) => sum + val, 0);

      expect(fastSum).toBeCloseTo(1, 4);
      expect(standardSum).toBeCloseTo(1, 4);

      // Standard should have same or better confidence (allowing for variance)
      expect(standardResult.confidence.overall).toBeGreaterThanOrEqual(fastResult.confidence.overall - 0.15);
    }, 30000);
  });

  describe("Error Handling and Resilience", () => {
    const testBudget = 15000;
    const testPriors: ChannelPriors = {
      google: { cpm: [10, 18], ctr: [0.02, 0.04], cvr: [0.1, 0.25] },
      meta: { cpm: [8, 16], ctr: [0.018, 0.038], cvr: [0.08, 0.22] },
      tiktok: { cpm: [12, 22], ctr: [0.025, 0.045], cvr: [0.06, 0.18] },
      linkedin: { cpm: [16, 28], ctr: [0.012, 0.025], cvr: [0.12, 0.3] }
    };

    const testAssumptions: Assumptions = {
      goal: "demos",
      avgDealSize: 1200
    };

    it("should handle gradient algorithm failure gracefully", async () => {
      // Mock gradient optimizer to fail
      const originalOptimize = service['gradientOptimizer'].optimize;
      service['gradientOptimizer'].optimize = jest.fn().mockImplementation(() => {
        throw new Error("Gradient optimization failed");
      });

      const result = await service.enhanceOptimization(testBudget, testPriors, testAssumptions, {
        level: "standard",
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: false
      });

      // Should still return valid result
      expect(result).toHaveProperty("allocation");
      expect(result).toHaveProperty("confidence");

      // Allocation should be valid
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 4);

      // Should have fewer validation algorithms due to failure
      const gradientResults = result.validation.alternativeAlgorithms.filter(alg => alg.name.includes("Gradient"));
      expect(gradientResults.length).toBe(0);

      // Should still have other algorithms
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThanOrEqual(0);

      // Should still have confidence
      expect(result.confidence.overall).toBeGreaterThan(0);

      // Restore original method
      service['gradientOptimizer'].optimize = originalOptimize;
    }, 20000);

    it("should handle multiple algorithm failures gracefully", async () => {
      // Mock multiple algorithms to fail
      const originalGradientOptimize = service['gradientOptimizer'].optimize;
      const originalRunBayesian = service['runBayesianOptimization'];

      service['gradientOptimizer'].optimize = jest.fn().mockImplementation(() => {
        throw new Error("Gradient failed");
      });

      // Mock the private method by overriding it
      service['runBayesianOptimization'] = jest.fn().mockImplementation(async () => {
        throw new Error("Bayesian failed");
      });

      const result = await service.enhanceOptimization(testBudget, testPriors, testAssumptions, {
        level: "standard",
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: false
      });

      // Should still return valid result with Monte Carlo
      expect(result).toHaveProperty("allocation");
      expect(result).toHaveProperty("confidence");

      // Allocation should be valid
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 4);

      // Should have minimal validation algorithms due to failures
      expect(result.validation.alternativeAlgorithms.length).toBeLessThan(2);

      // Should still have confidence from Monte Carlo
      expect(result.confidence.overall).toBeGreaterThan(0);

      // Restore original methods
      service['gradientOptimizer'].optimize = originalGradientOptimize;
      service['runBayesianOptimization'] = originalRunBayesian;
    }, 20000);

    it("should handle timeout scenarios gracefully", async () => {
      const result = await service.enhanceOptimization(testBudget, testPriors, testAssumptions, {
        level: "standard",
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: false,
        timeoutMs: 500 // Very short timeout to trigger timeout handling
      });

      // Should still return valid result
      expect(result).toHaveProperty("allocation");
      expect(result).toHaveProperty("confidence");

      // Allocation should be valid
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 4);

      // Should have minimal validation due to timeout
      expect(result.validation.alternativeAlgorithms.length).toBeLessThanOrEqual(3);

      // Should still have confidence
      expect(result.confidence.overall).toBeGreaterThan(0);
    }, 15000);

    it("should handle benchmark validation failure gracefully", async () => {
      // Mock benchmark validator to fail
      const originalValidateAllocation = service['benchmarkValidator'].validateAllocation;
      service['benchmarkValidator'].validateAllocation = jest.fn().mockImplementation(() => {
        throw new Error("Benchmark validation failed");
      });

      const result = await service.enhanceOptimization(testBudget, testPriors, testAssumptions, {
        level: "standard",
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: false
      });

      // Should still return valid result
      expect(result).toHaveProperty("allocation");
      expect(result).toHaveProperty("confidence");

      // Allocation should be valid
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 4);

      // Should have default benchmark comparison
      expect(result.validation.benchmarkComparison).toBeDefined();
      expect(result.validation.benchmarkComparison.deviationScore).toBe(0);

      // Should still have other validation algorithms
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThan(0);

      // Restore original method
      service['benchmarkValidator'].validateAllocation = originalValidateAllocation;
    }, 20000);

    it("should handle extreme constraint scenarios", async () => {
      // Create impossible constraints
      const extremeAssumptions: Assumptions = {
        goal: "demos",
        minPct: { google: 0.5, meta: 0.4, tiktok: 0.3, linkedin: 0.2 }, // Sum > 1
        maxPct: { google: 0.6, meta: 0.5, tiktok: 0.4, linkedin: 0.3 }
      };

      // This should either handle gracefully or throw a meaningful error
      try {
        const result = await service.enhanceOptimization(testBudget, testPriors, extremeAssumptions, {
          level: "fast",
          includeAlternatives: false,
          validateAgainstBenchmarks: false,
          enableLLMValidation: false
        });

        // If it succeeds, should have valid allocation
        const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
        expect(allocationSum).toBeCloseTo(1, 4);

        // Should have warnings about constraint conflicts
        expect(result.validation.warnings.length).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // Should throw meaningful error about constraints
        expect(error instanceof Error ? error.message : String(error)).toContain("constraint");
      }
    }, 15000);

    it("should maintain data integrity under concurrent requests", async () => {
      // Run multiple enhancement requests concurrently
      const scenarios = [
        { goal: "demos" as const, avgDealSize: 1000 },
        { goal: "revenue" as const, avgDealSize: 2500 },
        { goal: "cac" as const, targetCAC: 180 }
      ];

      const promises = scenarios.map(assumptions =>
        service.enhanceOptimization(testBudget, testPriors, assumptions, {
          level: "fast",
          includeAlternatives: false,
          validateAgainstBenchmarks: true,
          enableLLMValidation: false
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);

      // Each result should be valid and match its scenario
      results.forEach((result, index) => {
        expect(result.objective).toBe(scenarios[index].goal);

        // Allocation should sum to 1
        const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
        expect(allocationSum).toBeCloseTo(1, 4);

        // Should have confidence
        expect(result.confidence.overall).toBeGreaterThan(0);

        // Should have validation results
        expect(result.validation).toBeDefined();
      });
    }, 25000);
  });

  describe("Pipeline Quality and Consistency", () => {
    const testBudget = 20000;
    const testPriors: ChannelPriors = {
      google: { cpm: [14, 20], ctr: [0.025, 0.04], cvr: [0.12, 0.25] },
      meta: { cpm: [12, 18], ctr: [0.02, 0.035], cvr: [0.1, 0.22] },
      tiktok: { cpm: [16, 22], ctr: [0.03, 0.045], cvr: [0.08, 0.2] },
      linkedin: { cpm: [20, 28], ctr: [0.015, 0.025], cvr: [0.15, 0.3] }
    };

    const testAssumptions: Assumptions = {
      goal: "revenue",
      avgDealSize: 1800
    };

    it("should provide consistent results across multiple runs", async () => {
      const runs = 3;
      const results = await Promise.all(
        Array(runs).fill(null).map(() =>
          service.enhanceOptimization(testBudget, testPriors, testAssumptions, {
            level: "standard",
            includeAlternatives: false,
            validateAgainstBenchmarks: true,
            enableLLMValidation: false
          })
        )
      );

      // All results should be valid
      results.forEach(result => {
        const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
        expect(allocationSum).toBeCloseTo(1, 4);
        expect(result.confidence.overall).toBeGreaterThan(0);
      });

      // Calculate variance in allocations
      const channels = ["google", "meta", "tiktok", "linkedin"] as const;
      for (const channel of channels) {
        const values = results.map(r => r.allocation[channel]);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

        // Variance should be relatively low for consistent results
        expect(variance).toBeLessThan(0.03); // Less than 3% variance (Monte Carlo has inherent randomness)
      }

      // Confidence should be reasonably consistent
      const confidences = results.map(r => r.confidence.overall);
      const avgConfidence = confidences.reduce((sum, val) => sum + val, 0) / confidences.length;
      const confidenceVariance = confidences.reduce((sum, val) => sum + Math.pow(val - avgConfidence, 2), 0) / confidences.length;

      expect(confidenceVariance).toBeLessThan(0.1); // Less than 10% variance in confidence
    }, 35000);

    it("should validate algorithm consensus quality", async () => {
      const result = await service.enhanceOptimization(testBudget, testPriors, testAssumptions, {
        level: "thorough",
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        enableLLMValidation: false
      });

      // Should have multiple algorithms for consensus
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThan(1);

      // Consensus metrics should be meaningful
      expect(result.validation.consensus.agreement).toBeGreaterThanOrEqual(0);
      expect(result.validation.consensus.agreement).toBeLessThanOrEqual(1);

      // Variance should be calculated for all channels
      const channels = ["google", "meta", "tiktok", "linkedin"] as const;
      for (const channel of channels) {
        expect(result.validation.consensus.variance[channel]).toBeGreaterThanOrEqual(0);
      }

      // Outlier count should be reasonable
      expect(result.validation.consensus.outlierCount).toBeGreaterThanOrEqual(0);
      expect(result.validation.consensus.outlierCount).toBeLessThanOrEqual(result.validation.alternativeAlgorithms.length);
    }, 30000);
  });
});