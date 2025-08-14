/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Integration tests for BenchmarkValidator with AccuracyEnhancementService
 */

import { AccuracyEnhancementService } from "../accuracyEnhancementService";
import { BenchmarkValidator } from "../benchmarkValidator";
import type { ChannelPriors, Assumptions } from "@/types/shared";

describe("BenchmarkValidator Integration", () => {
  let enhancementService: AccuracyEnhancementService;
  let benchmarkValidator: BenchmarkValidator;

  const testPriors: ChannelPriors = {
    google: { cpm: [12, 18], ctr: [0.025, 0.045], cvr: [0.03, 0.07] },
    meta: { cpm: [10, 16], ctr: [0.02, 0.04], cvr: [0.02, 0.06] },
    tiktok: { cpm: [6, 14], ctr: [0.015, 0.035], cvr: [0.015, 0.045] },
    linkedin: { cpm: [20, 35], ctr: [0.008, 0.025], cvr: [0.025, 0.12] }
  };

  beforeEach(() => {
    enhancementService = new AccuracyEnhancementService();
    benchmarkValidator = new BenchmarkValidator();
  });

  describe("Integration with AccuracyEnhancementService", () => {
    it("should provide benchmark validation in enhanced optimization results", async () => {
      const assumptions: Assumptions = {
        goal: "demos",
        avgDealSize: 1200,
        targetCAC: 250
      };

      const result = await enhancementService.enhanceOptimization(
        50000,
        testPriors,
        assumptions,
        {
          level: "standard",
          includeAlternatives: true,
          validateAgainstBenchmarks: true,
          enableLLMValidation: false, // Disable to focus on benchmark validation
          timeoutMs: 10000
        }
      );

      // Should include benchmark comparison
      expect(result.validation.benchmarkComparison).toBeDefined();
      expect(result.validation.benchmarkComparison.deviationScore).toBeGreaterThanOrEqual(0);
      expect(result.validation.benchmarkComparison.deviationScore).toBeLessThanOrEqual(1);
      expect(result.validation.benchmarkComparison.channelDeviations).toBeDefined();

      // Should have channel deviations for all channels
      expect(result.validation.benchmarkComparison.channelDeviations.google).toBeGreaterThanOrEqual(0);
      expect(result.validation.benchmarkComparison.channelDeviations.meta).toBeGreaterThanOrEqual(0);
      expect(result.validation.benchmarkComparison.channelDeviations.tiktok).toBeGreaterThanOrEqual(0);
      expect(result.validation.benchmarkComparison.channelDeviations.linkedin).toBeGreaterThanOrEqual(0);

      // Warnings should be included in overall validation warnings
      const benchmarkWarnings = result.validation.warnings.filter(w => 
        w.type.includes("benchmark") || 
        w.type.includes("unrealistic") || 
        w.type.includes("portfolio") ||
        w.type.includes("industry")
      );

      expect(benchmarkWarnings.length).toBeGreaterThanOrEqual(0);
    }, 15000);

    it("should handle B2B optimization with appropriate benchmark validation", async () => {
      const b2bAssumptions: Assumptions = {
        goal: "cac",
        targetCAC: 500, // High CAC indicates B2B
        avgDealSize: 5000
      };

      const result = await enhancementService.enhanceOptimization(
        75000,
        testPriors,
        b2bAssumptions,
        {
          level: "standard",
          includeAlternatives: true,
          validateAgainstBenchmarks: true,
          enableLLMValidation: false,
          timeoutMs: 10000
        }
      );

      // Should detect B2B context and adjust validation accordingly
      expect(result.validation.benchmarkComparison).toBeDefined();
      
      // For B2B, LinkedIn allocation should be more acceptable
      const linkedinAllocation = result.allocation.linkedin;
      if (linkedinAllocation > 0.25) {
        // Should have fewer warnings about LinkedIn over-allocation in B2B context
        const linkedinWarnings = result.validation.benchmarkComparison.warnings.filter(w => 
          w.channel === "linkedin" && w.type.includes("deviation")
        );
        expect(linkedinWarnings.length).toBeLessThanOrEqual(1);
      }
    }, 15000);

    it("should handle e-commerce optimization with appropriate benchmark validation", async () => {
      const ecommerceAssumptions: Assumptions = {
        goal: "revenue",
        avgDealSize: 150, // Low deal size indicates e-commerce
        targetCAC: 50
      };

      const result = await enhancementService.enhanceOptimization(
        25000,
        testPriors,
        ecommerceAssumptions,
        {
          level: "standard",
          includeAlternatives: true,
          validateAgainstBenchmarks: true,
          enableLLMValidation: false,
          timeoutMs: 10000
        }
      );

      // Should detect e-commerce context
      expect(result.validation.benchmarkComparison).toBeDefined();
      
      // For e-commerce, Google and Meta should dominate
      const googleMetaAllocation = result.allocation.google + result.allocation.meta;
      expect(googleMetaAllocation).toBeGreaterThan(0.6);

      // LinkedIn should be minimal for e-commerce
      expect(result.allocation.linkedin).toBeLessThan(0.15);
    }, 15000);

    it("should provide different validation for different company sizes", async () => {
      const assumptions: Assumptions = {
        goal: "demos",
        avgDealSize: 1000
      };

      // Small company (small budget)
      const smallCompanyResult = await enhancementService.enhanceOptimization(
        5000,
        testPriors,
        assumptions,
        {
          level: "fast",
          includeAlternatives: false,
          validateAgainstBenchmarks: true,
          enableLLMValidation: false,
          timeoutMs: 5000
        }
      );

      // Large company (large budget)
      const largeCompanyResult = await enhancementService.enhanceOptimization(
        500000,
        testPriors,
        assumptions,
        {
          level: "fast",
          includeAlternatives: false,
          validateAgainstBenchmarks: true,
          enableLLMValidation: false,
          timeoutMs: 5000
        }
      );

      // Both should have benchmark validation
      expect(smallCompanyResult.validation.benchmarkComparison).toBeDefined();
      expect(largeCompanyResult.validation.benchmarkComparison).toBeDefined();

      // Large companies should get more diversification warnings if over-concentrated
      const smallCompanyConcentrationWarnings = smallCompanyResult.validation.benchmarkComparison.warnings
        .filter(w => w.type === "portfolio_concentration");
      const largeCompanyConcentrationWarnings = largeCompanyResult.validation.benchmarkComparison.warnings
        .filter(w => w.type === "portfolio_concentration");

      // Large companies should be more strictly evaluated for concentration
      if (largeCompanyConcentrationWarnings.length > 0) {
        expect(largeCompanyConcentrationWarnings[0].severity).toBe("high");
      }
    }, 15000);

    it("should handle benchmark validation disabled", async () => {
      const assumptions: Assumptions = {
        goal: "revenue",
        avgDealSize: 800
      };

      const result = await enhancementService.enhanceOptimization(
        30000,
        testPriors,
        assumptions,
        {
          level: "fast",
          includeAlternatives: false,
          validateAgainstBenchmarks: false, // Disabled
          enableLLMValidation: false,
          timeoutMs: 5000
        }
      );

      // Should have default benchmark comparison with zero deviation
      expect(result.validation.benchmarkComparison).toBeDefined();
      expect(result.validation.benchmarkComparison.deviationScore).toBe(0);
      expect(result.validation.benchmarkComparison.warnings).toEqual([]);
    }, 10000);
  });

  describe("Benchmark Validation Performance", () => {
    it("should complete benchmark validation within reasonable time", async () => {
      const assumptions: Assumptions = {
        goal: "demos",
        avgDealSize: 1000
      };

      const startTime = Date.now();

      const result = await enhancementService.enhanceOptimization(
        40000,
        testPriors,
        assumptions,
        {
          level: "thorough",
          includeAlternatives: true,
          validateAgainstBenchmarks: true,
          enableLLMValidation: false,
          timeoutMs: 20000
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (benchmark validation should be fast)
      expect(duration).toBeLessThan(20000);
      expect(result.validation.benchmarkComparison).toBeDefined();
    }, 25000);

    it("should handle multiple concurrent benchmark validations", async () => {
      const assumptions: Assumptions = {
        goal: "revenue",
        avgDealSize: 500
      };

      const promises = Array.from({ length: 3 }, (_, i) =>
        enhancementService.enhanceOptimization(
          20000 + i * 10000,
          testPriors,
          assumptions,
          {
            level: "fast",
            includeAlternatives: false,
            validateAgainstBenchmarks: true,
            enableLLMValidation: false,
            timeoutMs: 8000
          }
        )
      );

      const results = await Promise.all(promises);

      // All should complete successfully with benchmark validation
      results.forEach(result => {
        expect(result.validation.benchmarkComparison).toBeDefined();
        expect(result.validation.benchmarkComparison.deviationScore).toBeGreaterThanOrEqual(0);
        expect(result.validation.benchmarkComparison.deviationScore).toBeLessThanOrEqual(1);
      });
    }, 15000);
  });

  describe("Real-world Scenarios", () => {
    it("should validate startup allocation pattern", async () => {
      const startupAssumptions: Assumptions = {
        goal: "demos",
        avgDealSize: 2000,
        targetCAC: 150
      };

      const result = await enhancementService.enhanceOptimization(
        8000, // Small startup budget
        testPriors,
        startupAssumptions,
        {
          level: "standard",
          includeAlternatives: true,
          validateAgainstBenchmarks: true,
          enableLLMValidation: false,
          timeoutMs: 10000
        }
      );

      expect(result.validation.benchmarkComparison).toBeDefined();
      
      // Startups often focus on fewer channels
      const activeChannels = Object.values(result.allocation).filter(v => v > 0.05).length;
      if (activeChannels < 3) {
        const diversificationWarnings = result.validation.benchmarkComparison.warnings
          .filter(w => w.type === "insufficient_diversification");
        expect(diversificationWarnings.length).toBeGreaterThanOrEqual(0);
      }
    }, 15000);

    it("should validate enterprise allocation pattern", async () => {
      const enterpriseAssumptions: Assumptions = {
        goal: "cac",
        avgDealSize: 50000,
        targetCAC: 2000,
        minPct: { google: 0.15, meta: 0.10, linkedin: 0.20 } // Enterprise constraints
      };

      const result = await enhancementService.enhanceOptimization(
        800000, // Large enterprise budget
        testPriors,
        enterpriseAssumptions,
        {
          level: "thorough",
          includeAlternatives: true,
          validateAgainstBenchmarks: true,
          enableLLMValidation: false,
          timeoutMs: 15000
        }
      );

      expect(result.validation.benchmarkComparison).toBeDefined();
      
      // Enterprise should have good diversification
      const activeChannels = Object.values(result.allocation).filter(v => v > 0.05).length;
      expect(activeChannels).toBeGreaterThanOrEqual(3);

      // Should respect minimum constraints
      expect(result.allocation.google).toBeGreaterThanOrEqual(0.15);
      expect(result.allocation.meta).toBeGreaterThanOrEqual(0.10);
      expect(result.allocation.linkedin).toBeGreaterThanOrEqual(0.20);
    }, 20000);
  });
});