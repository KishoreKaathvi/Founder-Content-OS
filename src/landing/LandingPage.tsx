/**
 * Advanced editorial / kinetic landing.
 * Type is the interface. No SaaS card grid. No auth.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useInView,
} from "motion/react";

const WORDS = ["THE", "POST", "THAT", "CAME", "FIRST."];

const STRIP = [
  "SOURCE_FITNESS",
  "NOT_LIKES",
  "GRAPH>CLUSTER",
  "VECTOR_OPEN",
  "S3_ZERO_BAIT",
  "HONEST_PARTIAL",
  "≤10_ORIGINALS",
];

function usePointer(ref: React.RefObject<HTMLElement | null>) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const sx = useSpring(x, { stiffness: 50, damping: 25, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 50, damping: 25, mass: 0.4 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x.set((e.clientX - r.left) / r.width);
      y.set((e.clientY - r.top) / r.height);
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, [ref, x, y]);

  return { sx, sy };
}

function InView({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  key?: React.Key;
}) {
  const r = useRef(null);
  const on = useInView(r, { once: true, amount: 0.25 });
  return (
    <motion.div
      ref={r}
      className={className}
      initial={{ opacity: 0, y: 48 }}
      animate={on ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1, delay, ease: [0.14, 1, 0.34, 1] }}
    >
      {children}
    </motion.div>
  );
}

function KineticWord({
  word,
  delay,
  className = "",
}: {
  word: string;
  delay: number;
  className?: string;
  key?: React.Key;
}) {
  const letters = useMemo(() => word.split(""), [word]);
  return (
    <span className={`xl2-word ${className}`}>
      {letters.map((ch, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="xl2-char"
          initial={{ y: "120%", rotateX: -80, opacity: 0 }}
          animate={{ y: "0%", rotateX: 0, opacity: 1 }}
          transition={{
            duration: 0.85,
            delay: delay + i * 0.028,
            ease: [0.14, 1, 0.34, 1],
          }}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
      <span className="xl2-word-space"> </span>
    </span>
  );
}

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const { sx, sy } = usePointer(root);
  const { scrollYProgress } = useScroll();

  const spotX = useTransform(sx, [0, 1], ["0%", "100%"]);
  const spotY = useTransform(sy, [0, 1], ["0%", "100%"]);
  const spotlight = useMotionTemplate`radial-gradient(680px circle at ${spotX} ${spotY}, rgba(212,255,0,0.12), transparent 55%)`;

  const skew = useTransform(scrollYProgress, [0, 0.2], [0, -3]);
  const scaleHero = useTransform(scrollYProgress, [0, 0.3], [1, 0.94]);
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const [utc, setUtc] = useState("");
  useEffect(() => {
    const t = () =>
      setUtc(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "UTC",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date())
      );
    t();
    const id = setInterval(t, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="xl2" ref={root}>
      <motion.div className="xl2-spot" style={{ background: spotlight }} aria-hidden />
      <div className="xl2-mesh" aria-hidden />
      <div className="xl2-noise" aria-hidden />
      <motion.div className="xl2-readout" style={{ width: bar }} aria-hidden />

      {/* Vertical rail */}
      <aside className="xl2-vrail" aria-hidden>
        <span>KSE · ENTERPRISE LAB · NO AUTH · PROVENANCE OVER POPULARITY</span>
      </aside>

      {/* Top bar — brutal thin */}
      <header className="xl2-top">
        <div className="xl2-top-a">
          <span className="xl2-logo">kse</span>
          <span className="xl2-dot" />
          <span className="xl2-top-meta">vol.null · edition/ops</span>
        </div>
        <div className="xl2-top-b">{utc}Z</div>
        <button type="button" className="xl2-top-enter" onClick={onEnter}>
          <span>enter</span>
          <span className="xl2-top-enter-box" />
        </button>
      </header>

      {/* HERO — full viewport kinetic type */}
      <section className="xl2-hero">
        <motion.div style={{ skewY: skew, scale: scaleHero }} className="xl2-hero-inner">
          <p className="xl2-eyebrow">
            <span className="xl2-blink" />
            graph-first social intelligence
          </p>

          <h1 className="xl2-h1" aria-label="The post that came first.">
            {WORDS.map((w, wi) => (
              <KineticWord
                key={w}
                word={w}
                delay={0.15 + wi * 0.12}
                className={wi === WORDS.length - 1 ? "xl2-word-end" : ""}
              />
            ))}
          </h1>

          <div className="xl2-hero-foot">
            <p className="xl2-lede">
              Not the rewrite with better copy.
              <br />
              Not the screenshot that out-liked the original.
              <br />
              <em>The node the cascade actually descends from.</em>
            </p>

            <button type="button" className="xl2-mega-btn" onClick={onEnter}>
              <span className="xl2-mega-btn-bg" />
              <span className="xl2-mega-btn-txt">
                enter
                <br />
                portal
              </span>
              <span className="xl2-mega-btn-sub">no sign-in · one transition</span>
            </button>
          </div>
        </motion.div>

        {/* Abstract geometry composition */}
        <div className="xl2-geo" aria-hidden>
          <svg viewBox="0 0 400 520" className="xl2-svg">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d4ff00" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#d4ff00" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.circle
              cx="200"
              cy="200"
              r="140"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
              animate={{ rotate: 360 }}
              transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "200px 200px" }}
            />
            <motion.circle
              cx="200"
              cy="200"
              r="96"
              fill="none"
              stroke="url(#g1)"
              strokeWidth="1.5"
              strokeDasharray="12 18"
              animate={{ rotate: -360 }}
              transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "200px 200px" }}
            />
            <polygon
              points="200,80 320,280 80,280"
              fill="none"
              stroke="rgba(212,255,0,0.35)"
              strokeWidth="1"
            />
            <line
              x1="40"
              y1="400"
              x2="360"
              y2="400"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
            />
            <text x="40" y="430" fill="rgba(255,255,255,0.35)" fontSize="11" fontFamily="var(--font-mono)">
              source_fitness =
            </text>
            <text x="40" y="452" fill="#d4ff00" fontSize="14" fontFamily="var(--font-mono)">
              w·t − w·deriv + …
            </text>
            <rect
              x="260"
              y="360"
              width="100"
              height="100"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
            />
            <text x="272" y="420" fill="#fff" fontSize="28" fontFamily="Syne, sans-serif" fontWeight="800">
              ≤10
            </text>
          </svg>
        </div>
      </section>

      {/* Diagonal ticker */}
      <div className="xl2-ticker" aria-hidden>
        <div className="xl2-ticker-inner">
          {[...STRIP, ...STRIP, ...STRIP].map((t, i) => (
            <span key={`${t}-${i}`}>{t}</span>
          ))}
        </div>
      </div>

      {/* Inverted paper band */}
      <section className="xl2-paper">
        <InView>
          <div className="xl2-paper-grid">
            <div className="xl2-paper-l">
              <span className="xl2-tag">// system</span>
              <h2 className="xl2-paper-h">
                popularity
                <br />
                is a
                <br />
                <span>failure mode</span>
              </h2>
            </div>
            <div className="xl2-paper-r">
              <ol className="xl2-list">
                <li>
                  <b>01</b>
                  <div>
                    <strong>Graph first</strong>
                    <p>Quote · reply · URL · pHash · similarity as edges — not a flat cluster blob.</p>
                  </div>
                </li>
                <li>
                  <b>02</b>
                  <div>
                    <strong>Origin per component</strong>
                    <p>source_fitness maximizes time + authority + influence − derivative score.</p>
                  </div>
                </li>
                <li>
                  <b>03</b>
                  <div>
                    <strong>Open vector</strong>
                    <p>Originality / authority / influence / evidence / freshness stay un-collapsed.</p>
                  </div>
                </li>
                <li>
                  <b>04</b>
                  <div>
                    <strong>Summarize last</strong>
                    <p>LLM explains survivors. It does not find them.</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </InView>
      </section>

      {/* Massive type statement */}
      <section className="xl2-blast">
        <InView>
          <p className="xl2-blast-k">operating principle</p>
          <h2 className="xl2-blast-h">
            <span>find</span>
            <span className="xl2-blast-em">cause</span>
            <span>not</span>
            <span>chorus</span>
          </h2>
        </InView>
      </section>

      {/* Horizontal pipeline as industrial labels */}
      <section className="xl2-pipe">
        <InView>
          <div className="xl2-pipe-head">
            <span>pipeline</span>
            <span>summarization is stage 06 — never 01</span>
          </div>
        </InView>
        <div className="xl2-pipe-row">
          {["COLLECT", "FILTER", "GRAPH", "ORIGIN", "RANK", "REPORT"].map((s, i) => (
            <InView key={s} delay={i * 0.05}>
              <div className="xl2-pipe-cell">
                <i>{String(i + 1).padStart(2, "0")}</i>
                <b>{s}</b>
              </div>
            </InView>
          ))}
        </div>
      </section>

      {/* Spec sheet */}
      <section className="xl2-spec">
        <InView className="xl2-spec-grid">
          <div className="xl2-spec-item">
            <span className="xl2-tag xl2-tag-light">// workstation</span>
            <h2 className="xl2-spec-h">
              Seven views.
              <br />
              Zero gate.
            </h2>
            <p>
              Command · Sources · Cascade · Noise · Verify · Weights · Watchlist.
              Collapsible ops rail. Instant recalculate. Export that leaves the
              building.
            </p>
            <button type="button" className="xl2-mega-btn xl2-mega-btn-inv" onClick={onEnter}>
              <span className="xl2-mega-btn-bg" />
              <span className="xl2-mega-btn-txt">
                enter
                <br />
                portal
              </span>
              <span className="xl2-mega-btn-sub">no credentials required</span>
            </button>
          </div>
          <div className="xl2-spec-sheet">
            <div className="xl2-spec-row">
              <span>AUTH</span>
              <span>NONE</span>
            </div>
            <div className="xl2-spec-row">
              <span>DATA</span>
              <span>SIM / FALLBACK LAB</span>
            </div>
            <div className="xl2-spec-row">
              <span>RANK</span>
              <span>VECTOR NOT SCALAR</span>
            </div>
            <div className="xl2-spec-row">
              <span>OUT</span>
              <span>≤10 ORIGINALS + WHY</span>
            </div>
            <div className="xl2-spec-row xl2-spec-row-hi">
              <span>ENTRY</span>
              <span>ONE CONTROL</span>
            </div>
          </div>
        </InView>
      </section>

      {/* End frame */}
      <section className="xl2-end">
        <InView>
          <button type="button" className="xl2-end-btn" onClick={onEnter}>
            <span className="xl2-end-huge">ENTER</span>
            <span className="xl2-end-sub">portal → ops shell · no auth</span>
          </button>
        </InView>
      </section>

      <footer className="xl2-foot">
        <span>knowledge signal engine</span>
        <span className="xl2-foot-mid">// lab build</span>
        <button type="button" onClick={onEnter}>
          enter ↗
        </button>
      </footer>
    </div>
  );
}
