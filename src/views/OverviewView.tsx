import React, { useMemo, useState } from "react";
import {
  Play,
  ArrowRight,
  Crosshair,
  GitBranch,
  FileSearch,
  Shield,
  Activity,
  Layers,
} from "lucide-react";
import type { KseAnalysisApi } from "../hooks/useKseAnalysis";
import {
  EdgeMixDonut,
  HorizontalBars,
  PipelineFunnel,
  ScoreRadar,
  Sparkline,
  TimelineHeat,
} from "../components/viz/DashCharts";

const PILOTS = [
  "AI Coding Assistants",
  "LLM Agent Cascades",
  "Quantum Supremacy Disclosure",
  "Stable Diffusion v3 Leaks",
];

export default function OverviewView({ api }: { api: KseAnalysisApi }) {
  const [topicInput, setTopicInput] = useState(api.topic);
  const res = api.overriddenResult;

  const run = (t: string) => {
    if (!t.trim() || api.isLoading) return;
    api.handleRunAnalysis(t.trim());
  };

  const analytics = useMemo(() => {
    if (!res) return null;
    const edgeKinds: Record<string, number> = {};
    res.edges.forEach((e) => {
      edgeKinds[e.kind] = (edgeKinds[e.kind] || 0) + 1;
    });
    const avg = (key: keyof (typeof res.originals)[0]["scores"]) =>
      res.originals.length
        ? res.originals.reduce((a, o) => a + (o.scores[key] as number), 0) /
          res.originals.length
        : 0;

    const timeline = res.raw_items.map((i) => ({
      t: new Date(i.created_at).getTime(),
      weight: 1 + (i.source_meta?.likes || 0) / 500,
    }));

    const spark = res.originals
      .slice()
      .reverse()
      .map((o) => o.source_fitness);

    const signalDensity =
      res.run_meta.after_dedup > 0
        ? res.originals.length / res.run_meta.after_dedup
        : 0;
    const noiseRate =
      res.run_meta.collected_candidates > 0
        ? (res.noise_candidates?.length || 0) / res.run_meta.collected_candidates
        : 0;

    return {
      edgeKinds,
      radar: [
        { label: "ORIG", value: avg("originality") },
        { label: "AUTH", value: avg("authority") },
        { label: "INFL", value: avg("influence") },
        { label: "EVID", value: avg("evidence") },
        { label: "FRSH", value: avg("freshness") },
      ],
      timeline,
      spark: spark.length ? spark : [0.2, 0.4, 0.35, 0.6, 0.55, 0.8],
      signalDensity,
      noiseRate,
      topBars: res.originals.slice(0, 5).map((o) => ({
        label: `#${o.rank} ${o.author.handle}`,
        value: Math.max(0, Math.min(1, o.source_fitness)),
        sub: o.source_fitness.toFixed(2),
      })),
      funnel: [
        { label: "COLLECT", value: res.run_meta.collected_candidates },
        {
          label: "FILTER",
          value: res.run_meta.after_dedup,
          tone: "ok" as const,
        },
        {
          label: "COMPONENTS",
          value: res.run_meta.components,
          tone: "ok" as const,
        },
        {
          label: "ORIGINALS",
          value: res.originals.length,
          tone: "ok" as const,
        },
        {
          label: "NOISE",
          value: res.noise_candidates?.length || 0,
          tone: "warn" as const,
        },
      ],
      donut: Object.entries(edgeKinds).map(([label, value], i) => ({
        label,
        value,
        color: ["#3dffa8", "#4ecbff", "#a78bfa", "#ffc857", "#ff6b7a"][i % 5],
      })),
    };
  }, [res]);

  return (
    <div className="kse-page kse-fade-in">
      <div className="kse-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crosshair size={14} style={{ color: "var(--accent)" }} />
            <span className="kse-label" style={{ color: "var(--accent)" }}>
              Command center
            </span>
          </div>
          <h1 className="kse-page-title">Provenance operations</h1>
          <p className="kse-page-sub">
            ingest → graph → source_fitness → multi-signal rank · batch analysis
          </p>
        </div>
        {res && (
          <div className="flex items-center gap-2">
            {res.is_fallback && (
              <span className="kse-badge kse-badge-warn">FALLBACK DATASET</span>
            )}
            <span className="kse-badge kse-badge-info">
              API {res.run_meta.api_calls_used}
            </span>
          </div>
        )}
      </div>

      {/* Command strip */}
      <section className="kse-surface kse-surface-glow mb-4 overflow-hidden">
        <div className="kse-panel-head">
          <span className="kse-label">Mission input</span>
          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
            STAGE ① RETRIEVAL
          </span>
        </div>
        <div className="kse-panel-body">
          <form
            className="flex flex-col sm:flex-row gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(topicInput);
            }}
          >
            <input
              className="kse-input flex-1"
              style={{ fontFamily: "var(--font-mono)", height: 38 }}
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="topic keyword / claim cluster…"
              disabled={api.isLoading}
              aria-label="Topic"
            />
            <button
              type="submit"
              className="kse-btn kse-btn-primary"
              style={{ height: 38, paddingInline: 18 }}
              disabled={api.isLoading || !topicInput.trim()}
            >
              <Play size={14} />
              {api.isLoading ? "Executing…" : "Execute analysis"}
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PILOTS.map((p) => (
              <button
                key={p}
                type="button"
                className="kse-btn"
                style={{
                  height: 26,
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  background:
                    topicInput === p ? "var(--accent-dim)" : undefined,
                  borderColor:
                    topicInput === p ? "var(--accent-border)" : undefined,
                  color: topicInput === p ? "var(--accent)" : undefined,
                }}
                onClick={() => {
                  setTopicInput(p);
                  run(p);
                }}
                disabled={api.isLoading}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </section>

      {api.error && (
        <div
          className="kse-surface p-4 mb-4"
          style={{ borderColor: "rgba(255,107,122,0.35)" }}
        >
          <div className="kse-label" style={{ color: "var(--danger)" }}>
            Pipeline fault
          </div>
          <p className="text-sm mt-2 mb-3" style={{ color: "var(--text-secondary)" }}>
            {api.error}
          </p>
          <button type="button" className="kse-btn kse-btn-primary" onClick={() => run(api.topic)}>
            Retry
          </button>
        </div>
      )}

      {api.isLoading && (
        <div className="space-y-4">
          {/* KPI Cards Skeletons */}
          <div className="kse-grid-metrics mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="kse-metric kse-pulse">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 flex-1">
                    <div className="h-7 w-16 rounded bg-[var(--surface-2)]" />
                    <div className="h-3.5 w-24 rounded bg-[var(--surface-2)]" />
                    <div className="h-2.5 w-20 rounded bg-[var(--surface-2)]" />
                  </div>
                  <div className="w-[72px] h-[32px] rounded bg-[var(--surface-2)] opacity-40" />
                </div>
              </div>
            ))}
          </div>

          {/* Main Intelligence Grid Skeletons */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 mb-4">
            {/* Pipeline Reduction */}
            <div className="kse-surface xl:col-span-5 kse-pulse">
              <div className="kse-panel-head">
                <div className="h-4 w-32 rounded bg-[var(--surface-2)]" />
              </div>
              <div className="kse-panel-body space-y-4">
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} className="h-6 rounded bg-[var(--surface-2)] w-full" style={{ opacity: 1 - idx * 0.15 }} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="space-y-1.5">
                    <div className="h-3 w-16 rounded bg-[var(--surface-2)]" />
                    <div className="h-5 w-12 rounded bg-[var(--surface-2)]" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-16 rounded bg-[var(--surface-2)]" />
                    <div className="h-5 w-12 rounded bg-[var(--surface-2)]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Score Vector Radar */}
            <div className="kse-surface xl:col-span-4 kse-pulse">
              <div className="kse-panel-head">
                <div className="h-4 w-24 rounded bg-[var(--surface-2)]" />
              </div>
              <div className="kse-panel-body flex flex-col items-center justify-center h-[220px]">
                <div className="w-[120px] h-[120px] rounded-full border-4 border-dashed border-[var(--surface-2)] flex items-center justify-center">
                  <div className="w-[80px] h-[80px] rounded-full border-4 border-dashed border-[var(--surface-2)] flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface-2)]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Edge Taxonomy Donut */}
            <div className="kse-surface xl:col-span-3 kse-pulse">
              <div className="kse-panel-head">
                <div className="h-4 w-28 rounded bg-[var(--surface-2)]" />
              </div>
              <div className="kse-panel-body flex items-center justify-center h-[220px]">
                <div className="w-[120px] h-[120px] rounded-full border-8 border-[var(--surface-2)] flex items-center justify-center">
                  <div className="h-4 w-12 rounded bg-[var(--surface-2)]" />
                </div>
              </div>
            </div>
          </div>

          {/* Timeline & Leaderboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
            {/* Cascade Timeline */}
            <div className="kse-surface lg:col-span-4 kse-pulse">
              <div className="kse-panel-head">
                <div className="h-4 w-32 rounded bg-[var(--surface-2)]" />
              </div>
              <div className="kse-panel-body space-y-2">
                <div className="grid grid-cols-10 gap-1.5">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded bg-[var(--surface-2)]" style={{ opacity: Math.random() * 0.7 + 0.3 }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="kse-surface lg:col-span-4 kse-pulse">
              <div className="kse-panel-head">
                <div className="h-4 w-40 rounded bg-[var(--surface-2)]" />
              </div>
              <div className="kse-panel-body space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <div className="h-3.5 w-24 rounded bg-[var(--surface-2)]" />
                      <div className="h-3.5 w-8 rounded bg-[var(--surface-2)]" />
                    </div>
                    <div className="h-2 w-full rounded bg-[var(--surface-2)]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Jump Desk */}
            <div className="kse-surface lg:col-span-4 kse-pulse">
              <div className="kse-panel-head">
                <div className="h-4 w-24 rounded bg-[var(--surface-2)]" />
              </div>
              <div className="kse-panel-body space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 rounded bg-[var(--surface-2)] w-full" />
                ))}
              </div>
            </div>
          </div>

          {/* Analyst Brief & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Analyst Brief */}
            <div className="kse-surface lg:col-span-5 kse-pulse">
              <div className="kse-panel-head">
                <div className="h-4 w-24 rounded bg-[var(--surface-2)]" />
              </div>
              <div className="kse-panel-body space-y-2">
                <div className="h-3 rounded bg-[var(--surface-2)] w-full" />
                <div className="h-3 rounded bg-[var(--surface-2)] w-5/6" />
                <div className="h-3 rounded bg-[var(--surface-2)] w-4/5" />
                <div className="h-3 rounded bg-[var(--surface-2)] w-2/3" />
              </div>
            </div>

            {/* Top original nodes table */}
            <div className="kse-surface lg:col-span-7 kse-pulse">
              <div className="kse-panel-head flex justify-between">
                <div className="h-4 w-32 rounded bg-[var(--surface-2)]" />
                <div className="h-6 w-16 rounded bg-[var(--surface-2)]" />
              </div>
              <div className="p-3 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-4 w-4 rounded bg-[var(--surface-2)]" />
                      <div className="space-y-1.5 flex-1 max-w-xs">
                        <div className="h-3 w-16 rounded bg-[var(--surface-2)]" />
                        <div className="h-2.5 w-full rounded bg-[var(--surface-2)]" />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-3 w-8 rounded bg-[var(--surface-2)]" />
                      <div className="h-3 w-8 rounded bg-[var(--surface-2)]" />
                      <div className="h-3 w-8 rounded bg-[var(--surface-2)]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!res && !api.isLoading && !api.error && (
        <div className="kse-empty kse-surface">
          <Activity size={28} style={{ color: "var(--accent)" }} />
          <p className="text-sm m-0" style={{ color: "var(--text-secondary)" }}>
            No active run. Execute a topic to populate the ops dashboard.
          </p>
        </div>
      )}

      {res && analytics && !api.isLoading && (
        <>
          {/* KPI strip with sparklines */}
          <div className="kse-grid-metrics mb-4">
            {[
              {
                label: "Candidates",
                value: res.run_meta.collected_candidates,
                spark: analytics.spark,
                hint: "pre-filter pool",
              },
              {
                label: "Signal nodes",
                value: res.run_meta.after_dedup,
                spark: analytics.spark.map((v) => v * 0.8),
                hint: "after noise",
              },
              {
                label: "Components",
                value: res.run_meta.components,
                spark: analytics.spark.map((v, i) => (i % 2 ? v : v * 0.6)),
                hint: "claim clusters",
              },
              {
                label: "Originals",
                value: res.originals.length,
                spark: analytics.spark,
                hint: "≤10 ranked",
              },
            ].map((m) => (
              <div key={m.label} className="kse-metric">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="kse-metric-value">{m.value}</div>
                    <div className="kse-metric-label">{m.label}</div>
                    <div
                      className="text-[9px] font-mono mt-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {m.hint}
                    </div>
                  </div>
                  <Sparkline values={m.spark} width={72} height={32} />
                </div>
              </div>
            ))}
          </div>

          {/* Main intelligence grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 mb-4">
            <section className="kse-surface xl:col-span-5 overflow-hidden">
              <div className="kse-panel-head">
                <span className="kse-label flex items-center gap-1.5">
                  <Layers size={11} /> Pipeline reduction
                </span>
              </div>
              <div className="kse-panel-body">
                <PipelineFunnel stages={analytics.funnel} />
                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <div className="kse-label mb-1">Signal density</div>
                    <div className="text-[20px] font-mono font-semibold" style={{ color: "var(--accent)" }}>
                      {(analytics.signalDensity * 100).toFixed(0)}%
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      originals / clean nodes
                    </div>
                  </div>
                  <div>
                    <div className="kse-label mb-1">Noise rate</div>
                    <div className="text-[20px] font-mono font-semibold" style={{ color: "var(--warning)" }}>
                      {(analytics.noiseRate * 100).toFixed(0)}%
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      quarantined / collected
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="kse-surface xl:col-span-4 overflow-hidden">
              <div className="kse-panel-head">
                <span className="kse-label">Score vector</span>
                <span className="kse-badge kse-badge-accent">μ across originals</span>
              </div>
              <div className="kse-panel-body">
                <ScoreRadar scores={analytics.radar} size={120} />
              </div>
            </section>

            <section className="kse-surface xl:col-span-3 overflow-hidden">
              <div className="kse-panel-head">
                <span className="kse-label">Edge taxonomy</span>
                <span className="kse-badge kse-badge-info">graph mix</span>
              </div>
              <div className="kse-panel-body">
                {analytics.donut.length ? (
                  <EdgeMixDonut slices={analytics.donut} size={120} />
                ) : (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    No edges
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
            <section className="kse-surface lg:col-span-4 overflow-hidden">
              <div className="kse-panel-head">
                <span className="kse-label flex items-center gap-1.5">
                  <Activity size={11} /> Cascade timeline
                </span>
              </div>
              <div className="kse-panel-body">
                <TimelineHeat items={analytics.timeline} />
              </div>
            </section>

            <section className="kse-surface lg:col-span-4 overflow-hidden">
              <div className="kse-panel-head">
                <span className="kse-label">Source fitness leaderboard</span>
              </div>
              <div className="kse-panel-body">
                <HorizontalBars rows={analytics.topBars} />
              </div>
            </section>

            <section className="kse-surface lg:col-span-4 overflow-hidden">
              <div className="kse-panel-head">
                <span className="kse-label">Jump desk</span>
              </div>
              <div className="kse-panel-body space-y-2">
                {(
                  [
                    {
                      view: "sources" as const,
                      icon: FileSearch,
                      label: "Source inspector",
                      meta: `${res.originals.length} ranked`,
                    },
                    {
                      view: "graph" as const,
                      icon: GitBranch,
                      label: "Cascade graph",
                      meta: `${res.edges.length} edges`,
                    },
                    {
                      view: "verify" as const,
                      icon: Shield,
                      label: "Verification",
                      meta: "grounding",
                    },
                    {
                      view: "noise" as const,
                      icon: Shield,
                      label: "Noise bay",
                      meta: `${res.noise_candidates?.length || 0} held`,
                    },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.view}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-left cursor-pointer"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                      }}
                      onClick={() => api.setActiveView(item.view)}
                    >
                      <Icon size={15} style={{ color: "var(--accent)" }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium">{item.label}</div>
                        <div
                          className="text-[10px] font-mono"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {item.meta}
                        </div>
                      </div>
                      <ArrowRight size={13} style={{ color: "var(--text-muted)" }} />
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Brief + top sources table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <section className="kse-surface lg:col-span-5 overflow-hidden">
              <div className="kse-panel-head">
                <span className="kse-label">Analyst brief</span>
              </div>
              <div className="kse-panel-body">
                <p
                  className="text-[13px] leading-relaxed m-0"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {res.summary}
                </p>
              </div>
            </section>

            <section className="kse-surface lg:col-span-7 overflow-hidden">
              <div className="kse-panel-head">
                <span className="kse-label">Top original nodes</span>
                <button
                  type="button"
                  className="kse-btn"
                  style={{ height: 24, fontSize: 10 }}
                  onClick={() => api.setActiveView("sources")}
                >
                  Open all <ArrowRight size={11} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <div
                  className="kse-data-row text-[9px] uppercase"
                  style={{ color: "var(--text-muted)", background: "var(--surface-2)" }}
                >
                  <span>Rk</span>
                  <span>Author / claim</span>
                  <span className="text-right">Orig</span>
                  <span className="text-right">Auth</span>
                  <span className="text-right">Fit</span>
                </div>
                {res.originals.slice(0, 5).map((o) => (
                  <button
                    key={o.content_id}
                    type="button"
                    className="kse-data-row w-full text-left cursor-pointer border-0 bg-transparent"
                    onClick={() => {
                      api.setSelectedNodeId(o.content_id);
                      api.setActiveView("sources");
                    }}
                  >
                    <span style={{ color: "var(--accent)" }} className="font-semibold">
                      {String(o.rank).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate" style={{ color: "var(--text)" }}>
                        {o.author.handle}
                      </span>
                      <span
                        className="block truncate text-[11px]"
                        style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}
                      >
                        {o.item.text}
                      </span>
                    </span>
                    <span className="text-right tabular-nums">
                      {Math.round(o.scores.originality * 100)}
                    </span>
                    <span className="text-right tabular-nums">
                      {Math.round(o.scores.authority * 100)}
                    </span>
                    <span className="text-right tabular-nums" style={{ color: "var(--accent)" }}>
                      {o.source_fitness.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
