/**
 * Product landing for Knowledge Signal Engine.
 * Visual system mirrors the portal (dark + mint accent).
 * No stock photography, fake social proof, or third-party brand assets.
 */
import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  GitBranch,
  LayoutDashboard,
  FileSearch,
  ShieldAlert,
  Shield,
  SlidersHorizontal,
  Bell,
  Filter,
  Network,
  Target,
  SearchCheck,
  ChevronDown,
  Radio,
  PenLine,
} from "lucide-react";

const PIPELINE = [
  "COLLECT",
  "NOISE FILTER",
  "GRAPH / DSU",
  "SOURCE FITNESS",
  "MULTI-SIGNAL RANK",
  "VERIFY / GROUND",
  "EXPORT",
] as const;

const STAGES = [
  {
    step: "01",
    title: "Ingest",
    desc: "Topic → candidate posts with authors, timestamps, and link/media fingerprints (simulated or fallback in this lab).",
  },
  {
    step: "02",
    title: "Noise filter",
    desc: "Spam signatures, hashtag/mention density, and low-authority heuristics quarantine low-signal bait.",
  },
  {
    step: "03",
    title: "Graph / DSU",
    desc: "Edges: quote, reply, same_url, same_image_hash, semantic_sim. Components form cascade clusters.",
  },
  {
    step: "04",
    title: "Rank & verify",
    desc: "source_fitness picks seeds; multi-signal scores rank ≤10 originals; grounding supports audit.",
  },
] as const;

const VIEWS = [
  {
    id: "Command",
    icon: LayoutDashboard,
    hint: "Funnel, score-vector means, edge taxonomy, fitness leaderboard",
    group: "Analyze",
  },
  {
    id: "Sources",
    icon: FileSearch,
    hint: "Ranked originals ≤10 with score bars, evidence, flags",
    group: "Analyze",
  },
  {
    id: "Cascade",
    icon: GitBranch,
    hint: "Force graph of relationship edges and components",
    group: "Analyze",
  },
  {
    id: "Noise",
    icon: ShieldAlert,
    hint: "Quarantined spam and low-signal candidates",
    group: "Analyze",
  },
  {
    id: "Verify",
    icon: Shield,
    hint: "Search grounding, citations, claim verdicts",
    group: "Quality",
  },
  {
    id: "Weights",
    icon: SlidersHorizontal,
    hint: "Provenance + presentation knobs; instant recalculate",
    group: "Quality",
  },
  {
    id: "Studio",
    icon: PenLine,
    hint: "Founder Content OS — multi-platform drafts from one ranked original",
    group: "Create",
  },
  {
    id: "Watchlist",
    icon: Bell,
    hint: "Local topic alerts (prototype UI)",
    group: "Ops",
  },
] as const;

const FAQ = [
  {
    q: "What is Knowledge Signal Engine?",
    a: "A multi-view provenance lab for high-signal social posts. Given a topic, it filters noise, builds a relationship graph, ranks up to 10 original sources with source_fitness and multi-signal scores, then supports verification grounding and export.",
  },
  {
    q: "How does provenance ranking work?",
    a: "After DSU clustering, each component scores nodes with temporal priority, authority, downstream influence, and a derivative penalty. The highest source_fitness node becomes the seed; presentation ranking orders seeds by originality, authority, influence, evidence, and freshness.",
  },
  {
    q: "What counts as an “original”?",
    a: "The ranked seed of a cascade component — typically the earliest high-fitness post that others quote, reply to, share via the same URL/media hash, or paraphrase. The lab surfaces ≤10 originals with score vectors so you can audit why each ranked.",
  },
  {
    q: "Is this live X / Twitter data?",
    a: "Not yet. Stage ① candidates come from Gemini JSON simulation (when a key is set) or a local fallback dataset. Algorithms and UI are real; live collection is on the production path, not this prototype.",
  },
  {
    q: "What can I export?",
    a: "From Signal Radar: share deep-links, PDF/TXT reports, and JSON of the run. From Content Studio: Markdown and JSON packages of approved multi-platform drafts (no auto-publish).",
  },
  {
    q: "What is Content Studio / Founder Content OS?",
    a: "After you rank originals, open Studio (or Sources → Create content). One signal becomes a campaign brief plus editable drafts for X, LinkedIn, Instagram, WhatsApp, Facebook, and YouTube. A quality gate blocks weak approvals. Nothing posts automatically. Campaigns save in your browser history only.",
  },
] as const;

