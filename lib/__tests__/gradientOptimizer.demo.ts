/**
 * Demonstration script showing GradientOptimizer performance vs Monte Carlo
 * This is not a test file, but a demonstration of the algorithm capabilities
 */

import { GradientOptimizer } from "../gradientOptimizer";
import { optimize, monteCarloOutcome } from "../optimizer";
import type { ChannelPriors, Assumptions } from "../../types/shared";

// Sample data for demonstration
const samplePriors: ChannelPriors = {
  google: { cpm: [12, 25], ctr: [0.025, 0.06], cvr: [0.012, 0.035] },
  meta: { cpm: [9, 18], ctr: [0.018, 0.045], cvr: [0.009, 0.028] },
  tiktok: { cpm: [6, 14], ctr: [0.012, 0.035], cvr: [0.006, 0.022] },
  linkedin: { cpm: [18, 35], ctr: [0.008, 0.025], cvr: [0.012, 0.045] }
};

function runComparison() {
  console.log("=== Gradient Optimizer vs Monte Carlo Comparison ===\n");
  
  const budget = 15000;
  const assumptions: Assumptions = {
    goal: "demos",
    minPct: { google: 0.1 },
    maxPct: { linkedin: 0.4 }
  };
  
  console.log(`Budget: $${budget.toLocaleString()}`);
  console.log(`Goal: ${assumptions.goal}`);
  console.log(`Constraints: min Google 10%, max LinkedIn 40%\n`);
  
  // Run Monte Carlo optimization
  console.log("Running Monte Carlo optimization...");
  const startMC = Date.now();
  const mcResult = optimize(budget, samplePriors, assumptions, 500);
  const mcTime = Date.now() - startMC;
  
  console.log(`Monte Carlo Results (${mcTime}ms):`);
  console.log(`  Allocation: ${JSON.stringify(mcResult.best.split, null, 2)}`);
  console.log(`  Performance: ${mcResult.best.mc.p50.toFixed(2)} (p50)`);
  console.log(`  Range: ${mcResult.best.mc.p10.toFixed(2)} - ${mcResult.best.mc.p90.toFixed(2)}\n`);
  
  // Run Gradient optimization
  console.log("Running Gradient optimization...");
  const gradientOptimizer = new GradientOptimizer({
    maxIterations: 1000,
    tolerance: 1e-6
  });
  
  const startGrad = Date.now();
  const gradientResult = gradientOptimizer.optimize(budget, samplePriors, assumptions);
  const gradTime = Date.now() - startGrad;
  
  console.log(`Gradient Results (${gradTime}ms):`);
  console.log(`  Allocation: ${JSON.stringify(gradientResult.allocation, null, 2)}`);
  console.log(`  Performance: ${gradientResult.performance.toFixed(2)}`);
  console.log(`  Iterations: ${gradientResult.iterations}`);
  console.log(`  Converged: ${gradientResult.converged}\n`);
  
  // Get Monte Carlo performance for gradient allocation
  const gradientMcPerformance = monteCarloOutcome(
    budget,
    gradientResult.allocation,
    samplePriors,
    assumptions.goal,
    assumptions.avgDealSize,
    500
  );
  
  // Compare performance
  const comparison = gradientOptimizer.compareWithMonteCarlo(
    gradientResult,
    gradientMcPerformance,
    assumptions.goal
  );
  
  console.log("Performance Comparison:");
  console.log(`  Gradient vs MC p50: ${comparison.relativePerformance.toFixed(3)}x`);
  console.log(`  Performance difference: ${comparison.performanceDifference.toFixed(2)}`);
  console.log(`  Is competitive: ${comparison.isCompetitive}`);
  console.log(`  Speed improvement: ${(mcTime / gradTime).toFixed(1)}x faster\n`);
  
  // Convert to AlgorithmResult format
  const algorithmResult = gradientOptimizer.toAlgorithmResult(gradientResult, comparison);
  console.log("Algorithm Result Format:");
  console.log(`  Name: ${algorithmResult.name}`);
  console.log(`  Confidence: ${algorithmResult.confidence.toFixed(3)}`);
  console.log(`  Performance: ${algorithmResult.performance.toFixed(2)}`);
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  runComparison();
}

export { runComparison };