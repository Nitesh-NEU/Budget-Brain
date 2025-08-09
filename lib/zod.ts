import { z } from "zod";

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


export const CitationSchema = z.object({
  title: z.string().optional(),
  url: z.string().url(),
  note: z.string().optional()
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
  mc: z.object({
    p10: z.number().min(0),
    p50: z.number().min(0),
    p90: z.number().min(0)
  }),
  intervals: z.record(
    z.string(),
    z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)])
  ),
  objective: z.enum(["demos", "revenue", "cac"]),
  summary: z.string(),
  citations: z.array(CitationSchema).optional()
});
