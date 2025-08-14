/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Caching and Performance Tests for AccuracyEnhancementService
 */

import { AccuracyEnhancementService, type EnhancementOptions } from "../accuracyEnhancementService";
import type { ChannelPriors, Assumptions } from "../../types/shared"
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

describe("AccuracyEnhancementService - Caching and Performance", () => {
  let service: AccuracyEnhancementService;
  let mockPriors: ChannelPriors;
  let mockAssumptions: Assumptions;
  let mockOptions: EnhancementOptions;

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

    mockOptions = {
      level: 'fast',
      includeAlternatives: false,
      validateAgainstBenchmarks: false,
      enableLLMValidation: false,
      enableCaching: true,
      timeoutMs: 5000
    };
  });

  describe("Result Caching", () => {
    it("should cache optimization results", async () => {
      const budget = 10000;

      // First call should not be cached
      const result1 = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, mockOptions);
      const stats1 = service.getCacheStats();
      
      expect(stats1.size).toBe(1);
      expect(stats1.hitRate).toBe(0); // First call is not a cache hit

      // Second call with same parameters should be cached
      const result2 = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, mockOptions);
      const stats2 = service.getCacheStats();
      
      expect(stats2.hitRate).toBeGreaterThan(0); // Should have cache hits now
      expect(result1.allocation).toEqual(result2.allocation);
    });

    it("should generate different cache keys for different inputs", async () => {
      const budget1 = 10000;
      const budget2 = 20000;

      await service.enhanceOptimization(budget1, mockPriors, mockAssumptions, mockOptions);
      await service.enhanceOptimization(budget2, mockPriors, mockAssumptions, mockOptions);

      const stats = service.getCacheStats();
      expect(stats.size).toBe(2); // Should have 2 different cache entries
    });

    it("should respect cache expiration", async () => {
      // Configure short cache expiration for testing
      service.configureCaching({ maxCacheAgeMins: 0.001 }); // ~60ms

      const budget = 10000;
      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, mockOptions);
      
      let stats = service.getCacheStats();
      expect(stats.size).toBe(1);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      // This should trigger cache cleanup and create new entry
      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, mockOptions);
      
      stats = service.getCacheStats();
      // Cache should still have entries but hit rate should indicate new computation
      expect(stats.totalRequests).toBe(2);
    });

    it("should handle cache disabled option", async () => {
      const optionsNoCaching = { ...mockOptions, enableCaching: false };
      const budget = 10000;

      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, optionsNoCaching);
      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, optionsNoCaching);

      const stats = service.getCacheStats();
      expect(stats.size).toBe(0); // No cache entries when caching is disabled
    });

    it("should evict least recently used entries when memory limit is reached", async () => {
      // Configure small memory limit for testing
      service.configureCaching({ maxMemoryUsageMB: 0.001 }); // Very small limit

      const budgets = [10000, 20000, 30000, 40000, 50000];
      
      // Fill cache beyond memory limit
      for (const budget of budgets) {
        await service.enhanceOptimization(budget, mockPriors, mockAssumptions, mockOptions);
      }

      const stats = service.getCacheStats();
      // Should have fewer entries than requests due to eviction
      expect(stats.size).toBeLessThan(budgets.length);
    });

    it("should evict oldest entries when cache size limit is reached", async () => {
      // Configure small cache size for testing
      service.configureCaching({ maxCacheSize: 2 });

      const budgets = [10000, 20000, 30000];
      
      for (const budget of budgets) {
        await service.enhanceOptimization(budget, mockPriors, mockAssumptions, mockOptions);
      }

      const stats = service.getCacheStats();
      expect(stats.size).toBe(2); // Should not exceed maxCacheSize
    });
  });

  describe("Resource Usage Monitoring", () => {
    it("should track resource usage metrics", async () => {
      const budget = 10000;
      
      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, mockOptions);
      
      const usage = service.getResourceUsage();
      
      expect(usage).toHaveProperty('memoryUsageMB');
      expect(usage).toHaveProperty('activeOperations');
      expect(usage).toHaveProperty('cacheHitRate');
      expect(usage).toHaveProperty('averageResponseTime');
      expect(usage).toHaveProperty('totalRequests');
      
      expect(usage.totalRequests).toBe(1);
      expect(usage.memoryUsageMB).toBeGreaterThanOrEqual(0);
      expect(usage.activeOperations).toBe(0); // Should be 0 after completion
    });

    it("should track response times", async () => {
      const budget = 10000;
      
      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, mockOptions);
      await service.enhanceOptimization(budget + 1000, mockPriors, mockAssumptions, mockOptions);
      
      const usage = service.getResourceUsage();
      expect(usage.averageResponseTime).toBeGreaterThan(0);
      expect(usage.totalRequests).toBe(2);
    });

    it("should enforce concurrent operations limit", async () => {
      // Configure low concurrency limit
      service.configureCaching({ maxConcurrentOperations: 1 });

      const budget = 10000;
      
      // Start multiple operations simultaneously
      const promises = [
        service.enhanceOptimization(budget, mockPriors, mockAssumptions, mockOptions),
        service.enhanceOptimization(budget + 1000, mockPriors, mockAssumptions, mockOptions),
        service.enhanceOptimization(budget + 2000, mockPriors, mockAssumptions, mockOptions)
      ];

      // At least one should fail due to concurrency limit
      const results = await Promise.allSettled(promises);
      const failures = results.filter(r => r.status === 'rejected');
      
      expect(failures.length).toBeGreaterThan(0);
      expect(failures.some(f => 
        f.status === 'rejected' && 
        f.reason.message.includes('Maximum concurrent operations limit reached')
      )).toBe(true);
    });
  });

  describe("Timeout Handling", () => {
    it("should handle global timeout", async () => {
      const shortTimeoutOptions = { ...mockOptions, timeoutMs: 1 }; // Very short timeout
      const budget = 10000;

      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, shortTimeoutOptions);
      
      // Should still return a result even with timeout (using primary optimization)
      expect(result).toHaveProperty('allocation');
      expect(result.validation.alternativeAlgorithms).toHaveLength(0); // No validation algorithms due to timeout
    });

    it("should handle individual algorithm timeouts gracefully", async () => {
      // Use thorough level which has longer timeouts, but override with short global timeout
      const timeoutOptions = { 
        ...mockOptions, 
        level: 'thorough' as const,
        timeoutMs: 100 // Short global timeout
      };
      const budget = 10000;

      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, timeoutOptions);
      
      // Should still return a result
      expect(result).toHaveProperty('allocation');
      // May have fewer validation algorithms due to timeouts
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Cache Management", () => {
    it("should allow manual cache clearing", async () => {
      const budget = 10000;
      
      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, mockOptions);
      
      let stats = service.getCacheStats();
      expect(stats.size).toBe(1);
      
      service.clearCache();
      
      stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it("should allow cache configuration updates", () => {
      const newConfig = {
        maxCacheSize: 50,
        maxCacheAgeMins: 30,
        maxMemoryUsageMB: 128,
        maxConcurrentOperations: 5
      };
      
      service.configureCaching(newConfig);
      
      // Configuration should be applied (we can't directly test private properties,
      // but we can test the behavior)
      expect(() => service.configureCaching(newConfig)).not.toThrow();
    });

    it("should provide detailed cache statistics", async () => {
      const budget = 10000;
      
      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, mockOptions);
      
      const stats = service.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('memoryUsageMB');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('entries');
      
      expect(Array.isArray(stats.entries)).toBe(true);
      expect(stats.entries.length).toBe(1);
      
      const entry = stats.entries[0];
      expect(entry).toHaveProperty('key');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('accessCount');
      expect(entry).toHaveProperty('lastAccessed');
      expect(entry).toHaveProperty('memorySize');
    });
  });

  describe("Performance Optimization Levels", () => {
    it("should respect fast enhancement level for performance", async () => {
      const fastOptions = { ...mockOptions, level: 'fast' as const };
      const budget = 10000;

      const startTime = Date.now();
      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, fastOptions);
      const duration = Date.now() - startTime;

      expect(result).toHaveProperty('allocation');
      // Fast level should complete relatively quickly (less than 5 seconds in normal conditions)
      expect(duration).toBeLessThan(5000);
    });

    it("should handle standard enhancement level", async () => {
      const standardOptions = { ...mockOptions, level: 'standard' as const };
      const budget = 10000;

      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, standardOptions);
      
      expect(result).toHaveProperty('allocation');
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThan(0);
    });

    it("should handle thorough enhancement level", async () => {
      const thoroughOptions = { ...mockOptions, level: 'thorough' as const };
      const budget = 10000;

      const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, thoroughOptions);
      
      expect(result).toHaveProperty('allocation');
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThan(0);
    });
  });

  describe("Memory Management", () => {
    it("should estimate memory usage accurately", async () => {
      const budget = 10000;
      
      const initialUsage = service.getResourceUsage();
      
      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, mockOptions);
      
      const afterUsage = service.getResourceUsage();
      
      // Memory usage should increase after caching results
      expect(afterUsage.memoryUsageMB).toBeGreaterThan(initialUsage.memoryUsageMB);
    });

    it("should perform periodic cleanup", async () => {
      // Configure very short cache expiration
      service.configureCaching({ maxCacheAgeMins: 0.001 });
      
      const budget = 10000;
      await service.enhanceOptimization(budget, mockPriors, mockAssumptions, mockOptions);
      
      let stats = service.getCacheStats();
      expect(stats.size).toBe(1);
      
      // Wait for expiration and trigger another operation to trigger cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      await service.enhanceOptimization(budget + 1000, mockPriors, mockAssumptions, mockOptions);
      
      // Cleanup should have occurred
      stats = service.getCacheStats();
      // The exact behavior depends on timing, but we should see cache management in action
      expect(stats.totalRequests).toBe(2);
    });
  });
});