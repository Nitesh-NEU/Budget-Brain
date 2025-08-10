import { NextResponse } from "next/server";
import { optimize, deterministicConversions } from "@/lib/optimizer";
import type { ChannelPriors, Assumptions } from "@/types/shared";

function mkPriors(): ChannelPriors {
  return {
    google:  { cpm: [8, 8],   ctr: [0.02, 0.02], cvr: [0.10, 0.10] },   // CPA = 4
    meta:    { cpm: [6, 6],   ctr: [0.015,0.015],cvr: [0.08, 0.08] },   // CPA ≈ 5
    tiktok:  { cpm: [5, 5],   ctr: [0.01, 0.01], cvr: [0.06, 0.06] },   // CPA ≈ 8.33
    linkedin:{ cpm: [12,12],  ctr: [0.01, 0.01], cvr: [0.12, 0.12] }    // CPA = 10
  };
}

function baseAssumptions(): Assumptions {
  return { goal: "cac" };
}

export async function GET() {
  const budget = 1000;
  const priors = mkPriors();

  const res1 = optimize(budget, priors, baseAssumptions(), 400);
  const det1 = deterministicConversions(budget, res1.best.split, priors);
  const det2 = deterministicConversions(budget * 2, res1.best.split, priors);

  const res2 = optimize(budget, priors, { goal: "cac", minPct: { linkedin: 0.2 } }, 400);

  const worse = JSON.parse(JSON.stringify(priors)) as ChannelPriors; // safe clone
  worse.google.cpm = [16, 16];
  const res3 = optimize(budget, worse, baseAssumptions(), 400);

  return NextResponse.json({
    notes: [
      "res1 should allocate ~all to Google (best CPA).",
      "det2 should be ~2x det1.",
      "res2.linkedin >= 0.2",
      "After worsening Google CPM, res3 should shift away from Google."
    ],
    res1: { split: res1.best.split, mc: res1.best.mc, det1, det2 },
    res2: { split: res2.best.split },
    res3: { split: res3.best.split }
  });
}
