/**
 * Integration tests for BayesianOptimizer
 */

import { BayesianOptimizer } from '../bayesianOptimizer';
import { AccuracyEnhancementService } from '../accuracyEnhancementService';
import type { ChannelPriors, Assumptions } from '@/types/shared';

describe('BayesianOptimizer Integration', () => {
  const mockPriors: ChannelPriors = {
    google: { cpm: [12, 25], ctr: [0.025, 0.06], cvr: [0.12, 0.35] },
    meta: { cpm: [9, 18], ctr: [0.018, 0.045], cvr: [0.09, 0.28] },
    tiktok: { cpm: [6, 14], ctr: [0.012, 0.035], cvr: [0.06, 0.22] },
    linkedin: { cpm: [18, 35], ctr: [0.008, 0.025], cvr: [0.18, 0.45] }
  };

  const mockAssumptions: Assumptions = {
    goal: "demos",
    avgDealSize: 1500
  };

  describe('Integration with AccuracyEnhancementService', () => {
    it('should be included in standard enhancement level', async () => {
      const enhancementService = new AccuracyEnhancementService();
      const budget = 15000;

      const result = await enhancementService.enhanceOptimization(
        budget,
        mockPriors,
        mockAssumptions,
        { level: 'standard', includeAlternatives: true, validateAgainstBenchmarks: false }
      );

      expect(result.validation.alternativeAlgorithms).toBeDefined();
      
      // Should include Bayesian optimization results
      const bayesianResult = result.validation.alternativeAlgorithms.find(
        alg => alg.name === "Bayesian Optimization"
      );
      
      expect(bayesianResult).toBeDefined();
      expect(bayesianResult?.allocation).toBeDefined();
      expect(bayesianResult?.confidence).toBeGreaterThan(0);
      expect(bayesianResult?.confidence).toBeLessThanOrEqual(1);
      expect(bayesianResult?.performance).toBeGreaterThan(0);
    });

    it('should be included in thorough enhancement level', async () => {
      const enhancementService = new AccuracyEnhancementService();
      const budget = 20000;

      const result = await enhancementService.enhanceOptimization(
        budget,
        mockPriors,
        mockAssumptions,
        { level: 'thorough', includeAlternatives: true, validateAgainstBenchmarks: false }
      );

      expect(result.validation.alternativeAlgorithms).toBeDefined();
      
      // Should include Bayesian optimization results
      const bayesianResult = result.validation.alternativeAlgorithms.find(
        alg => alg.name === "Bayesian Optimization"
      );
      
      expect(bayesianResult).toBeDefined();
      expect(bayesianResult?.allocation).toBeDefined();
      expect(bayesianResult?.confidence).toBeGreaterThan(0);
      expect(bayesianResult?.performance).toBeGreaterThan(0);
    });

    it('should not be included in fast enhancement level', async () => {
      const enhancementService = new AccuracyEnhancementService();
      const budget = 10000;

      const result = await enhancementService.enhanceOptimization(
        budget,
        mockPriors,
        mockAssumptions,
        { level: 'fast', includeAlternatives: true, validateAgainstBenchmarks: false }
      );

      expect(result.validation.alternativeAlgorithms).toBeDefined();
      
      // Should NOT include Bayesian optimization results in fast mode
      const bayesianResult = result.validation.alternativeAlgorithms.find(
        alg => alg.name === "Bayesian Optimization"
      );
      
      expect(bayesianResult).toBeUndefined();
    });

    it('should contribute to ensemble consensus calculation', async () => {
      const enhancementService = new AccuracyEnhancementService();
      const budget = 12000;

      const result = await enhancementService.enhanceOptimization(
        budget,
        mockPriors,
        mockAssumptions,
        { level: 'standard', includeAlternatives: true, validateAgainstBenchmarks: false }
      );

      expect(result.validation.consensus).toBeDefined();
      expect(result.validation.consensus.agreement).toBeGreaterThan(0);
      expect(result.validation.consensus.agreement).toBeLessThanOrEqual(1);
      
      // Should have multiple algorithms contributing to consensus
      expect(result.validation.alternativeAlgorithms.length).toBeGreaterThan(1);
      
      // Bayesian should be one of them
      const bayesianResult = result.validation.alternativeAlgorithms.find(
        alg => alg.name === "Bayesian Optimization"
      );
      expect(bayesianResult).toBeDefined();
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete within timeout limits', async () => {
      const enhancementService = new AccuracyEnhancementService();
      const budget = 25000;

      const startTime = Date.now();
      
      const result = await enhancementService.enhanceOptimization(
        budget,
        mockPriors,
        mockAssumptions,
        { level: 'standard', includeAlternatives: true, validateAgainstBenchmarks: false }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 15 seconds for standard level)
      expect(duration).toBeLessThan(15000);
      
      // Should still have Bayesian results
      const bayesianResult = result.validation.alternativeAlgorithms.find(
        alg => alg.name === "Bayesian Optimization"
      );
      expect(bayesianResult).toBeDefined();
    });

    it('should handle different optimization goals', async () => {
      const enhancementService = new AccuracyEnhancementService();
      const budget = 18000;

      // Test with revenue goal
      const revenueAssumptions: Assumptions = {
        goal: "revenue",
        avgDealSize: 2500
      };

      const revenueResult = await enhancementService.enhanceOptimization(
        budget,
        mockPriors,
        revenueAssumptions,
        { level: 'standard', includeAlternatives: true, validateAgainstBenchmarks: false }
      );

      const bayesianRevenueResult = revenueResult.validation.alternativeAlgorithms.find(
        alg => alg.name === "Bayesian Optimization"
      );
      expect(bayesianRevenueResult).toBeDefined();

      // Test with CAC goal
      const cacAssumptions: Assumptions = {
        goal: "cac"
      };

      const cacResult = await enhancementService.enhanceOptimization(
        budget,
        mockPriors,
        cacAssumptions,
        { level: 'standard', includeAlternatives: true, validateAgainstBenchmarks: false }
      );

      const bayesianCacResult = cacResult.validation.alternativeAlgorithms.find(
        alg => alg.name === "Bayesian Optimization"
      );
      expect(bayesianCacResult).toBeDefined();

      // Results should be different for different goals
      expect(bayesianRevenueResult?.performance).not.toBe(bayesianCacResult?.performance);
    });

    it('should handle constraints properly', async () => {
      const enhancementService = new AccuracyEnhancementService();
      const budget = 15000;

      const constrainedAssumptions: Assumptions = {
        goal: "demos",
        minPct: {
          google: 0.25,
          meta: 0.15
        },
        maxPct: {
          tiktok: 0.3,
          linkedin: 0.4
        }
      };

      const result = await enhancementService.enhanceOptimization(
        budget,
        mockPriors,
        constrainedAssumptions,
        { level: 'standard', includeAlternatives: true, validateAgainstBenchmarks: false }
      );

      const bayesianResult = result.validation.alternativeAlgorithms.find(
        alg => alg.name === "Bayesian Optimization"
      );

      expect(bayesianResult).toBeDefined();
      
      // Should respect constraints
      expect(bayesianResult!.allocation.google).toBeGreaterThanOrEqual(0.25);
      expect(bayesianResult!.allocation.meta).toBeGreaterThanOrEqual(0.15);
      expect(bayesianResult!.allocation.tiktok).toBeLessThanOrEqual(0.3);
      expect(bayesianResult!.allocation.linkedin).toBeLessThanOrEqual(0.4);
      
      // Should still sum to 1
      const allocationSum = Object.values(bayesianResult!.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 5);
    });
  });

  describe('Comparison with other algorithms', () => {
    it('should provide different results from gradient optimization', async () => {
      const enhancementService = new AccuracyEnhancementService();
      const budget = 20000;

      const result = await enhancementService.enhanceOptimization(
        budget,
        mockPriors,
        mockAssumptions,
        { level: 'standard', includeAlternatives: true, validateAgainstBenchmarks: false }
      );

      const bayesianResult = result.validation.alternativeAlgorithms.find(
        alg => alg.name === "Bayesian Optimization"
      );
      
      const gradientResult = result.validation.alternativeAlgorithms.find(
        alg => alg.name === "Gradient Descent"
      );

      expect(bayesianResult).toBeDefined();
      expect(gradientResult).toBeDefined();

      // Results should be different (different algorithms should explore different solutions)
      const bayesianAllocation = bayesianResult!.allocation;
      const gradientAllocation = gradientResult!.allocation;

      // At least one channel should have different allocation (allowing for small numerical differences)
      const channels: (keyof typeof bayesianAllocation)[] = ['google', 'meta', 'tiktok', 'linkedin'];
      const hasDifference = channels.some(channel => 
        Math.abs(bayesianAllocation[channel] - gradientAllocation[channel]) > 0.01
      );

      expect(hasDifference).toBe(true);
    });

    it('should contribute to improved confidence when algorithms agree', async () => {
      const enhancementService = new AccuracyEnhancementService();
      const budget = 15000;

      // Run with multiple algorithms
      const multiAlgorithmResult = await enhancementService.enhanceOptimization(
        budget,
        mockPriors,
        mockAssumptions,
        { level: 'standard', includeAlternatives: true, validateAgainstBenchmarks: false }
      );

      // Should have multiple algorithms
      expect(multiAlgorithmResult.validation.alternativeAlgorithms.length).toBeGreaterThan(1);
      
      // Should have reasonable consensus metrics
      expect(multiAlgorithmResult.validation.consensus.agreement).toBeGreaterThan(0);
      expect(multiAlgorithmResult.validation.consensus.agreement).toBeLessThanOrEqual(1);
      
      // Overall confidence should be reasonable
      expect(multiAlgorithmResult.confidence.overall).toBeGreaterThan(0);
      expect(multiAlgorithmResult.confidence.overall).toBeLessThanOrEqual(1);
    });
  });
});