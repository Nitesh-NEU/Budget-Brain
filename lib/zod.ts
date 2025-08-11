import { z } from "zod";

// Range priors
export const PriorsSchema = z.object({
  cpm: z.tuple([z.number().positive(), z.number().positive()]),
  ctr: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]),
  cvr: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)])
});

export const ChannelPriorsSchema = z.object({
  google: PriorsSchema,
  meta: PriorsSchema,
  tiktok: PriorsSchema,
  linkedin: PriorsSchema
});

const MeanStd = z.object({ mean: z.number().min(0), std_dev: z.number().min(0) });
const ChannelMeanStd = z.object({ cpm: MeanStd, ctr: MeanStd, cvr: MeanStd });

export const PriorsEitherSchema = z.object({
  google: z.union([PriorsSchema, ChannelMeanStd]),
  meta: z.union([PriorsSchema, ChannelMeanStd]),
  tiktok: z.union([PriorsSchema, ChannelMeanStd]),
  linkedin: z.union([PriorsSchema, ChannelMeanStd]),
  citations: z.array(z.any()).optional()
});

export const CitationSchema = z.object({
  title: z.string().optional(),
  url: z.string().url().optional(),
  note: z.string().optional(),
  text: z.string().optional(),
  id: z.string().optional()
});

export const PriorsResponseSchema = z.object({
  priors: ChannelPriorsSchema,
  citations: z.array(CitationSchema).optional()
});

export const AssumptionsSchema = z.object({
  goal: z.enum(["demos", "revenue", "cac"]),
  avgDealSize: z.number().positive().optional(),
  targetCAC: z.number().positive().optional(),
  minPct: z.record(z.string(), z.number().min(0).max(1)).optional(),
  maxPct: z.record(z.string(), z.number().min(0).max(1)).optional()
});

export const OptimizeBodySchema = z.object({
  budget: z.number().positive(),
  priors: ChannelPriorsSchema,
  assumptions: AssumptionsSchema,
  runs: z.number().int().min(100).max(5000).optional()
});

export const ModelResultSchema = z.object({
  allocation: z.record(z.string(), z.number().min(0).max(1)),
  detOutcome: z.number().min(0),
  mc: z.object({ p10: z.number().min(0), p50: z.number().min(0), p90: z.number().min(0) }),
  intervals: z.record(z.string(), z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)])),
  objective: z.enum(["demos", "revenue", "cac"]),
  summary: z.string(),
  citations: z.array(CitationSchema).optional()
});

export const AlgorithmResultSchema = z.object({
  name: z.string(),
  allocation: z.record(z.string(), z.number().min(0).max(1)),
  confidence: z.number().min(0).max(1),
  performance: z.number().min(0)
});

export const ConsensusMetricsSchema = z.object({
  agreement: z.number().min(0).max(1),
  variance: z.record(z.string(), z.number().min(0)),
  outlierCount: z.number().int().min(0)
});

export const ValidationWarningSchema = z.object({
  type: z.string(),
  message: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  channel: z.enum(["google", "meta", "tiktok", "linkedin"]).optional()
});

export const BenchmarkAnalysisSchema = z.object({
  deviationScore: z.number().min(0).max(1),
  channelDeviations: z.record(z.string(), z.number().min(0)),
  warnings: z.array(ValidationWarningSchema)
});

export const StabilityMetricsSchema = z.object({
  overallStability: z.number().min(0).max(1),
  channelStability: z.record(z.string(), z.number().min(0).max(1)),
  convergenceScore: z.number().min(0).max(1)
});

export const EnhancedModelResultSchema = ModelResultSchema.extend({
  confidence: z.object({
    overall: z.number().min(0).max(1),
    perChannel: z.record(z.string(), z.number().min(0).max(1)),
    stability: z.number().min(0).max(1)
  }),
  validation: z.object({
    alternativeAlgorithms: z.array(AlgorithmResultSchema),
    consensus: ConsensusMetricsSchema,
    benchmarkComparison: BenchmarkAnalysisSchema,
    warnings: z.array(ValidationWarningSchema)
  }),
  alternatives: z.object({
    topAllocations: z.array(z.record(z.string(), z.number().min(0).max(1))),
    reasoningExplanation: z.string()
  })
});
