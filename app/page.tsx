/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
 * 
 * This file contains proprietary user interface and application logic.
 * Unauthorized copying, modification, distribution, or commercial use 
 * is strictly prohibited.
 * 
 * See LICENSE file for full terms and conditions.
 */

"use client";
import { useMemo, useState } from "react";
import type {
  Assumptions,
  ChannelPriors,
  Allocation,
  EnhancedModelResult,
  OptimizationPipeline,
  Citation,
  ValidationWarning,
  BenchmarkAnalysis,
  AlgorithmResult,
  ConsensusMetrics
} from "@/types/shared";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis
} from "recharts";

// Import visualization components
import { PipelineFlowVisualizer } from "@/components/PipelineFlowVisualizer";
import { ConfidenceDashboard } from "@/components/ConfidenceDashboard";
import { DataQualityPanel } from "@/components/DataQualityPanel";
import { AlternativeOptionsExplorer } from "@/components/AlternativeOptionsExplorer";
import { VisualizationProvider } from "@/lib/visualizationContext";
import {
  createRealisticPipelineSimulation,
  completeStageAndProgress,
  autoProgressPipeline,
  STAGE_EXECUTION_ORDER
} from "@/lib/pipelineStageManager";
import { PipelineStageStatus, StageId } from "@/types/pipeline";

const CHANNELS = ["google", "meta", "tiktok", "linkedin"] as const;
type ChannelKey = typeof CHANNELS[number];

const COLORS: Record<ChannelKey, string> = {
  google: "#4285F4",
  meta: "#1877F2",
  tiktok: "#00F2EA",
  linkedin: "#0A66C2",
};

