/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * Integration tests for ConfidenceScoring service with EnsembleService
 */

import { ConfidenceScoring } from '../confidenceScoring';
import { EnsembleService } from '../ensembleService';
import type { AlgorithmResult, ChannelPriors } from '@/types/shared';

describe('ConfidenceScoring Integration', () => {
  let confidenceScoring: ConfidenceScoring;
  let ensembleService: EnsembleService;

  beforeEach(() => {
    confidenceScoring = new ConfidenceScoring();
    ensembleService = new EnsembleService();
  });

  describe('Integration with EnsembleService', () => {
    const algorithmResults: AlgorithmResult[] = [
      {
        name: 'monte-carlo',
        allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
        confidence: 0.8,
        performance: 100
      },
      {
        name: 'gradient-descent',
        allocation: { google: 0.42, meta: 0.28, tiktok: 0.2, linkedin: 0.1 },
        confidence: 0.85,
        performance: 102
      },
      {
        name: 'bayesian',
        allocation: { google: 0.38, meta: 0.32, tiktok: 0.2, linkedin: 0.1 },
        confidence: 0.75,
        performance: 98
      }
    ];

    const benchmarkPriors: ChannelPriors = {
      google: { cpm: [10, 20], ctr: [0.02, 0.04], cvr: [0.05, 0.1] },
      meta: { cpm: [8, 15], ctr: [0.015, 0.03], cvr: [0.04, 0.08] },
      tiktok: { cpm: [12, 25], ctr: [0.025, 0.05], cvr: [0.03, 0.06] },
      linkedin: { cpm: [15, 30], ctr: [0.01, 0.02], cvr: [0.02, 0.04] }
    };

    it('should provide comprehensive confidence analysis for ensemble results', () => {
      // Get ensemble results
      const ensembleResult = ensembleService.combineResults(algorithmResults);
      
      // Calculate stability metrics
      const stabilityMetrics = confidenceScoring.assessResultStability(algorithmResults);
      
      // Perform benchmark comparison
      const benchmarkAnalysis = confidenceScoring.benchmarkComparison(
        ensembleResult.finalAllocation, 
        benchmarkPriors
      );
      
      // Calculate comprehensive confidence
      const confidence = confidenceScoring.calculateComprehensiveConfidence(
        ensembleResult.finalAllocation,
        algorithmResults,
        ensembleResult.consensus,
        stabilityMetrics,
        benchmarkAnalysis
      );

      // Verify confidence metrics are reasonable
      expect(confidence.overall).toBeGreaterThan(0.6);
      expect(confidence.overall).toBeLessThanOrEqual(1.0);
      expect(confidence.stability).toBeGreaterThan(0.7);
      
      // Verify per-channel confidence
      expect(confidence.perChannel.google).toBeGreaterThan(0.6);
      expect(confidence.perChannel.meta).toBeGreaterThan(0.6);
      expect(confidence.perChannel.tiktok).toBeGreaterThan(0.6);
      expect(confidence.perChannel.linkedin).toBeGreaterThan(0.6);
    });

    it('should handle low consensus scenarios appropriately', () => {
      const divergentResults: AlgorithmResult[] = [
        {
          name: 'algo1',
          allocation: { google: 0.8, meta: 0.1, tiktok: 0.05, linkedin: 0.05 },
          confidence: 0.7,
          performance: 90
        },
        {
          name: 'algo2',
          allocation: { google: 0.1, meta: 0.8, tiktok: 0.05, linkedin: 0.05 },
          confidence: 0.7,
          performance: 85
        },
        {
          name: 'algo3',
          allocation: { google: 0.2, meta: 0.2, tiktok: 0.5, linkedin: 0.1 },
          confidence: 0.6,
          performance: 80
        }
      ];

      const ensembleResult = ensembleService.combineResults(divergentResults);
      const stabilityMetrics = confidenceScoring.assessResultStability(divergentResults);
      
      const confidence = confidenceScoring.calculateComprehensiveConfidence(
        ensembleResult.finalAllocation,
        divergentResults,
        ensembleResult.consensus,
        stabilityMetrics
      );

      // Should show lower confidence due to high disagreement
      expect(confidence.overall).toBeLessThan(0.6);
      expect(confidence.stability).toBeLessThan(0.5);
      
      // Should generate appropriate recommendations
      const recommendations = confidenceScoring.generateConfidenceRecommendations(confidence);
      expect(recommendations.length).toBeGreaterThan(1);
      expect(recommendations.some(rec => rec.includes('low'))).toBe(true);
    });

    it('should detect and handle outlier algorithms correctly', () => {
      const resultsWithOutlier: AlgorithmResult[] = [
        {
          name: 'normal1',
          allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.8,
          performance: 100
        },
        {
          name: 'normal2',
          allocation: { google: 0.42, meta: 0.28, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.85,
          performance: 102
        },
        {
          name: 'outlier',
          allocation: { google: 0.05, meta: 0.05, tiktok: 0.05, linkedin: 0.85 },
          confidence: 0.3,
          performance: 50
        }
      ];

      const ensembleResult = ensembleService.combineResults(resultsWithOutlier);
      const stabilityMetrics = confidenceScoring.assessResultStability(resultsWithOutlier);
      
      // Outlier should be detected by ensemble service
      expect(ensembleResult.outliers.length).toBeGreaterThan(0);
      expect(ensembleResult.outliers[0].name).toBe('outlier');
      
      // Confidence should still be reasonable due to outlier exclusion
      const confidence = confidenceScoring.calculateComprehensiveConfidence(
        ensembleResult.finalAllocation,
        resultsWithOutlier,
        ensembleResult.consensus,
        stabilityMetrics
      );
      
      expect(confidence.overall).toBeGreaterThan(0.5);
    });

    it('should provide meaningful recommendations based on analysis', () => {
      const ensembleResult = ensembleService.combineResults(algorithmResults);
      const stabilityMetrics = confidenceScoring.assessResultStability(algorithmResults);
      const benchmarkAnalysis = confidenceScoring.benchmarkComparison(
        ensembleResult.finalAllocation, 
        benchmarkPriors
      );
      
      const confidence = confidenceScoring.calculateComprehensiveConfidence(
        ensembleResult.finalAllocation,
        algorithmResults,
        ensembleResult.consensus,
        stabilityMetrics,
        benchmarkAnalysis
      );

      const recommendations = confidenceScoring.generateConfidenceRecommendations(confidence);
      
      // Should provide at least one recommendation
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Recommendations should be strings
      recommendations.forEach(rec => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(10);
      });
    });

    it('should handle edge case with single algorithm result', () => {
      const singleResult: AlgorithmResult[] = [
        {
          name: 'single',
          allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
          confidence: 0.8,
          performance: 100
        }
      ];

      const ensembleResult = ensembleService.combineResults(singleResult);
      const stabilityMetrics = confidenceScoring.assessResultStability(singleResult);
      
      const confidence = confidenceScoring.calculateComprehensiveConfidence(
        ensembleResult.finalAllocation,
        singleResult,
        ensembleResult.consensus,
        stabilityMetrics
      );

      // Should handle single result gracefully
      expect(confidence.overall).toBeGreaterThan(0.5);
      expect(confidence.stability).toBe(1.0); // Perfect stability with single result
      expect(ensembleResult.consensus.agreement).toBe(1.0);
    });
  });
});