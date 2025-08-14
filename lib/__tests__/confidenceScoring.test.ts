/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Unit tests for ConfidenceScoring service
 */

import { ConfidenceScoring, ValidationResult } from '../confidenceScoring';
import type { 
  Allocation, 
  AlgorithmResult, 
  ChannelPriors, 
  ConsensusMetrics,
  StabilityMetrics 
} from '@/types/shared';

describe('ConfidenceScoring', () => {
  let confidenceScoring: ConfidenceScoring;

  beforeEach(() => {
    confidenceScoring = new ConfidenceScoring();
  });

  describe('calculateAllocationConfidence', () => {
    const testAllocation: Allocation = {
      google: 0.4,
      meta: 0.3,
      tiktok: 0.2,
      linkedin: 0.1
    };

    it('should return neutral confidence when no validation results', () => {
      const confidence = confidenceScoring.calculateAllocationConfidence(testAllocation, []);
      expect(confidence).toBe(0.5);
    });

    it('should return low confidence when all validations have zero confidence', () => {
      const validationResults: ValidationResult[] = [
        { isValid: true, confidence: 0, warnings: [] },
        { isValid: true, confidence: 0, warnings: [] }
      ];
      
      const confidence = confidenceScoring.calculateAllocationConfidence(testAllocation, validationResults);
      expect(confidence).toBe(0.1);
    });

    it('should calculate weighted confidence correctly', () => {
      const validationResults: ValidationResult[] = [
        { isValid: true, confidence: 0.8, warnings: [] },
        { isValid: true, confidence: 0.6, warnings: [] },
        { isValid: false, confidence: 0.4, warnings: [] }
      ];
      
      const confidence = confidenceScoring.calculateAllocationConfidence(testAllocation, validationResults);
      expect(confidence).toBeGreaterThan(0.5);
      expect(confidence).toBeLessThan(1.0);
    });

    it('should apply warning penalty', () => {
      const validationResults: ValidationResult[] = [
        { isValid: true, confidence: 0.9, warnings: ['warning1', 'warning2'] }
      ];
      
      const confidence = confidenceScoring.calculateAllocationConfidence(testAllocation, validationResults);
      expect(confidence).toBeLessThan(0.9);
    });

    it('should cap warning penalty at 30%', () => {
      const validationResults: ValidationResult[] = [
        { isValid: true, confidence: 1.0, warnings: ['w1', 'w2', 'w3', 'w4', 'w5'] }
      ];
      
      const confidence = confidenceScoring.calculateAllocationConfidence(testAllocation, validationResults);
      expect(confidence).toBeGreaterThanOrEqual(0.7); // Max 30% penalty
    });
  });

  describe('assessResultStability', () => {
    it('should throw error for empty results', () => {
      expect(() => {
        confidenceScoring.assessResultStability([]);
      }).toThrow('Cannot assess stability with empty results array');
    });

    it('should return perfect stability for single result', () => {
      const results: AlgorithmResult[] = [
        {
          name: 'test',
          allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.8,
          performance: 100
        }
      ];

      const stability = confidenceScoring.assessResultStability(results);
      expect(stability.overallStability).toBe(1.0);
      expect(stability.convergenceScore).toBe(1.0);
      expect(stability.channelStability.google).toBe(1.0);
    });

    it('should calculate stability correctly for multiple results', () => {
      const results: AlgorithmResult[] = [
        {
          name: 'algo1',
          allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.8,
          performance: 100
        },
        {
          name: 'algo2',
          allocation: { google: 0.42, meta: 0.28, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.7,
          performance: 98
        },
        {
          name: 'algo3',
          allocation: { google: 0.38, meta: 0.32, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.9,
          performance: 102
        }
      ];

      const stability = confidenceScoring.assessResultStability(results);
      expect(stability.overallStability).toBeGreaterThan(0.7);
      expect(stability.convergenceScore).toBeGreaterThan(0.7);
      expect(stability.channelStability.google).toBeGreaterThan(0.7);
    });

    it('should show low stability for highly variable results', () => {
      const results: AlgorithmResult[] = [
        {
          name: 'algo1',
          allocation: { google: 0.8, meta: 0.1, tiktok: 0.05, linkedin: 0.05 },
          confidence: 0.8,
          performance: 100
        },
        {
          name: 'algo2',
          allocation: { google: 0.1, meta: 0.8, tiktok: 0.05, linkedin: 0.05 },
          confidence: 0.7,
          performance: 50
        }
      ];

      const stability = confidenceScoring.assessResultStability(results);
      expect(stability.overallStability).toBeLessThan(0.5);
      expect(stability.convergenceScore).toBeLessThan(0.8);
    });
  });

  describe('benchmarkComparison', () => {
    const testAllocation: Allocation = {
      google: 0.4,
      meta: 0.3,
      tiktok: 0.2,
      linkedin: 0.1
    };

    const benchmarkPriors: ChannelPriors = {
      google: { cpm: [10, 20], ctr: [0.02, 0.04], cvr: [0.05, 0.1] },
      meta: { cpm: [8, 15], ctr: [0.015, 0.03], cvr: [0.04, 0.08] },
      tiktok: { cpm: [12, 25], ctr: [0.025, 0.05], cvr: [0.03, 0.06] },
      linkedin: { cpm: [15, 30], ctr: [0.01, 0.02], cvr: [0.02, 0.04] }
    };

    it('should calculate benchmark comparison correctly', () => {
      const analysis = confidenceScoring.benchmarkComparison(testAllocation, benchmarkPriors);
      
      expect(analysis.deviationScore).toBeGreaterThanOrEqual(0);
      expect(analysis.deviationScore).toBeLessThanOrEqual(1);
      expect(analysis.channelDeviations.google).toBeGreaterThanOrEqual(0);
      expect(analysis.channelDeviations.meta).toBeGreaterThanOrEqual(0);
      expect(analysis.channelDeviations.tiktok).toBeGreaterThanOrEqual(0);
      expect(analysis.channelDeviations.linkedin).toBeGreaterThanOrEqual(0);
    });

    it('should generate warnings for significant deviations', () => {
      // Create allocation that significantly deviates from expected performance
      const extremeAllocation: Allocation = {
        google: 0.1,  // Very low despite good performance
        meta: 0.1,
        tiktok: 0.1,
        linkedin: 0.7   // Very high despite poor performance
      };

      const analysis = confidenceScoring.benchmarkComparison(extremeAllocation, benchmarkPriors);
      expect(analysis.warnings.length).toBeGreaterThan(0);
      expect(analysis.deviationScore).toBeGreaterThan(0.5);
    });

    it('should handle edge cases gracefully', () => {
      const zeroAllocation: Allocation = {
        google: 0,
        meta: 0,
        tiktok: 0,
        linkedin: 1
      };

      const analysis = confidenceScoring.benchmarkComparison(zeroAllocation, benchmarkPriors);
      expect(analysis.deviationScore).toBeGreaterThanOrEqual(0);
      expect(analysis.deviationScore).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateComprehensiveConfidence', () => {
    const testAllocation: Allocation = {
      google: 0.4,
      meta: 0.3,
      tiktok: 0.2,
      linkedin: 0.1
    };

    const algorithmResults: AlgorithmResult[] = [
      {
        name: 'algo1',
        allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
        confidence: 0.8,
        performance: 100
      },
      {
        name: 'algo2',
        allocation: { google: 0.42, meta: 0.28, tiktok: 0.2, linkedin: 0.1 },
        confidence: 0.7,
        performance: 98
      }
    ];

    const consensus: ConsensusMetrics = {
      agreement: 0.8,
      variance: { google: 0.01, meta: 0.01, tiktok: 0, linkedin: 0 },
      outlierCount: 0
    };

    const stability: StabilityMetrics = {
      overallStability: 0.9,
      channelStability: { google: 0.9, meta: 0.9, tiktok: 1.0, linkedin: 1.0 },
      convergenceScore: 0.95
    };

    it('should calculate comprehensive confidence correctly', () => {
      const confidence = confidenceScoring.calculateComprehensiveConfidence(
        testAllocation,
        algorithmResults,
        consensus,
        stability
      );

      expect(confidence.overall).toBeGreaterThan(0.7);
      expect(confidence.overall).toBeLessThanOrEqual(1.0);
      expect(confidence.stability).toBe(0.9);
      expect(confidence.perChannel.google).toBeGreaterThan(0.7);
      expect(confidence.perChannel.meta).toBeGreaterThan(0.7);
    });

    it('should handle benchmark analysis when provided', () => {
      const benchmarkAnalysis = {
        deviationScore: 0.2,
        channelDeviations: { google: 0.1, meta: 0.1, tiktok: 0.05, linkedin: 0.05 },
        warnings: []
      };

      const confidence = confidenceScoring.calculateComprehensiveConfidence(
        testAllocation,
        algorithmResults,
        consensus,
        stability,
        benchmarkAnalysis
      );

      expect(confidence.overall).toBeGreaterThan(0.7);
      expect(confidence.overall).toBeLessThanOrEqual(1.0);
    });

    it('should bound confidence values between 0 and 1', () => {
      const lowConsensus: ConsensusMetrics = {
        agreement: 0.1,
        variance: { google: 0.5, meta: 0.5, tiktok: 0.5, linkedin: 0.5 },
        outlierCount: 2
      };

      const lowStability: StabilityMetrics = {
        overallStability: 0.1,
        channelStability: { google: 0.1, meta: 0.1, tiktok: 0.1, linkedin: 0.1 },
        convergenceScore: 0.1
      };

      const confidence = confidenceScoring.calculateComprehensiveConfidence(
        testAllocation,
        algorithmResults,
        lowConsensus,
        lowStability
      );

      expect(confidence.overall).toBeGreaterThanOrEqual(0);
      expect(confidence.overall).toBeLessThanOrEqual(1);
      expect(confidence.perChannel.google).toBeGreaterThanOrEqual(0);
      expect(confidence.perChannel.google).toBeLessThanOrEqual(1);
    });
  });

  describe('accuracy-focused validation scenarios', () => {
    it('should accurately assess confidence with mixed validation', () => {
      const confidence = {
        overall: 0.3,
        perChannel: { google: 0.5, meta: 0.5, tiktok: 0.5, linkedin: 0.5 },
        stability: 0.8
      };

      const recommendations = confidenceScoring.generateConfidenceRecommendations(confidence);
      expect(recommendations.some(rec => rec.includes('Overall confidence is low'))).toBe(true);
    });

    it('should handle extreme validation scenarios', () => {
      const extremeValidationResults: ValidationResult[] = [
        { isValid: false, confidence: 0, warnings: ['Critical error', 'Data inconsistency', 'Invalid range'] },
        { isValid: false, confidence: 0.1, warnings: ['Warning 1', 'Warning 2'] },
        { isValid: true, confidence: 1.0, warnings: [] }
      ];

      const testAllocation: Allocation = {
        google: 0.4,
        meta: 0.3,
        tiktok: 0.2,
        linkedin: 0.1
      };

      const confidence = confidenceScoring.calculateAllocationConfidence(testAllocation, extremeValidationResults);
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it('should handle validation results with all warnings', () => {
      const warningHeavyResults: ValidationResult[] = [
        { isValid: true, confidence: 0.8, warnings: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'] },
        { isValid: true, confidence: 0.9, warnings: ['W7', 'W8', 'W9'] }
      ];

      const testAllocation: Allocation = {
        google: 0.4,
        meta: 0.3,
        tiktok: 0.2,
        linkedin: 0.1
      };

      const confidence = confidenceScoring.calculateAllocationConfidence(testAllocation, warningHeavyResults);
      expect(confidence).toBeLessThan(0.8); // Should be reduced due to warnings
      expect(confidence).toBeGreaterThan(0); // But not zero
    });

    it('should assess stability with highly variable performance', () => {
      const variableResults: AlgorithmResult[] = [
        {
          name: 'algo1',
          allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.8,
          performance: 10
        },
        {
          name: 'algo2',
          allocation: { google: 0.41, meta: 0.29, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.7,
          performance: 1000
        },
        {
          name: 'algo3',
          allocation: { google: 0.39, meta: 0.31, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.9,
          performance: 50000
        }
      ];

      const stability = confidenceScoring.assessResultStability(variableResults);
      expect(stability.overallStability).toBeGreaterThan(0.5); // Allocations are similar
      expect(stability.convergenceScore).toBeLessThan(0.5); // Performance varies wildly
    });

    it('should generate recommendations for low stability', () => {
      const confidence = {
        overall: 0.8,
        perChannel: { google: 0.5, meta: 0.5, tiktok: 0.5, linkedin: 0.5 },
        stability: 0.4
      };

      const recommendations = confidenceScoring.generateConfidenceRecommendations(confidence);
      expect(recommendations.some(rec => rec.includes('Results show low stability'))).toBe(true);
    });

    it('should generate channel-specific recommendations', () => {
      const confidence = {
        overall: 0.8,
        perChannel: { google: 0.2, meta: 0.8, tiktok: 0.8, linkedin: 0.8 },
        stability: 0.8
      };

      const recommendations = confidenceScoring.generateConfidenceRecommendations(confidence);
      expect(recommendations.some(rec => rec.includes('google allocation has low confidence'))).toBe(true);
    });

    it('should provide positive feedback for high confidence', () => {
      const confidence = {
        overall: 0.9,
        perChannel: { google: 0.9, meta: 0.8, tiktok: 0.8, linkedin: 0.8 },
        stability: 0.9
      };

      const recommendations = confidenceScoring.generateConfidenceRecommendations(confidence);
      expect(recommendations.some(rec => rec.includes('reliable optimization results'))).toBe(true);
    });

    it('should handle benchmark comparison with missing data', () => {
      const testAllocation: Allocation = {
        google: 0.4,
        meta: 0.3,
        tiktok: 0.2,
        linkedin: 0.1
      };

      const incompleteBenchmarks: ChannelPriors = {
        google: { cpm: [0, 0], ctr: [0, 0], cvr: [0, 0] }, // Zero benchmarks
        meta: { cpm: [8, 15], ctr: [0.015, 0.03], cvr: [0.04, 0.08] },
        tiktok: { cpm: [12, 25], ctr: [0.025, 0.05], cvr: [0.03, 0.06] },
        linkedin: { cpm: [15, 30], ctr: [0.01, 0.02], cvr: [0.02, 0.04] }
      };

      const analysis = confidenceScoring.benchmarkComparison(testAllocation, incompleteBenchmarks);
      expect(analysis.deviationScore).toBeGreaterThanOrEqual(0);
      expect(analysis.deviationScore).toBeLessThanOrEqual(1);
      expect(analysis.channelDeviations.google).toBeGreaterThanOrEqual(0);
    });

    it('should calculate comprehensive confidence with all factors', () => {
      const testAllocation: Allocation = {
        google: 0.4,
        meta: 0.3,
        tiktok: 0.2,
        linkedin: 0.1
      };

      const algorithmResults: AlgorithmResult[] = [
        {
          name: 'algo1',
          allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.8,
          performance: 100
        }
      ];

      const consensus: ConsensusMetrics = {
        agreement: 1.0,
        variance: { google: 0, meta: 0, tiktok: 0, linkedin: 0 },
        outlierCount: 0
      };

      const stability: StabilityMetrics = {
        overallStability: 1.0,
        channelStability: { google: 1.0, meta: 1.0, tiktok: 1.0, linkedin: 1.0 },
        convergenceScore: 1.0
      };

      const benchmarkAnalysis = {
        deviationScore: 0.1,
        channelDeviations: { google: 0.05, meta: 0.05, tiktok: 0.05, linkedin: 0.05 },
        warnings: []
      };

      const confidence = confidenceScoring.calculateComprehensiveConfidence(
        testAllocation,
        algorithmResults,
        consensus,
        stability,
        benchmarkAnalysis
      );

      expect(confidence.overall).toBeGreaterThan(0.8);
      expect(confidence.stability).toBe(1.0);
      expect(confidence.perChannel.google).toBeGreaterThan(0.8);
    });

    it('should handle edge cases in comprehensive confidence calculation', () => {
      const testAllocation: Allocation = {
        google: 0.4,
        meta: 0.3,
        tiktok: 0.2,
        linkedin: 0.1
      };

      const algorithmResults: AlgorithmResult[] = [];

      const consensus: ConsensusMetrics = {
        agreement: 0,
        variance: { google: 1, meta: 1, tiktok: 1, linkedin: 1 },
        outlierCount: 10
      };

      const stability: StabilityMetrics = {
        overallStability: 0,
        channelStability: { google: 0, meta: 0, tiktok: 0, linkedin: 0 },
        convergenceScore: 0
      };

      const confidence = confidenceScoring.calculateComprehensiveConfidence(
        testAllocation,
        algorithmResults,
        consensus,
        stability
      );

      expect(confidence.overall).toBeGreaterThanOrEqual(0);
      expect(confidence.overall).toBeLessThanOrEqual(1);
      expect(confidence.perChannel.google).toBeGreaterThanOrEqual(0);
      expect(confidence.perChannel.google).toBeLessThanOrEqual(1);
    });
  });
});