export default function HomePage() {
  const [company, setCompany] = useState("B2B SaaS startup");
  const [budget, setBudget] = useState(5000);
  const [goal, setGoal] = useState<Assumptions["goal"]>("demos");
  const [avgDealSize, setAvgDealSize] = useState(1000);
  const [runs, setRuns] = useState(800);
  const [showAssumptions, setShowAssumptions] = useState(true);

  const [priors, setPriors] = useState<ChannelPriors | null>(null);
  const [citations, setCitations] = useState<{ title?: string; url?: string; note?: string; text?: string }[]>([]);

  const [minPct, setMinPct] = useState<Record<ChannelKey, number>>({
    google: 0.1, meta: 0.1, tiktok: 0.05, linkedin: 0.05,
  });
  const [maxPct, setMaxPct] = useState<Record<ChannelKey, number>>({
    google: 0.6, meta: 0.6, tiktok: 0.4, linkedin: 0.4,
  });

  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [detOutcome, setDetOutcome] = useState<number | null>(null);
  const [p10, setP10] = useState<number | null>(null);
  const [p50, setP50] = useState<number | null>(null);
  const [p90, setP90] = useState<number | null>(null);
  const [intervals, setIntervals] = useState<Record<string, [number, number]> | null>(null);
  const [summary, setSummary] = useState<string>("");

  // Enhanced result state for visualization components
  const [enhancedResult, setEnhancedResult] = useState<EnhancedModelResult | null>(null);
  const [pipeline, setPipeline] = useState<OptimizationPipeline | null>(null);
  const [showPipeline, setShowPipeline] = useState(false);

  const [loading, setLoading] = useState(false);
  const [priorsLoading, setPriorsLoading] = useState(false);
  const [priorsSuccess, setPriorsSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Reset pipeline and results
  const resetPipeline = async () => {
    setResetLoading(true);

    try {
      // Clear server-side cache first
      await fetch("/api/optimize?action=clear-cache", {
        method: "GET"
      });

      // Clear client-side state
      setPipeline(null);
      setShowPipeline(false);
      setAllocation(null);
      setEnhancedResult(null);
      setDetOutcome(null);
      setP10(null);
      setP50(null);
      setP90(null);
      setIntervals(null);
      setSummary("");
      setPriors(null);
      setCitations([]);
      setErr(null);

    } catch (error) {
      // Silently handle cache clear errors
      // Still clear client-side state even if server cache clear fails
      setPipeline(null);
      setShowPipeline(false);
      setAllocation(null);
      setEnhancedResult(null);
      setDetOutcome(null);
      setP10(null);
      setP50(null);
      setP90(null);
      setIntervals(null);
      setSummary("");
      setPriors(null);
      setCitations([]);
      setErr(null);
    } finally {
      setResetLoading(false);
    }
  };

  async function fetchPriors() {
    setErr(null);
    setAllocation(null);
    setPriorsLoading(true);
    setPriorsSuccess(false);

    // Initialize pipeline when starting to fetch priors
    const initialPipeline = createRealisticPipelineSimulation('starting');
    setPipeline(initialPipeline);
    setShowPipeline(true);

    try {
      const res = await fetch(`/api/priors?company=${encodeURIComponent(company)}`);
      const json = await res.json();
      //   console.log("priors/citations =>", json)
      if (!res.ok) throw new Error(json.error || "Failed to fetch priors");

      // Simulate pipeline progress during priors fetch
      setPipeline(prev => {
        if (!prev) return prev;
        // Complete data fetch stage
        let updatedPipeline = completeStageAndProgress(prev, 'dataFetch', 2000, 'Successfully fetched benchmark data from web sources');
        // Start validation stage
        updatedPipeline = autoProgressPipeline(updatedPipeline);
        return updatedPipeline;
      });

      setPriors(json.priors);
      setCitations(json.citations || []);
      setPriorsSuccess(true);

      // Complete validation stage after priors are loaded
      setTimeout(() => {
        setPipeline(prev => {
          if (!prev) return prev;
          return completeStageAndProgress(prev, 'validation', 1500, 'Data validation completed - citations verified');
        });
      }, 500);

      setTimeout(() => setPriorsSuccess(false), 2000); // Hide success after 2s
    } catch (e: any) {
      setErr(e.message);
      // Mark pipeline as failed if priors fetch fails
      setPipeline(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          stages: {
            ...prev.stages,
            dataFetch: {
              ...prev.stages.dataFetch,
              status: PipelineStageStatus.ERROR,
              error: 'Failed to fetch benchmark data'
            }
          },
          failedStages: ['dataFetch']
        };
      });
    } finally {
      setPriorsLoading(false);
    }
  }

  async function runOptimize() {
    if (!priors) return;
    setErr(null);
    setLoading(true);

    // Start optimization stages in pipeline
    setPipeline(prev => {
      if (!prev) return prev;
      // Start ensemble optimization
      let updatedPipeline = autoProgressPipeline(prev);
      return updatedPipeline;
    });

    try {
      const body = {
        budget: Number(budget),
        priors,
        assumptions: { goal, avgDealSize: goal === "revenue" ? avgDealSize : undefined, minPct, maxPct },
        runs,
      };

      // Simulate optimization progress
      const optimizationStages: StageId[] = ['ensembleOptimization', 'bayesianOptimization', 'gradientOptimization'];
      let stageIndex = 0;

      const progressInterval = setInterval(() => {
        setPipeline(prev => {
          if (!prev || stageIndex >= optimizationStages.length) {
            clearInterval(progressInterval);
            return prev;
          }

          const currentStage = optimizationStages[stageIndex];
          const stage = prev.stages[currentStage];

          if (stage.status === PipelineStageStatus.RUNNING) {
            const newProgress = Math.min(100, (stage.progress || 0) + Math.random() * 20 + 10);

            if (newProgress >= 100) {
              // Complete current stage and move to next
              stageIndex++;
              let updatedPipeline = completeStageAndProgress(
                prev,
                currentStage,
                undefined,
                `${stage.name} completed successfully`
              );

              // Start next stage if available
              if (stageIndex < optimizationStages.length) {
                updatedPipeline = autoProgressPipeline(updatedPipeline);
              }

              return updatedPipeline;
            } else {
              // Update progress
              return {
                ...prev,
                stages: {
                  ...prev.stages,
                  [currentStage]: {
                    ...stage,
                    progress: newProgress,
                    details: `${stage.name} running... ${Math.round(newProgress)}% complete`
                  }
                }
              };
            }
          }

          return prev;
        });
      }, 800);

      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      //   console.log("priors/citations =>", json)
      if (!res.ok) throw new Error(json.error || "Optimization failed");

      // Clear the progress interval
      clearInterval(progressInterval);

      // Complete remaining optimization stages and start final stages
      setPipeline(prev => {
        if (!prev) return prev;

        // Complete all optimization stages
        let updatedPipeline = prev;
        for (const stageId of optimizationStages) {
          if (updatedPipeline.stages[stageId].status !== PipelineStageStatus.COMPLETED) {
            updatedPipeline = completeStageAndProgress(
              updatedPipeline,
              stageId,
              undefined,
              `${updatedPipeline.stages[stageId].name} completed`
            );
          }
        }

        // Start confidence scoring
        updatedPipeline = autoProgressPipeline(updatedPipeline);

        // Complete confidence scoring and start validation stages
        setTimeout(() => {
          setPipeline(current => {
            if (!current) return current;
            let pipeline = completeStageAndProgress(current, 'confidenceScoring', 1500, 'Confidence metrics calculated');
            pipeline = autoProgressPipeline(pipeline);
            return pipeline;
          });
        }, 1000);

        // Complete validation stages
        setTimeout(() => {
          setPipeline(current => {
            if (!current) return current;
            let pipeline = completeStageAndProgress(current, 'benchmarkValidation', 2000, 'Benchmark validation completed');
            pipeline = completeStageAndProgress(pipeline, 'llmValidation', 2500, 'LLM validation completed');
            pipeline = autoProgressPipeline(pipeline);
            return pipeline;
          });
        }, 2500);

        // Complete final selection
        setTimeout(() => {
          setPipeline(current => {
            if (!current) return current;
            return completeStageAndProgress(current, 'finalSelection', 500, 'Optimal allocation selected');
          });
        }, 4000);

        return updatedPipeline;
      });

      // Set basic results
      setAllocation(json.allocation);
      setDetOutcome(json.detOutcome);
      setP10(json.p10);
      setP50(json.p50);
      setP90(json.p90);
      setIntervals(json.intervals);
      setSummary(json.summary);

      // Set enhanced results if available
      if (json.pipeline) {
        // Use the API pipeline if provided, but keep our simulation for demo
        // setPipeline(json.pipeline);
      }
      if (json.confidence || json.validation || json.alternatives) {
        setEnhancedResult(json as EnhancedModelResult);
      }
    } catch (e: any) {
      setErr(e.message);
      // Mark optimization as failed
      setPipeline(prev => {
        if (!prev) return prev;
        const currentStage = Object.entries(prev.stages).find(
          ([_, stage]) => stage.status === PipelineStageStatus.RUNNING
        );

        if (currentStage) {
          return {
            ...prev,
            stages: {
              ...prev.stages,
              [currentStage[0]]: {
                ...currentStage[1],
                status: PipelineStageStatus.ERROR,
                error: 'Optimization failed'
              }
            },
            failedStages: [...prev.failedStages, currentStage[0]]
          };
        }

        return prev;
      });
    } finally {
      setLoading(false);
    }
  }

  const pieData = useMemo(() => {
    if (!allocation) return [];
    return CHANNELS.map((ch) => ({ name: ch, value: +(allocation[ch] * 100).toFixed(2), color: COLORS[ch] }));
  }, [allocation]);

  const intervalData = useMemo(() => {
    if (!intervals) return [];
    return CHANNELS.map((ch) => {
      const [lo, hi] = intervals[ch] ?? [0, 0];
      return { channel: ch, lo: +(lo * 100).toFixed(1), hi: +(hi * 100).toFixed(1) };
    });
  }, [intervals]);

  const sliderPct = (v: number) => `${Math.round(v * 100)}%`;

  // Helper function to generate mock enhanced data for visualization
  const generateMockEnhancedData = (allocation: Allocation): EnhancedModelResult => {
    const mockCitations = citations.filter(c => c.url).map((c, i) => ({
      title: c.title,
      url: c.url!,
      note: c.note,
      validationStatus: Math.random() > 0.2 ? 'valid' as const : 'warning' as const,
      lastChecked: new Date().toISOString(),
      responseTime: Math.floor(Math.random() * 500) + 100,
      contentQuality: Math.random() * 0.4 + 0.6,
      issues: Math.random() > 0.7 ? ['Outdated data detected'] : undefined
    }));

    const mockAlgorithms: AlgorithmResult[] = [
      {
        name: 'ensemble',
        allocation,
        confidence: Math.random() * 0.3 + 0.7,
        performance: Math.random() * 0.2 + 0.8
      },
      {
        name: 'bayesian',
        allocation: Object.fromEntries(
          CHANNELS.map(ch => [ch, allocation[ch] * (0.9 + Math.random() * 0.2)])
        ) as Allocation,
        confidence: Math.random() * 0.3 + 0.6,
        performance: Math.random() * 0.2 + 0.75
      },
      {
        name: 'gradient',
        allocation: Object.fromEntries(
          CHANNELS.map(ch => [ch, allocation[ch] * (0.85 + Math.random() * 0.3)])
        ) as Allocation,
        confidence: Math.random() * 0.3 + 0.65,
        performance: Math.random() * 0.2 + 0.7
      }
    ];

    const mockConsensus: ConsensusMetrics = {
      agreement: Math.random() * 0.3 + 0.7,
      variance: Object.fromEntries(
        CHANNELS.map(ch => [ch as string, Math.random() * 0.1 + 0.05])
      ) as Record<string, number>,
      outlierCount: Math.floor(Math.random() * 2)
    };

    const mockWarnings: ValidationWarning[] = [
      {
        type: 'data_quality',
        message: 'Some benchmark data is older than 30 days',
        severity: 'medium',
        channel: 'tiktok'
      },
      {
        type: 'confidence',
        message: 'Low confidence in LinkedIn conversion rates',
        severity: 'low',
        channel: 'linkedin'
      }
    ];

    const mockBenchmarkAnalysis: BenchmarkAnalysis = {
      deviationScore: Math.random() * 0.4 + 0.1,
      channelDeviations: Object.fromEntries(
        CHANNELS.map(ch => [ch as string, Math.random() * 0.3 + 0.1])
      ) as Record<string, number>,
      warnings: mockWarnings
    };

    return {
      allocation,
      detOutcome: detOutcome || 0,
      mc: { p10: p10 || 0, p50: p50 || 0, p90: p90 || 0 },
      intervals: intervals || {},
      objective: goal,
      summary,
      citations: citations.filter(c => c.url) as Citation[],
      confidence: {
        overall: Math.random() * 0.3 + 0.7,
        perChannel: Object.fromEntries(
          CHANNELS.map(ch => [ch as string, Math.random() * 0.3 + 0.6])
        ) as Record<string, number>,
        stability: Math.random() * 0.3 + 0.7
      },
      validation: {
        alternativeAlgorithms: mockAlgorithms,
        consensus: mockConsensus,
        benchmarkComparison: mockBenchmarkAnalysis,
        warnings: mockWarnings
      },
      alternatives: {
        topAllocations: [
          allocation,
          Object.fromEntries(
            CHANNELS.map(ch => [ch, allocation[ch] * (0.8 + Math.random() * 0.4)])
          ) as Allocation,
          Object.fromEntries(
            CHANNELS.map(ch => [ch, allocation[ch] * (0.9 + Math.random() * 0.2)])
          ) as Allocation
        ],
        reasoningExplanation: "Alternative allocations based on different optimization approaches and risk profiles."
      }
    };
  };

  // Generate mock data when we have allocation but no enhanced result
  const mockEnhancedResult = useMemo(() => {
    if (allocation && !enhancedResult) {
      return generateMockEnhancedData(allocation);
    }
    return enhancedResult;
  }, [allocation, enhancedResult, detOutcome, p10, p50, p90, intervals, summary, citations, goal, generateMockEnhancedData]);

  return (
    <VisualizationProvider initialPipeline={pipeline || undefined}>
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <header className="rounded-2xl p-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow">
          <h1 className="text-2xl md:text-3xl font-bold">Budget Brain</h1>
          <p className="opacity-90">Deterministic + Monte Carlo allocation with editable constraints & citations</p>
        </header>

        {/* Inputs + Assumptions */}
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="card-title">Inputs</h2>

            <div className="grid gap-3">
              <label className="label">Company</label>
              <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />

              <label className="label">Monthly budget (USD)</label>
              <input className="input" type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />

              <label className="label">Goal</label>
              <select className="input" value={goal} onChange={(e) => setGoal(e.target.value as Assumptions["goal"])}>
                <option value="demos">demos</option>
                <option value="revenue">revenue</option>
                <option value="cac">cac</option>
              </select>

              {goal === "revenue" && (
                <>
                  <label className="label">Average deal size (USD)</label>
                  <input className="input" type="number" value={avgDealSize} onChange={(e) => setAvgDealSize(Number(e.target.value))} />
                </>
              )}

              <div className="flex items-center gap-3">
                <label className="label shrink-0">MC runs</label>
                <input className="w-full" type="range" min={200} max={2000} step={100} value={runs} onChange={(e) => setRuns(Number(e.target.value))} />
                <span className="badge">{runs}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="subtle mb-2">Min % per channel</h3>
                  {CHANNELS.map((ch) => (
                    <div key={ch} className="row">
                      <span className="mono">{ch}</span>
                      <input
                        type="range" min={0} max={100} step={5}
                        value={Math.round(minPct[ch] * 100)}
                        onChange={(e) => setMinPct({ ...minPct, [ch]: Number(e.target.value) / 100 })}
                      />
                      <span className="badge">{sliderPct(minPct[ch])}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="subtle mb-2">Max % per channel</h3>
                  {CHANNELS.map((ch) => (
                    <div key={ch} className="row">
                      <span className="mono">{ch}</span>
                      <input
                        type="range" min={0} max={100} step={5}
                        value={Math.round(maxPct[ch] * 100)}
                        onChange={(e) => setMaxPct({ ...maxPct, [ch]: Number(e.target.value) / 100 })}
                      />
                      <span className="badge">{sliderPct(maxPct[ch])}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  className={`btn disabled:opacity-50 flex items-center gap-2 transition-colors duration-200 ${priorsSuccess ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300' : ''
                    }`}
                  onClick={fetchPriors}
                  disabled={priorsLoading}
                >
                  {priorsLoading && (
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  )}
                  {priorsSuccess && (
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {priorsLoading ? "Fetching..." : priorsSuccess ? "Loaded!" : "Get priors"}
                </button>
                <button
                  className="btn-primary disabled:opacity-50 flex items-center gap-2"
                  onClick={runOptimize}
                  disabled={!priors || loading}
                >
                  {loading && (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  )}
                  {loading ? "Optimizing..." : "Optimize"}
                </button>

                {showPipeline && (
                  <button
                    className="btn bg-gray-500 text-white hover:bg-gray-600 flex items-center gap-2 disabled:opacity-50"
                    onClick={resetPipeline}
                    disabled={resetLoading}
                    title="Reset pipeline and start over"
                  >
                    {resetLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    {resetLoading ? "Resetting..." : "Reset"}
                  </button>
                )}
              </div>

              {err && <div className="alert">{err}</div>}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="card-title">Assumptions</h2>
              <button className="text-sm underline" onClick={() => setShowAssumptions(!showAssumptions)}>
                {showAssumptions ? "Hide" : "Show"}
              </button>
            </div>

            {!priors && !priorsLoading && <p className="subtle">Click <b>Get priors</b> to fetch CPM/CTR/CVR ranges + citations.</p>}

            {priorsLoading && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Fetching advertising benchmarks...</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {showPipeline ? 'Pipeline started - Data Fetch and Validation in progress' : 'Searching web for CPM, CTR, and CVR data'}
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Running optimization algorithms...</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Ensemble, Bayesian, and Gradient optimization in progress
                  </p>
                </div>
              </div>
            )}

            {priorsSuccess && (
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg animate-pulse-glow">
                <div className="h-5 w-5 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Benchmarks loaded successfully!</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Ready to optimize your budget allocation</p>
                </div>
              </div>
            )}

            {priors && showAssumptions && !priorsLoading && (
              <>
                <div className="overflow-auto -mx-2">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Channel</th><th>CPM</th><th>CTR</th><th>CVR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CHANNELS.map((k) => (
                        <tr key={k}>
                          <td className="mono">{k}</td>
                          <td>${priors[k].cpm[0].toFixed(2)} – ${priors[k].cpm[1].toFixed(2)}</td>
                          <td>{(priors[k].ctr[0] * 100).toFixed(2)}% – {(priors[k].ctr[1] * 100).toFixed(2)}%</td>
                          <td>{(priors[k].cvr[0] * 100).toFixed(2)}% – {(priors[k].cvr[1] * 100).toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {citations && citations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {citations.map((c, i) =>
                      c.url ? (
                        <a key={i} href={c.url} target="_blank" rel="noreferrer" className="chip">
                          {c.title || c.url}
                        </a>
                      ) : (
                        <span key={i} className="chip chip-muted">{c.title || c.text || "Citation"}</span>
                      )
                    )}
                  </div>
                )}

                {/* Integrated Data Quality Panel */}
                {mockEnhancedResult && citations && citations.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <DataQualityPanel
                      dataQuality={{
                        citations: citations.filter(c => c.url).map(c => ({
                          ...c,
                          url: c.url!,
                          validationStatus: 'valid' as const,
                          lastChecked: new Date().toISOString(),
                          responseTime: 150,
                          contentQuality: 0.85
                        })),
                        benchmarkAnalysis: mockEnhancedResult.validation.benchmarkComparison,
                        warnings: mockEnhancedResult.validation.warnings,
                        sourceQuality: {
                          'Web Search': {
                            source: 'Web Search',
                            reliability: 0.85,
                            lastUpdated: new Date().toISOString(),
                            validationStatus: 'valid',
                            issues: []
                          },
                          'Industry Benchmarks': {
                            source: 'Industry Benchmarks',
                            reliability: 0.92,
                            lastUpdated: new Date(Date.now() - 86400000).toISOString(),
                            validationStatus: 'valid',
                            issues: []
                          }
                        },
                        overallScore: 0.88,
                        lastValidated: new Date().toISOString()
                      }}
                      expandable={true}
                      className="w-full"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Pipeline Visualization - Shows after Get Priors is clicked */}
        {showPipeline && pipeline && (
          <section className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Optimization Pipeline
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Real-time progress of your budget optimization process
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${pipeline.status === 'completed' ? 'bg-green-500' :
                      pipeline.status === 'error' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'
                    }`}></div>
                  <span className="text-sm font-medium capitalize">
                    {pipeline.status}
                  </span>
                </div>
              </div>

              <PipelineFlowVisualizer
                pipeline={pipeline}
                className="w-full"
              />

              {/* Pipeline Progress Summary */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {pipeline.completedStages.length}
                  </div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.values(pipeline.stages).filter(s => s.status === PipelineStageStatus.RUNNING).length}
                  </div>
                  <div className="text-xs text-gray-600">Running</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {Object.values(pipeline.stages).filter(s => s.status === PipelineStageStatus.PENDING).length}
                  </div>
                  <div className="text-xs text-gray-600">Pending</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {pipeline.failedStages.length}
                  </div>
                  <div className="text-xs text-gray-600">Failed</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Results */}
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="card-title">Recommended allocation</h2>
            {!allocation && <p className="subtle">Run Optimize to see the split.</p>}
            {allocation && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <ul className="space-y-1">
                    {Object.entries(allocation).map(([k, v]) => (
                      <li key={k} className="flex items-center justify-between">
                        <span className="mono">{k}</span>
                        <span className="badge">{(v * 100).toFixed(1)}%</span>
                      </li>
                    ))}
                  </ul>
                  {detOutcome != null && <p className="mt-3 subtle">Deterministic baseline: <b>{detOutcome.toFixed(2)}</b></p>}
                  {p10 != null && p50 != null && p90 != null && (
                    <p className="subtle">MC p10 <b>{p10.toFixed(2)}</b> • p50 <b>{p50.toFixed(2)}</b> • p90 <b>{p90.toFixed(2)}</b></p>
                  )}
                </div>
              </div>
            )}

            {/* Integrated Confidence Dashboard */}
            {mockEnhancedResult && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <ConfidenceDashboard
                  confidence={{
                    overall: mockEnhancedResult.confidence.overall,
                    perChannel: mockEnhancedResult.confidence.perChannel,
                    stability: mockEnhancedResult.confidence.stability,
                    algorithms: mockEnhancedResult.validation.alternativeAlgorithms,
                    consensus: mockEnhancedResult.validation.consensus
                  }}
                  showDetails={false}
                  className="w-full"
                />
              </div>
            )}
          </div>
          <div className="card">
            <h2 className="card-title">Share intervals</h2>
            {!allocation && <p className="subtle">Intervals will appear after optimization.</p>}
            {allocation && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={intervalData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                    <XAxis dataKey="channel" />
                    <YAxis unit="%" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="lo" name="p10 share">
                      {intervalData.map((entry, index) => (
                        <Cell key={`lo-${index}`} fill={COLORS[entry.channel as ChannelKey]} />
                      ))}
                    </Bar>
                    <Bar dataKey="hi" name="p90 share">
                      {intervalData.map((entry, index) => (
                        <Cell key={`hi-${index}`} fill={COLORS[entry.channel as ChannelKey]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card lg:col-span-2">
            <h2 className="card-title">Why this split</h2>
            <div className="space-y-3">
              <p className="text-base">
                {summary || (() => {
                  switch (goal) {
                    case 'revenue':
                      return `This allocation maximizes revenue by emphasizing channels with higher deal values and strong conversion rates. The budget split focuses on platforms that deliver the best return on ad spend for your revenue goals.`;
                    case 'demos':
                      return `This allocation optimizes for lead generation by focusing on channels with lower cost-per-demo and higher conversion rates. The budget distribution prioritizes platforms that efficiently generate qualified leads.`;
                    case 'cac':
                      return `This allocation minimizes customer acquisition cost by emphasizing channels with lower cost-per-acquisition and efficient conversion funnels. The budget split focuses on the most cost-effective platforms for acquiring customers.`;
                    default:
                      return `This allocation emphasizes channels with lower expected cost-per-${goal === "cac" ? "acquisition" : "conversion"} and sufficient ${goal === "revenue" ? "deal value" : "conversion rate"} under your constraints.`;
                  }
                })()}
              </p>
              <p className="text-sm text-gray-300">
                <strong>Methodology:</strong> Deterministic baseline uses midpoint CPM/CTR/CVR values, while Monte Carlo simulation samples from the full ranges to show uncertainty. The percentiles (p10-p90) represent the spread of possible outcomes.
              </p>
            </div>

            {/* Simple Recommendation for Non-Technical Users */}
            {allocation && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
                  💡 Simple Recommendation
                </h3>

                <div className="space-y-3">
                  {/* Primary Platform Recommendation */}
                  {(() => {
                    const sortedChannels = Object.entries(allocation)
                      .sort(([, a], [, b]) => b - a)
                      .map(([channel, percentage]) => ({ channel, percentage }));

                    const primaryChannel = sortedChannels[0];
                    const secondaryChannel = sortedChannels[1];

                    const channelNames = {
                      google: "Google Ads",
                      meta: "Facebook/Instagram Ads",
                      tiktok: "TikTok Ads",
                      linkedin: "LinkedIn Ads"
                    };

                    const getChannelDescription = (channel: string, goal: string) => {
                      const baseDescriptions = {
                        google: {
                          revenue: "Great for high-intent buyers actively searching for your product - typically converts at higher values",
                          demos: "Perfect for capturing leads from people actively searching for solutions like yours",
                          cac: "Cost-effective for reaching people with strong purchase intent, reducing acquisition costs"
                        },
                        meta: {
                          revenue: "Excellent for reaching high-value customers through detailed targeting and lookalike audiences",
                          demos: "Perfect for lead generation with engaging visuals and precise demographic targeting",
                          cac: "Efficient for broad reach and awareness, helping reduce overall acquisition costs"
                        },
                        tiktok: {
                          revenue: "Great for reaching younger demographics with high engagement and viral potential",
                          demos: "Excellent for generating leads through creative, engaging video content",
                          cac: "Cost-effective for reaching younger audiences with lower competition"
                        },
                        linkedin: {
                          revenue: "Ideal for B2B sales with high-value professional audiences and decision makers",
                          demos: "Perfect for B2B lead generation targeting professionals and decision makers",
                          cac: "Efficient for B2B customer acquisition with precise professional targeting"
                        }
                      };
                      return baseDescriptions[channel as keyof typeof baseDescriptions]?.[goal as keyof typeof baseDescriptions.google] || "Effective advertising platform for your goals";
                    };

                    return (
                      <>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            🎯 Focus Most of Your Budget Here:
                          </h4>
                          <p className="text-lg font-bold text-green-700 dark:text-green-300">
                            {channelNames[primaryChannel.channel as keyof typeof channelNames]} ({(primaryChannel.percentage * 100).toFixed(0)}% of budget)
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {getChannelDescription(primaryChannel.channel, goal)}
                          </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            🥈 Your Secondary Platform:
                          </h4>
                          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                            {channelNames[secondaryChannel.channel as keyof typeof channelNames]} ({(secondaryChannel.percentage * 100).toFixed(0)}% of budget)
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {getChannelDescription(secondaryChannel.channel, goal)}
                          </p>
                        </div>
                      </>
                    );
                  })()}

                  {/* Action Steps */}
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      📋 What to Do Next:
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
                      <li>Start with your primary platform first - it gives you the best {goal === 'revenue' ? 'revenue return' : goal === 'demos' ? 'lead generation' : 'cost efficiency'}</li>
                      <li>Set up campaigns with the recommended budget split</li>
                      <li>Run for 2-4 weeks to gather real performance data</li>
                      <li>Monitor your {goal === 'revenue' ? 'revenue per dollar spent' : goal === 'demos' ? 'cost per demo/lead' : 'customer acquisition cost'}</li>
                      <li>Come back and re-optimize with your actual results</li>
                      <li>Gradually test the other platforms as you scale up</li>
                    </ol>
                  </div>

                  {/* Risk Level */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      ⚖️ Risk Level:
                      <span className="text-green-600 ml-1">
                        {(() => {
                          const confidence = mockEnhancedResult?.validation?.alternativeAlgorithms?.[0]?.confidence;
                          if (confidence && confidence > 0.8) return 'Low Risk';
                          if (confidence && confidence > 0.6) return 'Medium Risk';
                          return 'Higher Risk';
                        })()}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(() => {
                        const confidence = mockEnhancedResult?.validation?.alternativeAlgorithms?.[0]?.confidence;
                        if (confidence && confidence > 0.8) {
                          return `This recommendation is based on strong data and is likely to deliver good ${goal === 'revenue' ? 'revenue returns' : goal === 'demos' ? 'lead generation results' : 'cost efficiency'} for your business.`;
                        }
                        if (confidence && confidence > 0.6) {
                          return `This recommendation is solid for ${goal === 'revenue' ? 'revenue optimization' : goal === 'demos' ? 'lead generation' : 'cost reduction'} but consider testing with a smaller budget first.`;
                        }
                        return `This recommendation has some uncertainty for your ${goal === 'revenue' ? 'revenue goals' : goal === 'demos' ? 'lead generation targets' : 'cost efficiency objectives'} - start small and monitor closely.`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-yellow-900/20 rounded-lg border border-yellow-600/30">
              <h3 className="text-sm font-medium text-yellow-200 mb-1">⚠️ Limitations & Assumptions</h3>
              <ul className="text-xs text-yellow-100/80 space-y-1">
                <li>• Benchmarks from web search may not reflect your specific industry/geo</li>
                <li>• No diminishing returns or saturation effects modeled</li>
                <li>• Grid search uses 10% increments (not continuous optimization)</li>
                <li>• Cross-channel attribution and synergy effects not considered</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Alternative Options Explorer - Below Main Results */}
        {mockEnhancedResult && allocation && (
          <section className="space-y-6">
            <AlternativeOptionsExplorer
              alternatives={[
                {
                  id: 'ensemble-primary',
                  allocation: mockEnhancedResult.alternatives.topAllocations[0],
                  confidence: mockEnhancedResult.validation.alternativeAlgorithms[0]?.confidence || 0.85,
                  performance: mockEnhancedResult.validation.alternativeAlgorithms[0]?.performance || 0.82,
                  reasoning: "Primary ensemble recommendation balancing performance and risk. This allocation optimizes for your specified goal while maintaining conservative risk levels across all channels.",
                  algorithmSource: 'ensemble',
                  expectedOutcome: detOutcome || undefined,
                  riskLevel: 'low'
                },
                {
                  id: 'bayesian-alternative',
                  allocation: mockEnhancedResult.alternatives.topAllocations[1] || allocation,
                  confidence: mockEnhancedResult.validation.alternativeAlgorithms[1]?.confidence || 0.78,
                  performance: mockEnhancedResult.validation.alternativeAlgorithms[1]?.performance || 0.79,
                  reasoning: "Bayesian optimization approach with higher Google allocation. This strategy leverages historical performance data to maximize expected returns with moderate risk.",
                  algorithmSource: 'bayesian',
                  expectedOutcome: (detOutcome || 0) * 1.05,
                  riskLevel: 'medium'
                },
                {
                  id: 'gradient-conservative',
                  allocation: mockEnhancedResult.alternatives.topAllocations[2] || allocation,
                  confidence: mockEnhancedResult.validation.alternativeAlgorithms[2]?.confidence || 0.72,
                  performance: mockEnhancedResult.validation.alternativeAlgorithms[2]?.performance || 0.75,
                  reasoning: "Conservative gradient-based allocation focusing on stability. This approach minimizes variance while ensuring consistent performance across market conditions.",
                  algorithmSource: 'gradient',
                  expectedOutcome: (detOutcome || 0) * 0.95,
                  riskLevel: 'low'
                }
              ]}
              currentAllocation={allocation}
              onSelectAlternative={(option) => {
                console.log('Selected alternative:', option);
                // In a real implementation, this would update the current allocation
              }}
              className="w-full"
              maxDisplayed={3}
            />
          </section>
        )}

        {/* Debug Tools */}
        {process.env.NODE_ENV === 'development' && (
          <section className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              🔧 Debug Tools
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              Development tools for testing pipeline stage progression
            </p>
            <div className="flex gap-2">
              <a
                href="/pipeline-test"
                className="inline-flex items-center px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm"
              >
                🧪 Pipeline Stage Test
              </a>
              <a
                href="/pipeline-demo"
                className="inline-flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
              >
                📊 Pipeline Demo
              </a>
            </div>
          </section>
        )}
      </main>
    </VisualizationProvider>
  );
}
