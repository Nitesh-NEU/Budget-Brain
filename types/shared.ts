
export type Channel = "google" | "meta" | "tiktok" | "linkedin";

export type Priors = {
  cpm: [number, number];
  ctr: [number, number];
  cvr: [number, number];
};

export type ChannelPriors = Record<Channel, Priors>;

export type Assumptions = {
  goal: "demos" | "revenue" | "cac";
  avgDealSize?: number;
  targetCAC?: number;
  minPct?: Partial<Record<Channel, number>>;
  maxPct?: Partial<Record<Channel, number>>;
};

export type Allocation = Record<Channel, number>;

export type Citation = {
  title?: string;
  url: string;
  note?: string;
};

export type ModelResult = {
  allocation: Allocation;
  detOutcome: number;
  mc: { p10: number; p50: number; p90: number };
  intervals: Record<string, [number, number]>;
  objective: Assumptions["goal"];
  summary: string;
  citations?: Citation[];
};

export type AlgorithmResult = {
  name: string;
  allocation: Allocation;
  confidence: number;
  performance: number;
};

export type ConsensusMetrics = {
  agreement: number; // How much algorithms agree (0-1)
  variance: Record<Channel, number>; // Variance in channel allocations
  outlierCount: number;
};

export type ValidationWarning = {
  type: string;
  message: string;
  severity: "low" | "medium" | "high";
  channel?: Channel;
};

export type BenchmarkAnalysis = {
  deviationScore: number; // How much allocation deviates from benchmarks (0-1)
  channelDeviations: Record<Channel, number>;
  warnings: ValidationWarning[];
};

export type StabilityMetrics = {
  overallStability: number; // 0-1 score of result consistency
  channelStability: Record<Channel, number>;
  convergenceScore: number; // How well algorithms converged
};

export type EnhancedModelResult = ModelResult & {
  confidence: {
    overall: number; // 0-1 confidence score
    perChannel: Record<Channel, number>;
    stability: number; // How consistent results are across methods
  };
  validation: {
    alternativeAlgorithms: AlgorithmResult[];
    consensus: ConsensusMetrics;
    benchmarkComparison: BenchmarkAnalysis;
    warnings: ValidationWarning[];
  };
  alternatives: {
    topAllocations: Allocation[];
    reasoningExplanation: string;
  };
};
