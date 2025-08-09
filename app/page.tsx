"use client";
import { useMemo, useState } from "react";
import type { Assumptions, ChannelPriors, Allocation } from "@/types/shared";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from "recharts";

const CHANNELS = ["google", "meta", "tiktok", "linkedin"] as const;
type ChannelKey = typeof CHANNELS[number];

export default function HomePage() {
  const [company, setCompany] = useState("B2B SaaS startup");
  const [budget, setBudget] = useState(5000);
  const [goal, setGoal] = useState<Assumptions["goal"]>("demos");
  const [runs, setRuns] = useState(800);

  // priors/citations
  const [priors, setPriors] = useState<ChannelPriors | null>(null);
  const [citations, setCitations] = useState<{ title?: string; url: string; note?: string }[]>([]);

  // constraints
  const [minPct, setMinPct] = useState<Record<ChannelKey, number>>({
    google: 0, meta: 0, tiktok: 0, linkedin: 0.2, // default 20% floor to showcase constraint
  });
  const [maxPct, setMaxPct] = useState<Record<ChannelKey, number>>({
    google: 1, meta: 1, tiktok: 1, linkedin: 1,
  });

  // results
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [detOutcome, setDetOutcome] = useState<number | null>(null);
  const [p10, setP10] = useState<number | null>(null);
  const [p50, setP50] = useState<number | null>(null);
  const [p90, setP90] = useState<number | null>(null);
  const [intervals, setIntervals] = useState<Record<string, [number, number]> | null>(null);
  const [summary, setSummary] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function fetchPriors() {
    setErr(null);
    setAllocation(null);
    try {
      const res = await fetch(`/api/priors?company=${encodeURIComponent(company)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch priors");
      setPriors(json.priors);
      setCitations(json.citations || []);
    } catch (e: any) {
      setErr(e.message);
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
        assumptions: {
          goal,
          minPct,
          maxPct,
        },
        runs,
      };
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
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

  // chart data
  const pieData = useMemo(() => {
    if (!allocation) return [];
    return CHANNELS.map((ch) => ({ name: ch, value: +(allocation[ch] * 100).toFixed(2) }));
  }, [allocation]);

  const intervalData = useMemo(() => {
    if (!intervals) return [];
    return CHANNELS.map((ch) => {
      const [lo, hi] = intervals[ch] ?? [0, 0];
      return { channel: ch, lo: +(lo * 100).toFixed(1), hi: +(hi * 100).toFixed(1) };
    });
  }, [intervals]);

  function sliderPct(v: number) {
    return `${Math.round(v * 100)}%`;
  }

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1>Budget Brain</h1>

      {/* Inputs */}
      <section style={{ display: "grid", gap: 8, maxWidth: 680, marginTop: 12 }}>
        <label>Company</label>
        <input value={company} onChange={(e) => setCompany(e.target.value)} />

        <label>Monthly budget (USD)</label>
        <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />

        <label>Goal</label>
        <select value={goal} onChange={(e) => setGoal(e.target.value as Assumptions["goal"])}>
          <option value="demos">demos</option>
          <option value="revenue">revenue</option>
          <option value="cac">cac</option>
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label>Monte Carlo runs</label>
          <input type="range" min={200} max={2000} step={100} value={runs} onChange={(e) => setRuns(Number(e.target.value))} />
          <span>{runs}</span>
        </div>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr", marginTop: 8 }}>
          <div>
            <h3>Min % per channel</h3>
            {CHANNELS.map((ch) => (
              <div key={ch} style={{ display: "grid", gridTemplateColumns: "90px 1fr 60px", alignItems: "center", gap: 8 }}>
                <span>{ch}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(minPct[ch] * 100)}
                  onChange={(e) => setMinPct({ ...minPct, [ch]: Number(e.target.value) / 100 })}
                />
                <span>{sliderPct(minPct[ch])}</span>
              </div>
            ))}
          </div>
          <div>
            <h3>Max % per channel</h3>
            {CHANNELS.map((ch) => (
              <div key={ch} style={{ display: "grid", gridTemplateColumns: "90px 1fr 60px", alignItems: "center", gap: 8 }}>
                <span>{ch}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(maxPct[ch] * 100)}
                  onChange={(e) => setMaxPct({ ...maxPct, [ch]: Number(e.target.value) / 100 })}
                />
                <span>{sliderPct(maxPct[ch])}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={fetchPriors}>Get priors</button>
          <button onClick={runOptimize} disabled={!priors || loading}>
            {loading ? "Optimizing..." : "Optimize"}
          </button>
        </div>

        {err && <div style={{ color: "tomato" }}>{err}</div>}
      </section>

      {/* Priors table + citations */}
      <section style={{ marginTop: 24 }}>
        <h2>Assumptions</h2>
        {!priors && <p>Click Get priors to fetch CPM, CTR, CVR ranges and citations.</p>}
        {priors && (
          <>
            <table>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>CPM</th>
                  <th>CTR</th>
                  <th>CVR</th>
                </tr>
              </thead>
              <tbody>
                {CHANNELS.map((k) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td>${priors[k].cpm[0].toFixed(2)} to ${priors[k].cpm[1].toFixed(2)}</td>
                    <td>{(priors[k].ctr[0] * 100).toFixed(2)}% to {(priors[k].ctr[1] * 100).toFixed(2)}%</td>
                    <td>{(priors[k].cvr[0] * 100).toFixed(2)}% to {(priors[k].cvr[1] * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {citations.length > 0 && (
              <>
                <h3 style={{ marginTop: 8 }}>Citations</h3>
                <ul>
                  {citations.map((c, i) => (
                    <li key={i}>
                      <a href={c.url} target="_blank" rel="noreferrer">
                        {c.title || c.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      {/* Results */}
      <section style={{ marginTop: 24 }}>
        <h2>Recommended allocation</h2>
        {!allocation && <p>Run Optimize to see the split.</p>}

        {allocation && (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
            {/* Pie chart */}
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {pieData.map((_, i) => (
                      <Cell key={i} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Interval bars */}
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intervalData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <XAxis dataKey="channel" />
                  <YAxis unit="%" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="lo" name="share p10" />
                  <Bar dataKey="hi" name="share p90" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Numeric list */}
            <div>
              <ul>
                {Object.entries(allocation).map(([k, v]) => (
                  <li key={k}>{k}: {(v * 100).toFixed(1)}%</li>
                ))}
              </ul>
              {detOutcome != null && <p>Deterministic baseline outcome: {detOutcome.toFixed(2)}</p>}
              {p10 != null && p50 != null && p90 != null && (
                <p>Monte Carlo p10 {p10.toFixed(2)} p50 {p50.toFixed(2)} p90 {p90.toFixed(2)}</p>
              )}
            </div>

            {/* Rationale */}
            <div>
              <h3>Why this split</h3>
              <p style={{ opacity: 0.85 }}>
                {summary ||
                  `Allocation emphasizes channels with lower expected cost-per-${goal === "cac" ? "acquisition" : "conversion"} and sufficient ${goal === "revenue" ? "deal value" : "conversion rate"} under your constraints.`}
              </p>
              <small style={{ opacity: 0.7 }}>
                Deterministic baseline (midpoint CPM/CTR/CVR) agrees with the Monte Carlo median; percentiles show uncertainty.
              </small>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
