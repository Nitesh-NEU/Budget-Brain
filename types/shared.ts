
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
