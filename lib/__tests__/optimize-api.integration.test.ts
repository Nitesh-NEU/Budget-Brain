import { POST } from '@/app/api/optimize/route';
import { NextRequest } from 'next/server';

// Mock the AccuracyEnhancementService
jest.mock('@/lib/accuracyEnhancementService');
jest.mock('@/lib/optimizer');

const mockEnhancedResult = {
    allocation: { google: 0.4, meta: 0.3, tiktok: 0.2, linkedin: 0.1 },
    detOutcome: 1000,
    mc: { p10: 800, p50: 1000, p90: 1200 },
    intervals: {},
    objective: 'demos',
    summary: 'Enhanced optimization result',
    confidence: {
        overall: 0.85,
        perChannel: { google: 0.9, meta: 0.8, tiktok: 0.85, linkedin: 0.7 },
        stability: 0.88
    },
    validation: {
        alternativeAlgorithms: [],
        consensus: { agreement: 0.85, variance: {}, outlierCount: 0 },
        benchmarkComparison: { deviationScore: 0.1, channelDeviations: {}, warnings: [] },
        warnings: []
    },
    alternatives: {
        topAllocations: [],
        reasoningExplanation: 'Test explanation'
    }
};

const mockOriginalResult = {
    best: {
        split: { google: 0.5, meta: 0.3, tiktok: 0.15, linkedin: 0.05 },
        det: 950,
        mc: { p10: 750, p50: 950, p90: 1150 }
    },
    intervals: {}
};

