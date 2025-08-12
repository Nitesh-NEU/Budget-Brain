/**
 * Unit tests for BayesianOptimizer
 */

import { BayesianOptimizer } from '../bayesianOptimizer';
import type { ChannelPriors, Assumptions } from '@/types/shared';

describe('BayesianOptimizer', () => {
  const mockPriors: ChannelPriors = {
    google: { cpm: [10, 20], ctr: [0.02, 0.05], cvr: [0.1, 0.3] },
    meta: { cpm: [8, 15], ctr: [0.015, 0.04], cvr: [0.08, 0.25] },
    tiktok: { cpm: [5, 12], ctr: [0.01, 0.03], cvr: [0.05, 0.2] },
    linkedin: { cpm: [15, 30], ctr: [0.005, 0.02], cvr: [0.15, 0.4] }
  };

  const mockAssumptions: Assumptions = {
    goal: "demos",
    avgDealSize: 1000
  };

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const optimizer = new BayesianOptimizer();
      expect(optimizer).toBeInstanceOf(BayesianOptimizer);
    });

    it('should initialize with custom options', () => {
      const options = {
        maxIterations: 30,
        acquisitionFunction: 'ucb' as const,
        explorationWeight: 1.5,
        kernelLengthScale: 0.2,
        kernelVariance: 2.0,
        noiseVariance: 0.05
      };
      
      const optimizer = new BayesianOptimizer(options);
      expect(optimizer).toBeInstanceOf(BayesianOptimizer);
    });
  });

  describe('optimize', () => {
    it('should return valid optimization result for demos goal', () => {
      const optimizer = new BayesianOptimizer({ maxIterations: 10 });
      const budget = 10000;
      
      const result = optimizer.optimize(budget, mockPriors, mockAssumptions);
      
      expect(result).toHaveProperty('allocation');
      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('iterations');
      expect(result).toHaveProperty('acquisitionValues');
      expect(result).toHaveProperty('posteriorMean');
      expect(result).toHaveProperty('posteriorVariance');
      
      // Check allocation sums to 1
      const allocationSum = Object.values(result.allocation).reduce((sum, val) => sum + val, 0);
      expect(allocationSum).toBeCloseTo(1, 5);
      
      // Check all allocations are non-negative
      Object.values(result.allocation).forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
      });
      
      expect(result.performance).toBeGreaterThan(0);
      expect(result.iterations).toBe(10);
      expect(result.acquisitionValues).toHaveLength(10);
    });

    it('should return valid optimization result for revenue goal', () => {
      const revenueAssumptions: Assumptions = {
        goal: "revenue",
        avgDealSize: 2000
      };
      
      const optimizer = new BayesianOptimizer({ maxIterations: 5 });
      const budget = 5000;
      
      const result = optimizer.optimize(budget, mockPriors, revenueAssumptions);
      
      expect(result.allocation).toBeDefined();
      expect(result.performance).toBeGreaterThan(0);
      
      // Revenue should be higher than demos due to deal size multiplier
      const demosResult = optimizer.optimize(budget, mockPriors, mockAssumptions);
      expect(result.performance).toBeGreaterThan(demosResult.performance);
    });

    it('should return valid optimization result for CAC goal', () => {
      const cacAssumptions: Assumptions = {
        goal: "cac"
      };
      
      const optimizer = new BayesianOptimizer({ maxIterations: 5 });
      const budget = 8000;
      
      const result = optimizer.optimize(budget, mockPriors, cacAssumptions);
      
      expect(result.allocation).toBeDefined();
      expect(result.performance).toBeGreaterThan(0);
      
      // CAC should be reasonable (budget / conversions)
      expect(result.performance).toBeLessThan(budget); // CAC should be less than total budget
    });

    it('should respect minimum percentage constraints', () => {
      const constrainedAssumptions: Assumptions = {
        goal: "demos",
        minPct: {
          google: 0.3,
          meta: 0.2
        }
      };
      
      const optimizer = new BayesianOptimizer({ maxIterations: 5 });
      const budget = 10000;
      
      const result = optimizer.optimize(budget, mockPriors, constrainedAssumptions);
      
      expect(result.allocation.google).toBeGreaterThanOrEqual(0.3);
      expect(result.allocation.meta).toBeGreaterThanOrEqual(0.2);
    });

    it('should respect maximum percentage constraints', () => {
      const constrainedAssumptions: Assumptions = {
        goal: "demos",
        maxPct: {
          google: 0.4,
          meta: 0.3
        }
      };
      
      const optimizer = new BayesianOptimizer({ maxIterations: 5 });
      const budget = 10000;
      
      const result = optimizer.optimize(budget, mockPriors, constrainedAssumptions);
      
      expect(result.allocation.google).toBeLessThanOrEqual(0.4);
      expect(result.allocation.meta).toBeLessThanOrEqual(0.3);
    });

    it('should respect both min and max constraints', () => {
      const constrainedAssumptions: Assumptions = {
        goal: "demos",
        minPct: {
          google: 0.2,
          linkedin: 0.1
        },
        maxPct: {
          google: 0.5,
          meta: 0.4
        }
      };
      
      const optimizer = new BayesianOptimizer({ maxIterations: 5 });
      const budget = 10000;
      
      const result = optimizer.optimize(budget, mockPriors, constrainedAssumptions);
      
      expect(result.allocation.google).toBeGreaterThanOrEqual(0.2);
      expect(result.allocation.google).toBeLessThanOrEqual(0.5);
      expect(result.allocation.linkedin).toBeGreaterThanOrEqual(0.1);
      expect(result.allocation.meta).toBeLessThanOrEqual(0.4);
    });
  });

  describe('acquisition functions', () => {
    it('should work with Expected Improvement acquisition function', () => {
      const optimizer = new BayesianOptimizer({ 
        maxIterations: 5,
        acquisitionFunction: 'ei'
      });
      const budget = 10000;
      
      const result = optimizer.optimize(budget, mockPriors, mockAssumptions);
      
      expect(result.allocation).toBeDefined();
      expect(result.performance).toBeGreaterThan(0);
    });

    it('should work with Upper Confidence Bound acquisition function', () => {
      const optimizer = new BayesianOptimizer({ 
        maxIterations: 5,
        acquisitionFunction: 'ucb',
        explorationWeight: 1.0
      });
      const budget = 10000;
      
      const result = optimizer.optimize(budget, mockPriors, mockAssumptions);
      
      expect(result.allocation).toBeDefined();
      expect(result.performance).toBeGreaterThan(0);
    });

    it('should work with Probability of Improvement acquisition function', () => {
      const optimizer = new BayesianOptimizer({ 
        maxIterations: 5,
        acquisitionFunction: 'pi'
      });
      const budget = 10000;
      
      const result = optimizer.optimize(budget, mockPriors, mockAssumptions);
      
      expect(result.allocation).toBeDefined();
      expect(result.performance).toBeGreaterThan(0);
    });
  });

  describe('toAlgorithmResult', () => {
    it('should convert optimization result to AlgorithmResult format', () => {
      const optimizer = new BayesianOptimizer({ maxIterations: 5 });
      const budget = 10000;
      
      const result = optimizer.optimize(budget, mockPriors, mockAssumptions);
      const algorithmResult = optimizer.toAlgorithmResult(result);
      
      expect(algorithmResult).toHaveProperty('name', 'Bayesian Optimization');
      expect(algorithmResult).toHaveProperty('allocation');
      expect(algorithmResult).toHaveProperty('confidence');
      expect(algorithmResult).toHaveProperty('performance');
      
      expect(algorithmResult.confidence).toBeGreaterThan(0);
      expect(algorithmResult.confidence).toBeLessThanOrEqual(1);
      expect(algorithmResult.performance).toBe(result.performance);
      expect(algorithmResult.allocation).toEqual(result.allocation);
    });

    it('should calculate confidence based on posterior variance', () => {
      const optimizer = new BayesianOptimizer({ 
        maxIterations: 10,
        noiseVariance: 0.001 // Lower noise should lead to higher confidence
      });
      const budget = 10000;
      
      const result = optimizer.optimize(budget, mockPriors, mockAssumptions);
      const algorithmResult = optimizer.toAlgorithmResult(result);
      
      expect(algorithmResult.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('edge cases', () => {
    it('should handle small budgets', () => {
      const optimizer = new BayesianOptimizer({ maxIterations: 3 });
      const budget = 100;
      
      const result = optimizer.optimize(budget, mockPriors, mockAssumptions);
      
      expect(result.allocation).toBeDefined();
      expect(result.performance).toBeGreaterThan(0);
    });

    it('should handle large budgets', () => {
      const optimizer = new BayesianOptimizer({ maxIterations: 3 });
      const budget = 1000000;
      
      const result = optimizer.optimize(budget, mockPriors, mockAssumptions);
      
      expect(result.allocation).toBeDefined();
      expect(result.performance).toBeGreaterThan(0);
    });

    it('should handle tight constraints', () => {
      const tightConstraints: Assumptions = {
        goal: "demos",
        minPct: {
          google: 0.4,
          meta: 0.3,
          tiktok: 0.2,
          linkedin: 0.1
        }
      };
      
      const optimizer = new BayesianOptimizer({ maxIterations: 3 });
      const budget = 10000;
      
      const result = optimizer.optimize(budget, mockPriors, tightConstraints);
      
      expect(result.allocation).toBeDefined();
      expect(result.performance).toBeGreaterThan(0);
      
      // Should respect all minimum constraints
      expect(result.allocation.google).toBeGreaterThanOrEqual(0.4);
      expect(result.allocation.meta).toBeGreaterThanOrEqual(0.3);
      expect(result.allocation.tiktok).toBeGreaterThanOrEqual(0.2);
      expect(result.allocation.linkedin).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('deterministic behavior', () => {
    it('should produce consistent results with same random seed approach', () => {
      // Note: Since we're using Math.random(), results won't be identical
      // but should be reasonable and valid
      const optimizer1 = new BayesianOptimizer({ maxIterations: 5 });
      const optimizer2 = new BayesianOptimizer({ maxIterations: 5 });
      const budget = 10000;
      
      const result1 = optimizer1.optimize(budget, mockPriors, mockAssumptions);
      const result2 = optimizer2.optimize(budget, mockPriors, mockAssumptions);
      
      // Both should be valid results
      expect(result1.allocation).toBeDefined();
      expect(result2.allocation).toBeDefined();
      expect(result1.performance).toBeGreaterThan(0);
      expect(result2.performance).toBeGreaterThan(0);
      
      // Both should sum to 1
      const sum1 = Object.values(result1.allocation).reduce((a, b) => a + b, 0);
      const sum2 = Object.values(result2.allocation).reduce((a, b) => a + b, 0);
      expect(sum1).toBeCloseTo(1, 5);
      expect(sum2).toBeCloseTo(1, 5);
    });
  });

  describe('performance characteristics', () => {
    it('should complete optimization within reasonable time', () => {
      const optimizer = new BayesianOptimizer({ maxIterations: 20 });
      const budget = 10000;
      
      const startTime = Date.now();
      const result = optimizer.optimize(budget, mockPriors, mockAssumptions);
      const endTime = Date.now();
      
      expect(result.allocation).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should show improvement over iterations', () => {
      const optimizer = new BayesianOptimizer({ maxIterations: 15 });
      const budget = 10000;
      
      const result = optimizer.optimize(budget, mockPriors, mockAssumptions);
      
      expect(result.acquisitionValues).toHaveLength(15);
      expect(result.performance).toBeGreaterThan(0);
      
      // Acquisition values should generally be positive (indicating potential improvement)
      const positiveAcquisitions = result.acquisitionValues.filter(val => val > 0).length;
      expect(positiveAcquisitions).toBeGreaterThan(0);
    });
  });
});