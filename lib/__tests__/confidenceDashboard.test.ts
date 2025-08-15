/**
 * ConfidenceDashboard Logic Tests
 * 
 * Tests for the confidence calculation and data processing logic
 */

import { Channel, AlgorithmResult, ConsensusMetrics } from '@/types/shared';

// Mock confidence data for testing
const mockConfidenceData = {
  overall: 0.85,
  perChannel: {
    google: 0.90,
    meta: 0.82,
    tiktok: 0.75,
    linkedin: 0.88
  } as Record<Channel, number>,
  stability: 0.87,
  algorithms: [
    {
      name: 'ensemble',
      allocation: {
        google: 0.35,
        meta: 0.28,
        tiktok: 0.22,
        linkedin: 0.15
      },
      confidence: 0.91,
      performance: 0.88
    },
    {
      name: 'bayesian',
      allocation: {
        google: 0.38,
        meta: 0.25,
        tiktok: 0.24,
        linkedin: 0.13
      },
      confidence: 0.85,
      performance: 0.82
    }
  ] as AlgorithmResult[],
  consensus: {
    agreement: 0.84,
    variance: {
      google: 0.02,
      meta: 0.03,
      tiktok: 0.04,
      linkedin: 0.02
    },
    outlierCount: 1
  } as ConsensusMetrics
};

// Helper functions that would be used in the component
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'green';
  if (confidence >= 0.6) return 'yellow';
  if (confidence >= 0.4) return 'red';
  return 'gray';
};

const calculateOverallHealth = (confidence: any): number => {
  const weights = {
    overall: 0.4,
    stability: 0.3,
    consensus: 0.3
  };
  
  return (
    confidence.overall * weights.overall +
    confidence.stability * weights.stability +
    confidence.consensus.agreement * weights.consensus
  );
};

const getAlgorithmsByPerformance = (algorithms: AlgorithmResult[]): AlgorithmResult[] => {
  return [...algorithms].sort((a, b) => b.performance - a.performance);
};

const calculateChannelRisk = (perChannel: Record<Channel, number>): Record<Channel, 'low' | 'medium' | 'high'> => {
  const result = {} as Record<Channel, 'low' | 'medium' | 'high'>;
  
  Object.entries(perChannel).forEach(([channel, confidence]) => {
    if (confidence >= 0.8) {
      result[channel as Channel] = 'low';
    } else if (confidence >= 0.6) {
      result[channel as Channel] = 'medium';
    } else {
      result[channel as Channel] = 'high';
    }
  });
  
  return result;
};