describe('POST /api/optimize - Enhancement Pipeline Integration', () => {
    const validBody = {
        budget: 10000,
        priors: {
            google: {
                cpm: [10, 20],
                ctr: [0.01, 0.03],
                cvr: [0.01, 0.05]
            },
            meta: {
                cpm: [15, 25],
                ctr: [0.015, 0.035],
                cvr: [0.008, 0.04]
            },
            tiktok: {
                cpm: [12, 22],
                ctr: [0.02, 0.04],
                cvr: [0.005, 0.03]
            },
            linkedin: {
                cpm: [20, 40],
                ctr: [0.005, 0.02],
                cvr: [0.02, 0.08]
            }
        },
        assumptions: {
            goal: 'demos' as const
        }
    };

    let mockEnhanceOptimization: jest.Mock;
    let mockOptimize: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mock functions
        mockEnhanceOptimization = jest.fn().mockResolvedValue(mockEnhancedResult);
        mockOptimize = jest.fn().mockReturnValue(mockOriginalResult);

        // Mock AccuracyEnhancementService
        const { AccuracyEnhancementService } = require('@/lib/accuracyEnhancementService');
        AccuracyEnhancementService.mockImplementation(() => ({
            enhanceOptimization: mockEnhanceOptimization
        }));

        // Mock original optimizer
        const { optimize } = require('@/lib/optimizer');
        optimize.mockImplementation(mockOptimize);
    });

    describe('Enhancement Level Configuration', () => {
        it('should use standard enhancement level by default', async () => {
            const request = new NextRequest('http://localhost:3000/api/optimize', {
                method: 'POST',
                body: JSON.stringify(validBody)
            });

            const response = await POST(request);
            const data = await response.json();

            expect(mockEnhanceOptimization).toHaveBeenCalledWith(
                validBody.budget,
                validBody.priors,
                validBody.assumptions,
                expect.objectContaining({
                    level: 'standard'
                })
            );
        });

        it('should use fast enhancement level when specified in query params', async () => {
            const request = new NextRequest('http://localhost:3000/api/optimize?enhancement=fast', {
                method: 'POST',
                body: JSON.stringify(validBody)
            });

            const response = await POST(request);

            expect(mockEnhanceOptimization).toHaveBeenCalledWith(
                validBody.budget,
                validBody.priors,
                validBody.assumptions,
                expect.objectContaining({
                    level: 'fast'
                })
            );
        });

        it('should use thorough enhancement level when specified', async () => {
            const request = new NextRequest('http://localhost:3000/api/optimize?enhancement=thorough', {
                method: 'POST',
                body: JSON.stringify(validBody)
            });

            await POST(request);

            expect(mockEnhanceOptimization).toHaveBeenCalledWith(
                validBody.budget,
                validBody.priors,
                validBody.assumptions,
                expect.objectContaining({
                    level: 'thorough'
                })
            );
        });
    });

    describe('Feature Toggle Query Parameters', () => {
        it('should disable alternatives when alternatives=false', async () => {
            const request = new NextRequest('http://localhost:3000/api/optimize?alternatives=false', {
                method: 'POST',
                body: JSON.stringify(validBody)
            });

            await POST(request);

            expect(mockEnhanceOptimization).toHaveBeenCalledWith(
                validBody.budget,
                validBody.priors,
                validBody.assumptions,
                expect.objectContaining({
                    includeAlternatives: false
                })
            );
        });

        it('should disable benchmark validation when benchmarks=false', async () => {
            const request = new NextRequest('http://localhost:3000/api/optimize?benchmarks=false', {
                method: 'POST',
                body: JSON.stringify(validBody)
            });

            await POST(request);

            expect(mockEnhanceOptimization).toHaveBeenCalledWith(
                validBody.budget,
                validBody.priors,
                validBody.assumptions,
                expect.objectContaining({
                    validateAgainstBenchmarks: false
                })
            );
        });

        it('should disable LLM validation when llm=false', async () => {
            const request = new NextRequest('http://localhost:3000/api/optimize?llm=false', {
                method: 'POST',
                body: JSON.stringify(validBody)
            });

            await POST(request);

            expect(mockEnhanceOptimization).toHaveBeenCalledWith(
                validBody.budget,
                validBody.priors,
                validBody.assumptions,
                expect.objectContaining({
                    enableLLMValidation: false
                })
            );
        });
    });

    describe('Backward Compatibility', () => {
        it('should use original optimizer when enhanced=false in query params', async () => {
            const request = new NextRequest('http://localhost:3000/api/optimize?enhanced=false', {
                method: 'POST',
                body: JSON.stringify(validBody)
            });

            const response = await POST(request);
            const data = await response.json();

            expect(mockOptimize).toHaveBeenCalledWith(
                validBody.budget,
                validBody.priors,
                validBody.assumptions,
                800
            );

            // Should return original response structure without enhanced features
            expect(data).toEqual({
                allocation: mockOriginalResult.best.split,
                detOutcome: mockOriginalResult.best.det,
                p10: mockOriginalResult.best.mc.p10,
                p50: mockOriginalResult.best.mc.p50,
                p90: mockOriginalResult.best.mc.p90,
                intervals: mockOriginalResult.intervals,
                objective: validBody.assumptions.goal,
                summary: expect.stringContaining('Deterministic baseline')
            });

            expect(data.confidence).toBeUndefined();
            expect(data.validation).toBeUndefined();
            expect(data.alternatives).toBeUndefined();
        });

        it('should use original optimizer when enhanced=false in body', async () => {
            const bodyWithEnhancedFalse = { ...validBody, enhanced: false };
            const request = new NextRequest('http://localhost:3000/api/optimize', {
                method: 'POST',
                body: JSON.stringify(bodyWithEnhancedFalse)
            });

            const response = await POST(request);

            expect(mockOptimize).toHaveBeenCalled();
            expect(mockEnhanceOptimization).not.toHaveBeenCalled();
        });

        it('should prioritize query param over body for enhanced flag', async () => {
            const bodyWithEnhancedTrue = { ...validBody, enhanced: true };
            const request = new NextRequest('http://localhost:3000/api/optimize?enhanced=false', {
                method: 'POST',
                body: JSON.stringify(bodyWithEnhancedTrue)
            });

            await POST(request);

            expect(mockOptimize).toHaveBeenCalled();
            expect(mockEnhanceOptimization).not.toHaveBeenCalled();
        });

        it('should always include core response fields for backward compatibility', async () => {
            const request = new NextRequest('http://localhost:3000/api/optimize', {
                method: 'POST',
                body: JSON.stringify(validBody)
            });

            const response = await POST(request);
            const data = await response.json();

            // Core fields that existing clients expect
            expect(data).toHaveProperty('allocation');
            expect(data).toHaveProperty('detOutcome');
            expect(data).toHaveProperty('p10');
            expect(data).toHaveProperty('p50');
            expect(data).toHaveProperty('p90');
            expect(data).toHaveProperty('intervals');
            expect(data).toHaveProperty('objective');
            expect(data).toHaveProperty('summary');
        });
    });

    describe('Enhanced Response Features', () => {
        it('should include enhanced features by default', async () => {
            const request = new NextRequest('http://localhost:3000/api/optimize', {
                method: 'POST',
                body: JSON.stringify(validBody)
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.confidence).toBeDefined();
            expect(data.validation).toBeDefined();
            expect(data.alternatives).toBeDefined();
        });

        it('should exclude confidence when confidence=false', async () => {
            const request = new NextRequest('http://localhost:3000/api/optimize?confidence=false', {
                method: 'POST',
                body: JSON.stringify(validBody)
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.confidence).toBeUndefined();
            expect(data.validation).toBeDefined();
            expect(data.alternatives).toBeDefined();
        });

        it('should exclude validation when validation=false', async () => {
            const request = new NextRequest('http://localhost:3000/api/optimize?validation=false', {
                method: 'POST',
                body: JSON.stringify(validBody)
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.confidence).toBeDefined();
            expect(data.validation).toBeUndefined();
            expect(data.alternatives).toBeDefined();
        });

        it('should exclude alternatives when alternatives=false', async () => {
            const request = new NextRequest('http://localhost:3000/api/optimize?alternatives=false', {
                method: 'POST',
                body: JSON.stringify(validBody)
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.confidence).toBeDefined();
            expect(data.validation).toBeDefined();
            expect(data.alternatives).toBeUndefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle enhancement service errors gracefully', async () => {
            // Override the mock for this test
            mockEnhanceOptimization.mockRejectedValueOnce(new Error('Enhancement failed'));

            const request = new NextRequest('http://localhost:3000/api/optimize', {
                method: 'POST',
                body: JSON.stringify(validBody)
            });

            const response = await POST(request);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Enhancement failed');
        });

        it('should handle invalid enhancement level gracefully', async () => {
            const request = new NextRequest('http://localhost:3000/api/optimize?enhancement=invalid', {
                method: 'POST',
                body: JSON.stringify(validBody)
            });

            const response = await POST(request);

            // Should still work, using 'invalid' as the level (service should handle validation)
            expect(response.status).toBe(200);
        });
    });
});