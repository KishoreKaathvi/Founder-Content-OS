import React from "react";
import { ShieldAlert } from "lucide-react";
import type { KseAnalysisApi } from "../hooks/useKseAnalysis";

export default function NoiseView({ api }: { api: KseAnalysisApi }) {
  const noise = api.overriddenResult?.noise_candidates || [];

  if (!api.overriddenResult) {
    return (
      <div className="kse-page">
        <div className="kse-empty kse-surface">
          <ShieldAlert size={28} style={{ color: "var(--text-muted)" }} />
          <p className="text-sm m-0">Run an analysis to review the noise filter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kse-page kse-fade-in">
      <div className="kse-page-header">
        <div>
          <h1 className="kse-page-title">Noise filter</h1>
          <p className="kse-page-sub">
            Stage ② quarantined posts — spam signatures and engagement-bait density.
          </p>
        </div>
        <span className="kse-badge kse-badge-danger">{noise.length} filtered</span>
      </div>

      {noise.length === 0 ? (
        <div className="kse-empty kse-surface">
          <p className="text-sm m-0">No noise candidates in this run.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {noise.map((n) => (
            <article key={n.id} className="kse-surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[12px] font-mono"
                  style={{ color: "var(--text-muted)" }}
                >
                  {n.author_handle}
                </span>
                <span className="kse-badge kse-badge-danger">Quarantined</span>
              </div>
              <p
                className="text-[13px] m-0 leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {n.text}
              </p>
              <p
                className="text-[12px] m-0 mt-3 font-mono"
                style={{ color: "var(--danger)" }}
              >
                {n.reason}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