describe('ConfidenceDashboard Logic', () => {
  describe('getConfidenceColor', () => {
    it('returns correct colors for different confidence levels', () => {
      expect(getConfidenceColor(0.9)).toBe('green');
      expect(getConfidenceColor(0.8)).toBe('green');
      expect(getConfidenceColor(0.7)).toBe('yellow');
      expect(getConfidenceColor(0.6)).toBe('yellow');
      expect(getConfidenceColor(0.5)).toBe('red');
      expect(getConfidenceColor(0.4)).toBe('red');
      expect(getConfidenceColor(0.3)).toBe('gray');
      expect(getConfidenceColor(0.1)).toBe('gray');
    });

    it('handles edge cases', () => {
      expect(getConfidenceColor(1.0)).toBe('green');
      expect(getConfidenceColor(0.0)).toBe('gray');
      expect(getConfidenceColor(0.79999)).toBe('yellow');
      expect(getConfidenceColor(0.80001)).toBe('green');
    });
  });

  describe('calculateOverallHealth', () => {
    it('calculates weighted health score correctly', () => {
      const health = calculateOverallHealth(mockConfidenceData);
      
      // Expected: 0.85 * 0.4 + 0.87 * 0.3 + 0.84 * 0.3 = 0.853
      expect(health).toBeCloseTo(0.853, 3);
    });

    it('handles low confidence scenarios', () => {
      const lowConfidenceData = {
        overall: 0.4,
        stability: 0.3,
        consensus: { agreement: 0.2 }
      };
      
      const health = calculateOverallHealth(lowConfidenceData);
      expect(health).toBeCloseTo(0.31, 2);
    });
  });

  describe('getAlgorithmsByPerformance', () => {
    it('sorts algorithms by performance in descending order', () => {
      const sorted = getAlgorithmsByPerformance(mockConfidenceData.algorithms);
      
      expect(sorted[0].name).toBe('ensemble'); // 0.88 performance
      expect(sorted[1].name).toBe('bayesian'); // 0.82 performance
      expect(sorted[0].performance).toBeGreaterThanOrEqual(sorted[1].performance);
    });

    it('handles empty algorithm array', () => {
      const sorted = getAlgorithmsByPerformance([]);
      expect(sorted).toEqual([]);
    });

    it('does not mutate original array', () => {
      const original = [...mockConfidenceData.algorithms];
      getAlgorithmsByPerformance(mockConfidenceData.algorithms);
      
      expect(mockConfidenceData.algorithms).toEqual(original);
    });
  });

  describe('calculateChannelRisk', () => {
    it('categorizes channel risks correctly', () => {
      const risks = calculateChannelRisk(mockConfidenceData.perChannel);
      
      expect(risks.google).toBe('low'); // 0.90
      expect(risks.meta).toBe('low'); // 0.82
      expect(risks.tiktok).toBe('medium'); // 0.75
      expect(risks.linkedin).toBe('low'); // 0.88
    });

    it('handles edge cases for risk thresholds', () => {
      const edgeCaseData = {
        google: 0.8, // exactly at threshold
        meta: 0.6, // exactly at threshold
        tiktok: 0.59, // just below medium
        linkedin: 0.81 // just above high
      } as Record<Channel, number>;
      
      const risks = calculateChannelRisk(edgeCaseData);
      
      expect(risks.google).toBe('low');
      expect(risks.meta).toBe('medium');
      expect(risks.tiktok).toBe('high');
      expect(risks.linkedin).toBe('low');
    });

    it('handles all channels', () => {
      const risks = calculateChannelRisk(mockConfidenceData.perChannel);
      
      expect(Object.keys(risks)).toHaveLength(4);
      expect(risks).toHaveProperty('google');
      expect(risks).toHaveProperty('meta');
      expect(risks).toHaveProperty('tiktok');
      expect(risks).toHaveProperty('linkedin');
    });
  });

  describe('Data Validation', () => {
    it('validates confidence data structure', () => {
      expect(mockConfidenceData).toHaveProperty('overall');
      expect(mockConfidenceData).toHaveProperty('perChannel');
      expect(mockConfidenceData).toHaveProperty('stability');
      expect(mockConfidenceData).toHaveProperty('algorithms');
      expect(mockConfidenceData).toHaveProperty('consensus');
      
      expect(typeof mockConfidenceData.overall).toBe('number');
      expect(typeof mockConfidenceData.stability).toBe('number');
      expect(Array.isArray(mockConfidenceData.algorithms)).toBe(true);
    });

    it('validates algorithm data structure', () => {
      mockConfidenceData.algorithms.forEach(algorithm => {
        expect(algorithm).toHaveProperty('name');
        expect(algorithm).toHaveProperty('allocation');
        expect(algorithm).toHaveProperty('confidence');
        expect(algorithm).toHaveProperty('performance');
        
        expect(typeof algorithm.name).toBe('string');
        expect(typeof algorithm.confidence).toBe('number');
        expect(typeof algorithm.performance).toBe('number');
        expect(typeof algorithm.allocation).toBe('object');
      });
    });

    it('validates consensus data structure', () => {
      const consensus = mockConfidenceData.consensus;
      
      expect(consensus).toHaveProperty('agreement');
      expect(consensus).toHaveProperty('variance');
      expect(consensus).toHaveProperty('outlierCount');
      
      expect(typeof consensus.agreement).toBe('number');
      expect(typeof consensus.outlierCount).toBe('number');
      expect(typeof consensus.variance).toBe('object');
    });

    it('validates per-channel data completeness', () => {
      const channels: Channel[] = ['google', 'meta', 'tiktok', 'linkedin'];
      
      channels.forEach(channel => {
        expect(mockConfidenceData.perChannel).toHaveProperty(channel);
        expect(typeof mockConfidenceData.perChannel[channel]).toBe('number');
        expect(mockConfidenceData.perChannel[channel]).toBeGreaterThanOrEqual(0);
        expect(mockConfidenceData.perChannel[channel]).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles confidence values outside normal range', () => {
      expect(getConfidenceColor(-0.1)).toBe('gray');
      expect(getConfidenceColor(1.1)).toBe('green');
    });

    it('handles missing algorithm data gracefully', () => {
      const emptyAlgorithms: AlgorithmResult[] = [];
      const sorted = getAlgorithmsByPerformance(emptyAlgorithms);
      expect(sorted).toEqual([]);
    });

    it('handles partial channel data', () => {
      const partialChannelData = {
        google: 0.8,
        meta: 0.7
      } as Record<Channel, number>;
      
      const risks = calculateChannelRisk(partialChannelData);
      expect(Object.keys(risks)).toHaveLength(2);
      expect(risks.google).toBe('low');
      expect(risks.meta).toBe('medium');
    });
  });
});