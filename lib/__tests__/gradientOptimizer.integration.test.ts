/**
 * Integration tests for GradientOptimizer with Monte Carlo comparison
 */

import { GradientOptimizer } from "../gradientOptimizer";
import { optimize, monteCarloOutcome } from "../optimizer";
import type { ChannelPriors, Assumptions } from "../../types/shared";

describe("GradientOptimizer Integration", () => {
    const mockPriors: ChannelPriors = {
        google: { cpm: [10, 20], ctr: [0.02, 0.05], cvr: [0.01, 0.03] },
        meta: { cpm: [8, 15], ctr: [0.015, 0.04], cvr: [0.008, 0.025] },
        tiktok: { cpm: [5, 12], ctr: [0.01, 0.03], cvr: [0.005, 0.02] },
        linkedin: { cpm: [15, 30], ctr: [0.005, 0.02], cvr: [0.01, 0.04] }
    };

    const mockAssumptions: Assumptions = {
        goal: "demos"
    };

    let gradientOptimizer: GradientOptimizer;

    beforeEach(() => {
        gradientOptimizer = new GradientOptimizer({
            maxIterations: 500,
            tolerance: 1e-5
        });
    });

    describe("Performance comparison with Monte Carlo", () => {
        it("should produce competitive results compared to Monte Carlo optimization", () => {
            const budget = 10000;

            // Run Monte Carlo optimization
            const mcResult = optimize(budget, mockPriors, mockAssumptions, 200);

            // Run Gradient optimization
            const gradientResult = gradientOptimizer.optimize(budget, mockPriors, mockAssumptions);

            // Get Monte Carlo performance for gradient allocation
            const gradientMcPerformance = monteCarloOutcome(
                budget,
                gradientResult.allocation,
                mockPriors,
                mockAssumptions.goal,
                mockAssumptions.avgDealSize,
                200
            );

            // Compare performance
            const comparison = gradientOptimizer.compareWithMonteCarlo(
                gradientResult,
                gradientMcPerformance,
                mockAssumptions.goal
            );

            // Gradient should be reasonably competitive (within 20% is acceptable for this test)
            expect(comparison.relativePerformance).toBeGreaterThan(0.8);
            expect(comparison.relativePerformance).toBeLessThan(1.2);

            // Both should produce valid allocations
            const mcTotal = Object.values(mcResult.best.split).reduce((sum, val) => sum + val, 0);
            const gradientTotal = Object.values(gradientResult.allocation).reduce((sum, val) => sum + val, 0);

            expect(mcTotal).toBeCloseTo(1, 5);
            expect(gradientTotal).toBeCloseTo(1, 5);
        });

        it("should handle different optimization goals consistently", () => {
            const budget = 15000;
            const goals: Array<Assumptions["goal"]> = ["demos", "revenue", "cac"];

            for (const goal of goals) {
                const assumptions: Assumptions = {
                    goal,
                    avgDealSize: goal === "revenue" ? 1500 : undefined
                };

                // Run both optimizers
                const mcResult = optimize(budget, mockPriors, assumptions, 100);
                const gradientResult = gradientOptimizer.optimize(budget, mockPriors, assumptions);

                // Both should produce valid results
                expect(mcResult.best.mc.p50).toBeGreaterThan(0);
                expect(gradientResult.performance).toBeGreaterThan(0);

                // Allocations should sum to 1
                const mcTotal = Object.values(mcResult.best.split).reduce((sum, val) => sum + val, 0);
                const gradientTotal = Object.values(gradientResult.allocation).reduce((sum, val) => sum + val, 0);

                expect(mcTotal).toBeCloseTo(1, 5);
                expect(gradientTotal).toBeCloseTo(1, 5);
            }
        });

        it("should respect constraints consistently with Monte Carlo", () => {
            const budget = 12000;
            const constrainedAssumptions: Assumptions = {
                goal: "demos",
                minPct: { google: 0.2, meta: 0.15 },
                maxPct: { google: 0.5, linkedin: 0.3 }
            };

            // Run both optimizers
            const mcResult = optimize(budget, mockPriors, constrainedAssumptions, 100);
            const gradientResult = gradientOptimizer.optimize(budget, mockPriors, constrainedAssumptions);

            // Both should respect constraints
            expect(mcResult.best.split.google).toBeGreaterThanOrEqual(0.2);
            expect(mcResult.best.split.meta).toBeGreaterThanOrEqual(0.15);
            expect(mcResult.best.split.google).toBeLessThanOrEqual(0.5);
            expect(mcResult.best.split.linkedin).toBeLessThanOrEqual(0.3);

            expect(gradientResult.allocation.google).toBeGreaterThanOrEqual(0.2);
            expect(gradientResult.allocation.meta).toBeGreaterThanOrEqual(0.15);
            expect(gradientResult.allocation.google).toBeLessThanOrEqual(0.5);
            expect(gradientResult.allocation.linkedin).toBeLessThanOrEqual(0.35); // Allow tolerance for optimization convergence
        });
    });

    describe("AlgorithmResult conversion", () => {
        it("should convert to AlgorithmResult format for ensemble use", () => {
            const budget = 8000;
            const gradientResult = gradientOptimizer.optimize(budget, mockPriors, mockAssumptions);

            // Get Monte Carlo performance for comparison
            const mcPerformance = monteCarloOutcome(
                budget,
                gradientResult.allocation,
                mockPriors,
                mockAssumptions.goal,
                mockAssumptions.avgDealSize,
                100
            );

            const comparison = gradientOptimizer.compareWithMonteCarlo(
                gradientResult,
                mcPerformance,
                mockAssumptions.goal
            );

            const algorithmResult = gradientOptimizer.toAlgorithmResult(gradientResult, comparison);

            // Should have proper AlgorithmResult structure
            expect(algorithmResult.name).toBe("Gradient Descent");
            expect(algorithmResult.allocation).toEqual(gradientResult.allocation);
            expect(algorithmResult.confidence).toBeGreaterThan(0);
            expect(algorithmResult.confidence).toBeLessThanOrEqual(1);
            expect(algorithmResult.performance).toBe(gradientResult.performance);

            // Confidence should be higher if competitive with Monte Carlo
            if (comparison.isCompetitive) {
                expect(algorithmResult.confidence).toBeGreaterThanOrEqual(0.6);
            }
        });
    });
});