const SCORE_DIMS = [
  { key: "originality", w: "α" },
  { key: "authority", w: "β" },
  { key: "influence", w: "γ" },
  { key: "evidence", w: "δ" },
  { key: "freshness", w: "ε" },
] as const;

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Abstract cascade graph — product visual, not stock photos */
function CascadeHeroVisual({ onEnter }: { onEnter: () => void }) {
  const nodes = [
    { cx: 200, cy: 180, r: 18, label: "SEED", seed: true },
    { cx: 110, cy: 95, r: 11, label: "Q" },
    { cx: 290, cy: 100, r: 11, label: "R" },
    { cx: 80, cy: 230, r: 10, label: "URL" },
    { cx: 320, cy: 250, r: 10, label: "IMG" },
    { cx: 160, cy: 300, r: 9, label: "SIM" },
    { cx: 260, cy: 310, r: 9, label: "Q" },
    { cx: 200, cy: 60, r: 8, label: "R" },
  ];
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [1, 7],
    [2, 7],
    [3, 5],
    [4, 6],
    [5, 6],
  ];

  return (
    <button
      type="button"
      onClick={onEnter}
      className="group relative w-full max-w-[440px] aspect-square rounded-2xl border text-left cursor-pointer overflow-hidden transition-all duration-300 hover:border-[var(--accent-border)]"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border-strong)",
        boxShadow: "var(--shadow-glow)",
      }}
      aria-label="Enter Knowledge Signal Engine portal"
    >
      <div
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{ background: "var(--grad-hero)" }}
      />
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.16em]"
          style={{ color: "var(--accent)" }}
        >
          cascade · live map
        </span>
        <span
          className="font-mono text-[10px] px-2 py-0.5 rounded border"
          style={{
            color: "var(--text-muted)",
            borderColor: "var(--border)",
            background: "var(--bg-elevated)",
          }}
        >
          DSU · 1 component
        </span>
      </div>

      <svg
        viewBox="0 0 400 380"
        className="absolute inset-0 w-full h-full p-6 pt-12"
        aria-hidden="true"
      >
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].cx}
            y1={nodes[a].cy}
            x2={nodes[b].cx}
            y2={nodes[b].cy}
            stroke="rgba(45, 212, 168, 0.28)"
            strokeWidth={1.5}
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.cx}
              cy={n.cy}
              r={n.r + (n.seed ? 6 : 0)}
              fill="none"
              stroke={n.seed ? "rgba(45, 212, 168, 0.45)" : "transparent"}
              strokeWidth={1}
              className={n.seed ? "animate-pulse" : undefined}
            />
            <circle
              cx={n.cx}
              cy={n.cy}
              r={n.r}
              fill={n.seed ? "#2dd4a8" : "#151b26"}
              stroke={n.seed ? "#2dd4a8" : "rgba(255,255,255,0.14)"}
              strokeWidth={1.5}
            />
            <text
              x={n.cx}
              y={n.cy + 3}
              textAnchor="middle"
              fill={n.seed ? "#04120e" : "rgba(238,242,247,0.55)"}
              fontSize={n.seed ? 8 : 7}
              fontFamily="JetBrains Mono, monospace"
              fontWeight={600}
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>

      <div
        className="absolute bottom-0 inset-x-0 p-4 border-t backdrop-blur-sm"
        style={{
          borderColor: "var(--border)",
          background: "rgba(10, 14, 20, 0.85)",
        }}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              source_fitness
            </div>
            <div className="text-lg font-semibold tracking-tight" style={{ color: "var(--text)" }}>
              0.91 · seed selected
            </div>
          </div>
          <div className="flex gap-1 items-end h-10">
            {[72, 88, 64, 54, 40].map((h, i) => (
              <div
                key={i}
                className="w-2 rounded-sm"
                style={{
                  height: `${h}%`,
                  background:
                    i === 0
                      ? "var(--accent)"
                      : i === 1
                        ? "var(--cyan)"
                        : "rgba(167, 139, 250, 0.55)",
                }}
              />
            ))}
          </div>
        </div>
        <div
          className="mt-2 flex items-center gap-1.5 text-[11px] font-medium group-hover:gap-2.5 transition-all"
          style={{ color: "var(--accent)" }}
        >
          Open Command Center
          <ArrowRight size={14} />
        </div>
      </div>
    </button>
  );
}

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [utc, setUtc] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setUtc(
        d.toISOString().slice(11, 19) + "Z"
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-hidden selection:bg-[rgba(45,212,168,0.25)]"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Ambient grid + glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 0%, black, transparent)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "var(--grad-hero)" }}
      />

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          borderColor: "var(--border)",
          background: "rgba(5, 7, 11, 0.82)",
          height: "var(--topbar-h)",
        }}
      >
        <div className="max-w-6xl mx-auto h-full px-5 md:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 shrink-0 rounded flex items-center justify-center font-mono font-bold text-xs"
              style={{
                background: "linear-gradient(145deg, var(--accent-dim), transparent)",
                color: "var(--accent)",
                border: "1px solid var(--accent-border)",
                boxShadow: "0 0 16px var(--accent-glow)",
              }}
              aria-hidden
            >
              KSE
            </div>
            <div className="min-w-0 hidden sm:block">
              <div className="text-[12px] font-semibold tracking-tight leading-tight">
                Knowledge Signal
              </div>
              <div
                className="text-[9px] font-mono uppercase tracking-[0.12em]"
                style={{ color: "var(--text-muted)" }}
              >
                Provenance OS
              </div>
            </div>
            <span
              className="hidden md:inline-flex items-center gap-1.5 ml-3 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border"
              style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              lab · {utc || "—"}
            </span>
          </div>

          <nav
            className="hidden lg:flex items-center gap-6 text-[13px]"
            style={{ color: "var(--text-secondary)" }}
          >
            {[
              ["problem", "Problem"],
              ["pipeline", "Pipeline"],
              ["views", "Lab views"],
              ["scores", "Scores"],
              ["faq", "FAQ"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToId(id)}
                className="hover:text-[var(--text)] transition-colors bg-transparent border-0 cursor-pointer p-0"
                style={{ color: "inherit", font: "inherit" }}
              >
                {label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={onEnter}
            className="inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-[13px] font-semibold cursor-pointer transition-all active:scale-[0.98]"
            style={{
              background: "var(--accent)",
              color: "var(--primary-content)",
              border: "1px solid transparent",
            }}
          >
            Enter lab
            <ArrowRight size={15} />
          </button>
        </div>
      </header>

      <main className="relative z-10">
        {/* ── Hero ── */}
        <section className="max-w-6xl mx-auto px-5 md:px-8 pt-14 md:pt-20 pb-16 md:pb-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="animate-fade-in-up" style={{ animationDelay: "0s" }}>
            <div
              className="inline-flex items-center gap-2 mb-5 font-mono text-[11px] uppercase tracking-[0.18em] font-medium"
              style={{ color: "var(--accent)" }}
            >
              <Radio size={12} />
              Graph-first social intelligence
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-semibold tracking-tight leading-[1.08]">
              Find the original post.
              <br />
              <span style={{ color: "var(--text-secondary)" }}>
                Prove the cascade.
              </span>
            </h1>

            <p
              className="mt-5 text-base md:text-[17px] leading-relaxed max-w-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              Knowledge Signal Engine ranks ≤10 high-signal originals for a topic —
              noise filter → relationship graph →{" "}
              <code
                className="font-mono text-[13px] px-1.5 py-0.5 rounded"
                style={{
                  background: "var(--accent-dim)",
                  color: "var(--accent)",
                }}
              >
                source_fitness
              </code>{" "}
              → multi-signal scores → verify &amp; export.
            </p>

            <p
              className="mt-3 text-sm max-w-lg leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Algorithm + UX prototype. Candidates are Gemini-simulated or local
              fallback — not live X API yet. No login required.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onEnter}
                className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold cursor-pointer transition-all active:scale-[0.98]"
                style={{
                  background: "var(--accent)",
                  color: "var(--primary-content)",
                }}
              >
                Enter provenance lab
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => scrollToId("pipeline")}
                className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-medium cursor-pointer border transition-colors"
                style={{
                  background: "transparent",
                  color: "var(--text)",
                  borderColor: "var(--border-strong)",
                }}
              >
                How the pipeline works
              </button>
            </div>

            <div
              className="mt-10 grid grid-cols-3 gap-4 max-w-md border-t pt-6"
              style={{ borderColor: "var(--border)" }}
            >
              {[
                { k: "≤10", v: "ranked originals" },
                { k: "8", v: "lab views" },
                { k: "5", v: "edge types" },
              ].map((s) => (
                <div key={s.v}>
                  <div
                    className="text-2xl font-semibold tracking-tight font-mono"
                    style={{ color: "var(--accent)" }}
                  >
                    {s.k}
                  </div>
                  <div
                    className="text-[11px] mt-0.5 leading-snug"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex justify-center lg:justify-end animate-fade-in-up"
            style={{ animationDelay: "0.15s" }}
          >
            <CascadeHeroVisual onEnter={onEnter} />
          </div>
        </section>

        {/* ── Pipeline ticker ── */}
        <section
          className="border-y overflow-hidden py-4 relative"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-elevated)",
          }}
          aria-label="Pipeline stages"
        >
          <div className="flex w-max gap-12 animate-logo-ticker">
            {[0, 1].map((loop) => (
              <div key={loop} className="flex gap-12 shrink-0 items-center">
                {PIPELINE.map((label) => (
                  <span
                    key={`${loop}-${label}`}
                    className="font-mono text-xs md:text-sm tracking-[0.2em] whitespace-nowrap"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {label}
                    <span className="mx-3" style={{ color: "var(--accent)" }}>
                      →
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── Problem ── */}
        <section id="problem" className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <p
              className="font-mono text-[11px] uppercase tracking-[0.18em] mb-3"
              style={{ color: "var(--accent)" }}
            >
              The problem
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
              Semantic similarity says posts are alike.
              <span style={{ color: "var(--text-secondary)" }}>
                {" "}
                Provenance asks who caused the rest.
              </span>
            </h2>
            <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Most topic feeds are derivative: rewrites, screenshots, quote-copies,
              engagement bait. KSE treats this as an information-provenance problem —
              graph-first, not embedding-first.
            </p>
          </div>

          <div className="mt-12 grid sm:grid-cols-3 gap-4">
            {[
              {
                n: "1000",
                label: "posts on a topic",
                sub: "raw candidate pool",
                icon: Filter,
              },
              {
                n: "~20",
                label: "true originals",
                sub: "after derivative collapse",
                icon: Network,
              },
              {
                n: "≤10",
                label: "ranked seeds",
                sub: "what the lab surfaces",
                icon: Target,
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-xl border p-6"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <Icon size={18} style={{ color: "var(--accent)" }} className="mb-4" />
                  <div className="text-3xl font-semibold font-mono tracking-tight">
                    {card.n}
                  </div>
                  <div className="mt-1 text-sm font-medium">{card.label}</div>
                  <div
                    className="mt-1 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {card.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Pipeline ── */}
        <section
          id="pipeline"
          className="border-y py-20 md:py-28"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-elevated)",
          }}
        >
          <div className="max-w-6xl mx-auto px-5 md:px-8">
            <p
              className="font-mono text-[11px] uppercase tracking-[0.18em] mb-3"
              style={{ color: "var(--accent)" }}
            >
              Pipeline
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-xl">
              Five stages. One topic run.
            </h2>
            <p
              className="mt-3 max-w-xl text-base leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Express owns the math; the multi-view shell makes every decision
              inspectable. Re-weight scores without re-running the LLM.
            </p>

            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STAGES.map((s) => (
                <article
                  key={s.step}
                  className="rounded-xl border p-5 flex flex-col gap-3"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <span
                    className="font-mono text-[11px] tracking-widest font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
                    {s.step}
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {s.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Lab views ── */}
        <section id="views" className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <p
                className="font-mono text-[11px] uppercase tracking-[0.18em] mb-3"
                style={{ color: "var(--accent)" }}
              >
                Lab surface
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Eight views. Same run.
              </h2>
              <p
                className="mt-3 max-w-lg text-base leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Matches the portal nav: Command · Sources · Cascade · Noise ·
                Verify · Weights · Studio · Watchlist. Studio turns one ranked
                original into multi-platform drafts (no auto-publish). Light /
                Dark / System themes.
              </p>
            </div>
            <button
              type="button"
              onClick={onEnter}
              className="self-start md:self-auto inline-flex items-center gap-2 text-sm font-medium cursor-pointer bg-transparent border-0 p-0"
              style={{ color: "var(--accent)" }}
            >
              Open portal
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={onEnter}
                  className="text-left rounded-xl border p-5 flex gap-4 cursor-pointer transition-colors hover:border-[var(--accent-border)]"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: "var(--accent-dim)",
                      color: "var(--accent)",
                      border: "1px solid var(--accent-border)",
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[15px]">{v.id}</span>
                      <span
                        className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          color: "var(--text-muted)",
                          background: "var(--surface-2)",
                        }}
                      >
                        {v.group}
                      </span>
                    </div>
                    <p
                      className="mt-1 text-sm leading-snug"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {v.hint}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Scores ── */}
        <section
          id="scores"
          className="border-y py-20 md:py-28"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-elevated)",
          }}
        >
          <div className="max-w-6xl mx-auto px-5 md:px-8 grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p
                className="font-mono text-[11px] uppercase tracking-[0.18em] mb-3"
                style={{ color: "var(--accent)" }}
              >
                Scoring
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Explainable rank, not a black box.
              </h2>
              <p
                className="mt-4 text-base leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Provenance fitness selects the seed of each cascade. Presentation
                score orders what you see. Tune weights in the lab and recalculate
                without another LLM call.
              </p>

              <div
                className="mt-8 rounded-xl border p-5 font-mono text-[12px] leading-relaxed overflow-x-auto"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                <div style={{ color: "var(--text-muted)" }}>// source_fitness</div>
                <div className="mt-2">
                  F<sub>s</sub> = w<sub>time</sub>·T<sub>p</sub> + w<sub>auth</sub>·A
                  <sub>s</sub> + w<sub>infl</sub>·D<sub>i</sub> − w<sub>deriv</sub>·D
                  <sub>s</sub>
                </div>
                <div className="mt-4" style={{ color: "var(--text-muted)" }}>
                  // presentation
                </div>
                <div className="mt-2">
                  P<sub>s</sub> = α·orig + β·auth + γ·infl + δ·evid + ε·fresh
                </div>
                <div className="mt-4" style={{ color: "var(--accent)" }}>
                  defaults · time 0.45 · auth 0.25 · infl 0.20 · deriv 0.35
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {SCORE_DIMS.map((d, i) => (
                <div
                  key={d.key}
                  className="rounded-xl border px-5 py-4 flex items-center gap-4"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <span
                    className="font-mono text-sm font-semibold w-6"
                    style={{ color: "var(--accent)" }}
                  >
                    {d.w}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium capitalize">{d.key}</div>
                    <div
                      className="mt-2 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--surface-2)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${[88, 72, 80, 65, 45][i]}%`,
                          background:
                            i < 2
                              ? "var(--accent)"
                              : i < 4
                                ? "var(--cyan)"
                                : "var(--violet)",
                        }}
                      />
                    </div>
                  </div>
                  <SearchCheck
                    size={16}
                    style={{ color: "var(--text-muted)" }}
                    className="shrink-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Honesty ── */}
        <section className="max-w-6xl mx-auto px-5 md:px-8 py-16">
          <div
            className="rounded-2xl border p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center md:justify-between"
            style={{
              background: "var(--surface)",
              borderColor: "var(--accent-border)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <div className="max-w-2xl">
              <p
                className="font-mono text-[11px] uppercase tracking-[0.18em] mb-2"
                style={{ color: "var(--accent)" }}
              >
                Prototype honesty
              </p>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                Real pipeline math. Simulated candidates.
              </h2>
              <p
                className="mt-2 text-sm md:text-base leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                This repo is a full-stack lab (Express + React) for provenance
                algorithms and multi-view UX. Live X collection is the next
                production gate — shipping language does not claim live provenance
                until Collector uses official data access.
              </p>
            </div>
            <button
              type="button"
              onClick={onEnter}
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold cursor-pointer"
              style={{
                background: "var(--accent)",
                color: "var(--primary-content)",
              }}
            >
              Run a topic
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="max-w-3xl mx-auto px-5 md:px-8 py-16 md:pb-24">
          <p
            className="font-mono text-[11px] uppercase tracking-[0.18em] mb-3 text-center"
            style={{ color: "var(--accent)" }}
          >
            FAQ
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-center mb-10">
            Methodology
          </h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={item.q}
                  className="rounded-xl border overflow-hidden"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer bg-transparent border-0"
                    style={{ color: "var(--text)" }}
                    aria-expanded={open}
                  >
                    <span className="text-sm md:text-[15px] font-medium">
                      {item.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className="shrink-0 transition-transform"
                      style={{
                        color: "var(--text-muted)",
                        transform: open ? "rotate(180deg)" : undefined,
                      }}
                    />
                  </button>
                  {open && (
                    <div
                      className="px-5 pb-5 text-sm leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer
          className="border-t"
          style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
        >
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 flex flex-col md:flex-row gap-8 md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded flex items-center justify-center font-mono font-bold text-xs"
                style={{
                  background: "linear-gradient(145deg, var(--accent-dim), transparent)",
                  color: "var(--accent)",
                  border: "1px solid var(--accent-border)",
                }}
              >
                KSE
              </div>
              <div>
                <div className="text-sm font-semibold">Knowledge Signal Engine</div>
                <div
                  className="text-[11px] font-mono uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  X-KES · provenance lab prototype
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
              <button
                type="button"
                onClick={() => scrollToId("pipeline")}
                className="bg-transparent border-0 cursor-pointer p-0 hover:text-[var(--text)]"
                style={{ color: "inherit", font: "inherit" }}
              >
                Pipeline
              </button>
              <button
                type="button"
                onClick={() => scrollToId("views")}
                className="bg-transparent border-0 cursor-pointer p-0 hover:text-[var(--text)]"
                style={{ color: "inherit", font: "inherit" }}
              >
                Views
              </button>
              <button
                type="button"
                onClick={() => scrollToId("faq")}
                className="bg-transparent border-0 cursor-pointer p-0 hover:text-[var(--text)]"
                style={{ color: "inherit", font: "inherit" }}
              >
                FAQ
              </button>
              <button
                type="button"
                onClick={onEnter}
                className="bg-transparent border-0 cursor-pointer p-0 font-medium"
                style={{ color: "var(--accent)", font: "inherit" }}
              >
                Enter lab →
              </button>
            </div>
          </div>
          <div
            className="border-t py-4 px-5 md:px-8"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-2 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <span>
                © {new Date().getFullYear()} Knowledge Signal Engine · Apache-2.0
                prototype
              </span>
              <span className="font-mono uppercase tracking-wider">
                Not live X API · simulated / fallback candidates
              </span>
            </div>
          </div>
        </footer>
      </main>

      {/* Sticky CTA after scroll */}
      <StickyEnter onEnter={onEnter} />
    </div>
  );
}

function StickyEnter({ onEnter }: { onEnter: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <button
        type="button"
        onClick={onEnter}
        className="inline-flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm font-semibold cursor-pointer shadow-lg backdrop-blur-md"
        style={{
          background: "rgba(15, 20, 28, 0.92)",
          borderColor: "var(--accent-border)",
          color: "var(--text)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        }}
      >
        <span
          className="font-mono text-[11px] tracking-wider"
          style={{ color: "var(--accent)" }}
        >
          KSE
        </span>
        Enter lab
        <ArrowRight size={14} style={{ color: "var(--accent)" }} />
      </button>
    </div>
  );
}
