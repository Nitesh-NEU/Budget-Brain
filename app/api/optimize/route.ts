import { NextRequest, NextResponse } from "next/server";
import { OptimizeBodySchema } from "@/lib/zod";
import { optimize } from "@/lib/optimizer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { budget, priors, assumptions, runs } = OptimizeBodySchema.parse(body);

    const { best, intervals } = optimize(budget, priors, assumptions, runs ?? 800);

    const summary =
      `Deterministic baseline estimated ${best.det.toFixed(2)} for ${assumptions.goal}. ` +
      `Monte Carlo p50 ${best.mc.p50.toFixed(2)} with p10 ${best.mc.p10.toFixed(2)} and p90 ${best.mc.p90.toFixed(2)}. ` +
      `Split chosen by ${assumptions.goal} objective.`;

    return NextResponse.json({
      allocation: best.split,
      detOutcome: best.det,
      p10: best.mc.p10,
      p50: best.mc.p50,
      p90: best.mc.p90,
      intervals,
      objective: assumptions.goal,
      summary
    });

    
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Bad request" }, { status: 400 });
  }
}
