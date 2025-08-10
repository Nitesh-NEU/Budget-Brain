import type { ChannelPriors } from "@/types/shared";

type Metric = [number, number] | { mean: number; std_dev: number };

function toRange(m: Metric, clamp?: [number, number]): [number, number] {
  if (Array.isArray(m)) {
    const [a, b] = m[0] <= m[1] ? m : [m[1], m[0]];
    let lo = a, hi = b;
    if (clamp) { lo = Math.max(clamp[0], lo); hi = Math.min(clamp[1], hi); }
    return [lo, Math.max(lo, hi)];
  }
  // mean ± 2*sd (≈95%), then clamp
  let lo = m.mean - 2 * m.std_dev;
  let hi = m.mean + 2 * m.std_dev;
  if (clamp) { lo = Math.max(clamp[0], lo); hi = Math.min(clamp[1], hi); }
  if (hi < lo) hi = lo + Number.EPSILON;
  return [lo, hi];
}

export function normalizePriors(input: Record<string, any>): ChannelPriors {
  return {
    google: {
      cpm: toRange(input.google.cpm, [1e-9, Number.POSITIVE_INFINITY]),
      ctr: toRange(input.google.ctr, [0, 1]),
      cvr: toRange(input.google.cvr, [0, 1])
    },
    meta: {
      cpm: toRange(input.meta.cpm, [1e-9, Number.POSITIVE_INFINITY]),
      ctr: toRange(input.meta.ctr, [0, 1]),
      cvr: toRange(input.meta.cvr, [0, 1])
    },
    tiktok: {
      cpm: toRange(input.tiktok.cpm, [1e-9, Number.POSITIVE_INFINITY]),
      ctr: toRange(input.tiktok.ctr, [0, 1]),
      cvr: toRange(input.tiktok.cvr, [0, 1])
    },
    linkedin: {
      cpm: toRange(input.linkedin.cpm, [1e-9, Number.POSITIVE_INFINITY]),
      ctr: toRange(input.linkedin.ctr, [0, 1]),
      cvr: toRange(input.linkedin.cvr, [0, 1])
    }
  };
}
