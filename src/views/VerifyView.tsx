import React from "react";
import { Shield, ExternalLink } from "lucide-react";
import type { KseAnalysisApi } from "../hooks/useKseAnalysis";

export default function VerifyView({ api }: { api: KseAnalysisApi }) {
  const res = api.overriddenResult;
  const ground = res?.verification_grounding;

  if (!res) {
    return (
      <div className="kse-page">
        <div className="kse-empty kse-surface">
          <Shield size={28} style={{ color: "var(--text-muted)" }} />
          <p className="text-sm m-0">Run an analysis to load verification grounding.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kse-page kse-fade-in max-w-3xl">
      <div className="kse-page-header">
        <div>
          <h1 className="kse-page-title">Verification</h1>
          <p className="kse-page-sub">
            Cross-check topic claims via Search grounding (or offline fallback).
          </p>
        </div>
        {res.is_fallback && (
          <span className="kse-badge kse-badge-warn">Offline path</span>
        )}
      </div>

      <section className="kse-surface p-5 mb-4">
        <div className="kse-label mb-2">Verdict</div>
        <p
          className="text-[14px] leading-relaxed m-0 whitespace-pre-wrap"
          style={{ color: "var(--text-secondary)" }}
        >
          {ground?.verdict_summary || "No verdict available."}
        </p>
      </section>

      <section className="kse-surface p-5">
        <div className="kse-label mb-3">Citations</div>
        {!ground?.sources?.length ? (
          <p className="text-sm m-0" style={{ color: "var(--text-muted)" }}>
            No citation URLs returned for this run.
          </p>
        ) : (
          <ul className="m-0 p-0 list-none space-y-2">
            {ground.sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-3 rounded-md transition-colors"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={14} style={{ color: "var(--info)" }} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate">
                      {s.title}
                    </div>
                    <div
                      className="text-[11px] font-mono truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {s.uri}
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
