"use client";
import { useMemo, useState } from "react";
import type { Assumptions, ChannelPriors, Allocation } from "@/types/shared";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis
} from "recharts";

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

  const [loading, setLoading] = useState(false);
  const [priorsLoading, setPriorsLoading] = useState(false);
  const [priorsSuccess, setPriorsSuccess] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function fetchPriors() {
    setErr(null);
    setAllocation(null);
    setPriorsLoading(true);
    setPriorsSuccess(false);
    try {
      const res = await fetch(`/api/priors?company=${encodeURIComponent(company)}`);
      const json = await res.json();
    //   console.log("priors/citations =>", json)
      if (!res.ok) throw new Error(json.error || "Failed to fetch priors");
      setPriors(json.priors);
      setCitations(json.citations || []);
      setPriorsSuccess(true);
      setTimeout(() => setPriorsSuccess(false), 2000); // Hide success after 2s
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setPriorsLoading(false);
    }
  }

  async function runOptimize() {
    if (!priors) return;
    setErr(null);
    setLoading(true);
    try {
      const body = {
        budget: Number(budget),
        priors,
        assumptions: { goal, avgDealSize: goal === "revenue" ? avgDealSize : undefined, minPct, maxPct },
        runs,
      };
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
    //   console.log("priors/citations =>", json)
      if (!res.ok) throw new Error(json.error || "Optimization failed");
      setAllocation(json.allocation);
      setDetOutcome(json.detOutcome);
      setP10(json.p10);
      setP50(json.p50);
      setP90(json.p90);
      setIntervals(json.intervals);
      setSummary(json.summary);
    } catch (e: any) {
      setErr(e.message);
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

  return (
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
                className={`btn disabled:opacity-50 flex items-center gap-2 transition-colors duration-200 ${
                  priorsSuccess ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300' : ''
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
                <p className="text-xs text-blue-600 dark:text-blue-400">Searching web for CPM, CTR, and CVR data</p>
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
            </>
          )}
        </div>
      </section>

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
              {summary ||
                `This allocation emphasizes channels with lower expected cost-per-${goal === "cac" ? "acquisition" : "conversion"} and sufficient ${goal === "revenue" ? "deal value" : "conversion rate"} under your constraints.`}
            </p>
            <p className="text-sm text-gray-300">
              <strong>Methodology:</strong> Deterministic baseline uses midpoint CPM/CTR/CVR values, while Monte Carlo simulation samples from the full ranges to show uncertainty. The percentiles (p10-p90) represent the spread of possible outcomes.
            </p>
          </div>
          
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
    </main>
  );
}
