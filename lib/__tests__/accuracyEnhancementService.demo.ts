/**
 * Demo script for AccuracyEnhancementService
 * Shows the service in action with different enhancement levels
 */

import { AccuracyEnhancementService } from "../accuracyEnhancementService";
import type { ChannelPriors, Assumptions } from "@/types/shared";

async function runDemo() {
  console.log("🚀 AccuracyEnhancementService Demo\n");

  const service = new AccuracyEnhancementService();
  
  const budget = 25000;
  const priors: ChannelPriors = {
    google: { cpm: [12, 22], ctr: [0.025, 0.045], cvr: [0.12, 0.28] },
    meta: { cpm: [10, 18], ctr: [0.02, 0.04], cvr: [0.1, 0.25] },
    tiktok: { cpm: [14, 26], ctr: [0.03, 0.05], cvr: [0.08, 0.22] },
    linkedin: { cpm: [18, 32], ctr: [0.015, 0.03], cvr: [0.15, 0.35] }
  };

  const assumptions: Assumptions = {
    goal: "revenue",
    avgDealSize: 2500,
    minPct: { linkedin: 0.1 },
    maxPct: { tiktok: 0.3 }
  };

  console.log("📊 Test Scenario:");
  console.log(`Budget: $${budget.toLocaleString()}`);
  console.log(`Goal: ${assumptions.goal}`);
  console.log(`Average Deal Size: $${assumptions.avgDealSize}`);
  console.log(`Constraints: LinkedIn min 10%, TikTok max 30%\n`);

  // Test Fast Enhancement
  console.log("⚡ Fast Enhancement Level:");
  const startFast = Date.now();
  const fastResult = await service.enhanceOptimization(budget, priors, assumptions, {
    level: "fast",
    includeAlternatives: true,
    validateAgainstBenchmarks: true
  });
  const fastTime = Date.now() - startFast;

  console.log(`Time: ${fastTime}ms`);
  console.log(`Confidence: ${(fastResult.confidence.overall * 100).toFixed(1)}%`);
  console.log(`Allocation:`, Object.entries(fastResult.allocation)
    .map(([ch, val]) => `${ch}: ${(val * 100).toFixed(1)}%`)
    .join(", "));
  console.log(`Validation Algorithms: ${fastResult.validation.alternativeAlgorithms.length}`);
  console.log(`Warnings: ${fastResult.validation.warnings.length}\n`);

  // Test Standard Enhancement
  console.log("🎯 Standard Enhancement Level:");
  const startStandard = Date.now();
  const standardResult = await service.enhanceOptimization(budget, priors, assumptions, {
    level: "standard",
    includeAlternatives: true,
    validateAgainstBenchmarks: true
  });
  const standardTime = Date.now() - startStandard;

  console.log(`Time: ${standardTime}ms`);
  console.log(`Confidence: ${(standardResult.confidence.overall * 100).toFixed(1)}%`);
  console.log(`Allocation:`, Object.entries(standardResult.allocation)
    .map(([ch, val]) => `${ch}: ${(val * 100).toFixed(1)}%`)
    .join(", "));
  console.log(`Validation Algorithms: ${standardResult.validation.alternativeAlgorithms.length}`);
  console.log(`Consensus Agreement: ${(standardResult.validation.consensus.agreement * 100).toFixed(1)}%`);
  console.log(`Alternatives Provided: ${standardResult.alternatives.topAllocations.length}\n`);

  // Show constraint compliance
  console.log("✅ Constraint Compliance:");
  console.log(`LinkedIn >= 10%: ${standardResult.allocation.linkedin >= 0.1 ? "✓" : "✗"} (${(standardResult.allocation.linkedin * 100).toFixed(1)}%)`);
  console.log(`TikTok <= 30%: ${standardResult.allocation.tiktok <= 0.3 ? "✓" : "✗"} (${(standardResult.allocation.tiktok * 100).toFixed(1)}%)`);
  
  // Show performance comparison
  console.log("\n📈 Performance Comparison:");
  console.log(`Fast Enhancement: ${fastTime}ms`);
  console.log(`Standard Enhancement: ${standardTime}ms`);
  console.log(`Speed Improvement: ${((standardTime - fastTime) / standardTime * 100).toFixed(1)}% faster with fast mode`);

  console.log("\n🎉 Demo completed successfully!");
}

// Run demo if this file is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo };