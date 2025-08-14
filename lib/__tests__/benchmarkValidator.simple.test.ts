import { validateAllocation } from "../benchmarkValidator";
import type { Allocation, ChannelPriors } from "../../types/shared";

describe("BenchmarkValidator Simple", () => {
  it("should validate allocation", () => {
    const allocation: Allocation = {
      google: 0.25,
      meta: 0.25,
      tiktok: 0.25,
      linkedin: 0.25
    };

    const priors: ChannelPriors = {
      google: { cpm: [10, 20], ctr: [0.02, 0.05], cvr: [0.02, 0.08] },
      meta: { cpm: [8, 15], ctr: [0.015, 0.04], cvr: [0.015, 0.06] },
      tiktok: { cpm: [5, 12], ctr: [0.01, 0.03], cvr: [0.01, 0.04] },
      linkedin: { cpm: [15, 30], ctr: [0.005, 0.02], cvr: [0.02, 0.10] }
    };

    const result = validateAllocation(allocation, priors);
    expect(result).toBeDefined();
    expect(result.deviationScore).toBeGreaterThanOrEqual(0);
    expect(result.deviationScore).toBeLessThanOrEqual(1);
  });
});