// lib/optimizer.ts
import type { Allocation, Assumptions, Channel, ChannelPriors } from "@/types/shared";

function sampleUniform(a: number, b: number) {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return lo + Math.random() * (hi - lo);
}

function objectiveFromConversions(
  goal: Assumptions["goal"],
  conversions: number,
  budget: number,
  avgDealSize?: number
) {
  if (goal === "revenue") return conversions * (avgDealSize ?? 0);
  if (goal === "cac") return budget / Math.max(conversions, 1e-9);
  return conversions;
}

// No generators. Just return an array.
export function splits10Array(): Allocation[] {
  const arr: Allocation[] = [];
  for (let g = 0; g <= 10; g++) {
    for (let m = 0; m <= 10 - g; m++) {
      for (let t = 0; t <= 10 - g - m; t++) {
        const l = 10 - g - m - t;
        arr.push({ google: g / 10, meta: m / 10, tiktok: t / 10, linkedin: l / 10 });
      }
    }
  }
  return arr;
}

export function respectsConstraints(
  split: Allocation,
  minPct?: Partial<Record<Channel, number>>,
  maxPct?: Partial<Record<Channel, number>>
) {
  for (const [ch, val] of Object.entries(split) as [Channel, number][]) {
    if (minPct && minPct[ch] != null && val < minPct[ch]!) return false;
    if (maxPct && maxPct[ch] != null && val > maxPct[ch]!) return false;
  }
  return true;
}

export function deterministicConversions(
  budget: number,
  split: Allocation,
  priors: ChannelPriors
) {
  let total = 0;
  (Object.keys(split) as Channel[]).forEach((ch) => {
    const spend = budget * split[ch];
    const cpmMid = (priors[ch].cpm[0] + priors[ch].cpm[1]) / 2;
    const ctrMid = (priors[ch].ctr[0] + priors[ch].ctr[1]) / 2;
    const cvrMid = (priors[ch].cvr[0] + priors[ch].cvr[1]) / 2;

    const impressions = (spend / cpmMid) * 1000;
    const clicks = impressions * ctrMid;
    const conv = clicks * cvrMid;
    total += conv;
  });
  return total;
}

export function monteCarloOutcome(
  budget: number,
  split: Allocation,
  priors: ChannelPriors,
  goal: Assumptions["goal"],
  avgDealSize?: number,
  runs = 800
) {
  const outcomes: number[] = [];
  for (let i = 0; i < runs; i++) {
    let conv = 0;
    (Object.keys(split) as Channel[]).forEach((ch) => {
      const spend = budget * split[ch];
      const cpm = sampleUniform(priors[ch].cpm[0], priors[ch].cpm[1]);
      const ctr = sampleUniform(priors[ch].ctr[0], priors[ch].ctr[1]);
      const cvr = sampleUniform(priors[ch].cvr[0], priors[ch].cvr[1]);
      const impressions = (spend / cpm) * 1000;
      const clicks = impressions * ctr;
      conv += clicks * cvr;
    });
    outcomes.push(objectiveFromConversions(goal, conv, budget, avgDealSize));
  }
  outcomes.sort((a, b) => a - b);
  const p = (q: number) =>
    outcomes[Math.max(0, Math.min(outcomes.length - 1, Math.floor(q * (outcomes.length - 1))))];
  return { p10: p(0.1), p50: p(0.5), p90: p(0.9) };
}

export function optimize(
  budget: number,
  priors: ChannelPriors,
  assumptions: Assumptions,
  runs = 800
) {
  const candidates: { split: Allocation; det: number; mc: { p10: number; p50: number; p90: number } }[] = [];

  for (const split of splits10Array()) {
    if (!respectsConstraints(split, assumptions.minPct, assumptions.maxPct)) continue;
    const det = deterministicConversions(budget, split, priors);
    const mc = monteCarloOutcome(budget, split, priors, assumptions.goal, assumptions.avgDealSize, runs);
    candidates.push({ split, det, mc });
  }
  if (candidates.length === 0) throw new Error("No candidate splits satisfy constraints");

  const isMinimize = assumptions.goal === "cac";
  const best = candidates.reduce((acc, cur) => {
    const a = isMinimize ? acc.mc.p50 : -acc.mc.p50;
    const b = isMinimize ? cur.mc.p50 : -cur.mc.p50;
    return b < a ? cur : acc;
  });

  const top5 = candidates
    .sort((a, b) => (isMinimize ? a.mc.p50 - b.mc.p50 : b.mc.p50 - a.mc.p50))
    .slice(0, 5);

  const intervals: Record<string, [number, number]> = {};
  (Object.keys(best.split) as Channel[]).forEach((ch) => {
    const vals = top5.map((c) => c.split[ch]).sort((a, b) => a - b);
    const lo = vals[Math.floor(0.1 * (vals.length - 1))] ?? vals[0];
    const hi = vals[Math.floor(0.9 * (vals.length - 1))] ?? vals[vals.length - 1];
    intervals[ch] = [lo, hi];
  });

  return { best, intervals };
}
