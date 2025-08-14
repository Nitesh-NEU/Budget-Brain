/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Unit tests for BenchmarkValidator
 */

import { BenchmarkValidator, ValidationContext } from "../benchmarkValidator";
import type { Allocation, ChannelPriors, Assumptions } from "@/types/shared";

describe("BenchmarkValidator", () => {
  let validator: BenchmarkValidator;
  
  const testPriors: ChannelPriors = {
    google: { cpm: [10, 20], ctr: [0.02, 0.05], cvr: [0.02, 0.08] },
    meta: { cpm: [8, 15], ctr: [0.015, 0.04], cvr: [0.015, 0.06] },
    tiktok: { cpm: [5, 12], ctr: [0.01, 0.03], cvr: [0.01, 0.04] },
    linkedin: { cpm: [15, 30], ctr: [0.005, 0.02], cvr: [0.02, 0.10] }
  };

  const testAssumptions: Assumptions = {
    goal: "demos",
    avgDealSize: 1000,
    targetCAC: 200
  };

  beforeEach(() => {
    validator = new BenchmarkValidator();
  });

  describe("validateAllocation", () => {
    it("should validate a reasonable allocation without warnings", () => {
      const reasonableAllocation: Allocation = {
        google: 0.35,
        meta: 0.30,
        tiktok: 0.15,
        linkedin: 0.20
      };

      const result = validator.validateAllocation(reasonableAllocation, testPriors);

      expect(result.deviationScore).toBeLessThan(0.3);
      expect(result.warnings.length).toBe(0);
      expect(result.channelDeviations).toBeDefined();
    });

    it("should detect unrealistic over-concentration", () => {
      const overConcentratedAllocation: Allocation = {
        google: 0.85,
        meta: 0.10,
        tiktok: 0.03,
        linkedin: 0.02
      };

      const result = validator.validateAllocation(overConcentratedAllocation, testPriors);

      expect(result.warnings.some(w => w.type === "portfolio_concentration")).toBe(true);
      expect(result.warnings.some(w => w.type === "unrealistic_allocation")).toBe(true);
      expect(result.deviationScore).toBeGreaterThan(0.4);
    });

    it("should detect insufficient diversification", () => {
      const underdiversifiedAllocation: Allocation = {
        google: 0.95,
        meta: 0.05,
        tiktok: 0.00,
        linkedin: 0.00
      };

      const result = validator.validateAllocation(underdiversifiedAllocation, testPriors);

      expect(result.warnings.some(w => w.type === "insufficient_diversification")).toBe(true);
      expect(result.warnings.some(w => w.type === "portfolio_concentration")).toBe(true);
    });

    it("should detect extreme benchmark deviations", () => {
      const extremeAllocation: Allocation = {
        google: 0.10,
        meta: 0.05,
        tiktok: 0.80,
        linkedin: 0.05
      };

      const result = validator.validateAllocation(extremeAllocation, testPriors);

      expect(result.warnings.some(w => w.type === "extreme_benchmark_deviation")).toBe(true);
      expect(result.warnings.some(w => w.severity === "high")).toBe(true);
      expect(result.deviationScore).toBeGreaterThan(0.6);
    });

    it("should apply industry-specific adjustments", () => {
      const allocation: Allocation = {
        google: 0.30,
        meta: 0.25,
        tiktok: 0.10,
        linkedin: 0.35
      };

      const b2bContext: ValidationContext = {
        budget: 50000,
        assumptions: { ...testAssumptions, goal: "cac", targetCAC: 600 },
        industryType: "b2b",
        companySize: "medium"
      };

      const result = validator.validateAllocation(allocation, testPriors, b2bContext);

      // B2B context should be more tolerant of higher LinkedIn allocation
      expect(result.deviationScore).toBeLessThan(0.4);
    });

    it("should detect goal-channel mismatches", () => {
      const allocation: Allocation = {
        google: 0.20,
        meta: 0.30,
        tiktok: 0.45,
        linkedin: 0.05
      };

      const b2bCacContext: ValidationContext = {
        budget: 30000,
        assumptions: { ...testAssumptions, goal: "cac", targetCAC: 400 },
        industryType: "b2b",
        companySize: "medium"
      };

      const result = validator.validateAllocation(allocation, testPriors, b2bCacContext);

      expect(result.warnings.some(w => w.type === "goal_channel_mismatch")).toBe(true);
    });

    it("should handle zero allocations appropriately", () => {
      const zeroAllocation: Allocation = {
        google: 0.50,
        meta: 0.50,
        tiktok: 0.00,
        linkedin: 0.00
      };

      const result = validator.validateAllocation(zeroAllocation, testPriors);

      expect(result.warnings.some(w => w.type === "insufficient_diversification")).toBe(true);
      expect(result.deviationScore).toBeGreaterThanOrEqual(0);
      expect(result.deviationScore).toBeLessThanOrEqual(1);
    });
  });

  describe("getIndustryRecommendations", () => {
    it("should return B2B recommendations", () => {
      const recommendations = validator.getIndustryRecommendations("b2b");

      expect(recommendations).toBeDefined();
      expect(recommendations!.linkedin).toBeGreaterThan(0.25); // B2B should favor LinkedIn
      expect(recommendations!.tiktok).toBeLessThan(0.10); // B2B should minimize TikTok
    });

    it("should return e-commerce recommendations", () => {
      const recommendations = validator.getIndustryRecommendations("ecommerce");

      expect(recommendations).toBeDefined();
      expect(recommendations!.google).toBeGreaterThan(0.40); // E-commerce should favor Google
      expect(recommendations!.linkedin).toBeLessThan(0.10); // E-commerce should minimize LinkedIn
    });

    it("should return null for unknown industry", () => {
      const recommendations = validator.getIndustryRecommendations("unknown");

      expect(recommendations).toBeNull();
    });
  });

  describe("updateThresholds", () => {
    it("should update validation thresholds", () => {
      const strictThresholds = {
        deviationWarning: 0.10,
        extremeDeviation: 0.20
      };

      validator.updateThresholds(strictThresholds);

      const allocation: Allocation = {
        google: 0.45, // Slightly higher than typical
        meta: 0.25,
        tiktok: 0.15,
        linkedin: 0.15
      };

      const result = validator.validateAllocation(allocation, testPriors);

      // With stricter thresholds, should generate more warnings
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("addIndustryBenchmarks", () => {
    it("should add custom industry benchmarks", () => {
      const customAdjustments = {
        google: 0.20,
        meta: -0.10,
        tiktok: -0.05,
        linkedin: -0.05
      };

      validator.addIndustryBenchmarks("custom_industry", customAdjustments);

      const recommendations = validator.getIndustryRecommendations("custom_industry");

      expect(recommendations).toBeDefined();
      expect(recommendations!.google).toBeGreaterThan(0.50); // Should reflect the +0.20 adjustment
    });
  });

  describe("edge cases", () => {
    it("should handle extreme priors gracefully", () => {
      const extremePriors: ChannelPriors = {
        google: { cpm: [1, 2], ctr: [0.001, 0.002], cvr: [0.001, 0.002] },
        meta: { cpm: [100, 200], ctr: [0.1, 0.2], cvr: [0.1, 0.2] },
        tiktok: { cpm: [50, 100], ctr: [0.05, 0.1], cvr: [0.05, 0.1] },
        linkedin: { cpm: [200, 400], ctr: [0.001, 0.005], cvr: [0.2, 0.4] }
      };

      const allocation: Allocation = {
        google: 0.25,
        meta: 0.25,
        tiktok: 0.25,
        linkedin: 0.25
      };

      const result = validator.validateAllocation(allocation, extremePriors);

      expect(result.deviationScore).toBeGreaterThanOrEqual(0);
      expect(result.deviationScore).toBeLessThanOrEqual(1);
      expect(result.channelDeviations).toBeDefined();
    });

    it("should handle very small budgets", () => {
      const smallBudgetContext: ValidationContext = {
        budget: 100,
        assumptions: testAssumptions,
        companySize: "small"
      };

      const allocation: Allocation = {
        google: 0.60,
        meta: 0.40,
        tiktok: 0.00,
        linkedin: 0.00
      };

      const result = validator.validateAllocation(allocation, testPriors, smallBudgetContext);

      // Small budgets might justify less diversification
      expect(result.deviationScore).toBeGreaterThanOrEqual(0);
      expect(result.warnings.some(w => w.type === "insufficient_diversification")).toBe(true);
    });

    it("should handle large budgets", () => {
      const largeBudgetContext: ValidationContext = {
        budget: 1000000,
        assumptions: testAssumptions,
        companySize: "large"
      };

      const allocation: Allocation = {
        google: 0.90,
        meta: 0.10,
        tiktok: 0.00,
        linkedin: 0.00
      };

      const result = validator.validateAllocation(allocation, testPriors, largeBudgetContext);

      // Large budgets should encourage diversification
      expect(result.warnings.some(w => w.type === "portfolio_concentration")).toBe(true);
      expect(result.warnings.some(w => w.type === "insufficient_diversification")).toBe(true);
    });
  });

  describe("warning severity levels", () => {
    it("should assign appropriate severity levels", () => {
      const extremeAllocation: Allocation = {
        google: 0.95,
        meta: 0.03,
        tiktok: 0.01,
        linkedin: 0.01
      };

      const result = validator.validateAllocation(extremeAllocation, testPriors);

      const highSeverityWarnings = result.warnings.filter(w => w.severity === "high");
      const mediumSeverityWarnings = result.warnings.filter(w => w.severity === "medium");

      expect(highSeverityWarnings.length).toBeGreaterThan(0);
      expect(mediumSeverityWarnings.length).toBeGreaterThanOrEqual(0);
    });

    it("should provide channel-specific warnings", () => {
      const unbalancedAllocation: Allocation = {
        google: 0.80,
        meta: 0.15,
        tiktok: 0.03,
        linkedin: 0.02
      };

      const result = validator.validateAllocation(unbalancedAllocation, testPriors);

      const googleWarnings = result.warnings.filter(w => w.channel === "google");
      const tiktokWarnings = result.warnings.filter(w => w.channel === "tiktok");
      const linkedinWarnings = result.warnings.filter(w => w.channel === "linkedin");

      expect(googleWarnings.length).toBeGreaterThan(0); // Should warn about over-allocation
      expect(tiktokWarnings.length + linkedinWarnings.length).toBeGreaterThan(0); // Should warn about under-allocation
    });
  });
});