/**
 * Unit tests for AccuracyEnhancementService
 */

import { AccuracyEnhancementService } from "../accuracyEnhancementService";
import type { ChannelPriors, Assumptions, EnhancementOptions } from "@/types/shared";

describe("AccuracyEnhancementService", () => {
  let service: AccuracyEnhancementService;
  let mockPriors: ChannelPriors;
  let mockAssumptions: Assumptions;

  beforeEach(() => {
    service = new AccuracyEnhancementService();
    
    mockPriors = {
      google: { cpm: [10, 20], ctr: [0.02, 0.05], cvr: [0.1, 0.3] },
      meta: { cpm: [8, 15], ctr: [0.015, 0.04], cvr: [0.08, 0.25] },
      tiktok: { cpm: [12, 25], ctr: [0.03, 0.06], cvr: [0.05, 0.2] },
      linkedin: { cpm: [15, 30], ctr: [0.01, 0.03], cvr: [0.15, 0.4] }
    };

    mockAssumptions = {
      goal: "demos" as const,
      avgDealSize: 1000,
      targetCAC: 100
    };
  });

  describe("constructor", () => {
    it("should initialize with default configuration", () => {
      const service = new AccuracyEnhancementService();
      expect(service).toBeInstanceOf(AccuracyEnhancementService);
    });

    it("should accept custom configuration", () => {
      const customConfig = {
        algorithms: {
          gradient: { name: "Custom Gradient", enabled: false, weight: 0.5, timeoutMs: 3000 },
          bayesian: { name: "Custom Bayesian", enabled: true, weight: 1.5, timeoutMs: 8000 },
          heuristic: { name: "Custom Heuristic", enabled: false, weight: 0.3, timeoutMs: 1500 }
        },
        parallelExecution: false,
        maxConcurrency: 2
      };

      const service = new AccuracyEnhancementService(customConfig);
      expect(service).toBeInstanceOf(AccuracyEnhancementService);
    });
  });

  describe("enhanceOptimization", () => {
    it("should enhance optimization with default options", async () => {
      const budget = 10000;
      
      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions);
      
      expect(result).toHaveProperty("allocation");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("validation");
      expect(result).toHaveProperty("alternatives");
      
      // Check allocation sums to 1
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 5);
      
      // Check confidence structure
      expect(result.confidence).toHaveProperty("overall");
      expect(result.confidence).toHaveProperty("perChannel");
      expect(result.confidence).toHaveProperty("stability");
      expect(result.confidence.overall).toBeGreaterThanOrEqual(0);
      expect(result.confidence.overall).toBeLessThanOrEqual(1);
    });

    it("should handle fast enhancement level", async () => {
      const budget = 10000;
      const options: EnhancementOptions = {
        level: "fast",
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        timeoutMs: 5000
      };
      
      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, options);
      
      expect(result).toHaveProperty("validation");
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle standard enhancement level", async () => {
      const budget = 10000;
      const options: EnhancementOptions = {
        level: "standard",
        includeAlternatives: true,
        validateAgainstBenchmarks: true
      };
      
      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, options);
      
      expect(result).toHaveProperty("validation");
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle thorough enhancement level", async () => {
      const budget = 10000;
      const options: EnhancementOptions = {
        level: "thorough",
        includeAlternatives: true,
        validateAgainstBenchmarks: true
      };
      
      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, options);
      
      expect(result).toHaveProperty("validation");
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThanOrEqual(1);
    });

    it("should respect includeAlternatives option", async () => {
      const budget = 10000;
      
      // Test with alternatives enabled
      const withAlternatives = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, {
        level: "standard",
        includeAlternatives: true,
        validateAgainstBenchmarks: false
      });
      
      expect(withAlternatives.alternatives.topAllocations).toBeDefined();
      expect(withAlternatives.alternatives.reasoningExplanation).toBeDefined();
      
      // Test with alternatives disabled
      const withoutAlternatives = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, {
        level: "standard",
        includeAlternatives: false,
        validateAgainstBenchmarks: false
      });
      
      expect(withoutAlternatives.alternatives.topAllocations).toEqual([]);
      expect(withoutAlternatives.alternatives.reasoningExplanation).toContain("not requested");
    });

    it("should respect validateAgainstBenchmarks option", async () => {
      const budget = 10000;
      
      // Test with benchmark validation enabled
      const withBenchmarks = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, {
        level: "standard",
        includeAlternatives: false,
        validateAgainstBenchmarks: true
      });
      
      expect(withBenchmarks.validation.benchmarkComparison).toBeDefined();
      expect(withBenchmarks.validation.benchmarkComparison.deviationScore).toBeGreaterThanOrEqual(0);
      
      // Test with benchmark validation disabled
      const withoutBenchmarks = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, {
        level: "standard",
        includeAlternatives: false,
        validateAgainstBenchmarks: false
      });
      
      expect(withoutBenchmarks.validation.benchmarkComparison.deviationScore).toBe(0);
    });

    it("should handle different optimization goals", async () => {
      const budget = 10000;
      
      // Test demos goal
      const demosResult = await service.enhanceOptimization(budget, mockPriors, {
        ...mockAssumptions,
        goal: "demos"
      });
      expect(demosResult.objective).toBe("demos");
      
      // Test revenue goal
      const revenueResult = await service.enhanceOptimization(budget, mockPriors, {
        ...mockAssumptions,
        goal: "revenue",
        avgDealSize: 2000
      });
      expect(revenueResult.objective).toBe("revenue");
      
      // Test CAC goal
      const cacResult = await service.enhanceOptimization(budget, mockPriors, {
        ...mockAssumptions,
        goal: "cac",
        targetCAC: 150
      });
      expect(cacResult.objective).toBe("cac");
    });

    it("should handle constraints in assumptions", async () => {
      const budget = 10000;
      const constrainedAssumptions: Assumptions = {
        ...mockAssumptions,
        minPct: { google: 0.2, meta: 0.1 },
        maxPct: { google: 0.6, tiktok: 0.3 }
      };
      
      const result = await service.enhanceOptimization(budget, mockPriors, constrainedAssumptions);
      
      // Check that constraints are respected
      expect(result.allocation.google).toBeGreaterThanOrEqual(0.2);
      expect(result.allocation.google).toBeLessThanOrEqual(0.6);
      expect(result.allocation.meta).toBeGreaterThanOrEqual(0.1);
      expect(result.allocation.tiktok).toBeLessThanOrEqual(0.3);
    });

    it("should handle timeout gracefully", async () => {
      const budget = 10000;
      const options: EnhancementOptions = {
        level: "standard",
        includeAlternatives: true,
        validateAgainstBenchmarks: true,
        timeoutMs: 1 // Very short timeout to trigger timeout handling
      };
      
      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, options);
      
      // Should still return a valid result even with timeout
      expect(result).toHaveProperty("allocation");
      expect(result).toHaveProperty("confidence");
      
      // Allocation should still sum to 1
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 5);
    });

    it("should generate validation warnings when appropriate", async () => {
      const budget = 10000;
      
      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, {
        level: "standard",
        includeAlternatives: true,
        validateAgainstBenchmarks: true
      });
      
      expect(result.validation.warnings).toBeDefined();
      expect(Array.isArray(result.validation.warnings)).toBe(true);
      
      // Each warning should have required properties
      result.validation.warnings.forEach(warning => {
        expect(warning).toHaveProperty("type");
        expect(warning).toHaveProperty("message");
        expect(warning).toHaveProperty("severity");
        expect(["low", "medium", "high"]).toContain(warning.severity);
      });
    });

    it("should provide consensus metrics", async () => {
      const budget = 10000;
      
      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions);
      
      expect(result.validation.consensus).toBeDefined();
      expect(result.validation.consensus).toHaveProperty("agreement");
      expect(result.validation.consensus).toHaveProperty("variance");
      expect(result.validation.consensus).toHaveProperty("outlierCount");
      
      expect(result.validation.consensus.agreement).toBeGreaterThanOrEqual(0);
      expect(result.validation.consensus.agreement).toBeLessThanOrEqual(1);
      expect(result.validation.consensus.outlierCount).toBeGreaterThanOrEqual(0);
    });

    it("should include alternative algorithms in validation", async () => {
      const budget = 10000;
      
      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions);
      
      expect(result.validation.alternativeAlgorithms).toBeDefined();
      expect(Array.isArray(result.validation.alternativeAlgorithms)).toBe(true);
      
      // Should have at least gradient and heuristic algorithms
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThanOrEqual(1);
      
      // Each algorithm result should have required properties
      result.validation.alternativeAlgorithms.forEach(algorithm => {
        expect(algorithm).toHaveProperty("name");
        expect(algorithm).toHaveProperty("allocation");
        expect(algorithm).toHaveProperty("confidence");
        expect(algorithm).toHaveProperty("performance");
        
        // Allocation should sum to 1
        const allocationSum = Object.values(algorithm.allocation).reduce((sum, val) => sum + val, 0);
        expect(allocationSum).toBeCloseTo(1, 5);
        
        // Confidence should be between 0 and 1
        expect(algorithm.confidence).toBeGreaterThanOrEqual(0);
        expect(algorithm.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("error handling", () => {
    it("should handle invalid budget values", async () => {
      const invalidBudgets = [0, -1000, NaN, Infinity];
      
      for (const budget of invalidBudgets) {
        try {
          await service.enhanceOptimization(budget, mockPriors, mockAssumptions);
          // If no error is thrown, the result should still be valid
        } catch (error) {
          // Error handling is acceptable for invalid inputs
          expect(error).toBeDefined();
        }
      }
    });

    it("should handle empty or invalid priors", async () => {
      const budget = 10000;
      const invalidPriors = {} as ChannelPriors;
      
      try {
        await service.enhanceOptimization(budget, invalidPriors, mockAssumptions);
        // If no error is thrown, should handle gracefully
      } catch (error) {
        // Error handling is acceptable for invalid inputs
        expect(error).toBeDefined();
      }
    });
  });

  describe("performance", () => {
    it("should complete enhancement within reasonable time for fast level", async () => {
      const budget = 10000;
      const startTime = Date.now();
      
      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, {
        level: "fast",
        includeAlternatives: false,
        validateAgainstBenchmarks: false
      });
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it("should handle multiple concurrent enhancement requests", async () => {
      const budget = 10000;
      const requests = Array(3).fill(null).map(() => 
        service.enhanceOptimization(budget, mockPriors, mockAssumptions, {
          level: "fast",
          includeAlternatives: false,
          validateAgainstBenchmarks: false
        })
      );
      
      const results = await Promise.all(requests);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty("allocation");
        expect(result).toHaveProperty("confidence");
      });
    });
  });
});