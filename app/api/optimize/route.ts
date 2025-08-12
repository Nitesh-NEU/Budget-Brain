import { NextRequest, NextResponse } from "next/server";
import { OptimizeBodySchema } from "@/lib/zod";
import { optimize } from "@/lib/optimizer";
import { AccuracyEnhancementService } from "@/lib/accuracyEnhancementService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { budget, priors, assumptions, runs } = OptimizeBodySchema.parse(body);

    // Extract query parameters for enhancement configuration
    const searchParams = req.nextUrl.searchParams;
    const enhancementLevel = searchParams.get('enhancement') as 'fast' | 'standard' | 'thorough' | null;
    const includeAlternatives = searchParams.get('alternatives') !== 'false';
    const validateBenchmarks = searchParams.get('benchmarks') !== 'false';
    const enableLLMValidation = searchParams.get('llm') !== 'false';
    
    // Check if enhanced optimization is requested
    // Priority: query param 'enhanced' > body 'enhanced' > default true for better results
    let useEnhancedOptimization = true;
    if (searchParams.has('enhanced')) {
      useEnhancedOptimization = searchParams.get('enhanced') !== 'false';
    } else if (body.hasOwnProperty('enhanced')) {
      useEnhancedOptimization = body.enhanced !== false;
    }

    if (useEnhancedOptimization) {
      // Use the new AccuracyEnhancementService for better results
      const enhancementService = new AccuracyEnhancementService();
      
      const enhancedResult = await enhancementService.enhanceOptimization(
        budget,
        priors,
        assumptions,
        {
          level: enhancementLevel || 'standard',
          includeAlternatives,
          validateAgainstBenchmarks: validateBenchmarks,
          enableLLMValidation
        }
      );

      // For backward compatibility, always include the original response structure
      const response: any = {
        allocation: enhancedResult.allocation,
        detOutcome: enhancedResult.detOutcome,
        p10: enhancedResult.mc.p10,
        p50: enhancedResult.mc.p50,
        p90: enhancedResult.mc.p90,
        intervals: enhancedResult.intervals,
        objective: enhancedResult.objective,
        summary: enhancedResult.summary
      };

      // Only include enhanced features if they exist and client hasn't opted out
      if (enhancedResult.confidence && searchParams.get('confidence') !== 'false') {
        response.confidence = enhancedResult.confidence;
      }
      if (enhancedResult.validation && searchParams.get('validation') !== 'false') {
        response.validation = enhancedResult.validation;
      }
      if (enhancedResult.alternatives && includeAlternatives) {
        response.alternatives = enhancedResult.alternatives;
      }

      return NextResponse.json(response);
    } else {
      // Fallback to original optimization for full backward compatibility
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
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Bad request" }, { status: 400 });
  }
}
