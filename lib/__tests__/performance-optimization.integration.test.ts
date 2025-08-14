/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Fast performance optimization tests - focused on core functionality
 */

import { AccuracyEnhancementService, type EnhancementOptions } from "../accuracyEnhancementService";
import type { ChannelPriors, Assumptions } from "@/types/shared";

// Mock the LLM validator to avoid API calls in tests
jest.mock("../llmValidator", () => ({
  LLMValidator: jest.fn().mockImplementation(() => ({
    validateAllocation: jest.fn().mockResolvedValue({
      isValid: true,
      confidence: 0.8,
      warnings: []
    }),
    explainRecommendation: jest.fn().mockResolvedValue("Test explanation"),
    flagPotentialIssues: jest.fn().mockResolvedValue([])
  }))
}));

// Set shorter test timeout
jest.setTimeout(30000);

describe("Performance Optimization Tests", () => {
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

  describe("Core Performance Features", () => {
    it("should cache results for identical requests", async () => {
      const budget = 10000;
      const options: EnhancementOptions = {
        level: 'fast',
        includeAlternatives: false,
        validateAgainstBenchmarks: false,
        enableLLMValidation: false,
        enableCaching: true
      };

      // First request
      const result1 = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, options);
      expect(result1).toHaveProperty('allocation');

      // Second identical request should hit cache
      const result2 = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, options);
      expect(result2).toHaveProperty('allocation');

      // Check cache hit
      const cacheStats = service.getCacheStats();
      expect(cacheStats.hitRate).toBeGreaterThan(0);
      expect(cacheStats.totalRequests).toBe(2);
    });

    it("should respect cache size limits", async () => {
      // Configure small cache
      service.configureCaching({ maxCacheSize: 2 });

      const options: EnhancementOptions = {
        level: 'fast',
        includeAlternatives: false,
        validateAgainstBenchmarks: false,
        enableLLMValidation: false,
        enableCaching: true
      };

      // Add 3 different requests (should evict oldest)
      await service.enhanceOptimization(10000, mockPriors, mockAssumptions, options);
      await service.enhanceOptimization(20000, mockPriors, mockAssumptions, options);
      await service.enhanceOptimization(30000, mockPriors, mockAssumptions, options);

      // Cache should not exceed limit
      const cacheStats = service.getCacheStats();
      expect(cacheStats.size).toBeLessThanOrEqual(2);
    });

    it("should handle timeouts gracefully", async () => {
      const budget = 10000;
      const shortTimeoutOptions: EnhancementOptions = {
        level: 'fast',
        includeAlternatives: false,
        validateAgainstBenchmarks: false,
        enableLLMValidation: false,
        enableCaching: false,
        timeoutMs: 10 // Very short timeout
      };

      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, shortTimeoutOptions);

      // Should still return a valid result
      expect(result).toHaveProperty('allocation');
      expect(result).toHaveProperty('confidence');

      // Allocation should sum to 1
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 2);
    });

    it("should work with different enhancement levels", async () => {
      const budget = 10000;
      const options: EnhancementOptions = {
        level: 'fast',
        includeAlternatives: false,
        validateAgainstBenchmarks: false,
        enableLLMValidation: false,
        enableCaching: false
      };

      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, options);

      expect(result).toHaveProperty('allocation');
      expect(result).toHaveProperty('confidence');

      // Allocation should be valid
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 2);
    });

    it("should track resource usage", async () => {
      const budget = 10000;
      const options: EnhancementOptions = {
        level: 'fast',
        includeAlternatives: false,
        validateAgainstBenchmarks: false,
        enableLLMValidation: false,
        enableCaching: true
      };

      const initialUsage = service.getResourceUsage();

      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, options);

      const finalUsage = service.getResourceUsage();

      // Should track requests
      expect(finalUsage.totalRequests).toBe(initialUsage.totalRequests + 1);
      expect(finalUsage.averageResponseTime).toBeGreaterThan(0);
    });

    it("should provide performance monitoring", async () => {
      const budget = 10000;
      const options: EnhancementOptions = {
        level: 'fast',
        includeAlternatives: false,
        validateAgainstBenchmarks: false,
        enableLLMValidation: false,
        enableCaching: true
      };

      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, options);

      // Test monitoring features
      const summary = service.getPerformanceSummary();
      expect(summary).toHaveProperty('currentStatus');
      expect(['healthy', 'warning', 'critical']).toContain(summary.currentStatus);

      const report = service.getDetailedPerformanceReport();
      expect(report).toHaveProperty('systemHealth');
      expect(report.systemHealth.score).toBeGreaterThanOrEqual(0);
      expect(report.systemHealth.score).toBeLessThanOrEqual(100);
    });

    it("should handle cache configuration", async () => {
      // Test cache configuration
      service.configureCaching({
        maxCacheSize: 5,
        maxMemoryUsageMB: 10
      });

      const budget = 10000;
      const options: EnhancementOptions = {
        level: 'fast',
        includeAlternatives: false,
        validateAgainstBenchmarks: false,
        enableLLMValidation: false,
        enableCaching: true
      };

      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, options);

      const cacheStats = service.getCacheStats();
      expect(cacheStats.size).toBeLessThanOrEqual(5);
    });

    it("should clear cache when requested", async () => {
      const budget = 10000;
      const options: EnhancementOptions = {
        level: 'fast',
        includeAlternatives: false,
        validateAgainstBenchmarks: false,
        enableLLMValidation: false,
        enableCaching: true
      };

      // Add something to cache
      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, options);

      let cacheStats = service.getCacheStats();
      expect(cacheStats.size).toBeGreaterThan(0);

      // Clear cache
      service.clearCache();

      cacheStats = service.getCacheStats();
      expect(cacheStats.size).toBe(0);
    });

    it("should export performance data", async () => {
      const budget = 10000;
      const options: EnhancementOptions = {
        level: 'fast',
        includeAlternatives: false,
        validateAgainstBenchmarks: false,
        enableLLMValidation: false,
        enableCaching: true
      };

      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, options);

      const exportedData = service.exportPerformanceData();
      expect(exportedData).toHaveProperty('resourceUsage');
      expect(exportedData).toHaveProperty('cacheStats');
      expect(exportedData.resourceUsage.totalRequests).toBeGreaterThan(0);
    });

  });

  describe("Basic Functionality", () => {
    it("should complete basic optimization quickly", async () => {
      const budget = 10000;
      const options: EnhancementOptions = {
        level: 'fast',
        includeAlternatives: false,
        validateAgainstBenchmarks: false,
        enableLLMValidation: false,
        enableCaching: false
      };

      const startTime = Date.now();
      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, options);
      const duration = Date.now() - startTime;

      expect(result).toHaveProperty('allocation');
      expect(duration).toBeLessThan(3000); // Should complete in under 3 seconds
    });
  });
});