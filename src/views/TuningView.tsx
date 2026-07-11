import React, { useEffect, useState } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import type { KseAnalysisApi } from "../hooks/useKseAnalysis";
import type { PresentationWeights, ProvenanceWeights } from "../types";

function SliderRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1">
        <div>
          <span className="text-[13px] font-medium">{label}</span>
          <span
            className="ml-2 text-[11px]"
            style={{ color: "var(--text-muted)" }}
          >
            {hint}
          </span>
        </div>
        <span className="text-[12px] font-mono tabular-nums">
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--accent)]"
        aria-label={label}
      />
    </div>
  );
}

export default function TuningView({ api }: { api: KseAnalysisApi }) {
  const [p, setP] = useState<ProvenanceWeights>(api.provenanceWeights);
  const [pres, setPres] = useState<PresentationWeights>(api.presentationWeights);

  useEffect(() => setP(api.provenanceWeights), [api.provenanceWeights]);
  useEffect(() => setPres(api.presentationWeights), [api.presentationWeights]);

  const apply = () => api.handleRecalculate(p, pres);

  const bounds = api.fullTimeBounds;
  const range = api.dateRange;

  return (
    <div className="kse-page kse-fade-in max-w-3xl">
      <div className="kse-page-header">
        <div>
          <h1 className="kse-page-title">Tuning</h1>
          <p className="kse-page-sub">
            Provenance & presentation weights · instant recalculate (no LLM cost).
          </p>
        </div>
        <button type="button" className="kse-btn kse-btn-primary" onClick={apply}>
          <SlidersHorizontal size={14} />
          Apply weights
        </button>
      </div>

      {bounds && range && (
        <section className="kse-surface p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="kse-label">Cascade time window</div>
            <button
              type="button"
              className="kse-btn"
              style={{ height: 28, fontSize: 11 }}
              onClick={() => api.setDateRange(bounds)}
            >
              <RotateCcw size={12} /> Reset horizon
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div
                className="text-[11px] font-mono mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Start · {new Date(range[0]).toUTCString()}
              </div>
              <input
                type="range"
                min={bounds[0]}
                max={bounds[1]}
                value={range[0]}
                onChange={(e) =>
                  api.setDateRange([
                    Math.min(parseInt(e.target.value), range[1]),
                    range[1],
                  ])
                }
                className="w-full accent-[var(--accent)]"
              />
            </div>
            <div>
              <div
                className="text-[11px] font-mono mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                End · {new Date(range[1]).toUTCString()}
              </div>
              <input
                type="range"
                min={bounds[0]}
                max={bounds[1]}
                value={range[1]}
                onChange={(e) =>
                  api.setDateRange([
                    range[0],
                    Math.max(parseInt(e.target.value), range[0]),
                  ])
                }
                className="w-full accent-[var(--accent)]"
              />
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="kse-surface p-5">
          <div className="kse-label mb-4">Provenance (source fitness)</div>
          <SliderRow
            label="w_time"
            hint="Earliest priority"
            value={p.w_time}
            onChange={(v) => setP({ ...p, w_time: v })}
          />
          <SliderRow
            label="w_auth"
            hint="Author authority"
            value={p.w_auth}
            onChange={(v) => setP({ ...p, w_auth: v })}
          />
          <SliderRow
            label="w_infl"
            hint="Downstream influence"
            value={p.w_infl}
            onChange={(v) => setP({ ...p, w_infl: v })}
          />
          <SliderRow
            label="w_deriv"
            hint="Derivative penalty"
            value={p.w_deriv}
            onChange={(v) => setP({ ...p, w_deriv: v })}
          />
        </section>

        <section className="kse-surface p-5">
          <div className="kse-label mb-4">Presentation (top-10 order)</div>
          <SliderRow
            label="α originality"
            hint=""
            value={pres.alpha}
            onChange={(v) => setPres({ ...pres, alpha: v })}
          />
          <SliderRow
            label="β authority"
            hint=""
            value={pres.beta}
            onChange={(v) => setPres({ ...pres, beta: v })}
          />
          <SliderRow
            label="γ influence"
            hint=""
            value={pres.gamma}
            onChange={(v) => setPres({ ...pres, gamma: v })}
          />
          <SliderRow
            label="δ evidence"
            hint=""
            value={pres.delta}
            onChange={(v) => setPres({ ...pres, delta: v })}
          />
          <SliderRow
            label="ε freshness"
            hint=""
            value={pres.epsilon}
            onChange={(v) => setPres({ ...pres, epsilon: v })}
          />
        </section>
      </div>
    </div>
  );
}
