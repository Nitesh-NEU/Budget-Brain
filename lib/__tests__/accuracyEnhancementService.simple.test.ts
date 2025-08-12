/**
 * Simple tests for AccuracyEnhancementService to verify basic functionality
 */

import { AccuracyEnhancementService } from "../accuracyEnhancementService";
import type { ChannelPriors, Assumptions } from "@/types/shared";

describe("AccuracyEnhancementService Simple Tests", () => {
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
      avgDealSize: 1000
    };
  });

  it("should create service instance", () => {
    expect(service).toBeInstanceOf(AccuracyEnhancementService);
  });

  it("should enhance optimization with fast level", async () => {
    const budget = 10000;
    
    const result = await service.enhanceOptimization(budget, mockPriors, mockAssumptions, {
      level: "fast",
      includeAlternatives: false,
      validateAgainstBenchmarks: false,
      timeoutMs: 5000
    });
    
    expect(result).toHaveProperty("allocation");
    expect(result).toHaveProperty("confidence");
    expect(result).toHaveProperty("validation");
    
    // Check allocation sums to 1
    const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
    expect(allocationSum).toBeCloseTo(1, 5);
    
    // Check confidence is valid
    expect(result.confidence.overall).toBeGreaterThanOrEqual(0);
    expect(result.confidence.overall).toBeLessThanOrEqual(1);
  }, 10000); // 10 second timeout

  it("should handle revenue goal", async () => {
    const budget = 5000;
    const revenueAssumptions: Assumptions = {
      goal: "revenue",
      avgDealSize: 2000
    };
    
    const result = await service.enhanceOptimization(budget, mockPriors, revenueAssumptions, {
      level: "fast",
      includeAlternatives: false,
      validateAgainstBenchmarks: false,
      timeoutMs: 3000
    });
    
    expect(result.objective).toBe("revenue");
    expect(result.allocation).toBeDefined();
    
    const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
    expect(allocationSum).toBeCloseTo(1, 5);
  }, 8000);

  it("should respect basic constraints", async () => {
    const budget = 8000;
    const constrainedAssumptions: Assumptions = {
      goal: "demos",
      minPct: { google: 0.3 },
      maxPct: { tiktok: 0.2 }
    };
    
    const result = await service.enhanceOptimization(budget, mockPriors, constrainedAssumptions, {
      level: "fast",
      includeAlternatives: false,
      validateAgainstBenchmarks: false,
      timeoutMs: 3000
    });
    
    expect(result.allocation.google).toBeGreaterThanOrEqual(0.28); // Allow small tolerance
    expect(result.allocation.tiktok).toBeLessThanOrEqual(0.25); // Allow small tolerance
  }, 8000);
});