/**
 * Unit tests for EnsembleService
 * Tests algorithm result combination, consensus calculation, and outlier detection
 */

import { EnsembleService } from "../ensembleService";
import type { AlgorithmResult, Allocation } from "@/types/shared";

describe("EnsembleService", () => {
  let ensembleService: EnsembleService;

  beforeEach(() => {
    ensembleService = new EnsembleService();
  });

  describe("combineResults", () => {
    it("should throw error for empty results array", () => {
      expect(() => ensembleService.combineResults([])).toThrow("Cannot combine empty results array");
    });

    it("should handle single result correctly", () => {
      const singleResult: AlgorithmResult = {
        name: "Test Algorithm",
        allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
        confidence: 0.8,
        performance: 100
      };

      const result = ensembleService.combineResults([singleResult]);

      expect(result.finalAllocation).toEqual(singleResult.allocation);
      expect(result.consensus.agreement).toBe(1.0);
      expect(result.weightedPerformance).toBe(100);
      expect(result.outliers).toHaveLength(0);
    });

    it("should combine multiple similar results with high consensus", () => {
      const results: AlgorithmResult[] = [
        {
          name: "Algorithm 1",
          allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.8,
          performance: 100
        },
        {
          name: "Algorithm 2", 
          allocation: { google: 0.42, meta: 0.28, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.9,
          performance: 105
        }
      ];

      const result = ensembleService.combineResults(results);

      expect(result.consensus.agreement).toBeGreaterThan(0.8);
      expect(result.outliers).toHaveLength(0);
      expect(result.finalAllocation.google).toBeCloseTo(0.41, 1);
      expect(result.weightedPerformance).toBeCloseTo(102.65, 1);
    });

    it("should detect and handle outliers", () => {
      const results: AlgorithmResult[] = [
        {
          name: "Algorithm 1",
          allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.8,
          performance: 100
        },
        {
          name: "Algorithm 2",
          allocation: { google: 0.42, meta: 0.28, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.9,
          performance: 105
        },
        {
          name: "Outlier Algorithm",
          allocation: { google: 0.1, meta: 0.1, tiktok: 0.1, linkedin: 0.7 },
          confidence: 0.5,
          performance: 50
        }
      ];

      const result = ensembleService.combineResults(results);

      expect(result.outliers).toHaveLength(1);
      expect(result.outliers[0].name).toBe("Outlier Algorithm");
      expect(result.warnings.some(w => w.type === "outlier_detected")).toBe(true);
    });
  });

  describe("calculateConsensus", () => {
    it("should throw error for empty allocations array", () => {
      expect(() => ensembleService.calculateConsensus([])).toThrow("Cannot calculate consensus for empty allocations array");
    });

    it("should return perfect consensus for single allocation", () => {
      const allocation: Allocation = { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 };
      const consensus = ensembleService.calculateConsensus([allocation]);

      expect(consensus.agreement).toBe(1.0);
      expect(consensus.variance.google).toBe(0);
      expect(consensus.outlierCount).toBe(0);
    });

    it("should calculate high agreement for similar allocations", () => {
      const allocations: Allocation[] = [
        { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
        { google: 0.42, meta: 0.28, tiktok: 0.2, linkedin: 0.1 },
        { google: 0.38, meta: 0.32, tiktok: 0.2, linkedin: 0.1 }
      ];

      const consensus = ensembleService.calculateConsensus(allocations);

      expect(consensus.agreement).toBeGreaterThan(0.8);
      expect(consensus.variance.google).toBeLessThan(0.01);
      expect(consensus.outlierCount).toBe(0);
    });

    it("should calculate low agreement for dissimilar allocations", () => {
      const allocations: Allocation[] = [
        { google: 0.7, meta: 0.1, tiktok: 0.1, linkedin: 0.1 },
        { google: 0.1, meta: 0.7, tiktok: 0.1, linkedin: 0.1 },
        { google: 0.1, meta: 0.1, tiktok: 0.7, linkedin: 0.1 }
      ];

      const consensus = ensembleService.calculateConsensus(allocations);

      expect(consensus.agreement).toBeLessThan(0.5);
      expect(consensus.variance.google).toBeGreaterThan(0.05);
    });
  });

  describe("detectOutliers", () => {
    it("should return no outliers for small result sets", () => {
      const results: AlgorithmResult[] = [
        {
          name: "Algorithm 1",
          allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.8,
          performance: 100
        },
        {
          name: "Algorithm 2",
          allocation: { google: 0.42, meta: 0.28, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.9,
          performance: 105
        }
      ];

      const analysis = ensembleService.detectOutliers(results);

      expect(analysis.outliers).toHaveLength(0);
    });

    it("should detect clear outliers", () => {
      const results: AlgorithmResult[] = [
        {
          name: "Algorithm 1",
          allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.8,
          performance: 100
        },
        {
          name: "Algorithm 2",
          allocation: { google: 0.42, meta: 0.28, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.9,
          performance: 105
        },
        {
          name: "Algorithm 3",
          allocation: { google: 0.38, meta: 0.32, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.85,
          performance: 102
        },
        {
          name: "Outlier",
          allocation: { google: 0.1, meta: 0.1, tiktok: 0.1, linkedin: 0.7 },
          confidence: 0.5,
          performance: 50
        }
      ];

      const analysis = ensembleService.detectOutliers(results);

      expect(analysis.outliers).toHaveLength(1);
      expect(analysis.outliers[0].name).toBe("Outlier");
      expect(analysis.deviationScores["Outlier"]).toBeGreaterThan(analysis.outlierThreshold);
    });

    it("should calculate deviation scores correctly", () => {
      const results: AlgorithmResult[] = [
        {
          name: "Similar 1",
          allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.8,
          performance: 100
        },
        {
          name: "Similar 2",
          allocation: { google: 0.42, meta: 0.28, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.9,
          performance: 105
        },
        {
          name: "Different",
          allocation: { google: 0.6, meta: 0.2, tiktok: 0.1, linkedin: 0.1 },
          confidence: 0.7,
          performance: 95
        }
      ];

      const analysis = ensembleService.detectOutliers(results);

      expect(analysis.deviationScores["Similar 1"]).toBeLessThan(analysis.deviationScores["Different"]);
      expect(analysis.deviationScores["Similar 2"]).toBeLessThan(analysis.deviationScores["Different"]);
    });
  });

  describe("weightResults", () => {
    it("should throw error for mismatched array lengths", () => {
      const results: AlgorithmResult[] = [
        {
          name: "Algorithm 1",
          allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.8,
          performance: 100
        }
      ];
      const confidenceScores = [0.8, 0.9]; // Different length

      expect(() => ensembleService.weightResults(results, confidenceScores))
        .toThrow("Results and confidence scores arrays must have same length");
    });

    it("should throw error for empty arrays", () => {
      expect(() => ensembleService.weightResults([], [])).toThrow("Cannot weight empty results array");
    });

    it("should weight results by confidence scores", () => {
      const results: AlgorithmResult[] = [
        {
          name: "High Confidence",
          allocation: { google: 0.5, meta: 0.3, tiktok: 0.1, linkedin: 0.1 },
          confidence: 0.9,
          performance: 100
        },
        {
          name: "Low Confidence",
          allocation: { google: 0.1, meta: 0.3, tiktok: 0.5, linkedin: 0.1 },
          confidence: 0.1,
          performance: 80
        }
      ];

      const weightedAllocation = ensembleService.weightResults(results, [0.9, 0.1]);

      // Should be closer to high confidence result
      expect(weightedAllocation.google).toBeCloseTo(0.46, 1);
      expect(weightedAllocation.tiktok).toBeCloseTo(0.14, 1);
    });

    it("should handle zero confidence scores with equal weighting", () => {
      const results: AlgorithmResult[] = [
        {
          name: "Algorithm 1",
          allocation: { google: 0.5, meta: 0.25, tiktok: 0.15, linkedin: 0.1 },
          confidence: 0,
          performance: 100
        },
        {
          name: "Algorithm 2",
          allocation: { google: 0.3, meta: 0.35, tiktok: 0.25, linkedin: 0.1 },
          confidence: 0,
          performance: 90
        }
      ];

      const weightedAllocation = ensembleService.weightResults(results, [0, 0]);

      // Should be average of both allocations
      expect(weightedAllocation.google).toBeCloseTo(0.4, 1);
      expect(weightedAllocation.meta).toBeCloseTo(0.3, 1);
    });

    it("should normalize final allocation to sum to 1", () => {
      const results: AlgorithmResult[] = [
        {
          name: "Algorithm 1",
          allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.8,
          performance: 100
        }
      ];

      const weightedAllocation = ensembleService.weightResults(results, [0.8]);
      const sum = Object.values(weightedAllocation).reduce((a, b) => a + b, 0);

      expect(sum).toBeCloseTo(1.0, 6);
    });
  });

  describe("warning generation", () => {
    it("should generate low consensus warning", () => {
      const results: AlgorithmResult[] = [
        {
          name: "Algorithm 1",
          allocation: { google: 0.7, meta: 0.1, tiktok: 0.1, linkedin: 0.1 },
          confidence: 0.8,
          performance: 100
        },
        {
          name: "Algorithm 2",
          allocation: { google: 0.1, meta: 0.7, tiktok: 0.1, linkedin: 0.1 },
          confidence: 0.9,
          performance: 105
        }
      ];

      const result = ensembleService.combineResults(results);

      expect(result.warnings.some(w => w.type === "low_consensus")).toBe(true);
      expect(result.warnings.some(w => w.type === "high_channel_variance")).toBe(true);
    });

    it("should generate appropriate warning severities", () => {
      const results: AlgorithmResult[] = [
        {
          name: "Algorithm 1",
          allocation: { google: 0.8, meta: 0.1, tiktok: 0.05, linkedin: 0.05 },
          confidence: 0.8,
          performance: 100
        },
        {
          name: "Algorithm 2",
          allocation: { google: 0.1, meta: 0.8, tiktok: 0.05, linkedin: 0.05 },
          confidence: 0.9,
          performance: 105
        }
      ];

      const result = ensembleService.combineResults(results);
      const lowConsensusWarning = result.warnings.find(w => w.type === "low_consensus");

      expect(lowConsensusWarning?.severity).toBe("high");
    });
  });

  describe("edge cases", () => {
    it("should handle allocations with zero values", () => {
      const results: AlgorithmResult[] = [
        {
          name: "Algorithm 1",
          allocation: { google: 0.5, meta: 0.5, tiktok: 0, linkedin: 0 },
          confidence: 0.8,
          performance: 100
        },
        {
          name: "Algorithm 2",
          allocation: { google: 0.6, meta: 0.4, tiktok: 0, linkedin: 0 },
          confidence: 0.9,
          performance: 105
        }
      ];

      const result = ensembleService.combineResults(results);

      expect(result.finalAllocation.tiktok).toBe(0);
      expect(result.finalAllocation.linkedin).toBe(0);
      expect(result.finalAllocation.google + result.finalAllocation.meta).toBeCloseTo(1.0, 6);
    });

    it("should handle negative confidence scores", () => {
      const results: AlgorithmResult[] = [
        {
          name: "Algorithm 1",
          allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
          confidence: -0.1, // Negative confidence
          performance: 100
        },
        {
          name: "Algorithm 2",
          allocation: { google: 0.5, meta: 0.3, tiktok: 0.1, linkedin: 0.1 },
          confidence: 0.8,
          performance: 105
        }
      ];

      const result = ensembleService.combineResults(results);

      // Should handle negative confidence by treating as 0
      expect(result.finalAllocation).toEqual(results[1].allocation);
    });
  });
});