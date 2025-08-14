/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Simple performance optimization tests - minimal and fast
 */

import { AccuracyEnhancementService } from "../accuracyEnhancementService";

// Mock the LLM validator to avoid API calls
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

describe("Performance Optimization - Simple Tests", () => {
  let service: AccuracyEnhancementService;

  beforeEach(() => {
    service = new AccuracyEnhancementService();
  });

  it("should have caching functionality", () => {
    // Test cache configuration
    service.configureCaching({ maxCacheSize: 10 });
    
    const stats = service.getCacheStats();
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('hitRate');
    expect(stats).toHaveProperty('totalRequests');
  });

  it("should have resource monitoring", () => {
    const usage = service.getResourceUsage();
    expect(usage).toHaveProperty('memoryUsageMB');
    expect(usage).toHaveProperty('activeOperations');
    expect(usage).toHaveProperty('cacheHitRate');
    expect(usage).toHaveProperty('averageResponseTime');
    expect(usage).toHaveProperty('totalRequests');
  });

  it("should have performance monitoring", () => {
    const summary = service.getPerformanceSummary();
    expect(summary).toHaveProperty('currentStatus');
    expect(['healthy', 'warning', 'critical']).toContain(summary.currentStatus);
    
    const report = service.getDetailedPerformanceReport();
    expect(report).toHaveProperty('systemHealth');
    expect(report.systemHealth.score).toBeGreaterThanOrEqual(0);
    expect(report.systemHealth.score).toBeLessThanOrEqual(100);
  });

  it("should support cache clearing", () => {
    service.clearCache();
    const stats = service.getCacheStats();
    expect(stats.size).toBe(0);
  });

  it("should support performance data export", () => {
    const data = service.exportPerformanceData();
    expect(data).toHaveProperty('resourceUsage');
    expect(data).toHaveProperty('cacheStats');
  });

  it("should support performance monitoring reset", () => {
    service.resetPerformanceMonitoring();
    const usage = service.getResourceUsage();
    expect(usage.totalRequests).toBe(0);
  });

  it("should support performance threshold configuration", () => {
    service.configurePerformanceThresholds({
      memoryUsageMB: 100,
      averageResponseTimeMs: 2000
    });
    
    // Should not throw error
    expect(true).toBe(true);
  });
});